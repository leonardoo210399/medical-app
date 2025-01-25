// PatientMedicationProgress.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { useGlobalContext } from '../../context/GlobalProvider';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { parseISO, differenceInCalendarDays, addDays, format } from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../../constants/colors';
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const screenWidth = Dimensions.get('window').width;

const DATABASE_ID = 'HealthManagementDatabaseId';
const MEDICATIONS_COLLECTION_ID = 'MedicationsCollectionId';
const INTAKE_RECORDS_COLLECTION_ID = 'IntakeRecords';

const PatientMedicationProgress = () => {
    const { t, i18n } = useTranslation();
    const { user } = useGlobalContext();
    const userId = user?.$id;

    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalTaken, setTotalTaken] = useState(0);
    const [totalNotTaken, setTotalNotTaken] = useState(0);
    // Removed totalRemaining state
    const [refreshing, setRefreshing] = useState(false);

    // Function to change language and store preference (if needed in this component)
    const changeLanguage = async (lng) => {
        await i18n.changeLanguage(lng);
        await AsyncStorage.setItem('appLanguage', lng);
    };

    const normalizeStatus = (status) => status.replace(/_/g, ' ').toLowerCase();

    const fetchMedications = async () => {
        try {
            console.log('Fetching medications for user:', userId);
            const response = await databases.listDocuments(
                DATABASE_ID,
                MEDICATIONS_COLLECTION_ID,
                [Query.equal('userMedication', userId)]
            );
            console.log('Fetched Medications:', response.documents);
            return response.documents;
        } catch (err) {
            console.error('Error fetching medications:', err);
            throw new Error(t('failedToLoadMedications'));
        }
    };

    const fetchIntakeRecords = async (medicationId) => {
        try {
            console.log(`Fetching intake records for medication ID: ${medicationId}`);
            const response = await databases.listDocuments(
                DATABASE_ID,
                INTAKE_RECORDS_COLLECTION_ID,
                [Query.equal('medications', medicationId)]
            );
            console.log(`Fetched Intake Records for ${medicationId}:`, response.documents);
            return response.documents;
        } catch (err) {
            console.error(`Error fetching intake records for medication ${medicationId}:`, err);
            return [];
        }
    };

    const computeTotalDoses = (medication) => {
        if (medication.onDemand) {
            return null;
        }

        const startDate = parseISO(medication.startDate);
        const endDate = parseISO(medication.endDate);
        const effectiveEndDate = endDate;

        const totalDays = differenceInCalendarDays(effectiveEndDate, startDate) + 1;
        let intakeDays = 0;

        if (medication.cyclicIntakeDays && medication.cyclicPauseDays) {
            const cycleLength = medication.cyclicIntakeDays + medication.cyclicPauseDays;
            const fullCycles = Math.floor(totalDays / cycleLength);
            intakeDays += fullCycles * medication.cyclicIntakeDays;

            const remainingDays = totalDays % cycleLength;
            intakeDays += Math.min(remainingDays, medication.cyclicIntakeDays);

            console.log(`Cyclic Medication: ${medication.medicineName}`);
            console.log(
                `Total Days: ${totalDays}, Cycle Length: ${cycleLength}, Full Cycles: ${fullCycles}, Intake Days: ${intakeDays}`
            );
        } else if (medication.specificDays && medication.specificDays.length > 0) {
            const specificDaysSet = new Set(medication.specificDays.map((day) => day.toLowerCase()));
            for (let i = 0; i < totalDays; i++) {
                const currentDay = addDays(startDate, i);
                const dayName = format(currentDay, 'EEEE').toLowerCase();
                if (specificDaysSet.has(dayName)) {
                    intakeDays += 1;
                }
            }
            console.log(`Specific Days Medication: ${medication.medicineName}`);
            console.log(
                `Total Days: ${totalDays}, Specific Days: ${medication.specificDays.join(', ')}, Intake Days: ${intakeDays}`
            );
        } else {
            intakeDays = totalDays;
            console.log(`Regular Medication: ${medication.medicineName}`);
            console.log(`Total Days: ${totalDays}, Intake Days: ${intakeDays}`);
        }

        const dailyTimes = medication.dailyTimes || 1;
        const totalDoses = intakeDays * dailyTimes;
        console.log(`Total Doses for ${medication.medicineName}: ${totalDoses}`);

        return totalDoses;
    };

    const processMedications = async (fetchedMedications) => {
        try {
            const processedMedications = await Promise.all(
                fetchedMedications.map(async (med) => {
                    const intakeRecords = await fetchIntakeRecords(med.$id);
                    const notTakenStatuses = ['missed', 'not taken', 'not_taken'];

                    const taken = intakeRecords.filter(
                        (record) => normalizeStatus(record.status) === 'taken'
                    ).length;

                    const notTaken = intakeRecords.filter(
                        (record) => notTakenStatuses.includes(normalizeStatus(record.status))
                    ).length;

                    console.log(`Medication: ${med.medicineName}`);
                    console.log(`Taken: ${taken}, Not Taken: ${notTaken}`);

                    const totalDoses = computeTotalDoses(med);
                    // Removed remaining calculation

                    return {
                        ...med,
                        taken,
                        notTaken,
                        // Removed remaining and totalDoses if not needed
                        totalDoses,
                    };
                })
            );

            setMedications(processedMedications);

            let aggregatedTaken = 0;
            let aggregatedNotTaken = 0;
            // Removed aggregatedRemaining

            processedMedications.forEach((med) => {
                aggregatedTaken += med.taken;
                aggregatedNotTaken += med.notTaken;
                // Removed aggregation for remaining
            });

            console.log(
                `Aggregated Taken: ${aggregatedTaken}, Aggregated Not Taken: ${aggregatedNotTaken}`
                // Removed aggregatedRemaining from log
            );

            setTotalTaken(aggregatedTaken);
            setTotalNotTaken(aggregatedNotTaken);
            // Removed setTotalRemaining
        } catch (err) {
            console.error('Error processing medications:', err);
            throw new Error(t('failedToProcessMedications'));
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedMedications = await fetchMedications();
            await processMedications(fetchedMedications);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId, t]);

    useEffect(() => {
        if (userId) {
            loadData();
        } else {
            setError(t('userNotAuthenticated'));
            setLoading(false);
        }
    }, [userId, loadData, t]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const chartColors = {
        taken: "#3cb371",
        notTaken: "#dc143c",
        // Removed remaining color
    };

    const chartConfig = {
        backgroundGradientFrom: colors.white,
        backgroundGradientTo: colors.white,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        propsForLabels: {
            fontSize: 12,
        },
        decimalPlaces: 0,
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.midnight_green.DEFAULT} />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={loadData} accessibilityLabel={t('refreshData')} accessibilityRole="button">
                    <Ionicons name="refresh" size={24} color={colors.white} />
                    <Text style={styles.refreshButtonText}>{t('refresh')}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const aggregatedData = [
        {
            name: t('taken'),
            count: totalTaken,
            color: chartColors.taken,
            legendFontColor: colors.black,
            legendFontSize: 12,
        },
        {
            name: t('notTaken'),
            count: totalNotTaken,
            color: chartColors.notTaken,
            legendFontColor: colors.black,
            legendFontSize: 12,
        },
        // Removed remaining from aggregatedData
    ];

    const totalOverallCount = aggregatedData.reduce((acc, cur) => acc + cur.count, 0);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.midnight_green.DEFAULT]}
                        tintColor={colors.midnight_green.DEFAULT}
                        title={t('refreshingText')}
                        titleColor={colors.midnight_green.DEFAULT}
                    />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('overallMedicationProgress')}</Text>
                </View>

                <View style={styles.chartCard}>
                    <Text style={styles.sectionTitle}>{t('overallMedicationProgress')}</Text>
                    {totalOverallCount > 0 ? (
                        <>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <PieChart
                                    data={aggregatedData}
                                    width={screenWidth - 60}
                                    height={220}
                                    chartConfig={chartConfig}
                                    accessor="count"
                                    backgroundColor="transparent"
                                    paddingLeft="15"
                                    absolute
                                    hasLegend={false}
                                    center={[50, 0]}
                                />
                            </View>
                            <View style={styles.legendContainer}>
                                {aggregatedData.map((segment) => (
                                    <View key={segment.name} style={styles.legendItem}>
                                        <View
                                            style={[
                                                styles.legendIndicator,
                                                { backgroundColor: segment.color },
                                            ]}
                                        />
                                        <Text style={styles.legendText}>
                                            {segment.name}: {segment.count}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    ) : (
                        <Text style={styles.noDataText}>{t('noIntakeRecordsAvailable')}</Text>
                    )}
                </View>

                <View style={styles.medicationsCard}>
                    <Text style={styles.sectionTitle}>{t('individualMedications')}</Text>
                    {medications.length === 0 ? (
                        <Text style={styles.noMedicationsText}>{t('noMedicationsFound')}</Text>
                    ) : (
                        medications.map((medication) => {
                            const data = [
                                {
                                    name: t('taken'),
                                    count: medication.taken,
                                    color: chartColors.taken,
                                    legendFontColor: colors.black,
                                    legendFontSize: 12,
                                },
                                {
                                    name: t('notTaken'),
                                    count: medication.notTaken,
                                    color: chartColors.notTaken,
                                    legendFontColor: colors.black,
                                    legendFontSize: 12,
                                },
                            ];

                            // Removed remaining from medication data

                            const totalCount = data.reduce((acc, seg) => acc + seg.count, 0);

                            return (
                                <View key={medication.$id} style={styles.medicationContainer}>
                                    <Text style={styles.medicationName}>
                                        {medication.medicineName}
                                    </Text>
                                    {totalCount > 0 ? (
                                        <>
                                            <PieChart
                                                data={data}
                                                width={screenWidth - 80}
                                                height={180}
                                                chartConfig={chartConfig}
                                                accessor="count"
                                                backgroundColor="transparent"
                                                paddingLeft="15"
                                                absolute
                                                hasLegend={false}
                                                center={[50, 0]}
                                            />
                                            <View style={styles.legendContainer}>
                                                {data.map((segment) => (
                                                    <View key={segment.name} style={styles.legendItem}>
                                                        <View
                                                            style={[
                                                                styles.legendIndicator,
                                                                { backgroundColor: segment.color },
                                                            ]}
                                                        />
                                                        <Text style={styles.legendText}>
                                                            {segment.name}: {segment.count}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </>
                                    ) : (
                                        <Text style={styles.noDataText}>
                                            {t('noIntakesLogged')}
                                        </Text>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
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
        marginBottom: 30,
        alignItems: 'center',
    },
    headerTitle: {
        color: colors.midnight_green.DEFAULT,
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: colors.gray[600],
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    noMedicationsText: {
        color: colors.gray[200],
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
    },
    noDataText: {
        color: colors.gray[200],
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    // ... other styles remain unchanged

    refreshButtonTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.midnight_green.DEFAULT, // Updated background color
        borderRadius: 8,
    },
    refreshButtonText: {
        color: colors.white, // Updated text color
        fontSize: 16,
        marginLeft: 8,
        fontWeight: '600',
    },
    chartCard: {
        backgroundColor: colors.gray[100], // Light gray for card background
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        alignItems: 'center',
        shadowColor: colors.black, // Updated shadow color
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    sectionTitle: {
        color: colors.midnight_green.DEFAULT, // Updated section title color
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        marginVertical: 5,
    },
    legendIndicator: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 6,
    },
    legendText: {
        color: colors.gray[200], // Updated legend text color
        fontSize: 14,
    },
    medicationsCard: {
        backgroundColor: colors.gray[100], // Light gray for card background
        borderRadius: 15,
        padding: 10,
        marginBottom: 30,
        shadowColor: colors.black, // Updated shadow color
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    medicationContainer: {
        backgroundColor: colors.white, // White for individual medication cards
        borderRadius: 15,
        padding: 15,
        marginBottom: 25,
        alignItems: 'center',
        shadowColor: colors.black, // Updated shadow color
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    medicationName: {
        color: colors.midnight_green.DEFAULT, // Updated medication name color
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
    },
    medicationStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 15,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIndicator: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 6,
    },
    statText: {
        color: colors.gray[200], // Updated stat text color
        fontSize: 14,
    },

    debugContainer: {
        backgroundColor: colors.gray[100], // Light gray for debug container
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        alignItems: 'flex-start',
        shadowColor: colors.black, // Updated shadow color
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    debugText: {
        color: colors.gray[200], // Updated debug text color
        fontSize: 14,
        marginBottom: 10,
    },
});

export default PatientMedicationProgress;
