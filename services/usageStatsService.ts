import FocusGuardUsageStatsModule from "../modules/focus-guard-usage-stats/src/FocusGuardUsageStatsModule";

export interface AppUsage {
  packageName: string;
  totalTimeInForeground: number;
}

export const APP_PACKAGE_NAMES: Record<string, string> = {
  Instagram: "com.instagram.android",
  TikTok: "com.zhiliaoapp.musically",
  Facebook: "com.facebook.katana",
  YouTube: "com.google.android.youtube",
  X: "com.twitter.android",
  WhatsApp: "com.whatsapp",
};

export function hasUsageAccess(): boolean {
  return FocusGuardUsageStatsModule.hasUsageAccess();
}

export function openUsageAccessSettings(): void {
  FocusGuardUsageStatsModule.openUsageAccessSettings();
}

export function getPackageName(appName: string): string | null {
  return APP_PACKAGE_NAMES[appName] ?? null;
}

export function formatUsageTime(milliseconds: number): string {
  const totalMinutes = Math.floor(milliseconds / 60000);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function getTodayStart(): number {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  ).getTime();
}

export async function getTodayAppUsage(
  appName: string
): Promise<AppUsage | null> {
  const packageName = getPackageName(appName);

  if (!packageName) {
    return null;
  }

  if (!hasUsageAccess()) {
    throw new Error("Usage Access permission has not been granted.");
  }

  const startTime = getTodayStart();
  const endTime = Date.now();

  return FocusGuardUsageStatsModule.getAppUsage(
    packageName,
    startTime,
    endTime
  );
}