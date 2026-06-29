import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SkillsFormProps {
  data: string[];
  onChange: (data: string[]) => void;
  language: 'en' | 'ku' | 'ar';
}

const SkillsForm: React.FC<SkillsFormProps> = ({ data, onChange, language }) => {
  const [inputValue, setInputValue] = useState('');
  const isRTL = language === 'ku' || language === 'ar';

  const labels = {
    title: isRTL ? 'لێهاتوویی' : 'Skills',
    placeholder: isRTL ? 'لێهاتووییەک زیاد بکە' : 'Add a skill',
    add: isRTL ? 'زیادکردن' : 'Add',
    empty: isRTL ? 'هیچ لێهاتووییەک زیاد نەکراوە' : 'No skills added yet'
  };

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !data.includes(trimmed)) {
      onChange([...data, trimmed]);
      setInputValue('');
    }
  };

  const handleRemove = (skill: string) => {
    onChange(data.filter(s => s !== skill));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={cn("space-y-4", isRTL && "font-kufi")} dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-lg font-semibold">{labels.title}</h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={labels.placeholder}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          {labels.add}
        </button>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {labels.empty}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {data.map((skill, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
            >
              <span>{skill}</span>
              <button
                onClick={() => handleRemove(skill)}
                className="p-0.5 hover:bg-background rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillsForm;
