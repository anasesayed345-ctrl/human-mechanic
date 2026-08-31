// Human Mechanic - Store Frontend Logic
let currentFilter = 'all';
let currentSearch = '';
let currentModalProduct = null;
let modalQty = 1;
let cart = JSON.parse(localStorage.getItem('hm_cart') || '[]');

function saveCart(){
  localStorage.setItem('hm_cart', JSON.stringify(cart));
  updateCartUI();
}

function getCategoryById(id){
  return DB.getCategories().find(c=>c.id===id);
}

function detectPlatformIcon(platform){
  const p = (platform||'').toLowerCase();
  if(p.includes('whatsapp')||p.includes('واتس')) return {icon:'fa-brands fa-whatsapp', cls:'whatsapp'};
  if(p.includes('facebook')||p.includes('فيس')) return {icon:'fa-brands fa-facebook-f', cls:'facebook'};
  if(p.includes('instagram')||p.includes('انستا')) return {icon:'fa-brands fa-instagram', cls:'instagram'};
  if(p.includes('tiktok')||p.includes('تيك')) return {icon:'fa-brands fa-tiktok', cls:'tiktok'};
  if(p.includes('telegram')||p.includes('تيليجرام')) return {icon:'fa-brands fa-telegram', cls:'telegram'};
  if(p.includes('youtube')||p.includes('يوتيوب')) return {icon:'fa-brands fa-youtube', cls:'youtube'};
  if(p.includes('twitter')||p.includes('x.com')||p==='x') return {icon:'fa-brands fa-x-twitter', cls:'x'};
  if(p.includes('linkedin')||p.includes('لينكد')) return {icon:'fa-brands fa-linkedin-in', cls:'linkedin'};
  if(p.includes('messenger')) return {icon:'fa-brands fa-facebook-messenger', cls:'messenger'};
  if(p.includes('mail')||p.includes('gmail')||p.includes('email')||p.includes('ايميل')) return {icon:'fa-solid fa-envelope', cls:'email'};
  if(p.includes('phone')||p.includes('هاتف')||p.includes('tel')) return {icon:'fa-solid fa-phone', cls:'phone'};
  return {icon:'fa-solid fa-link', cls:'default'};
}

function renderCategories(){
  const cats = DB.getCategories();
  const grid = document.getElementById('catGrid');
  const counts = {};
  DB.getProducts().forEach(p=> counts[p.category]=(counts[p.category]||0)+1);
  grid.innerHTML = cats.map(c=>{
    const colors = {physio:'var(--teal)', pharmacy:'var(--blue)', dental:'var(--purple)'};
    return `
    <div class="cat-card" data-cat="${c.id}" style="color:${colors[c.id]||'var(--teal)'}">
      <div class="cat-icon" style="background:${colors[c.id]||'var(--teal)'}">${c.icon}</div>
      <h4>${c.name}</h4>
      <p>${c.name_en}</p>
      <div class="count"><i class="fa-solid fa-box-open"></i> ${counts[c.id]||0} منتج</div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.cat-card').forEach(el=>{
    el.addEventListener('click',()=>{
      const cat = el.dataset.cat;
      setFilter(cat);
      document.getElementById('products').scrollIntoView({behavior:'smooth'});
    });
  });
}

function setFilter(cat){
  currentFilter = cat;
  document.querySelectorAll('.chip').forEach(ch=>{
    ch.classList.toggle('active', ch.dataset.cat===cat);
  });
  document.querySelectorAll('.nav-desktop a').forEach(a=>a.classList.remove('active'));
  renderProducts();
}

function normalize(str){
  return (str||'').toString().toLowerCase().trim();
}

function productMatchesSearch(p, q){
  if(!q) return true;
  q = normalize(q);
  const cat = getCategoryById(p.category);
  const hay = [
    p.name, p.name_en, p.description, p.details, p.tags,
    cat?.name, cat?.name_en, p.category
  ].join(' ').toLowerCase();
  return hay.includes(q);
}

function renderProducts(){
  const grid = document.getElementById('productGrid');
  const title = document.getElementById('productsTitle');
  const countEl = document.getElementById('productsCount');
  let products = DB.getProducts();

  // filter by category
  if(currentFilter!=='all'){
    products = products.filter(p=>p.category===currentFilter);
    const cat = getCategoryById(currentFilter);
    title.textContent = cat ? `قسم ${cat.name}` : 'المنتجات';
  } else {
    title.textContent = currentSearch ? `نتائج البحث عن "${currentSearch}"` : 'جميع المنتجات';
  }
  // filter by search
  if(currentSearch){
    products = products.filter(p=> productMatchesSearch(p, currentSearch));
    title.textContent = `نتائج البحث عن "${currentSearch}"`;
  }

  countEl.textContent = `${products.length} منتج`;
  if(products.length===0){
    const msg = currentSearch
      ? `لم يتم العثور على منتجات مطابقة لبحثك.`
      : (currentFilter!=='all' ? 'لا توجد منتجات في هذا القسم حالياً.' : 'لا توجد منتجات حالياً — سيتم إضافتها من لوحة الإدارة.');
    grid.innerHTML = `
      <div class="empty">
        <div class="icon">${currentSearch?'🔍':'📦'}</div>
        <h4>${msg}</h4>
        <p>${currentSearch?'جرب كلمات أخرى أو تصفح الأقسام.':'تابعنا قريباً لإضافة منتجات جديدة.'}</p>
        ${currentSearch||currentFilter!=='all' ? `<button class="btn" style="margin:16px auto 0;background:var(--navy);color:#fff" onclick="clearFilters()">عرض كل المنتجات</button>`:''}
      </div>`;
    return;
  }

  grid.innerHTML = products.map(p=>{
    const cat = getCategoryById(p.category);
    const currency = DB.getSettings().currency || 'ج.م';
    return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80'">
        <span class="badge-cat">${cat?cat.name:p.category}</span>
      </div>
      <div class="product-body">
        <h4>${p.name}</h4>
        <p class="product-desc">${p.description}</p>
        <div class="product-price">${Number(p.price).toLocaleString('en-US')} <small>${currency}</small></div>
        <div class="product-actions">
          <div class="qty" data-qty="${p.id}">
            <button onclick="changeCardQty('${p.id}', -1)">−</button>
            <span id="qty-${p.id}">1</span>
            <button onclick="changeCardQty('${p.id}', 1)">+</button>
          </div>
          <button class="btn-cart" title="أضف للسلة" onclick="addToCart('${p.id}')"><i class="fa-solid fa-cart-plus"></i></button>
          <button class="btn-order" onclick="openOrderModal('${p.id}')"><i class="fa-brands fa-whatsapp"></i> اطلب الآن</button>
        </div>
      </div>
    </article>`;
  }).join('');

  // click on card opens modal (except buttons)
  grid.querySelectorAll('.product-card').forEach(card=>{
    card.addEventListener('click', (e)=>{
      if(e.target.closest('button')) return;
      openOrderModal(card.dataset.id);
    });
  });
}

window.changeCardQty = function(id, delta){
  const el = document.getElementById('qty-'+id);
  if(!el) return;
  let v = parseInt(el.textContent)||1;
  v = Math.max(1, Math.min(99, v+delta));
  el.textContent = v;
}
window.addToCart = function(id){
  const prod = DB.getProducts().find(p=>p.id===id);
  if(!prod) return;
  const qtyEl = document.getElementById('qty-'+id);
  const qty = qtyEl ? parseInt(qtyEl.textContent)||1 : 1;
  const existing = cart.find(c=>c.id===id);
  if(existing) existing.qty += qty;
  else cart.push({id:prod.id, name:prod.name, price:Number(prod.price), image:prod.image, category:prod.category, description:prod.description, qty});
  saveCart();
  toast(`تمت إضافة ${prod.name} للسلة (${qty})`);
  // reset
  if(qtyEl) qtyEl.textContent='1';
}
window.clearFilters = function(){
  currentSearch=''; currentFilter='all';
  document.getElementById('searchInput').value='';
  const overlayInp = document.getElementById('searchOverlayInput');
  if(overlayInp) overlayInp.value='';
  document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c.dataset.cat==='all'));
  document.getElementById('liveResultsWrap').classList.add('hidden');
  renderProducts();
}

// Search logic
function setupSearch(){
  const input = document.getElementById('searchInput');
  const liveWrap = document.getElementById('liveResultsWrap');
  const liveResults = document.getElementById('liveResults');
  const overlay = document.getElementById('searchOverlay');
  const overlayInput = document.getElementById('searchOverlayInput');
  const overlayResults = document.getElementById('overlayResults');

  function renderLive(q, container){
    const products = DB.getProducts().filter(p=> productMatchesSearch(p, q));
    if(!q){
      container.innerHTML = '<div style="padding:18px;text-align:center;color:var(--muted);font-size:13px">اكتب للبحث في اسم المنتج، الوصف، القسم والكلمات المفتاحية</div>';
      return;
    }
    if(products.length===0){
      container.innerHTML = `<div style="padding:18px;text-align:center"><div style="font-size:28px">🔍</div><div style="font-weight:800;margin-top:8px">لم يتم العثور على منتجات مطابقة لبحثك.</div><div style="font-size:13px;color:var(--muted)">جرب كلمات أخرى مثل "مساج" أو "أسنان" أو "pharmacy"</div></div>`;
      return;
    }
    container.innerHTML = products.slice(0,8).map(p=>{
      const cat=getCategoryById(p.category);
      return `<div class="search-result-item" data-id="${p.id}">
        <img src="${p.image}" alt="">
        <div style="flex:1">
          <div style="font-weight:800;font-size:13px">${p.name}</div>
          <div style="font-size:12px;color:var(--muted)">${cat?cat.name:p.category} • ${Number(p.price).toLocaleString()} ${DB.getSettings().currency}</div>
          <div style="font-size:12px;color:#475569;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden">${p.description}</div>
        </div>
        <i class="fa-solid fa-arrow-left" style="color:var(--muted);align-self:center"></i>
      </div>`;
    }).join('') + (products.length>8?`<div style="padding:10px;text-align:center"><button class="btn" style="background:var(--navy);color:#fff;height:36px" onclick="doSearch('${q.replace(/'/g,"\\'")}')">عرض كل النتائج (${products.length})</button></div>`:'');
    container.querySelectorAll('.search-result-item').forEach(el=>{
      el.addEventListener('click',()=>{ openOrderModal(el.dataset.id); liveWrap.classList.add('hidden'); overlay.classList.remove('open'); });
    });
  }

  window.doSearch = function(q){
    currentSearch = q;
    currentFilter='all';
    document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c.dataset.cat==='all'));
    document.getElementById('liveResultsWrap').classList.add('hidden');
    document.getElementById('searchOverlay').classList.remove('open');
    renderProducts();
    document.getElementById('products').scrollIntoView({behavior:'smooth'});
  }

  input.addEventListener('input', ()=>{
    const q = input.value.trim();
    currentSearch = q;
    if(q.length===0){
      liveWrap.classList.add('hidden');
      renderProducts();
      return;
    }
    liveWrap.classList.remove('hidden');
    renderLive(q, liveResults);
    // also update main grid live
    renderProducts();
  });
  input.addEventListener('focus', ()=>{
    if(input.value.trim()){ liveWrap.classList.remove('hidden'); renderLive(input.value.trim(), liveResults); }
  });
  input.addEventListener('keydown', (e)=>{
    if(e.key==='Enter'){
      e.preventDefault();
      doSearch(input.value.trim());
    }
    if(e.key==='Escape') liveWrap.classList.add('hidden');
  });
  // overlay
  document.getElementById('searchMobileBtn').addEventListener('click', ()=>{
    overlay.classList.add('open');
    overlayInput.focus();
    renderLive(overlayInput.value.trim(), overlayResults);
  });
  document.getElementById('closeSearchOverlay').addEventListener('click', ()=> overlay.classList.remove('open'));
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) overlay.classList.remove('open'); });
  overlayInput.addEventListener('input', ()=>{
    const q=overlayInput.value.trim();
    currentSearch=q;
    renderLive(q, overlayResults);
    renderProducts();
    // sync desktop input
    input.value = q;
    if(q) liveWrap.classList.remove('hidden');
    else liveWrap.classList.add('hidden');
  });
  overlayInput.addEventListener('keydown', (e)=>{
    if(e.key==='Enter'){ e.preventDefault(); doSearch(overlayInput.value.trim()); }
  });
  // close live on outside
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.search-wrap') && !e.target.closest('#liveResultsWrap')){
      // keep if typing? just hide after delay
      if(!e.target.closest('#searchInput')) liveWrap.classList.add('hidden');
    }
  });
}

// Social rendering
function renderContacts(){
  const contacts = DB.getContacts().filter(c=>c.active).sort((a,b)=>(a.order||0)-(b.order||0));
  const grid = document.getElementById('socialGrid');
  const footer = document.getElementById('footerSocials');
  if(!contacts.length){
    grid.innerHTML = '<p style="color:var(--muted);font-size:13px">سيتم إضافة وسائل التواصل من لوحة الإدارة.</p>';
    footer.innerHTML='';
    return;
  }
  grid.innerHTML = contacts.map(c=>{
    const det = detectPlatformIcon(c.platform);
    const label = c.platform;
    return `<a href="${c.url}" target="_blank" rel="noopener" class="social-btn ${det.cls}" title="${label}" aria-label="${label}"><i class="${det.icon}"></i></a>`;
  }).join('');
  footer.innerHTML = contacts.slice(0,6).map(c=>{
    const det = detectPlatformIcon(c.platform);
    return `<a href="${c.url}" target="_blank" class="social-btn ${det.cls}" style="width:36px;height:36px;font-size:14px;border-radius:10px"><i class="${det.icon}"></i></a>`;
  }).join('');
  // update CTA buttons
  const wa = contacts.find(c=> detectPlatformIcon(c.platform).cls==='whatsapp');
  const phone = contacts.find(c=> detectPlatformIcon(c.platform).cls==='phone');
  const settings = DB.getSettings();
  const waNumber = settings.whatsappNumber || '201000000000';
  const waUrl = wa ? wa.url : `https://wa.me/${waNumber}`;
  document.getElementById('ctaWa').href = waUrl;
  document.getElementById('heroWaBtn').href = waUrl;
  if(phone) document.getElementById('ctaPhone').href = phone.url.startsWith('tel')?phone.url:`tel:${phone.url}`;
}

// Modal
function openOrderModal(id){
  const p = DB.getProducts().find(x=>x.id===id);
  if(!p) return;
  currentModalProduct = p;
  modalQty = 1;
  const cat = getCategoryById(p.category);
  const currency = DB.getSettings().currency || 'ج.م';
  document.getElementById('mImg').src = p.image;
  document.getElementById('mCat').textContent = cat?cat.name:p.category;
  document.getElementById('mName').textContent = p.name;
  document.getElementById('mPrice').textContent = Number(p.price).toLocaleString('en-US');
  document.getElementById('mCurrency').textContent = currency;
  document.getElementById('mDesc').textContent = p.description;
  document.getElementById('mDetails').textContent = p.details || 'لا توجد تفاصيل إضافية.';
  document.getElementById('mQty').textContent = modalQty;
  updateModalTotal();
  document.getElementById('productModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function updateModalTotal(){
  if(!currentModalProduct) return;
  const total = Number(currentModalProduct.price)*modalQty;
  const cur = DB.getSettings().currency||'ج.م';
  document.getElementById('mTotal').textContent = `الإجمالي: ${total.toLocaleString()} ${cur}`;
}
function closeModal(){
  document.getElementById('productModal').classList.remove('open');
  document.body.style.overflow='';
  currentModalProduct=null;
}

// WhatsApp message builders
function buildSingleProductMessage(p, qty){
  const cat = getCategoryById(p.category);
  const cur = DB.getSettings().currency||'ج.م';
  const total = Number(p.price)*qty;
  const lines = [
    `مرحبًا Human Mechanic 👋`,
    ``,
    `أريد طلب المنتج التالي:`,
    ``,
    `اسم المنتج: ${p.name}`,
    `القسم: ${cat?cat.name:p.category}`,
    `السعر: ${Number(p.price).toLocaleString()} ${cur}`,
    `الكمية: ${qty}`,
    `الإجمالي: ${total.toLocaleString()} ${cur}`,
    ``,
    `تفاصيل المنتج:`,
    `${p.description}`,
    p.details ? `${p.details}` : ``,
    ``,
    `رابط/صورة المنتج:`,
    `${p.image}`,
    ``,
    `بانتظار تأكيد الطلب — شكراً لكم!`
  ];
  return lines.join('\n');
}
function buildCartMessage(items){
  const cur = DB.getSettings().currency||'ج.م';
  let totalQty=0, totalPrice=0;
  const header = [`مرحبًا Human Mechanic 👋`,``, `أريد طلب المنتجات التالية:`,``];
  const body = items.map((it, idx)=>{
    const cat = getCategoryById(it.category);
    const lineTotal = Number(it.price)*it.qty;
    totalQty+=it.qty; totalPrice+=lineTotal;
    return `${idx+1}- ${it.name}\n   القسم: ${cat?cat.name:it.category}\n   الكمية: ${it.qty}\n   السعر: ${Number(it.price).toLocaleString()} ${cur}\n   الإجمالي: ${lineTotal.toLocaleString()} ${cur}\n   ${it.description.slice(0,80)}...`;
  }).join('\n\n');
  const footer = `\n\nإجمالي عدد المنتجات: ${totalQty}\nالإجمالي النهائي: ${totalPrice.toLocaleString()} ${cur}\n\nبانتظار تأكيد الطلب — شكراً لكم!`;
  return header.join('\n') + body + footer;
}
function getWaNumber(){
  const s = DB.getSettings();
  return (s.whatsappNumber||'').replace(/\D/g,'');
}
function openWhatsApp(message){
  const num = getWaNumber();
  if(!num){ toast('رقم واتساب غير مضبوط — تواصل مع الإدارة'); return; }
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// Cart UI
function updateCartUI(){
  const badge = document.getElementById('cartBadge');
  const body = document.getElementById('cartBody');
  const totalEl = document.getElementById('cartTotal');
  const countInfo = document.getElementById('cartCountInfo');
  const cur = DB.getSettings().currency||'ج.م';
  const totalQty = cart.reduce((s,c)=>s+c.qty,0);
  const totalPrice = cart.reduce((s,c)=>s+Number(c.price)*c.qty,0);
  if(totalQty>0){ badge.textContent=totalQty; badge.classList.remove('hidden'); } else badge.classList.add('hidden');
  totalEl.textContent = `${totalPrice.toLocaleString()} ${cur}`;
  countInfo.textContent = `${totalQty} منتج • ${cart.length} نوع`;
  if(cart.length===0){
    body.innerHTML = `<div style="text-align:center;padding:30px 10px"><div style="font-size:42px">🛒</div><div style="font-weight:800;margin-top:8px">السلة فارغة</div><p style="font-size:13px;color:var(--muted)">أضف منتجات من المتجر ثم أرسل الطلب كاملاً عبر واتساب في رسالة واحدة.</p><a href="#products" class="btn" style="margin:16px auto 0;background:var(--navy);color:#fff" onclick="closeCart()">تصفح المنتجات</a></div>`;
    document.getElementById('checkoutWa').disabled = true;
    return;
  }
  document.getElementById('checkoutWa').disabled = false;
  body.innerHTML = cart.map(it=>`
    <div class="cart-item">
      <img src="${it.image}" alt="">
      <div style="flex:1">
        <h4>${it.name}</h4>
        <div class="muted">${getCategoryById(it.category)?.name||it.category} • ${Number(it.price).toLocaleString()} ${cur}</div>
        <div class="cart-qty">
          <button onclick="updateCartQty('${it.id}', -1)">−</button>
          <span style="font-weight:800">${it.qty}</span>
          <button onclick="updateCartQty('${it.id}', 1)">+</button>
          <button onclick="removeFromCart('${it.id}')" style="margin-right:auto;background:#FEF2F2;border-color:#FECACA;color:#EF4444"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}
window.updateCartQty = function(id, delta){
  const it = cart.find(c=>c.id===id);
  if(!it) return;
  it.qty = Math.max(1, Math.min(99, it.qty+delta));
  saveCart();
}
window.removeFromCart = function(id){
  cart = cart.filter(c=>c.id!==id);
  saveCart();
}
function openCart(){ document.getElementById('cartDrawer').classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart(){ document.getElementById('cartDrawer').classList.remove('open'); document.body.style.overflow=''; }

// Toast
let toastTimer;
function toast(msg){
  const t = document.getElementById('toast');
  t.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2800);
}

// Contact form -> whatsapp
function setupContactForm(){
  document.getElementById('sendContactMsg').addEventListener('click', ()=>{
    const name = document.getElementById('cName').value.trim();
    const phone = document.getElementById('cPhone').value.trim();
    const msg = document.getElementById('cMsg').value.trim();
    if(!name || !msg){ toast('يرجى إدخال الاسم والرسالة'); return; }
    const text = `مرحبًا Human Mechanic 👋\n\nرسالة جديدة من صفحة تواصل معنا:\n\nالاسم: ${name}\n${phone?`الهاتف: ${phone}\n`:''}الرسالة:\n${msg}`;
    openWhatsApp(text);
  });
}

// Dots menu
function setupDots(){
  const btn = document.getElementById('dotsBtn');
  const dd = document.getElementById('dotsDropdown');
  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    dd.classList.toggle('open');
  });
  document.addEventListener('click', ()=> dd.classList.remove('open'));
  dd.querySelectorAll('[data-filter]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      setFilter(a.dataset.filter);
      dd.classList.remove('open');
      document.getElementById('products').scrollIntoView({behavior:'smooth'});
    });
  });
  document.querySelectorAll('.footer-filter').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      setFilter(a.dataset.filter);
      document.getElementById('products').scrollIntoView({behavior:'smooth'});
    });
  });
}

// Init
document.addEventListener('DOMContentLoaded', ()=>{
  renderCategories();
  renderProducts();
  renderContacts();
  setupSearch();
  setupDots();
  setupContactForm();
  updateCartUI();

  // filter chips
  document.querySelectorAll('.chip').forEach(ch=>{
    ch.addEventListener('click', ()=> setFilter(ch.dataset.cat));
  });

  // modal qty
  document.getElementById('mInc').addEventListener('click', ()=>{ modalQty=Math.min(99, modalQty+1); document.getElementById('mQty').textContent=modalQty; updateModalTotal(); });
  document.getElementById('mDec').addEventListener('click', ()=>{ modalQty=Math.max(1, modalQty-1); document.getElementById('mQty').textContent=modalQty; updateModalTotal(); });
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('productModal').addEventListener('click', (e)=>{ if(e.target===e.currentTarget) closeModal(); });
  document.getElementById('mOrderBtn').addEventListener('click', ()=>{
    if(!currentModalProduct) return;
    const msg = buildSingleProductMessage(currentModalProduct, modalQty);
    openWhatsApp(msg);
  });
  document.getElementById('mAddCart').addEventListener('click', ()=>{
    if(!currentModalProduct) return;
    const existing = cart.find(c=>c.id===currentModalProduct.id);
    if(existing) existing.qty += modalQty;
    else cart.push({id:currentModalProduct.id, name:currentModalProduct.name, price:Number(currentModalProduct.price), image:currentModalProduct.image, category:currentModalProduct.category, description:currentModalProduct.description, qty:modalQty});
    saveCart();
    toast(`تمت إضافة ${currentModalProduct.name} للسلة`);
    closeModal();
    openCart();
  });

  // cart drawer
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('closeCart').addEventListener('click', closeCart);
  document.getElementById('cartBackdrop').addEventListener('click', closeCart);
  document.getElementById('clearCart').addEventListener('click', ()=>{ cart=[]; saveCart(); toast('تم تفريغ السلة'); });
  document.getElementById('checkoutWa').addEventListener('click', ()=>{
    if(cart.length===0) return;
    const msg = buildCartMessage(cart);
    openWhatsApp(msg);
  });

  // smooth nav active
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href=a.getAttribute('href');
      if(href.startsWith('#') && href.length>1){
        e.preventDefault();
        const target=document.querySelector(href);
        if(target) target.scrollIntoView({behavior:'smooth'});
        if(a.closest('.dots-dropdown')) a.closest('.dots-dropdown').classList.remove('open');
      }
    });
  });

  // listen storage changes (admin updates)
  window.addEventListener('storage', ()=>{
    renderCategories();
    renderProducts();
    renderContacts();
    updateCartUI();
  });
  // also poll for same-tab updates
  setInterval(()=>{
    // if admin changed in same tab via localStorage
    // re-render contacts/prices quickly
  }, 3000);
});
