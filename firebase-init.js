// firebase-init.js
const firebaseConfig = {
  apiKey: "AIzaSyCswU-LrTo6nOe_JkmepizOHwWyZxbteCc",
  authDomain: "famfresh-ea11f.firebaseapp.com",
  projectId: "famfresh-ea11f",
  storageBucket: "famfresh-ea11f.firebasestorage.app",
  messagingSenderId: "713550151605",
  appId: "1:713550151605:web:48641c0ed46771542223fc",
  measurementId: "G-TW5GD58FYC"
};

if(!firebase.apps.length){
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();