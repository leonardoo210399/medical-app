import { Redirect, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View, Image, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../constants";
import CustomButton from "../components/CustomButton";
import { useGlobalContext } from "../context/GlobalProvider";
import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export default function App() {
    const { loading, isLogged, user } = useGlobalContext();

    const [expoPushToken, setExpoPushToken] = useState('');
    const [channels, setChannels] = useState([]);
    const [notification, setNotification] = useState(undefined);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => token && setExpoPushToken(token));

        if (Platform.OS === 'android') {
            Notifications.getNotificationChannelsAsync().then(value => setChannels(value ?? []));
        }
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response);
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    if (!loading && isLogged) {
        if (user && typeof user.doctor !== "undefined") {
            return user.doctor ? <Redirect href="/patientList" /> : <Redirect href="/patientHome" />;
        }
    }

    return (
        <SafeAreaView className="bg-ruddy_blue h-full">
            <ScrollView contentContainerStyle={{ height: "100%" }}>
                <View className="w-full flex justify-center items-center h-full px-4">
                    <Image
                        source={images.full_logo}
                        className="max-w-[380px] w-full h-[298px]"
                        resizeMode="contain"
                    />
                    <View className="relative mt-5">
                        <Text className="text-3xl font-bold text-center text-white">
                            Navigating CKD with Confidence{"\n"}
                            <Text className="text-picton_blue-200">Knowledge & Support</Text>
                        </Text>
                        <Image
                            source={images.path}
                            className="w-[136px] h-[15px] absolute -bottom-2 -right-8"
                            resizeMode="contain"
                        />
                    </View>
                    <CustomButton
                        title="Continue with Email"
                        handlePress={() => router.push("/sign-in")}
                        containerStyles="w-full mt-7 bg-midnight_green-600"
                    />
                </View>
            </ScrollView>
            <StatusBar backgroundColor="#161622" style="light" />
        </SafeAreaView>
    );
}

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        // Create or update the 'default' channel with the custom sound
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'mysoundfile.mp3',
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        try {
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            if (!projectId) {
                throw new Error('Project ID not found');
            }
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log(token);
        } catch (e) {
            token = `${e}`;
        }
    } else {
        alert('Must use physical device for Push Notifications');
    }

    return token;
}
