// patientHome.jsx

import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
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
                    <TouchableOpacity onPress={logout} style={styles.logoutButton} accessibilityLabel="Logout" accessibilityRole="button">
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
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Profile Details</Text>
                    <View style={styles.profileDetails}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Name:</Text>
                            <Text style={styles.detailValue}>{name}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Age:</Text>
                            <Text style={styles.detailValue}>{age}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Gender:</Text>
                            <Text style={styles.detailValue}>{gender}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Comorbidity:</Text>
                            <Text style={styles.detailValue}>{comorbidities.join(", ")}</Text>
                        </View>
                        {comorbidities.includes("Others") && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Other Comorbidities:</Text>
                                <Text style={styles.detailValue}>{otherComorbidities}</Text>
                            </View>
                        )}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Dialysis:</Text>
                            <Text style={styles.detailValue}>{dialysis ? "Yes" : "No"}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Height:</Text>
                            <Text style={styles.detailValue}>{height ? `${height} cm` : "N/A"}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Weight:</Text>
                            <Text style={styles.detailValue}>{weight ? `${weight} kg` : "N/A"}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Allergies:</Text>
                            <Text style={styles.detailValue}>{allergies || "None"}</Text>
                        </View>
                        {/* Uncomment if needed
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Confirmed Diagnosis:</Text>
                            <Text style={styles.detailValue}>{confirmedDiagnosis || "None"}</Text>
                        </View>
                        */}
                    </View>
                </View>

                {/* CKD Information */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>About Chronic Kidney Disease (CKD)</Text>
                    {CKDSections.map((section, index) => (
                        <View key={index} style={styles.ckdSection}>
                            <TouchableOpacity onPress={() => toggleSection(index)} style={styles.ckdHeader} accessibilityLabel={`Toggle section ${section.title}`} accessibilityRole="button">
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
        </SafeAreaView>)
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7',
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
        color: '#2c3e50',
        fontSize: 28,
        fontWeight: '700',
    },
    logoutButton: {
        padding: 8,
    },
    logoutIcon: {
        width: 24,
        height: 24,
        tintColor: '#e74c3c',
    },
    welcomeContainer: {
        marginBottom: 20,
    },
    welcomeText: {
        color: '#34495e',
        fontSize: 24,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        color: '#2c3e50',
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
    },
    profileDetails: {
        // No specific styling needed for now
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'center',
    },
    detailLabel: {
        flex: 1,
        color: '#2c3e50',
        fontSize: 16,
        fontWeight: '500',
    },
    detailValue: {
        flex: 2,
        color: '#7f8c8d',
        fontSize: 16,
    },
    ckdSection: {
        marginBottom: 15,
    },
    ckdHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ecf0f1',
        padding: 12,
        borderRadius: 8,
    },
    ckdTitle: {
        color: '#2c3e50',
        fontSize: 18,
        fontWeight: '500',
        flex: 1,
        flexWrap: 'wrap',
    },
    arrowIcon: {
        width: 20,
        height: 20,
        tintColor: '#2c3e50',
        marginLeft: 10,
    },
    ckdContent: {
        backgroundColor: '#bdc3c7',
        padding: 12,
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
        color: '#2c3e50',
        fontSize: 16,
        lineHeight: 22,
    },
});

export default PatientHome;
