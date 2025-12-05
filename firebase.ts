import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBvTQOD-bDKTzG1dQenH311OBQ9pzYzsUY",
  authDomain: "sjnb-a6742.firebaseapp.com",
  projectId: "sjnb-a6742",
  storageBucket: "sjnb-a6742.firebasestorage.app",
  messagingSenderId: "665816979587",
  appId: "1:665816979587:web:d1a5264005ccd210a3a3b6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();