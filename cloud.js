import {firebaseConfig as C} from './firebase-config.js';
const ui=s=>window.cloudUI&&window.cloudUI(s);
if(!C||!C.apiKey||C.apiKey.startsWith('PASTE')){
  ui({ok:false,msg:'السحابة لسه ما اتربطتش. حط بيانات فاير بيز في ملف firebase-config.js.'});
}else try{
  const B='https://www.gstatic.com/firebasejs/10.14.1/';
  const [{initializeApp},{getAuth,onAuthStateChanged,signInWithPopup,signInWithRedirect,GoogleAuthProvider,signOut},{getFirestore,doc,setDoc,onSnapshot}]=
    await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
  const app=initializeApp(C),auth=getAuth(app),fs=getFirestore(app);
  let ref=null,unsub=null,t=null;
  const ok=(u,m)=>ui({ok:true,user:u,msg:m});
  const push=()=>{if(!ref)return;clearTimeout(t);t=setTimeout(async()=>{
    try{const d=window.getDb();d._t=d._t||Date.now();await setDoc(ref,{json:JSON.stringify(d),t:d._t});ok(auth.currentUser,'مسجل بـ '+auth.currentUser.email+'. بياناتك متزامنة ✓')}
    catch(e){ok(auth.currentUser,'مقدرش يحفظ على السحابة دلوقتي. هيحاول تاني لما النت يرجع.')}},1200)};
  window.cloudPush=push;
  window.cloudSignOut=async()=>{
    const off=!navigator.onLine;
    if(!confirm(off?'مفيش نت دلوقتي! التعديلات اللي ما اتزامنتش هتضيع. بياناتك المتزامنة قبل كده محفوظة على السحابة. تسجل خروج وتصفّر التطبيق؟':'هتسجل خروج وبيانات التطبيق على الموبايل هتتصفّر. بياناتك محفوظة على السحابة وترجع لما تسجل دخول تاني. تكمل؟'))return;
    clearTimeout(t);
    if(ref&&!off)try{const d=window.getDb();d._t=d._t||Date.now();await Promise.race([setDoc(ref,{json:JSON.stringify(d),t:d._t}),new Promise((_,j)=>setTimeout(j,4000))])}catch(e){}
    ref=null;await signOut(auth);window.resetDb&&window.resetDb();
  };
  window.cloudSignIn=async()=>{const p=new GoogleAuthProvider();
    try{await signInWithPopup(auth,p)}
    catch(e){if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment')signInWithRedirect(auth,p);else ok(null,'تسجيل الدخول ما تمش، جرب تاني.')}};
  onAuthStateChanged(auth,u=>{
    unsub&&unsub();unsub=null;ref=null;
    if(!u){ok(null,'مش مسجل دخول. سجل بحساب جوجل عشان بياناتك تتحفظ على السحابة وتفتحها من أي موبايل.');return}
    ref=doc(fs,'users',u.uid);ok(u,'مسجل بـ '+u.email+'. بيتزامن…');
    unsub=onSnapshot(ref,s=>{
      if(s.metadata.hasPendingWrites)return;
      if(!s.exists()){push();return}
      const d=JSON.parse(s.data().json),r=d._t||0,mine=window.getDb()._t||0;
      if(r>mine){window.setDb(d);ok(u,'مسجل بـ '+u.email+'. اتحدثت بيانات من السحابة ✓')}
      else if(r<mine)push();
      else ok(u,'مسجل بـ '+u.email+'. بياناتك متزامنة ✓');
    },()=>ok(u,'مشكلة في الاتصال بالسحابة. اتأكد من قواعد Firestore ومن النطاق المسموح.'));
  });
}catch(e){ui({ok:false,msg:'السحابة مش متاحة دلوقتي (محتاج نت). التطبيق شغال عادي على الموبايل.'})}
