// TabLayout.jsx

import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Linking,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { StatusBar } from "expo-status-bar";
import { Redirect, Tabs } from "expo-router";
import { icons } from "../../constants";
import { useGlobalContext } from "../../context/GlobalProvider";
import Toast from "react-native-toast-message";
import colors from "../../constants/colors"; // Import the colors

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Define the Doctor Contact Information
const DoctorContact = {
    title: "Doctor Contact Information",
    details: {
        name: "Dr. Jane Smith",
        specialization: "Nephrologist",
        phone: "+1 (555) 123-4567",
        email: "jane.smith@hospital.com",
        address: "123 Health St., Wellness City, HC 12345",
        hours: "Mon-Fri: 9:00 AM - 5:00 PM",
    },
};

// TabIcon Component
const TabIcon = ({ icon, color, name, focused }) => {
    return (
        <View style={styles.tabIconContainer}>
            <Image
                source={icon}
                resizeMode="contain"
                style={[styles.tabIcon, { tintColor: color }]}
            />
            <Text
                style={[
                    styles.tabLabel,
                    { color: color },
                    focused ? styles.tabLabelFocused : styles.tabLabelUnfocused
                ]}
            >
                {name}
            </Text>
        </View>
    );
};

const TabLayout = () => {
    const { user, setUser, setIsLogged } = useGlobalContext();
    const patient = user?.patients || {};

    // Local state for each field (if needed)
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

    const [isModalVisible, setIsModalVisible] = useState(false); // State for Modal

    const logout = async () => {
        await signOut();
        setUser(null);
        setIsLogged(false);
        router.replace("/sign-in");
    };

    return (
        <>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: colors.primary || colors.picton_blue.DEFAULT, // Adjust as needed
                    tabBarInactiveTintColor: colors.gray[100],
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        backgroundColor: colors.gray[500],
                        borderTopWidth: 1,
                        borderTopColor: colors.gray[400],
                        height: 84,
                    },
                }}
            >
                <Tabs.Screen
                    name="patientHome"
                    options={{
                        title: "Home",
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.home}
                                color={color}
                                name="Home"
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="patientMedicationCalender"
                    options={{
                        title: "Medication",
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.pill}
                                color={color}
                                name="Medication"
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="patientFollowUpSchedule"
                    options={{
                        title: "Follow Up",
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.calendar}
                                color={color}
                                name="Follow Up"
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="patientMedicationProgress"
                    options={{
                        title: "Progress",
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.pieChart}
                                color={color}
                                name="Progress"
                                focused={focused}
                            />
                        ),
                    }}
                />
            </Tabs>

            {/* Floating Help/Support Button */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => setIsModalVisible(true)}
                accessibilityLabel="Help or Support"
                accessibilityRole="button"
            >
                <Image
                    source={icons.support} // Ensure you have a help/support icon in your icons
                    style={styles.floatingButtonIcon}
                />
            </TouchableOpacity>

            {/* Modal for Doctor Contact Information */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setIsModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{DoctorContact.title}</Text>
                        <View style={styles.contactDetails}>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>Name:</Text>
                                <Text style={styles.contactValue}>{DoctorContact.details.name}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>Specialization:</Text>
                                <Text style={styles.contactValue}>{DoctorContact.details.specialization}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>Phone:</Text>
                                <TouchableOpacity onPress={() => Linking.openURL(`tel:${DoctorContact.details.phone}`)}>
                                    <Text style={[styles.contactValue, styles.linkText]}>{DoctorContact.details.phone}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>Email:</Text>
                                <TouchableOpacity onPress={() => Linking.openURL(`mailto:${DoctorContact.details.email}`)}>
                                    <Text style={[styles.contactValue, styles.linkText]}>{DoctorContact.details.email}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>Address:</Text>
                                <Text style={styles.contactValue}>{DoctorContact.details.address}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>Office Hours:</Text>
                                <Text style={styles.contactValue}>{DoctorContact.details.hours}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setIsModalVisible(false)}
                            accessibilityLabel="Close Help"
                            accessibilityRole="button"
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
            <Toast />
            <StatusBar backgroundColor={colors.gray[500]} style="light" />
        </>
    );
};

const styles = StyleSheet.create({
    // Existing styles
    tabIconContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIcon: {
        width: 24,
        height: 24,
    },
    tabLabel: {
        fontSize: 12,
    },
    tabLabelFocused: {
        fontWeight: '600',
    },
    tabLabelUnfocused: {
        fontWeight: '400',
    },

    // Floating Help/Support Button
    floatingButton: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        backgroundColor: colors.picton_blue.DEFAULT, // Updated color
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    floatingButtonIcon: {
        width: 30,
        height: 30,
        tintColor: colors.white,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // You can also use colors.gray[200] with opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        color: colors.gray[200],
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 15,
        textAlign: 'center',
    },
    contactDetails: {
        width: '100%',
        marginBottom: 20,
    },
    contactRow: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'flex-start',
    },
    contactLabel: {
        flex: 1,
        color: colors.gray[200],
        fontSize: 16,
        fontWeight: '500',
    },
    contactValue: {
        flex: 2,
        color: colors.gray[300],
        fontSize: 16,
    },
    linkText: {
        color: colors.ruddy_blue.DEFAULT,
        textDecorationLine: 'underline',
    },
    closeButton: {
        backgroundColor: colors.midnight_green.DEFAULT,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    closeButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TabLayout;
