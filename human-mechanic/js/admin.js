// Admin Logic with real auth
let editingProductId = null;
let editingContactId = null;

function isAuthenticated(){
  return sessionStorage.getItem('hm_admin_auth') === '1';
}
function requireAuth(){
  const loginScreen = document.getElementById('loginScreen');
  const dash = document.getElementById('dashboard');
  if(isAuthenticated()){
    loginScreen.classList.add('hidden');
    dash.classList.remove('hidden');
    renderAll();
  } else {
    loginScreen.classList.remove('hidden');
    dash.classList.add('hidden');
  }
}
function showAlert(el, msg, type){
  el.textContent = msg;
  el.className = 'alert ' + type;
  el.style.display='block';
  setTimeout(()=>{ el.style.display='none'; }, 3500);
}
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}
function detectIcon(platform){
  const p=(platform||'').toLowerCase();
  if(p.includes('whatsapp')||p.includes('واتس')) return {icon:'fa-brands fa-whatsapp', bg:'#25D366'};
  if(p.includes('facebook')||p.includes('فيس')) return {icon:'fa-brands fa-facebook-f', bg:'#1877F2'};
  if(p.includes('instagram')) return {icon:'fa-brands fa-instagram', bg:'#DD2A7B'};
  if(p.includes('tiktok')) return {icon:'fa-brands fa-tiktok', bg:'#000'};
  if(p.includes('telegram')) return {icon:'fa-brands fa-telegram', bg:'#26A5E4'};
  if(p.includes('youtube')) return {icon:'fa-brands fa-youtube', bg:'#FF0000'};
  if(p.includes('linkedin')) return {icon:'fa-brands fa-linkedin-in', bg:'#0A66C2'};
  if(p.includes('twitter')||p==='x'||p.includes('x.com')) return {icon:'fa-brands fa-x-twitter', bg:'#000'};
  if(p.includes('messenger')) return {icon:'fa-brands fa-facebook-messenger', bg:'#0084FF'};
  if(p.includes('mail')||p.includes('gmail')||p.includes('email')) return {icon:'fa-solid fa-envelope', bg:'#34495E'};
  if(p.includes('phone')||p.includes('tel')||p.includes('هاتف')) return {icon:'fa-solid fa-phone', bg:'#0EA5A0'};
  return {icon:'fa-solid fa-link', bg:'#0B1C33'};
}

function switchTab(tab){
  document.querySelectorAll('.side-link').forEach(a=>a.classList.toggle('active', a.dataset.tab===tab));
  document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('hidden', p.dataset.panel!==tab));
}
function renderAll(){
  renderStats();
  renderProductsTable();
  renderContactsTable();
  fillSettings();
  fillAccount();
  document.getElementById('overviewDate').textContent = new Date().toLocaleDateString('ar-EG', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
}

function renderStats(){
  const prods = DB.getProducts();
  const contacts = DB.getContacts();
  const cats = DB.getCategories();
  const byCat = {};
  prods.forEach(p=> byCat[p.category]=(byCat[p.category]||0)+1);
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><span>إجمالي المنتجات</span><strong>${prods.length}</strong><span style="color:var(--teal)">${prods.length?'ديناميكي من DB':'لا يوجد'}</span></div>
    <div class="stat-card"><span>العلاج الطبيعي</span><strong>${byCat.physio||0}</strong><span>${cats.find(c=>c.id==='physio')?.name||''}</span></div>
    <div class="stat-card"><span>الصيدلة</span><strong>${byCat.pharmacy||0}</strong><span>${cats.find(c=>c.id==='pharmacy')?.name||''}</span></div>
    <div class="stat-card"><span>الأسنان</span><strong>${byCat.dental||0}</strong><span>${cats.find(c=>c.id==='dental')?.name||''}</span></div>
  `;
  document.getElementById('prodCount').textContent = `${prods.length} منتج`;
}

function renderProductsTable(){
  const tbody = document.getElementById('productsTable');
  const prods = DB.getProducts();
  if(prods.length===0){
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)"><div style="font-size:28px">📦</div><div style="font-weight:800;margin-top:6px">لا توجد منتجات</div><div style="font-size:12px">اضغط "إضافة منتج" لإضافة أول منتج — سيظهر فوراً في المتجر</div></td></tr>`;
    return;
  }
  const catMap = {}; DB.getCategories().forEach(c=>catMap[c.id]=c.name);
  tbody.innerHTML = prods.map(p=>`
    <tr>
      <td><img src="${p.image}" onerror="this.src='https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200'"></td>
      <td style="font-weight:800;max-width:160px"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div><div style="font-size:11px;color:var(--muted)">${p.id.slice(0,10)}</div></td>
      <td><span class="badge" style="background:#EFF6FF;color:#2563EB">${catMap[p.category]||p.category}</span></td>
      <td style="font-weight:800">${Number(p.price).toLocaleString()} ${DB.getSettings().currency||'ج.م'}</td>
      <td style="max-width:220px"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.description}</div><div style="font-size:11px;color:var(--muted)">${(p.tags||'').slice(0,30)}</div></td>
      <td>
        <div class="actions">
          <button class="btn-sm edit" onclick="editProduct('${p.id}')"><i class="fa-solid fa-pen"></i> تعديل</button>
          <button class="btn-sm del" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i> حذف</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderContactsTable(){
  const tbody = document.getElementById('contactsTable');
  let contacts = DB.getContacts().sort((a,b)=>(a.order||0)-(b.order||0));
  if(contacts.length===0){
    tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">لا توجد وسائل تواصل — أضف واتساب، فيسبوك ...</td></tr>`;
    return;
  }
  tbody.innerHTML = contacts.map((c, idx)=> {
    const det = detectIcon(c.platform);
    return `
    <tr>
      <td style="font-weight:800">${c.platform}</td>
      <td style="max-width:220px"><a href="${c.url}" target="_blank" style="color:var(--teal);text-decoration:underline;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${c.url}</a></td>
      <td><span style="width:36px;height:36px;border-radius:10px;background:${det.bg};color:#fff;display:grid;place-items:center"><i class="${det.icon}"></i></span></td>
      <td><span class="badge ${c.active?'on':'off'}">${c.active?'مفعّل':'مخفي'}</span></td>
      <td>
        <div class="order-btns">
          <div style="display:flex;gap:4px">
            <button onclick="moveContact('${c.id}', -1)" ${idx===0?'disabled':''}><i class="fa-solid fa-chevron-up"></i></button>
            <button onclick="moveContact('${c.id}', 1)" ${idx===contacts.length-1?'disabled':''}><i class="fa-solid fa-chevron-down"></i></button>
          </div>
          <span style="font-size:11px;color:var(--muted)">#${c.order||idx+1}</span>
        </div>
      </td>
      <td>
        <div class="actions">
          <button class="btn-sm edit" onclick="editContact('${c.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-sm" onclick="toggleContact('${c.id}')" style="${c.active?'background:#FEF2F2;color:#EF4444;border-color:#FECACA':'background:#F0FDF4;color:#15803D;border-color:#BBF7D0'}"><i class="fa-solid ${c.active?'fa-eye-slash':'fa-eye'}"></i></button>
          <button class="btn-sm del" onclick="deleteContact('${c.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function fillSettings(){
  const s = DB.getSettings();
  document.getElementById('sWa').value = s.whatsappNumber||'';
  document.getElementById('sCurrency').value = s.currency||'ج.م';
  document.getElementById('sName').value = s.storeName||'Human Mechanic';
  document.getElementById('sTagline').value = s.storeTagline||'';
}
function fillAccount(){
  const a = DB.getAdmin();
  document.getElementById('aUser').value = a.username||'';
  document.getElementById('aEmail').value = a.email||'';
  document.getElementById('aOldPass').value='';
  document.getElementById('aNewPass').value='';
}

// Product CRUD
window.editProduct = function(id){
  const p = DB.getProducts().find(x=>x.id===id);
  if(!p) return;
  editingProductId = id;
  document.getElementById('pmTitle').textContent='تعديل المنتج';
  document.getElementById('pImage').value=p.image;
  document.getElementById('pName').value=p.name;
  document.getElementById('pPrice').value=p.price;
  document.getElementById('pCategory').value=p.category;
  document.getElementById('pTags').value=p.tags||'';
  document.getElementById('pDesc').value=p.description;
  document.getElementById('pDetails').value=p.details||'';
  document.getElementById('productModal').classList.add('open');
}
window.deleteProduct = function(id){
  if(!confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع.')) return;
  // auth check
  if(!isAuthenticated()){ alert('غير مصرح — سجل الدخول أولاً'); return; }
  DB.deleteProduct(id);
  renderProductsTable(); renderStats();
  toast('تم حذف المنتج');
}

window.moveContact = function(id, dir){
  let arr = DB.getContacts().sort((a,b)=>(a.order||0)-(b.order||0));
  const idx = arr.findIndex(c=>c.id===id);
  if(idx===-1) return;
  const newIdx = idx+dir;
  if(newIdx<0||newIdx>=arr.length) return;
  [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
  arr.forEach((c,i)=> c.order=i+1);
  DB.setContacts(arr);
  renderContactsTable();
}
window.toggleContact = function(id){
  const arr = DB.getContacts();
  const c = arr.find(x=>x.id===id);
  if(c){ c.active=!c.active; DB.setContacts(arr); renderContactsTable(); toast(c.active?'تم التفعيل':'تم الإخفاء'); }
}
window.deleteContact = function(id){
  if(!confirm('حذف وسيلة التواصل؟')) return;
  if(!isAuthenticated()){ alert('غير مصرح'); return; }
  DB.setContacts(DB.getContacts().filter(c=>c.id!==id));
  renderContactsTable();
}
window.editContact = function(id){
  const c = DB.getContacts().find(x=>x.id===id);
  if(!c) return;
  editingContactId=id;
  document.getElementById('cmTitle').textContent='تعديل وسيلة التواصل';
  document.getElementById('cPlatform').value=c.platform;
  document.getElementById('cUrl').value=c.url;
  document.getElementById('cActive').value=String(c.active);
  updateContactPreview();
  document.getElementById('contactModal').classList.add('open');
}
function updateContactPreview(){
  const plat=document.getElementById('cPlatform').value;
  const det=detectIcon(plat);
  const el=document.getElementById('cPreviewIcon');
  el.style.background=det.bg;
  el.innerHTML=`<i class="${det.icon}"></i>`;
}

document.addEventListener('DOMContentLoaded', ()=>{
  requireAuth();

  // login
  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('loginPass').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
  document.getElementById('loginUser').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
  function doLogin(){
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const admin = DB.getAdmin();
    const alertEl = document.getElementById('loginAlert');
    // real auth: check username or email + password
    const userMatch = (user===admin.username || user===admin.email);
    if(!user || !pass){
      showAlert(alertEl, 'يرجى إدخال اسم المستخدم وكلمة المرور', 'error'); return;
    }
    if(userMatch && pass===admin.password){
      sessionStorage.setItem('hm_admin_auth','1');
      // also store timestamp
      sessionStorage.setItem('hm_admin_user', admin.username);
      requireAuth();
      toast('مرحباً '+admin.username+' — تم تسجيل الدخول بنجاح');
    } else {
      showAlert(alertEl, 'بيانات الدخول غير صحيحة — تحقق من اسم المستخدم أو البريد وكلمة المرور', 'error');
    }
  }

  document.getElementById('logoutBtn').addEventListener('click', ()=>{
    sessionStorage.removeItem('hm_admin_auth');
    sessionStorage.removeItem('hm_admin_user');
    requireAuth();
    toast('تم تسجيل الخروج');
  });

  // tabs
  document.querySelectorAll('.side-link').forEach(btn=>{
    btn.addEventListener('click', ()=> switchTab(btn.dataset.tab));
  });

  // Product modal
  const pModal=document.getElementById('productModal');
  document.getElementById('addProductBtn').addEventListener('click', ()=>{
    editingProductId=null;
    document.getElementById('pmTitle').textContent='إضافة منتج جديد';
    document.getElementById('pImage').value='';
    document.getElementById('pName').value='';
    document.getElementById('pPrice').value='';
    document.getElementById('pCategory').value='physio';
    document.getElementById('pTags').value='';
    document.getElementById('pDesc').value='';
    document.getElementById('pDetails').value='';
    pModal.classList.add('open');
  });
  document.getElementById('closeProductModal').addEventListener('click', ()=> pModal.classList.remove('open'));
  document.getElementById('cancelProductBtn').addEventListener('click', ()=> pModal.classList.remove('open'));
  pModal.addEventListener('click', e=>{ if(e.target===pModal) pModal.classList.remove('open'); });
  document.getElementById('saveProductBtn').addEventListener('click', ()=>{
    if(!isAuthenticated()){ alert('غير مصرح — سجل الدخول'); return; }
    const image=document.getElementById('pImage').value.trim();
    const name=document.getElementById('pName').value.trim();
    const price=document.getElementById('pPrice').value.trim();
    const category=document.getElementById('pCategory').value;
    const tags=document.getElementById('pTags').value.trim();
    const desc=document.getElementById('pDesc').value.trim();
    const details=document.getElementById('pDetails').value.trim();
    const alertEl=document.getElementById('pmAlert');
    if(!image||!name||!price||!desc){
      showAlert(alertEl,'يرجى ملء الحقول المطلوبة (الصورة، الاسم، السعر، الوصف)','error'); return;
    }
    if(isNaN(Number(price)) || Number(price)<=0){
      showAlert(alertEl,'السعر يجب أن يكون رقماً صحيحاً أكبر من صفر','error'); return;
    }
    if(editingProductId){
      DB.updateProduct(editingProductId, {image, name, price:Number(price), category, tags, description:desc, details});
      toast('تم تحديث المنتج');
    } else {
      DB.addProduct({image, name, price:Number(price), category, tags, description:desc, details});
      toast('تمت إضافة المنتج — سيظهر فوراً في المتجر');
    }
    pModal.classList.remove('open');
    renderProductsTable(); renderStats();
  });

  // Contact modal
  const cModal=document.getElementById('contactModal');
  document.getElementById('addContactBtn').addEventListener('click', ()=>{
    editingContactId=null;
    document.getElementById('cmTitle').textContent='إضافة وسيلة تواصل';
    document.getElementById('cPlatform').value='';
    document.getElementById('cUrl').value='';
    document.getElementById('cActive').value='true';
    updateContactPreview();
    cModal.classList.add('open');
  });
  document.getElementById('closeContactModal').addEventListener('click', ()=> cModal.classList.remove('open'));
  document.getElementById('cancelContactBtn').addEventListener('click', ()=> cModal.classList.remove('open'));
  cModal.addEventListener('click', e=>{ if(e.target===cModal) cModal.classList.remove('open'); });
  document.getElementById('cPlatform').addEventListener('input', updateContactPreview);
  document.getElementById('saveContactBtn').addEventListener('click', ()=>{
    if(!isAuthenticated()){ alert('غير مصرح'); return; }
    const platform=document.getElementById('cPlatform').value.trim();
    const url=document.getElementById('cUrl').value.trim();
    const active=document.getElementById('cActive').value==='true';
    const alertEl=document.getElementById('cmAlert');
    if(!platform||!url){ showAlert(alertEl,'يرجى إدخال اسم المنصة والرابط','error'); return; }
    try{ new URL(url); } catch{ showAlert(alertEl,'الرابط غير صحيح — يجب أن يبدأ بـ https://','error'); return; }
    let arr=DB.getContacts();
    if(editingContactId){
      const c=arr.find(x=>x.id===editingContactId);
      if(c){ c.platform=platform; c.url=url; c.active=active; }
    } else {
      arr.push({id:'c_'+Date.now(), platform, url, active, order:arr.length+1});
    }
    DB.setContacts(arr);
    cModal.classList.remove('open');
    renderContactsTable();
    toast(editingContactId?'تم التحديث':'تمت الإضافة — الأيقونة ظهرت تلقائياً');
  });

  // Settings
  document.getElementById('saveSettingsBtn').addEventListener('click', ()=>{
    if(!isAuthenticated()){ alert('غير مصرح'); return; }
    const wa=document.getElementById('sWa').value.trim().replace(/\D/g,'');
    const currency=document.getElementById('sCurrency').value.trim()||'ج.م';
    const name=document.getElementById('sName').value.trim()||'Human Mechanic';
    const tagline=document.getElementById('sTagline').value.trim();
    const alertEl=document.getElementById('settingsAlert');
    if(!wa){ showAlert(alertEl,'رقم واتساب مطلوب','error'); return; }
    if(wa.length<10){ showAlert(alertEl,'رقم واتساب غير صحيح','error'); return; }
    const s=DB.getSettings();
    s.whatsappNumber=wa; s.currency=currency; s.storeName=name; s.storeTagline=tagline;
    DB.setSettings(s);
    showAlert(alertEl,'تم حفظ الإعدادات — رقم واتساب سيُستخدم الآن في كل الطلبات','success');
    toast('تم حفظ الإعدادات');
  });

  // Account
  document.getElementById('saveAccountBtn').addEventListener('click', ()=>{
    if(!isAuthenticated()){ alert('غير مصرح'); return; }
    const user=document.getElementById('aUser').value.trim();
    const email=document.getElementById('aEmail').value.trim();
    const oldPass=document.getElementById('aOldPass').value;
    const newPass=document.getElementById('aNewPass').value;
    const alertEl=document.getElementById('accountAlert');
    const admin=DB.getAdmin();
    if(!user||!email){ showAlert(alertEl,'اسم المستخدم والبريد مطلوبان','error'); return; }
    if(!oldPass){ showAlert(alertEl,'يرجى إدخال كلمة المرور الحالية للتأكيد','error'); return; }
    if(oldPass!==admin.password){ showAlert(alertEl,'كلمة المرور الحالية غير صحيحة','error'); return; }
    if(newPass && newPass.length<6){ showAlert(alertEl,'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل','error'); return; }
    admin.username=user; admin.email=email;
    if(newPass) admin.password=newPass;
    DB.setAdmin(admin);
    sessionStorage.setItem('hm_admin_user', user);
    showAlert(alertEl,'تم تحديث بيانات الحساب بنجاح'+(newPass?' — كلمة المرور تغيّرت':''),'success');
    fillAccount();
    toast('تم تحديث الحساب');
  });

});
