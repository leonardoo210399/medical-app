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
import { Ionicons } from '@expo/vector-icons';
import { icons } from "../../constants";
import { useGlobalContext } from "../../context/GlobalProvider";
import Toast from "react-native-toast-message";
import colors from "../../constants/colors";
import { useTranslation } from 'react-i18next';
import '../../translations/i18n';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DoctorContact = {
    titleKey: "doctorContactTitle",  // Translation key for title
    details: {
        name: "Dr. Jane Smith",
        specialization: "Nephrologist",
        phone: "+1 (555) 123-4567",
        email: "jane.smith@hospital.com",
        address: "123 Health St., Wellness City, HC 12345",
        hours: "Mon-Fri: 9:00 AM - 5:00 PM",
    },
};

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
    const { t } = useTranslation();
    const { user, setUser, setIsLogged } = useGlobalContext();
    const [isModalVisible, setIsModalVisible] = useState(false);

    const logout = async () => {
        // Implement signOut logic here...
        // await signOut();
        setUser(null);
        setIsLogged(false);
        // router.replace("/sign-in"); // Uncomment and adjust if using router
    };

    return (
        <>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: colors.primary || colors.picton_blue.DEFAULT,
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
                        title: t('Home'), // Translate tab title if needed
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.home}
                                color={color}
                                name={t('Home')}
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="patientMedicationCalender"
                    options={{
                        title: t('Medication'),
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.pill}
                                color={color}
                                name={t('Medication')}
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="patientFollowUpSchedule"
                    options={{
                        title: t('Follow Up'),
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.calendar}
                                color={color}
                                name={t('Follow Up')}
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="patientMedicationProgress"
                    options={{
                        title: t('Progress'),
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon
                                icon={icons.pieChart}
                                color={color}
                                name={t('Progress')}
                                focused={focused}
                            />
                        ),
                    }}
                />
            </Tabs>

            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => setIsModalVisible(true)}
                accessibilityLabel={t('HelpOrSupport')}
                accessibilityRole="button"
            >
                <Image
                    source={icons.support}
                    style={styles.floatingButtonIcon}
                />
            </TouchableOpacity>

            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setIsModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t(DoctorContact.titleKey)}</Text>
                        <View style={styles.contactDetails}>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>{t('doctorNameLabel')}</Text>
                                <Text style={styles.contactValue}>{DoctorContact.details.name}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>{t('doctorSpecializationLabel')}</Text>
                                <Text style={styles.contactValue}>{DoctorContact.details.specialization}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>{t('doctorPhoneLabel')}</Text>
                                <TouchableOpacity onPress={() => Linking.openURL(`tel:${DoctorContact.details.phone}`)}>
                                    <Text style={[styles.contactValue, styles.linkText]}>{DoctorContact.details.phone}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>{t('doctorEmailLabel')}</Text>
                                <TouchableOpacity onPress={() => Linking.openURL(`mailto:${DoctorContact.details.email}`)}>
                                    <Text style={[styles.contactValue, styles.linkText]}>{DoctorContact.details.email}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>{t('doctorAddressLabel')}</Text>
                                <Text style={styles.contactValue}>{DoctorContact.details.address}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactLabel}>{t('doctorOfficeHoursLabel')}</Text>
                                <Text style={styles.contactValue}>{DoctorContact.details.hours}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setIsModalVisible(false)}
                            accessibilityLabel={t('closeHelp')}
                            accessibilityRole="button"
                        >
                            <Text style={styles.closeButtonText}>{t('closeHelp')}</Text>
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
    floatingButton: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        backgroundColor: colors.picton_blue.DEFAULT,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
    // ... other styles as needed
});

export default TabLayout;
