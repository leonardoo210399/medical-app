import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Switch } from "react-native";
import { icons } from "../constants";
import { Picker } from '@react-native-picker/picker';


/**
 * Props:
 * - title: string - The label for the field
 * - value: various - The current value of the field
 * - placeholder: string - Placeholder text for input fields
 * - handleChangeText: function - Callback to update the parent state
 * - type: string - A field type specifier (e.g. "string", "number", "boolean", "checkbox-group", "textarea", "password", "radio-group")
 * - options: array - For radio groups, checkbox groups, or future dropdowns (e.g. [{ label: 'Male', value: 'male' }, ...])
 * - role: string - Current user role (e.g. "Patient" or "Doctor")
 * - confirmedDiagnosisEnabled: boolean - If true, allows "Confirmed Diagnosis" field editing for doctors
 * - otherStyles: string - Additional Tailwind styles for container
 *
 * Field Type Handling:
 * - "string": Default single-line text
 * - "number": Numeric input (e.g. Age, Height, Weight)
 * - "boolean": A toggle for yes/no (e.g. Dialysis)
 * - "checkbox-group": Multiple selection checkboxes (e.g. Comorbidities)
 * - "radio-group": Single selection (e.g. Gender)
 * - "textarea": Multiline text input (e.g. Allergies, Confirmed Diagnosis)
 * - "password": Secure text input with show/hide button
 */

const FormField = ({
                       title,
                       value,
                       placeholder,
                       handleChangeText,
                       type = "string",
                       options = [],
                       role = "Patient",
                       confirmedDiagnosisEnabled = false,
                       otherStyles,
                       ...props
                   }) => {
    const [showPassword, setShowPassword] = useState(false);

    // Conditional Logic Example for Confirmed Diagnosis:
    // If it's a "Confirmed Diagnosis" field, only render editable if `role` is "Doctor" and `confirmedDiagnosisEnabled` is true.
    const isConfirmedDiagnosisField = title.toLowerCase().includes("confirmed diagnosis");
    const isEditable = !isConfirmedDiagnosisField || (role === "Doctor" && confirmedDiagnosisEnabled);

    if (type === "boolean") {
        // Dialysis or other boolean fields as a switch
        return (
            <View className={`space-y-2 ${otherStyles}`}>
                <Text className="text-base text-gray-100 font-pmedium">{title}</Text>
                <View className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 flex flex-row items-center">
                    <Text className="text-white font-psemibold text-base flex-1">{value ? "Yes" : "No"}</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={value ? "#f5dd4b" : "#f4f3f4"}
                        onValueChange={isEditable ? handleChangeText : () => {}}
                        value={value}
                    />
                </View>
            </View>
        );
    }

    if (type === "number") {
        // Numeric input (Age, Height, Weight)
        return (
            <View className={`space-y-2 ${otherStyles}`}>
                <Text className="text-base text-gray-100 font-pmedium">{title}</Text>
                <View className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 flex flex-row items-center">
                    <TextInput
                        className="flex-1 text-white font-psemibold text-base"
                        value={value !== undefined && value !== null ? String(value) : ""}
                        placeholder={placeholder}
                        placeholderTextColor="#7B7B8B"
                        keyboardType="numeric"
                        onChangeText={(text) => {
                            if (isEditable) {
                                // Basic validation: allow only numbers and decimal points
                                handleChangeText(text.replace(/[^0-9.]/g, ''));
                            }
                        }}
                        editable={isEditable}
                        {...props}
                    />
                </View>
            </View>
        );
    }

    if (type === "dropdown") {
        return (
            <View className={`space-y-2 ${otherStyles}`}>
                <Text className="text-base text-gray-100 font-pmedium">{title}</Text>
                <View className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 flex flex-row items-center">
                    <Picker
                        selectedValue={value}
                        onValueChange={(itemValue, itemIndex) => {
                            if (isEditable) {
                                handleChangeText(itemValue);
                            }
                        }}
                        style={{ flex: 1, color: 'white' }}
                        enabled={isEditable}
                        dropdownIconColor="#7B7B8B"
                    >
                        {options?.map((option) => (
                            <Picker.Item
                                label={option.label}
                                value={option.value}
                                key={option.value}
                            />
                        ))}
                    </Picker>
                </View>
            </View>
        );
    }

    if (type === "textarea") {
        // Multiline text input (Allergies, Confirmed Diagnosis)
        return (
            <View className={`space-y-2 ${otherStyles}`}>
                <Text className="text-base text-gray-100 font-pmedium">{title}</Text>
                <View className="w-full px-4 bg-black-100 rounded-2xl border-2 border-black-200">
                    <TextInput
                        className="text-white font-psemibold text-base"
                        value={value}
                        placeholder={placeholder}
                        placeholderTextColor="#7B7B8B"
                        multiline
                        style={{ height: 100, textAlignVertical: 'top' }}
                        onChangeText={(text) => isEditable && handleChangeText(text)}
                        editable={isEditable}
                        {...props}
                    />
                </View>
            </View>
        );
    }

    if (type === "checkbox-group") {
        // Multiple selection checkboxes (Comorbidities)
        const toggleCheckbox = (val) => {
            if (!isEditable) return;
            if (value.includes(val)) {
                handleChangeText(value.filter((item) => item !== val));
            } else {
                handleChangeText([...value, val]);
            }
        };

        return (
            <View className={`space-y-2 ${otherStyles}`}>
                <Text className="text-base text-gray-100 font-pmedium">{title}</Text>
                <View className="w-full px-4 bg-black-100 rounded-2xl border-2 border-black-200 py-2">
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => toggleCheckbox(option.value)}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                        >
                            <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 5,
                                borderWidth: 2,
                                borderColor: '#fff',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 10,
                            }}>
                                {value.includes(option.value) && (
                                    <View style={{ width: 10, height: 10, backgroundColor: '#fff', borderRadius: 2 }} />
                                )}
                            </View>
                            <Text style={{color:'#fff'}}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    if (type === "radio-group") {
        // Single selection (Gender)
        const selectRadio = (val) => {
            if (isEditable) {
                handleChangeText(val);
            }
        };

        return (
            <View className={`space-y-2 ${otherStyles}`}>
                <Text className="text-base text-gray-100 font-pmedium">{title}</Text>
                <View className="w-full px-4 bg-black-100 rounded-2xl border-2 border-black-200 py-2">
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => selectRadio(option.value)}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                        >
                            <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: '#fff',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 10,
                            }}>
                                {value === option.value && (
                                    <View style={{ width: 10, height: 10, backgroundColor: '#fff', borderRadius: 5 }} />
                                )}
                            </View>
                            <Text style={{color:'#fff'}}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    if (type === "password") {
        // Password field with show/hide
        return (
            <View className={`space-y-2 ${otherStyles}`}>
                <Text className="text-base text-gray-100 font-pmedium">{title}</Text>
                <View className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 flex flex-row items-center">
                    <TextInput
                        className="flex-1 text-white font-psemibold text-base"
                        value={value}
                        placeholder={placeholder}
                        placeholderTextColor="#7B7B8B"
                        secureTextEntry={!showPassword}
                        onChangeText={(text) => isEditable && handleChangeText(text)}
                        editable={isEditable}
                        {...props}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Image
                            source={!showPassword ? icons.eye : icons.eyeHide}
                            className="w-6 h-6"
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Default: single-line string input
    return (
        <View className={`space-y-2 ${otherStyles}`}>
            <Text className="text-base text-gray-100 font-pmedium">{title}</Text>
            <View className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 flex flex-row items-center">
                <TextInput
                    className="flex-1 text-white font-psemibold text-base"
                    value={value}
                    placeholder={placeholder}
                    placeholderTextColor="#7B7B8B"
                    onChangeText={(text) => isEditable && handleChangeText(text)}
                    editable={isEditable}
                    {...props}
                />
            </View>
        </View>
    );
};

export default FormField;
