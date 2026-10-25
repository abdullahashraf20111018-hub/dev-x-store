const $=(s,r=document)=>[...r.querySelectorAll(s)];
let BR=["The Best","The First","I Learn (حلوان)","I Learn (المعادي)","مصر ستارت","حورس","الأحمد","IQ (البراجيل)","سنتر أوسيم التعليمي","براج الدقي","فرع أكتوبر","فرع مايو","فرع راعي روض الفرج","فرع زهراء مصر القديمة"];
const ST=["تم استلام الطلب","جاري التجهيز","جاهز للاستلام","تم التسليم"];
const PT=[[170,360],[450,140],[780,360],[1080,140]];
const ic=n=>'<svg class="i"><use href="#'+n+'"/></svg>';
$('#prods')[0].innerHTML=Array(4).fill('<div class="ol pc"><div class="ph">'+ic('bk')+'</div><div><b>[اسم المنتج]</b><div class="d">[السعر]</div></div><button class="b" data-go="cart">أضف</button></div>').join('');
$('#items')[0].innerHTML=[1,2,3].map(i=>'<div class="ol ci"><span class="n">'+i+'</span><div class="ph">'+ic('bk')+'</div><div><b style="font-size:19px">[اسم المنتج]</b><div class="d">الكمية: [الكمية]</div></div><b>[السعر]</b></div>').join('');
$('#bg')[0].innerHTML=BR.map((x,i)=>'<div class="bc'+(i?'':' sel')+'">'+ic('pin')+x+'</div>').join('');
$('#bg')[0].onclick=e=>{const c=e.target.closest('.bc');if(c){$('.bc').forEach(x=>x.classList.remove('sel'));c.classList.add('sel')}};
$('#nodes')[0].innerHTML=PT.map((p,i)=>'<div class="nd'+(i<2?'':' f')+(i==1?' cur':'')+'" style="left:'+((1280-p[0])/12.8)+'%;top:'+(p[1]/4.4)+'%">'+(i+1)+'<b>'+ST[i]+'</b></div>').join('');
$('#vs2')[0].innerHTML=ST.map((s,i)=>'<div class="s'+(i<1?' dn':'')+(i==1?' dn cur':'')+'"><div class="c">'+(i+1)+'</div><b>'+s+'</b></div>').join('');
const PM=[
  {"name":"InstaPay","img":"assets/img/pay-instapay.jpg","sub":"تحويل فوري لحظي"},
  {"name":"فودافون كاش","img":"assets/img/pay-vodafone.jpg","sub":"محفظة إلكترونية"},
  {"name":"أورنج كاش","img":"assets/img/pay-orange.jpg","sub":"Orange Money"},
  {"name":"e& money","img":"assets/img/pay-eand.jpg","sub":"محفظة اتصالات مصر"},
  {"name":"فوري","img":"assets/img/pay-fawry.jpg","sub":"دفع بكود الخدمة"}
];
$('#pays')[0].innerHTML=PM.map((m,i)=>'<div class="pm'+(i?'':' sel')+'" data-n="'+m.name+'" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px"><div style="height:54px;display:flex;align-items:center;justify-content:center"><img src="'+m.img+'" alt="'+m.name+'" style="max-height:50px;max-width:110px;object-fit:contain"></div><b>'+m.name+'</b><small style="color:var(--text-muted)">'+m.sub+'</small></div>').join('');
$('#pays')[0].onclick=e=>{const c=e.target.closest('.pm');if(c){$('.pm').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');$('#pmn')[0].textContent=c.dataset.n}};
function orbit(){const r=$('#ring')[0],on=innerWidth>=1100;r.classList.toggle('orbit',on);const cs=$('.bc',r),l=$('#ln')[0];
 if(!on){cs.forEach(c=>{c.style.left=c.style.top=''});l.innerHTML='';return}
 if(r.clientWidth<=0){l.innerHTML='';return}
  const W=r.clientWidth,H=640,cx=W/2,cy=H/2,rx=W/2-100,ry=H/2-40;let s='';
 cs.forEach((c,i)=>{const a=-Math.PI/2+i*2*Math.PI/cs.length,x=cx+rx*Math.cos(a),y=cy+ry*Math.sin(a);c.style.left=x+'px';c.style.top=y+'px';s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="#145DA0" stroke-opacity=".35" stroke-width="2" stroke-dasharray="6 6"/>'});
 l.setAttribute('viewBox','0 0 '+W+' '+H);l.innerHTML='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="none" stroke="#145DA0" stroke-opacity=".25" stroke-width="2"/>'+s}
function go(id){$('.v').forEach(v=>v.classList.toggle('on',v.id===id));$('[data-go]').forEach(a=>a.classList.toggle('on',a.dataset.go===id&&!a.matches('.lg,.cb,button')));
 document.body.classList.toggle('nohdr',id==='login'||id==='admin'||id==='signup');if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);window.scrollTo({top:0,behavior:'instant'});orbit()}
document.addEventListener('click',e=>{const a=e.target.closest('[data-go]');if(a)go(a.dataset.go)});
addEventListener('resize',orbit);

function applyThemeBtn(){
  const d=document.documentElement.getAttribute('data-theme')==='dark';
  const b=document.getElementById('themeBtn');
  if(b)b.innerHTML='<svg class="i"><use href="#'+(d?'sn':'mn')+'"></use></svg><span class="tx">'+(d?'الوضع الفاتح':'الوضع الداكن')+'</span>';
}
function toggleTheme(){
  const d=document.documentElement.getAttribute('data-theme')==='dark';
  document.documentElement.setAttribute('data-theme',d?'light':'dark');
  try{localStorage.setItem('devx_theme',d?'light':'dark')}catch(e){}
  applyThemeBtn();
}
(function(){
  let t=null;try{t=localStorage.getItem('devx_theme')}catch(e){}
  if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);
  applyThemeBtn();
})();

document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#themeBtn'))toggleTheme()});
(function(){
const K='devx_v3';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nd=s=>String(s).trim().replace(/[٠-٩]/g,d=>d.charCodeAt(0)-1632).replace(/[۰-۹]/g,d=>d.charCodeAt(0)-1776);
const CATS=['الكل','كتب','تيشرتات','نوت بوك','منتجات متنوعة'];

let S={};try{S=JSON.parse(localStorage.getItem(K))||{}}catch(e){}
const PERSIST=['cart','br','pm','code','codePct','sel','cat','q','wish','at','trk'];
S=Object.assign({cart:[],br:'The Best',pm:'InstaPay',code:'',codePct:0,sel:1,trk:null,cat:'الكل',q:'',wish:[],at:'info'},S);
S.p=[];S.orders=[];   /* in memory only — loaded from Supabase */
let USER=null,PROFILE=null,ISADMIN=false,ordCh=null;
const me=()=>PROFILE;window.me=me;
window.getDevxState=()=>S;
const save=()=>{try{const o={};PERSIST.forEach(k=>o[k]=S[k]);localStorage.setItem(K,JSON.stringify(o));return true}catch(e){return false}};

const $1=s=>document.querySelector(s),$a=s=>[...document.querySelectorAll(s)];
const fm=n=>Number(n).toLocaleString('en-US')+' ج.م';
const prod=id=>S.p.find(p=>p.id==id);
let V={id:0,c:'',s:''};
const out=p=>typeof p.qty==='number'&&p.qty<=0;
const canAdd=(p,n)=>typeof p.qty!=='number'||S.cart.filter(x=>x.id==p.id).reduce((a,x)=>a+x.q,0)+n<=p.qty;
const vtx=c=>(c.c||c.s)?'<div class="d" style="font-size:13px">'+(c.c?'اللون: '+esc(c.c):'')+(c.c&&c.s?' · ':'')+(c.s?'المقاس: '+esc(c.s):'')+'</div>':'';
const vt=i=>(i.c||i.s)?' ('+[i.c,i.s].filter(Boolean).join(' / ')+')':'';
const pick=p=>{if(p.colors&&p.colors.length&&!V.c){toast('اختر اللون');return null}if(p.sizes&&p.sizes.length&&!V.s){toast('اختر المقاس');return null}return{c:V.c,s:V.s}};
const cnt=()=>S.cart.reduce((a,c)=>a+c.q,0);
const sub=()=>S.cart.reduce((a,c)=>{const p=prod(c.id);return a+(p?p.price*c.q:0)},0);
const disc=()=>S.codePct?Math.round(sub()*S.codePct)/100:0;
const tot=()=>sub()-disc();
const GR={'كتب':'','تيشرتات':'background:linear-gradient(140deg,#7500a9,#4a002c)','نوت بوك':'background:linear-gradient(140deg,#0a7a5a,#04362a)','منتجات متنوعة':'background:linear-gradient(140deg,#c85a0d,#6b2a00)'};
let tt;const toast=m=>{const t=$1('#toast');t.textContent=m;t.classList.add('s');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('s'),2200)};
function badge(){const n=cnt();['#dbg'].forEach(s=>{const b=$1(s);b.textContent=n;b.style.display=n?'flex':'none'});let h=$1('#hbg');if(!h){const c=$1('header .cb');if(c){c.insertAdjacentHTML('beforeend','<i class="bdg" id="hbg"></i>');h=$1('#hbg')}}if(h){h.textContent=n;h.style.display=n?'flex':'none'}}
const STP=[['cart','السلة'],['branches','الفرع'],['pay','الدفع'],['confirmation','التأكيد'],['track','التتبع']];
const flowH=cur=>{const k=STP.findIndex(s=>s[0]===cur);return '<div class="flow">'+STP.map((s,i)=>(i?'<s class="'+(i<=k?'dn':'')+'"></s>':'')+'<a data-go="'+s[0]+'" class="'+(i<k?'dn':i==k?'on':'')+'"><i>'+(i<k?'✓':i+1)+'</i><span>'+s[1]+'</span></a>').join('')+'</div>'};
['branches','pay','track'].forEach(id=>{const s=$1('#'+id);if(s&&!s.querySelector('.flow'))s.insertAdjacentHTML('afterbegin',flowH(id))});
const card=p=>'<div class="mu-card mu-product"><div class="mu-bookart" style="position:relative;overflow:hidden;'+(GR[p.cat]||'')+'" data-open="'+p.id+'">'+(p.img?'<img class="pimg" src="'+p.img+'" alt="'+esc(p.name)+'">':'<div class="mu-book"><small>DEV-X</small><b>'+esc(p.name.slice(0,16))+'</b><span>'+esc(p.cat)+'</span></div>')+(out(p)?'<span class="oos">نفد المخزون</span>':'')+heart(p.id)+'</div><div class="mu-product-body"><h3>'+esc(p.name)+'</h3><span class="mu-price">'+fm(p.price)+'</span>'+(p.old?'<span class="mu-old">'+fm(p.old)+'</span>':'')+((p.colors&&p.colors.length)?'<div class="swr">'+p.colors.slice(0,6).map(c=>'<i class="sw1" style="background:'+c.h+'" title="'+esc(c.n)+'"></i>').join('')+'</div>':'')+'<div class="mu-product-actions"><button class="mu-btn light" data-open="'+p.id+'">التفاصيل</button>'+(out(p)?'<button class="mu-btn" disabled style="opacity:.5;cursor:not-allowed">نفد</button>':'<button class="mu-btn" data-add="'+p.id+'">أضف للسلة</button>')+'</div></div></div>';
function add(id,q,o){if(!me()){toast('يجب تسجيل الدخول أو إنشاء حساب أولًا للوصول إلى المتجر');go('login');return false}o=o||{};const p=prod(id);if(!p)return false;q=q||1;if(out(p)){toast('المنتج نفد من المخزون');return false}if(!canAdd(p,q)){toast('الكمية المتاحة '+p.qty+' فقط');return false}const c=S.cart.find(x=>x.id==id&&(x.c||'')==(o.c||'')&&(x.s||'')==(o.s||''));c?c.q+=q:S.cart.push({id:+id,q:q,c:o.c||'',s:o.s||''});save();badge();toast('✓ تمت الإضافة للسلة');window.__addOk=true;try{fx(p)}catch(e){}return true}
const R={
home(){const ic=n=>'<svg class="i"><use href="#'+n+'"/></svg>';$1('#prods').innerHTML=S.p.slice(0,4).map(p=>'<div class="ol pc" data-open="'+p.id+'" style="cursor:pointer"><div class="ph" style="overflow:hidden">'+(p.img?'<img src="'+p.img+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">':ic('bk'))+'</div><div><b>'+esc(p.name)+'</b><div class="d">'+fm(p.price)+'</div></div><button class="b" data-add="'+p.id+'">أضف</button></div>').join('')},
catalog(){const L=()=>S.p.filter(p=>(S.cat==='الكل'||p.cat===S.cat)&&(!S.q||p.name.includes(S.q))).map(card).join('')||'<p class="d">لا توجد نتائج</p>';
 $1('#catalog').innerHTML='<div class="missing-ui"><div class="mu-head"><div><span class="mu-eyebrow">EXPLORE THE STORE</span><h1 class="mu-title">كل المنتجات</h1><p class="mu-sub">اكتشف الكتب والمنتجات التعليمية من DEV-X.</p></div><button class="mu-btn light" data-go="cart"><svg class="i"><use href="#ct"></use></svg> السلة ('+cnt()+')</button></div><div class="chips">'+CATS.map(c=>'<button class="chip'+(c===S.cat?' on':'')+'" data-act="cat" data-id="'+c+'">'+c+'</button>').join('')+'<input id="sq" class="sq" placeholder="ابحث عن منتج" value="'+esc(S.q)+'"></div><div class="mu-grid mu-grid-4" id="cg">'+L()+'</div></div>';
 $1('#sq').oninput=e=>{S.q=e.target.value;$1('#cg').innerHTML=L()}},
details(){const p=prod(S.sel)||S.p[0];if(!p){go('catalog');return}
 if(V.id!==p.id)V={id:p.id,c:(p.colors&&p.colors.length==1)?p.colors[0].n:'',s:(p.sizes&&p.sizes.length==1)?p.sizes[0]:''};
 const cs=p.colors||[],zs=p.sizes||[],o=out(p);
 const opts=(cs.length?'<div style="margin:0 0 18px"><div class="fl2">اللون: <b>'+esc(V.c||'اختر لونًا')+'</b></div><div class="opt">'+cs.map((c,i)=>'<button type="button" class="sw'+(V.c===c.n?' on':'')+'" style="background:'+c.h+'" title="'+esc(c.n)+'" data-act="pc" data-id="'+i+'"></button>').join('')+'</div></div>':'')+(zs.length?'<div style="margin:0 0 18px"><div class="fl2">المقاس: <b>'+esc(V.s||'اختر مقاسًا')+'</b></div><div class="opt">'+zs.map(z=>'<button type="button" class="szb'+(V.s===z?' on':'')+'" data-act="ps" data-id="'+z+'">'+z+'</button>').join('')+'</div></div>':'');
 $1('#details').innerHTML='<div class="missing-ui"><div class="mu-head"><div><span class="mu-eyebrow">DEV-X STORE / PRODUCT</span><h1 class="mu-title">تفاصيل المنتج</h1></div><button class="mu-btn light" data-go="catalog">← العودة للمنتجات</button></div><div class="mu-grid mu-grid-2"><div class="mu-bookart" style="min-height:420px;position:relative;overflow:hidden;'+(GR[p.cat]||'')+'">'+(p.img?'<img class="pimg" src="'+p.img+'" alt="'+esc(p.name)+'">':'<div class="mu-book" style="width:190px;height:270px;padding:24px"><small>DEV-X</small><b>'+esc(p.name)+'</b><span>'+esc(p.cat)+'</span></div>')+(o?'<span class="oos">نفد المخزون</span>':'')+'</div><div class="mu-card"><span class="mu-tag">'+esc(p.cat)+'</span><h2 style="font-size:28px;line-height:1.4;margin:15px 0 8px">'+esc(p.name)+'</h2><div class="mu-stars">★★★★★</div><div style="margin:20px 0"><span class="mu-price" style="font-size:30px">'+fm(p.price)+'</span>'+(p.old?'<span class="mu-old">'+fm(p.old)+'</span><span class="mu-tag orange">خصم '+Math.round((1-p.price/p.old)*100)+'%</span>':'')+'</div><div style="margin:0 0 20px">'+(o?'<span class="mu-tag orange">● نفد المخزون</span>':'<span class="mu-tag green">● متوفر'+(typeof p.qty==='number'?' ('+p.qty+' قطعة)':'')+'</span>')+'</div>'+opts+'<div class="mu-row" style="justify-content:flex-start">'+(o?'<button class="mu-btn" disabled style="opacity:.5;cursor:not-allowed">نفد المخزون</button>':'<button class="mu-btn" data-act="dadd" data-id="'+p.id+'"><svg class="i"><use href="#ct"></use></svg> أضف للسلة</button><button class="mu-btn orange" data-act="buy" data-id="'+p.id+'">اشترِ الآن</button>')+'<button type="button" class="mu-btn light" data-act="wish" data-id="'+p.id+'">'+(hasW(p.id)?'♥ في المفضلة':'♡ أضف للمفضلة')+'</button></div></div></div><h2 class="mu-section-title" style="margin-top:28px">قد يعجبك أيضًا</h2><div class="mu-grid mu-grid-4">'+S.p.filter(x=>x.id!=p.id).slice(0,4).map(card).join('')+'</div></div>'},
cart(){const el=$1('#cart');
 if(!S.cart.length){el.innerHTML=flowH('cart')+'<div class="wrap" style="text-align:center;padding:60px 20px"><div style="font-size:64px"><svg class="i"><use href="#ct"></use></svg></div><h2 class="t">السلة فاضية</h2><p class="d" style="margin-bottom:18px">ابدأ بإضافة كتب ومنتجات من المتجر</p><button class="b" data-go="catalog">تصفح المنتجات</button></div>';return}
 el.innerHTML=flowH('cart')+'<div class="cart"><div class="items"><h2 class="t">سلة المشتريات</h2>'+S.cart.map((c,i)=>{const p=prod(c.id);return p?'<div class="ol ci"><span class="n">'+(i+1)+'</span><div class="ph" data-open="'+p.id+'" style="cursor:pointer;overflow:hidden">'+(p.img?'<img src="'+p.img+'" alt="" style="width:100%;height:100%;object-fit:cover">':'<svg class="i"><use href="#bk"></use></svg>')+'</div><div><b style="font-size:18px">'+esc(p.name)+'</b>'+vtx(c)+'<div class="d">'+fm(p.price)+'</div></div><div class="qt"><button data-act="dec" data-id="'+i+'">−</button><b>'+c.q+'</b><button data-act="inc" data-id="'+i+'">+</button></div><b>'+fm(p.price*c.q)+'</b><button class="rmv" data-act="rm" data-id="'+i+'">✕</button></div>':''}).join('')+'</div><div class="nv sum"><h2 class="t" style="margin:0">ملخص الطلب</h2><div style="line-height:2;color:#C9DBFF">المنتجات: '+fm(sub())+(disc()?'<br>الخصم: − '+fm(disc()):'')+'</div><hr><div class="cd"><div style="font-size:13px;color:#C9DBFF">كود الخصم</div><div style="display:flex;gap:8px"><input class="u" id="cc" value="'+esc(S.code)+'"><button class="bw" style="padding:6px 16px" data-act="code">تطبيق</button></div></div><div class="tot"><b>الإجمالي</b><b>'+fm(tot())+'</b></div><button class="bw" data-go="branches">متابعة: اختيار الفرع ←</button></div></div>'},
branches(){$a('#bg .bc').forEach(c=>c.classList.toggle('sel',c.textContent.trim()===S.br))},
pay(){if(!S.cart.length){toast('السلة فاضية');go('cart');return}$1('.pbar .tt').textContent='الإجمالي '+fm(tot());const q=$1('#pmn');if(q)q.textContent=S.pm;$a('.pm').forEach(c=>c.classList.toggle('sel',c.dataset.n===S.pm));const b=$1('.pbar>div>div');if(b&&!$1('#pbr'))b.insertAdjacentHTML('afterend','<div id="pbr" style="color:#C9DBFF;font-size:13px"><svg class="i"><use href="#pin"></use></svg> فرع الاستلام: <b style="color:#fff">'+esc(S.br)+'</b></div>');else if($1('#pbr'))$1('#pbr').innerHTML='<svg class="i"><use href="#pin"></use></svg> فرع الاستلام: <b style="color:#fff">'+esc(S.br)+'</b>'},
confirmation(){const o=S.orders.find(x=>x.id===S.trk);const el=$1('#confirmation');
 if(!o){el.innerHTML=flowH('confirmation')+'<div class="missing-ui" style="max-width:700px;text-align:center"><div class="mu-card"><h2>لا يوجد طلب حالي</h2><br><button class="mu-btn" data-go="catalog">ابدأ التسوق</button></div></div>';return}
 el.innerHTML=flowH('confirmation')+'<div class="missing-ui" style="max-width:900px"><div class="mu-card" style="text-align:center;padding:clamp(24px,5vw,48px)"><div style="width:82px;height:82px;border-radius:50%;background:#e7f8ee;color:#16814b;font-size:44px;display:grid;place-items:center;margin:0 auto 18px">✓</div><span class="mu-eyebrow">ORDER RECEIVED</span><h1 class="mu-title">تم استلام طلبك بنجاح!</h1><p class="mu-sub" style="max-width:560px;margin:0 auto 6px">سيتواصل معك فريقنا قريبًا عبر واتساب أو البريد لتأكيد الطلب وإرسال تفاصيل الدفع.</p><div class="mu-banner" style="text-align:right;margin:24px 0;display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap"><div><small>رقم الطلب</small><h2>#'+o.id+'</h2></div><div><small>الفرع</small><h2>'+esc(o.br)+'</h2></div><div><small>الدفع</small><h2>'+esc(o.pm)+'</h2></div><div><small>الإجمالي</small><h2>'+fm(o.total)+'</h2></div></div><div class="mu-row" style="justify-content:center"><button class="mu-btn" data-act="trk" data-id="'+o.id+'"><svg class="i"><use href="#tk"></use></svg> تتبع الطلب</button><button class="mu-btn light" data-go="catalog">متابعة التسوق</button></div></div></div>'},
orders(){const el=$1('#orders');el.innerHTML='<div class="missing-ui"><div class="mu-head"><div><span class="mu-eyebrow">ORDER HISTORY</span><h1 class="mu-title">طلباتي</h1><p class="mu-sub">تابع حالة الطلبات وراجع تفاصيل كل عملية شراء.</p></div><button class="mu-btn light" data-go="catalog">تسوّق أكثر</button></div>'+(S.orders.length?'<div class="mu-card mu-table-wrap"><table class="mu-table"><thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>الإجمالي</th><th>الفرع</th><th>الحالة</th><th></th></tr></thead><tbody>'+S.orders.map(o=>'<tr><td>#'+o.id+'</td><td>'+esc(o.d)+'</td><td>'+fm(o.total)+'</td><td>'+esc(o.br)+'</td><td><span class="mu-tag '+(o.status==='cancelled'?'red':o.st==3?'green':'orange')+'">'+stLabel(o)+'</span></td><td><button class="mu-btn light" data-act="trk" data-id="'+o.id+'">تتبع</button>'+((o.status==='new'||o.status==='preparing')?' <button class="mu-btn light" data-act="cancelOrd" data-id="'+o.uuid+'">إلغاء</button>':'')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="mu-card" style="text-align:center;padding:50px"><div style="font-size:54px"><svg class="i"><use href="#bx"></use></svg></div><h3>لا توجد طلبات بعد</h3><br><button class="mu-btn" data-go="catalog">ابدأ التسوق</button></div>')+'</div>'},
track(){const o=S.orders.find(x=>x.id===S.trk)||S.orders[0];const s=o?o.st:0;
 $1('#track h2.t').textContent=o?'تتبع الطلب #'+o.id+(o.status==='cancelled'?' (ملغي)':''):'تتبع الطلب';
 $1('#nodes').innerHTML=PT.map((p,i)=>'<div class="nd'+(i<=s?'':' f')+(i==s?' cur':'')+'" style="left:'+((1280-p[0])/12.8)+'%;top:'+(p[1]/4.4)+'%">'+(i+1)+'<b>'+ST[i]+'</b></div>').join('');
 $1('#vs2').innerHTML=ST.map((x,i)=>'<div class="s'+(i<s?' dn':'')+(i==s?' dn cur':'')+'"><div class="c">'+(i+1)+'</div><b>'+x+'</b></div>').join('');
 const d=$a('#track .inf .d');if(d.length>2){d[0].textContent=o?o.br:'—';d[1].textContent=o?fm(o.total):'—';d[2].textContent=o?o.pm:'—'}},
wishlist(){$1('#wishlist').innerHTML='<div class="missing-ui"><div class="mu-head"><div><span class="mu-eyebrow">SAVED FOR LATER</span><h1 class="mu-title">قائمة المفضلة <svg class="i"><use href="#ht"></use></svg></h1><p class="mu-sub">احتفظ بالمنتجات التي تريد الرجوع إليها لاحقًا.</p></div><button class="mu-btn light" data-go="catalog">استكشف المنتجات</button></div><div class="mu-card" style="text-align:center;padding:50px"><div style="font-size:54px"><svg class="i"><use href="#ht"></use></svg></div><h3>لا توجد منتجات مفضلة بعد</h3></div></div>'},
offers(){const L=S.p.filter(p=>p.old>p.price);$1('#offers').innerHTML='<div class="missing-ui"><div class="mu-banner" style="margin-bottom:26px"><span class="mu-tag" style="background:#ffffff20;color:white">DEV-X SPECIALS</span><h1 class="mu-title" style="color:#fff;font-size:36px">عروض تستاهل تكتشفها</h1><p style="color:#d5e5ff">استخدم كود <b>DEVX10</b> في السلة لخصم 10%.</p><button class="mu-btn" style="background:#fff;color:#041f60" data-go="catalog">تسوق الآن</button></div>'+(L.length?'<div class="mu-grid mu-grid-3">'+L.map(card).join('')+'</div>':'<div class="mu-card" style="text-align:center;padding:40px">لا توجد عروض على منتجات حاليًا</div>')+'</div>'},
};

const _go=go;
go=function(id){
  const pub=['login','signup','policies'];
  if(!me()&&!pub.includes(id)){toast('يجب تسجيل الدخول أو إنشاء حساب أولًا للوصول إلى المتجر');_go('login');$1('#sheet').classList.remove('open');return}
  if(me()&&(id==='login'||id==='signup'))id='home';
  _go(id);$1('#sheet').classList.remove('open');badge();if(R[id])R[id]();
  if(me()&&['orders','track','account','confirmation'].includes(id))loadOrders().then(()=>{if($1('.v.on')&&$1('.v.on').id===id&&R[id])R[id]()}).catch(()=>{});
};

function act(a,id){
 if(a==='more')return $1('#sheet').classList.add('open');
 if(a==='cat'){S.cat=id;save();R.catalog()}
 if(a==='inc'||a==='dec'){const c=S.cart[+id];if(c){const p=prod(c.id);if(a==='inc'){if(p&&!canAdd(p,1)){toast('الكمية المتاحة '+p.qty+' فقط');return}c.q++}else{c.q--;if(c.q<1)S.cart.splice(+id,1)}}save();badge();R.cart()}
 if(a==='rm'){S.cart.splice(+id,1);save();badge();R.cart()}
 if(a==='code'){const v=$1('#cc').value.trim().toUpperCase();if(!v){S.code='';S.codePct=0;save();R.cart();return}
  DX.coupon(v).then(p=>{if(p){S.code=v;S.codePct=p;toast('✓ تم تطبيق الخصم '+p+'%')}else{S.code='';S.codePct=0;toast('الكود غير صحيح')}save();R.cart()}).catch(e=>toast(DX.err(e)))}
 if(a==='buy'){const p=prod(id);if(!p)return;const o=pick(p);if(!o)return;if(add(id,1,o))go('cart')}
  if(a==='dadd'){const p=prod(id);if(!p)return;const o=pick(p);if(!o)return;add(id,1,o)}
  if(a==='pc'){const p=prod(S.sel);if(p&&p.colors&&p.colors[+id]){V.c=p.colors[+id].n;R.details()}}
  if(a==='ps'){V.s=id;R.details()}
 if(a==='trk'){S.trk=id;save();go('track')}
}
document.addEventListener('click',e=>{const t=e.target;let a=t.closest('[data-add]');if(a){const pp=prod(a.dataset.add);if(pp&&((pp.colors&&pp.colors.length)||(pp.sizes&&pp.sizes.length))){S.sel=pp.id;V={id:0,c:'',s:''};save();go('details');toast('اختر اللون والمقاس أولًا');return}add(a.dataset.add);if($1('#catalog.on'))R.catalog();return}
 a=t.closest('[data-open]');if(a){S.sel=+a.dataset.open;save();go('details');return}
 a=t.closest('[data-act]');if(a){act(a.dataset.act,a.dataset.id);return}
 if(t.id==='sheet')t.classList.remove('open')});

$1('#payBtn').onclick=async()=>{
  if(!S.cart.length){toast('السلة فاضية');return go('cart')}
  const name=$1('#coName').value.trim(),phone=nph($1('#coPhone').value);
  if(name.length<3){toast('اكتب اسمك الكامل (3 أحرف على الأقل)');$1('#coName').focus();return}
  if(!okPh(phone)){toast('اكتب رقم موبايل مصري صحيح (01xxxxxxxxx)');$1('#coPhone').focus();return}
  const b=$1('#payBtn');if(b.disabled)return;b.disabled=true;const lbl=b.textContent;b.textContent='جاري إرسال الطلب…';
  try{
    const r=await DX.createOrder({branch:S.br,payment:S.pm,name:name,phone:phone,gov:$1('#coGov').value.trim(),address:$1('#coAddr').value.trim(),notes:$1('#coNotes').value.trim(),coupon:S.code,items:S.cart});
    S.trk=String(r.order_no);S.cart=[];S.code='';S.codePct=0;save();badge();
    $1('#coNotes').value='';
    try{if(PROFILE&&(!PROFILE.phone||!PROFILE.full_name)){PROFILE=await DX.saveProfile(USER.id,{full_name:PROFILE.full_name||name,phone:PROFILE.phone||phone})}}catch(e){}
    try{S.p=await DX.products()}catch(e){}
    try{await loadOrders()}catch(e){}
    go('confirmation');
  }catch(e){
    const m=String(e&&e.message||'');toast(DX.err(e));
    if(/invalid_coupon/.test(m)){S.code='';S.codePct=0;save()}
    if(/insufficient_stock|product_unavailable/.test(m)){try{S.p=await DX.products();cleanCart()}catch(_){}go('cart')}
  }finally{b.disabled=false;b.textContent=lbl}
};

$1('#bg').addEventListener('click',()=>{const c=$1('#bg .bc.sel');if(c){S.br=c.textContent.trim();save()}});
$1('#pays').addEventListener('click',e=>{const c=e.target.closest('.pm');if(c){S.pm=c.dataset.n;save()}});
$1('#branches .wrap').insertAdjacentHTML('beforeend','<div style="margin-top:22px"><button class="b" data-go="pay">متابعة للدفع ←</button></div>');
$a('.tile').forEach((t,i)=>t.onclick=()=>{S.cat=['كتب','تيشرتات','نوت بوك','منتجات متنوعة'][i];S.q='';save();go('catalog')});
const hs=$1('.hero .bw');if(hs)hs.onclick=()=>{S.q=$1('.hero .u').value.trim();S.cat='الكل';save();go('catalog')};
badge();
const hasW=id=>S.wish.includes(+id);
const heart=id=>'<button type="button" class="wbtn'+(hasW(id)?' on':'')+'" data-act="wish" data-id="'+id+'" aria-label="المفضلة">'+(hasW(id)?'♥':'♡')+'</button>';
function reView(){const on=$1('.v.on');if(on&&R[on.id])R[on.id]()}
/* wishlist toggle (capture so it never opens the product) */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act="wish"]');if(!b)return;e.stopPropagation();e.preventDefault();
 const id=+b.dataset.id,i=S.wish.indexOf(id);if(i>=0){S.wish.splice(i,1);toast('تمت الإزالة من المفضلة')}else{S.wish.push(id);toast('♥ أُضيف للمفضلة')}save();reView()},true);
R.wishlist=function(){const L=S.p.filter(p=>hasW(p.id));
 $1('#wishlist').innerHTML='<div class="missing-ui"><div class="mu-head"><div><span class="mu-eyebrow">SAVED FOR LATER</span><h1 class="mu-title">قائمة المفضلة '+ic('ht')+'</h1><p class="mu-sub">'+(L.length?L.length+' منتج محفوظ للرجوع إليه لاحقًا.':'احتفظ بالمنتجات التي تريد الرجوع إليها لاحقًا.')+'</p></div><button class="mu-btn light" data-go="catalog">استكشف المنتجات</button></div>'+(L.length?'<div class="mu-grid mu-grid-4">'+L.map(card).join('')+'</div>':'<div class="mu-card" style="text-align:center;padding:50px"><div style="font-size:54px">'+ic('ht')+'</div><h3>لا توجد منتجات مفضلة بعد</h3><p class="mu-muted">اضغط على ♡ في أي منتج لإضافته هنا.</p><br><button class="mu-btn" data-go="catalog">تصفّح المنتجات</button></div>')+'</div>'};

/* ===== helpers ===== */
S.wish=S.wish||[];S.at=S.at||'info';
const WAN=(window.DEVX_CONFIG&&window.DEVX_CONFIG.WHATSAPP)||'201507410800';
const nph=v=>nd(v).replace(/[\s\-+()]/g,'').replace(/^(00)?20/,'0');
const okPh=v=>/^01[0125]\d{8}$/.test(nph(v));
const okEm=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
const stLabel=o=>o.status==='cancelled'?'ملغي':ST[o.st];
const STI={new:0,preparing:1,contacted:1,confirmed:2,delivered:3,cancelled:0};
const mapOrder=o=>({id:String(o.order_no),uuid:o.id,st:STI[o.status],status:o.status,total:Number(o.total),br:o.branch,pm:o.payment_method,u:o.customer_phone,
  d:new Date(o.created_at).toLocaleDateString('ar-EG',{day:'numeric',month:'long',year:'numeric'}),
  items:(o.order_items||[]).map(i=>({name:i.product_name,q:i.quantity,c:i.color||'',s:i.size||'',price:Number(i.unit_price)}))});
async function loadOrders(){if(!USER)return;S.orders=(await DX.myOrders()).map(mapOrder)}
function cleanCart(){S.cart=S.cart.filter(c=>{const p=prod(c.id);if(!p||out(p))return false;if(typeof p.qty==='number'&&c.q>p.qty)c.q=p.qty;return true});save();badge()}
function renderBranches(){if(!BR.length)return;if(!BR.includes(S.br))S.br=BR[0];
  $('#bg')[0].innerHTML=BR.map(x=>'<div class="bc'+(x===S.br?' sel':'')+'">'+ic('pin')+esc(x)+'</div>').join('');if($1('#branches').classList.contains('on'))orbit()}

/* ===== Cloudflare Turnstile (optional: active only when TURNSTILE_SITE_KEY is set) ===== */
const TSK=(window.DEVX_CONFIG||{}).TURNSTILE_SITE_KEY;let tsP=null;const TS={};
const tsLoad=()=>tsP||(tsP=new Promise(r=>{const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;s.onload=()=>r(window.turnstile);s.onerror=()=>r(null);document.head.appendChild(s)}));
async function tsMount(sel){if(!TSK||TS[sel])return;const t=await tsLoad();if(!t)return;TS[sel]={tok:'',id:t.render(sel,{sitekey:TSK,theme:'auto',language:'ar',callback:v=>{TS[sel].tok=v},'expired-callback':()=>{TS[sel].tok=''}})}}
const tsTok=sel=>TSK?(TS[sel]?TS[sel].tok:''):undefined;
const tsReset=sel=>{if(TS[sel]&&window.turnstile){window.turnstile.reset(TS[sel].id);TS[sel].tok=''}};
const tsOk=sel=>{if(TSK&&!tsTok(sel)){toast('أكمل التحقق الأمني أولًا');return false}return true};

/* ===== session ===== */
async function onSession(sess){
  if(ordCh&&DX.sb){try{DX.sb.removeChannel(ordCh)}catch(e){}ordCh=null}
  if(!sess){USER=null;PROFILE=null;ISADMIN=false;S.orders=[];const a=$1('#admLink');if(a)a.style.display='none';return}
  USER=sess.user;let p=null;try{p=await DX.profile(USER.id)}catch(e){}
  const md=USER.user_metadata||{};
  PROFILE=p||{id:USER.id,full_name:md.full_name||md.name||'',email:USER.email,phone:null,addresses:[]};
  try{ISADMIN=await DX.isAdmin(USER.id)}catch(e){ISADMIN=false}
  const a=$1('#admLink');if(a)a.style.display=ISADMIN?'':'none';
  try{await loadOrders()}catch(e){}
  ordCh=DX.watchMyOrders(USER.id,async()=>{try{await loadOrders();toast('تم تحديث حالة طلباتك');const on=$1('.v.on');if(on&&['orders','track','confirmation','account'].includes(on.id))R[on.id]()}catch(e){}});
}
function afterLogin(){toast('✓ أهلًا '+((PROFILE&&PROFILE.full_name)||'بك').split(' ')[0]+' في متجر Dev-X');const h=(location.hash||'').slice(1);go(h&&!['login','signup'].includes(h)?h:'home')}

/* ===== login (Google + e-mail code) ===== */
const cfgW=$1('#cfgWarn');if(!DX.ready&&cfgW){cfgW.style.display='block';cfgW.textContent='خدمة الدخول غير مفعّلة بعد: أضف بيانات Supabase في assets/js/config.js'}
tsMount('#tsLogin');
const cool=(btn,sec)=>{btn.disabled=true;const t0=btn.textContent;let n=sec;const iv=setInterval(()=>{n--;btn.textContent=t0.replace(/ \(\d+\)$/,'')+' ('+n+')';if(n<=0){clearInterval(iv);btn.disabled=false;btn.textContent=t0.replace(/ \(\d+\)$/,'')}},1000)};
let loginEmail='';
async function googleGo(){try{await DX.google()}catch(e){toast(e&&e.message==='not_configured'?'الدخول غير مفعّل بعد':DX.err(e))}}
$1('#btnGoogle').onclick=googleGo;$1('#suGoogle').onclick=googleGo;
$1('#otpSend').onclick=async()=>{const em=$1('#lgEmail').value.trim().toLowerCase();
  if(!okEm(em)){toast('اكتب بريدًا إلكترونيًا صحيحًا');return}if(!tsOk('#tsLogin'))return;
  const b=$1('#otpSend');b.disabled=true;
  try{await DX.sendCode(em,null,tsTok('#tsLogin'));loginEmail=em;$1('#lgOtpBox').style.display='';$1('#lgGo').style.display='';
    const n=$1('#otpNote');n.style.display='block';n.textContent='أرسلنا رمز التحقق إلى '+em+' — تحقق من صندوق الوارد أو الرسائل غير المرغوبة.';
    toast('✓ تم إرسال الرمز إلى بريدك');$1('#lgOtp').focus();tsReset('#tsLogin');cool(b,30)}
  catch(e){toast(e&&e.message==='not_configured'?'الدخول غير مفعّل بعد':DX.err(e));tsReset('#tsLogin');b.disabled=false}};
async function doOtp(){const c=nd($1('#lgOtp').value).replace(/\s/g,'');
  if(!loginEmail){toast('اطلب رمز التحقق أولًا');return}if(!/^\d{6,8}$/.test(c)){toast('أدخل الرمز المكوّن من الأرقام الذي وصلك');return}
  const b=$1('#lgGo');b.disabled=true;try{await DX.verifyCode(loginEmail,c);$1('#lgOtp').value=''}catch(e){toast(DX.err(e))}finally{b.disabled=false}}
$1('#lgGo').onclick=doOtp;
$1('#lgOtp').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();doOtp()}};
$1('#lgEmail').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$1('#otpSend').click()}};

/* ===== signup (name + e-mail + phone → e-mail code; no passwords anywhere) ===== */
tsMount('#tsSignup');let suEmail='';
$1('#suSend').onclick=async()=>{
  const name=$1('#suName').value.trim(),mail=$1('#suEmail').value.trim().toLowerCase(),rawTel=$1('#suPhone').value.trim();
  if(name.length<3){toast('اكتب اسمك الكامل (3 أحرف على الأقل)');$1('#suName').focus();return}
  if(!okEm(mail)){toast('اكتب بريدًا إلكترونيًا صحيحًا (مثال: user@example.com)');$1('#suEmail').focus();return}
  if(!okPh(rawTel)){toast('اكتب رقم موبايل مصري صحيح (01xxxxxxxxx)');$1('#suPhone').focus();return}
  if(!$1('#suTerms').checked){toast('يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة');return}
  if(!tsOk('#tsSignup'))return;const b=$1('#suSend');b.disabled=true;
  try{await DX.sendCode(mail,{full_name:name,phone:nph(rawTel)},tsTok('#tsSignup'));suEmail=mail;
    $1('#suCodeBox').style.display='';$1('#suVerify').style.display='';b.style.display='none';toast('✓ أرسلنا رمز التحقق إلى بريدك');$1('#suCode').focus()}
  catch(e){toast(e&&e.message==='not_configured'?'التسجيل غير مفعّل بعد':DX.err(e));tsReset('#tsSignup')}finally{b.disabled=false}};
$1('#suVerify').onclick=async()=>{const c=nd($1('#suCode').value).replace(/\s/g,'');
  if(!/^\d{6,8}$/.test(c)){toast('أدخل رمز التحقق الذي وصلك على البريد');return}
  const b=$1('#suVerify');b.disabled=true;try{await DX.verifyCode(suEmail,c)}catch(e){toast(DX.err(e))}finally{b.disabled=false}};

/* ===== checkout prefill ===== */
const _payR=R.pay;R.pay=function(){_payR.apply(this,arguments);const p=me();if(!p)return;
  [['#coName',p.full_name],['#coPhone',p.phone],['#coGov',((p.addresses||[])[0]||{}).g],['#coAddr',((p.addresses||[])[0]||{}).a]].forEach(([s,v])=>{const el=$1(s);if(el&&!el.value&&v)el.value=v})};


/* ---- account ---- */
R.account=function(){const el=$1('#account'),u=me();
 if(!u){el.innerHTML='<div class="missing-ui" style="max-width:720px"><div class="mu-card" style="text-align:center;padding:50px"><div style="font-size:54px">'+ic('us')+'</div><h3>سجّل دخولك لعرض حسابك</h3><br><button class="mu-btn" data-go="login">تسجيل الدخول</button></div></div>';return}
 const t=S.at||'info',mo=S.orders,done=mo.filter(o=>o.st==3&&o.status!=='cancelled').length,addr=u.addresses||[];
 const tab=(k,l)=>'<a class="'+(t===k?'active':'')+'" data-act="acTab" data-id="'+k+'">'+l+'</a>';let p;
 if(t==='addr'){p='<h2 class="mu-section-title">عناويني</h2>'+(addr.length?addr.map((a,i)=>'<div class="mu-card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px"><div><b>'+esc(a.t)+'</b><div class="mu-muted">'+esc(a.a)+'</div></div><button class="mu-btn light" data-act="delAddr" data-id="'+i+'">حذف</button></div>').join(''):'<p class="mu-muted">لم تضف عناوين بعد.</p>')+'<div class="mu-field"><label>اسم العنوان</label><input id="adT" maxlength="40" placeholder="مثال: المنزل"></div><div class="mu-field"><label>العنوان بالتفصيل</label><input id="adA" maxlength="200" placeholder="المحافظة - المنطقة - الشارع"></div><button class="mu-btn" data-act="addAddr">إضافة العنوان</button>'}
 else if(t==='set'){p='<h2 class="mu-section-title">إعدادات الحساب</h2><p class="mu-muted">تسجّل دخولك برمز يصل لبريدك أو بحساب Google — لا توجد كلمة مرور لحفظها.</p><div class="mu-row" style="justify-content:flex-start;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="mu-btn light" data-act="theme">تبديل الوضع الفاتح/الداكن</button><button class="mu-btn light" data-act="clrMe">حذف الحساب</button></div>'}
 else{p='<h2 class="mu-section-title">البيانات الشخصية</h2><div class="mu-field"><label>الاسم الكامل</label><input id="acN" maxlength="80" value="'+esc(u.full_name||'')+'" placeholder="اكتب اسمك"></div><div class="mu-field"><label>البريد الإلكتروني</label><input id="acE" type="email" value="'+esc(u.email||'')+'" disabled></div><div class="mu-field"><label>رقم الهاتف</label><input id="acP" type="tel" value="'+esc(u.phone||'')+'" placeholder="01xxxxxxxxx"></div><button class="mu-btn" data-act="acSave">حفظ التغييرات</button>'}
 el.innerHTML='<div class="missing-ui"><div class="mu-head"><div><span class="mu-eyebrow">MY DEV-X</span><h1 class="mu-title">حسابي</h1><p class="mu-sub">إدارة بياناتك ومتابعة طلباتك من مكان واحد.</p></div><button class="mu-btn light" data-go="home">العودة للمتجر</button></div><div class="mu-grid mu-grid-2"><div class="mu-card"><div style="display:flex;align-items:center;gap:15px;margin-bottom:24px"><div style="width:68px;height:68px;border-radius:22px;background:#edf4ff;display:grid;place-items:center;font-size:30px;font-weight:900;color:var(--a)">'+esc((u.full_name||u.email||'؟')[0])+'</div><div><h2 style="margin:0 0 5px">مرحبًا '+esc((u.full_name||'بك').split(' ')[0])+'</h2><span class="mu-muted">'+esc(u.email||u.phone||'')+'</span></div></div><div class="mu-side">'+tab('info','◉ البيانات الشخصية')+tab('addr','▤ عناويني')+'<a data-go="orders">▣ طلباتي</a>'+tab('set',ic('st')+' إعدادات الحساب')+'<a data-act="logout">↪ تسجيل الخروج</a></div></div><div class="mu-card">'+p+'</div></div><div class="mu-grid mu-grid-3" style="margin-top:20px"><div class="mu-card mu-stat"><div class="mu-iconbox">▣</div><div><strong>'+mo.length+'</strong><small>إجمالي الطلبات</small></div></div><div class="mu-card mu-stat"><div class="mu-iconbox">'+ic('ht')+'</div><div><strong>'+S.wish.length+'</strong><small>المنتجات المفضلة</small></div></div><div class="mu-card mu-stat"><div class="mu-iconbox">✓</div><div><strong>'+done+'</strong><small>طلبات مكتملة</small></div></div></div></div>'};
document.addEventListener('click',async e=>{const a=e.target.closest&&e.target.closest('[data-act]');if(!a)return;const k=a.dataset.act,id=a.dataset.id,u=me();
  try{
  if(k==='theme'){toggleTheme()}
  else if(k==='acTab'){S.at=id;save();R.account()}
  else if(k==='logout'){await DX.signOut();await onSession(null);toast('تم تسجيل الخروج');go('login')}
  else if(k==='acSave'&&u){const n=$1('#acN').value.trim(),p=nph($1('#acP').value);
    if(n.length<3){toast('اكتب اسمك الكامل');return}if(p&&!okPh(p)){toast('رقم الهاتف غير صحيح');return}
    PROFILE=await DX.saveProfile(USER.id,{full_name:n,phone:p||null});toast('✓ تم حفظ البيانات');R.account()}
  else if(k==='addAddr'&&u){const t=$1('#adT').value.trim(),ad=$1('#adA').value.trim();if(!t||ad.length<5){toast('اكتب اسم العنوان وتفاصيله');return}
    PROFILE=await DX.saveProfile(USER.id,{addresses:(u.addresses||[]).concat({t:t,a:ad}).slice(0,10)});toast('✓ تمت إضافة العنوان');R.account()}
  else if(k==='delAddr'&&u){const l=(u.addresses||[]).slice();l.splice(+id,1);PROFILE=await DX.saveProfile(USER.id,{addresses:l});R.account()}
  else if(k==='clrMe'&&u){if(confirm('حذف حسابك نهائيًا؟ ستبقى سجلات الطلبات لدى المتجر دون ربطها بك.')){await DX.deleteAccount();await onSession(null);toast('تم حذف الحساب');go('login')}}
  else if(k==='cancelOrd'){if(confirm('إلغاء هذا الطلب؟')){await DX.cancelOrder(id);try{S.p=await DX.products()}catch(_){}await loadOrders();toast('تم إلغاء الطلب');reView()}}
  }catch(err){toast(DX.err(err))}});

/* ---- contact ---- */
R.contact=function(){const u=me();if(u){if(!$1('#ctN').value)$1('#ctN').value=u.full_name||'';if(!$1('#ctP').value)$1('#ctP').value=u.phone||'';if(!$1('#ctE').value)$1('#ctE').value=u.email||''}};
function ctRead(){const n=$1('#ctN').value.trim(),p=$1('#ctP').value,em=$1('#ctE').value.trim(),t=$1('#ctT').value,m=$1('#ctM').value.trim();
 if(n.length<2){toast('اكتب اسمك');return null}if(!okPh(p)){toast('اكتب رقم هاتف صحيح');return null}if(em&&!okEm(em)){toast('البريد غير صحيح');return null}if(!t){toast('اختر موضوع الرسالة');return null}if(m.length<5){toast('اكتب رسالتك');return null}return{n:n,p:nph(p),em:em,t:t,m:m}}
$1('#ctM').parentNode.insertAdjacentHTML('beforeend','<input id="ctHp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;width:0">');
$1('#ctSend').onclick=async()=>{const r=ctRead();if(!r)return;
  if($1('#ctHp').value){$1('#ctM').value='';toast('✓ وصلتنا رسالتك وسنتواصل معك');return}   /* honeypot: bots fill hidden fields */
  const b=$1('#ctSend');b.disabled=true;
  try{await DX.contact({user_id:USER.id,name:r.n,phone:r.p,email:r.em||null,topic:r.t,message:r.m});$1('#ctM').value='';$1('#ctT').value='';toast('✓ وصلتنا رسالتك وسنتواصل معك')}
  catch(e){toast(DX.err(e))}finally{b.disabled=false}};
$1('#ctWa').onclick=()=>{const r=ctRead();if(!r)return;open('https://wa.me/'+WAN+'?text='+encodeURIComponent('الاسم: '+r.n+'\nالهاتف: '+r.p+'\nالموضوع: '+r.t+'\n\n'+r.m),'_blank','noopener')};


/* ---- FAQ search ---- */
R.faq=function(){const f=$1('#faq');if(f.dataset.in)return;f.dataset.in=1;
 f.querySelector('.mu-head').insertAdjacentHTML('afterend','<div class="mu-field" style="margin:0 0 18px"><input id="fqS" placeholder="ابحث في الأسئلة..."><div id="fqE" class="d" style="display:none;margin-top:10px">لا توجد نتائج مطابقة. <b data-go="contact" style="color:var(--a);cursor:pointer">تواصل معنا</b></div></div>');
 $1('#fqS').oninput=e=>{const q=normS(e.target.value);let n=0;f.querySelectorAll('details').forEach(d=>{const m=!q||normS(d.textContent).includes(q);d.style.display=m?'':'none';if(q&&m){d.open=true;n++}});$1('#fqE').style.display=q&&!n?'block':'none'}};

/* ---- policies nav ---- */
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('#policies .mu-side a');if(!a)return;e.preventDefault();
 const t=$1('#policies '+a.getAttribute('href'));if(t){t.scrollIntoView({behavior:'smooth',block:'start'});$a('#policies .mu-side a').forEach(x=>x.classList.toggle('active',x===a))}});
/* ===== UX: search overlay + add-to-cart motion ===== */
document.addEventListener('click',e=>{window.__addOk=false;window.__src=e.target},true);
const normS=t=>nd(String(t||'')).toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
let sug=null,sFocus=null;
const sItem=p=>{const o=out(p);return '<div class="sr-item" data-open="'+p.id+'" role="button" tabindex="0"><div class="sr-th">'+(p.img?'<img src="'+p.img+'" alt="">':ic('bk'))+'</div><div class="sr-t"><b>'+esc(p.name)+'</b><span>'+esc(p.cat)+'</span></div><span class="sr-p">'+fm(p.price)+'</span><button type="button" class="sr-add" data-add="'+p.id+'"'+(o?' disabled':'')+'>'+(o?'نفد':'أضف')+'</button></div>'};
function renderS(){const q=$1('#sIn').value.trim();let h;
 if(!q){if(!sug)sug=shuf(S.p).slice(0,5);h='<div class="srch-h">اقتراحات لك</div>'+(sug.length?sug.map(sItem).join(''):'<div class="srch-e">لا توجد منتجات بعد</div>')}
 else{const n=normS(q),r=S.p.filter(p=>normS(p.name+' '+p.cat).includes(n));
  h='<div class="srch-h">النتائج ('+r.length+')</div>'+(r.length?r.slice(0,6).map(sItem).join('')+'<button type="button" class="srch-all" data-sall>عرض كل النتائج في المتجر</button>':'<div class="srch-e">مفيش نتائج لـ «'+esc(q)+'» — جرّب كلمة تانية</div>')}
 $1('#sRes').innerHTML=h}
function openS(){if(!me()){toast('يجب تسجيل الدخول أو إنشاء حساب أولًا للوصول إلى المتجر');go('login');return}const s=$1('#srch');if(!s||!s.hidden)return;sug=null;sFocus=document.activeElement;s.hidden=false;document.body.style.overflow='hidden';const i=$1('#sIn');i.value='';renderS();i.focus({preventScroll:true});requestAnimationFrame(()=>s.classList.add('open'))}
function closeS(back){const s=$1('#srch');if(!s||s.hidden)return;s.classList.remove('open');document.body.style.overflow='';setTimeout(()=>{if(!s.classList.contains('open'))s.hidden=true},230);if(back&&sFocus&&sFocus.focus)sFocus.focus()}
function showAll(){const q=$1('#sIn').value.trim();if(!q)return;S.q=q;S.cat='الكل';save();go('catalog')}
$1('#sBtn').onclick=openS;
$1('#sIn').addEventListener('input',renderS);
$1('#sIn').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();showAll()}else if(e.key==='ArrowDown'){const f=$1('.sr-item');if(f){e.preventDefault();f.focus()}}});
$1('#sRes').addEventListener('keydown',e=>{const it=e.target.closest&&e.target.closest('.sr-item');if(!it)return;
 if((e.key==='Enter'||e.key===' ')&&e.target===it){e.preventDefault();it.click()}
 else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const all=$a('.sr-item'),n=all[all.indexOf(it)+(e.key==='ArrowDown'?1:-1)];if(n)n.focus();else if(e.key==='ArrowUp')$1('#sIn').focus()}});
document.addEventListener('click',e=>{const t=e.target;if(!t.closest)return;
 if(t.closest('[data-sclose]'))closeS(true);
 else if(t.closest('[data-sall]'))showAll();
 const b=t.closest('.sr-add');if(b&&window.__addOk){b.classList.add('ok');b.textContent='✓ تمت';setTimeout(()=>{if(b.isConnected){b.classList.remove('ok');b.textContent='أضف'}},1400)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeS(true);else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!document.body.classList.contains('nohdr')){e.preventDefault();openS()}});
const _go2=go;go=function(id){closeS();return _go2.apply(this,arguments)};

function fx(p){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const seen=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight};
 const tgt=[$1('header .cb'),$1('#dock .fab')].find(seen);if(!tgt)return;
 const sr=window.__src&&window.__src.getBoundingClientRect?window.__src.getBoundingClientRect():null,has=sr&&sr.width>0;
 const sx=has?sr.left+sr.width/2:innerWidth/2,sy=has?sr.top+sr.height/2:innerHeight*.62;
 const t=tgt.getBoundingClientRect(),tx=t.left+t.width/2,ty=t.top+t.height/2,dx=tx-sx,dy=ty-sy;
 const ring=(x,y,from,to,ms)=>{const r=document.createElement('i');r.className='rip';r.style.left=(x-24)+'px';r.style.top=(y-24)+'px';document.body.appendChild(r);r.animate([{transform:'scale('+from+')',opacity:.85},{transform:'scale('+to+')',opacity:0}],{duration:ms,easing:'ease-out'}).onfinish=()=>r.remove()};
 ring(sx,sy,.5,1.7,420);
 const c=document.createElement('div');c.className='fly';
 if(p&&p.img)c.style.backgroundImage='url("'+p.img+'")';else c.innerHTML=ic('ct');
 c.style.left=(sx-28)+'px';c.style.top=(sy-28)+'px';document.body.appendChild(c);
 c.animate([
  {transform:'translate(0,0) scale(.5)',opacity:0},
  {transform:'translate(0,-30px) scale(1.18) rotate(-8deg)',opacity:1,offset:.2},
  {transform:'translate('+(dx*.55)+'px,'+(dy*.55-80)+'px) scale(.9) rotate(9deg)',opacity:1,offset:.62},
  {transform:'translate('+dx+'px,'+dy+'px) scale(.22) rotate(0deg)',opacity:.9}
 ],{duration:860,easing:'cubic-bezier(.45,.05,.3,1)'}).onfinish=()=>{
  c.remove();ring(tx,ty,.9,2.4,520);
  tgt.animate([{transform:'scale(1)'},{transform:'scale(1.3,.8)',offset:.25},{transform:'scale(.9,1.14)',offset:.55},{transform:'scale(1)'}],{duration:520,easing:'ease-out'});
  ['#hbg','#dbg'].forEach(q=>{const b=$1(q);if(b&&b.offsetParent!==null||b&&getComputedStyle(b).position==='absolute')b.animate([{transform:'scale(1)'},{transform:'scale(1.7)',offset:.4},{transform:'scale(1)'}],{duration:420,easing:'ease-out'})})};
}


/* ===== boot ===== */
(async function boot(){
  const done=()=>document.body.classList.remove('booting');setTimeout(done,6000);
  try{S.p=await DX.products()}catch(e){S.p=[];toast('تعذّر تحميل المنتجات، أعد تحميل الصفحة')}
  try{const b=await DX.branches();if(b&&b.length){BR=b}}catch(e){}
  renderBranches();cleanCart();
  let sess=null;try{sess=await DX.session()}catch(e){}
  if(sess)await onSession(sess);
  DX.onAuth(async(ev,s)=>{
    if(ev==='SIGNED_IN'&&s&&(!USER||USER.id!==s.user.id)){await onSession(s);afterLogin()}
    else if(ev==='SIGNED_OUT'&&USER){await onSession(null);go('login')}
  });
  const h=(location.hash||'').slice(1);
  if(me())go(h&&h!=='login'&&h!=='signup'?h:'home');else go('login');
  done();
})();
})();
