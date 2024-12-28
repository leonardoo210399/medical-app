import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { signOut } from "../lib/appwrite";
import { router } from "expo-router";
import { icons } from "../constants";
import { useGlobalContext } from "../context/GlobalProvider";
import FormField from "./FormField";

const PatientProfile = () => {
    const { user, setUser, setIsLogged } = useGlobalContext();
    console.log(user);
    const patient = user?.patients || {};

    // Local state for each field
    const [name, setName] = useState(patient.name || "");
    const [age, setAge] = useState(patient.age?.toString() || "");
    const [gender, setGender] = useState(patient.gender || "other");
    const [comorbidities, setComorbidities] = useState(patient.comorbidities || []);
    const [otherComorbidities, setOtherComorbidities] = useState(patient.otherComorbidities || "");
    const [dialysis, setDialysis] = useState(patient.dialysis || false);
    const [height, setHeight] = useState(patient.height?.toString() || "");
    const [weight, setWeight] = useState(patient.weight?.toString() || "");
    const [allergies, setAllergies] = useState(patient.allergies || "");
    const [confirmedDiagnosis, setConfirmedDiagnosis] = useState(patient.confirmedDiagnosis || "");

    // For demonstration, we assume role and enable Confirmed Diagnosis if role is "Doctor"
    const role = user?.role || "Patient";
    const confirmedDiagnosisEnabled = role === "Doctor";

    const logout = async () => {
        await signOut();
        setUser(null);
        setIsLogged(false);
        router.replace("/sign-in");
    };

    return (
        <SafeAreaView className="items-center flex-1 justify-center bg-gray-900">
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <TouchableOpacity onPress={logout} className="flex w-full items-center mb-10">
                    <Image
                        source={icons.logout}
                        resizeMode="contain"
                        className="w-12 h-12"
                    />
                </TouchableOpacity>


                {/* Displaying user details below for debugging/demo */}
                <View className="mt-10">
                    <Text className="text-xl text-white font-semibold mb-4">Profile</Text>
                    <View className="space-y-2">
                        <Text className="text-white text-base">
                            <Text className="font-semibold">Name:</Text> {name}
                        </Text>
                        <Text className="text-white text-base">
                            <Text className="font-semibold">Age:</Text> {age}
                        </Text>
                        <Text className="text-white text-base">
                            <Text className="font-semibold">Gender:</Text> {gender}
                        </Text>
                        <Text className="text-white text-base">
                            <Text className="font-semibold">Comorbidities:</Text> {comorbidities.join(", ")}
                        </Text>
                        {comorbidities.includes("Others") && (
                            <Text className="text-white text-base">
                                <Text className="font-semibold">Other Comorbidities:</Text> {otherComorbidities}
                            </Text>
                        )}
                        <Text className="text-white text-base">
                            <Text className="font-semibold">Dialysis:</Text> {dialysis ? "Yes" : "No"}
                        </Text>
                        <Text className="text-white text-base">
                            <Text className="font-semibold">Height:</Text> {height ? `${height}` : "N/A"}
                        </Text>
                        <Text className="text-white text-base">
                            <Text className="font-semibold">Weight:</Text> {weight ? `${weight}` : "N/A"}
                        </Text>
                        <Text className="text-white text-base">
                            <Text className="font-semibold">Allergies:</Text> {allergies || "None"}
                        </Text>

                        {/*{<Text className="text-white text-base">*/}
                        {/*    <Text className="font-semibold">Confirmed Diagnosis:</Text> {confirmedDiagnosis || "None"}*/}
                        {/*</Text>}*/}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default PatientProfile;
