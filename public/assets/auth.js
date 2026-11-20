// Shared sign-in helpers for the job board and staff page.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, OWNER_EMAIL } from "./config.js";

export const configured = !String(firebaseConfig.apiKey).startsWith("PASTE");
export const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = configured ? getAuth(app) : null;
export const db = configured ? getFirestore(app) : null;
export { OWNER_EMAIL, onAuthStateChanged };

export async function googleSignIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}
export const logOut = () => signOut(auth);

export const isOwner = (user) => !!user?.email && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase();

export async function isStaff(user) {
  if (!user?.email) return false;
  if (isOwner(user)) return true;
  const snap = await getDoc(doc(db, "staff", user.email.toLowerCase()));
  return snap.exists();
}

// Make sure every student who signs in has a record, starting as "pending".
export async function ensureUserRecord(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  const data = {
    email: user.email,
    name: user.displayName || "",
    photo: user.photoURL || "",
    status: "pending",
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return data;
}

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
