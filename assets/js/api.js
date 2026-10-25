/* Dev-X Store · data layer. Everything that talks to Supabase lives here, so app.js stays UI-only. */
(function () {
  const C = window.DEVX_CONFIG || {};
  const ready = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase && window.supabase.createClient);
  const sb = ready ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
  }) : null;

  /* error codes raised by the database / auth → clear Arabic messages */
  const MSG = {
    not_authenticated: 'سجّل دخولك أولًا', rate_limited: 'عدد محاولات كبير، حاول مرة أخرى بعد قليل',
    invalid_name: 'اكتب اسمك الكامل (3 أحرف على الأقل)', invalid_phone: 'اكتب رقم موبايل مصري صحيح (01xxxxxxxxx)',
    invalid_branch: 'اختر فرعًا صحيحًا', invalid_payment: 'اختر طريقة دفع صحيحة', empty_cart: 'السلة فاضية',
    too_many_items: 'عدد المنتجات في السلة أكبر من المسموح', invalid_coupon: 'كود الخصم غير صحيح',
    product_unavailable: 'أحد المنتجات لم يعد متاحًا', insufficient_stock: 'الكمية المطلوبة غير متوفرة', invalid_quantity: 'كمية غير صحيحة',
    color_required: 'اختر اللون', invalid_color: 'اللون غير متاح', size_required: 'اختر المقاس', invalid_size: 'المقاس غير متاح',
    invalid_item: 'بيانات المنتج غير صحيحة', not_found: 'الطلب غير موجود', cannot_cancel: 'لا يمكن إلغاء الطلب في حالته الحالية',
    forbidden: 'ليست لديك صلاحية لهذا الإجراء', invalid_transition: 'لا يمكن نقل الطلب لهذه الحالة'
  };
  function err(e) {
    if (!e) return 'حدث خطأ غير متوقع';
    const m = String(e.message || e), code = Object.keys(MSG).find(k => m.includes(k));
    if (code) return MSG[code] + (e.details && (code === 'insufficient_stock' || code.endsWith('_required') || code.startsWith('invalid_c') || code === 'invalid_size' || code === 'product_unavailable') ? ' — ' + e.details : '');
    if (/captcha/i.test(m)) return 'فشل التحقق الأمني، أعد المحاولة';
    if (/otp_expired|expired|invalid.*(token|otp)|token.*invalid/i.test(m)) return 'الرمز غير صحيح أو انتهت صلاحيته';
    if (/rate limit|too many|over_email_send_rate_limit|security purposes/i.test(m)) return 'طلبات كثيرة، انتظر دقيقة ثم حاول مرة أخرى';
    if (/fetch|network|failed to/i.test(m)) return 'تعذّر الاتصال بالخادم، تحقق من الإنترنت';
    return 'تعذّر تنفيذ الطلب، حاول مرة أخرى';
  }
  const must = () => { if (!sb) throw new Error('not_configured'); return sb; };
  const imgUrl = k => !k ? '' : /^https?:\/\//.test(k) ? k : 'assets/products/' + k + '.webp';
  const toApp = r => ({
    id: r.id, slug: r.slug, name: r.name, desc: r.description || r.desc || '', cat: r.category || r.cat,
    price: Number(r.price), old: Number(r.old_price != null ? r.old_price : (r.old || 0)) || 0,
    qty: r.stock != null ? r.stock : r.qty, colors: r.colors || [], sizes: r.sizes || [], img: imgUrl(r.image || r.img), active: r.active !== false
  });
  async function json(path) { const r = await fetch(path, { cache: 'no-cache' }); if (!r.ok) throw new Error('fetch'); return r.json(); }

  const DX = {
    ready, sb, err, imgUrl, toApp, config: C,
    /* ---- catalogue (public) ---- */
    async products() {
      if (!sb) return (await json('data/products.json')).map(toApp);
      const { data, error } = await sb.from('products').select('*').eq('active', true).order('sort').order('id');
      if (error) throw error; return data.map(toApp);
    },
    async branches() {
      if (!sb) return json('data/branches.json');
      const { data, error } = await sb.from('branches').select('name').eq('active', true).order('sort');
      if (error) throw error; return data.map(b => b.name);
    },
    /* ---- auth ---- */
    async session() { if (!sb) return null; const { data } = await sb.auth.getSession(); return data.session; },
    onAuth(cb) { if (sb) sb.auth.onAuthStateChange((ev, s) => cb(ev, s)); },
    async google() {
      const { error } = await must().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
      if (error) throw error;
    },
    async sendCode(email, meta, captchaToken) {
      const { error } = await must().auth.signInWithOtp({ email, options: { shouldCreateUser: true, data: meta || undefined, captchaToken: captchaToken || undefined } });
      if (error) throw error;
    },
    async verifyCode(email, token) {
      const { data, error } = await must().auth.verifyOtp({ email, token, type: 'email' });
      if (error) throw error; return data.session;
    },
    async signOut() { if (sb) await sb.auth.signOut(); },
    /* ---- profile ---- */
    async profile(uid) {
      const { data, error } = await must().from('profiles').select('*').eq('id', uid).maybeSingle();
      if (error) throw error; return data;
    },
    async saveProfile(uid, patch) {
      const { data, error } = await must().from('profiles').update(patch).eq('id', uid).select().single();
      if (error) throw error; return data;
    },
    async isAdmin(uid) {
      if (!sb) return false;
      const { data } = await sb.from('admins').select('user_id').eq('user_id', uid).maybeSingle();
      return !!data;
    },
    async deleteAccount() { const { error } = await must().rpc('delete_my_account'); if (error) throw error; await sb.auth.signOut(); },
    /* ---- orders ---- */
    async coupon(code) { const { data, error } = await must().rpc('validate_coupon', { p_code: code }); if (error) throw error; return data; },
    async createOrder(o) {
      const { data, error } = await must().rpc('create_order', {
        p_branch: o.branch, p_payment: o.payment, p_name: o.name, p_phone: o.phone, p_governorate: o.gov || null,
        p_address: o.address || null, p_notes: o.notes || null, p_coupon: o.coupon || null,
        p_items: o.items.map(i => ({ product_id: i.id, quantity: i.q, color: i.c || null, size: i.s || null }))
      });
      if (error) throw error; return data;
    },
    async myOrders() {
      const { data, error } = await must().from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      if (error) throw error; return data;
    },
    async cancelOrder(id) { const { error } = await must().rpc('cancel_my_order', { p_order: id }); if (error) throw error; },
    watchMyOrders(uid, cb) {
      if (!sb) return null;
      return sb.channel('my-orders-' + uid).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'user_id=eq.' + uid }, cb).subscribe();
    },
    async contact(row) { const { error } = await must().from('contact_messages').insert(row); if (error) throw error; }
  };
  window.DX = DX;
})();
