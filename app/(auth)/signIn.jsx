import { useState } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, Dimensions, Alert, Image } from "react-native";

import { images } from "../../constants";
// import { CustomButton, FormField } from "../../components";
import { getCurrentUser, signIn, createPhoneSession } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";

const SignIn = () => {
    // const { setUser, setIsLogged } = useGlobalContext();
    const [isSubmitting, setSubmitting] = useState(false);
    const [isPhoneLogin, setIsPhoneLogin] = useState(false); // Toggle for login type
    const [form, setForm] = useState({
        identifier: "", // Can be email or phone number
        password: "", // Used for email login only
    });

    const submit = async () => {
        if (form.identifier === "") {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setSubmitting(true);

        try {
            if (isPhoneLogin) {
                // Handle phone login
                const phoneToken = await createPhoneSession(form.identifier);
                if (!phoneToken) throw new Error("Failed to send verification code.");

                const userOTP = prompt("Enter the verification code sent to your phone:");
                await signIn(form.identifier, userOTP, true); // Sign in using phone
            } else {
                // Handle email/password login
                await signIn(form.identifier, form.password);
            }

            const result = await getCurrentUser();
            setUser(result);
            setIsLogged(true);

            Alert.alert("Success", "User signed in successfully");
            router.replace("/home");
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
                        Log in to Aora
                    </Text>

                    <FormField
                        title={isPhoneLogin ? "Phone Number" : "Email"}
                        value={form.identifier}
                        handleChangeText={(e) => setForm({ ...form, identifier: e })}
                        otherStyles="mt-7"
                        keyboardType={isPhoneLogin ? "phone-pad" : "email-address"}
                    />

                    {!isPhoneLogin && (
                        <FormField
                            title="Password"
                            value={form.password}
                            handleChangeText={(e) => setForm({ ...form, password: e })}
                            otherStyles="mt-7"
                            secureTextEntry={true}
                        />
                    )}

                    <CustomButton
                        title={isPhoneLogin ? "Sign In with Phone" : "Sign In"}
                        handlePress={submit}
                        containerStyles="mt-7"
                        isLoading={isSubmitting}
                    />

                    <View className="flex justify-center pt-5 flex-row gap-2">
                        <Text className="text-lg text-gray-100 font-pregular">
                            {isPhoneLogin ? "Switch to Email Login?" : "Switch to Phone Login?"}
                        </Text>
                        <Text
                            onPress={() => setIsPhoneLogin(!isPhoneLogin)}
                            className="text-lg font-psemibold text-secondary"
                        >
                            {isPhoneLogin ? "Use Email" : "Use Phone"}
                        </Text>
                    </View>

                    <View className="flex justify-center pt-5 flex-row gap-2">
                        <Text className="text-lg text-gray-100 font-pregular">
                            Don't have an account?
                        </Text>
                        <Link
                            href="/sign-up"
                            className="text-lg font-psemibold text-secondary"
                        >
                            Signup
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SignIn;
