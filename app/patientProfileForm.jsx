import React, { useState } from 'react';
import { ScrollView, Text, View, Dimensions, Image } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../constants";
import FormField from "../components/FormField";
import CustomButton from "../components/CustomButton";
import { router } from "expo-router";
import { patientProfileForm, signOut } from "../lib/appwrite";
import { useGlobalContext } from "../context/GlobalProvider";

const PatientProfileForm = () => {
    const { user, setUser, setIsLogged } = useGlobalContext();

    const logout = async () => {
        await signOut();
        setUser(null);
        setIsLogged(false);
        router.replace("/sign-in");
    };

    const patient = user?.patients || {};

    // Local state for each field
    const [name, setName] = useState(patient.name || "");
    const [age, setAge] = useState(patient.age?.toString() || "");
    const [gender, setGender] = useState(patient.gender || "");
    const [comorbidities, setComorbidities] = useState(patient.comorbidities || []);
    const [otherComorbidities, setOtherComorbidities] = useState(patient.otherComorbidities || "");
    const [dialysis, setDialysis] = useState(patient.dialysis || false);
    const [height, setHeight] = useState(patient.height?.toString() || "");
    const [weight, setWeight] = useState(patient.weight?.toString() || "");
    const [allergies, setAllergies] = useState(patient.allergies || "");
    const [confirmedDiagnosis, setConfirmedDiagnosis] = useState(patient.confirmedDiagnosis || "");

    // New state variables for Language and Diet
    const [language, setLanguage] = useState(patient.language || "english");
    const [diet, setDiet] = useState(patient.diet || "");

    const role = user?.role || "Patient";
    const confirmedDiagnosisEnabled = role === "Doctor";

    const genderOptions = [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
    ];

    const comorbidityOptions = [
        { label: "Hypertension (HTN)", value: "HTN" },
        { label: "Diabetes", value: "Diabetes" },
        { label: "Anemia", value: "Anemia" },
        { label: "None of the above", value: "None" },
        { label: "Others", value: "Others" },
    ];

    const languageOptions = [
        { label: "English", value: "english" },
        { label: "Hindi", value: "hindi" },
        { label: "Marathi", value: "marathi" }
    ];

    const submit = async () => {
        const patientData = {
            name,
            age,
            gender,
            comorbidities,
            otherComorbidities,
            dialysis,
            height,
            weight,
            allergies,
            confirmedDiagnosis,
            language,
            diet,
            userId: user.$id,
        };

        await patientProfileForm(patientData);
        await logout();
        router.replace("/sign-in");
    };

    return (
        <SafeAreaView className="bg-ruddy_blue-500 h-full">
            <ScrollView>
                <View
                    className="w-full flex justify-center min-h-[85vh] px-4 my-6"
                    style={{
                        minHeight: Dimensions.get("window").height - 100,
                    }}
                >
                    <Image
                        source={images.logo}
                        resizeMode="contain"
                        className="w-[115px] h-[34px]"
                    />

                    <Text className="text-2xl font-semibold text-white mt-10 font-psemibold">
                        Complete Your Profile
                    </Text>

                    {/* Name (String) */}
                    <FormField
                        title="Name"
                        type="string"
                        value={name}
                        placeholder="Enter patient's name"
                        handleChangeText={setName}
                        otherStyles="py-2"
                    />

                    {/* Age (Number) */}
                    <FormField
                        title="Age"
                        type="number"
                        value={age}
                        placeholder="Enter age"
                        handleChangeText={setAge}
                        otherStyles="py-2"
                    />

                    {/* Gender (Radio-Group) */}
                    <FormField
                        title="Gender"
                        type="radio-group"
                        value={gender}
                        options={genderOptions}
                        handleChangeText={setGender}
                        otherStyles="py-2"
                    />

                    {/* Comorbidities (Checkbox-Group) */}
                    <FormField
                        title="Comorbidities"
                        type="checkbox-group"
                        value={comorbidities}
                        options={comorbidityOptions}
                        handleChangeText={setComorbidities}
                        otherStyles="py-2"
                    />

                    {comorbidities.includes("Others") && (
                        <FormField
                            title="Other Comorbidities"
                            type="string"
                            value={otherComorbidities}
                            placeholder="Specify other comorbidities"
                            handleChangeText={setOtherComorbidities}
                            otherStyles="py-2"
                        />
                    )}

                    {/* Dialysis (Boolean) */}
                    <FormField
                        title="Dialysis"
                        type="boolean"
                        value={dialysis}
                        handleChangeText={setDialysis}
                        otherStyles="py-2"
                    />

                    {/* Height (Number) */}
                    <FormField
                        title="Height"
                        type="number"
                        value={height}
                        placeholder="Enter height (in cm)"
                        handleChangeText={setHeight}
                    />

                    {/* Weight (Number) */}
                    <FormField
                        title="Weight"
                        type="number"
                        value={weight}
                        placeholder="Enter weight (in kg)"
                        handleChangeText={setWeight}
                    />

                    {/* Allergies (Textarea) */}
                    <FormField
                        title="Allergies"
                        type="textarea"
                        value={allergies}
                        placeholder="Describe any known allergies"
                        handleChangeText={setAllergies}
                        otherStyles="py-2"
                    />

                    {/* Language (Dropdown) */}
                    <FormField
                        title="Language"
                        type="dropdown"
                        value={language}
                        handleChangeText={setLanguage}
                        options={languageOptions}
                        placeholder="Select your preferred language"
                        otherStyles="py-2"
                    />

                    {/* Diet (Textarea) */}
                    <FormField
                        title="Diet"
                        type="textarea"
                        value={diet}
                        placeholder="Describe your dietary preferences"
                        handleChangeText={setDiet}
                        otherStyles="py-2"
                    />

                    <CustomButton
                        title="Submit"
                        handlePress={submit}
                        containerStyles="mt-7 bg-midnight_green-600"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default PatientProfileForm;
