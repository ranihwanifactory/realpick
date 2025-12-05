import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from "firebase/firestore";

// Configuration provided by user
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
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

// Types needed for global usage if window needs them
declare global {
  interface Window {
    kakao: any;
  }
}