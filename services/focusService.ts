import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "./firebase";

export interface FocusSession {
  id?: string;
  userId: string;
  duration: number;
  completedAt?: any;
}

export interface GoalProgress {
  id: string;
  title: string;
  targetMinutes: number;
  completedMinutes: number;
  completed: boolean;
  active?: boolean;
}

/**
 * Save a completed focus session.
 *
 * After saving the session, the duration is automatically
 * added to the user's active goal.
 */
export const saveFocusSession = async (minutes: number) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in to save a focus session.");
  }

  if (!minutes || minutes <= 0) {
    throw new Error("Focus session duration must be greater than 0.");
  }

  // 1. Save the focus session
  await addDoc(collection(db, "focusSessions"), {
    userId: user.uid,
    duration: minutes,
    completedAt: serverTimestamp(),
  });

  // 2. Automatically update the active goal
  await updateActiveGoalProgress(minutes);
};

/**
 * Get all focus sessions belonging to the current user.
 */
export const getFocusSessions = async (): Promise<FocusSession[]> => {
  const user = auth.currentUser;

  if (!user) {
    return [];
  }

  const q = query(
    collection(db, "focusSessions"),
    where("userId", "==", user.uid),
    orderBy("completedAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<FocusSession, "id">),
  }));
};

/**
 * Get today's total focus minutes.
 */
export const getTodayFocusMinutes = async (): Promise<number> => {
  const sessions = await getFocusSessions();

  const today = new Date();

  return sessions.reduce((total, session) => {
    if (!session.completedAt) {
      return total;
    }

    const completedDate =
      typeof session.completedAt.toDate === "function"
        ? session.completedAt.toDate()
        : new Date(session.completedAt);

    const isToday =
      completedDate.getFullYear() === today.getFullYear() &&
      completedDate.getMonth() === today.getMonth() &&
      completedDate.getDate() === today.getDate();

    return isToday ? total + Number(session.duration || 0) : total;
  }, 0);
};

/**
 * Get total focus minutes for the current week.
 */
export const getWeeklyFocusMinutes = async (): Promise<number> => {
  const sessions = await getFocusSessions();

  const today = new Date();

  const day = today.getDay();

  const difference = day === 0 ? 6 : day - 1;

  const startOfWeek = new Date(today);

  startOfWeek.setDate(today.getDate() - difference);
  startOfWeek.setHours(0, 0, 0, 0);

  return sessions.reduce((total, session) => {
    if (!session.completedAt) {
      return total;
    }

    const completedDate =
      typeof session.completedAt.toDate === "function"
        ? session.completedAt.toDate()
        : new Date(session.completedAt);

    return completedDate >= startOfWeek
      ? total + Number(session.duration || 0)
      : total;
  }, 0);
};

/**
 * Add completed focus minutes to the user's active goal.
 */
export const updateActiveGoalProgress = async (minutes: number) => {
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  const goalsQuery = query(
    collection(db, "goals"),
    where("userId", "==", user.uid),
    where("active", "==", true)
  );

  const snapshot = await getDocs(goalsQuery);

  if (snapshot.empty) {
    // No active goal. The focus session is still saved successfully.
    return;
  }

  // Use the first active goal.
  const goalDoc = snapshot.docs[0];

  const goal = goalDoc.data() as GoalProgress;

  const currentMinutes = Number(goal.completedMinutes || 0);
  const targetMinutes = Number(goal.targetMinutes || 0);

  const newCompletedMinutes = currentMinutes + minutes;

  const isCompleted =
    targetMinutes > 0 && newCompletedMinutes >= targetMinutes;

  await updateDoc(goalDoc.ref, {
    completedMinutes: newCompletedMinutes,
    completed: isCompleted,
    ...(isCompleted ? { active: false } : {}),
  });
};

/**
 * Get the user's active goal.
 */
export const getActiveGoal = async (): Promise<GoalProgress | null> => {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const q = query(
    collection(db, "goals"),
    where("userId", "==", user.uid),
    where("active", "==", true)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];

  return {
    id: doc.id,
    ...(doc.data() as Omit<GoalProgress, "id">),
  };
};