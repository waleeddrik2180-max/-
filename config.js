/* =====================================================================
   إعدادات الموقع — عدّل هنا فقط
   كل نص وسعر ورابط في الموقع يأتي من هذا الملف.
   (يمكن أيضًا التعديل من داخل الموقع عبر «لوحة المالك» في أسفل الصفحة)
   ===================================================================== */
window.RASHFA_CONFIG = {

  /* الاسم والشعار — الاسم الحالي مؤقت.
     لوضع شعار جاهز: ضع مسار صورته في logoImage مثل 'logo.png' */
  brand: {
    name: 'رَشفة',
    tagline: 'ركن قهوة',
    logoImage: ''
  },

  currency: 'ر.س',

  /* الواجهة الرئيسية */
  hero: {
    eyebrow: 'ركن قهوة',
    titleA: 'كل رشفة',
    titleB: 'لحظة تستحق',
    text: 'قهوة تُحضَّر على مهل، وضيافة متنقّلة تصل إلى مناسبتك أينما كانت.',
    points: ['قهوة مختصة', 'ضيافة متنقّلة', 'حجز سهل عبر واتساب']
  },

  /* بيانات التواصل — اتركها فارغة وسيُخفى الزر أو الأيقونة المرتبطة بها.
     whatsapp: بصيغة 9665XXXXXXXX أو 05XXXXXXXX
     instagram / snapchat / tiktok / x: اسم الحساب أو الرابط الكامل
     mapsUrl: رابط الموقع من خرائط قوقل (اختياري)
     mapsEmbed: رابط تضمين الخريطة (اختياري — وإذا تُرك فارغًا تُعرض الخريطة من العنوان) */
  contact: {
    whatsapp: '',
    phone: '',
    instagram: '',
    snapchat: '',
    tiktok: '',
    x: '',
    address: '',
    mapsUrl: '',
    mapsEmbed: '',
    timezone: 'Asia/Riyadh'
  },

  /* ساعات العمل — ⚠️ قيم نموذجية للتجربة، عدّلها لتطابق ساعات الركن الفعلية.
     open: null يعني أن اليوم إجازة. الوقت بصيغة 24 ساعة. إذا كان الإغلاق بعد منتصف الليل
     اكتب مثلًا open: '16:00', close: '01:00' */
  hours: [
    { d: 'sat', label: 'السبت',    open: '16:00', close: '00:00' },
    { d: 'sun', label: 'الأحد',    open: '16:00', close: '00:00' },
    { d: 'mon', label: 'الاثنين',  open: '16:00', close: '00:00' },
    { d: 'tue', label: 'الثلاثاء', open: '16:00', close: '00:00' },
    { d: 'wed', label: 'الأربعاء', open: '16:00', close: '00:00' },
    { d: 'thu', label: 'الخميس',   open: '16:00', close: '00:00' },
    { d: 'fri', label: 'الجمعة',   open: '16:00', close: '00:00' }
  ],

  /* عن الركن — نص عام للتجربة، استبدله بقصة الركن الحقيقية */
  about: {
    eyebrow: 'عن الركن',
    title: 'قهوتنا تأتي إليك',
    p1: 'رَشفة مشروع قهوة متنقّل يرافق لقاءاتكم ومناسباتكم. نحضر إلى موقعكم بعد التنسيق المسبق، ونصنع مساحة ضيافة أنيقة حيث يجتمع الناس.',
    p2: 'نعتني بتفاصيل التحضير والتقديم، وننسّق حضور الركن بحسب المكان والموعد واحتياج المناسبة.',
    values: [
      { icon: 'cup',   title: 'جودة في كل كوب',   text: 'نهتم بالتفاصيل من التحضير حتى التقديم.' },
      { icon: 'heart', title: 'ضيافة بروح محلية', text: 'استقبال دافئ يشبه مجالسنا.' },
      { icon: 'star',  title: 'حيثما تكون المناسبة', text: 'خدمة متنقلة تتكيّف مع موقع واحتياج كل مناسبة.' }
    ]
  },

  menuSection: {
    eyebrow: 'القائمة',
    title: 'اختر رشفتك',
    text: 'تصفّح المشروبات حسب التصنيف، أضف اختياراتك إلى السلة، ثم أرسل طلبك إلى رَشفة عبر واتساب.'
  },

  /* أسعار تجريبية للعرض فقط؛ استبدلها بالأسعار المعتمدة قبل النشر. */
  demoPrices: true,

  categories: [
    { id: 'hot',    label: 'القهوة الحارة', short: 'حار' },
    { id: 'cold',   label: 'القهوة الباردة', short: 'بارد' },
    { id: 'extras', label: 'الإضافات',       short: 'إضافة' }
  ],

  /* المشروبات
     price: اتركه فارغًا '' ولن يظهر السعر، أو اكتب الرقم فقط مثل '18'.
     image: لوضع صورة حقيقية للمشروب ضع مسارها مثل 'img/latte.jpg'
            (وإذا تُرك فارغًا تظهر الرسمة المرسومة). */
  menu: [
    { id: 'espresso',  cat: 'hot', name: 'إسبريسو',   desc: 'شوت مركّز بقوام غني وكريما ذهبية.', price: '12', image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=82', art: { kind: 'espresso' } },
    { id: 'americano', cat: 'hot', name: 'أمريكانو',  desc: 'إسبريسو ممدود بالماء الساخن لكوب خفيف وصافٍ.', price: '14', image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=82', art: { kind: 'cup', coffee: '#4a2a18', foam: '#7a4a2c', latte: 'none' } },
    { id: 'cappuccino',cat: 'hot', name: 'كابتشينو',  desc: 'إسبريسو مع حليب مبخّر ورغوة كثيفة ورشّة كاكاو.', price: '18', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=900&q=82', art: { kind: 'cup', coffee: '#6b3f26', foam: '#f1e2c8', latte: 'none', dust: true } },
    { id: 'latte',     cat: 'hot', name: 'لاتيه',     desc: 'إسبريسو مع حليب مبخّر ناعم ورغوة خفيفة.', price: '18', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=82', art: { kind: 'cup', coffee: '#7a4a2c', foam: '#efdcc0', latte: 'heart' } },
    { id: 'flatwhite', cat: 'hot', name: 'فلات وايت', desc: 'إسبريسو مزدوج مع حليب مخملي وطبقة رغوة رقيقة.', price: '', image: '', art: { kind: 'cup', coffee: '#5e3822', foam: '#ead3b2', latte: 'leaf' } },
    { id: 'mocha',     cat: 'hot', name: 'موكا',      desc: 'إسبريسو وشوكولاتة وحليب مبخّر، حلاوة متوازنة.', price: '', image: '', art: { kind: 'cup', coffee: '#4a2a1a', foam: '#cda57f', latte: 'heart', band: '#3d5a45' } },
    { id: 'arabic',    cat: 'hot', name: 'قهوة عربية', desc: 'قهوة بالهيل على الطريقة العربية، تُقدَّم مع التمر.', price: '', image: '', art: { kind: 'finjan' } },
    { id: 'v60',       cat: 'hot', name: 'قهوة مقطّرة (V60)', desc: 'تحضير يدوي بطيء يُبرز نكهة الحبوب.', price: '', image: '', art: { kind: 'cup', coffee: '#5b3a22', foam: '#6b4529', latte: 'none', band: '#e2a63c' } },

    { id: 'icedlatte', cat: 'cold', name: 'آيس لاتيه',  desc: 'إسبريسو بارد فوق حليب وثلج، منعش وناعم.', price: '20', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=900&q=82', art: { kind: 'iced', layers: ['#6b3f26', '#efe0c4'] } },
    { id: 'icedamer',  cat: 'cold', name: 'آيس أمريكانو', desc: 'إسبريسو مع ماء بارد وثلج، خفيف ومنعش.', price: '18', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=82', art: { kind: 'iced', layers: ['#3d2314', '#5a3622'], straw: '#2f4b3b' } },
    { id: 'coldbrew',  cat: 'cold', name: 'كولد برو',   desc: 'قهوة منقوعة على البارد، ناعمة وقليلة الحموضة.', price: '', image: '', art: { kind: 'iced', layers: ['#2d1a10', '#3f2615'], straw: '#e2a63c' } },
    { id: 'icedmocha', cat: 'cold', name: 'آيس موكا',   desc: 'شوكولاتة وإسبريسو وحليب بارد بحلاوة محسوبة.', price: '', image: '', art: { kind: 'iced', layers: ['#c99a6b', '#7a4527', '#efe0c4'] } },
    { id: 'tonic',     cat: 'cold', name: 'إسبريسو تونك', desc: 'إسبريسو فوق تونك فوّار مع شريحة برتقال.', price: '', image: '', art: { kind: 'iced', layers: ['#3b2314', '#dfe9e2'], garnish: 'orange', straw: '#2f4b3b' } },

    { id: 'shot',   cat: 'extras', name: 'شوت إضافي',   desc: 'ضاعف قوة مشروبك بشوت إسبريسو إضافي.', price: '', image: '', art: { kind: 'shot' } },
    { id: 'milk',   cat: 'extras', name: 'بدائل الحليب', desc: 'حليب لوز أو شوفان بدلًا من الحليب العادي.', price: '', image: '', art: { kind: 'milk' } },
    { id: 'syrup',  cat: 'extras', name: 'نكهات',        desc: 'فانيلا أو كراميل أو بندق، أضفها لأي مشروب.', price: '', image: '', art: { kind: 'syrup', liquid: '#c9892f' } },
    { id: 'dates',  cat: 'extras', name: 'تمر',          desc: 'طبق تمر يُقدَّم بجانب قهوتك.', price: '', image: '', art: { kind: 'dates' } }
  ],

  /* المناسبات والضيافة — عدّل الخدمات لتطابق ما يقدّمه الركن فعلًا */
  events: {
    eyebrow: 'المناسبات والضيافة',
    title: 'قهوتنا في مناسبتك',
    text: 'أخبرنا عن مناسبتك ونجهّز لك ضيافة تليق بها. أرسل التفاصيل وسنتواصل معك عبر واتساب.',
    items: [
      { icon: 'cup',  title: 'ضيافة المناسبات',  text: 'قهوة وضيافة تليق بمناسباتك العائلية واجتماعاتك.' },
      { icon: 'star', title: 'فعاليات وشركات',   text: 'ركن قهوة لفعالياتك ومعارضك واجتماعات فريقك.' },
      { icon: 'gift', title: 'هدايا وتوزيعات',   text: 'تجهيزات قهوة وتمر مغلّفة بأناقة لمن تحب.' }
    ],
    types: ['مناسبة عائلية', 'حفل أو احتفال', 'فعالية أو معرض', 'اجتماع عمل', 'أخرى']
  },

  /* المعرض — الرسومات مؤقتة. لوضع صورة حقيقية ضع مسارها في src مثل 'img/1.jpg' */
  gallerySection: {
    eyebrow: 'المعرض',
    title: 'لقطات من الركن'
  },
  gallery: [
    { art: 'beans',   caption: 'حبوب القهوة',   src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=85', size: 'big'  },
    { art: 'topdown', caption: 'فنّ اللاتيه',   src: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1000&q=85', size: ''     },
    { art: 'pour',    caption: 'تحضير يدوي',    src: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1000&q=85', size: 'tall' },
    { art: 'dallah',  caption: 'ضيافة عربية',   src: '', size: 'wide' },
    { art: 'iced',    caption: 'منعش وبارد',    src: '', size: ''     },
    { art: 'dates',   caption: 'تمر وقهوة',     src: '', size: 'wide' }
  ]
};
