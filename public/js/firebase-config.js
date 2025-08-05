<<<<<<< Updated upstream
/* Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
=======
// Firebase configuration using compat library (works with CDN)
>>>>>>> Stashed changes
const firebaseConfig = {
    apiKey: "AIzaSyCPO1dHYC7vPKc3n0Es4dW96u-5v85Ijx8",
    authDomain: "name-it-2.firebaseapp.com",
    projectId: "name-it-2",
    storageBucket: "name-it-2.firebasestorage.app",
    messagingSenderId: "425940990123",
    appId: "1:425940990123:web:ea7f0b2c66c656e5375fee",
    measurementId: "G-LBJWRHQNKC"
};

<<<<<<< Updated upstream
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);*/

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAXKmiWFwRGHp2eW8i7vxo7i10ppw40JDI",
  authDomain: "name-it-a9e6a.firebaseapp.com",
  projectId: "name-it-a9e6a",
  storageBucket: "name-it-a9e6a.firebasestorage.app",
  messagingSenderId: "248820256978",
  appId: "1:248820256978:web:4be7fbddab7c6191975d0b",
  measurementId: "G-Z92YEHE4BW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
=======
// Initialize Firebase using compat library
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Make db available globally
window.db = db;

console.log('Firebase initialized successfully');
>>>>>>> Stashed changes
