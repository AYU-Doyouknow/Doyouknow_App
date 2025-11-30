import { Alert, Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import axios from "axios";

const SPRING_BOOT_SERVER_URL = "https://doyouknow.shop/fcm/saveToken";

export async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
        Alert.alert("실제 디바이스에서만 푸시 알림을 사용할 수 있어요.");
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        handleRegistrationError("알림 권한이 거부되었습니다.");
        return null;
    }

    try {
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "기본 채널",
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#FF231F7C",
            });
        }

        const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;

        if (!projectId) {
            handleRegistrationError("projectId가 설정되지 않았습니다.");
            return null;
        }

        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("FCM 토큰:", token);
        //Alert.alert("푸시 토큰 발급 완료", token);
        await sendTokenToServer(token);
        return token;
    } catch (e) {
        handleRegistrationError("토큰 발급 중 오류: " + e);
        return null;
    }
}

function handleRegistrationError(message) {
    console.error(message);
    Alert.alert("푸시 알림 등록 오류", message);
}

async function sendTokenToServer(token) {
    try {
        await axios.post(SPRING_BOOT_SERVER_URL, {
            token: token,
            platform: Platform.OS,
        });
        console.log("서버에 토큰 전송 완료");
        //Alert.alert("서버에 토큰 전송 완료");
    } catch (error) {
        console.error("서버 전송 실패:", error);
    }
}

export function setupNotificationListeners(onResponse) {
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
        console.log("알림 수신됨:", notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("알림 반응:", response);
        if (onResponse) {
            onResponse(response);
        }
    });

    return { notificationListener, responseListener };
}

export function removeNotificationListeners(notificationListener, responseListener) {
    if (notificationListener) Notifications.removeNotificationSubscription(notificationListener);
    if (responseListener) Notifications.removeNotificationSubscription(responseListener);
}
