import { NativeModule, requireNativeModule } from "expo";

export type AppUsage = {
  packageName: string;
  totalTimeInForeground: number;
};

declare class FocusGuardUsageStatsModule extends NativeModule<{}> {
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  getAppUsage(
    packageName: string,
    startTime: number,
    endTime: number
  ): AppUsage;
}

export default requireNativeModule<FocusGuardUsageStatsModule>(
  "FocusGuardUsageStats"
);