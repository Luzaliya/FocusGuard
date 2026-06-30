import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAGkLEegBcf7M1JJ3CwPaGYFXZA7gpURuA",
  authDomain: "focusguard-af44b.firebaseapp.com",
  projectId: "focusguard-af44b",
  storageBucket: "focusguard-af44b.firebasestorage.app",
  messagingSenderId: "575143734684",
  appId: "1:575143734684:web:a1703013a6eea4be212c59",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);