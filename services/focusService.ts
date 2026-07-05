import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export async function saveFocusSession(minutes: number) {
  const user = auth.currentUser;

  if (!user) return;

  await addDoc(collection(db, "focusSessions"), {
    userId: user.uid,
    duration: minutes,
    completedAt: serverTimestamp(),
  });
}

export async function getFocusSessions() {
  const user = auth.currentUser;

  if (!user) return [];

  const q = query(
    collection(db, "focusSessions"),
    where("userId", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data());
}