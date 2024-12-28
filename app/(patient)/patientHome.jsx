// patientHome.jsx

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { signOut } from "../../lib/appwrite";
import { router } from "expo-router";
import { icons } from "../../constants";
import { useGlobalContext } from "../../context/GlobalProvider";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CKDSections = [
    {
        title: "What is Chronic Kidney Disease?",
        content: "Chronic Kidney Disease (CKD) is a long-term condition where the kidneys do not work effectively. It can lead to kidney failure and other serious health issues.",
        image: require("../../assets/images/ckd1.png"),
    },
    {
        title: "Symptoms of CKD",
        content: "Common symptoms include fatigue, swollen ankles, shortness of breath, and frequent urination, especially at night.",
        image: require("../../assets/images/ckd2.png"),
    },
    {
        title: "Managing CKD",
        content: "Managing CKD involves controlling underlying conditions like diabetes and hypertension, following a kidney-friendly diet, and regular monitoring by healthcare professionals.",
        image: require("../../assets/images/ckd3.png"),
    },
    {
        title: "Prevention Tips",
        content: "Maintain a healthy lifestyle, stay hydrated, avoid excessive use of over-the-counter painkillers, and regularly check your kidney function.",
        image: require("../../assets/images/ckd4.png"),
    },
];

const PatientHome = () => {
    const { user, setUser, setIsLogged } = useGlobalContext();
    const patient = user?.patients || {};

    // Local state for each field
    const [name] = useState(patient.name || "");
    const [age] = useState(patient.age?.toString() || "");
    const [gender] = useState(patient.gender || "Other");
    const [comorbidities] = useState(patient.comorbidities || []);
    const [otherComorbidities] = useState(patient.otherComorbidities || "");
    const [dialysis] = useState(patient.dialysis || false);
    const [height] = useState(patient.height?.toString() || "");
    const [weight] = useState(patient.weight?.toString() || "");
    const [allergies] = useState(patient.allergies || "");
    const [confirmedDiagnosis] = useState(patient.confirmedDiagnosis || "");

    const [expandedSections, setExpandedSections] = useState([]);

    const toggleSection = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedSections.includes(index)) {
            setExpandedSections(expandedSections.filter((i) => i !== index));
        } else {
            setExpandedSections([...expandedSections, index]);
        }
    };

    const logout = async () => {
        await signOut();
        setUser(null);
        setIsLogged(false);
        router.replace("/sign-in");
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Header with Logout */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Patient Home</Text>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <Image
                            source={icons.logout}
                            resizeMode="contain"
                            style={styles.logoutIcon}
                        />
                    </TouchableOpacity>
                </View>

                {/* Welcome Message */}
                <View style={styles.welcomeContainer}>
                    <Text style={styles.welcomeText}>Welcome, {name}!</Text>
                </View>

                {/* Profile Details */}
                <View style={styles.profileContainer}>
                    <Text style={styles.sectionTitle}>Profile Details</Text>
                    <View style={styles.profileDetails}>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Name:</Text> {name}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Age:</Text> {age}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Gender:</Text> {gender}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Comorbidities:</Text> {comorbidities.join(", ")}
                        </Text>
                        {comorbidities.includes("Others") && (
                            <Text style={styles.detailText}>
                                <Text style={styles.boldText}>Other Comorbidities:</Text> {otherComorbidities}
                            </Text>
                        )}
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Dialysis:</Text> {dialysis ? "Yes" : "No"}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Height:</Text> {height ? `${height} cm` : "N/A"}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Weight:</Text> {weight ? `${weight} kg` : "N/A"}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Allergies:</Text> {allergies || "None"}
                        </Text>
                        {/* Uncomment if needed
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Confirmed Diagnosis:</Text> {confirmedDiagnosis || "None"}
                        </Text>
                        */}
                    </View>
                </View>

                {/* CKD Information */}
                <View style={styles.ckdContainer}>
                    <Text style={styles.sectionTitle}>About Chronic Kidney Disease (CKD)</Text>
                    {CKDSections.map((section, index) => (
                        <View key={index} style={styles.ckdSection}>
                            <TouchableOpacity onPress={() => toggleSection(index)} style={styles.ckdHeader}>
                                <Text style={styles.ckdTitle}>{section.title}</Text>
                                <Image
                                    source={
                                        expandedSections.includes(index)
                                            ? icons.upArrow
                                            : icons.downArrow
                                    }
                                    style={styles.arrowIcon}
                                />
                            </TouchableOpacity>
                            {expandedSections.includes(index) && (
                                <View style={styles.ckdContent}>
                                    <Image
                                        source={section.image}
                                        resizeMode="contain"
                                        style={styles.ckdImage}
                                    />
                                    <Text style={styles.ckdText}>{section.content}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    logoutButton: {
        padding: 10,
    },
    logoutIcon: {
        width: 24,
        height: 24,
        tintColor: '#ffffff',
    },
    welcomeContainer: {
        marginBottom: 20,
    },
    welcomeText: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '600',
    },
    profileContainer: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 15,
        marginBottom: 30,
    },
    sectionTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 10,
    },
    profileDetails: {
        space: 10,
    },
    detailText: {
        color: '#d1d1d1',
        fontSize: 16,
        marginBottom: 5,
    },
    boldText: {
        fontWeight: 'bold',
        color: '#ffffff',
    },
    ckdContainer: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 15,
    },
    ckdSection: {
        marginBottom: 15,
    },
    ckdHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        padding: 10,
        borderRadius: 8,
    },
    ckdTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '500',
        flex: 1,
        flexWrap: 'wrap',
    },
    arrowIcon: {
        width: 20,
        height: 20,
        tintColor: '#ffffff',
        marginLeft: 10,
    },
    ckdContent: {
        backgroundColor: '#333333',
        padding: 10,
        borderRadius: 8,
        marginTop: 5,
    },
    ckdImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 10,
    },
    ckdText: {
        color: '#d1d1d1',
        fontSize: 16,
        lineHeight: 22,
    },
});

export default PatientHome;
