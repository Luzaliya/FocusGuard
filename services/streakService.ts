import { getFocusSessions } from "./focusService";

export async function calculateStreak() {
  const sessions = await getFocusSessions();

  console.log("Sessions:", sessions);

  if (sessions.length === 0) {
    return 0;
  }

  // Get unique dates (YYYY-MM-DD)
  const dates = [
    ...new Set(
      sessions.map((session: any) => {
        const date = session.completedAt?.toDate
          ? session.completedAt.toDate()
          : new Date();

        return date.toISOString().split("T")[0];

        console.log("Sessions:", sessions);
      })
    ),
  ];

  // Sort from newest to oldest
  dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < dates.length; i++) {
    const currentDate = new Date(dates[i]);
    currentDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (currentDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}