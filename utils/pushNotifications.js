import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

// 알림이 도착했을 때 처리하는 핸들러 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true, // 상단에 알림 배너 표시 (iOS/Android)
        shouldShowList: true, // 알림 센터(목록)에 알림 추가 (iOS/Android)
        shouldPlaySound: true, // 소리 재생
        shouldSetBadge: false, // 앱 아이콘에 뱃지 숫자 설정 (iOS)
        priority: "max", // 알림 우선순위 설정 (Android only)
    }),
});

/**
 * FCM 토큰을 발급받고 Spring Boot 서버로 전송합니다.
 * @param {string} serverUrl - Spring Boot 서버의 기본 URL
 */
export async function registerForPushNotificationsAsync(serverUrl) {
    let token;

    // 안드로이드 8.0 (Oreo) 이상에서는 알림 채널 설정이 필수
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            sound: "sound.mp3",
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    // 실제 기기에서만 푸시 알림이 작동합니다. 시뮬레이터/에뮬레이터에서는 작동하지 않습니다.
    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== "granted") {
            Alert.alert("알림 권한 없음", "푸시 알림을 받으려면 알림 권한을 허용해야 합니다.");
            return;
        }

        token = (await Notifications.getDevicePushTokenAsync()).data;
        console.log("Device FCM Token:", token);

        // Spring Boot 서버로 토큰 전송
        try {
            const response = await fetch(`${serverUrl}/fcm/saveToken`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: token,
                    platform: Platform.OS,
                }),
            });

            if (response.ok) {
                console.log("FCM Token successfully sent to server!");
            } else {
                const errorData = await response.json();
                console.error("Failed to send FCM Token to server:", response.status, errorData);
                Alert.alert("전송 실패", `FCM 토큰 서버 전송에 실패했습니다: ${response.status}`);
            }
        } catch (error) {
            console.error("Error sending FCM Token to server:", error);
            Alert.alert("네트워크 오류", "FCM 토큰을 서버로 전송하는 중 네트워크 오류가 발생했습니다.");
        }
    } else {
        Alert.alert("실제 기기 필요", "푸시 알림은 실제 기기에서만 작동합니다.");
    }

    return token;
}

/**
 * 알림 수신 리스너를 설정하고 반환합니다.
 * @returns {import('react').MutableRefObject} - 알림 리스너 ref
 */
export function setupNotificationListeners() {
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received while app is foreground:", notification);
        // 여기에 알림 데이터 처리 로직을 추가할 수 있습니다.
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification tapped/opened by user:", response);
        // 알림 탭 시 특정 화면으로 이동하는 로직 등을 추가할 수 있습니다.
    });

    return { notificationListener, responseListener };
}

/**
 * 알림 리스너를 제거합니다.
 * @param {import('react').MutableRefObject} notificationListener - 알림 수신 리스너 ref
 * @param {import('react').MutableRefObject} responseListener - 알림 응답 리스너 ref
 */
export function removeNotificationListeners(notificationListener, responseListener) {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
}
