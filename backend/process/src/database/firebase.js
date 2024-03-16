import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "seng559.firebaseapp.com",
  projectId: "seng559",
  storageBucket: "seng559.appspot.com",
  messagingSenderId: "759168683172",
  appId: "1:759168683172:web:48adf8faf7553ba205ea31",
  measurementId: "G-EMJJ6XN0B5",
};

// Initialize Firebase, needed for firestore ref creation
const app = initializeApp(firebaseConfig);
// Initialize Firestore
const db = getFirestore(app);

export default db;
