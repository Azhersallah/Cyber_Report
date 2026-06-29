import React, { useState } from 'react';
import { LanguageSkill, Language } from '../../types';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LanguagesFormProps {
  data: LanguageSkill[];
  onChange: (data: LanguageSkill[]) => void;
  language: Language;
}

const LanguagesForm: React.FC<LanguagesFormProps> = ({ data = [], onChange, language }) => {
  const isRTL = language === 'ku' || language === 'ar';

  const isAr = language === 'ar';
  const labels = {
    title: isAr ? 'اللغات' : isRTL ? 'زمانەکان' : 'Languages',
    add: isAr ? 'إضافة لغة' : isRTL ? 'زیادکردنی زمان' : 'Add Language',
    language: isAr ? 'اللغة' : isRTL ? 'زمان' : 'Language',
    proficiency: isAr ? 'المستوى' : isRTL ? 'ئاست' : 'Proficiency',
    empty: isAr ? 'لم تتم إضافة أي لغة بعد' : isRTL ? 'هیچ زمانێک زیاد نەکراوە' : 'No languages added yet'
  };

  const proficiencyLevels = {
    native: isAr ? 'اللغة الأم' : isRTL ? 'زمانی دایک' : 'Native',
    fluent: isAr ? 'طلاقة' : isRTL ? 'بەڕوانی' : 'Fluent',
    advanced: isAr ? 'متقدم' : isRTL ? 'پێشکەوتوو' : 'Advanced',
    intermediate: isAr ? 'متوسط' : isRTL ? 'ناوەند' : 'Intermediate',
    basic: isAr ? 'مبتدئ' : isRTL ? 'سەرەتایی' : 'Basic'
  };

  const handleAdd = () => {
    const newLanguage: LanguageSkill = {
      id: Date.now().toString(),
      language: '',
      proficiency: 'intermediate'
    };
    onChange([...data, newLanguage]);
  };

  const handleUpdate = (id: string, field: keyof LanguageSkill, value: string) => {
    onChange(data.map(lang => 
      lang.id === id ? { ...lang, [field]: value } : lang
    ));
  };

  const handleDelete = (id: string) => {
    onChange(data.filter(lang => lang.id !== id));
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
          {labels.empty}
        </p>
      )}

      {data.map((lang, index) => (
        <div key={lang.id} className="p-4 border border-border rounded-lg space-y-3">
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
                {isAr ? `لغة ${index + 1}` : isRTL ? `زمان ${index + 1}` : `Language ${index + 1}`}
              </span>
            </div>
            <button
              onClick={() => handleDelete(lang.id)}
              className="p-1 text-destructive hover:bg-destructive/10 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                {labels.language}
              </label>
              <input
                type="text"
                value={lang.language}
                onChange={(e) => handleUpdate(lang.id, 'language', e.target.value)}
                placeholder={isAr ? 'مثال: الإنجليزية' : isRTL ? 'بۆ نموونە: ئینگلیزی' : 'e.g., English'}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {labels.proficiency}
              </label>
              <select
                value={lang.proficiency}
                onChange={(e) => handleUpdate(lang.id, 'proficiency', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.entries(proficiencyLevels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LanguagesForm;
