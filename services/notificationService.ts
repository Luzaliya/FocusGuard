import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      "focusguard-reminders",
      {
        name: "FocusGuard Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      }
    );
  }

  return true;
}

export async function scheduleFocusReminder(
  hour: number,
  minute: number
) {
  const permissionGranted =
    await requestNotificationPermission();

  if (!permissionGranted) {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  await cancelFocusReminder();

  const notificationId =
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎯 Time to Focus",
        body: "Ready to focus? Start a FocusGuard session and make progress toward your goals.",
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: "focusguard-reminders",
      },
    });

  return notificationId;
}

export async function cancelFocusReminder() {
  const scheduled =
    await Notifications.getAllScheduledNotificationsAsync();

  const focusguardNotifications =
    scheduled.filter((notification) =>
      notification.content.title?.includes("Time to Focus")
    );

  for (const notification of focusguardNotifications) {
    await Notifications.cancelScheduledNotificationAsync(
      notification.identifier
    );
  }
}

export async function getScheduledFocusReminders() {
  const scheduled =
    await Notifications.getAllScheduledNotificationsAsync();

  return scheduled.filter((notification) =>
    notification.content.title?.includes("Time to Focus")
  );
}