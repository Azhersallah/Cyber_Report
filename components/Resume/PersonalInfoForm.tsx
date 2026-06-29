import React from 'react';
import { PersonalInfo } from '../../types';
import { cn } from '../../lib/utils';

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (data: Partial<PersonalInfo>) => void;
  language: 'en' | 'ku' | 'ar';
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ data, onChange, language }) => {
  const isRTL = language === 'ku' || language === 'ar';

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({ [field]: value });
  };

  const labels = {
    fullName: isRTL ? 'ناوی تەواو' : 'Full Name',
    title: isRTL ? 'پێگە' : 'Professional Title',
    phone: isRTL ? 'ژمارەی تەلەفۆن' : 'Phone',
    email: isRTL ? 'ئیمەیڵ' : 'Email',
    address: isRTL ? 'ناونیشان' : 'Address',
    linkedin: isRTL ? 'لینکدین' : 'LinkedIn',
    website: isRTL ? 'وێبسایت' : 'Website',
    summary: isRTL ? 'کورتە' : 'Professional Summary'
  };

  return (
    <div className={cn("space-y-4", isRTL && "font-kufi")} dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <label className="block text-sm font-medium mb-1">
          {labels.fullName} <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={isRTL ? 'ناوی تەواوت بنووسە' : 'Enter your full name'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {labels.title}
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={isRTL ? 'پێگەی کارت' : 'e.g., Software Engineer'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {labels.phone}
        </label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={isRTL ? '+964 750 123 4567' : '+1 (555) 123-4567'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {labels.email}
        </label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={cn(
            "w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2",
            data.email && !validateEmail(data.email)
              ? "border-destructive focus:ring-destructive"
              : "border-border focus:ring-primary"
          )}
          placeholder={isRTL ? 'example@email.com' : 'your.email@example.com'}
        />
        {data.email && !validateEmail(data.email) && (
          <p className="text-xs text-destructive mt-1">
            {isRTL ? 'ئیمەیڵ دروست نییە' : 'Invalid email format'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {labels.address}
        </label>
        <input
          type="text"
          value={data.address}
          onChange={(e) => handleChange('address', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={isRTL ? 'شار، وڵات' : 'City, Country'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {labels.linkedin}
        </label>
        <input
          type="url"
          value={data.linkedin || ''}
          onChange={(e) => handleChange('linkedin', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="linkedin.com/in/yourprofile"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {labels.website}
        </label>
        <input
          type="url"
          value={data.website || ''}
          onChange={(e) => handleChange('website', e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="yourwebsite.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {labels.summary}
        </label>
        <textarea
          value={data.summary || ''}
          onChange={(e) => handleChange('summary', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder={isRTL ? 'کورتەیەک لەسەر خۆت و ئەزموونەکانت' : 'Brief summary about yourself and your experience'}
        />
      </div>
    </div>
  );
};

export default PersonalInfoForm;
