

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