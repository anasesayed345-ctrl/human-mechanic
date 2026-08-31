// Human Mechanic - Database Layer (localStorage)
// All data is dynamic - no hardcoded products in HTML

const DB = {
  keys: {
    products: 'hm_products',
    contacts: 'hm_contacts',
    settings: 'hm_settings',
    admin: 'hm_admin',
    categories: 'hm_categories'
  },

  defaults: {
    categories: [
      { id: 'physio', name: 'العلاج الطبيعي', icon: '🦴', name_en: 'Physiotherapy', color: '#0EA5A0' },
      { id: 'pharmacy', name: 'الصيدلة', icon: '💊', name_en: 'Pharmacy', color: '#2563EB' },
      { id: 'dental', name: 'الأسنان', icon: '🦷', name_en: 'Dental', color: '#7C3AED' }
    ],
    settings: {
      whatsappNumber: '201000000000',
      storeName: 'Human Mechanic',
      storeTagline: 'مستلزمات طبية احترافية',
      currency: 'ج.م',
      logoText: 'HUMAN MECHANICS'
    },
    admin: {
      username: 'admin',
      email: 'admin@human-mechanic.com',
      password: 'admin123'
    },
    contacts: [
      { id: '1', platform: 'WhatsApp', url: 'https://wa.me/201000000000', active: true, order: 1 },
      { id: '2', platform: 'Facebook', url: 'https://facebook.com', active: true, order: 2 },
      { id: '3', platform: 'Instagram', url: 'https://instagram.com', active: true, order: 3 }
    ],
    products: []
  },

  init() {
    if (!localStorage.getItem(this.keys.categories)) {
      localStorage.setItem(this.keys.categories, JSON.stringify(this.defaults.categories));
    }
    if (!localStorage.getItem(this.keys.settings)) {
      localStorage.setItem(this.keys.settings, JSON.stringify(this.defaults.settings));
    }
    if (!localStorage.getItem(this.keys.admin)) {
      localStorage.setItem(this.keys.admin, JSON.stringify(this.defaults.admin));
    }
    if (!localStorage.getItem(this.keys.contacts)) {
      localStorage.setItem(this.keys.contacts, JSON.stringify(this.defaults.contacts));
    }
    if (!localStorage.getItem(this.keys.products)) {
      localStorage.setItem(this.keys.products, JSON.stringify(this.defaults.products));
    }
    // Seed demo products only if empty and first time (can be deleted fully via admin)
    const prods = this.getProducts();
    if (prods.length === 0 && !localStorage.getItem('hm_seeded')) {
      const seed = [
        {
          id: 'p1',
          name: 'جهاز مساج كهربائي للعلاج الطبيعي',
          name_en: 'Electric Massage Device',
          price: 1250,
          category: 'physio',
          image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
          description: 'جهاز مساج احترافي لتخفيف آلام العضلات والمفاصل، مثالي لجلسات العلاج الطبيعي المنزلي والعيادات. يعمل بتقنية الاهتزاز العميق مع 6 مستويات للسرعة.',
          details: 'الماركة: MediPro | القوة: 30W | يتضمن 4 رؤوس مختلفة | ضمان سنة',
          tags: 'مساج علاج طبيعي عضلات جهاز',
          createdAt: Date.now()
        },
        {
          id: 'p2',
          name: 'حقيبة إسعافات أولية متكاملة',
          name_en: 'First Aid Kit',
          price: 450,
          category: 'pharmacy',
          image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
          description: 'حقيبة إسعافات أولية تحتوي على جميع المستلزمات الأساسية للطوارئ، مناسبة للمنزل والسيارة والرحلات.',
          details: 'تحتوي على 120 قطعة | حقيبة مقاومة للماء | دليل إرشادي',
          tags: 'اسعافات صيدلة طب طوارئ',
          createdAt: Date.now()
        },
        {
          id: 'p3',
          name: 'طقم أدوات فحص أسنان احترافي',
          name_en: 'Dental Examination Kit',
          price: 890,
          category: 'dental',
          image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&q=80',
          description: 'طقم أدوات فحص أسنان من الستانلس ستيل عالي الجودة، معقم وجاهز للاستخدام في العيادات.',
          details: '5 قطع | ستانلس ستيل 100% | قابل للتعقيم | حافظة جلدية',
          tags: 'اسنان عيادة ادوات فحص',
          createdAt: Date.now()
        },
        {
          id: 'p4',
          name: 'رباط ضاغط مرن للركبة',
          name_en: 'Elastic Knee Support',
          price: 180,
          category: 'physio',
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
          description: 'دعامة ركبة مرنة لتثبيت المفصل وتخفيف الألم أثناء الحركة والتمارين العلاجية.',
          details: 'مقاسات: M/L/XL | خامة نيوبرين طبية | تهوية ممتازة',
          tags: 'ركبة دعامة علاج طبيعي مفاصل',
          createdAt: Date.now()
        },
        {
          id: 'p5',
          name: 'جهاز قياس ضغط الدم الرقمي',
          name_en: 'Digital Blood Pressure Monitor',
          price: 750,
          category: 'pharmacy',
          image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80',
          description: 'جهاز قياس ضغط الدم الرقمي بدقة عالية مع ذاكرة لحفظ 90 قراءة وشاشة LCD كبيرة.',
          details: 'قياس تلقائي | تنبيه عدم انتظام ضربات القلب | يعمل بالبطارية',
          tags: 'ضغط دم جهاز صيدلة قياس',
          createdAt: Date.now()
        },
        {
          id: 'p6',
          name: 'معجون أسنان طبي مبيض',
          name_en: 'Whitening Toothpaste',
          price: 95,
          category: 'dental',
          image: 'https://images.unsplash.com/photo-1609841328116-5d78f1f6a5f8?w=600&q=80',
          description: 'معجون أسنان طبي بتركيبة مبيضة تحمي من التسوس وتقوي مينا الأسنان.',
          details: '75 مل | بالفلورايد | نكهة نعناع منعشة',
          tags: 'معجون اسنان تبييض عناية',
          createdAt: Date.now()
        }
      ];
      localStorage.setItem(this.keys.products, JSON.stringify(seed));
      localStorage.setItem('hm_seeded', '1');
    }
  },

  // Products
  getProducts() {
    try { return JSON.parse(localStorage.getItem(this.keys.products) || '[]'); } catch { return []; }
  },
  setProducts(arr) { localStorage.setItem(this.keys.products, JSON.stringify(arr)); },
  addProduct(p) {
    const arr = this.getProducts();
    p.id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    p.createdAt = Date.now();
    arr.unshift(p);
    this.setProducts(arr);
    return p;
  },
  updateProduct(id, data) {
    const arr = this.getProducts();
    const idx = arr.findIndex(x => x.id === id);
    if (idx !== -1) { arr[idx] = { ...arr[idx], ...data }; this.setProducts(arr); return arr[idx]; }
    return null;
  },
  deleteProduct(id) {
    const arr = this.getProducts().filter(x => x.id !== id);
    this.setProducts(arr);
  },

  // Contacts
  getContacts() {
    try { return JSON.parse(localStorage.getItem(this.keys.contacts) || '[]'); } catch { return []; }
  },
  setContacts(arr) { localStorage.setItem(this.keys.contacts, JSON.stringify(arr)); },

  // Settings
  getSettings() {
    try { return JSON.parse(localStorage.getItem(this.keys.settings) || '{}'); } catch { return this.defaults.settings; }
  },
  setSettings(s) { localStorage.setItem(this.keys.settings, JSON.stringify(s)); },

  // Admin
  getAdmin() {
    try { return JSON.parse(localStorage.getItem(this.keys.admin) || '{}'); } catch { return this.defaults.admin; }
  },
  setAdmin(a) { localStorage.setItem(this.keys.admin, JSON.stringify(a)); },

  // Categories
  getCategories() {
    try { return JSON.parse(localStorage.getItem(this.keys.categories) || '[]'); } catch { return this.defaults.categories; }
  }
};

// Auto init
DB.init();
