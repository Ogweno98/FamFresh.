// app.js
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Auth helpers
window.appAuth = {
  async register({name,email,password,role='buyer'}){
    try{
      const cred = await auth.createUserWithEmailAndPassword(email,password);
      await db.collection('users').doc(cred.user.uid).set({name,email,role,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      return {success:true};
    }catch(err){ return {success:false,message:err.message}; }
  },
  async login(email,password){
    try{
      const cred = await auth.signInWithEmailAndPassword(email,password);
      const doc = await db.collection('users').doc(cred.user.uid).get();
      return {success:true,user:doc.exists?doc.data():{email}};
    }catch(err){ return {success:false,message:err.message}; }
  },
  logout(){ return auth.signOut(); },
  onAuthStateChanged(cb){ return auth.onAuthStateChanged(cb); }
};

// Data helpers
window.appData = {
  async seedIfEmpty(){
    const snap = await db.collection('products').limit(1).get();
    if(snap.empty){
      await db.collection('products').add({ name:'Fresh Tomatoes', price:120, unit:'kg', category:'Vegetables', description:'Juicy tomatoes', image:'https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=800&auto=format&fit=crop', owner:'demo@farmer', createdAt:firebase.firestore.FieldValue.serverTimestamp() });
      await db.collection('products').add({ name:'Bananas', price:80, unit:'bunch', category:'Fruits', description:'Sweet bananas', image:'https://images.unsplash.com/photo-1518976024611-1f2f2d7a34c5?q=80&w=800&auto=format&fit=crop', owner:'demo@farmer', createdAt:firebase.firestore.FieldValue.serverTimestamp() });
    }
  },
  async getProducts(){
    const snap = await db.collection('products').orderBy('createdAt','desc').get();
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  },
  async addProduct({name,price,unit='kg',category,description,imageDataUrl,ownerEmail}){
    let imageUrl='';
    if(imageDataUrl){
      const path=`products/${Date.now()}_${Math.random().toString(36).slice(2,9)}.png`;
      const ref = storage.ref().child(path);
      await ref.putString(imageDataUrl,'data_url');
      imageUrl = await ref.getDownloadURL();
    }
    const docRef = await db.collection('products').add({name,price:Number(price),unit,category,description,image:imageUrl,owner:ownerEmail,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    return docRef.id;
  },
  async removeProduct(id){ await db.collection('products').doc(id).delete(); },
  async updateProduct(id,patch){ await db.collection('products').doc(id).update(patch); },
  async saveBooking(bk){ await db.collection('bookings').add({...bk,createdAt:firebase.firestore.FieldValue.serverTimestamp()}); }
};

// UI helpers
window.ui = {
  async renderProductsGrid(containerId){
    const container = document.getElementById(containerId);
    if(!container) return;
    const prods = await appData.getProducts();
    container.innerHTML='';
    prods.forEach(p=>{
      const card = document.createElement('div');
      card.className='bg-white p-4 rounded shadow flex flex-col';
      card.innerHTML=`
        <img src="${p.image||''}" class="h-36 w-full object-cover rounded">
        <h4 class="mt-3 font-semibold">${p.name}</h4>
        <p class="text-sm text-gray-600">${p.description||''}</p>
        <div class="mt-auto flex items-center justify-between">
          <div><span class="font-bold">KES ${p.price}</span> <span class="text-xs text-gray-500">/ ${p.unit||'kg'}</span></div>
          <div class="flex items-center gap-2">
            <input type="number" min="1" value="1" class="w-16 border p-1 rounded qty">
            <button class="addBtn bg-green-700 text-white px-3 py-1 rounded">Add</button>
          </div>
        </div>`;
      container.appendChild(card);
      card.querySelector('.addBtn').addEventListener('click',()=>{
        const qty = parseInt(card.querySelector('.qty').value||1,10);
        const cart = JSON.parse(localStorage.getItem('cart')||'[]');
        cart.push({id:p.id,name:p.name,price:p.price,quantity:qty,image:p.image,owner:p.owner});
        localStorage.setItem('cart',JSON.stringify(cart));
        document.getElementById('cartCount')&&(document.getElementById('cartCount').textContent=cart.length);
        alert('Added to cart');
      });
    });
  },
  async updateCartCountUI(){
    const cart = JSON.parse(localStorage.getItem('cart')||'[]');
    const el=document.getElementById('cartCount'); if(el) el.textContent=cart.length;
  }
};

// Chatbot fallback
window.appChat = window.appChat||{
  addMessage(r,t){ const el=document.querySelector('#chatMessages'); if(!el) return; el.innerHTML+=`<div class="${r==='bot'?'text-sm text-gray-800':'text-sm text-green-700'}"><strong>${r==='bot'?'FamFresh':'You'}:</strong> ${t}</div>`; el.scrollTop=el.scrollHeight; },
  async getReply(q){ return 'Chatbot not configured.'; },
  async fetchLocalWeatherAndTips(){ return 'Weather not configured.'; }
};

// Initialization
(async()=>{
  try{ await appData.seedIfEmpty(); await ui.updateCartCountUI(); } catch(e){ console.warn('init error',e); }
})();

// Update buyer name if logged in
appAuth.onAuthStateChanged(async user=>{
  if(user){
    try{
      const doc = await db.collection('users').doc(user.uid).get();
      const data = doc.exists?doc.data():null;
      if(data && document.getElementById('buyerName')) document.getElementById('buyerName').textContent=data.name||data.email;
    }catch(e){}
  }else{
    if(document.getElementById('buyerName')) document.getElementById('buyerName').textContent='Guest';
  }
});