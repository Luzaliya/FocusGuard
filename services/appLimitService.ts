import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "./firebase";

export type AppLimit = {
  id: string;
  userId: string;
  appName: string;
  limitMinutes: number;
  enabled: boolean;
};

const appLimitsCollection = collection(db, "appLimits");

// Save or update an app limit
export const saveAppLimit = async (
  appId: string,
  appName: string,
  limitMinutes: number,
  enabled: boolean
) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not logged in.");
  }

  const documentId = `${user.uid}_${appId}`;

  await setDoc(
    doc(db, "appLimits", documentId),
    {
      id: appId,
      userId: user.uid,
      appName,
      limitMinutes,
      enabled,
    },
    { merge: true }
  );
};

// Get all app limits for the logged-in user
export const getAppLimits = async (): Promise<AppLimit[]> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not logged in.");
  }

  const q = query(
    appLimitsCollection,
    where("userId", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => ({
    ...(document.data() as AppLimit),
  }));
};