import React, { useEffect, useRef } from "react";
import { StyleSheet, View, StatusBar, Platform, BackHandler, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

import { registerForPushNotificationsAsync, setupNotificationListeners, removeNotificationListeners } from "./utils/pushNotifications";

// 📌 앱 실행 중 foreground 알림 핸들링 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

function WebviewWrapper() {
    const insets = useSafeAreaInsets();
    const webviewRef = useRef(null);
    const screenHeight = Dimensions.get("window").height;

    const containerStyle = {
        flex: 1,
        backgroundColor: "#ffffff",
        paddingTop: Platform.OS === "ios" ? screenHeight * 0.03 : screenHeight * 0.01,
        paddingBottom: Platform.OS === "ios" ? screenHeight * 0.001 : screenHeight * 0.05,
    };

    useEffect(() => {
        const backAction = () => {
            if (webviewRef.current) {
                webviewRef.current.goBack();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, []);

    return (
        <View style={containerStyle}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <WebView ref={webviewRef} source={{ uri: "https://doyouknowayu.netlify.app" }} style={StyleSheet.absoluteFill} allowsBackForwardNavigationGestures={true} />
        </View>
    );
}

export default function App() {
    const notificationListenerRef = useRef();
    const responseListenerRef = useRef();

    useEffect(() => {
        const initPush = async () => {
            await registerForPushNotificationsAsync();
            const { notificationListener, responseListener } = setupNotificationListeners();
            notificationListenerRef.current = notificationListener;
            responseListenerRef.current = responseListener;
        };

        initPush();

        return () => {
            removeNotificationListeners(notificationListenerRef.current, responseListenerRef.current);
        };
    }, []);

    return (
        <SafeAreaProvider>
            <WebviewWrapper />
        </SafeAreaProvider>
    );
}
