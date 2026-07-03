
import { Language } from '../types';

export const translations: Record<string, Record<Language, string>> = {
  // General
  'app.title': { en: 'Photo Printer', ku: 'فۆتۆ پرینتەر', ar: 'طابعة الصور' },
  'app.subtitle': { en: 'Professional Tool', ku: 'ئامرازی پیشەیی', ar: 'أداة احترافية' },
  'app.untitled': { en: 'Untitled', ku: 'بێناو', ar: 'بدون عنوان' },
  
  // Toast Messages
  'toast.saved': { en: 'Project saved successfully', ku: 'پڕۆژەکە پاشەکەوت کرا', ar: 'تم حفظ المشروع بنجاح' },
  'toast.saveFailed': { en: 'Failed to save project', ku: 'پاشەکەوتکردن سەرکەوتوو نەبوو', ar: 'فشل في حفظ المشروع' },
  'toast.projectOpened': { en: 'Project opened successfully', ku: 'پڕۆژەکە کرایەوە', ar: 'تم فتح المشروع بنجاح' },
  'toast.openFailed': { en: 'Failed to open project', ku: 'کردنەوەی پڕۆژە سەرکەوتوو نەبوو', ar: 'فشل في فتح المشروع' },
  'toast.cleared': { en: 'Project cleared', ku: 'پڕۆژەکە پاک کرایەوە', ar: 'تم مسح المشروع' },
  'toast.autoSaved': { en: 'Auto-saved', ku: 'خۆکار پاشەکەوت کرا', ar: 'تم الحفظ التلقائي' },
  'toast.updateAvailable': { en: 'Update available', ku: 'نوێکردنەوە بەردەستە', ar: 'تحديث متاح' },
  'toast.latestVersion': { en: 'Latest version', ku: 'کۆتا وەشان', ar: 'أحدث إصدار' },
  'toast.ok': { en: 'OK', ku: 'باشە', ar: 'حسناً' },
  'toast.offline': { en: 'You are offline', ku: 'ئۆفلاینیت', ar: 'أنت غير متصل' },
  'toast.online': { en: 'Back online', ku: 'گەڕایتەوە ئۆنلاین', ar: 'عدت للاتصال' },
  
  // Find & Replace
  'findReplace.title': { en: 'Find & Replace', ku: 'گەڕان و گۆڕین', ar: 'بحث واستبدال' },
  'findReplace.desc': { en: 'Find and replace text in titles and descriptions', ku: 'گەڕان و گۆڕینی دەق لە ناونیشان و وەسفەکان', ar: 'البحث عن النص واستبداله في العناوين والأوصاف' },
  'findReplace.find': { en: 'Find', ku: 'گەڕان', ar: 'بحث' },
  'findReplace.replace': { en: 'Replace with', ku: 'گۆڕین بە', ar: 'استبدال بـ' },
  'findReplace.findPlaceholder': { en: 'Text to find...', ku: 'دەقی گەڕان...', ar: 'النص للبحث...' },
  'findReplace.replacePlaceholder': { en: 'Replace with...', ku: 'گۆڕین بە...', ar: 'استبدال بـ...' },
  'findReplace.replaceAll': { en: 'Replace All', ku: 'گۆڕینی هەموو', ar: 'استبدال الكل' },
  'findReplace.replaced': { en: '{count} replacements made', ku: '{count} گۆڕین ئەنجام درا', ar: 'تم إجراء {count} استبدال' },
  'findReplace.replacedOne': { en: '1 replacement made', ku: '١ گۆڕین ئەنجام درا', ar: 'تم إجراء استبدال واحد' },
  'findReplace.notFound': { en: 'Text not found', ku: 'دەق نەدۆزرایەوە', ar: 'لم يتم العثور على النص' },
  'findReplace.enterText': { en: 'Please enter text to find', ku: 'تکایە دەقی گەڕان بنووسە', ar: 'الرجاء إدخال نص للبحث' },
  'findReplace.prev': { en: 'Previous', ku: 'پێشوو', ar: 'السابق' },
  'findReplace.next': { en: 'Next', ku: 'دواتر', ar: 'التالي' },
  'findReplace.replaceOne': { en: 'Replace', ku: 'گۆڕین', ar: 'استبدال' },
  'findReplace.caseSensitive': { en: 'Aa', ku: 'Aa', ar: 'Aa' },
  'findReplace.showReplace': { en: 'Replace', ku: 'گۆڕین', ar: 'استبدال' },
  
  // Header
  'nav.photos': { en: 'Photos & Reports', ku: 'وێنە و ڕاپۆرت', ar: 'الصور والتقارير' },
  'nav.businesscard': { en: 'Business Card', ku: 'کارتی بازرگانی', ar: 'بطاقة عمل' },
  'nav.invoice': { en: 'Invoice', ku: 'پسوڵە', ar: 'فاتورة' },
  'nav.idphoto': { en: 'ID Photos', ku: 'وێنەی معامەلات', ar: 'صور المعاملات' },
  'nav.resume': { en: 'Resume', ku: 'پێناسەنامە', ar: 'السيرة الذاتية' },
  'nav.qrcode': { en: 'QR Code', ku: 'QR کۆد', ar: 'رمز الاستجابة' },
  'nav.tasks': { en: 'Tasks & Notes', ku: 'ئەرکەکان و تێبینی', ar: 'المهام والملاحظات' },
  'nav.stickers': { en: 'Stickers & Labels', ku: 'ستیکەر و لایبڵ', ar: 'الملصقات والبطاقات' },
  'tasks.tab': { en: 'Tasks', ku: 'ئەرکەکان', ar: 'المهام' },
  'nav.envelope': { en: 'Envelope', ku: 'زەرف', ar: 'ظرف' },
  'tasks.title': { en: 'Tasks & Notes', ku: 'ئەرکەکان و تێبینییەکان', ar: 'المهام والملاحظات' },
  'tasks.add': { en: 'Add Task', ku: 'زیادکردنی ئەرک', ar: 'إضافة مهمة' },
  'tasks.taskTitle': { en: 'Task Title', ku: 'ناونیشانی ئەرک', ar: 'عنوان المهمة' },
  'tasks.notes': { en: 'Notes / Details', ku: 'تێبینی / وردەکاری', ar: 'ملاحظات / تفاصيل' },
  'tasks.reminder': { en: 'Reminder Time', ku: 'کاتی ئاگادارکردنەوە', ar: 'وقت التذكير' },
  'tasks.empty': { en: 'No tasks found. Add a new task above.', ku: 'هیچ ئەرکێک نییە. لە سەرەوە ئەرکێکی نوێ زیاد بکە.', ar: 'لا توجد مهام. أضف مهمة جديدة أعلاه.' },
  'tasks.save': { en: 'Save Task', ku: 'پاشەکەوتکردنی ئەرک', ar: 'حفظ المهمة' },
  'tasks.delete': { en: 'Delete Task', ku: 'سڕینەوەی ئەرک', ar: 'حذف المهمة' },
  'tasks.completed': { en: 'Completed', ku: 'تەواوکراو', ar: 'مكتمل' },
  'notes.title': { en: 'Notes', ku: 'تێبینییەکان', ar: 'ملاحظات' },
  'notes.add': { en: 'Add Note', ku: 'زیادکردنی تێبینی', ar: 'إضافة ملاحظة' },
  'notes.noteTitle': { en: 'Note Title', ku: 'ناونیشانی تێبینی', ar: 'عنوان الملاحظة' },
  'notes.content': { en: 'Content', ku: 'ناوەڕۆک', ar: 'محتوى' },
  'notes.empty': { en: 'No notes found. Create a new note above.', ku: 'هیچ تێبینییەک نییە. تێبینییەکی نوێ زیاد بکە.', ar: 'لا توجد ملاحظات. أضف ملاحظة جديدة.' },
  'notes.save': { en: 'Save Note', ku: 'پاشەکەوتکردنی تێبینی', ar: 'حفظ الملاحظة' },
  'toast.comingSoon': { en: 'Coming Soon', ku: 'بەم زووانە دێت', ar: 'قريباً' },
  'action.clear': { en: 'Clear All', ku: 'پاککردنەوە', ar: 'مسح الكل' },
  'action.print': { en: 'Print', ku: 'چاپکردن', ar: 'طباعة' },
  'action.download': { en: 'Download', ku: 'دابەزاندن', ar: 'تنزيل' },
  'action.save': { en: 'Save', ku: 'پاشەکەوتکردن', ar: 'حفظ' },
  'action.saveAs': { en: 'Save As', ku: 'پاشەکەوتکردن وەک', ar: 'حفظ باسم' },
  'action.saveProject': { en: 'Save Project', ku: 'پاشەکەوتکردنی پڕۆژە', ar: 'حفظ المشروع' },
  'action.openProject': { en: 'Open Project', ku: 'کردنەوەی پڕۆژە', ar: 'فتح المشروع' },
  'action.checkUpdates': { en: 'Check for Updates', ku: 'گەڕان بۆ نوێکردنەوە', ar: 'التحقق من التحديثات' },
  'nav.settings': { en: 'Settings', ku: 'ڕێکخستنەکان', ar: 'الإعدادات' },

  // Settings Tabs
  'settings.general': { en: 'General', ku: 'گشتی', ar: 'عام' },
  'settings.visibility': { en: 'Visibility', ku: 'پیشاندان', ar: 'الرؤية' },
  'settings.branding': { en: 'Branding', ku: 'براندینگ', ar: 'العلامة التجارية' },
  'settings.configuration': { en: 'Configuration', ku: 'ڕێکخستن', ar: 'التكوين' },
  
  // Settings - General Tab
  'settings.language': { en: 'Language', ku: 'زمان', ar: 'اللغة' },
  'settings.typography': { en: 'Typography', ku: 'تایپۆگرافی', ar: 'الطباعة' },
  'settings.titleFont': { en: 'Title Font (px)', ku: 'قەبارەی ناونیشان', ar: 'خط العنوان' },
  'settings.textFont': { en: 'Text Font (px)', ku: 'قەبارەی دەق', ar: 'خط النص' },
  'settings.defaultFont': { en: 'Default Font', ku: 'فۆنتی دیفۆڵت', ar: 'الخط الافتراضي' },
  'settings.sectionView': { en: 'Section View', ku: 'سێکشنی پەڕەکان', ar: 'عرض القسم' },
  'settings.pagesPerSection': { en: 'Pages per section', ku: 'ژمارەی پەڕەکان لە سێکشن', ar: 'صفحات لكل قسم' },
  'settings.pagesPerSectionDesc': { en: 'How many pages to show at once', ku: 'چەند پەڕە لە یەک کاتدا پیشان بدات', ar: 'كم صفحة تظهر في وقت واحد' },
  
  // Settings - Auto Save
  'settings.autoSave': { en: 'Auto Save', ku: 'پاشەکەوتی خۆکار', ar: 'الحفظ التلقائي' },
  'settings.autoSaveEnabled': { en: 'Enable Auto Save', ku: 'چالاککردنی پاشەکەوتی خۆکار', ar: 'تفعيل الحفظ التلقائي' },
  'settings.autoSaveInterval': { en: 'Save every (minutes)', ku: 'پاشەکەوت هەر (خولەک)', ar: 'حفظ كل (دقائق)' },
  'settings.autoSaveDesc': { en: 'Automatically save project at regular intervals', ku: 'پڕۆژەکە بە شێوەیەکی خۆکار پاشەکەوت دەکات', ar: 'حفظ المشروع تلقائياً على فترات منتظمة' },
  
  // Settings - AI
  'settings.ai': { en: 'AI Settings', ku: 'ڕێکخستنی زیرەکی دەستکرد', ar: 'إعدادات الذكاء الاصطناعي' },
  'settings.apiKeyPlaceholder': { en: 'Enter your Gemini API key...', ku: 'کلیلی API ی Gemini بنووسە...', ar: 'أدخل مفتاح API الخاص بـ Gemini...' },
  
  // Settings - Visibility Tab
  'settings.componentVisibility': { en: 'Component Visibility', ku: 'پیشاندانی پێکهاتەکان', ar: 'رؤية المكونات' },
  
  // Settings - Branding Tab
  'settings.identity': { en: 'Identity', ku: 'ناسنامە', ar: 'الهوية' },
  'settings.brandName': { en: 'Your Brand Name', ku: 'ناوی براندەکەت', ar: 'اسم علامتك التجارية' },
  'settings.footerDate': { en: 'Footer Date', ku: 'بەرواری پێ', ar: 'تاريخ التذييل' },
  'settings.accentColor': { en: 'Accent Theme Color', ku: 'ڕەنگی تەمای سەرەکی', ar: 'لون التمييز' },
  'settings.logoAsset': { en: 'Logo Asset', ku: 'لۆگۆ', ar: 'شعار' },
  'settings.noAsset': { en: 'No Asset Loaded', ku: 'هیچ لۆگۆیەک نییە', ar: 'لا يوجد شعار' },
  'settings.assetScale': { en: 'Asset Scale', ku: 'قەبارەی لۆگۆ', ar: 'حجم الشعار' },

  // Sidebar - Upload
  'upload.image': { en: 'Upload Image', ku: 'هەڵبژاردنی وێنە', ar: 'رفع صورة' },
  'upload.hint': { en: 'Or click empty slot on paper', ku: 'یان کرتە لەسەر بەشی بەتاڵ بکە', ar: 'أو انقر على الفتحة الفارغة على الورقة' },
  
  // Invoice Layout
  'invoice.pageLayout': { en: 'Page Layout', ku: 'شێوازی پەڕە', ar: 'تخطيط الصفحة' },
  'invoice.1invoice': { en: '1 Invoice', ku: '١ وەسڵ', ar: '١ فاتورة' },
  'invoice.2invoice': { en: '2 Invoice', ku: '٢ وەسڵ', ar: '٢ فاتورة' },
  'invoice.4invoice': { en: '4 Invoice', ku: '٤ وەسڵ', ar: '٤ فاتورة' },
  'invoice.numberingMode': { en: 'Numbering Mode', ku: 'شێوازی ژمارەکردن', ar: 'وضع الترقيم' },
  'invoice.allSame': { en: 'All Same', ku: 'هەموو یەکسان', ar: 'الكل متشابه' },
  'invoice.sequential': { en: 'Sequential', ku: 'دوای یەک', ar: 'تسلسلي' },
  'invoice.dragHint': { en: 'Drag the number on paper to reposition', ku: 'ژمارەکە ڕابکێشە بۆ گۆڕینی شوێن', ar: 'اسحب الرقم على الورقة لإعادة تحديد الموقع' },
  
  // Section Navigation
  'section.of': { en: 'of', ku: 'لە', ar: 'من' },
  'section.label': { en: 'Section', ku: 'سێکشن', ar: 'قسم' },

  // Sidebar Navigation
  'section.navigation': { en: 'Section Navigation', ku: 'ڕەتکردنی پەڕەکان', ar: 'التنقل بين الأقسام' },
  'section.currentView': { en: 'Current View', ku: 'بینینی ئێستا', ar: 'العرض الحالي' },

  // Invoice
  'invoice.config': { en: 'Invoice Configuration', ku: 'ڕێکخستنی پسوڵە', ar: 'تكوين الفاتورة' },
  'invoice.endNumber': { en: 'End Number', ku: 'ژمارەی کۆتایی', ar: 'رقم النهاية' },
  'invoice.startNumber': { en: 'Start Number', ku: 'ژمارەی دەستپێک', ar: 'رقم البداية' },
  'invoice.positioning': { en: 'Precision Positioning', ku: 'شوێنی ژمارە', ar: 'تحديد الموقع' },
  'invoice.size': { en: 'SIZE', ku: 'قەبارە', ar: 'الحجم' },

  // Print Modal
  'print.title': { en: 'Print Preview', ku: 'پێشبینینی چاپ', ar: 'معاينة الطباعة' },
  'print.selectPages': { en: 'Select pages to print', ku: 'پەڕەکان هەڵبژێرە بۆ چاپکردن', ar: 'حدد الصفحات للطباعة' },
  'print.pages': { en: 'Pages', ku: 'پەڕەکان', ar: 'الصفحات' },
  'print.placeholder': { en: 'e.g. 1-5, 8', ku: 'بۆ نموونە: ١-٥، ٨', ar: 'مثال: ١-٥، ٨' },
  'print.selected': { en: 'selected', ku: 'هەڵبژێردراو', ar: 'محدد' },
  'print.selectAll': { en: 'Select All', ku: 'هەڵبژاردنی هەموو', ar: 'تحديد الكل' },
  'print.clear': { en: 'Clear', ku: 'پاککردنەوە', ar: 'مسح' },
  'print.noPages': { en: 'No pages to print', ku: 'هیچ پەڕەیەک نییە بۆ چاپکردن', ar: 'لا توجد صفحات للطباعة' },
  'print.shiftHint': { en: 'Shift+Click to select range', ku: 'Shift+کرتە بۆ هەڵبژاردنی ڕیز', ar: 'Shift+انقر لتحديد النطاق' },

  // Confirmation Dialogs
  'confirm.save': { en: 'Save Project', ku: 'پاشەکەوتکردنی پڕۆژە', ar: 'حفظ المشروع' },
  'confirm.saveTitle': { en: 'Save Project', ku: 'پاشەکەوتکردنی پڕۆژە', ar: 'حفظ المشروع' },
  'confirm.saveMessage': { en: 'Do you want to save the current project?', ku: 'دەتەوێت پڕۆژەی ئێستا پاشەکەوت بکەیت؟', ar: 'هل تريد حفظ المشروع الحالي؟' },
  'confirm.saveDesc': { en: 'Do you want to save the current project?', ku: 'دەتەوێت پڕۆژەی ئێستا پاشەکەوت بکەیت؟', ar: 'هل تريد حفظ المشروع الحالي؟' },
  'confirm.saveAsTitle': { en: 'Save As', ku: 'پاشەکەوتکردن وەک', ar: 'حفظ باسم' },
  'confirm.saveAsDesc': { en: 'Save the project as a new file?', ku: 'پڕۆژەکە وەک فایلێکی نوێ پاشەکەوت بکەیت؟', ar: 'حفظ المشروع كملف جديد؟' },
  'confirm.open': { en: 'Open Project', ku: 'کردنەوەی پڕۆژە', ar: 'فتح المشروع' },
  'confirm.openTitle': { en: 'Open Project', ku: 'کردنەوەی پڕۆژە', ar: 'فتح المشروع' },
  'confirm.openMessage': { en: 'Opening a new project will replace the current one. Continue?', ku: 'کردنەوەی پڕۆژەی نوێ جێگای ئەمەی ئێستا دەگرێتەوە. بەردەوام بیت؟', ar: 'فتح مشروع جديد سيحل محل المشروع الحالي. هل تريد المتابعة؟' },
  'confirm.openDesc': { en: 'Opening a new project will replace the current one. Continue?', ku: 'کردنەوەی پڕۆژەی نوێ جێگای ئەمەی ئێستا دەگرێتەوە. بەردەوام بیت؟', ar: 'فتح مشروع جديد سيحل محل المشروع الحالي. هل تريد المتابعة؟' },
  'confirm.clear': { en: 'Clear All', ku: 'سڕینەوەی هەموو', ar: 'مسح الكل' },
  'confirm.clearTitle': { en: 'Clear All', ku: 'سڕینەوەی هەموو', ar: 'مسح الكل' },
  'confirm.clearMessage': { en: 'Are you sure you want to delete all photos and data?', ku: 'دڵنیایت لە سڕینەوەی هەموو وێنەکان و داتاکان؟', ar: 'هل أنت متأكد من حذف جميع الصور والبيانات؟' },
  'confirm.clearDesc': { en: 'Are you sure you want to delete all photos and data?', ku: 'دڵنیایت لە سڕینەوەی هەموو وێنەکان و داتاکان؟', ar: 'هل أنت متأكد من حذف جميع الصور والبيانات؟' },
  'confirm.clearResumeTitle': { en: 'Clear Resume', ku: 'سڕینەوەی سیڤی', ar: 'مسح السيرة الذاتية' },
  'confirm.clearResumeDesc': { en: 'Are you sure you want to clear all resume data? This action cannot be undone.', ku: 'دڵنیایت لە سڕینەوەی هەموو زانیاریەکانی سیڤی؟ ئەم کردارە ناگەڕێتەوە.', ar: 'هل أنت متأكد من مسح جميع بيانات السيرة الذاتية؟ لا يمكن التراجع عن هذا الإجراء.' },
  'confirm.yes': { en: 'Yes', ku: 'بەڵێ', ar: 'نعم' },
  'confirm.no': { en: 'No', ku: 'نەخێر', ar: 'لا' },

  // ID Photo
  'idphoto.orManual': { en: 'or add manual', ku: 'یان بە دەستی زیاد بکە', ar: 'أو أضف يدوياً' },
  'idphoto.pageLayout': { en: 'Page Layout', ku: 'شێوازی پەڕە', ar: 'تخطيط الصفحة' },

  // Sidebar
  'section.grid': { en: 'Grid Layout', ku: 'شێوازی گریدی', ar: 'تخطيط الشبكة' },
  'section.cards': { en: 'Card Actions', ku: 'کردارەکانی کارت', ar: 'إجراءات البطاقة' },
  'section.doc': { en: 'Document Info', ku: 'زانیاری بەڵگەنامە', ar: 'معلومات المستند' },
  'section.branding': { en: 'Branding', ku: 'بۆندسازی', ar: 'العلامة التجارية' },
  'section.idphoto': { en: 'ID Photo AI Processor', ku: 'زیرەکی دەستکردی وێنەی معامەلات', ar: 'معالج صور المعاملات بالذكاء الاصطناعي' },
  'section.templates': { en: 'Templates', ku: 'تێمپلەیتەکان', ar: 'القوالب' },
  'section.resumeSections': { en: 'Resume Sections', ku: 'بەشەکانی سیڤی', ar: 'أقسام السيرة الذاتية' },
  
  'layout.1': { en: '1 Photo', ku: '١ وێنە', ar: '١ صورة' },
  'layout.2': { en: '2 Photos (Vertical)', ku: '٢ وێنە (ستوونی)', ar: '٢ صور (عمودي)' },
  'layout.2col': { en: '2 Photos (Side by Side)', ku: '٢ وێنە (تەنیشت بە تەنیشت)', ar: '٢ صور (جانب إلى جانب)' },
  'layout.4': { en: '4 Photos', ku: '٤ وێنە', ar: '٤ صور' },
  'layout.1text': { en: '1 Photo + Text', ku: '١ وێنە + دەق', ar: '١ صورة + نص' },
  'layout.1text-side': { en: '1 Photo + Text (Side)', ku: '١ وێنە + دەق (تەنیشت)', ar: '١ صورة + نص (جانب)' },
  'layout.2text': { en: '2 Photos + 2 Texts', ku: '٢ وێنە + ٢ دەق', ar: '٢ صور + ٢ نصوص' },
  'layout.onlytext': { en: 'Only Text', ku: 'تەنها دەق', ar: 'نص فقط' },
  'layout.idphoto': { en: 'ID Grid (24 Photos)', ku: 'تۆڕی معامەلات (٢٤ وێنە)', ar: 'شبكة المعاملات (٢٤ صورة)' },

  'card.desc': { 
    en: 'Select a photo from the main area, then click "Fill Fronts" or "Fill Backs" to populate the card slots.', 
    ku: 'وێنەیەک لە بەشی سەرەکی هەڵبژێرە، پاشان "پڕکردنەوەی ڕووەکان" یان "پڕکردنەوەی پشتەکان" داگرە.', 
    ar: 'اختر صورة من المنطقة الرئيسية، ثم انقر فوق "ملء الوجهات" أو "ملء الخلفيات".' 
  },
  'card.fillFront': { en: 'Fill Fronts', ku: 'پڕکردنەوەی ڕووەکان', ar: 'ملء الوجهات' },
  'card.fillBack': { en: 'Fill Backs', ku: 'پڕکردنەوەی پشتەکان', ar: 'ملء الخلفيات' },
  'card.fillForm': { en: 'Fill Large Form', ku: 'پڕکردنەوەی فۆرمی گەورە', ar: 'ملء النموذج الكبير' },
  'card.fillSmall': { en: 'Fill Small Cards', ku: 'پڕکردنەوەی کارتە بچووکەکان', ar: 'ملء البطاقات الصغيرة' },
  'card.formLayout': { en: 'Form Layout', ku: 'شێوازی فۆرم', ar: 'تخطيط النموذج' },
  'card.formLayoutReverse': { en: 'Form Layout (Reversed)', ku: 'شێوازی فۆرم (پێچەوانە)', ar: 'تخطيط النموذج (معكوس)' },
  'card.gridLayout': { en: 'Grid Layout', ku: 'شێوازی تۆڕ', ar: 'تخطيط الشبكة' },

  'idphoto.desc': { 
    en: 'Upload a photo, and AI will automatically remove the background and crop it for official ID standards.', 
    ku: 'وێنەیەک بەرز بکەرەوە، زیرەکی دەستکرد باکگراوندەکە لادەبات و وێنەکە ئامادە دەکات بۆ معامەلات.', 
    ar: 'ارفع صورة، وسيقوم الذكاء الاصطناعي بإزالة الخلفية وقصها لمعايير الهوية الرسمية.' 
  },
  'idphoto.process': { en: 'Process with AI', ku: 'ئامادەکردن بە زیرەکی دەستکرد', ar: 'معالجة بالذكاء الاصطناعي' },

  'input.projectTitle': { en: 'Project Title', ku: 'ناونیشانی پڕۆژە', ar: 'عنوان المشروع' },
  'placeholder.projectTitle': { en: 'My New Project', ku: 'پڕۆژە نوێیەکەم', ar: 'مشروعي الجديد' },
  
  'setting.display': { en: 'Display Settings', ku: 'ڕێکخستنی پیشاندان', ar: 'إعدادات العرض' },
  'setting.showHeader': { en: 'Show Header Title', ku: 'ناونیشانی سەرەڕ', ar: 'إظهار العنوان' },
  'setting.showFooter': { en: 'Show Page Footer', ku: 'پێی پەڕە پیشان بدە', ar: 'إظهار تذييل الصفحة' },
  'setting.showBadges': { en: 'Show Photo Badges', ku: 'نیشانەی وێنەکان پیشان بدە', ar: 'إظهار شارات الصور' },
  'setting.showPageNum': { en: 'Show Page Numbers', ku: 'ژمارەی پەڕە', ar: 'أرقام الصفحات' },
  'setting.startPageNum': { en: 'Start Page Number', ku: 'ژمارەی دەستپێک', ar: 'رقم الصفحة الأولى' },
  'setting.showDate': { en: 'Show Date & User', ku: 'بەروار و بەکارهێنەر', ar: 'التاريخ والمستخدم' },
  'setting.showLogo': { en: 'Show Logo', ku: 'لۆگۆ پیشان بدە', ar: 'إظهار الشعار' },
  
  'input.createdBy': { en: 'Created By', ku: 'دروستکراوە لەلایەن', ar: 'تم الإنشاء بواسطة' },
  'label.badgeColor': { en: 'Badge Color', ku: 'ڕەنگی نیشانە', ar: 'لون الشارة' },
  'label.logo': { en: 'Logo', ku: 'لۆگۆ', ar: 'شعار' },
  'btn.upload': { en: 'Upload', ku: 'بارکردن', ar: 'رفع' },
  'btn.change': { en: 'Change', ku: 'گۆڕین', ar: 'تغيير' },
  'btn.remove': { en: 'Remove', ku: 'سڕینەوە', ar: 'إزالة' },
  'footer.version': { en: 'v2.0.0 • Photo Printer Pro', ku: 'وەشانی ٢.٠.٠ • فۆتۆ پرینتەر پڕۆ', ar: 'الإصدار ٢.٠.٠ • فوتو برينتر برو' },

  // DropZone
  'drop.title': { en: 'Add Photos', ku: 'زیادکردنی وێنە', ar: 'إضافة صور' },
  'drop.desc': { en: 'Drag & drop files here or', ku: 'ڕاکێشان و دانانی پەڕگەکان لێرە یان', ar: 'سحب وإسقاط الملفات هنا أو' },
  'drop.browse': { en: 'browse', ku: 'گەڕان', ar: 'تصفح' },
  'list.empty': { en: 'Write your text here...', ku: 'نوسینەکەت لێرە بنوسە...', ar: 'اكتب نصك هنا...' },

  // PhotoSlot
  'slot.empty': { en: 'Empty Slot', ku: 'شوێنی بەتاڵ', ar: 'فتحة فارغة' },
  'slot.rotate': { en: 'Rotate', ku: 'سوڕاندن', ar: 'تدوير' },
  'slot.edit': { en: 'Edit', ku: 'دەستکاری', ar: 'تعديل' },
  'slot.replace': { en: 'Replace', ku: 'گۆڕین', ar: 'استبدال' },
  'slot.remove': { en: 'Remove', ku: 'سڕینەوە', ar: 'إزالة' },

  // PhotoPage
  'ph.text.multi': { en: 'Write your text here...', ku: 'نوسینەکەت لێرە بنوسە...', ar: 'اكتب نصك هنا...' },
  'ph.text.single': { en: 'Write your text here...', ku: 'نوسینەکەت لێرە بنوسە...', ar: 'اكتب نصك هنا...' },
  'ph.text.only': { en: 'Click to start writing your report...', ku: 'کلیک بکە بۆ دەستپێکردنی نووسینی ڕاپۆرتەکەت...', ar: 'انقر لبدء كتابة تقريرك...' },
  'page.label': { en: 'Page', ku: 'پەڕەی', ar: 'صفحة' },
  'confirm.deletePage': { en: 'Are you sure you want to delete this page?', ku: 'دڵنیای لە سڕینەوەی ئەم پەڕەیە؟', ar: 'هل أنت متأكد من حذف هذه الصفحة؟' },

  // Editor
  'editor.title': { en: 'Editor Tools', ku: 'ئامرازەکانی دەستکاری', ar: 'أدوات المحرر' },
  'editor.select': { en: 'Select an object or layer', ku: 'تەنێک یان چینێک هەڵبژێرە', ar: 'حدد كائناً أو طبقة' },
  'btn.addText': { en: 'Add Text', ku: 'زیادکردنی دەق', ar: 'إضافة نص' },
  'btn.addShape': { en: 'Add Shape', ku: 'زیادکردنی شێوە', ar: 'إضافة شكل' },
  'editor.props': { en: 'Properties', ku: 'تایبەتمەندییەکان', ar: 'الخصائص' },
  'label.color': { en: 'Color', ku: 'ڕەنگ', ar: 'لون' },
  'btn.deleteObj': { en: 'Delete', ku: 'سڕینەوە', ar: 'حذف' },
  'btn.save': { en: 'Save & Apply', ku: 'خەزنکردن و جێبەجێکردن', ar: 'حفظ وتطبيق' },
  
  // Editor New
  'tool.select': { en: 'Select', ku: 'هەڵبژاردن', ar: 'تحديد' },
  'tool.crop': { en: 'Crop', ku: 'بڕین', ar: 'قص' },
  'tool.brush': { en: 'Brush', ku: 'فڵچە', ar: 'فرشاة' },
  'tool.line': { en: 'Line', ku: 'هێڵ', ar: 'خط' },
  'tool.blur': { en: 'Blur', ku: 'لێڵکردن', ar: 'تمويه' },
  'tool.removeBg': { en: 'Remove Background', ku: 'سڕینەوەی باکگراوند', ar: 'إزالة الخلفية' },
  'tool.perspective': { en: 'Perspective', ku: 'ڕوانگە', ar: 'منظور' },
  'tool.skew': { en: 'Skew', ku: 'لاردان', ar: 'إمالة' },
  
  // Background Removal Dialog
  'bgRemoval.downloading': { en: 'Downloading AI Model', ku: 'داونلۆدکردنی مۆدێلی AI', ar: 'تحميل نموذج الذكاء الاصطناعي' },
  'bgRemoval.processing': { en: 'Removing Background', ku: 'سڕینەوەی باکگراوند', ar: 'إزالة الخلفية' },
  'bgRemoval.downloadingDesc': { en: 'Please wait while the AI model is being downloaded. This only happens once.', ku: 'تکایە چاوەڕوان بە تاوەکوو مۆدێلی AI داونلۆد دەبێت. ئەمە تەنها یەک جار ڕوودەدات.', ar: 'يرجى الانتظار أثناء تحميل نموذج الذكاء الاصطناعي. هذا يحدث مرة واحدة فقط.' },
  'bgRemoval.processingDesc': { en: 'AI is analyzing and removing the background from your image.', ku: 'زیرەکی دەستکرد باکگراوندی وێنەکەت لادەدات.', ar: 'الذكاء الاصطناعي يحلل ويزيل الخلفية من صورتك.' },
  
  // Face Retouch
  'tool.faceRetouch': { en: 'Face Retouch', ku: 'دەستکاری ڕوخسار', ar: 'تنقيح الوجه' },
  'faceRetouch.noFace': { en: 'No face detected in the image', ku: 'هیچ ڕوخسارێک نەدۆزرایەوە لە وێنەکەدا', ar: 'لم يتم اكتشاف وجه في الصورة' },
  'faceRetouch.processing': { en: 'Retouching Face', ku: 'دەستکاری ڕوخسار', ar: 'تنقيح الوجه' },
  'faceRetouch.processingDesc': { en: 'AI is smoothing and enhancing the face.', ku: 'زیرەکی دەستکرد ڕوخسارەکە نەرم و جوان دەکات.', ar: 'الذكاء الاصطناعي ينعم ويحسن الوجه.' },
  
  'action.close': { en: 'Close', ku: 'داخستن', ar: 'إغلاق' },
  
  'action.apply': { en: 'Apply', ku: 'جێبەجێکردن', ar: 'تطبيق' },
  'action.cancel': { en: 'Cancel', ku: 'پاشگەزبوونەوە', ar: 'إلغاء' },
  'tab.layers': { en: 'Layers', ku: 'چینەکان', ar: 'طبقات' },
  'tab.props': { en: 'Properties', ku: 'تایبەتمەندی', ar: 'خصائص' },
  
  'prop.fill': { en: 'Fill', ku: 'پڕکردنەوە', ar: 'تعبئة' },
  'prop.stroke': { en: 'Border/Stroke', ku: 'چوارچێوە', ar: 'حدود' },
  'prop.width': { en: 'Thickness', ku: 'ئەستووری', ar: 'سماكة' },
  'prop.opacity': { en: 'Opacity', ku: 'ڕوونی', ar: 'شفافية' },
  'prop.rotation': { en: 'Rotation', ku: 'سوڕاندن', ar: 'تدوير' },
  'prop.blur': { en: 'Blur', ku: 'لێڵ', ar: 'ضبابية' },
  
  'prop.content': { en: 'Content', ku: 'ناوەڕۆک', ar: 'محتوى' },
  'prop.style': { en: 'Style', ku: 'شێواز', ar: 'نمط' },
  'prop.layout': { en: 'Layout', ku: 'پێکهاتە', ar: 'تخطيط' },
  'action.front': { en: 'Bring to Front', ku: 'هێنانە پێشەوە', ar: 'إحلال في المقدمة' },
  'action.back': { en: 'Send to Back', ku: 'ناردنە دواوە', ar: 'إرسال إلى الخلف' },
  'shape.rect': { en: 'Rectangle', ku: 'چوارگۆشە', ar: 'مستطيل' },
  'shape.circle': { en: 'Circle', ku: 'بازنە', ar: 'دائرة' },

  // Toolbar
  'font.label': { en: 'Font', ku: 'فۆنت', ar: 'خط' },
  'font.sans': { en: 'Sans', ku: 'سادە', ar: 'Sans' },
  'font.kufi': { en: 'Kufi', ku: 'کوفی', ar: 'كوفي' },
  'font.naskh': { en: 'Naskh', ku: 'نەسخ', ar: 'نسخ' },
  'font.arial': { en: 'Arial', ku: 'ئاریەڵ', ar: 'Arial' },
  'font.mono': { en: 'Mono', ku: 'مۆنۆ', ar: 'Mono' },
  
  'align.left': { en: 'Left', ku: 'چەپ', ar: 'يسار' },
  'align.center': { en: 'Center', ku: 'ناوەڕاست', ar: 'وسط' },
  'align.right': { en: 'Right', ku: 'ڕاست', ar: 'يمين' },
  'align.justify': { en: 'Justify', ku: 'ڕێکخستن', ar: 'ضبط' },

  'fmt.bold': { en: 'Bold', ku: 'تۆخ', ar: 'غامق' },
  'fmt.italic': { en: 'Italic', ku: 'لار', ar: 'مائل' },
  'fmt.underline': { en: 'Underline', ku: 'هێڵ بەژێرداهاتوو', ar: 'تسطير' },
  'fmt.size': { en: 'Font Size', ku: 'قەبارەی فۆنت', ar: 'حجم الخط' },
  'fmt.align': { en: 'Alignment', ku: 'ڕێکخستن', ar: 'محاذاة' },
  
  'layer.lock': { en: 'Lock layer', ku: 'قفڵکردنی لایەر', ar: 'قفل الطبقة' },
  'layer.unlock': { en: 'Unlock layer', ku: 'کردنەوەی قفڵ', ar: 'فتح القفل' },
  'layer.locked': { en: 'Locked', ku: 'قفڵکراوە', ar: 'مقفل' },
  'layer.image': { en: 'Image', ku: 'وێنە', ar: 'صورة' },
  'layer.background': { en: 'Background', ku: 'باکگراوند', ar: 'خلفية' },
  
  'filter.brightness': { en: 'Brightness', ku: 'ڕوناکی', ar: 'السطوع' },
  'filter.contrast': { en: 'Contrast', ku: 'کۆنتراست', ar: 'التباين' },
  'filter.saturation': { en: 'Saturation', ku: 'تێری ڕەنگ', ar: 'التشبع' },
  'filter.hueRotate': { en: 'Hue', ku: 'ڕەنگ', ar: 'تدرج اللون' },
  'filter.blur': { en: 'Blur', ku: 'تاری', ar: 'ضبابية' },
  'filter.grayscale': { en: 'Grayscale', ku: 'ڕەش و سپی', ar: 'تدرج رمادي' },
  'filter.sepia': { en: 'Sepia', ku: 'قاوەیی', ar: 'بني داكن' },
  'filter.reset': { en: 'Reset All', ku: 'ڕیسێت هەموو', ar: 'إعادة الكل' },
  'filter.adjustments': { en: 'Adjustments', ku: 'ڕێکخستنەکان', ar: 'التعديلات' },
  
  'liquify.title': { en: 'Liquify', ku: 'شلکردن', ar: 'تسييل' },
  'liquify.mode': { en: 'Mode', ku: 'شێواز', ar: 'الوضع' },
  'liquify.push': { en: 'Push', ku: 'پاڵنان', ar: 'دفع' },
  'liquify.bloat': { en: 'Bloat', ku: 'گەورەکردن', ar: 'تضخيم' },
  'liquify.pinch': { en: 'Pinch', ku: 'چمکاندن', ar: 'قرص' },
  'liquify.twirlCW': { en: 'Twirl CW', ku: 'خولانەوە', ar: 'لف' },
  'liquify.twirlCCW': { en: 'Twirl CCW', ku: 'خولانەوە', ar: 'لف عكسي' },
  'liquify.brushSize': { en: 'Brush Size', ku: 'قەبارەی برس', ar: 'حجم الفرشاة' },
  'liquify.strength': { en: 'Strength', ku: 'هێز', ar: 'القوة' },
  'liquify.preview': { en: 'Brush Preview', ku: 'پێشبینینی برس', ar: 'معاينة الفرشاة' },
  'liquify.reset': { en: 'Reset', ku: 'ڕیسێت', ar: 'إعادة' },
  'liquify.loading': { en: 'Loading...', ku: 'چاوەڕوان بە...', ar: 'جاري التحميل...' },
  'tool.liquify': { en: 'Liquify', ku: 'شلکردن', ar: 'تسييل' },
  
  // Manual Eraser
  'tool.manualEraser': { en: 'Manual Eraser', ku: 'سڕەرەوەی دەستی', ar: 'ممحاة يدوية' },
  'eraser.description': { en: 'Manually erase parts of the image', ku: 'بە دەستی بەشەکانی وێنەکە بسڕەوە', ar: 'امسح أجزاء من الصورة يدوياً' },
  'eraser.size': { en: 'Eraser Size', ku: 'قەبارەی سڕەرەوە', ar: 'حجم الممحاة' },
  'eraser.preview': { en: 'Eraser Preview', ku: 'پێشبینینی سڕەرەوە', ar: 'معاينة الممحاة' },
  'eraser.reset': { en: 'Reset', ku: 'ڕیسێت', ar: 'إعادة' },
  
  // Add Image tool
  'tool.addImage': { en: 'Add Image', ku: 'زیادکردنی وێنە', ar: 'إضافة صورة' },
  
  // ID Photo Position
  'idphoto.position': { en: 'A6 Position', ku: 'شوێنی A6', ar: 'موقع A6' },
  'idphoto.topLeft': { en: 'Top Left', ku: 'سەرەوە چەپ', ar: 'أعلى اليسار' },
  'idphoto.topRight': { en: 'Top Right', ku: 'سەرەوە ڕاست', ar: 'أعلى اليمين' },
  'idphoto.bottomLeft': { en: 'Bottom Left', ku: 'خوارەوە چەپ', ar: 'أسفل اليسار' },
  'idphoto.bottomRight': { en: 'Bottom Right', ku: 'خوارەوە ڕاست', ar: 'أسفل اليمين' },
  'idphoto.center': { en: 'Top & Center', ku: 'سەرەوە و ناوەڕاست', ar: 'أعلى ووسط' },
  'idphoto.top': { en: 'Top', ku: 'سەرەوە', ar: 'أعلى' },
  'idphoto.bottom': { en: 'Bottom', ku: 'خوارەوە', ar: 'أسفل' },
  'idphoto.left': { en: 'Left', ku: 'چەپ', ar: 'يسار' },
  'idphoto.right': { en: 'Right', ku: 'ڕاست', ar: 'يمين' },
  'idphoto.slotCount': { en: 'Slots per A6', ku: 'ژمارەی شوێن بۆ هەر A6', ar: 'عدد الفتحات لكل A6' },
  'idphoto.slots': { en: 'slots', ku: 'شوێن', ar: 'فتحات' },
  'idphoto.copyDialog.title': { en: 'Add Photo Copies', ku: 'زیادکردنی کۆپی وێنە', ar: 'إضافة نسخ الصورة' },
  'idphoto.copyDialog.description': { en: 'How many copies of this photo do you want to add to the A6 section?', ku: 'چەند کۆپییەک لەم وێنەیە دەتەوێت زیاد بکەیت بۆ بەشی A6؟', ar: 'كم عدد النسخ من هذه الصورة تريد إضافتها إلى قسم A6؟' },
  'idphoto.copyDialog.copies': { en: 'Number of copies', ku: 'ژمارەی کۆپی', ar: 'عدد النسخ' },
  'idphoto.copyDialog.add': { en: 'Add', ku: 'زیادکردن', ar: 'إضافة' },
  'idphoto.copyDialog.cancel': { en: 'Cancel', ku: 'پاشگەزبوونەوە', ar: 'إلغاء' },
  
  // Crop Tool
  'crop.aspectRatio': { en: 'Aspect Ratio', ku: 'ڕێژەی لا', ar: 'نسبة العرض' },
  'crop.free': { en: 'Free', ku: 'ئازاد', ar: 'حر' },
  'crop.original': { en: 'Original', ku: 'ئەسڵی', ar: 'أصلي' },
  'crop.idphoto': { en: 'ID Photo', ku: 'وێنەی معامەلات', ar: 'صورة المعاملات' },
  'crop.square': { en: 'Square', ku: 'چوارگۆشە', ar: 'مربع' },

  // Wireless Transfer
  'transfer.title': { en: 'Wireless Transfer', ku: 'گواستنەوەی بێسیم', ar: 'نقل لاسلكي' },
  'transfer.description': { en: 'Send photos from your phone without cables', ku: 'وێنە بنێرە لە مۆبایلەوە بەبێ کێبڵ', ar: 'أرسل الصور من هاتفك بدون أسلاك' },
  'transfer.tab.app': { en: 'App Workspace', ku: 'بۆ ناو بەرنامە', ar: 'لمساحة التطبيق' },
  'transfer.tab.folder': { en: 'PC Folder', ku: 'بۆ ناو فۆڵدەر', ar: 'لمجلد الكمبيوتر' },
  'transfer.selectFolder': { en: 'Select Destination Folder', ku: 'هەڵبژاردنی فۆڵدەری مەبەست', ar: 'اختر مجلد الوجهة' },
  'transfer.folderSelected': { en: 'Folder Selected', ku: 'فۆڵدەر هەڵبژێردرا', ar: 'تم تحديد المجلد' },
  'transfer.start': { en: 'Start Wireless Transfer', ku: 'دەستپێکردنی گواستنەوەی بێسیم', ar: 'بدء النقل اللاسلكي' },
  'transfer.stop': { en: 'Stop Server', ku: 'وەستاندنی سێرڤەر', ar: 'إيقاف الخادم' },
  'transfer.scanning': { en: 'Scan this QR code with your phone', ku: 'ئەم QR کۆدە بە مۆبایلەکەت بخوێنەرەوە', ar: 'امسح رمز QR بهاتفك' },
  'transfer.connected': { en: 'Server is running', ku: 'سێرڤەر کاردەکات', ar: 'الخادم يعمل' },
  'transfer.waiting': { en: 'Waiting for photos...', ku: 'چاوەڕوانی وێنەکانە...', ar: 'في انتظار الصور...' },
  'transfer.received': { en: 'Photo received!', ku: 'وێنە وەرگیرا!', ar: 'تم استلام الصورة!' },
  'transfer.hint': { en: 'Make sure your phone and computer are on the same WiFi network', ku: 'دڵنیابە لەوەی مۆبایل و کۆمپیوتەرەکەت لە هەمان وایفایدان', ar: 'تأكد أن هاتفك وحاسوبك على نفس شبكة WiFi' },
  'transfer.photosReceived': { en: '{count} photo(s) received', ku: '{count} وێنە وەرگیرا', ar: 'تم استلام {count} صورة' },
  'transfer.error': { en: 'Failed to start server', ku: 'سێرڤەر دەست پێ نەکرد', ar: 'فشل في بدء الخادم' },
  'transfer.startShort': { en: 'From Phone', ku: 'لە مۆبایلەوە', ar: 'من الهاتف' },
};

export const getTranslation = (key: string, lang: Language) => {
  return translations[key]?.[lang] || translations[key]?.['en'] || key;
};
