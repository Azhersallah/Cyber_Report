import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import { cn } from '../../lib/utils';
import { User, Building2, Phone, Mail, Globe, MapPin, Image, Trash2, Quote, Share2, Layout, Palette, Check, RotateCcw, Type, Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { readFileAsDataURL } from '../../utils/helpers';
import ModernBCTemplate from './Templates/ModernBCTemplate';
import ClassicBCTemplate from './Templates/ClassicBCTemplate';
import MinimalBCTemplate from './Templates/MinimalBCTemplate';
import BoldBCTemplate from './Templates/BoldBCTemplate';
import CorporateBCTemplate from './Templates/CorporateBCTemplate';
import ElegantBCTemplate from './Templates/ElegantBCTemplate';
import GradientBCTemplate from './Templates/GradientBCTemplate';
import StripesBCTemplate from './Templates/StripesBCTemplate';
import RoyalBCTemplate from './Templates/RoyalBCTemplate';
import SlateBCTemplate from './Templates/SlateBCTemplate';
import HorizonBCTemplate from './Templates/HorizonBCTemplate';
import PulseBCTemplate from './Templates/PulseBCTemplate';
import NordicBCTemplate from './Templates/NordicBCTemplate';
import PrismBCTemplate from './Templates/PrismBCTemplate';
import EmberBCTemplate from './Templates/EmberBCTemplate';
import OceanBCTemplate from './Templates/OceanBCTemplate';
import IvoryBCTemplate from './Templates/IvoryBCTemplate';
import CircuitBCTemplate from './Templates/CircuitBCTemplate';
import CosmosBCTemplate from './Templates/CosmosBCTemplate';

const BUILTIN_FONTS = [
  'Noto Kufi Arabic', 'Noto Naskh Arabic', 'Cairo', 'Amiri',
  'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia',
  'Verdana', 'Calibri', 'Tahoma', 'Trebuchet MS', 'Garamond',
  'Palatino Linotype', 'Century Gothic', 'Segoe UI', 'Roboto',
  'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Noto Sans',
];

const COLOR_PRESETS = [
  { name: 'Navy', primary: '#0f172a', accent: '#3b82f6', text: '#1e293b', background: '#ffffff', secondary: '#64748b', headerText: '#ffffff' },
  { name: 'Ocean', primary: '#0c4a6e', accent: '#38bdf8', text: '#0f172a', background: '#ffffff', secondary: '#64748b', headerText: '#ffffff' },
  { name: 'Gold', primary: '#78350f', accent: '#fbbf24', text: '#1c1917', background: '#fefce8', secondary: '#78716c', headerText: '#ffffff' },
  { name: 'Emerald', primary: '#064e3b', accent: '#34d399', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
  { name: 'Violet', primary: '#5b21b6', accent: '#c084fc', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
  { name: 'Sunset', primary: '#9a3412', accent: '#fb923c', text: '#1f2937', background: '#ffffff', secondary: '#78716c', headerText: '#ffffff' },
  { name: 'Rose', primary: '#9f1239', accent: '#fb7185', text: '#1f2937', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
  { name: 'Dark', primary: '#0f172a', accent: '#f97316', text: '#f1f5f9', background: '#0f172a', secondary: '#cbd5e1', headerText: '#f1f5f9' },
  { name: 'Teal', primary: '#115e59', accent: '#5eead4', text: '#134e4a', background: '#ffffff', secondary: '#6b7280', headerText: '#ffffff' },
  { name: 'Slate', primary: '#1e293b', accent: '#94a3b8', text: '#0f172a', background: '#f8fafc', secondary: '#64748b', headerText: '#ffffff' },
];

export type BusinessCardSection = 'info' | 'contact' | 'media' | 'template' | 'customize';

interface BusinessCardEditorProps {
  activeSection: BusinessCardSection;
}

const BusinessCardEditor: React.FC<BusinessCardEditorProps> = ({ activeSection }) => {
  const { state, dispatch } = useApp();
  const isRTL = state.businessCardLanguage === 'ku' || state.businessCardLanguage === 'ar';
  const isUIRTL = state.language === 'ku' || state.language === 'ar';
  const data = state.businessCardData;
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const update = (fields: Record<string, any>) => {
    dispatch({ type: 'UPDATE_BUSINESS_CARD_DATA', payload: fields });
  };

  const updateSocial = (fields: Record<string, string>) => {
    dispatch({ type: 'UPDATE_BUSINESS_CARD_DATA', payload: { social: { ...data.social, ...fields } } });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const src = await readFileAsDataURL(file);
      update({ [field]: src });
    } catch (err) {
      console.error('Failed to load image', err);
    }
    e.target.value = '';
  };

  const SectionTitle: React.FC<{ icon: React.ElementType; title: string }> = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
      <Icon size={16} className="text-primary" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );

  const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-xs font-medium text-muted-foreground mb-1">{children}</label>
  );

  return (
    <div className={cn("p-4 space-y-4 overflow-y-auto h-full", isUIRTL && "font-kufi")} dir={isUIRTL ? 'rtl' : 'ltr'}>
      
      {/* Card Type Toggle */}
      {activeSection === 'info' && (
        <>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => update({ type: 'personal' })}
              variant={data.type === 'personal' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              <User size={14} />
              {state.language === 'ku' ? 'کەسی' : state.language === 'ar' ? 'شخصي' : 'Personal'}
            </Button>
            <Button
              onClick={() => update({ type: 'company' })}
              variant={data.type === 'company' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              <Building2 size={14} />
              {state.language === 'ku' ? 'کۆمپانیا' : state.language === 'ar' ? 'شركة' : 'Company'}
            </Button>
          </div>

          <SectionTitle icon={User} title={state.language === 'ku' ? 'زانیاری کەسی' : state.language === 'ar' ? 'معلومات شخصية' : 'Personal Info'} />
          
          <div className="space-y-3">
            <div>
              <FieldLabel>{state.language === 'ku' ? 'ناوی تەواو' : state.language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</FieldLabel>
              <Input
                value={data.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
                placeholder={state.language === 'ku' ? 'ناوت بنووسە' : state.language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                dir="auto"
              />
            </div>
            <div>
              <FieldLabel>{state.language === 'ku' ? 'پیشە / ناونیشان' : state.language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</FieldLabel>
              <Input
                value={data.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder={state.language === 'ku' ? 'پیشەکەت' : state.language === 'ar' ? 'مثال: مهندس برمجيات' : 'e.g., Software Engineer'}
                dir="auto"
              />
            </div>
            <div>
              <FieldLabel>{state.language === 'ku' ? 'کۆمپانیا' : state.language === 'ar' ? 'الشركة' : 'Company'}</FieldLabel>
              <Input
                value={data.company}
                onChange={(e) => update({ company: e.target.value })}
                placeholder={state.language === 'ku' ? 'ناوی کۆمپانیا' : state.language === 'ar' ? 'اسم الشركة' : 'Company name'}
                dir="auto"
              />
            </div>
            <div>
              <FieldLabel>{state.language === 'ku' ? 'بەش' : state.language === 'ar' ? 'القسم' : 'Department'}</FieldLabel>
              <Input
                value={data.department}
                onChange={(e) => update({ department: e.target.value })}
                placeholder={state.language === 'ku' ? 'بەشەکەت' : state.language === 'ar' ? 'مثال: التسويق' : 'e.g., Marketing'}
                dir="auto"
              />
            </div>
            <div>
              <FieldLabel>{state.language === 'ku' ? 'وتەی تایبەت' : state.language === 'ar' ? 'الشعار' : 'Tagline'}</FieldLabel>
              <Input
                value={data.tagline}
                onChange={(e) => update({ tagline: e.target.value })}
                placeholder={state.language === 'ku' ? 'وتەیەکی کورت' : state.language === 'ar' ? 'شعار قصير' : 'A short slogan or motto'}
                dir="auto"
              />
            </div>
          </div>
        </>
      )}

      {activeSection === 'contact' && (
        <>
          <SectionTitle icon={Phone} title={state.language === 'ku' ? 'پەیوەندی' : state.language === 'ar' ? 'تفاصيل الاتصال' : 'Contact Details'} />
          
          <div className="space-y-3">
            <div>
              <FieldLabel>{state.language === 'ku' ? 'ژمارەی مۆبایل ١' : state.language === 'ar' ? 'الهاتف ١' : 'Phone 1'}</FieldLabel>
              <Input
                value={data.phone1}
                onChange={(e) => update({ phone1: e.target.value })}
                placeholder="+964 750 123 4567"
                dir="ltr"
              />
            </div>
            <div>
              <FieldLabel>{state.language === 'ku' ? 'ژمارەی مۆبایل ٢' : state.language === 'ar' ? 'الهاتف ٢' : 'Phone 2'}</FieldLabel>
              <Input
                value={data.phone2}
                onChange={(e) => update({ phone2: e.target.value })}
                placeholder="+964 770 987 6543"
                dir="ltr"
              />
            </div>
            <div>
              <FieldLabel>{state.language === 'ku' ? 'ئیمەیل' : state.language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</FieldLabel>
              <Input
                value={data.email}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="name@example.com"
                dir="ltr"
              />
            </div>
            <div>
              <FieldLabel>{state.language === 'ku' ? 'وێبسایت' : state.language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</FieldLabel>
              <Input
                value={data.website}
                onChange={(e) => update({ website: e.target.value })}
                placeholder="www.example.com"
                dir="ltr"
              />
            </div>
            <div>
              <FieldLabel>{state.language === 'ku' ? 'ناونیشان' : state.language === 'ar' ? 'العنوان' : 'Address'}</FieldLabel>
              <Input
                value={data.address}
                onChange={(e) => update({ address: e.target.value })}
                placeholder={state.language === 'ku' ? 'شوێن' : state.language === 'ar' ? 'المدينة، البلد' : 'City, Country'}
                dir="auto"
              />
            </div>
          </div>

          {/* Social Media */}
          <div className="mt-4">
            <SectionTitle icon={Share2} title={state.language === 'ku' ? 'تۆڕە کۆمەڵایەتییەکان' : state.language === 'ar' ? 'وسائل التواصل' : 'Social Media'} />
            <div className="space-y-3">
              <div>
                <FieldLabel>LinkedIn</FieldLabel>
                <Input
                  value={data.social.linkedin || ''}
                  onChange={(e) => updateSocial({ linkedin: e.target.value })}
                  placeholder="linkedin.com/in/username"
                  dir="ltr"
                />
              </div>
              <div>
                <FieldLabel>Instagram</FieldLabel>
                <Input
                  value={data.social.instagram || ''}
                  onChange={(e) => updateSocial({ instagram: e.target.value })}
                  placeholder="@username"
                  dir="ltr"
                />
              </div>
              <div>
                <FieldLabel>Facebook</FieldLabel>
                <Input
                  value={data.social.facebook || ''}
                  onChange={(e) => updateSocial({ facebook: e.target.value })}
                  placeholder="facebook.com/username"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'media' && (
        <>
          <SectionTitle icon={Image} title={state.language === 'ku' ? 'وێنە و لۆگۆ' : state.language === 'ar' ? 'الشعار والصورة' : 'Logo & Photo'} />
          
          <div className="space-y-4">
            {/* Logo */}
            <div>
              <FieldLabel>{state.language === 'ku' ? 'لۆگۆی کۆمپانیا' : state.language === 'ar' ? 'شعار الشركة' : 'Company Logo'}</FieldLabel>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
              {data.logo ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted">
                    <img src={data.logo} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button onClick={() => logoInputRef.current?.click()} variant="outline" size="sm">
                      {state.language === 'ku' ? 'گۆڕین' : state.language === 'ar' ? 'تغيير' : 'Change'}
                    </Button>
                    <Button onClick={() => update({ logo: null })} variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 size={12} /> {state.language === 'ku' ? 'سڕینەوە' : state.language === 'ar' ? 'حذف' : 'Remove'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => logoInputRef.current?.click()} variant="outline" className="w-full h-20 border-dashed">
                  <Image size={16} className="mr-2" />
                  {state.language === 'ku' ? 'هەڵبژاردنی لۆگۆ' : state.language === 'ar' ? 'رفع الشعار' : 'Upload Logo'}
                </Button>
              )}
            </div>

            {/* Photo */}
            <div>
              <FieldLabel>{state.language === 'ku' ? 'وێنەی کەسی' : state.language === 'ar' ? 'الصورة الشخصية' : 'Personal Photo'}</FieldLabel>
              <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'photo')} />
              {data.photo ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full border border-border overflow-hidden bg-muted">
                    <img src={data.photo} alt="Photo" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button onClick={() => photoInputRef.current?.click()} variant="outline" size="sm">
                      {state.language === 'ku' ? 'گۆڕین' : state.language === 'ar' ? 'تغيير' : 'Change'}
                    </Button>
                    <Button onClick={() => update({ photo: null })} variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 size={12} /> {state.language === 'ku' ? 'سڕینەوە' : state.language === 'ar' ? 'حذف' : 'Remove'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => photoInputRef.current?.click()} variant="outline" className="w-full h-20 border-dashed">
                  <Image size={16} className="mr-2" />
                  {state.language === 'ku' ? 'هەڵبژاردنی وێنە' : state.language === 'ar' ? 'رفع الصورة' : 'Upload Photo'}
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {activeSection === 'template' && (
        <>
          <SectionTitle icon={Layout} title={state.language === 'ku' ? 'هەڵبژاردنی تێمپلەیت' : state.language === 'ar' ? 'اختيار القالب' : 'Choose Template'} />
          
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'modern', name: state.language === 'ku' ? 'مۆدێرن' : state.language === 'ar' ? 'حديث' : 'Modern', Component: ModernBCTemplate },
              { id: 'classic', name: state.language === 'ku' ? 'کلاسیک' : state.language === 'ar' ? 'كلاسيكي' : 'Classic', Component: ClassicBCTemplate },
              { id: 'minimal', name: state.language === 'ku' ? 'ساکار' : state.language === 'ar' ? 'بسيط' : 'Minimal', Component: MinimalBCTemplate },
              { id: 'bold', name: state.language === 'ku' ? 'بەهێز' : state.language === 'ar' ? 'جريء' : 'Bold', Component: BoldBCTemplate },
              { id: 'corporate', name: state.language === 'ku' ? 'کۆمپانیا' : state.language === 'ar' ? 'شركات' : 'Corporate', Component: CorporateBCTemplate },
              { id: 'elegant', name: state.language === 'ku' ? 'شۆخ' : state.language === 'ar' ? 'أنيق' : 'Elegant', Component: ElegantBCTemplate },
              { id: 'gradient', name: state.language === 'ku' ? 'گرادیەنت' : state.language === 'ar' ? 'متدرج' : 'Gradient', Component: GradientBCTemplate },
              { id: 'stripes', name: state.language === 'ku' ? 'هێڵەکان' : state.language === 'ar' ? 'خطوط' : 'Stripes', Component: StripesBCTemplate },
              { id: 'royal', name: state.language === 'ku' ? 'شاهانە' : state.language === 'ar' ? 'ملكي' : 'Royal', Component: RoyalBCTemplate },
              { id: 'slate', name: 'Slate', Component: SlateBCTemplate },
              { id: 'horizon', name: 'Horizon', Component: HorizonBCTemplate },
              { id: 'pulse', name: 'Pulse', Component: PulseBCTemplate },
              { id: 'nordic', name: 'Nordic', Component: NordicBCTemplate },
              { id: 'prism', name: 'Prism', Component: PrismBCTemplate },
              { id: 'ember', name: 'Ember', Component: EmberBCTemplate },
              { id: 'ocean', name: 'Ocean', Component: OceanBCTemplate },
              { id: 'ivory', name: 'Ivory', Component: IvoryBCTemplate },
              { id: 'circuit', name: 'Circuit', Component: CircuitBCTemplate },
              { id: 'cosmos', name: 'Cosmos', Component: CosmosBCTemplate },
            ] as const).map((tpl) => {
              const isActive = state.selectedBusinessCardTemplate === tpl.id;
              const customization = state.businessCardCustomization[tpl.id] || {};
              return (
                <button
                  key={tpl.id}
                  onClick={() => dispatch({ type: 'SET_BUSINESS_CARD_TEMPLATE', payload: tpl.id })}
                  className={cn(
                    "relative rounded-lg border-2 overflow-hidden transition-all hover:shadow-md",
                    isActive ? "border-primary shadow-md" : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="w-full aspect-[18/10] bg-white overflow-hidden relative flex items-center justify-center p-2">
                    <div style={{ 
                      width: '360px', 
                      height: '200px', 
                      transform: 'scale(0.45)', 
                      transformOrigin: 'center center',
                      position: 'absolute'
                    }}>
                      <tpl.Component data={data} customization={customization} language={state.businessCardLanguage} />
                    </div>
                  </div>
                  <div className="px-2 py-1.5 text-[10px] font-medium text-center bg-muted/50">
                    {tpl.name}
                  </div>
                  {isActive && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check size={10} className="text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {activeSection === 'customize' && <BusinessCardCustomizePanel isRTL={state.language === 'ku' || state.language === 'ar'} />}
    </div>
  );
};

const BusinessCardCustomizePanel: React.FC<{ isRTL: boolean }> = ({ isRTL }) => {
  const { state, dispatch } = useApp();
  const [systemFonts, setSystemFonts] = useState<string[]>([]);
  const [fontSearch, setFontSearch] = useState('');
  const [showFontList, setShowFontList] = useState(false);
  const [loadingFonts, setLoadingFonts] = useState(false);
  const fontListRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const tpl = state.selectedBusinessCardTemplate;
  const currentCustomization = state.businessCardCustomization[tpl] || {};
  const currentColors = currentCustomization.colors || {};

  // Use global language for UI labels
  const uiLang = state.language;

  useEffect(() => {
    const loadSystemFonts = async () => {
      try {
        if ('queryLocalFonts' in window) {
          setLoadingFonts(true);
          const fonts = await (window as any).queryLocalFonts();
          const familySet = new Set<string>();
          for (const font of fonts) familySet.add(font.family);
          setSystemFonts(Array.from(familySet).sort((a, b) => a.localeCompare(b)));
          setLoadingFonts(false);
        }
      } catch { setLoadingFonts(false); }
    };
    loadSystemFonts();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fontListRef.current && !fontListRef.current.contains(e.target as Node)) setShowFontList(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allFonts = useMemo(() => {
    const combined = new Set([...BUILTIN_FONTS, ...systemFonts]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b));
  }, [systemFonts]);

  const filteredFonts = useMemo(() => {
    if (!fontSearch.trim()) return allFonts;
    const q = fontSearch.toLowerCase();
    return allFonts.filter(f => f.toLowerCase().includes(q));
  }, [allFonts, fontSearch]);

  const updateCustomization = (payload: any) => {
    dispatch({ type: 'UPDATE_BUSINESS_CARD_CUSTOMIZATION', payload });
  };

  const updateColor = (key: string, value: string) => {
    updateCustomization({ colors: { ...currentColors, [key]: value } });
  };

  const currentFont = currentCustomization.fontFamily || 'Noto Kufi Arabic';
  const currentFontSize = currentCustomization.fontSize || 'medium';
  const primaryColor = currentColors.primary || '#1a1a2e';
  const accentColor = currentColors.accent || '#e94560';
  const bgColor = currentColors.background || '#ffffff';
  const textColor = currentColors.text || '#1f2937';
  const secondaryColor = currentColors.secondary || '#6b7280';
  const headerTextColor = currentColors.headerText || '#ffffff';

  const colorFields = [
    { key: 'primary', label: uiLang === 'ku' ? 'سەردێر' : uiLang === 'ar' ? 'العناوين' : 'Headers', value: primaryColor },
    { key: 'accent', label: uiLang === 'ku' ? 'جەخت' : uiLang === 'ar' ? 'التمييز' : 'Accent', value: accentColor },
    { key: 'background', label: uiLang === 'ku' ? 'پاشبنەما' : uiLang === 'ar' ? 'الخلفية' : 'Background', value: bgColor },
    { key: 'text', label: uiLang === 'ku' ? 'نووسین' : uiLang === 'ar' ? 'النص' : 'Text', value: textColor },
    { key: 'secondary', label: uiLang === 'ku' ? 'لاوەکی' : uiLang === 'ar' ? 'ثانوي' : 'Subtle', value: secondaryColor },
    { key: 'headerText', label: uiLang === 'ku' ? 'لەسەر ڕەنگ' : uiLang === 'ar' ? 'على اللون' : 'On Color', value: headerTextColor },
  ];

  return (
    <div className="space-y-4">
      {/* Font Family - Searchable (matching resume) */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {uiLang === 'ku' ? 'جۆری فۆنت' : uiLang === 'ar' ? 'نوع الخط' : 'Font Family'}
        </label>
        <div className="relative" ref={fontListRef}>
          <button
            onClick={() => { setShowFontList(!showFontList); setTimeout(() => searchInputRef.current?.focus(), 100); }}
            className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg bg-background hover:bg-accent/5 transition-colors text-sm"
          >
            <span style={{ fontFamily: currentFont }} className="truncate">{currentFont}</span>
            <Type size={14} className="text-muted-foreground flex-shrink-0" />
          </button>
          {showFontList && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input ref={searchInputRef} value={fontSearch} onChange={(e) => setFontSearch(e.target.value)} placeholder={uiLang === 'ku' ? 'گەڕان بۆ فۆنت...' : uiLang === 'ar' ? 'البحث عن خط...' : 'Search fonts...'} className="h-8 pl-8 pr-8 text-sm" />
                  {fontSearch && <button onClick={() => setFontSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>}
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {loadingFonts ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">{uiLang === 'ku' ? 'بارکردنی فۆنتەکان...' : uiLang === 'ar' ? 'تحميل الخطوط...' : 'Loading fonts...'}</div>
                ) : filteredFonts.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">{uiLang === 'ku' ? 'فۆنت نەدۆزرایەوە' : uiLang === 'ar' ? 'لم يتم العثور على خطوط' : 'No fonts found'}</div>
                ) : (
                  filteredFonts.map((font) => (
                    <button key={font} onClick={() => { updateCustomization({ fontFamily: font }); setShowFontList(false); setFontSearch(''); }}
                      className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-accent/10 transition-colors", currentFont === font && "bg-primary/10 text-primary font-medium")}>
                      <span style={{ fontFamily: font }} className="truncate">{font}</span>
                    </button>
                  ))
                )}
              </div>
              {systemFonts.length === 0 && !loadingFonts && (
                <div className="p-2 border-t border-border">
                  <button onClick={async () => { try { if ('queryLocalFonts' in window) { setLoadingFonts(true); const fonts = await (window as any).queryLocalFonts(); const s = new Set<string>(); for (const f of fonts) s.add(f.family); setSystemFonts(Array.from(s).sort((a, b) => a.localeCompare(b))); setLoadingFonts(false); } } catch { setLoadingFonts(false); } }}
                    className="w-full text-xs text-center text-primary hover:underline py-1">{uiLang === 'ku' ? 'فۆنتەکانی کۆمپیوتەر ببینە' : uiLang === 'ar' ? 'تحميل خطوط النظام' : 'Load system fonts'}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">{uiLang === 'ku' ? 'قەبارەی نووسین' : uiLang === 'ar' ? 'حجم الخط' : 'Font Size'}</label>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {([{ v: 'small', l: 'S' }, { v: 'medium', l: 'M' }, { v: 'large', l: 'L' }] as const).map((opt) => (
            <button key={opt.v} onClick={() => updateCustomization({ fontSize: opt.v })}
              className={cn("flex-1 py-1.5 text-xs font-medium transition-colors", currentFontSize === opt.v ? "bg-primary text-primary-foreground" : "hover:bg-accent/10")}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {/* Logo Size - Front */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {uiLang === 'ku' ? 'قەبارەی لۆگۆ (پێشەوە)' : uiLang === 'ar' ? 'حجم الشعار (الأمام)' : 'Logo Size (Front)'}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={currentCustomization.logoSizeFront || 1}
            onChange={(e) => updateCustomization({ logoSizeFront: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs font-medium min-w-[3rem] text-right">
            {Math.round((currentCustomization.logoSizeFront || 1) * 100)}%
          </span>
        </div>
      </div>

      {/* Logo Size - Back */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {uiLang === 'ku' ? 'قەبارەی لۆگۆ (دواوە)' : uiLang === 'ar' ? 'حجم الشعار (الخلف)' : 'Logo Size (Back)'}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={currentCustomization.logoSizeBack || 1}
            onChange={(e) => updateCustomization({ logoSizeBack: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs font-medium min-w-[3rem] text-right">
            {Math.round((currentCustomization.logoSizeBack || 1) * 100)}%
          </span>
        </div>
      </div>

      {/* Color Presets - Circles (matching resume pattern) */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">{uiLang === 'ku' ? 'ڕەنگی ئامادەکراو' : uiLang === 'ar' ? 'الألوان الجاهزة' : 'Quick Presets'}</label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((preset) => (
            <button key={preset.name} onClick={() => updateCustomization({ colors: { primary: preset.primary, accent: preset.accent, text: preset.text, background: preset.background, secondary: preset.secondary, headerText: preset.headerText } })}
              className="group relative" title={preset.name}>
              <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-border hover:border-foreground/50 transition-all hover:scale-110"
                style={{ background: `linear-gradient(135deg, ${preset.primary} 50%, ${preset.accent} 50%)` }} />
            </button>
          ))}
        </div>
      </div>

      {/* Color Fields */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">{uiLang === 'ku' ? 'ڕەنگەکان' : uiLang === 'ar' ? 'الألوان' : 'Colors'}</label>
        <div className="space-y-2">
          {colorFields.map((cf) => (
            <div key={cf.key} className="flex items-center gap-2">
              <label className="text-xs font-medium min-w-[65px] text-muted-foreground">{cf.label}</label>
              <div className="flex items-center gap-1.5 flex-1">
                <input type="color" value={cf.value} onChange={(e) => updateColor(cf.key, e.target.value)} className="w-7 h-7 rounded-md cursor-pointer border border-border p-0.5" />
                <Input type="text" value={cf.value} onChange={(e) => updateColor(cf.key, e.target.value)} className="flex-1 h-7 text-xs font-mono" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset */}
      <button onClick={() => updateCustomization({ colors: undefined, fontFamily: undefined, fontSize: undefined, logoSizeFront: undefined, logoSizeBack: undefined })}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-md hover:bg-accent/10">
        <RotateCcw size={12} />
        {uiLang === 'ku' ? 'گەڕانەوە بۆ بنەڕەت' : uiLang === 'ar' ? 'إعادة تعيين الكل' : 'Reset All'}
      </button>
    </div>
  );
};

export default BusinessCardEditor;
