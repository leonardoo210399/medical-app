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
import colors from "../../constants/colors";
import {useTranslation} from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import centralized colors
import { Picker } from '@react-native-picker/picker'; // Import Picker


// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}



const PatientHome = () => {
    const { t, i18n } = useTranslation();

    // Function to change language
    const changeLanguage = async (lng) => {
        await i18n.changeLanguage(lng);
        await AsyncStorage.setItem('appLanguage', lng);
    };

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
    const [diet] = useState(patient.diet || "");

    const [expandedSections, setExpandedSections] = useState([]);

    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);


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

    const CKDSections = [
        {
            title: t('whatIsCKDTitle'),
            content: [
                { type: 'bullet', text: t('whatIsCKDContent1') },
                { type: 'bullet', text: t('whatIsCKDContent2') },
                { type: 'bullet', text: t('whatIsCKDContent3') },
            ],
            image: require("../../assets/images/urology.png"),
        },
        {
            title: t('symptomsOfCKDTitle'),
            content: [
                { type: 'bullet', text: t('symptomsOfCKDContent1') },
                { type: 'bullet', text: t('symptomsOfCKDContent2') },
                { type: 'bullet', text: t('symptomsOfCKDContent3') },
                { type: 'bullet', text: t('symptomsOfCKDContent4') },
                { type: 'bullet', text: t('symptomsOfCKDContent5') },
                { type: 'bullet', text: t('symptomsOfCKDContent6') },
                { type: 'bullet', text: t('symptomsOfCKDContent7') },
                { type: 'bullet', text: t('symptomsOfCKDContent8') },
                { type: 'bullet', text: t('symptomsOfCKDContent9') },
                { type: 'bullet', text: t('symptomsOfCKDContent10') },
                { type: 'bullet', text: t('symptomsOfCKDContent11') },
            ],
            image: require("../../assets/images/assessment.png"),
        },
        {
            title: t('managingCKDTitle'),
            content: [
                { type: 'paragraph', text: t('managingCKDParagraph') },
                { type: 'subheading', text: t('managingCKDSubheadingGeneral') },
                { type: 'bullet', text: t('managingCKDContent1') },
                { type: 'bullet', text: t('managingCKDContent2') },
                { type: 'bullet', text: t('managingCKDContent3') },
                { type: 'bullet', text: t('managingCKDContent4') },
                { type: 'subheading', text: t('managingCKDSubheadingDiet') },
                { type: 'bullet', text: t('managingCKDContent5') },
                { type: 'bullet', text: t('managingCKDContent6') },
                { type: 'bullet', text: t('managingCKDContent7') },
                { type: 'bullet', text: t('managingCKDContent8') },
                { type: 'bullet', text: t('managingCKDContent9') },
            ],
            image: require("../../assets/images/medical-report.png"),
        },
        {
            title: t('preventionTipsTitle'),
            content: [
                { type: 'bullet', text: t('preventionTipsContent1') },
                { type: 'bullet', text: t('preventionTipsContent2') },
                { type: 'bullet', text: t('preventionTipsContent3') },
                { type: 'bullet', text: t('preventionTipsContent4') },
                { type: 'bullet', text: t('preventionTipsContent5') },
            ],
            image: require("../../assets/images/hospital.png"),
        },
    ];

    return (
       <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <View>
                        <Image
                            source={require('../../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>



                    <TouchableOpacity
                        onPress={logout}
                        style={styles.logoutButton}
                        accessibilityLabel={t('logout')}
                        accessibilityRole="button"
                    >
                        <Image
                            source={icons.logout}
                            resizeMode="contain"
                            style={styles.logoutIcon}
                        />
                    </TouchableOpacity>
                </View>

                {/* Welcome Message */}
                <View style={styles.welcomeContainer}>
                    <Text style={styles.welcomeText}>{t('welcome', { name })}</Text>
                </View>
                <View style={styles.languageRow}>
                    <Text style={styles.languageLabel}>{t('language')}:</Text>
                    <View style={styles.languagePickerContainer}>
                        <Picker
                            selectedValue={selectedLanguage}
                            style={styles.languagePicker}
                            itemStyle={styles.languagePickerItem}
                            onValueChange={(itemValue) => {
                                changeLanguage(itemValue);
                                setSelectedLanguage(itemValue);
                            }}
                            mode="dropdown"
                        >
                            <Picker.Item label={t('english')} value="en" />
                            <Picker.Item label={t('hindi')} value="hi" />
                            <Picker.Item label={t('marathi')} value="mr" />
                        </Picker>
                    </View>
                </View>

                {/* Profile Details */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('profileDetails')}</Text>
                    <View style={styles.profileDetails}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('name')}:</Text>
                            <Text style={styles.detailValue}>{name}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('age')}:</Text>
                            <Text style={styles.detailValue}>{age}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('gender')}:</Text>
                            <Text style={styles.detailValue}>{gender}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('comorbidity')}:</Text>
                            <Text style={styles.detailValue}>{comorbidities.join(', ')}</Text>
                        </View>
                        {comorbidities.includes('Others') && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{t('otherComorbidities')}:</Text>
                                <Text style={styles.detailValue}>{otherComorbidities}</Text>
                            </View>
                        )}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('dialysis')}:</Text>
                            <Text style={styles.detailValue}>{dialysis ? 'Yes' : 'No'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('height')}:</Text>
                            <Text style={styles.detailValue}>{height ? `${height} cm` : 'N/A'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('weight')}:</Text>
                            <Text style={styles.detailValue}>{weight ? `${weight} kg` : 'N/A'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('allergies')}:</Text>
                            <Text style={styles.detailValue}>{allergies || 'None'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('diet')}:</Text>
                            <Text style={styles.detailValue}>{diet || 'None'}</Text>
                        </View>
                    </View>
                </View>

                {/* CKD Information */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('aboutCKD')}</Text>
                    {CKDSections.map((section, index) => (
                        <View key={index} style={styles.ckdSection}>
                            <TouchableOpacity
                                onPress={() => toggleSection(index)}
                                style={styles.ckdHeader}
                                accessibilityLabel={`${t('Toggle section')} ${section.title}`}
                                accessibilityRole="button"
                            >
                                <Text style={styles.ckdTitle}>{section.title}</Text>
                                <Image
                                    source={expandedSections.includes(index) ? icons.upArrow : icons.downArrow}
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

// Helper function to render content with bold formatting before colons
const renderContent = (content) => {
    return content.map((item, index) => {
        // Function to render text with bold before colon
        const renderBoldBeforeColon = (text) => {
            const colonIndex = text.indexOf(':');
            if (colonIndex !== -1) {
                const beforeColon = text.substring(0, colonIndex + 1);
                const afterColon = text.substring(colonIndex + 1);
                return (
                    <>
                        <Text style={{ fontWeight: 'bold' }}>{beforeColon}</Text>
                        <Text>{afterColon}</Text>
                    </>
                );
            }
            return text;
        };

        switch (item.type) {
            case 'bullet':
                return (
                    <Text key={index} style={styles.bulletPoint}>
                        {"\u2022"} {renderBoldBeforeColon(item.text)}
                    </Text>
                );
            case 'subheading':
                return (
                    <Text key={index} style={styles.subheading}>
                        {renderBoldBeforeColon(item.text)}
                    </Text>
                );
            case 'paragraph':
                return (
                    <Text key={index} style={styles.paragraph}>
                        {renderBoldBeforeColon(item.text)}
                    </Text>
                );
            default:
                return (
                    <Text key={index} style={styles.paragraph}>
                        {renderBoldBeforeColon(item.text)}
                    </Text>
                );
        }
    });
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
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
        tintColor: colors.gray[600],
    },
    welcomeContainer: {
        marginBottom: 20,
    },
    welcomeText: {
        color: colors.midnight_green.DEFAULT,
        fontSize: 24,
        fontWeight: '600',
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        marginBottom: 25,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        color: colors.midnight_green.DEFAULT,
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
    },
    profileDetails: {},
    detailRow: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'center',
    },
    detailLabel: {
        flex: 1,
        color: colors.gray[200],
        fontSize: 16,
        fontWeight: '500',
    },
    detailValue: {
        flex: 2,
        color: colors.gray[300],
        fontSize: 16,
    },
    ckdSection: {
        marginBottom: 15,
    },
    ckdHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.gray[100],
        padding: 12,
        borderRadius: 8,
    },
    ckdTitle: {
        color: colors.midnight_green.DEFAULT,
        fontSize: 18,
        fontWeight: '500',
        flex: 1,
        flexWrap: 'wrap',
    },
    arrowIcon: {
        width: 20,
        height: 20,
        tintColor: colors.midnight_green.DEFAULT,
        marginLeft: 10,
    },
    ckdContent: {
        backgroundColor: colors.gray[100],
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
    bulletPoint: {
        color: colors.gray[200],
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 5,
        marginLeft: 10,
    },
    subheading: {
        color: colors.gray[200],
        fontSize: 18,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 5,
    },
    paragraph: {
        color: colors.gray[200],
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 10,
    },
    languageRow: {
        flexDirection: 'row',
        alignItems: 'center',  // Centers items vertically
        marginBottom: 20,
        alignSelf: 'center',
        width: '100%',          // Adjust as needed for your layout
        justifyContent: 'space-between',
    },
    languageLabel: {
        fontSize: 20,
        color: colors.midnight_green.DEFAULT,
        fontWeight: '500',
        // Ensuring consistent height with the Picker
        height: 50,
        textAlignVertical: 'center',
        marginRight: 10,
        width: '40%',
    },
    languagePickerContainer: {
        flex: 1,  // Picker takes up the remaining space in the row
        borderWidth: 1,
        borderColor: colors.gray[300],
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: colors.white,
        // Matching the height of the label
        height: 50,
        justifyContent: 'center',
    },
    languagePicker: {
        flex: 1,
        height: '100%',          // Ensures Picker uses full container height
        color: colors.midnight_green.DEFAULT,
        paddingHorizontal: 10,
    },
    languagePickerItem: {
        color: colors.midnight_green.DEFAULT,
        fontSize: 16,
    },
});

export default PatientHome;
