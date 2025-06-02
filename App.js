import React, { useEffect, useRef } from "react";
import { StyleSheet, View, StatusBar, Platform, BackHandler } from "react-native"; // BackHandler 임포트
import { WebView } from "react-native-webview";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

// 분리된 FCM 관련 함수들을 임포트
import { registerForPushNotificationsAsync, setupNotificationListeners, removeNotificationListeners } from "./utils/pushNotifications"; // 경로를 맞게 조정하세요!

function WebviewWrapper() {
    const insets = useSafeAreaInsets();
    const webviewRef = useRef(null); // WebView를 위한 ref 생성

    const containerStyle = {
        flex: 1,
        backgroundColor: "#ffffff",
    };

    if (Platform.OS === "ios") {
        containerStyle.paddingTop = Math.max(insets.top - 30, 0);
        containerStyle.paddingBottom = Math.max(insets.bottom - 20, 0);
    } else if (Platform.OS === "android") {
        containerStyle.paddingTop = 24;
        containerStyle.paddingBottom = 50;
    }

    // 안드로이드 뒤로가기 버튼 처리
    useEffect(() => {
        const backAction = () => {
            if (webviewRef.current) {
                // 웹뷰가 뒤로갈 수 있는지 확인하고, 가능하다면 뒤로가기 실행
                webviewRef.current.goBack();
                return true; // 뒤로가기 이벤트를 처리했음을 알림
            }
            return false; // 기본 뒤로가기 동작 (앱 종료) 허용
        };

        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

        return () => backHandler.remove(); // 이벤트 리스너 정리
    }, []); // 빈 배열은 컴포넌트 마운트 시 한 번만 실행됨을 의미

    return (
        <View style={containerStyle}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <WebView
                ref={webviewRef} // ref를 WebView에 할당
                source={{ uri: "https://doyouknowayu.netlify.app" }}
                style={StyleSheet.absoluteFill}
                allowsBackForwardNavigationGestures={true}
            />
        </View>
    );
}

export default function App() {
    // Spring Boot 서버의 URL을 여기에 정의합니다.
    const SPRING_BOOT_SERVER_URL = "http://192.168.219.102:8080"; // <<-- 이 부분을 실제 서버 URL로 변경하세요!

    // 알림 리스너를 위한 ref들
    const notificationListenerRef = useRef();
    const responseListenerRef = useRef();

    useEffect(() => {
        // 앱 시작 시 FCM 토큰 등록 및 서버 전송
        registerForPushNotificationsAsync(SPRING_BOOT_SERVER_URL);

        // 알림 리스너 설정
        const { notificationListener, responseListener } = setupNotificationListeners();
        notificationListenerRef.current = notificationListener;
        responseListenerRef.current = responseListener;

        // 컴포넌트 언마운트 시 리스너 정리
        return () => {
            removeNotificationListeners(notificationListenerRef.current, responseListenerRef.current);
        };
    }, []); // 빈 배열은 컴포넌트 마운트 시 한 번만 실행됨을 의미

    return (
        <SafeAreaProvider>
            <WebviewWrapper />
        </SafeAreaProvider>
    );
}