/* =====================================================================
   منطق الموقع: عرض المحتوى من config.js + الفلاتر + واتساب + وضع التعديل
   ===================================================================== */
(function () {
  'use strict';

  var BASE = window.RASHFA_CONFIG, Art = window.RashfaArt;
  var KEY = 'rashfa.state.v1';
  var CART_KEY = 'rashfa.cart.v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var norm = function (s) {
    return String(s).toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  };
  function safeWebURL(value) {
    try { var url = new URL(String(value || ''), window.location.href); return /^https?:$/.test(url.protocol) ? url.href : ''; }
    catch (e) { return ''; }
  }
  function safeImageURL(value) {
    var src = String(value || '').trim();
    return /^(https?:\/\/|\/|\.\/|\.\.\/|[\w-]+\/)/i.test(src) ? src : '';
  }
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var state = clone(BASE);
  var editing = false, activeCat = 'all', query = '', cart = {};

  /* حقول «إعدادات الركن» وأين تُخزَّن في الإعدادات */
  var SETTINGS = {
    brandName: ['brand', 'name'], whatsapp: ['contact', 'whatsapp'], phone: ['contact', 'phone'],
    address: ['contact', 'address'], mapsUrl: ['contact', 'mapsUrl'],
    instagram: ['contact', 'instagram'], snapchat: ['contact', 'snapchat'], tiktok: ['contact', 'tiktok'], x: ['contact', 'x']
  };
  var FIELDS = [
    ['brandName', 'اسم الركن', 'مثال: رَشفة'],
    ['whatsapp', 'رقم واتساب', 'بصيغة 9665XXXXXXXX أو 05XXXXXXXX'],
    ['phone', 'رقم الاتصال (اختياري)', ''],
    ['address', 'العنوان', 'الحي، الشارع، معلم قريب'],
    ['mapsUrl', 'رابط الموقع على خرائط قوقل', 'https://maps.app.goo.gl/…'],
    ['instagram', 'انستغرام', 'اسم الحساب أو الرابط'],
    ['snapchat', 'سناب شات', 'اسم الحساب أو الرابط'],
    ['tiktok', 'تيك توك', 'اسم الحساب أو الرابط'],
    ['x', 'منصة X', 'اسم الحساب أو الرابط']
  ];

  function getPath(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj); }

  /* ---------- الحفظ المحلي ---------- */
  function loadSaved() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (!s) return;
      if (s.settings) Object.keys(s.settings).forEach(function (k) { if (SETTINGS[k]) state[SETTINGS[k][0]][SETTINGS[k][1]] = s.settings[k]; });
      if (Array.isArray(s.menu)) state.menu = s.menu;
    } catch (e) { /* تجاهل */ }
    try {
      var savedCart = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
      if (savedCart && typeof savedCart === 'object' && !Array.isArray(savedCart)) {
        Object.keys(savedCart).forEach(function (id) {
          var quantity = Math.floor(Number(savedCart[id]));
          if (state.menu.some(function (item) { return item.id === id; }) && quantity > 0 && quantity <= 99) cart[id] = quantity;
        });
      }
    } catch (e) { cart = {}; }
  }
  function persist() {
    try {
      var settings = {};
      Object.keys(SETTINGS).forEach(function (k) {
        var p = SETTINGS[k], v = state[p[0]][p[1]] || '', b = BASE[p[0]][p[1]] || '';
        if (v !== b) settings[k] = v;
      });
      var out = { v: 1, settings: settings };
      if (JSON.stringify(state.menu) !== JSON.stringify(BASE.menu)) out.menu = state.menu;
      if (!Object.keys(settings).length && !out.menu) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, JSON.stringify(out));
    } catch (e) { /* تجاهل */ }
  }

  /* ---------- تنبيه ---------- */
  function toast(msg, action) {
    var t = $('#toast');
    t.textContent = '';
    var s = document.createElement('span'); s.textContent = msg; t.appendChild(s);
    if (action) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = action.label;
      b.onclick = function () { t.classList.remove('show'); action.fn(); };
      t.appendChild(b);
    }
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { t.classList.remove('show'); }, action ? 8000 : 3200);
  }

  /* ---------- واتساب ---------- */
  function waNumber() {
    var n = String(state.contact.whatsapp || '').replace(/\D/g, '');
    if (n.indexOf('00') === 0) n = n.slice(2);
    if (/^05\d{8}$/.test(n)) n = '966' + n.slice(1);
    else if (/^5\d{8}$/.test(n)) n = '966' + n;
    return n;
  }
  function waURL(msg) { return 'https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(msg); }
  function waMsg(el) { return (el.getAttribute('data-wa-msg') || '').replace('{brand}', state.brand.name); }
  function openWA(msg) {
    if (!waNumber()) {
      toast('لم يُربط رقم واتساب بعد.', { label: 'ربط الرقم الآن', fn: function () { setEditing(true); openSettings(); } });
      return;
    }
    window.open(waURL(msg), '_blank', 'noopener');
  }
  function updateWA() {
    var has = !!waNumber();
    $$('[data-wa]').forEach(function (a) { a.href = has ? waURL(waMsg(a)) : '#'; });
  }

  /* ---------- الهوية والنصوص ---------- */
  function renderBrand() {
    var n = state.brand.name || '—';
    $$('[data-brand]').forEach(function (e) { e.textContent = n; });
    document.title = n + ' | ' + (state.brand.tagline || 'ركن قهوة');
    $$('[data-logo]').forEach(function (e) {
      var logoImage = safeImageURL(state.brand.logoImage);
      e.innerHTML = logoImage ? '<img src="' + esc(logoImage) + '" alt="">' : Art.logo();
    });
    document.documentElement.style.setProperty('--cur', '"' + state.currency + '"');
    if ($('#demoBanner')) $('#demoBanner').hidden = !state.demoPrices;
    $$('[data-bind]').forEach(function (e) { var v = getPath(state, e.getAttribute('data-bind')); if (v != null) e.textContent = v; });
  }

  function renderHero() {
    $('#heroArt').innerHTML = Art.hero();
    $('#heroPoints').innerHTML = (state.hero.points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');
    $$('.bean').forEach(function (b) { b.innerHTML = Art.bean(); });
    var names = state.menu.map(function (m) { return m.name; });
    var one = names.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('');
    $('#marquee').innerHTML = one + one;
  }

  /* ---------- القائمة ---------- */
  function cardHTML(it, i) {
    var cat = state.categories.filter(function (c) { return c.id === it.cat; })[0] || {};
    var image = safeImageURL(it.image);
    var media = image
      ? '<img src="' + esc(image) + '" alt="' + esc(it.name) + '" loading="lazy" decoding="async">'
      : Art.drink(it.art || { kind: 'cup' });
    var ce = editing ? ' contenteditable="true" spellcheck="false"' : '';
    return '<article class="card" data-id="' + esc(it.id) + '" data-cat="' + esc(it.cat) + '" style="--i:' + Math.min(i, 14) + '">' +
      '<div class="card-art">' + media + '<span class="chip">' + esc(cat.short || cat.label || '') + '</span></div>' +
      '<div class="card-body"><h3 class="card-name" data-field="name"' + ce + '>' + esc(it.name) + '</h3>' +
      '<p class="card-desc" data-field="desc"' + ce + '>' + esc(it.desc) + '</p>' +
      '<div class="card-foot"><span class="price" data-field="price"' + ce + ' data-ph="السعر">' + esc(it.price || '') + '</span>' +
      '<button type="button" class="btn-order" data-cart-add="' + esc(it.id) + '" aria-label="أضف ' + esc(it.name) + ' إلى السلة">أضف للسلة</button></div></div>' +
      '<button type="button" class="card-del" data-del aria-label="حذف ' + esc(it.name) + '">×</button></article>';
  }

  function renderTabs() {
    var all = [{ id: 'all', label: 'الكل' }].concat(state.categories);
    $('#menuTabs').innerHTML = all.map(function (c) {
      var n = c.id === 'all' ? state.menu.length : state.menu.filter(function (m) { return m.cat === c.id; }).length;
      return '<button type="button" class="tab" data-cat="' + esc(c.id) + '" aria-pressed="' + (c.id === activeCat) + '">' + esc(c.label) + '<small>' + n + '</small></button>';
    }).join('');
  }

  function renderMenu() {
    var q = norm(query.trim()), html = '', total = 0, idx = 0;
    var cats = activeCat === 'all' ? state.categories : state.categories.filter(function (c) { return c.id === activeCat; });
    cats.forEach(function (c) {
      var items = state.menu.filter(function (i) { return i.cat === c.id && (!q || norm(i.name + ' ' + i.desc).indexOf(q) !== -1); });
      var showAdd = editing && !q;
      if (!items.length && !showAdd) return;
      total += items.length;
      html += '<section class="group"><header class="group-head"><h3>' + esc(c.label) + '</h3><span class="count">' + items.length + '</span></header><div class="cards">' +
        items.map(function (i) { return cardHTML(i, idx++); }).join('') +
        (showAdd ? '<button type="button" class="add-card" data-add="' + esc(c.id) + '"><span>+</span>إضافة إلى ' + esc(c.label) + '</button>' : '') +
        '</div></section>';
    });
    $('#menuGrid').innerHTML = html;
    $('#menuEmpty').hidden = total > 0 || editing;
  }

  /* ---------- سلة الطلب ---------- */
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* سلة مؤقتة عند منع التخزين */ }
  }
  function cartItems() {
    return Object.keys(cart).map(function (id) {
      var item = state.menu.filter(function (m) { return m.id === id; })[0];
      return item ? { item: item, quantity: cart[id] } : null;
    }).filter(Boolean);
  }
  function renderCart() {
    var entries = cartItems(), count = entries.reduce(function (n, row) { return n + row.quantity; }, 0);
    var total = entries.reduce(function (n, row) { var price = Number(row.item.price); return n + (isFinite(price) && price >= 0 ? price * row.quantity : 0); }, 0);
    var priced = entries.every(function (row) { return row.item.price !== '' && isFinite(Number(row.item.price)); });
    $('#cartCount').textContent = count;
    $('#cartEmpty').hidden = count > 0;
    $('#cartItems').innerHTML = entries.map(function (row) {
      var item = row.item;
      var image = safeImageURL(item.image);
      return '<article class="cart-row" data-cart-row="' + esc(item.id) + '"><div class="cart-row-art">' + (image ? '<img src="' + esc(image) + '" alt="" loading="lazy">' : Art.drink(item.art || { kind: 'cup' })) + '</div><div class="cart-row-info"><strong>' + esc(item.name) + '</strong><small>' + (item.price ? esc(item.price) + ' ' + esc(state.currency) + ' للحبة' : 'السعر يحدد عند الطلب') + '</small><div class="quantity"><button type="button" data-qty="-1" aria-label="تقليل كمية ' + esc(item.name) + '">−</button><span>' + row.quantity + '</span><button type="button" data-qty="1" aria-label="زيادة كمية ' + esc(item.name) + '">+</button><button type="button" data-cart-remove aria-label="حذف ' + esc(item.name) + ' من السلة" class="remove-item">حذف</button></div></div><b class="cart-line-total">' + (item.price ? esc(String(Number(item.price) * row.quantity)) + ' ' + esc(state.currency) : '—') + '</b></article>';
    }).join('');
    $('#cartTotal').textContent = priced && count ? total.toFixed(2).replace(/\.00$/, '') + ' ' + state.currency : (count ? 'يُحدد لاحقًا' : '—');
    $('#cartPriceNote').textContent = state.demoPrices ? 'الأسعار المعروضة تجريبية وليست أسعارًا معتمدة؛ راجعها قبل إرسال الطلب.' : (priced ? 'الإجمالي تقديري، ويُعتمد بعد تأكيد الركن للطلب.' : 'أكمل الأسعار في القائمة ليظهر إجمالي الطلب.');
    $('#cartCheckout').disabled = count === 0;
  }
  function addToCart(id) {
    if (!state.menu.some(function (m) { return m.id === id; })) return;
    cart[id] = Math.min(99, (cart[id] || 0) + 1); saveCart(); renderCart();
    toast('أُضيف المنتج إلى سلتك.');
  }
  function toggleCart(open) {
    var panel = $('#cartPanel'), trigger = $('#cartOpen');
    var show = typeof open === 'boolean' ? open : panel.getAttribute('aria-hidden') === 'true';
    panel.setAttribute('aria-hidden', String(!show)); panel.inert = !show;
    trigger.setAttribute('aria-expanded', String(show)); $('#cartScrim').hidden = !show;
    $$('.site-header, main, .footer, .fab, .edit-bar').forEach(function (el) { el.inert = show; });
    document.body.classList.toggle('cart-open', show);
    if (show) $('#cartClose').focus(); else trigger.focus();
  }
  function checkoutCart() {
    var entries = cartItems(); if (!entries.length) return;
    var lines = ['السلام عليكم، أودّ طلب الآتي من ' + state.brand.name + ':'];
    entries.forEach(function (row) { lines.push('• ' + row.item.name + ' × ' + row.quantity + (row.item.price ? ' — ' + (Number(row.item.price) * row.quantity) + ' ' + state.currency : ' — السعر عند التأكيد')); });
    var total = entries.reduce(function (n, row) { return n + (Number(row.item.price) || 0) * row.quantity; }, 0);
    if (entries.every(function (row) { return row.item.price !== '' && isFinite(Number(row.item.price)); })) lines.push('الإجمالي التقديري: ' + total + ' ' + state.currency);
    if (state.demoPrices) lines.push('تنبيه: الأسعار في هذا الموقع تجريبية وتحتاج اعتمادًا من الركن.');
    openWA(lines.join('\n'));
  }

  /* ---------- عن الركن / المناسبات ---------- */
  function iconSVG(name) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + esc(name) + '"/></svg>'; }

  function renderAbout() {
    $('#aboutArt').innerHTML = Art.drink({ kind: 'finjan' });
    $('#aboutValues').innerHTML = state.about.values.map(function (v, i) {
      return '<li class="reveal" style="--d:' + (0.2 + i * 0.08) + 's"><span class="v-ic">' + iconSVG(v.icon) + '</span><div><h4>' + esc(v.title) + '</h4><p>' + esc(v.text) + '</p></div></li>';
    }).join('');
  }

  function renderEvents() {
    $('#eventCards').innerHTML = state.events.items.map(function (v, i) {
      return '<article class="ev-card reveal" style="--d:' + (i * 0.08) + 's"><span class="ev-ic">' + iconSVG(v.icon) + '</span><div><h3>' + esc(v.title) + '</h3><p>' + esc(v.text) + '</p></div></article>';
    }).join('');
    $('#evType').innerHTML = state.events.types.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('');
  }

  /* ---------- المعرض ---------- */
  function renderGallery() {
    $('#galleryGrid').innerHTML = state.gallery.map(function (g, i) {
      var image = safeImageURL(g.src);
      var media = image ? '<img src="' + esc(image) + '" alt="' + esc(g.caption) + '" loading="lazy" decoding="async">' : Art.gallery(g.art);
      return '<button type="button" class="gal-item ' + esc(g.size || '') + ' reveal" style="--d:' + (i * 0.06) + 's" data-gal="' + i + '" aria-label="تكبير: ' + esc(g.caption) + '">' + media + '<span class="gal-cap">' + esc(g.caption) + '</span></button>';
    }).join('');
  }

  var lbIndex = 0;
  function openLB(i) {
    var n = state.gallery.length; if (!n) return;
    lbIndex = (i + n) % n;
    var g = state.gallery[lbIndex];
    var image = safeImageURL(g.src);
    $('#lbStage').innerHTML = image ? '<img src="' + esc(image) + '" alt="' + esc(g.caption) + '">' : Art.gallery(g.art);
    $('#lbCap').textContent = g.caption;
    var dlg = $('#lightbox'); if (!dlg.open) dlg.showModal();
  }

  /* ---------- الموقع وساعات العمل ---------- */
  var toMin = function (t) { var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); };
  var fmt12 = function (t) { var p = t.split(':'), h = +p[0], m = +p[1], s = h < 12 ? 'ص' : 'م'; h = h % 12 || 12; return h + ':' + (m < 10 ? '0' : '') + m + ' ' + s; };

  function nowTZ() {
    var opts = { weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }, parts;
    try { parts = new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: state.contact.timezone || 'Asia/Riyadh' }, opts)).formatToParts(new Date()); }
    catch (e) { parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(new Date()); }
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    return { day: o.weekday.toLowerCase(), min: (+o.hour % 24) * 60 + (+o.minute) };
  }

  function openStatus() {
    var H = state.hours || []; if (H.length !== 7) return null;
    var now = nowTZ(), i = -1;
    H.forEach(function (h, k) { if (h.d === now.day) i = k; });
    if (i < 0) return null;
    var t = H[i], y = H[(i + 6) % 7];
    if (y.open && toMin(y.close) <= toMin(y.open) && now.min < toMin(y.close)) return { open: true, until: y.close };
    if (t.open) {
      var o = toMin(t.open), c = toMin(t.close);
      if (c <= o ? now.min >= o : (now.min >= o && now.min < c)) return { open: true, until: t.close };
    }
    for (var k = 0; k < 8; k++) {
      var d = H[(i + k) % 7];
      if (!d.open) continue;
      if (k === 0 && now.min >= toMin(d.open)) continue;
      return { open: false, next: { label: k === 0 ? 'اليوم' : (k === 1 ? 'غدًا' : d.label), time: d.open } };
    }
    return { open: false };
  }

  function renderVisit() {
    var c = state.contact, now = nowTZ();
    var addr = $('#addr');
    addr.textContent = c.address || 'نحدّد موقع رَشفة لكل مناسبة بالتنسيق المسبق.';
    addr.classList.toggle('muted', !c.address);

    $('#hoursList').innerHTML = (state.hours || []).map(function (h) {
      return '<li class="' + (h.d === now.day ? 'today' : '') + '"><span>' + esc(h.label) + '</span>' +
        (h.open ? '<span>' + fmt12(h.open) + ' – ' + fmt12(h.close) + '</span>' : '<span class="closed">إجازة</span>') + '</li>';
    }).join('');

    var st = openStatus(), el = $('#status');
    if (st) {
      el.hidden = false; el.className = 'status ' + (st.open ? 'open' : 'closed');
      el.querySelector('span').textContent = st.open ? 'مفتوح الآن · حتى ' + fmt12(st.until)
        : 'مغلق الآن' + (st.next ? ' · يفتح ' + st.next.label + ' ' + fmt12(st.next.time) : '');
    } else el.hidden = true;

    var mapsLink = safeWebURL(c.mapsUrl) || (c.address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.address) : '');
    var acts = '';
    if (mapsLink) acts += '<a class="btn btn-gold btn-sm" target="_blank" rel="noopener" href="' + esc(mapsLink) + '">' + iconSVG('pin') + 'افتح في الخرائط</a>';
    acts += '<a class="btn btn-line btn-sm" href="#" data-wa data-wa-msg="السلام عليكم، أودّ الاستفسار من {brand}">' + iconSVG('wa') + 'واتساب</a>';
    if (c.phone) acts += '<a class="btn btn-line btn-sm" href="tel:' + esc(c.phone.replace(/[^\d+]/g, '')) + '">' + iconSVG('phone') + 'اتصل بنا</a>';
    $('#visitActions').innerHTML = acts;

    var box = $('#mapBox'), embed = safeWebURL(c.mapsEmbed) || (c.address ? 'https://maps.google.com/maps?q=' + encodeURIComponent(c.address) + '&output=embed&hl=ar' : '');
    if (embed) {
      box.innerHTML = '<iframe title="خريطة موقع الركن" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="' + esc(embed) + '"></iframe>';
    } else {
      box.innerHTML = '<div class="map-ph"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="#b79a64" stroke-width="2" stroke-linecap="round">' +
        '<path d="M-10 90C80 70 120 130 210 110S340 60 420 100"/><path d="M-10 200C70 180 150 240 230 210S350 170 420 220"/><path d="M90 -10C110 60 70 120 100 180S150 280 140 320"/><path d="M270 -10C250 60 300 130 280 200S300 280 320 320"/></g>' +
        '<g fill="#fff" opacity=".4"><rect x="130" y="130" width="60" height="40" rx="8"/><rect x="220" y="60" width="50" height="34" rx="8"/><rect x="300" y="190" width="56" height="40" rx="8"/><rect x="30" y="210" width="50" height="40" rx="8"/></g></svg>' +
        '<div>' + iconSVG('pin').replace('class="ic"', 'class="ic pin"') + '<p><strong>وجهة رَشفة</strong></p><p style="font-size:.92rem;margin-top:4px">موقع الركن متنقّل ويُحدّد عند تنسيق موعد مناسبتك.</p></div></div>';
    }
    updateWA();
  }

  /* ---------- التذييل والسوشيال ---------- */
  function socialURL(kind, v) {
    v = String(v || '').trim(); if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    v = v.replace(/^@/, '');
    return { instagram: 'https://instagram.com/', snapchat: 'https://snapchat.com/add/', tiktok: 'https://tiktok.com/@', x: 'https://x.com/' }[kind] + encodeURIComponent(v);
  }
  function renderFooter() {
    var c = state.contact, defs = [['instagram', 'انستغرام', 'ig'], ['snapchat', 'سناب شات', 'snap'], ['tiktok', 'تيك توك', 'tt'], ['x', 'منصة X', 'x']];
    var soc = defs.map(function (d) {
      var u = socialURL(d[0], c[d[0]]);
      return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener" aria-label="' + d[1] + '" title="' + d[1] + '">' + iconSVG(d[2]) + '</a>' : '';
    }).join('');
    var fs = $('#footSocial'); fs.innerHTML = soc; fs.hidden = !soc;

    var h = '<h4>تواصل معنا</h4>';
    h += '<a href="#" data-wa data-wa-msg="السلام عليكم، أودّ الاستفسار من {brand}">' + iconSVG('wa') + 'واتساب</a>';
    if (c.phone) h += '<a href="tel:' + esc(c.phone.replace(/[^\d+]/g, '')) + '">' + iconSVG('phone') + esc(c.phone) + '</a>';
    if (c.address) h += '<span>' + iconSVG('pin') + esc(c.address) + '</span>';
    $('#footContact').innerHTML = h;
    $('#year').textContent = new Date().getFullYear();
  }

  function renderAll() {
    renderBrand(); renderHero(); renderTabs(); renderMenu(); renderAbout();
    renderEvents(); renderGallery(); renderVisit(); renderFooter(); updateWA(); observeReveal();
  }

  /* ---------- ظهور عند التمرير ---------- */
  var io;
  function observeReveal() {
    var els = $$('.reveal:not(.in)');
    if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    if (!io) io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- وضع التعديل ---------- */
  function setEditing(on) {
    editing = !!on;
    document.body.classList.toggle('editing', editing);
    $('#editBar').hidden = !editing;
    renderMenu();
    if (editing) toast('وضع التعديل: اضغط على أي نص أو سعر لتعديله.');
  }

  function openSettings() {
    $('#settingsFields').innerHTML = FIELDS.map(function (f) {
      var p = SETTINGS[f[0]];
      return '<label>' + esc(f[1]) + '<input name="' + f[0] + '" value="' + esc(state[p[0]][p[1]] || '') + '" placeholder="' + esc(f[2]) + '" autocomplete="off"></label>';
    }).join('');
    $('#settings').showModal();
  }

  function cleanPrice(s) {
    s = String(s).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/[^0-9.]/g, '');
    return s;
  }

  function itemFrom(el) {
    var card = el.closest('.card'); if (!card) return null;
    return state.menu.filter(function (m) { return m.id === card.getAttribute('data-id'); })[0] || null;
  }

  /* ---------- الأحداث ---------- */
  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('#cartOpen')) { toggleCart(true); return; }
      if (t.closest('#cartClose') || t.closest('#cartScrim')) { toggleCart(false); return; }
      if (t.closest('#cartBrowse')) { toggleCart(false); return; }
      if (t.closest('#cartClear')) { cart = {}; saveCart(); renderCart(); return; }
      if (t.closest('#cartCheckout')) { checkoutCart(); return; }
      var cartRow = t.closest('[data-cart-row]');
      if (cartRow && t.closest('[data-qty]')) {
        var cartId = cartRow.getAttribute('data-cart-row'), next = (cart[cartId] || 0) + Number(t.closest('[data-qty]').getAttribute('data-qty'));
        if (next > 0) cart[cartId] = Math.min(99, next); else delete cart[cartId];
        saveCart(); renderCart(); return;
      }
      if (cartRow && t.closest('[data-cart-remove]')) { delete cart[cartRow.getAttribute('data-cart-row')]; saveCart(); renderCart(); return; }
      var wa = t.closest('[data-wa]');
      if (wa) { e.preventDefault(); openWA(waMsg(wa)); return; }

      var tab = t.closest('.tab');
      if (tab) { activeCat = tab.getAttribute('data-cat'); renderTabs(); renderMenu(); return; }

      var addToCartBtn = t.closest('[data-cart-add]');
      if (addToCartBtn) { addToCart(addToCartBtn.getAttribute('data-cart-add')); return; }

      var ord = t.closest('[data-order]');
      if (ord) {
        var it = itemFrom(ord);
        if (it) openWA('السلام عليكم، أودّ طلب: ' + it.name + (it.price ? ' (' + it.price + ' ' + state.currency + ')' : '') + ' من ' + state.brand.name);
        return;
      }

      var del = t.closest('[data-del]');
      if (del) {
        var d = itemFrom(del);
        if (d && confirm('حذف «' + d.name + '» من القائمة؟')) {
          state.menu = state.menu.filter(function (m) { return m !== d; });
          persist(); renderTabs(); renderMenu(); renderHero();
        }
        return;
      }

      var add = t.closest('[data-add]');
      if (add) {
        var cat = add.getAttribute('data-add');
        var art = cat === 'cold' ? { kind: 'iced', layers: ['#6b3f26', '#efe0c4'] } : cat === 'extras' ? { kind: 'shot' } : { kind: 'cup', coffee: '#7a4a2c', foam: '#efdcc0', latte: 'heart' };
        var id = 'n' + Date.now();
        state.menu.push({ id: id, cat: cat, name: 'مشروب جديد', desc: 'اكتب وصف المشروب هنا.', price: '', image: '', art: art });
        persist(); renderTabs(); renderMenu(); renderHero();
        var nn = $('.card[data-id="' + id + '"] .card-name'); if (nn) { nn.scrollIntoView({ block: 'center', behavior: 'smooth' }); nn.focus(); }
        return;
      }

      if (t.closest('[data-edit-toggle]')) { setEditing(!editing); return; }
      if (t.closest('[data-open-settings]')) { openSettings(); return; }
      if (t.closest('[data-close-settings]')) { $('#settings').close(); return; }

      if (t.closest('[data-export]')) {
        var data = JSON.stringify({ settings: (function () { var o = {}; Object.keys(SETTINGS).forEach(function (k) { o[k] = state[SETTINGS[k][0]][SETTINGS[k][1]] || ''; }); return o; })(), menu: state.menu }, null, 2);
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
        a.download = 'rashfa-backup.json'; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        toast('تم تصدير نسخة من إعداداتك وقائمتك.'); return;
      }
      if (t.closest('[data-import]')) { $('#importFile').click(); return; }
      if (t.closest('[data-reset]')) {
        if (confirm('سيتم حذف كل تعديلاتك في هذا المتصفح والرجوع للإعدادات الأصلية. متأكد؟')) {
          try { localStorage.removeItem(KEY); } catch (er) {}
          state = clone(BASE); activeCat = 'all'; query = ''; $('#menuSearch').value = '';
          renderAll(); toast('تمت إعادة الضبط.');
        }
        return;
      }

      var gi = t.closest('[data-gal]');
      if (gi) { openLB(+gi.getAttribute('data-gal')); return; }
      if (t === $('#lightbox')) { $('#lightbox').close(); return; }
    });

    /* تعديل البطاقات */
    var grid = $('#menuGrid');
    grid.addEventListener('focusout', function (e) {
      var f = e.target.closest('[data-field]'); if (!f || !editing) return;
      var it = itemFrom(f); if (!it) return;
      var key = f.getAttribute('data-field'), val = f.textContent.trim();
      if (key === 'price') { val = cleanPrice(val); f.textContent = val; }
      if (key === 'name' && !val) { f.textContent = it.name; return; }
      if (it[key] === val) return;
      it[key] = val; persist(); renderCart();
      if (key === 'name') { renderHero(); renderTabs(); }
    });
    grid.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('[data-field]')) { e.preventDefault(); e.target.blur(); }
    });
    grid.addEventListener('paste', function (e) {
      if (!e.target.matches('[data-field]')) return;
      e.preventDefault();
      var txt = (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ');
      document.execCommand('insertText', false, txt);
    });
    /* صورة لا تعمل → نرجع للرسمة */
    document.addEventListener('error', function (e) {
      var img = e.target; if (!img || img.tagName !== 'IMG') return;
      var card = img.closest('.card'), cell = img.closest('.gal-item'), cartArt = img.closest('.cart-row-art'), logo = img.closest('.logo-mark'), stage = img.closest('#lbStage'), it;
      if (card && (it = itemFrom(img))) { img.replaceWith(document.createRange().createContextualFragment(Art.drink(it.art || { kind: 'cup' }))); }
      else if (cell) { var g = state.gallery[+cell.getAttribute('data-gal')]; if (g) img.replaceWith(document.createRange().createContextualFragment(Art.gallery(g.art))); }
      else if (cartArt) { var row = cartArt.closest('[data-cart-row]'), cartItem = row && state.menu.filter(function (m) { return m.id === row.getAttribute('data-cart-row'); })[0]; if (cartItem) img.replaceWith(document.createRange().createContextualFragment(Art.drink(cartItem.art || { kind: 'cup' }))); }
      else if (logo) { img.replaceWith(document.createRange().createContextualFragment(Art.logo())); }
      else if (stage) { var current = state.gallery[lbIndex]; if (current) img.replaceWith(document.createRange().createContextualFragment(Art.gallery(current.art))); }
    }, true);

    /* بحث */
    var tm;
    $('#menuSearch').addEventListener('input', function (e) { clearTimeout(tm); tm = setTimeout(function () { query = e.target.value; renderMenu(); }, 120); });

    /* الإعدادات */
    $('#settingsForm').addEventListener('submit', function (e) {
      var sub = e.submitter; if (!sub || sub.value !== 'save') return;
      var fd = new FormData(e.target);
      FIELDS.forEach(function (f) { var p = SETTINGS[f[0]]; state[p[0]][p[1]] = String(fd.get(f[0]) || '').trim(); });
      persist(); renderBrand(); renderVisit(); renderFooter(); updateWA(); renderMenu();
      toast('تم حفظ إعدادات الركن.');
    });

    /* استيراد */
    $('#importFile').addEventListener('change', function (e) {
      var file = e.target.files[0]; if (!file) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var s = JSON.parse(r.result);
          if (s.settings) Object.keys(s.settings).forEach(function (k) { if (SETTINGS[k]) state[SETTINGS[k][0]][SETTINGS[k][1]] = String(s.settings[k] || ''); });
          if (Array.isArray(s.menu) && s.menu.every(function (m) { return m && m.id && m.name; })) state.menu = s.menu;
          persist(); renderAll(); toast('تم استيراد النسخة بنجاح.');
        } catch (er) { toast('الملف غير صالح.'); }
        e.target.value = '';
      };
      r.readAsText(file);
    });

    /* المعرض */
    $('#lbClose').addEventListener('click', function () { $('#lightbox').close(); });
    $('#lbPrev').addEventListener('click', function () { openLB(lbIndex - 1); });
    $('#lbNext').addEventListener('click', function () { openLB(lbIndex + 1); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('#cartPanel').getAttribute('aria-hidden') === 'false') { toggleCart(false); return; }
      if (!$('#lightbox').open) return;
      if (e.key === 'ArrowLeft') openLB(lbIndex + 1);      /* RTL: اليسار = التالي */
      if (e.key === 'ArrowRight') openLB(lbIndex - 1);
    });

    /* نموذج المناسبات → واتساب */
    $('#eventForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, name = f.elements.name;
      name.classList.toggle('invalid', !name.value.trim());
      if (!name.value.trim()) { name.focus(); toast('اكتب اسمك أولًا.'); return; }
      var guests = f.elements.guests;
      guests.classList.toggle('invalid', !!guests.value && Number(guests.value) < 1);
      if (guests.value && Number(guests.value) < 1) { guests.focus(); toast('أدخل عددًا صحيحًا للضيوف.'); return; }
      if (f.elements.date.value) {
        var today = new Date(), todayLocal = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        f.elements.date.classList.toggle('invalid', f.elements.date.value < todayLocal);
        if (f.elements.date.value < todayLocal) { f.elements.date.focus(); toast('اختر تاريخًا قادمًا للمناسبة.'); return; }
      }
      var lines = ['السلام عليكم، أرغب بالاستفسار عن ضيافة لمناسبة.', 'الاسم: ' + name.value.trim(), 'نوع المناسبة: ' + f.elements.type.value];
      if (f.elements.guests.value) lines.push('عدد الضيوف: ' + f.elements.guests.value);
      if (f.elements.date.value) lines.push('التاريخ: ' + f.elements.date.value);
      if (f.elements.note.value.trim()) lines.push('ملاحظات: ' + f.elements.note.value.trim());
      openWA(lines.join('\n'));
    });

    /* قائمة الجوال */
    var burger = $('#burger'), links = $('#navLinks');
    function closeNav() { burger.setAttribute('aria-expanded', 'false'); links.classList.remove('open'); document.body.style.overflow = ''; }
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open)); links.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
    window.addEventListener('resize', function () { if (innerWidth > 980) closeNav(); });

    /* تمرير: الرأس + شريط التقدم */
    var header = $('#header'), prog = $('#progress'), tick = false;
    function onScroll() {
      header.classList.toggle('scrolled', scrollY > 30);
      var h = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = 'scaleX(' + (h > 0 ? Math.min(scrollY / h, 1) : 0) + ')';
      tick = false;
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    /* تمييز القسم الحالي */
    if ('IntersectionObserver' in window) {
      var map = {}; $$('#navLinks a').forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          $$('#navLinks a').forEach(function (a) { a.removeAttribute('aria-current'); });
          var a = map[en.target.id]; if (a) a.setAttribute('aria-current', 'true');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
    }

    /* حركة الماوس في الواجهة */
    var hero = $('.hero');
    if (!reduceMotion && matchMedia('(hover:hover)').matches) {
      hero.addEventListener('pointermove', function (e) {
        hero.style.setProperty('--mx', (e.clientX / innerWidth - .5).toFixed(3));
        hero.style.setProperty('--my', (e.clientY / innerHeight - .5).toFixed(3));
      });
      hero.addEventListener('pointerleave', function () { hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); });
    }

    /* تحديث حالة «مفتوح الآن» كل دقيقة */
    setInterval(renderVisit, 60000);
  }

  /* ---------- تشغيل ---------- */
  loadSaved();
  renderAll();
  renderCart();
  bind();
  if (location.hash === '#edit') setEditing(true);
})();
