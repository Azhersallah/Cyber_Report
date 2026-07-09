import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Languages, User, Type, Palette, ImageIcon, Trash2, Check } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { getTranslation } from '../../utils/translations';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { readFileAsDataURL } from '../../utils/helpers';

interface SetupWizardModalProps {
  onClose: () => void;
}

const SetupWizardModal: React.FC<SetupWizardModalProps> = ({ onClose }) => {
  const { state, dispatch } = useApp();
  const [selectedLang, setSelectedLang] = useState<'ku' | 'en'>(
    (state.language as any) === 'en' ? 'en' : 'ku'
  );
  const [userName, setUserName] = useState(state.settings.userName || '');
  const [badgeColor, setBadgeColor] = useState(state.settings.badgeColor || '#18181b');
  const [fontFamily, setFontFamily] = useState(state.settings.defaultFontFamily || 'Inter');
  const [logo, setLogo] = useState<string | null>(state.settings.logo || null);

  const t = (key: string) => {
    const wizardTranslations: Record<string, Record<'ku' | 'en', string>> = {
      'wizard.title': {
        ku: 'ڕێکخستنی یەکەم جار',
        en: 'Initial Configuration'
      },
      'wizard.subtitle': {
        ku: 'تکایە پێش دەستپێکردن ڕێکخستنە بنچینەییەکان بۆ ئەپەکە ئەنجام بدە',
        en: 'Please configure the basic settings for the application before starting'
      },
      'wizard.langTitle': {
        ku: 'زمان / Language',
        en: 'Choose Language'
      },
      'wizard.identity': {
        ku: 'ناوی بەکارهێنەر (یوزەر نەیم)',
        en: 'User / Brand Name'
      },
      'wizard.font': {
        ku: 'فۆنتی بنچینەیی',
        en: 'Default Application Font'
      },
      'wizard.badgeColor': {
        ku: 'ڕەنگی نیشانەی وێنەکان',
        en: 'Photo Badge Accent Color'
      },
      'wizard.logo': {
        ku: 'لۆگۆی فەرمی (لە کۆتایی پەڕەکە دەر دەکەوێت)',
        en: 'Official Logo (Shown at the bottom of pages)'
      },
      'wizard.uploadLogo': {
        ku: 'بارکردنی لۆگۆ',
        en: 'Upload Logo'
      },
      'wizard.finish': {
        ku: 'تەواوکردن و پاشەکەوتکردن',
        en: 'Save & Finish Setup'
      },
      'wizard.placeholderName': {
        ku: 'ناوت لێرە بنووسە...',
        en: 'Enter your name or business name...'
      }
    };

    return wizardTranslations[key]?.[selectedLang] || key;
  };

  const isKurdish = selectedLang === 'ku';

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const src = await readFileAsDataURL(file);
        setLogo(src);
      } catch (error) {
        console.error('Failed to load logo', error);
      }
    }
  };

  const handleFinish = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        userName,
        badgeColor,
        defaultFontFamily: fontFamily,
        logo,
        showLogo: !!logo,
        showFooter: true
      }
    });

    dispatch({ type: 'SET_LANGUAGE', payload: selectedLang });
    localStorage.setItem('photoPrinterSetupCompleted', 'true');
    onClose();
  };

  const modalContent = (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in ${
        isKurdish ? 'font-kufi' : 'font-sans'
      }`}
      dir={isKurdish ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
    >
      <Card className="relative w-full max-w-md animate-slide-up bg-card border border-border shadow-xl rounded-xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-lg">{t('wizard.title')}</CardTitle>
          <CardDescription className="text-xs mt-1">{t('wizard.subtitle')}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Languages size={13} /> {t('wizard.langTitle')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'ku', label: 'کوردی' },
                { id: 'en', label: 'English' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSelectedLang(lang.id as any)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-between transition-all select-none ${
                    selectedLang === lang.id
                      ? 'border-foreground bg-accent text-foreground font-bold shadow-sm'
                      : 'border-border hover:border-foreground/45 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className={lang.id === 'ku' ? 'font-kufi' : 'font-sans'}>{lang.label}</span>
                  {selectedLang === lang.id && <Check size={14} className="text-foreground shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* User Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <User size={13} /> {t('wizard.identity')}
            </label>
            <div className="relative">
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t('wizard.placeholderName')}
                className="text-sm"
              />
            </div>
          </div>

          {/* Typography Default Font */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Type size={13} /> {t('wizard.font')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Inter', label: 'Inter', sample: 'Aa' },
                { id: 'Noto Kufi Arabic', label: 'کوفی', sample: 'ئا' },
                { id: 'Noto Naskh Arabic', label: 'نەسخ', sample: 'ئا' }
              ].map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setFontFamily(font.id)}
                  className={`px-2 py-2 rounded-lg border text-sm font-medium flex flex-col items-center justify-center gap-1 transition-all select-none relative ${
                    fontFamily === font.id
                      ? 'border-foreground bg-accent text-foreground'
                      : 'border-border hover:border-foreground/45 text-muted-foreground hover:text-foreground'
                  }`}
                  style={{ fontFamily: font.id }}
                >
                  <span className="text-lg">{font.sample}</span>
                  <span className="text-[9px] text-muted-foreground">{font.label}</span>
                  {fontFamily === font.id && (
                    <Check size={12} className="absolute top-1 right-1 text-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Badge Color */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Palette size={13} /> {t('wizard.badgeColor')}
            </label>
            <div className="flex flex-wrap gap-2 items-center bg-muted/40 p-2.5 rounded-lg border border-border">
              {['#18181b', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'].map(
                (color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBadgeColor(color)}
                    className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-105 flex items-center justify-center shadow-sm ${
                      badgeColor === color
                        ? 'border-foreground ring-2 ring-foreground/20'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {badgeColor === color && <Check size={12} className="text-white" />}
                  </button>
                )
              )}
              {/* Badge Preview */}
              <div
                className="ml-auto text-[10px] text-white font-bold px-2 py-0.5 rounded-full select-none shadow-sm"
                style={{ backgroundColor: badgeColor }}
              >
                1
              </div>
            </div>
          </div>

          {/* Footer Logo Asset */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <ImageIcon size={13} /> {t('wizard.logo')}
            </label>
            <div className="border border-dashed border-border rounded-lg p-3 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col items-center justify-center text-center">
              {logo ? (
                <div className="space-y-2 w-full">
                  <img src={logo} alt="Logo" className="max-h-16 object-contain mx-auto" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setLogo(null)}
                  >
                    <Trash2 size={12} className="mr-1.5 shrink-0" />
                    {getTranslation('btn.remove', selectedLang)}
                  </Button>
                </div>
              ) : (
                <label className="w-full cursor-pointer flex flex-col items-center justify-center py-3">
                  <ImageIcon size={24} className="text-muted-foreground/40 mb-1.5" />
                  <span className="text-xs font-medium text-primary hover:underline">
                    {t('wizard.uploadLogo')}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </label>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 border-t border-border bg-muted/20">
          <Button
            type="button"
            onClick={handleFinish}
            className="w-full py-5 text-sm font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg shadow-sm"
          >
            {t('wizard.finish')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default SetupWizardModal;
