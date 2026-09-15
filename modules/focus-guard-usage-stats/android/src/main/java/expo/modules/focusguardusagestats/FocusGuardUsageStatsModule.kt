package expo.modules.focusguardusagestats

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FocusGuardUsageStatsModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("FocusGuardUsageStats")

    Function("hasUsageAccess") {
      hasUsageAccess()
    }

    Function("openUsageAccessSettings") {
      openUsageAccessSettings()
    }

    Function("getAppUsage") { packageName: String, startTime: Double, endTime: Double ->
      getAppUsage(packageName, startTime.toLong(), endTime.toLong())
    }
  }

  private fun hasUsageAccess(): Boolean {
    val context = appContext.reactContext ?: return false

    val appOpsManager =
      context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager

    val mode = appOpsManager.checkOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      android.os.Process.myUid(),
      context.packageName
    )

    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun openUsageAccessSettings() {
    val context = appContext.reactContext ?: return

    val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }

  private fun getAppUsage(
    packageName: String,
    startTime: Long,
    endTime: Long
  ): Map<String, Any> {

    val context = appContext.reactContext
      ?: throw IllegalStateException("React context is unavailable")

    if (!hasUsageAccess()) {
      throw IllegalStateException("Usage Access permission has not been granted")
    }

    val usageStatsManager =
      context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

    val stats = usageStatsManager.queryUsageStats(
      UsageStatsManager.INTERVAL_DAILY,
      startTime,
      endTime
    )

    val matchingStats = stats.firstOrNull {
      it.packageName == packageName
    }

    val totalTime = matchingStats?.totalTimeInForeground ?: 0L

    return mapOf(
      "packageName" to packageName,
      "totalTimeInForeground" to totalTime
    )
  }
}