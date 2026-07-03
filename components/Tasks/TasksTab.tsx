import React, { useState, useEffect } from 'react';
import { useApp } from '../../store/AppContext';
import { Task, Note, TasksDataPayload } from '../../types';
import { getTranslation } from '../../utils/translations';
import { Plus, Trash2, CheckCircle, Circle, Clock, Bell, Book, CheckSquare, Edit, Eye, X, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/toast';
import { generateId } from '../../utils/helpers';
import { cn } from '../../lib/utils';
import ConfirmModal from '../Modals/ConfirmModal';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).process && (window as any).process.type === 'renderer';
const ipcRenderer = isElectron ? (window as any).require('electron').ipcRenderer : null;

// Helper to format ISO date to local input datetime-local value (YYYY-MM-DDTHH:MM)
const formatISODateToLocalInput = (isoString: string | null): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  } catch (e) {
    return '';
  }
};

export const TasksTab: React.FC = () => {
  const { state } = useApp();
  const { showToast } = useToast();
  const t = (key: string) => getTranslation(key, state.language);
  const isKurdish = state.language === 'ku' || state.language === 'ar';
  
  // Font matches the user's selected font from settings
  const defaultFont = state.settings.defaultFontFamily || "'Noto Kufi Arabic', 'Inter', sans-serif";
  const forcedFont = "'Noto Kufi Arabic', 'Inter', sans-serif";
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  
  // Viewing state modal
  const [viewingItem, setViewingItem] = useState<{ type: 'task' | 'note'; data: Task | Note } | null>(null);
  
  // Custom font size setting for task/note contents (persisted locally)
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('tasksFontSize');
    return saved ? parseInt(saved, 10) : 14;
  });

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    localStorage.setItem('tasksFontSize', newSize.toString());
  };

  // Deletion confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; type: 'task' | 'note' } | null>(null);
  
  // Modal Edit states
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [modalEditTitle, setModalEditTitle] = useState('');
  const [modalEditNotesOrContent, setModalEditNotesOrContent] = useState('');
  const [modalEditReminder, setModalEditReminder] = useState('');
  const [modalEditColor, setModalEditColor] = useState('slate');

  // Trigger viewing modal
  const openViewingModal = (type: 'task' | 'note', item: Task | Note) => {
    setViewingItem({ type, data: item });
    setIsEditingInModal(false);
    setModalEditTitle(item.title || '');
    if (type === 'task') {
      const task = item as Task;
      setModalEditNotesOrContent(task.notes || '');
      setModalEditReminder(formatISODateToLocalInput(task.reminderTime));
    } else {
      const note = item as Note;
      setModalEditNotesOrContent(note.content || '');
      setModalEditColor(note.color || 'slate');
    }
  };

  const handleModalSave = async () => {
    if (!viewingItem) return;
    const { type, data } = viewingItem;

    if (type === 'task') {
      if (!modalEditTitle.trim()) return;
      const updatedTasks = tasks.map(t => t.id === data.id ? {
        ...t,
        title: modalEditTitle.trim(),
        notes: modalEditNotesOrContent.trim(),
        reminderTime: modalEditReminder ? new Date(modalEditReminder).toISOString() : null,
        notified: t.reminderTime === (modalEditReminder ? new Date(modalEditReminder).toISOString() : null) ? t.notified : false
      } : t);
      await saveData(updatedTasks, notes);
      const updatedTask = updatedTasks.find(t => t.id === data.id);
      if (updatedTask) {
        setViewingItem({ type: 'task', data: updatedTask });
      }
    } else {
      if (!modalEditTitle.trim() && !modalEditNotesOrContent.trim()) return;
      const updatedNotes = notes.map(n => n.id === data.id ? {
        ...n,
        title: modalEditTitle.trim(),
        content: modalEditNotesOrContent.trim(),
        color: modalEditColor
      } : n);
      await saveData(tasks, updatedNotes);
      const updatedNote = updatedNotes.find(n => n.id === data.id);
      if (updatedNote) {
        setViewingItem({ type: 'note', data: updatedNote });
      }
    }

    setIsEditingInModal(false);
    showToast(t('toast.saved'), 'success');
  };
  
  // New/Edit task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskReminder, setTaskReminder] = useState('');
  
  // New/Edit note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('slate');
  
  // Clean Accent Border Colors for Notes
  const noteColors = [
    { id: 'slate', borderClass: 'border-t-muted-foreground/30', colorHex: 'bg-slate-500' },
    { id: 'blue', borderClass: 'border-t-blue-500', colorHex: 'bg-blue-500' },
    { id: 'green', borderClass: 'border-t-emerald-500', colorHex: 'bg-emerald-500' },
    { id: 'red', borderClass: 'border-t-red-500', colorHex: 'bg-red-500' },
    { id: 'purple', borderClass: 'border-t-purple-500', colorHex: 'bg-purple-500' },
    { id: 'amber', borderClass: 'border-t-amber-500', colorHex: 'bg-amber-500' },
  ];

  // Load tasks on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        let loadedTasks: Task[] = [];
        let loadedNotes: Note[] = [];

        if (isElectron && ipcRenderer) {
          const loadedData = await ipcRenderer.invoke('load-tasks');
          if (loadedData) {
            if (Array.isArray(loadedData)) {
              loadedTasks = loadedData;
            } else {
              loadedTasks = loadedData.tasks || [];
              loadedNotes = loadedData.notes || [];
            }
          }
        } else {
          const saved = localStorage.getItem('photoPrinterTasksData');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              loadedTasks = parsed;
            } else {
              loadedTasks = parsed.tasks || [];
              loadedNotes = parsed.notes || [];
            }
          }
        }
        setTasks(loadedTasks);
        setNotes(loadedNotes);
      } catch (err) {
        console.error('Failed to load tasks and notes data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save data when they change
  const saveData = async (newTasks: Task[], newNotes: Note[]) => {
    setTasks(newTasks);
    setNotes(newNotes);
    const payload: TasksDataPayload = { tasks: newTasks, notes: newNotes };
    
    try {
      if (isElectron && ipcRenderer) {
        await ipcRenderer.invoke('save-tasks', payload);
      } else {
        localStorage.setItem('photoPrinterTasksData', JSON.stringify(payload));
      }
    } catch (err) {
      console.error('Failed to save tasks and notes data:', err);
      showToast('Error saving data', 'error');
    }
  };

  // Notification checker interval
  useEffect(() => {
    if ('Notification' in window && window.Notification.permission !== 'granted' && window.Notification.permission !== 'denied') {
      window.Notification.requestPermission();
    }

    const checkReminders = () => {
      const now = new Date();
      let updated = false;
      const updatedTasks = tasks.map(task => {
        if (!task.isCompleted && !task.notified && task.reminderTime) {
          const reminderDate = new Date(task.reminderTime);
          if (now >= reminderDate && now.getTime() - reminderDate.getTime() < 3600000) {
            if ('Notification' in window && window.Notification.permission === 'granted') {
              new window.Notification(task.title, {
                body: task.notes || 'Task reminder',
                icon: 'favicon.ico',
                silent: false
              });
            }
            updated = true;
            return { ...task, notified: true };
          }
        }
        return task;
      });

      if (updated) {
        saveData(updatedTasks, notes);
      }
    };

    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, [tasks, notes]);

  // Handle Add/Edit Task
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    let newTasks: Task[];

    if (editingTaskId) {
      // Edit mode
      newTasks = tasks.map(t => t.id === editingTaskId ? {
        ...t,
        title: taskTitle.trim(),
        notes: taskNotes.trim(),
        reminderTime: taskReminder ? new Date(taskReminder).toISOString() : null,
        // Reset notification if reminder changed
        notified: t.reminderTime === (taskReminder ? new Date(taskReminder).toISOString() : null) ? t.notified : false
      } : t);
      
      setEditingTaskId(null);
      showToast(t('toast.saved'), 'success');
    } else {
      // Add mode
      const newTask: Task = {
        id: generateId(),
        title: taskTitle.trim(),
        notes: taskNotes.trim(),
        reminderTime: taskReminder ? new Date(taskReminder).toISOString() : null,
        isCompleted: false,
        notified: false,
        createdAt: new Date().toISOString()
      };
      newTasks = [newTask, ...tasks];
      showToast(t('toast.saved'), 'success');
    }

    await saveData(newTasks, notes);
    
    // Clear form
    setTaskTitle('');
    setTaskNotes('');
    setTaskReminder('');
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskNotes(task.notes);
    setTaskReminder(formatISODateToLocalInput(task.reminderTime));
    setViewingItem(null); // Close view modal if open
  };

  const cancelTaskEdit = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskNotes('');
    setTaskReminder('');
  };

  const toggleTaskStatus = async (id: string) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t);
    await saveData(newTasks, notes);
  };

  const deleteTask = async (id: string) => {
    const newTasks = tasks.filter(t => t.id !== id);
    await saveData(newTasks, notes);
    if (viewingItem?.data.id === id) setViewingItem(null);
  };

  // Handle Add/Edit Note
  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    let newNotes: Note[];

    if (editingNoteId) {
      // Edit mode
      newNotes = notes.map(n => n.id === editingNoteId ? {
        ...n,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        color: noteColor
      } : n);
      
      setEditingNoteId(null);
      showToast(t('toast.saved'), 'success');
    } else {
      // Add mode
      const newNote: Note = {
        id: generateId(),
        title: noteTitle.trim(),
        content: noteContent.trim(),
        color: noteColor,
        createdAt: new Date().toISOString()
      };
      newNotes = [newNote, ...notes];
      showToast(t('toast.saved'), 'success');
    }

    await saveData(tasks, newNotes);
    
    // Clear form
    setNoteTitle('');
    setNoteContent('');
    setNoteColor('slate');
  };

  const startEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteColor(note.color || 'slate');
    setViewingItem(null); // Close view modal if open
  };

  const cancelNoteEdit = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteColor('slate');
  };

  const deleteNote = async (id: string) => {
    const newNotes = notes.filter(n => n.id !== id);
    await saveData(tasks, newNotes);
    if (viewingItem?.data.id === id) setViewingItem(null);
  };

  if (loading) return null;

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full" dir={isKurdish ? 'rtl' : 'ltr'}>
      
      {/* 1. Left Side: Editor Sidebar (Like QRCodeEditor) */}
      <div className="w-80 border-r border-border overflow-y-auto bg-background no-print p-4 space-y-6 flex-shrink-0">
        
        {/* Tab Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            {isKurdish ? 'جۆری بینین' : 'View Mode'}
          </label>
          <Tabs className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger 
                type="button"
                onClick={() => {
                  setActiveTab('tasks');
                  cancelTaskEdit();
                  cancelNoteEdit();
                }} 
                active={activeTab === 'tasks'}
                className="h-8 text-xs"
              >
                <CheckSquare className="h-3.5 w-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                <span>{t('tasks.tab')}</span>
              </TabsTrigger>
              <TabsTrigger 
                type="button"
                onClick={() => {
                  setActiveTab('notes');
                  cancelTaskEdit();
                  cancelNoteEdit();
                }} 
                active={activeTab === 'notes'}
                className="h-8 text-xs"
              >
                <Book className="h-3.5 w-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                <span>{t('notes.title')}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Text Size Slider (Only affects this section) */}
        <div className="space-y-2 border-t border-border/50 pt-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
            <span>{isKurdish ? 'قەبارەی دەق' : 'Text Size'}</span>
            <span className="font-mono text-[10px] text-foreground bg-muted border border-border px-1.5 py-0.5 rounded-md shadow-sm">{fontSize}px</span>
          </label>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-semibold">A</span>
            <input 
              type="range" 
              min="12" 
              max="24" 
              value={fontSize} 
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
              className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary border border-border"
            />
            <span className="text-sm font-bold text-foreground">A</span>
          </div>
        </div>

        {/* Input Form Fields */}
        {activeTab === 'tasks' ? (
          <div className="space-y-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase block border-b border-border pb-1">
              {editingTaskId ? (isKurdish ? 'دەستکاری ئەرک' : 'Edit Task') : t('tasks.add')}
            </label>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {t('tasks.taskTitle')}
                </label>
                <Input 
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder={t('tasks.taskTitle')}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {t('tasks.notes')}
                </label>
                <textarea 
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder={t('tasks.notes')}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {t('tasks.reminder')}
                </label>
                <Input 
                  type="datetime-local"
                  value={taskReminder}
                  onChange={(e) => setTaskReminder(e.target.value)}
                  dir="ltr"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1 justify-center">
                  {editingTaskId ? (isKurdish ? 'نوێکردنەوە' : 'Update') : t('tasks.save')}
                </Button>
                {editingTaskId && (
                  <Button type="button" variant="outline" size="sm" onClick={cancelTaskEdit}>
                    {isKurdish ? 'پاشگەزبوونەوە' : 'Cancel'}
                  </Button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase block border-b border-border pb-1">
              {editingNoteId ? (isKurdish ? 'دەستکاری تێبینی' : 'Edit Note') : t('notes.add')}
            </label>
            <form onSubmit={handleNoteSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {t('notes.noteTitle')}
                </label>
                <Input 
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder={t('notes.noteTitle')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {t('notes.content')}
                </label>
                <textarea 
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder={t('notes.content')}
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Category Color
                </label>
                <div className="flex gap-2.5 pt-1 flex-wrap">
                  {noteColors.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNoteColor(c.id)}
                      className={cn(
                        "w-7 h-7 rounded-full border border-border transition-all flex items-center justify-center relative shadow-sm hover:scale-105 active:scale-95",
                        noteColor === c.id ? "ring-2 ring-ring scale-110 shadow-md" : "hover:border-foreground/30"
                      )}
                    >
                      <span className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center text-white", c.colorHex)}>
                        {noteColor === c.id && <Check className="h-2.5 w-2.5" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1 justify-center">
                  {editingNoteId ? (isKurdish ? 'نوێکردنەوە' : 'Update') : t('notes.save')}
                </Button>
                {editingNoteId && (
                  <Button type="button" variant="outline" size="sm" onClick={cancelNoteEdit}>
                    {isKurdish ? 'پاشگەزبوونەوە' : 'Cancel'}
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 2. Right Side: Paper Canvas Layout (Outer card background removed, lets items float directly on grid) */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-0 custom-scrollbar scroll-smooth bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col items-stretch no-print">
        
        {/* Landscape floating wrapper on the graph grid */}
        <div className="w-full flex flex-col animate-fade-in" style={{ fontFamily: defaultFont }}>
          
          {/* Header Title block in a beautiful container with a background */}
          <div className="flex items-center justify-between bg-card/60 backdrop-blur-md border-b border-border p-4 md:px-6 shadow-sm animate-fade-in w-full rounded-none" style={{ fontFamily: forcedFont }}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background border border-border rounded-lg text-foreground shadow-sm">
                {activeTab === 'tasks' ? <CheckSquare className="h-5 w-5" /> : <Book className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {activeTab === 'tasks' ? t('tasks.tab') : t('notes.title')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeTab === 'tasks' 
                    ? (isKurdish ? 'لیستی تەواوی کارەکان و کاتی ئاگادارکردنەوەکانت' : 'List of all your tasks and reminder schedules')
                    : (isKurdish ? 'تێبینییە تایبەتەکان و زانیارییە خێراکانت' : 'Your personal sticky notes and scratchpad info')}
                </p>
              </div>
            </div>
            
            <div className="text-[10px] text-muted-foreground/60 font-mono bg-background border border-border rounded-md px-2 py-1 shadow-sm">
              {activeTab === 'tasks' 
                ? (isKurdish ? `${tasks.length} ئەرک` : `${tasks.length} Tasks`)
                : (isKurdish ? `${notes.length} تێبینی` : `${notes.length} Notes`)}
            </div>
          </div>

          {/* Render Board Content */}
          <div className="w-full p-4 md:p-6 space-y-6">
            {activeTab === 'tasks' ? (
              
              /* Tasks List */
              <div className="space-y-2.5">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-lg border-border bg-card shadow-sm animate-fade-in" style={{ fontFamily: forcedFont }}>
                    <div className="p-4 bg-muted/60 border border-border/50 rounded-full mb-4 shadow-inner">
                      <CheckSquare className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{isKurdish ? 'هیچ ئەرکێک نییە' : 'No Tasks Found'}</h3>
                    <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{t('tasks.empty')}</p>
                  </div>
                ) : (
                  tasks.map(task => (
                    <Card 
                      key={task.id} 
                      className={cn(
                        "border border-border/80 transition-all bg-white dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-900 shadow-sm cursor-pointer", 
                        task.isCompleted && "opacity-60 bg-muted/5"
                      )}
                      onClick={() => openViewingModal('task', task)}
                    >
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskStatus(task.id);
                            }}
                            className="mt-0.5 text-muted-foreground hover:text-foreground flex-shrink-0 transition-transform active:scale-90"
                          >
                            {task.isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 hover:text-primary/70" />
                            )}
                          </button>
                          
                          {/* Main Task View Trigger */}
                          <div className="min-w-0">
                            <p 
                              className={cn("text-sm font-bold text-foreground transition-colors break-words whitespace-pre-wrap", task.isCompleted && "line-through text-muted-foreground")}
                              style={{ fontSize: `${fontSize + 3}px` }}
                            >
                              {task.title}
                            </p>
                            {task.notes && (
                              <p 
                                className="text-xs text-muted-foreground mt-1 line-clamp-4 leading-normal break-words"
                                style={{ fontSize: `${fontSize}px` }}
                              >
                                {task.notes}
                              </p>
                            )}
                            {task.reminderTime && (
                              <div className="inline-flex items-center gap-1 mt-2 text-[10px] text-muted-foreground bg-muted border border-border/50 px-2 py-0.5 rounded shadow-sm">
                                <Clock className="h-3 w-3" />
                                <span dir="ltr">{new Date(task.reminderTime).toLocaleString(isKurdish ? 'en-GB' : undefined, { 
                                  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' 
                                })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                            onClick={() => openViewingModal('task', task)}
                            title={isKurdish ? 'بینین' : 'View'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteConfirmation({ id: task.id, type: 'task' })}
                            title={isKurdish ? 'سڕینەوە' : 'Delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              
              /* Notes Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-lg border-border bg-card shadow-sm animate-fade-in" style={{ fontFamily: forcedFont }}>
                    <div className="p-4 bg-muted/60 border border-border/50 rounded-full mb-4 shadow-inner">
                      <Book className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{isKurdish ? 'هیچ تێبینییەک نییە' : 'No Notes Found'}</h3>
                    <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{t('notes.empty')}</p>
                  </div>
                ) : (
                  notes.map(note => {
                    const activeColor = noteColors.find(c => c.id === note.color) || noteColors[0];
                    return (
                      <Card 
                        key={note.id} 
                        className={cn(
                          "border border-border/80 bg-white dark:bg-zinc-900/90 relative group flex flex-col overflow-hidden border-t-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
                          activeColor.borderClass
                        )}
                      >
                        {/* Note card click to view details */}
                        <div 
                          onClick={() => openViewingModal('note', note)}
                          className="p-4 pb-2 flex-1 cursor-pointer min-w-0"
                        >
                          <h3 
                            className="text-sm font-bold text-foreground group-hover:text-primary transition-colors break-words mb-2"
                            style={{ fontSize: `${fontSize + 3}px` }}
                          >
                            {note.title || (isKurdish ? 'بێناونیشان' : 'Untitled')}
                          </h3>
                          <p 
                            className="text-xs text-muted-foreground line-clamp-6 leading-relaxed break-words"
                            style={{ fontSize: `${fontSize}px` }}
                          >
                            {note.content}
                          </p>
                        </div>
                        
                        <div className="p-4 pt-0 flex items-center justify-between border-t border-border/40 mt-2 bg-muted/20">
                          <div className="text-[9px] text-muted-foreground/50 font-mono">
                            {new Date(note.createdAt).toLocaleDateString(isKurdish ? 'en-GB' : undefined, { 
                              day: '2-digit', month: '2-digit', year: 'numeric' 
                            })}
                          </div>
                          
                          {/* Note actions */}
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
                              onClick={() => openViewingModal('note', note)}
                              title={isKurdish ? 'بینین' : 'View'}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                              onClick={() => setDeleteConfirmation({ id: note.id, type: 'note' })}
                              title={isKurdish ? 'سڕینەوە' : 'Delete'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* 3. Detailed View/Overlay Modal (View & Actions) */}
      {viewingItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print" onClick={() => setViewingItem(null)}>
          <div 
            className="w-full max-w-lg bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col p-6 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: defaultFont }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-border pb-3" style={{ fontFamily: forcedFont }}>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-muted rounded-md text-foreground">
                  {viewingItem.type === 'task' ? <CheckSquare className="h-4.5 w-4.5" /> : <Book className="h-4.5 w-4.5" />}
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isEditingInModal 
                    ? (viewingItem.type === 'task' ? (isKurdish ? 'دەستکاری ئەرک' : 'Edit Task') : (isKurdish ? 'دەستکاری تێبینی' : 'Edit Note'))
                    : (viewingItem.type === 'task' ? (isKurdish ? 'بینینی ئەرک' : 'Task Details') : (isKurdish ? 'بینینی تێبینی' : 'Note Details'))}
                </span>
              </div>
              <button 
                onClick={() => setViewingItem(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="space-y-4 overflow-y-auto max-h-[380px] custom-scrollbar py-1">
              {isEditingInModal ? (
                /* Edit Fields */
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {isKurdish ? 'ناونیشان' : 'Title'}
                    </label>
                    <Input 
                      type="text"
                      value={modalEditTitle}
                      onChange={(e) => setModalEditTitle(e.target.value)}
                      placeholder={isKurdish ? 'ناونیشان' : 'Title'}
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {isKurdish ? 'ناوەڕۆک' : 'Content'}
                    </label>
                    <textarea 
                      value={modalEditNotesOrContent}
                      onChange={(e) => setModalEditNotesOrContent(e.target.value)}
                      placeholder={isKurdish ? 'ناوەڕۆک' : 'Content'}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  {viewingItem.type === 'task' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        {t('tasks.reminder')}
                      </label>
                      <Input 
                        type="datetime-local"
                        value={modalEditReminder}
                        onChange={(e) => setModalEditReminder(e.target.value)}
                        dir="ltr"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground block">
                        Category Color
                      </label>
                      <div className="flex gap-2.5 pt-1.5 flex-wrap">
                        {noteColors.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setModalEditColor(c.id)}
                            className={cn(
                              "w-7 h-7 rounded-full border border-border transition-all flex items-center justify-center relative shadow-sm hover:scale-105 active:scale-95",
                              modalEditColor === c.id ? "ring-2 ring-ring scale-110 shadow-md" : "hover:border-foreground/30"
                            )}
                          >
                            <span className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center text-white", c.colorHex)}>
                              {modalEditColor === c.id && <Check className="h-2.5 w-2.5" />}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Read Fields */
                <div className="space-y-3">
                  <h3 
                    className="text-base font-bold text-foreground leading-relaxed"
                    style={{ fontSize: `${fontSize + 2}px` }}
                  >
                    {viewingItem.data.title || (viewingItem.type === 'note' ? (isKurdish ? 'تێبینی بێناونیشان' : 'Untitled Note') : (isKurdish ? 'ئەرک' : 'Task'))}
                  </h3>
                  
                  {viewingItem.type === 'task' ? (
                    <p 
                      className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {(viewingItem.data as Task).notes || (isKurdish ? 'هیچ زانیارییەکی تر نییە.' : 'No description provided.')}
                    </p>
                  ) : (
                    <p 
                      className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {(viewingItem.data as Note).content}
                    </p>
                  )}

                  {viewingItem.type === 'task' && (viewingItem.data as Task).reminderTime && (
                    <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-md w-fit mt-3">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-semibold">{isKurdish ? 'کاتی ئاگادارکردنەوە:' : 'Reminder Time:'}</span>
                      <span dir="ltr">{new Date((viewingItem.data as Task).reminderTime!).toLocaleString(isKurdish ? 'en-GB' : undefined)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                {isKurdish ? 'دروستکراوە لە:' : 'Created:'} {new Date(viewingItem.data.createdAt).toLocaleDateString(isKurdish ? 'en-GB' : undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              
              <div className="flex gap-2">
                {isEditingInModal ? (
                  <>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleModalSave}
                    >
                      {isKurdish ? 'پاشەکەوتکردن' : 'Save'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingInModal(false)}
                    >
                      {isKurdish ? 'پاشگەزبوونەوە' : 'Cancel'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingInModal(true)}
                    >
                      <Edit className="h-4 w-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                      <span>{isKurdish ? 'دەستکاری' : 'Edit'}</span>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setDeleteConfirmation({ id: viewingItem.data.id, type: viewingItem.type })}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                      <span>{isKurdish ? 'سڕینەوە' : 'Delete'}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
      {/* 4. Delete Confirmation Modal */}
      {deleteConfirmation && (
        <ConfirmModal
          isOpen={true}
          title={isKurdish ? 'سڕینەوەی بابەت' : 'Delete Item'}
          message={
            deleteConfirmation.type === 'task'
              ? (isKurdish ? 'دڵنیایت لە سڕینەوەی ئەم ئەرکە؟' : 'Are you sure you want to delete this task?')
              : (isKurdish ? 'دڵنیایت لە سڕینەوەی ئەم تێبینییە؟' : 'Are you sure you want to delete this note?')
          }
          confirmLabel={isKurdish ? 'سڕینەوە' : 'Delete'}
          cancelLabel={isKurdish ? 'پاشگەزبوونەوە' : 'Cancel'}
          onConfirm={() => {
            if (deleteConfirmation.type === 'task') {
              deleteTask(deleteConfirmation.id);
            } else {
              deleteNote(deleteConfirmation.id);
            }
            setDeleteConfirmation(null);
          }}
          onClose={() => setDeleteConfirmation(null)}
          isDestructive={true}
        />
      )}

    </div>
  );
};
