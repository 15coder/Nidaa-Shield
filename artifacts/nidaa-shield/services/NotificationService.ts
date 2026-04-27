import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NOTIF_SCHEDULED_KEY = "@nidaa-shield/notif-scheduled-v1";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleDailyProtectionReminder(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const granted = await requestPermission();
    if (!granted) return;

    const alreadyScheduled = await AsyncStorage.getItem(NOTIF_SCHEDULED_KEY);
    if (alreadyScheduled === "1") return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "نداء شايلد 🛡️",
        body: "لا تنسَ تفعيل حماية نداء شايلد اليوم — ابقَ آمناً على الإنترنت!",
        sound: false,
        data: { type: "daily_reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });

    await AsyncStorage.setItem(NOTIF_SCHEDULED_KEY, "1");
  } catch {}
}
