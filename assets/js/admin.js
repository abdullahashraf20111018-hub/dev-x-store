/* Dev-X admin page. Security = RLS + RPCs in Supabase (see supabase/migrations). This file only draws the UI:
   a visitor who is not listed in public.admins gets empty results / "forbidden" from the database no matter what the browser does. */
(function () {
  const sb = DX.sb, $ = s => document.querySelector(s), app = $('#app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fm = n => Number(n).toLocaleString('en-US') + ' ج.م';
  const ST = { new: 'جديد', preparing: 'قيد التجهيز', contacted: 'تم التواصل', confirmed: 'مؤكد', delivered: 'تم التسليم', cancelled: 'ملغي' };
  const NEXT = { new: ['preparing'], preparing: ['contacted'], contacted: ['confirmed'], confirmed: ['delivered'], delivered: [], cancelled: [] };
  const CANCELLABLE = s => ['new', 'preparing', 'contacted', 'confirmed'].includes(s);
  let tt; const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('s'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('s'), 2600) };
  const S = { user: null, tab: 'orders', orders: [], products: [], cats: [], coupons: [], msgs: [], filter: 'all', q: '', sound: true, fresh: new Set(), ch: null };

  /* ---------- gate: real login → must be in public.admins ---------- */
  async function start() {
    if (!DX.ready) return gate('خدمة الدخول غير مفعّلة: أضف بيانات Supabase في assets/js/config.js');
    const ses = await DX.session();
    if (!ses) return gate();
    S.user = ses.user;
    if (!(await DX.isAdmin(S.user.id))) return denied();
    await loadAll(); subscribe(); shell();
  }
  function gate(msg) {
    app.innerHTML = '<div class="ax-center"><div class="ax-card"><img src="assets/img/logo.jpg" alt="Dev-X" style="width:80px;border-radius:18px"><h1>لوحة الإدارة</h1><p style="color:var(--text-muted)">سجّل دخولك بحساب الأدمن.</p>' + (msg ? '<p style="color:#ff8a80;font-weight:700">' + esc(msg) + '</p>' : '') +
      '<div class="ax-f"><label>البريد الإلكتروني</label><input id="e" type="email" autocomplete="email" style="direction:ltr"></div><div class="ax-f" id="cb" style="display:none"><label>رمز التحقق</label><input id="c" inputmode="numeric" maxlength="8" autocomplete="one-time-code"></div>' +
      '<button class="ax-btn" id="send">إرسال الرمز</button> <button class="ax-btn" id="ok" style="display:none">دخول</button> <button class="ax-btn o" id="g">Google</button></div></div>';
    let em = '';
    $('#g').onclick = () => DX.google().catch(e => toast(DX.err(e)));
    $('#send').onclick = async () => { em = $('#e').value.trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return toast('بريد غير صحيح');
      try { await DX.sendCode(em, null); $('#cb').style.display = ''; $('#ok').style.display = ''; toast('تم إرسال الرمز') } catch (e) { toast(DX.err(e)) } };
    $('#ok').onclick = async () => { try { await DX.verifyCode(em, $('#c').value.replace(/\s/g, '')); start() } catch (e) { toast(DX.err(e)) } };
  }
  function denied() {
    app.innerHTML = '<div class="ax-center"><div class="ax-card"><h1>غير مصرح</h1><p>هذا الحساب (' + esc(S.user.email) + ') ليس ضمن مسؤولي المتجر.</p><a class="ax-btn" href="index.html">العودة للمتجر</a> <button class="ax-btn o" id="lo">تسجيل الخروج</button></div></div>';
    $('#lo').onclick = async () => { await DX.signOut(); start() };
  }

  /* ---------- data ---------- */
  async function loadAll() { await Promise.all([loadOrders(), loadProducts(), loadCoupons(), loadMsgs()]) }
  async function loadOrders() {
    const { data, error } = await sb.from('orders').select('*, order_items(*), order_events(*), order_messages(*)').order('created_at', { ascending: false });
    if (error) return toast(DX.err(error)); S.orders = data;
  }
  async function loadProducts() {
    const [p, c] = await Promise.all([sb.from('products').select('*').order('sort').order('id'), sb.from('categories').select('*').order('sort')]);
    S.products = p.data || []; S.cats = (c.data || []).map(x => x.name);
  }
  async function loadCoupons() { const { data } = await sb.from('coupons').select('*').order('created_at'); S.coupons = data || [] }
  async function loadMsgs() { const { data } = await sb.from('contact_messages').select('*').order('created_at', { ascending: false }); S.msgs = data || [] }
  function subscribe() {
    S.ch = sb.channel('admin-orders').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async p => {
      await loadOrders(); S.fresh.add(p.new.id); toast('🔔 طلب جديد #' + p.new.order_no); if (S.sound) beep(); if (S.tab === 'orders' || S.tab === 'dash') draw();
    }).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, async () => { await loadOrders(); if (S.tab === 'orders' || S.tab === 'dash') draw() }).subscribe();
  }
  function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.setValueAtTime(.2, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .6); o.start(); o.stop(a.currentTime + .6) } catch (e) { } }

  /* ---------- shell ---------- */
  const TABS = [['dash', 'نظرة عامة'], ['orders', 'الطلبات'], ['products', 'المنتجات'], ['coupons', 'أكواد الخصم'], ['msgs', 'رسائل التواصل']];
  function shell() {
    app.innerHTML = '<div class="ax-wrap"><aside class="ax-side"><img src="assets/img/logo.jpg" alt="Dev-X">' + TABS.map(t => '<a data-t="' + t[0] + '">' + t[1] + '</a>').join('') +
      '<span class="sp"></span><a href="index.html">← المتجر</a><button id="lo">تسجيل الخروج</button></aside><main class="ax-main" id="main"></main></div><div class="ax-modal" id="modal"></div>';
    app.querySelectorAll('[data-t]').forEach(a => a.onclick = () => { S.tab = a.dataset.t; draw() });
    $('#lo').onclick = async () => { await DX.signOut(); location.reload() };
    $('#modal').onclick = e => { if (e.target.id === 'modal') closeM() };
    draw();
  }
  function closeM() { $('#modal').classList.remove('open'); $('#modal').innerHTML = '' }
  function openM(h) { $('#modal').innerHTML = '<div class="ax-box">' + h + '</div>'; $('#modal').classList.add('open') }
  function draw() {
    app.querySelectorAll('[data-t]').forEach(a => a.classList.toggle('on', a.dataset.t === S.tab));
    const v = { dash, orders: ordersV, products: productsV, coupons: couponsV, msgs: msgsV }[S.tab]; $('#main').innerHTML = v(); (bind[S.tab] || (() => { }))();
  }
  const bind = {};
  const cnt = s => S.orders.filter(o => o.status === s).length;

  /* ---------- dashboard ---------- */
  function dash() {
    const live = S.orders.filter(o => o.status !== 'cancelled'), rev = live.reduce((a, o) => a + Number(o.total), 0);
    const by = {}; live.forEach(o => by[o.branch] = (by[o.branch] || 0) + 1);
    const tp = {}; live.forEach(o => (o.order_items || []).forEach(i => tp[i.product_name] = (tp[i.product_name] || 0) + i.quantity));
    const top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => '<tr><td>' + esc(k) + '</td><td>' + v + '</td></tr>').join('') || '<tr><td>—</td><td></td></tr>';
    const low = S.products.filter(p => p.active && p.stock <= 5).map(p => '<tr><td>' + esc(p.name) + '</td><td>' + p.stock + '</td></tr>').join('') || '<tr><td>لا يوجد</td><td></td></tr>';
    return '<div class="ax-head"><h2>نظرة عامة</h2></div><div class="ax-stats"><div class="ax-stat"><span>طلبات جديدة</span><b>' + cnt('new') + '</b></div><div class="ax-stat"><span>قيد المعالجة</span><b>' + (cnt('preparing') + cnt('contacted') + cnt('confirmed')) + '</b></div><div class="ax-stat"><span>تم التسليم</span><b>' + cnt('delivered') + '</b></div><div class="ax-stat"><span>إجمالي المبيعات</span><b style="font-size:22px">' + fm(rev) + '</b></div></div>' +
      '<div class="ax-grid"><div><h3>الفروع الأكثر طلبًا</h3><table class="ax-tbl">' + top(by, 6) + '</table></div><div><h3>الأكثر مبيعًا</h3><table class="ax-tbl">' + top(tp, 6) + '</table></div><div><h3>مخزون منخفض (≤5)</h3><table class="ax-tbl">' + low + '</table></div></div>';
  }

  /* ---------- orders inbox ---------- */
  function ordersV() {
    const q = S.q.trim().toLowerCase();
    const l = S.orders.filter(o => (S.filter === 'all' || o.status === S.filter) && (!q || (o.order_no + ' ' + o.customer_name + ' ' + o.customer_phone + ' ' + o.branch).toLowerCase().includes(q)));
    return '<div class="ax-head"><h2>الطلبات (' + S.orders.length + ')</h2><div><label style="font-size:13px"><input type="checkbox" id="snd" ' + (S.sound ? 'checked' : '') + '> صوت التنبيه</label> <button class="ax-btn o" id="csv">تصدير CSV</button></div></div>' +
      '<div class="ax-tools"><input id="oq" placeholder="بحث برقم الطلب / الاسم / الموبايل / الفرع" value="' + esc(S.q) + '" style="flex:1;min-width:200px">' +
      [['all', 'الكل']].concat(Object.entries(ST)).map(([k, v]) => '<button class="ax-chip ' + (S.filter === k ? 'on' : '') + '" data-f="' + k + '">' + v + (k === 'all' ? '' : ' (' + cnt(k) + ')') + '</button>').join('') + '</div>' +
      '<div class="ax-scroll"><table class="ax-tbl"><thead><tr><th>#</th><th>العميل</th><th>الفرع</th><th>الإجمالي</th><th>الدفع</th><th>الحالة</th><th>الوقت</th></tr></thead><tbody>' +
      (l.length ? l.map(o => '<tr class="click ' + (S.fresh.has(o.id) ? 'fresh' : '') + '" data-o="' + o.id + '"><td>' + o.order_no + '</td><td>' + esc(o.customer_name) + '<br><small dir="ltr">' + esc(o.customer_phone) + '</small></td><td>' + esc(o.branch) + '</td><td>' + fm(o.total) + '</td><td>' + esc(o.payment_method) + '</td><td><span class="ax-st ' + o.status + '">' + ST[o.status] + '</span></td><td>' + new Date(o.created_at).toLocaleString('ar-EG') + '</td></tr>').join('') : '<tr><td colspan="7" style="text-align:center;padding:30px">لا توجد طلبات</td></tr>') + '</tbody></table></div>';
  }
  bind.orders = () => {
    $('#oq').oninput = e => { S.q = e.target.value; const p = e.target.selectionStart; draw(); const i = $('#oq'); i.focus(); i.setSelectionRange(p, p) };
    $('#snd').onchange = e => S.sound = e.target.checked;
    app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { S.filter = b.dataset.f; draw() });
    app.querySelectorAll('[data-o]').forEach(r => r.onclick = () => orderM(r.dataset.o));
    $('#csv').onclick = () => { const q = x => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"';
      const rows = [['رقم', 'التاريخ', 'العميل', 'الموبايل', 'المنتجات', 'الإجمالي', 'الفرع', 'الدفع', 'الحالة']].concat(S.orders.map(o => [o.order_no, o.created_at, o.customer_name, o.customer_phone, (o.order_items || []).map(i => i.product_name + '×' + i.quantity).join(' | '), o.total, o.branch, o.payment_method, ST[o.status]]));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' })); a.download = 'devx-orders.csv'; a.click() };
  };
  function waLink(o) {
    const t = 'أهلًا ' + o.customer_name + '، معاك فريق Dev-X بخصوص طلبك رقم #' + o.order_no + ' (الإجمالي ' + Number(o.total).toLocaleString('en-US') + ' ج.م). نود تأكيد الطلب وتفاصيل الدفع.';
    return 'https://wa.me/20' + o.customer_phone.replace(/^0/, '') + '?text=' + encodeURIComponent(t);
  }
  function orderM(id) {
    const o = S.orders.find(x => x.id === id); if (!o) return; S.fresh.delete(id);
    const ev = (o.order_events || []).slice().sort((a, b) => a.created_at < b.created_at ? -1 : 1), ms = (o.order_messages || []);
    openM('<div class="ax-head"><h2>طلب #' + o.order_no + ' <span class="ax-st ' + o.status + '">' + ST[o.status] + '</span></h2><button class="ax-btn o" id="x">إغلاق</button></div>' +
      '<div class="ax-grid"><div><b>العميل</b><br>' + esc(o.customer_name) + '<br><span dir="ltr">' + esc(o.customer_phone) + '</span><br>' + esc(o.customer_email || '') + '</div><div><b>الاستلام</b><br>' + esc(o.branch) + '<br>' + esc([o.governorate, o.address].filter(Boolean).join(' - ')) + '</div><div><b>الدفع</b><br>' + esc(o.payment_method) + '<br>' + (o.coupon_code ? 'كود: ' + esc(o.coupon_code) + ' (−' + o.discount_percent + '%)' : '') + '</div></div>' +
      (o.notes ? '<p><b>ملاحظات العميل:</b> ' + esc(o.notes) + '</p>' : '') +
      '<table class="ax-tbl" style="margin:12px 0"><thead><tr><th>المنتج</th><th>التفاصيل</th><th>الكمية</th><th>السعر</th></tr></thead><tbody>' + (o.order_items || []).map(i => '<tr><td>' + esc(i.product_name) + '</td><td>' + esc([i.color, i.size].filter(Boolean).join(' / ')) + '</td><td>' + i.quantity + '</td><td>' + fm(i.unit_price * i.quantity) + '</td></tr>').join('') + '</tbody></table>' +
      '<p style="font-size:18px"><b>الإجمالي: ' + fm(o.total) + '</b></p>' +
      '<div class="ax-tools"><a class="ax-btn wa" id="wa" href="' + waLink(o) + '" target="_blank" rel="noopener">واتساب</a>' + (o.customer_email ? '<button class="ax-btn o" id="em">إرسال إيميل تأكيد</button>' : '') +
      NEXT[o.status].map(s => '<button class="ax-btn" data-s="' + s + '">← ' + ST[s] + '</button>').join('') + (CANCELLABLE(o.status) ? '<button class="ax-btn red" data-s="cancelled">إلغاء الطلب</button>' : '') + '</div>' +
      '<b>السجل</b><ul class="ax-ev">' + ev.map(e => '<li>' + new Date(e.created_at).toLocaleString('ar-EG') + ' — ' + (ST[e.status] || e.status) + (e.note ? ' (' + esc(e.note) + ')' : '') + '</li>').join('') + ms.map(m => '<li>' + new Date(m.created_at).toLocaleString('ar-EG') + ' — تم التواصل عبر ' + (m.channel === 'whatsapp' ? 'واتساب' : 'الإيميل') + '</li>').join('') + '</ul>');
    $('#x').onclick = closeM;
    $('#wa').onclick = async () => { await logMsg(o, 'whatsapp', 'wa.me') };
    if ($('#em')) $('#em').onclick = () => sendEmail(o);
    $('#modal').querySelectorAll('[data-s]').forEach(b => b.onclick = async () => {
      const s = b.dataset.s; if (s === 'cancelled' && !confirm('إلغاء الطلب وإرجاع المخزون؟')) return; b.disabled = true;
      const { error } = await sb.rpc('admin_set_order_status', { p_order: o.id, p_status: s }); if (error) { b.disabled = false; return toast(DX.err(error)) }
      toast('✓ تم تحديث الحالة'); await Promise.all([loadOrders(), loadProducts()]); draw(); orderM(id);
      if (s === 'confirmed' && o.customer_email && confirm('إرسال إيميل تأكيد للعميل الآن؟')) sendEmail(S.orders.find(x => x.id === id));
    });
  }
  async function logMsg(o, channel, body) { const { error } = await sb.from('order_messages').insert({ order_id: o.id, channel, body, sent_by: S.user.id }); if (!error) { await loadOrders(); } }
  async function sendEmail(o) {
    toast('جاري إرسال الإيميل…');
    const { data, error } = await sb.functions.invoke('order-confirm-email', { body: { order_id: o.id } });
    if (error || (data && data.error)) return toast('تعذّر إرسال الإيميل: ' + ((data && data.error) || 'تحقق من إعداد Resend'));
    toast('✓ تم إرسال إيميل التأكيد'); await loadOrders(); if ($('#modal').classList.contains('open')) orderM(o.id);
  }

  /* ---------- products ---------- */
  function productsV() {
    return '<div class="ax-head"><h2>المنتجات (' + S.products.length + ')</h2><button class="ax-btn" id="addp">+ منتج جديد</button></div><div class="ax-scroll"><table class="ax-tbl"><thead><tr><th></th><th>الاسم</th><th>القسم</th><th>السعر</th><th>المخزون</th><th>الحالة</th><th></th></tr></thead><tbody>' +
      S.products.map(p => '<tr><td><img class="ax-thumb" src="' + esc(DX.imgUrl(p.image)) + '" alt=""></td><td>' + esc(p.name) + '</td><td>' + esc(p.category) + '</td><td>' + fm(p.price) + (p.old_price ? ' <s style="opacity:.6">' + p.old_price + '</s>' : '') + '</td><td>' + p.stock + '</td><td>' + (p.active ? 'ظاهر' : 'مخفي') + '</td><td><button class="ax-btn o" data-p="' + p.id + '">تعديل</button></td></tr>').join('') + '</tbody></table></div>';
  }
  bind.products = () => { $('#addp').onclick = () => productM(null); app.querySelectorAll('[data-p]').forEach(b => b.onclick = () => productM(+b.dataset.p)) };
  const slugify = s => 'dx-' + (s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item') + '-' + Date.now().toString(36);
  function productM(id) {
    const p = id ? S.products.find(x => x.id === id) : { name: '', description: '', category: S.cats[0], price: '', old_price: '', stock: 0, colors: [], sizes: [], image: '', active: true };
    openM('<div class="ax-head"><h2>' + (id ? 'تعديل منتج' : 'منتج جديد') + '</h2><button class="ax-btn o" id="x">إغلاق</button></div><div class="ax-grid ax-f2">' +
      '<div class="ax-f"><label>الاسم</label><input id="pn" maxlength="200" value="' + esc(p.name) + '"></div><div class="ax-f"><label>القسم</label><select id="pc">' + S.cats.map(c => '<option ' + (c === p.category ? 'selected' : '') + '>' + esc(c) + '</option>').join('') + '</select></div>' +
      '<div class="ax-f"><label>السعر</label><input id="pp" type="number" min="1" step="0.01" value="' + esc(p.price) + '"></div><div class="ax-f"><label>السعر قبل الخصم (اختياري)</label><input id="po" type="number" min="0" step="0.01" value="' + esc(p.old_price || '') + '"></div>' +
      '<div class="ax-f"><label>المخزون</label><input id="ps" type="number" min="0" value="' + esc(p.stock) + '"></div><div class="ax-f"><label>المقاسات (مفصولة بفاصلة)</label><input id="pz" value="' + esc((p.sizes || []).join(', ')) + '"></div></div>' +
      '<div class="ax-f"><label>الألوان (سطر لكل لون: الاسم:#لون)</label><textarea id="pk" rows="3">' + esc((p.colors || []).map(c => c.n + ':' + c.h).join('\n')) + '</textarea></div>' +
      '<div class="ax-f"><label>الوصف</label><textarea id="pd" rows="3">' + esc(p.description) + '</textarea></div>' +
      '<div class="ax-f"><label>الصورة (تُضغط تلقائيًا وتُرفع إلى التخزين)</label><input id="pi" type="file" accept="image/*"><img id="pv" class="ax-thumb" style="width:90px;height:90px;margin-top:6px" src="' + esc(DX.imgUrl(p.image)) + '" alt=""></div>' +
      '<label><input type="checkbox" id="pa" ' + (p.active ? 'checked' : '') + '> ظاهر في المتجر</label><div class="ax-tools" style="margin-top:14px"><button class="ax-btn" id="sv">حفظ</button>' + (id ? '<button class="ax-btn red" id="dl">حذف</button>' : '') + '</div>');
    let img = p.image || ''; $('#x').onclick = closeM;
    $('#pi').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const blob = await toWebp(f); const path = 'p/' + Date.now() + '.webp';
        const { error } = await sb.storage.from('products').upload(path, blob, { contentType: 'image/webp', upsert: false }); if (error) throw error;
        img = sb.storage.from('products').getPublicUrl(path).data.publicUrl; $('#pv').src = img; toast('✓ تم رفع الصورة') } catch (er) { toast('تعذّر رفع الصورة: ' + DX.err(er)) } };
    $('#sv').onclick = async () => {
      const name = $('#pn').value.trim(), price = +$('#pp').value, old = +$('#po').value || null, stock = Math.floor(+$('#ps').value);
      if (name.length < 2 || !(price > 0) || !(stock >= 0)) return toast('اكتب الاسم والسعر والمخزون بشكل صحيح'); if (old && old <= price) return toast('السعر القديم يجب أن يكون أكبر من السعر الحالي');
      const colors = $('#pk').value.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [n, h] = l.split(':'); return { n: (n || '').trim(), h: (h || '#111111').trim() } }).filter(c => c.n && /^#[0-9a-fA-F]{6}$/.test(c.h));
      const row = { name, category: $('#pc').value, price, old_price: old, stock, sizes: $('#pz').value.split(',').map(s => s.trim()).filter(Boolean), colors, description: $('#pd').value.trim(), image: img || null, active: $('#pa').checked };
      const r = id ? await sb.from('products').update(row).eq('id', id) : await sb.from('products').insert(Object.assign({ slug: slugify(name), sort: S.products.length }, row));
      if (r.error) return toast(DX.err(r.error)); toast('✓ تم الحفظ'); closeM(); await loadProducts(); draw();
    };
    if (id) $('#dl').onclick = async () => { if (!confirm('حذف المنتج نهائيًا؟ (يمكنك إخفاءه بدلًا من ذلك)')) return; const { error } = await sb.from('products').delete().eq('id', id); if (error) return toast(DX.err(error)); closeM(); await loadProducts(); draw() };
  }
  function toWebp(f) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => { const k = Math.min(1, 900 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); c.toBlob(b => b ? res(b) : rej(new Error('toBlob')), 'image/webp', .8) }; im.onerror = () => rej(new Error('image')); im.src = URL.createObjectURL(f) }) }

  /* ---------- coupons ---------- */
  function couponsV() {
    return '<div class="ax-head"><h2>أكواد الخصم</h2></div><div class="ax-tools"><input id="cn" placeholder="الكود مثل SALE20" style="direction:ltr"><input id="cp" type="number" min="1" max="100" placeholder="النسبة %"><button class="ax-btn" id="ca">إضافة</button></div><table class="ax-tbl"><thead><tr><th>الكود</th><th>الخصم</th><th>الحالة</th><th></th></tr></thead><tbody>' +
      S.coupons.map(c => '<tr><td dir="ltr">' + esc(c.code) + '</td><td>' + c.percent + '%</td><td>' + (c.active ? 'فعّال' : 'موقوف') + '</td><td><button class="ax-btn o" data-ct="' + esc(c.code) + '">' + (c.active ? 'إيقاف' : 'تفعيل') + '</button> <button class="ax-btn red" data-cd="' + esc(c.code) + '">حذف</button></td></tr>').join('') + '</tbody></table>';
  }
  bind.coupons = () => {
    $('#ca').onclick = async () => { const code = $('#cn').value.trim().toUpperCase(), percent = +$('#cp').value; if (!/^[A-Z0-9_-]{3,24}$/.test(code) || !(percent >= 1 && percent <= 100)) return toast('كود (3-24 حرف/رقم) ونسبة من 1 إلى 100');
      const { error } = await sb.from('coupons').insert({ code, percent }); if (error) return toast(error.code === '23505' ? 'الكود موجود بالفعل' : DX.err(error)); await loadCoupons(); draw() };
    app.querySelectorAll('[data-ct]').forEach(b => b.onclick = async () => { const c = S.coupons.find(x => x.code === b.dataset.ct); await sb.from('coupons').update({ active: !c.active }).eq('code', c.code); await loadCoupons(); draw() });
    app.querySelectorAll('[data-cd]').forEach(b => b.onclick = async () => { if (!confirm('حذف الكود؟')) return; await sb.from('coupons').delete().eq('code', b.dataset.cd); await loadCoupons(); draw() });
  };

  /* ---------- contact messages ---------- */
  function msgsV() {
    return '<div class="ax-head"><h2>رسائل التواصل (' + S.msgs.length + ')</h2></div>' + (S.msgs.map(m => '<div class="ax-card" style="max-width:none;margin-bottom:10px"><b>' + esc(m.name) + '</b> — <span dir="ltr">' + esc(m.phone) + '</span> ' + esc(m.email || '') + '<br><small>' + esc(m.topic) + ' · ' + new Date(m.created_at).toLocaleString('ar-EG') + '</small><p style="white-space:pre-wrap">' + esc(m.message) + '</p><a class="ax-btn wa" target="_blank" rel="noopener" href="https://wa.me/20' + m.phone.replace(/^0/, '') + '">رد عبر واتساب</a></div>').join('') || '<p>لا توجد رسائل.</p>');
  }

  DX.onAuth((ev) => { if (ev === 'SIGNED_IN' && !S.user) start() });
  start().catch(e => gate(DX.err(e)));
})();
