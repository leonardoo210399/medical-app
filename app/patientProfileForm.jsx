import React, { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../constants";
import FormField from "../components/FormField";
import CustomButton from "../components/CustomButton";
import { Link, router } from "expo-router";
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

    // Determine role and whether Confirmed Diagnosis is editable
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
            userId: user.$id,
        };

        await patientProfileForm(patientData);
        console.log("patientData",patientData)
        await logout();
        router.replace("/sign-in");
    };

    return (
        <SafeAreaView className="bg-primary h-full">
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
                        Sign up to Aora
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

                    {/* If "Others" is selected, show a text input for additional comorbidities */}
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

                     {/*Height (dropdown) */}
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

                    {/* Height (dropdown) */}
                    {/*<FormField*/}
                    {/*    title="Height"*/}
                    {/*    type="dropdown"*/}
                    {/*    value={height}*/}
                    {/*    handleChangeText={setHeight}*/}
                    {/*    options={[*/}
                    {/*        { label: "Select a height...", value: "" },*/}
                    {/*        { label: "150 cm", value: "150 cm" },*/}
                    {/*        { label: "160 cm", value: "160 cm" },*/}
                    {/*        { label: "170 cm", value: "170 cm" },*/}
                    {/*        { label: "180 cm", value: "180 cm" },*/}
                    {/*        { label: "190 cm", value: "190 cm" },*/}
                    {/*    ]}*/}
                    {/*    otherStyles="py-2"*/}
                    {/*/>*/}

                    {/*/!* Weight (dropdown) *!/*/}
                    {/*<FormField*/}
                    {/*    title="Weight"*/}
                    {/*    type="dropdown"*/}
                    {/*    value={weight}*/}
                    {/*    handleChangeText={setWeight}*/}
                    {/*    options={[*/}
                    {/*        { label: "Select a weight...", value: "" },*/}
                    {/*        { label: "50 kg", value: "50 kg" },*/}
                    {/*        { label: "60 kg", value: "60 kg" },*/}
                    {/*        { label: "70 kg", value: "70 kg" },*/}
                    {/*        { label: "80 kg", value: "80 kg" },*/}
                    {/*        { label: "90 kg", value: "90 kg" },*/}
                    {/*    ]}*/}
                    {/*    otherStyles="py-2"*/}
                    {/*/>*/}

                    {/* Allergies (Textarea) */}
                    <FormField
                        title="Allergies"
                        type="textarea"
                        value={allergies}
                        placeholder="Describe any known allergies"
                        handleChangeText={setAllergies}
                        otherStyles="py-2"
                    />

                    {/* Confirmed Diagnosis (Textarea, conditional) */}
                    {/*<FormField*/}
                    {/*    title="Confirmed Diagnosis"*/}
                    {/*    type="textarea"*/}
                    {/*    value={confirmedDiagnosis}*/}
                    {/*    placeholder="Enter confirmed diagnosis"*/}
                    {/*    handleChangeText={setConfirmedDiagnosis}*/}
                    {/*    role={role}*/}
                    {/*    confirmedDiagnosisEnabled={confirmedDiagnosisEnabled}*/}
                    {/*/>*/}

                    <CustomButton
                        title="Submit"
                        handlePress={submit}
                        containerStyles="mt-7"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default PatientProfileForm;
