// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDQXdMGS7wiBcpbcrH9_yGNdakRCOTwA70",
  authDomain: "test-e6569.firebaseapp.com",
  projectId: "test-e6569",
  storageBucket: "test-e6569.appspot.com",
  messagingSenderId: "682695166796",
  appId: "1:682695166796:android:0b707e91e3286335ff9de9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app); // Initialize Firestore

export { firestore };