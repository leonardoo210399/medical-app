import {View, Text, Image, TouchableOpacity} from 'react-native'
import React from 'react'
import {SafeAreaView} from "react-native-safe-area-context";
import {useGlobalContext} from "../../context/GlobalProvider";
import {signOut} from "../../lib/appwrite";
import {router} from "expo-router";
import {icons} from "../../constants";

const DoctorHome = () => {
    const { user, setUser, setIsLogged } = useGlobalContext();
    const logout = async () => {
        await signOut();
        setUser(null);
        setIsLogged(false);
        router.replace("/sign-in");
    };
    return (
        <SafeAreaView className="items-center flex-1 justify-center">
            <TouchableOpacity
                onPress={logout}
                className="flex w-full items-center mb-10"
            >
                <Image
                    source={icons.logout}
                    resizeMode="contain"
                    className="w-12 h-12"
                />
            </TouchableOpacity>
            <Text className="text-3xl">{user?.doctor.toString()}</Text>
        </SafeAreaView>
    )
}
export default DoctorHome
