// app.js
const appAuth = {
  async register({ name, email, password, role }) {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      await db.collection('users').doc(user.uid).set({
        name,
        email,
        role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  async login(email, password) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const doc = await db.collection('users').doc(user.uid).get();
      const role = doc.exists ? doc.data().role : 'buyer';

      return { success: true, role };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  logout() {
    return auth.signOut();
  }
};

// Auth redirect
auth.onAuthStateChanged(async (user) => {
  const page = window.location.pathname.split("/").pop();

  if (page.includes('dashboard') && !user) {
    window.location.href = 'login.html';
  }

  if ((page === 'login.html' || page === 'register.html') && user) {
    const doc = await db.collection('users').doc(user.uid).get();
    const role = doc.exists ? doc.data().role : 'buyer';

    if (role === 'farmer') window.location.href = 'farmer-dashboard.html';
    else if (role === 'admin') window.location.href = 'admin-dashboard.html';
    else window.location.href = 'buyer-dashboard.html';
  }
});
