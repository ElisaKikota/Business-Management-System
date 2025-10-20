// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmweaSrha0Cldy8Ar1Sa98ulvJbXXJB-8",
  authDomain: "business-management-syst-d29bc.firebaseapp.com",
  projectId: "business-management-syst-d29bc",
  storageBucket: "business-management-syst-d29bc.firebasestorage.app",
  messagingSenderId: "1029415433799",
  appId: "1:1029415433799:web:7e8161378ca18ee7b9a362",
  measurementId: "G-PB5EYSNNYW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
