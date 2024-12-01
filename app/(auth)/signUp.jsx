import React, { useState } from "react";
import { View, Text, Alert, ScrollView, Dimensions, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";

// import { CustomButton, FormField } from "../../components";
import { createUser, sendPhoneOTP, signInWithPhone } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { images } from "../../constants";

const SignUp = () => {
    const { setUser, setIsLogged } = useGlobalContext();
    const [isSubmitting, setSubmitting] = useState(false);
    const [isPhoneSignup, setIsPhoneSignup] = useState(false); // Toggle between email and phone signup
    const [form, setForm] = useState({
        identifier: "", // Can be email or phone number
        password: "",
        username: "",
        doctorFlag: false,
    });
    const [phoneToken, setPhoneToken] = useState(null); // Holds the phone token for OTP verification

    const submit = async () => {
        if (form.username === "" || form.identifier === "" || (!isPhoneSignup && form.password === "")) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setSubmitting(true);

        try {
            if (isPhoneSignup) {
                if (!phoneToken) {
                    // Send OTP
                    const token = await sendPhoneOTP(form.identifier);
                    setPhoneToken(token);
                    Alert.alert("Success", "Verification code sent to your phone.");
                } else {
                    // Verify OTP and complete phone-based signup
                    const userOTP = prompt("Enter the verification code sent to your phone:");
                    const session = await signInWithPhone(phoneToken.userId, userOTP);
                    setUser(session);
                    setIsLogged(true);
                    router.replace("/home");
                }
            } else {
                // Email/Password-based signup
                const newUser = await createUser(
                    form.identifier,
                    form.password,
                    form.username,
                    form.doctorFlag
                );
                if (newUser) {
                    Alert.alert("Success", "Account created successfully!");
                    router.replace("/sign-in");
                }
            }
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="bg-primary h-full">
            <ScrollView>
                <View
                    className="w-full flex justify-center h-full px-4 my-6"
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
                        Sign Up for Aora
                    </Text>

                    <FormField
                        title="Username"
                        value={form.username}
                        handleChangeText={(e) => setForm({ ...form, username: e })}
                        otherStyles="mt-7"
                    />

                    <FormField
                        title={isPhoneSignup ? "Phone Number" : "Email"}
                        value={form.identifier}
                        handleChangeText={(e) => setForm({ ...form, identifier: e })}
                        otherStyles="mt-7"
                        keyboardType={isPhoneSignup ? "phone-pad" : "email-address"}
                    />

                    {!isPhoneSignup && (
                        <FormField
                            title="Password"
                            value={form.password}
                            handleChangeText={(e) => setForm({ ...form, password: e })}
                            otherStyles="mt-7"
                            secureTextEntry={true}
                        />
                    )}

                    <CustomButton
                        title={isPhoneSignup ? (phoneToken ? "Verify OTP" : "Send OTP") : "Sign Up"}
                        handlePress={submit}
                        containerStyles="mt-7"
                        isLoading={isSubmitting}
                    />

                    <View className="flex justify-center pt-5 flex-row gap-2">
                        <Text className="text-lg text-gray-100 font-pregular">
                            {isPhoneSignup ? "Switch to Email Signup?" : "Switch to Phone Signup?"}
                        </Text>
                        <Text
                            onPress={() => {
                                setIsPhoneSignup(!isPhoneSignup);
                                setPhoneToken(null); // Reset phone token when switching modes
                            }}
                            className="text-lg font-psemibold text-secondary"
                        >
                            {isPhoneSignup ? "Use Email" : "Use Phone"}
                        </Text>
                    </View>

                    <View className="flex justify-center pt-5 flex-row gap-2">
                        <Text className="text-lg text-gray-100 font-pregular">
                            Already have an account?
                        </Text>
                        <Link
                            href="/sign-in"
                            className="text-lg font-psemibold text-secondary"
                        >
                            Login
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SignUp;
