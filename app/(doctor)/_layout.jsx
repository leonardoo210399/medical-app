// components/TabLayout.js
import React from "react";
import { StatusBar } from "expo-status-bar";
import { Redirect, Tabs } from "expo-router";
import { Image, Text, View } from "react-native";

// Import the colors palette
import colors from "../../constants/colors"; // Adjust the path as necessary
import { icons } from "../../constants";
// import { Loader } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";

// Define the TabIcon component
const TabIcon = ({ icon, color, name, focused }) => {
    return (
        <View className="flex items-center justify-center gap-1">
            <Image
                source={icon}
                resizeMode="contain"
                tintColor={color}
                className="w-6 h-6"
            />
            <Text
                className={`${focused ? "font-psemibold" : "font-pregular"} text-xs`}
                style={{ color: color }}
            >
                {name}
            </Text>
        </View>
    );
};

const TabLayout = () => {
    // const { loading, isLogged } = useGlobalContext();

    // Uncomment and use global context if needed
    // if (!loading && !isLogged) return <Redirect href="/sign-in" />;

    return (
        <>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: colors.picton_blue.DEFAULT, // Example: picton_blue-500
                    tabBarInactiveTintColor: colors.gray[100],
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        backgroundColor: colors.gray[500],
                        borderTopWidth: 1,
                        borderTopColor: colors.gray[400],
                        height: 84,
                    },
                }}
            >
                <Tabs.Screen
                    name="patientList"
                    options={{
                        title: "Patient List",
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.list}
                                color={color}
                                name="Patient List"
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="doctorHome"
                    options={{
                        title: "Home",
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.home}
                                color={color}
                                name="Home"
                                focused={focused}
                            />
                        ),
                    }}
                />
                {/* Add more Tabs.Screen components as needed */}
            </Tabs>

            {/* Uncomment if using a Loader component */}
            {/* <Loader isLoading={loading} /> */}

            <StatusBar backgroundColor={colors.gray[500]} style="light" />
        </>
    );
};

export default TabLayout;
