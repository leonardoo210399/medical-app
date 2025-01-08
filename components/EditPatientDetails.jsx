// components/EditPatientDetails.js
import React from "react";
import {
    View,
    Text,
    Modal,
    Button,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
} from "react-native";
import FormField from "./FormField";
import { genderOptions, comorbidityOptions, languageOptions } from "../constants/options"; // Ensure languageOptions are defined
import { icons } from "../constants";

const EditPatientDetails = ({
                                visible,
                                patient,
                                setPatient,
                                onClose,
                                onUpdate,
                            }) => {
    if (!patient) return null;

    /**
     * Handle form submission with validation
     */
    const handleUpdate = () => {
        // Basic validation: Ensure name is not empty
        if (!patient.name.trim()) {
            Alert.alert("Validation Error", "Name is required.");
            return;
        }

        // Add more validations as needed

        // Call the onUpdate function passed as a prop
        onUpdate();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <ScrollView className="bg-ruddy_blue-500 rounded-lg p-5 h-full shadow-lg">
                <View className="w-full flex-row justify-between items-center mb-4">
                    <Text className="text-3xl text-white font-bold">
                        Edit Patient Details
                    </Text>
                    <TouchableOpacity onPress={onClose} className="flex items-end">
                        <Image
                            source={icons.close}
                            resizeMode="contain"
                            className="w-6 h-6"
                        />
                    </TouchableOpacity>
                </View>

                {/* Name (String) */}
                <FormField
                    title="Name"
                    type="string"
                    value={patient.name}
                    placeholder="Enter patient's name"
                    handleChangeText={(text) => setPatient({ ...patient, name: text })}
                    otherStyles="py-2"
                />

                {/* Age (Number) */}
                <FormField
                    title="Age"
                    type="number"
                    value={patient.age}
                    placeholder="Enter age"
                    handleChangeText={(text) => setPatient({ ...patient, age: text })}
                    otherStyles="py-2"
                />

                {/* Gender (Radio-Group) */}
                <FormField
                    title="Gender"
                    type="radio-group"
                    value={patient.gender}
                    options={genderOptions}
                    handleChangeText={(text) =>
                        setPatient({ ...patient, gender: text })
                    }
                    otherStyles="py-2"
                />

                {/* Comorbidities (Checkbox-Group) */}
                <FormField
                    title="Comorbidities"
                    type="checkbox-group"
                    value={patient.comorbidities}
                    options={comorbidityOptions}
                    handleChangeText={(text) =>
                        setPatient({ ...patient, comorbidities: text })
                    }
                    otherStyles="py-2"
                />

                {/* If "Others" is selected, show a text input for additional comorbidities */}
                {patient.comorbidities.includes("Others") && (
                    <FormField
                        title="Other Comorbidities"
                        type="string"
                        value={patient.otherComorbidities}
                        placeholder="Specify other comorbidities"
                        handleChangeText={(text) =>
                            setPatient({ ...patient, otherComorbidities: text })
                        }
                        otherStyles="py-2"
                    />
                )}

                {/* Dialysis (Boolean) */}
                <FormField
                    title="Dialysis"
                    type="boolean"
                    value={patient.dialysis}
                    handleChangeText={(text) =>
                        setPatient({ ...patient, dialysis: text })
                    }
                    otherStyles="py-2"
                />

                {/* Height (Number) */}
                <FormField
                    title="Height"
                    type="number"
                    value={patient.height}
                    placeholder="Enter height (in cm)"
                    handleChangeText={(text) =>
                        setPatient({ ...patient, height: text })
                    }
                    otherStyles="py-2"
                />

                {/* Weight (Number) */}
                <FormField
                    title="Weight"
                    type="number"
                    value={patient.weight}
                    placeholder="Enter weight (in kg)"
                    handleChangeText={(text) =>
                        setPatient({ ...patient, weight: text })
                    }
                    otherStyles="py-2"
                />

                {/* Allergies (Textarea) */}
                <FormField
                    title="Allergies"
                    type="textarea"
                    value={patient.allergies}
                    placeholder="Describe any known allergies"
                    handleChangeText={(text) =>
                        setPatient({ ...patient, allergies: text })
                    }
                    otherStyles="py-2"
                />

                {/* Language (Dropdown) */}
                <FormField
                    title="Language"
                    type="dropdown"
                    value={patient.language}
                    handleChangeText={(text) =>
                        setPatient({ ...patient, language: text })
                    }
                    options={languageOptions}
                    placeholder="Select your preferred language"
                    otherStyles="py-2"
                />

                {/* Diet (Textarea) */}
                <FormField
                    title="Diet"
                    type="textarea"
                    value={patient.diet}
                    placeholder="Describe your dietary preferences"
                    handleChangeText={(text) =>
                        setPatient({ ...patient, diet: text })
                    }
                    otherStyles="py-2"
                />

                {/* Diagnosis (Textarea, conditional) */}
                {patient.role === "Doctor" && (
                    <FormField
                        title="Confirmed Diagnosis"
                        type="textarea"
                        value={patient.confirmedDiagnosis}
                        placeholder="Enter confirmed diagnosis"
                        handleChangeText={(text) =>
                            setPatient({ ...patient, confirmedDiagnosis: text })
                        }
                        otherStyles="py-2"
                    />
                )}

                {/* Action Buttons */}
                <View className="w-full flex-row justify-between items-center mt-5 mb-10">
                    <Button title="Update" onPress={handleUpdate} />
                    <Button title="Cancel" onPress={onClose} color="red" />
                </View>
            </ScrollView>
        </Modal>
    );
};

export default EditPatientDetails;
