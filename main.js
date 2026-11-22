
const DOCS=[
 {id:1,name:"د. أحمد سمير",spec:"تقويم الأسنان",days:[6,1,3],from:10,to:16},
 {id:2,name:"د. منى عادل",spec:"علاج الجذور وحشو العصب",days:[0,2,4],from:12,to:18},
 {id:3,name:"د. كريم فؤاد",spec:"زراعة وجراحة الفم",days:[6,2,4],from:11,to:17},
 {id:4,name:"د. سارة حسن",spec:"أسنان الأطفال",days:[0,1,3],from:10,to:15}
];
const DN=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ar2en=s=>s.replace(/[\u0660-\u0669]/g,c=>c.charCodeAt(0)-0x0660);

let st={doc:null,date:null,time:null},bookings=[];
try{bookings=JSON.parse(localStorage.getItem("bookings")||"[]")}catch(e){bookings=[]}
function save(){try{localStorage.setItem("bookings",JSON.stringify(bookings))}catch(e){}}

const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const fmt=s=>{const d=new Date(s+"T12:00");return DN[d.getDay()]+" "+d.toLocaleDateString("ar-EG-u-nu-latn",{day:"numeric",month:"long"})};
const hm=m=>{const h=Math.floor(m/60),mm=m%60,p=h>=12?"م":"ص",h12=h%12||12;return h12+":"+String(mm).padStart(2,"0")+" "+p};
const taken=(d,date,t)=>bookings.some(b=>b.doc===d&&b.date===date&&b.time===t);

function renderDocs(){
  $("docs").innerHTML=DOCS.map(d=>`<button class="doc" data-id="${d.id}" aria-pressed="${!!(st.doc&&st.doc.id===d.id)}">
    <b>${d.name}</b><small>${d.spec}</small>
    <div class="chips">${d.days.map(x=>`<span class="chip">${DN[x]}</span>`).join("")}<span class="chip">${hm(d.from*60)} – ${hm(d.to*60)}</span></div></button>`).join("");
}

function renderDates(){
  const out=[],now=new Date();
  for(let i=0;i<28&&out.length<8;i++){
    const d=new Date(now);d.setDate(now.getDate()+i);
    if(st.doc.days.includes(d.getDay()))out.push(iso(d));
  }
  $("dates").innerHTML=out.map(s=>{
    const d=new Date(s+"T12:00");
    return `<button class="pick" data-date="${s}" aria-pressed="${st.date===s}">${DN[d.getDay()]}<small>${d.toLocaleDateString("ar-EG-u-nu-latn",{day:"numeric",month:"short"})}</small></button>`;
  }).join("");
}

function renderTimes(){
  const out=[];
  for(let m=st.doc.from*60;m<st.doc.to*60;m+=30)out.push(m);
  $("times").innerHTML=out.map(m=>`<button class="pick" data-time="${m}" ${taken(st.doc.id,st.date,m)?"disabled":""} aria-pressed="${st.time===m}">${hm(m)}</button>`).join("");
}

function reset(from){
  if(from<=2){st.date=null;$("s2").hidden=true}
  if(from<=3){st.time=null;$("s3").hidden=true}
  $("s4").hidden=true;$("ok").hidden=true;$("err").textContent="";
}

$("docs").onclick=e=>{
  const b=e.target.closest(".doc");if(!b)return;
  st.doc=DOCS.find(d=>d.id==b.dataset.id);
  reset(2);renderDocs();renderDates();
  $("s2").hidden=false;
  $("s2").scrollIntoView({behavior:"smooth",block:"nearest"});
};

$("dates").onclick=e=>{
  const b=e.target.closest(".pick");if(!b)return;
  st.date=b.dataset.date;
  reset(3);renderDates();renderTimes();
  $("s3").hidden=false;
  $("s3").scrollIntoView({behavior:"smooth",block:"nearest"});
};

$("times").onclick=e=>{
  const b=e.target.closest(".pick");if(!b||b.disabled)return;
  st.time=+b.dataset.time;
  renderTimes();
  $("s4").hidden=false;$("ok").hidden=true;
  $("s4").scrollIntoView({behavior:"smooth",block:"nearest"});
};

$("go").onclick=()=>{
  const nm=$("nm").value.trim();
  const ph=ar2en($("ph").value).replace(/[\s-]/g,"");
  if(nm.length<3){$("err").textContent="اكتب اسمك بالكامل.";return}
  if(!/^(\+20|0020|0)?1[0125]\d{8}$/.test(ph)){$("err").textContent="اكتب رقم موبايل صحيح.";return}
  if(taken(st.doc.id,st.date,st.time)){$("err").textContent="الميعاد ده اتحجز، اختار ميعاد تاني.";renderTimes();return}
  bookings.push({id:Date.now(),doc:st.doc.id,date:st.date,time:st.time,name:nm,phone:ph});
  save();
  $("err").textContent="";
  $("ok").innerHTML=`<h2>تم الحجز ✓</h2><div>${esc(nm)}، موعدك مع <b>${st.doc.name}</b><br>${fmt(st.date)} الساعة ${hm(st.time)}</div>`;
  $("ok").hidden=false;$("s4").hidden=true;renderTimes();
  $("nm").value="";$("ph").value="";st.time=null;
  $("ok").scrollIntoView({behavior:"smooth",block:"nearest"});
};

function renderList(){
  const l=[...bookings].sort((a,b)=>(a.date+String(a.time).padStart(4,"0")).localeCompare(b.date+String(b.time).padStart(4,"0")));
  $("list").innerHTML=l.length
    ?"<h2>كل الحجوزات</h2>"+l.map(b=>{
        const d=DOCS.find(x=>x.id===b.doc);
        return `<div class="bk"><div><b>${esc(b.name)}</b> · <span dir="ltr">${esc(b.phone)}</span><br>${d?d.name:""} – ${fmt(b.date)} – ${hm(b.time)}</div><button data-id="${b.id}">إلغاء</button></div>`;
      }).join("")
    :'<h2>كل الحجوزات</h2><p class="empty">مفيش حجوزات لسه. اختار "احجز موعد" عشان تبدأ.</p>';
}

$("list").onclick=e=>{
  const b=e.target.closest("button");if(!b)return;
  bookings=bookings.filter(x=>x.id!=b.dataset.id);
  save();renderList();
};

function tab(n){
  $("t1").setAttribute("aria-selected",n==1);
  $("t2").setAttribute("aria-selected",n==2);
  $("book").hidden=n!=1;
  $("list").hidden=n!=2;
  if(n==2)renderList();
}
$("t1").onclick=()=>tab(1);
$("t2").onclick=()=>tab(2);

renderDocs();
