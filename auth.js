// Initialize Firebase (if not already)
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyCswU-LrTo6nOe_JkmepizOHwWyZxbteCc",
    authDomain: "famfresh-ea11f.firebaseapp.com",
    projectId: "famfresh-ea11f",
    storageBucket: "famfresh-ea11f.firebasestorage.app",
    messagingSenderId: "713550151605",
    appId: "1:713550151605:web:48641c0ed46771542223fc",
    measurementId: "G-TW5GD58FYC"
  });
}

const db = firebase.firestore();

const appAuth = {
  // Register new user
  async register({ name, email, password, role }) {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Save extra info to Firestore
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

  // Login existing user
  async login(email, password) {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Get user role from Firestore
      const doc = await db.collection('users').doc(user.uid).get();
      const role = doc.exists ? doc.data().role : 'buyer';

      return { success: true, role };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Logout
  logout() {
    return firebase.auth().signOut();
  }
};

// ---------------------------
// Dashboard auth guard
// ---------------------------
firebase.auth().onAuthStateChanged(async (user) => {
  const page = window.location.pathname.split("/").pop();

  // If user is on a dashboard page and not logged in → redirect to login
  if (page.includes('dashboard') && !user) {
    window.location.href = 'login.html';
  }

  // Optional: if user is logged in and visits login/register page → do not redirect
  // You can also redirect logged-in users visiting login/register page:
  if ((page === 'login.html' || page === 'register.html') && user) {
    const doc = await db.collection('users').doc(user.uid).get();
    const role = doc.exists ? doc.data().role : 'buyer';

    if (role === 'farmer') window.location.href = 'farmer-dashboard.html';
    else if (role === 'admin') window.location.href = 'admin-dashboard.html';
    else window.location.href = 'buyer-dashboard.html';
  }
});