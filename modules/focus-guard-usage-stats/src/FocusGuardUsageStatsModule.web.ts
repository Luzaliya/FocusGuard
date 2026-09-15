import { registerWebModule, NativeModule } from 'expo';

class FocusGuardUsageStatsModule extends NativeModule<{}> {}

export default registerWebModule(FocusGuardUsageStatsModule, 'FocusGuardUsageStatsModule');
