import React from 'react';
import { Education } from '../../types';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateId } from '../../utils/helpers';

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
  language: 'en' | 'ku' | 'ar';
}

const EducationForm: React.FC<EducationFormProps> = ({ data, onChange, language }) => {
  const isRTL = language === 'ku' || language === 'ar';

  const labels = {
    title: isRTL ? 'خوێندن' : 'Education',
    add: isRTL ? 'زیادکردنی خوێندن' : 'Add Education',
    degree: isRTL ? 'بڕوانامە' : 'Degree',
    institution: isRTL ? 'دامەزراوە' : 'Institution',
    location: isRTL ? 'شوێن' : 'Location',
    startDate: isRTL ? 'بەرواری دەستپێکردن' : 'Start Date',
    endDate: isRTL ? 'بەرواری کۆتایی' : 'End Date',
    present: isRTL ? 'ئێستا' : 'Present',
    gpa: isRTL ? 'نمرە' : 'GPA',
    honors: isRTL ? 'ڕێزلێنان' : 'Honors',
    description: isRTL ? 'وەسف' : 'Description'
  };

  const handleAdd = () => {
    const newEducation: Education = {
      id: generateId(),
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: ''
    };
    onChange([...data, newEducation]);
  };

  const validateDates = (startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate || endDate === 'present') return true;
    return new Date(startDate) <= new Date(endDate);
  };

  const handleRemove = (id: string) => {
    onChange(data.filter(edu => edu.id !== id));
  };

  const handleUpdate = (id: string, field: keyof Education, value: string) => {
    onChange(data.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newData = [...data];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newData.length) return;
    
    [newData[index], newData[targetIndex]] = [newData[targetIndex], newData[index]];
    onChange(newData);
  };

  return (
    <div className={cn("space-y-4", isRTL && "font-kufi")} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{labels.title}</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          {labels.add}
        </button>
      </div>

      {data.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {isRTL ? 'هیچ خوێندنێک زیاد نەکراوە' : 'No education added yet'}
        </p>
      )}

      {data.map((edu, index) => (
        <div key={edu.id} className="p-4 border border-border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMove(index, 'up')}
                disabled={index === 0}
                className="p-1 hover:bg-muted rounded disabled:opacity-30"
              >
                <GripVertical size={16} />
              </button>
              <span className="text-sm font-medium">
                {isRTL ? `خوێندن ${index + 1}` : `Education ${index + 1}`}
              </span>
            </div>
            <button
              onClick={() => handleRemove(edu.id)}
              className="p-1 text-destructive hover:bg-destructive/10 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">{labels.degree}</label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => handleUpdate(edu.id, 'degree', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={isRTL ? 'بەکالۆریۆس لە زانستی کۆمپیوتەر' : 'Bachelor of Computer Science'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{labels.institution}</label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => handleUpdate(edu.id, 'institution', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={isRTL ? 'ناوی زانکۆ' : 'University Name'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{labels.location}</label>
              <input
                type="text"
                value={edu.location}
                onChange={(e) => handleUpdate(edu.id, 'location', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={isRTL ? 'شار، وڵات' : 'City, Country'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{labels.startDate}</label>
              <input
                type="month"
                value={edu.startDate}
                onChange={(e) => handleUpdate(edu.id, 'startDate', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{labels.endDate}</label>
              <div className="flex gap-2">
                <input
                  type="month"
                  value={edu.endDate === 'present' ? '' : edu.endDate}
                  onChange={(e) => handleUpdate(edu.id, 'endDate', e.target.value)}
                  disabled={edu.endDate === 'present'}
                  className={cn(
                    "flex-1 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50",
                    !validateDates(edu.startDate, edu.endDate) ? "border-red-500" : "border-border"
                  )}
                />
                <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-md cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={edu.endDate === 'present'}
                    onChange={(e) => handleUpdate(edu.id, 'endDate', e.target.checked ? 'present' : '')}
                    className="rounded"
                  />
                  <span className="text-sm">{labels.present}</span>
                </label>
              </div>
              {!validateDates(edu.startDate, edu.endDate) && (
                <p className="text-xs text-red-500 mt-1">
                  {isRTL ? 'بەرواری کۆتایی دەبێت دوای بەرواری دەستپێکردن بێت' : 'End date must be after start date'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{labels.gpa}</label>
              <input
                type="text"
                value={edu.gpa || ''}
                onChange={(e) => handleUpdate(edu.id, 'gpa', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="3.8/4.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{labels.honors}</label>
              <input
                type="text"
                value={edu.honors || ''}
                onChange={(e) => handleUpdate(edu.id, 'honors', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={isRTL ? 'بە ڕێزلێنان' : 'Cum Laude'}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">{labels.description}</label>
              <textarea
                value={edu.description || ''}
                onChange={(e) => handleUpdate(edu.id, 'description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder={isRTL ? 'دەستکەوتەکان و چالاکییەکان' : 'Relevant coursework, achievements, activities'}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EducationForm;
