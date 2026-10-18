/* Opt-in UI translations. Stored business values are never translated. */
(() => {
  'use strict';
  const storageKey='factory.uiLanguage', dictionaries={en:{},ur:{
    'Settings':'ترتیبات','App Language':'ایپ کی زبان','Factory Name':'فیکٹری کا نام',
    'Address':'پتہ','Phone Number':'فون نمبر','Low Stock Limit':'کم اسٹاک کی حد',
    'Receipt Paper Size':'رسید کے کاغذ کا سائز','Receipt Header':'رسید کی سرخی',
    'Receipt Footer':'رسید کا اختتامی متن','Thank You Message':'شکریہ کا پیغام',
    'Logo (upload image)':'لوگو (تصویر اپ لوڈ کریں)',
    'App Wallpaper (light background image on all cards)':'ایپ کا پس منظر (تمام کارڈز پر ہلکی تصویر)',
    'Remove Wallpaper':'پس منظر ہٹائیں','No wallpaper set — cards use plain background.':'پس منظر کی تصویر منتخب نہیں؛ کارڈز کا پس منظر سادہ ہے۔',
    'Units':'اکائیاں','Enter new unit':'نئی اکائی درج کریں','Add':'شامل کریں',
    '🔐 Owner Security':'🔐 مالک کی سیکیورٹی','Owner PIN':'مالک کا پن',
    'Protects Settings, Sales Bills, Shopkeepers / Khata and Audit Log in this browser session.':'اس براؤزر سیشن میں ترتیبات، فروخت کے بل، دکانداروں کے کھاتے اور آڈٹ لاگ کو محفوظ رکھتا ہے۔',
    'Lock Protected Sections Now':'محفوظ حصے ابھی لاک کریں','Save All Settings':'تمام ترتیبات محفوظ کریں',
    '🔐 Owner PIN':'🔐 مالک کا پن','Default PIN is':'ابتدائی پن ہے',
    '. You can change it here anytime.':'۔ آپ اسے یہاں کسی بھی وقت تبدیل کر سکتے ہیں۔',
    'New Owner PIN':'مالک کا نیا پن','Confirm New PIN':'نئے پن کی تصدیق',
    'Enter new PIN':'نیا پن درج کریں','Re-enter new PIN':'نیا پن دوبارہ درج کریں',
    'Change Owner PIN':'مالک کا پن تبدیل کریں','Sidebar Section Names':'سائیڈ بار کے حصوں کے نام',
    'custom name':'اپنی پسند کا نام','Save Section Names':'حصوں کے نام محفوظ کریں'
  }};
  const common={
    'Today Factory Summary':'آج کی فیکٹری کا خلاصہ','Whole Factory Materials':'پوری فیکٹری کا مواد',
    'Shoes Press Man & Stitch Man':'جوتوں کے پریس مین اور سلائی مین','Dashboard':'ڈیش بورڈ',
    'Materials / Stock':'مواد / اسٹاک','Workers':'کاریگر','Upper Mans Production':'اپر مین کی پیداوار',
    'Batam Mans Production':'باٹم مین کی پیداوار','Finished Man Production':'فنش مین کی پیداوار',
    'Material Distribution':'مواد کی تقسیم','Shoe Articles':'جوتوں کے آرٹیکلز','Sales Bills':'فروخت کے بل',
    'Shopkeepers / Khata':'دکاندار / کھاتہ','Gas Supplier':'گیس سپلائر','Shoe Box Suppliers':'جوتوں کے باکس سپلائرز',
    'Shoe Sole Suppliers':'جوتوں کے سول سپلائرز','Factory Sale':'فیکٹری کی فروخت',
    'Shoes, Magzi Dori & Batawa Suppliers Production':'جوتوں، مغزی ڈوری اور بٹوا سپلائرز کی پیداوار',
    'Home Laser and Stitch Man':'گھر کے لیزر اور سلائی مین','Shoes Label Man':'جوتوں کے لیبل مین',
    'Shoes Lamination Shops':'جوتوں کی لیمینیشن کی دکانیں','Shoes Laser Man':'جوتوں کے لیزر مین',
    'Transaction History':'لین دین کی تاریخ','Audit Log':'آڈٹ لاگ','Settings':'ترتیبات','Backup':'بیک اپ','Archive':'محفوظ شدہ ریکارڈ',
    'Menu Settings':'مینو کی ترتیبات','Dashboard Settings':'ڈیش بورڈ کی ترتیبات',
    'MATERIALS':'مواد','WORKERS':'کاریگر','ARTICLES':'آرٹیکلز',"TODAY'S DIST.":'آج کی تقسیم',
    'LOW STOCK':'کم اسٹاک','CUSTOMERS':'گاہک','NEW DISTRIBUTION':'نئی تقسیم','NEW ARTICLE':'نیا آرٹیکل','NEW BILL':'نیا بل','SETTINGS':'ترتیبات',
    'Save':'محفوظ کریں','Cancel':'منسوخ کریں','Close':'بند کریں','Edit':'ترمیم','Delete':'حذف کریں',
    'Add':'شامل کریں','Add New':'نیا شامل کریں','Remove':'ہٹائیں','View':'دیکھیں','Print':'پرنٹ کریں',
    'Search':'تلاش کریں','Apply':'لاگو کریں','Reset':'دوبارہ ترتیب دیں','Clear':'صاف کریں',
    'Back':'واپس','Next':'اگلا','Previous':'پچھلا','Details':'تفصیلات','History':'تاریخ',
    'Actions':'اقدامات','Action':'اقدام','Name':'نام','Date':'تاریخ','Time':'وقت','Date / Time':'تاریخ / وقت',
    'From':'سے','To':'تک','Start Date':'شروع کی تاریخ','End Date':'آخری تاریخ','Work Date':'کام کی تاریخ',
    'Today':'آج','Yesterday':'گزشتہ روز','This Week':'یہ ہفتہ','This Month':'یہ مہینہ',
    'Weekly':'ہفتہ وار','Monthly':'ماہانہ','All Time':'تمام عرصہ','Custom Date':'اپنی تاریخ',
    'Current Week':'موجودہ ہفتہ','Previous Week':'گزشتہ ہفتہ','Period':'مدت','Month':'مہینہ',
    'Worker':'کاریگر','Worker Name':'کاریگر کا نام','Worker Type':'کاریگر کی قسم','Category':'زمرہ',
    'Supplier':'سپلائر','Supplier Name':'سپلائر کا نام','Suppliers':'سپلائرز','Shopkeeper':'دکاندار',
    'Shopkeeper Name':'دکاندار کا نام','Customer':'گاہک','Customer Name':'گاہک کا نام',
    'Article':'آرٹیکل','Article Name':'آرٹیکل کا نام','Articles':'آرٹیکلز','Product':'مصنوعہ','Products':'مصنوعات',
    'Product Name':'مصنوعہ کا نام','Product List':'مصنوعات کی فہرست','Material':'مواد','Material Name':'مواد کا نام',
    'Materials':'مواد','Unit':'اکائی','Units':'اکائیاں','Custom Unit':'اپنی اکائی',
    'Quantity':'مقدار','Qty':'مقدار','Received':'وصول شدہ','Issued':'جاری شدہ','Returned':'واپس شدہ',
    'Stock':'اسٹاک','Current Stock':'موجودہ اسٹاک','Opening Stock':'ابتدائی اسٹاک',
    'Rate':'ریٹ','Rate Per Unit':'فی اکائی ریٹ','Price':'قیمت','Unit Price':'فی اکائی قیمت',
    'Amount':'رقم','Total':'کل','TOTAL':'کل','Subtotal':'ذیلی کل','Grand Total':'مجموعی کل',
    'Paid':'ادا شدہ','Paid Amount':'ادا شدہ رقم','Remaining':'باقی','Remaining Balance':'باقی رقم',
    'Balance':'بقایا','Opening Balance':'ابتدائی بقایا','Advance':'پیشگی','Payment':'ادائیگی','Payments':'ادائیگیاں',
    'Notes':'نوٹس','Note':'نوٹ','Description':'تفصیل','Address':'پتہ','Mobile':'موبائل','Phone':'فون',
    'Phone Number':'فون نمبر','Contact':'رابطہ','Location':'مقام','Status':'حالت',
    'Add Worker':'کاریگر شامل کریں','Edit Worker':'کاریگر میں ترمیم','Save Worker':'کاریگر محفوظ کریں',
    'Add Supplier':'سپلائر شامل کریں','Edit Supplier':'سپلائر میں ترمیم','Delete Supplier':'سپلائر حذف کریں',
    'Save Supplier':'سپلائر محفوظ کریں','Add Product':'مصنوعہ شامل کریں','Edit Product':'مصنوعہ میں ترمیم',
    'Save Product':'مصنوعہ محفوظ کریں','Add Article':'آرٹیکل شامل کریں','Edit Article':'آرٹیکل میں ترمیم',
    'Save Article':'آرٹیکل محفوظ کریں','Add Material':'مواد شامل کریں','Edit Material':'مواد میں ترمیم',
    'Save Material':'مواد محفوظ کریں','Create Bill':'بل بنائیں','Save Bill':'بل محفوظ کریں',
    'Create Voucher':'واؤچر بنائیں','Print Voucher':'واؤچر پرنٹ کریں','Save Receiving':'وصولی محفوظ کریں',
    'Latest Production':'تازہ پیداوار','Latest Receiving':'تازہ وصولی','Enter Production Details':'پیداوار کی تفصیلات درج کریں',
    'Back to Supplier':'سپلائر پر واپس','Back to Dashboard':'ڈیش بورڈ پر واپس','Receiving Summary':'وصولی کا خلاصہ',
    'Total Received':'کل وصول شدہ','Received Quantity':'وصول شدہ مقدار','Total Quantity':'کل مقدار',
    'Payment History':'ادائیگیوں کی تاریخ','Receive Date':'وصولی کی تاریخ','Bill Number':'بل نمبر',
    'Voucher Number':'واؤچر نمبر','Bill':'بل','Voucher':'واؤچر','Report':'رپورٹ','Reports':'رپورٹس',
    'Print Report':'رپورٹ پرنٹ کریں','Print Bill':'بل پرنٹ کریں','Download':'ڈاؤن لوڈ','Export':'برآمد کریں',
    'Import':'درآمد کریں','Restore':'بحال کریں','Refresh':'تازہ کریں','Select Article':'آرٹیکل منتخب کریں',
    'Select Worker':'کاریگر منتخب کریں','Select Supplier':'سپلائر منتخب کریں','Select Material':'مواد منتخب کریں',
    'Optional':'اختیاری','Required':'ضروری','Photo':'تصویر','Product Photo':'مصنوعہ کی تصویر',
    'Remove Photo':'تصویر ہٹائیں','Custom Fields':'اضافی خانے','Field Name':'خانے کا نام','Field Value':'خانے کی قدر',
    'Add Group':'گروپ شامل کریں','Group':'گروپ','Parent group':'مرکزی گروپ','Top level':'اوپری سطح',
    'Reset to Default Menu':'اصل مینو بحال کریں','New group name':'نئے گروپ کا نام',
    'Menu order and labels are saved in Settings. Renaming changes sidebar labels only.':'مینو کی ترتیب اور نام ترتیبات میں محفوظ ہوتے ہیں۔ نام بدلنے سے صرف سائیڈ بار کے عنوان بدلتے ہیں۔'
  };
  const keyFor=text=>'ui_'+String(text).replace(/[^A-Za-z0-9]/g,character=>'_'+character.codePointAt(0).toString(16)+'_');
  Object.entries(common).forEach(([english,urdu])=>{const key=keyFor(english);dictionaries.en[key]=english;dictionaries.ur[key]=urdu;});
  let language='en';
  try{if(localStorage.getItem(storageKey)==='ur')language='ur';}catch{}
  const t=(key,values={})=>String(dictionaries[language]?.[key]??dictionaries.en[key]??key).replace(/\{(\w+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);
  function apply(root=document){
    const find=selector=>[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
    find('[data-i18n]').forEach(node=>{const value=t(node.dataset.i18n);if(node.textContent!==value)node.textContent=value;node.lang=language;});
    find('[data-i18n-placeholder]').forEach(node=>{const value=t(node.dataset.i18nPlaceholder);if(node.getAttribute('placeholder')!==value)node.setAttribute('placeholder',value);});
    find('[data-i18n-scope]').forEach(node=>{node.lang=language;node.dir=language==='ur'?'rtl':'ltr';node.style.fontFamily=language==='ur'?"'Noto Naskh Arabic', 'Segoe UI', sans-serif":'';});
    find('[data-app-language]').forEach(node=>{node.value=language;});
  }
  function setLanguage(value,persist=true){
    if(value!=='en'&&value!=='ur')return false;
    if(persist){try{localStorage.setItem(storageKey,value);}catch{apply();return false;}}
    language=value;apply();window.dispatchEvent(new CustomEvent('factory-language-change',{detail:{language}}));return true;
  }
  window.factoryI18n={t,apply,setLanguage,keyFor,get language(){return language;},register(locale,entries){if(!['en','ur'].includes(locale))return;Object.assign(dictionaries[locale],entries);apply();}};
  document.addEventListener('change',event=>{if(event.target.matches('[data-app-language]'))setLanguage(event.target.value);});
  window.addEventListener('storage',event=>{if(event.key===storageKey)setLanguage(event.newValue==='ur'?'ur':'en',false);});
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)apply(node);}))).observe(document.body,{childList:true,subtree:true});
  apply();
})();
