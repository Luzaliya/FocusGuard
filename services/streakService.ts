import { getFocusSessions } from "./focusService";

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export async function getStreakData() {
  // Do not force a FocusSession[] type here.
  // getFocusSessions() already returns the Firebase documents.
  const sessions = await getFocusSessions();

  // Store unique calendar days on which the user
  // completed at least one focus session.
  const focusedDays = new Set<string>();

  sessions.forEach((session: any) => {
    const date = session.completedAt?.toDate?.();

    if (!date) {
      return;
    }

    focusedDays.add(getDateKey(date));
  });

  const sortedDays = Array.from(focusedDays).sort();

  // No focus sessions yet.
  if (sortedDays.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      focusedDaysThisWeek: 0,
      totalFocusedDays: 0,
    };
  }

  // ---------------------------------------
  // Calculate BEST streak
  // ---------------------------------------

  let bestStreak = 1;
  let runningStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const previousDate = getDateFromKey(
      sortedDays[i - 1]
    );

    const currentDate = getDateFromKey(
      sortedDays[i]
    );

    const difference = Math.round(
      (currentDate.getTime() -
        previousDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (difference === 1) {
      runningStreak += 1;

      bestStreak = Math.max(
        bestStreak,
        runningStreak
      );
    } else {
      runningStreak = 1;
    }
  }

  // ---------------------------------------
  // Calculate CURRENT streak
  // ---------------------------------------

  const today = new Date();

  const todayKey = getDateKey(today);

  const yesterday = new Date(today);

  yesterday.setDate(
    today.getDate() - 1
  );

  const yesterdayKey = getDateKey(yesterday);

  let currentStreak = 0;

  // User focused today.
  if (focusedDays.has(todayKey)) {
    currentStreak = 1;

    const checkDate = new Date(yesterday);

    while (
      focusedDays.has(
        getDateKey(checkDate)
      )
    ) {
      currentStreak += 1;

      checkDate.setDate(
        checkDate.getDate() - 1
      );
    }
  }

  // User hasn't focused today, but focused yesterday.
  else if (focusedDays.has(yesterdayKey)) {
    currentStreak = 1;

    const checkDate = new Date(yesterday);

    checkDate.setDate(
      checkDate.getDate() - 1
    );

    while (
      focusedDays.has(
        getDateKey(checkDate)
      )
    ) {
      currentStreak += 1;

      checkDate.setDate(
        checkDate.getDate() - 1
      );
    }
  }

  // ---------------------------------------
  // Calculate focused days THIS WEEK
  // ---------------------------------------

  const dayOfWeek =
    today.getDay() === 0
      ? 7
      : today.getDay();

  const monday = new Date(today);

  monday.setHours(0, 0, 0, 0);

  monday.setDate(
    today.getDate() - (dayOfWeek - 1)
  );

  let focusedDaysThisWeek = 0;

  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(monday);

    checkDate.setDate(
      monday.getDate() + i
    );

    if (
      focusedDays.has(
        getDateKey(checkDate)
      )
    ) {
      focusedDaysThisWeek += 1;
    }
  }

  // ---------------------------------------
  // Return streak information
  // ---------------------------------------

  return {
    currentStreak,
    bestStreak,
    focusedDaysThisWeek,
    totalFocusedDays: focusedDays.size,
  };
}