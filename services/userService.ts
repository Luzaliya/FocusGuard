import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function getCurrentUserProfile() {
  const user = auth.currentUser;

  if (!user) return null;

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  }

  return null;
}