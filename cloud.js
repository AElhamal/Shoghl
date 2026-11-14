import {firebaseConfig as C} from './firebase-config.js';
const ui=s=>window.cloudUI&&window.cloudUI(s);
if(!C||!C.apiKey||C.apiKey.startsWith('PASTE')){
  ui({ok:false,msg:'السحابة لسه ما اتربطتش. حط بيانات فاير بيز في ملف firebase-config.js.'});
}else try{
  const B='https://www.gstatic.com/firebasejs/10.14.1/';
  const [{initializeApp},{getAuth,onAuthStateChanged,signInWithPopup,signInWithRedirect,GoogleAuthProvider,signOut},{getFirestore,doc,setDoc,onSnapshot}]=
    await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
  const app=initializeApp(C),auth=getAuth(app),fs=getFirestore(app);
  let ref=null,unsub=null,t=null,flow=false;
  const ok=(u,m)=>ui({ok:true,user:u,msg:m});
  const save1=d=>setDoc(ref,{json:JSON.stringify(d),t:d._t});
  const push=()=>{if(!ref)return;clearTimeout(t);t=setTimeout(async()=>{
    try{const d=window.getDb();d._t=d._t||Date.now();await save1(d);ok(auth.currentUser,'مسجل بـ '+auth.currentUser.email+'. بياناتك متزامنة ✓')}
    catch(e){ok(auth.currentUser,'مقدرش يحفظ على السحابة دلوقتي. هيحاول تاني لما النت يرجع.')}},1200)};
  window.cloudPush=push;
  const fin=()=>{if(!flow)return;flow=false;window.busy('تم تسجيل الدخول ✓',true);setTimeout(window.busyOff,1200)};
  const abort=()=>{if(!flow)return;flow=false;window.busyOff()};
  window.cloudSignIn=async()=>{
    const p=new GoogleAuthProvider();flow=true;window.busy('جاري تسجيل الدخول…');setTimeout(abort,20000);
    try{await signInWithPopup(auth,p)}
    catch(e){
      if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'){signInWithRedirect(auth,p);return}
      abort();if(e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request')ok(null,'تسجيل الدخول ما تمش، جرب تاني.')}};
  window.cloudSignOut=async()=>{
    const on=navigator.onLine;
    if(!on&&!confirm('مفيش نت دلوقتي! التعديلات اللي ما اتزامنتش هتضيع. بياناتك المتزامنة قبل كده محفوظة على السحابة. تسجل خروج وتصفّر التطبيق؟'))return;
    window.busy('جاري تسجيل الخروج…');clearTimeout(t);
    if(ref&&on)try{const d=window.getDb();d._t=d._t||Date.now();await Promise.race([save1(d),new Promise((_,j)=>setTimeout(j,4000))])}catch(e){}
    ref=null;window.resetDb&&window.resetDb();
    try{await signOut(auth)}catch(e){}
    window.busy('تم تسجيل الخروج ✓',true);setTimeout(()=>location.reload(),1300);
  };
  onAuthStateChanged(auth,u=>{
    unsub&&unsub();unsub=null;ref=null;
    if(!u){ok(null,'مش مسجل دخول. سجل بحساب جوجل عشان بياناتك تتحفظ على السحابة وتفتحها من أي موبايل.');return}
    ref=doc(fs,'users',u.uid);ok(u,'مسجل بـ '+u.email+'. بيتزامن…');
    unsub=onSnapshot(ref,s=>{
      if(s.metadata.hasPendingWrites)return;
      if(!s.exists()){push();fin();return}
      const d=JSON.parse(s.data().json),r=d._t||0,mine=window.getDb()._t||0;
      if(r>mine){window.setDb(d);ok(u,'مسجل بـ '+u.email+'. اتحدثت بيانات من السحابة ✓')}
      else if(r<mine)push();
      else ok(u,'مسجل بـ '+u.email+'. بياناتك متزامنة ✓');
      fin();
    },()=>{abort();ok(u,'مشكلة في الاتصال بالسحابة. اتأكد من قواعد Firestore ومن النطاق المسموح.')});
  });
}catch(e){ui({ok:false,msg:'السحابة مش متاحة دلوقتي (محتاج نت). التطبيق شغال عادي على الموبايل.'})}
