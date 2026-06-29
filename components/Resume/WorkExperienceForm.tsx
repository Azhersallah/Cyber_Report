import React from 'react';
import { WorkExperience } from '../../types';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateId } from '../../utils/helpers';

interface WorkExperienceFormProps {
  data: WorkExperience[];
  onChange: (data: WorkExperience[]) => void;
  language: 'en' | 'ku' | 'ar';
}

const WorkExperienceForm: React.FC<WorkExperienceFormProps> = ({ data, onChange, language }) => {
  const isRTL = language === 'ku' || language === 'ar';

  const labels = {
    title: isRTL ? 'ئەزموونی کار' : 'Work Experience',
    add: isRTL ? 'زیادکردنی ئەزموون' : 'Add Experience',
    jobTitle: isRTL ? 'ناونیشانی کار' : 'Job Title',
    company: isRTL ? 'کۆمپانیا' : 'Company',
    location: isRTL ? 'شوێن' : 'Location',
    startDate: isRTL ? 'بەرواری دەستپێکردن' : 'Start Date',
    endDate: isRTL ? 'بەرواری کۆتایی' : 'End Date',
    present: isRTL ? 'ئێستا' : 'Present',
    description: isRTL ? 'وەسف' : 'Description'
  };

  const handleAdd = () => {
    const newExperience: WorkExperience = {
      id: generateId(),
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    onChange([...data, newExperience]);
  };

  const handleRemove = (id: string) => {
    onChange(data.filter(exp => exp.id !== id));
  };

  const validateDates = (startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate || endDate === 'present') return true;
    return new Date(startDate) <= new Date(endDate);
  };

  const handleUpdate = (id: string, field: keyof WorkExperience, value: string | string[]) => {
    onChange(data.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
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
          {isRTL ? 'هیچ ئەزموونێک زیاد نەکراوە' : 'No work experience added yet'}
        </p>
      )}

      {data.map((exp, index) => (
        <div key={exp.id} className="p-4 border border-border rounded-lg space-y-3">
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
                {isRTL ? `ئەزموون ${index + 1}` : `Experience ${index + 1}`}
              </span>
            </div>
            <button
              onClick={() => handleRemove(exp.id)}
              className="p-1 text-destructive hover:bg-destructive/10 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">{labels.jobTitle}</label>
              <input
                type="text"
                value={exp.jobTitle}
                onChange={(e) => handleUpdate(exp.id, 'jobTitle', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={isRTL ? 'ئەندازیاری نەرمەکاڵا' : 'Software Engineer'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{labels.company}</label>
              <input
                type="text"
                value={exp.company}
                onChange={(e) => handleUpdate(exp.id, 'company', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={isRTL ? 'ناوی کۆمپانیا' : 'Company Name'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{labels.location}</label>
              <input
                type="text"
                value={exp.location}
                onChange={(e) => handleUpdate(exp.id, 'location', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={isRTL ? 'شار، وڵات' : 'City, Country'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{labels.startDate}</label>
              <input
                type="month"
                value={exp.startDate}
                onChange={(e) => handleUpdate(exp.id, 'startDate', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{labels.endDate}</label>
              <div className="flex gap-2">
                <input
                  type="month"
                  value={exp.endDate === 'present' ? '' : exp.endDate}
                  onChange={(e) => handleUpdate(exp.id, 'endDate', e.target.value)}
                  disabled={exp.endDate === 'present'}
                  className={cn(
                    "flex-1 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 disabled:opacity-50",
                    exp.startDate && exp.endDate && exp.endDate !== 'present' && !validateDates(exp.startDate, exp.endDate)
                      ? "border-destructive focus:ring-destructive"
                      : "border-border focus:ring-primary"
                  )}
                />
                <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-md cursor-pointer hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={exp.endDate === 'present'}
                    onChange={(e) => handleUpdate(exp.id, 'endDate', e.target.checked ? 'present' : '')}
                    className="rounded"
                  />
                  <span className="text-sm">{labels.present}</span>
                </label>
              </div>
              {exp.startDate && exp.endDate && exp.endDate !== 'present' && !validateDates(exp.startDate, exp.endDate) && (
                <p className="text-xs text-destructive mt-1">
                  {isRTL ? 'بەرواری کۆتایی دەبێت دوای بەرواری دەستپێکردن بێت' : 'End date must be after start date'}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">{labels.description}</label>
              <textarea
                value={exp.description}
                onChange={(e) => handleUpdate(exp.id, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder={isRTL ? 'وەسفی کارەکانت و دەستکەوتەکانت' : 'Describe your responsibilities and achievements'}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkExperienceForm;
