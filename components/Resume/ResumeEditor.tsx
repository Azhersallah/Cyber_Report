import React from 'react';
import { useApp } from '../../store/AppContext';
import { ResumeData } from '../../types';
import PersonalInfoForm from './PersonalInfoForm';
import WorkExperienceForm from './WorkExperienceForm';
import EducationForm from './EducationForm';
import SkillsForm from './SkillsForm';
import LanguagesForm from './LanguagesForm';
import PhotoUploader from './PhotoUploader';
import TemplateSelector from './TemplateSelector';
import ColorCustomizer from './ColorCustomizer';
import FontCustomizer from './FontCustomizer';
import { cn } from '../../lib/utils';

export type ResumeSection = 'personal' | 'photo' | 'experience' | 'education' | 'skills' | 'languages' | 'template' | 'customize';

interface ResumeEditorProps {
  activeSection: ResumeSection;
  onEditPhoto?: () => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ activeSection, onEditPhoto }) => {
  const { state, dispatch } = useApp();
  const isRTL = state.language === 'ku' || state.language === 'ar';

  const handleUpdatePersonalInfo = (data: Partial<ResumeData['personalInfo']>) => {
    dispatch({
      type: 'UPDATE_RESUME_DATA',
      payload: {
        personalInfo: {
          ...state.resumeData.personalInfo,
          ...data
        }
      }
    });
  };

  const handleUpdateWorkExperience = (data: ResumeData['workExperience']) => {
    dispatch({
      type: 'UPDATE_RESUME_DATA',
      payload: { workExperience: data }
    });
  };

  const handleUpdateEducation = (data: ResumeData['education']) => {
    dispatch({
      type: 'UPDATE_RESUME_DATA',
      payload: { education: data }
    });
  };

  const handleUpdateSkills = (data: ResumeData['skills']) => {
    dispatch({
      type: 'UPDATE_RESUME_DATA',
      payload: { skills: data }
    });
  };

  const handleUpdateLanguages = (data: ResumeData['languages']) => {
    dispatch({
      type: 'UPDATE_RESUME_DATA',
      payload: { languages: data }
    });
  };

  const handlePhotoChange = (photo: string) => {
    dispatch({
      type: 'UPDATE_RESUME_DATA',
      payload: { photo }
    });
  };

  const handlePhotoRemove = () => {
    dispatch({
      type: 'UPDATE_RESUME_DATA',
      payload: { photo: null }
    });
  };

  return (
    <div className={cn("h-full overflow-y-auto p-6", isRTL && "font-kufi")} dir={isRTL ? 'rtl' : 'ltr'}>
      {activeSection === 'personal' && (
        <PersonalInfoForm
          data={state.resumeData.personalInfo}
          onChange={handleUpdatePersonalInfo}
          language={state.language}
        />
      )}

      {activeSection === 'photo' && (
        <div className="max-w-sm mx-auto">
          <h3 className="text-lg font-semibold mb-4">
            {isRTL ? 'وێنەی پرۆفایل' : 'Profile Photo'}
          </h3>
          <PhotoUploader
            currentPhoto={state.resumeData.photo}
            onPhotoChange={handlePhotoChange}
            onPhotoRemove={handlePhotoRemove}
            onPhotoEdit={state.resumeData.photo ? onEditPhoto : undefined}
            language={state.language}
          />
        </div>
      )}

      {activeSection === 'experience' && (
        <WorkExperienceForm
          data={state.resumeData.workExperience}
          onChange={handleUpdateWorkExperience}
          language={state.language}
        />
      )}

      {activeSection === 'education' && (
        <EducationForm
          data={state.resumeData.education}
          onChange={handleUpdateEducation}
          language={state.language}
        />
      )}

      {activeSection === 'skills' && (
        <SkillsForm
          data={state.resumeData.skills}
          onChange={handleUpdateSkills}
          language={state.language}
        />
      )}

      {activeSection === 'languages' && (
        <LanguagesForm
          data={state.resumeData.languages || []}
          onChange={handleUpdateLanguages}
          language={state.language}
        />
      )}

      {activeSection === 'template' && (
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-4">
            {isRTL ? 'هەڵبژاردنی تێمپلەیت' : 'Select Template'}
          </h3>
          <TemplateSelector />
        </div>
      )}

      {activeSection === 'customize' && (
        <div className="max-w-md mx-auto space-y-5">
          {/* Colors Section */}
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              {isRTL ? 'ڕەنگەکان' : 'Colors'}
            </h4>
            <ColorCustomizer />
          </div>

          {/* Typography Section */}
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="text-base font-serif leading-none">Aa</span>
              {isRTL ? 'فۆنت و قەبارە' : 'Typography'}
            </h4>
            <FontCustomizer />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeEditor;
