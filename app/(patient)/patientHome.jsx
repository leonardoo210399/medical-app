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
        content: [
            { type: 'bullet', text: "Chronic kidney disease, also called chronic kidney failure, involves a gradual loss of kidney function." },
            { type: 'bullet', text: "The kidneys are damaged over time (for at least 3 months) and have a hard time doing all their important work like waste removal, maintaining blood pressure, balancing minerals, and helping to make red blood cells (RBCs)." },
            { type: 'bullet', text: "Chronic kidney disease can progress to end-stage kidney failure, which is fatal without artificial filtering (dialysis) or a kidney transplant." },
        ],
        image: require("../../assets/images/ckd1.png"),
    },
    {
        title: "Symptoms of CKD",
        content: [
            { type: 'bullet', text: "Urinating (peeing) more often or less often than usual" },
            { type: 'bullet', text: "Nausea" },
            { type: 'bullet', text: "Vomiting" },
            { type: 'bullet', text: "Loss of appetite" },
            { type: 'bullet', text: "Swelling of feet and ankles" },
            { type: 'bullet', text: "Dry, itchy skin" },
            { type: 'bullet', text: "Trouble sleeping" },
            { type: 'bullet', text: "Trouble concentrating" },
            { type: 'bullet', text: "Numbness in your arms, legs, ankles, or feet" },
            { type: 'bullet', text: "Weight loss without trying to lose weight" },
            { type: 'bullet', text: "Achy muscles or cramping" },
        ],
        image: require("../../assets/images/ckd2.png"),
    },
    {
        title: "Managing CKD",
        content: [
            { type: 'paragraph', text: "Here’s a focused diet counseling guide for CKD patients:" },
            { type: 'subheading', text: "In General:" },
            { type: 'bullet', text: "Early Detection and Regular Monitoring: CKD is best managed when detected early. Regular check-ups help track kidney function through blood tests and urine tests, allowing for timely intervention." },
            { type: 'bullet', text: "Control Blood Pressure and Blood Sugar: High blood pressure and diabetes can worsen kidney damage. Keeping these under control with the right lifestyle and medications is crucial for slowing CKD progression." },
            { type: 'bullet', text: "Medication Adherence: Taking your medications as prescribed is very important for managing kidney disease and preventing it from getting worse. Missing medicine for blood pressure, blood sugar, and kidney health can worsen kidney disease and cause more strain on your kidneys. Taking your medicine regularly helps keep everything stable and supports your kidneys. Using digital reminders can help you remember to take your medicine on time. If you have any side effects, let your doctor know, so they can adjust your treatment." },
            { type: 'bullet', text: "Note: Our app will make it easy for you to track your medications and stay on top of your routine, helping you stick to your treatment plan and stay healthy!" },
            { type: 'subheading', text: "Diet Related:" },
            { type: 'bullet', text: "Limit Protein Intake: Reduce the amount of protein, especially from animal sources, to ease the burden on the kidneys. Focus on high-quality protein like lean meats, eggs, and plant-based proteins, but consume them in moderation based on your kidney function stage." },
            { type: 'bullet', text: "Control Sodium (Salt) Intake: Minimize salt by avoiding processed foods and using herbs and spices for flavor to prevent fluid retention and high blood pressure." },
            { type: 'bullet', text: "Manage Potassium and Phosphorus: Depending on kidney function, limit high-potassium foods (like bananas, oranges, potatoes, and tomatoes) and high-phosphorus foods (like dairy, nuts, and colas). A dietitian can help determine safe levels based on lab results." },
            { type: 'bullet', text: "Monitor Fluid Intake: Depending on the stage of CKD and fluid retention, you may need to adjust how much water or other fluids you drink. Your doctor will guide how much is safe for you." },
            { type: 'bullet', text: "Eat Heart-Healthy Foods: Since CKD often coexists with heart disease risk factors, focus on a heart-healthy diet that includes healthy fats (like olive oil), whole grains, fruits, and vegetables, while limiting saturated fats and cholesterol." },
        ],
        image: require("../../assets/images/ckd3.png"),
    },
    {
        title: "Prevention Tips",
        content: [
            { type: 'bullet', text: "Maintain a healthy weight with regular exercise, aiming for 30 minutes most days, to control blood pressure and reduce kidney damage." },
        ],
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
                    <View>
                        <Image
                            source={require('../../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
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
                                    {renderContent(section.content)}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Helper function to render content with proper formatting
const renderContent = (content) => {
    return content.map((item, index) => {
        switch (item.type) {
            case 'bullet':
                return (
                    <Text key={index} style={styles.bulletPoint}>
                        {"\u2022"} {item.text}
                    </Text>
                );
            case 'subheading':
                return (
                    <Text key={index} style={styles.subheading}>
                        {item.text}
                    </Text>
                );
            case 'paragraph':
                return (
                    <Text key={index} style={styles.paragraph}>
                        {item.text}
                    </Text>
                );
            default:
                return (
                    <Text key={index} style={styles.paragraph}>
                        {item.text}
                    </Text>
                );
        }
    });
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
    logo: {
        width: 200,
        height: 50,
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
    bulletPoint: {
        color: '#2c3e50',
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 5,
        marginLeft: 10,
    },
    subheading: {
        color: '#2c3e50',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 5,
    },
    paragraph: {
        color: '#2c3e50',
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 10,
    },
});

export default PatientHome;
