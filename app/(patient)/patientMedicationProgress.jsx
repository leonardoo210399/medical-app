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
    import { databases } from '../../lib/appwrite'; // Ensure correct path
    import { Query } from 'appwrite'; // Import Query class
    import { parseISO, differenceInCalendarDays, addDays, format } from 'date-fns';
    import Icon from 'react-native-vector-icons/Ionicons'; // For Refresh Button Icon (optional)

    const screenWidth = Dimensions.get('window').width;

    // Define your database and collection IDs
    const DATABASE_ID = 'HealthManagementDatabaseId';
    const MEDICATIONS_COLLECTION_ID = 'MedicationsCollectionId';
    const INTAKE_RECORDS_COLLECTION_ID = 'IntakeRecords';

    const PatientMedicationProgress = () => {
        const { user } = useGlobalContext();
        const userId = user?.$id; // Assuming Appwrite's user ID

        const [medications, setMedications] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [totalTaken, setTotalTaken] = useState(0);
        const [totalNotTaken, setTotalNotTaken] = useState(0);
        const [totalRemaining, setTotalRemaining] = useState(0);
        const [refreshing, setRefreshing] = useState(false); // State for RefreshControl

        // Helper function to normalize status strings
        const normalizeStatus = (status) => status.replace(/_/g, ' ').toLowerCase();

        // Fetch medications for the user
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
                throw new Error('Failed to load medications.');
            }
        };

        // Fetch intake records for a specific medication
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

        // Helper function to compute total doses
        const computeTotalDoses = (medication) => {
            if (medication.onDemand) {
                // For on-demand medications, totalDoses is based on intake records
                return null; // Returning null as totalDoses is not predefined
            }

            const startDate = parseISO(medication.startDate);
            const endDate = parseISO(medication.endDate);
            const effectiveEndDate = endDate; // Always use endDate

            const totalDays = differenceInCalendarDays(effectiveEndDate, startDate) + 1;
            let intakeDays = 0;

            // Handle cyclic intake patterns
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
            }
            // Handle specific days (e.g., only Mondays and Wednesdays)
            else if (medication.specificDays && medication.specificDays.length > 0) {
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
            }
            // Handle regular daily intake
            else {
                intakeDays = totalDays;
                console.log(`Regular Medication: ${medication.medicineName}`);
                console.log(`Total Days: ${totalDays}, Intake Days: ${intakeDays}`);
            }

            // Calculate totalDoses based on dailyTimes
            const dailyTimes = medication.dailyTimes || 1; // Default to 1 if not specified
            const totalDoses = intakeDays * dailyTimes;
            console.log(`Total Doses for ${medication.medicineName}: ${totalDoses}`);

            return totalDoses;
        };

        // Process medications to include intake statistics
        const processMedications = async (fetchedMedications) => {
            try {
                const processedMedications = await Promise.all(
                    fetchedMedications.map(async (med) => {
                        const intakeRecords = await fetchIntakeRecords(med.$id);

                        // Updated to include 'not_taken' and other possible variations
                        const notTakenStatuses = ['missed', 'not taken', 'not_taken'];

                        const taken = intakeRecords.filter(
                            (record) => normalizeStatus(record.status) === 'taken'
                        ).length;

                        const notTaken = intakeRecords.filter(
                            (record) => notTakenStatuses.includes(normalizeStatus(record.status))
                        ).length;

                        console.log(`Medication: ${med.medicineName}`);
                        console.log(`Taken: ${taken}, Not Taken: ${notTaken}`);

                        // Calculate totalDoses based on schedule
                        const totalDoses = computeTotalDoses(med);

                        // For on-demand medications, remaining might not be applicable
                        let remaining = null;
                        if (totalDoses !== null) {
                            remaining = totalDoses - (taken + notTaken);
                            remaining = remaining > 0 ? remaining : 0;
                            console.log(`Remaining for ${med.medicineName}: ${remaining}`);
                        }

                        return {
                            ...med,
                            taken,
                            notTaken,
                            remaining,
                            totalDoses,
                        };
                    })
                );

                setMedications(processedMedications);

                // Aggregate totals across all medications
                let aggregatedTaken = 0;
                let aggregatedNotTaken = 0;
                let aggregatedRemaining = 0;

                processedMedications.forEach((med) => {
                    aggregatedTaken += med.taken;
                    aggregatedNotTaken += med.notTaken;
                    if (med.remaining !== null) {
                        aggregatedRemaining += med.remaining;
                    }
                });

                console.log(
                    `Aggregated Taken: ${aggregatedTaken}, Aggregated Not Taken: ${aggregatedNotTaken}, Aggregated Remaining: ${aggregatedRemaining}`
                );

                setTotalTaken(aggregatedTaken);
                setTotalNotTaken(aggregatedNotTaken);
                setTotalRemaining(aggregatedRemaining);
            } catch (err) {
                console.error('Error processing medications:', err);
                throw new Error('Failed to process medications.');
            }
        };

        // Combined function to load data
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
        }, [userId]);

        // Initial data load
        useEffect(() => {
            if (userId) {
                loadData();
            } else {
                setError('User not authenticated.');
                setLoading(false);
            }
        }, [userId, loadData]);

        // Handler for pull-to-refresh
        const onRefresh = useCallback(() => {
            setRefreshing(true);
            loadData();
        }, [loadData]);

        // Colors for the pie chart segments
        const chartColors = {
            taken: '#4CAF50',    // Green
            notTaken: '#F44336', // Red
            remaining: '#FF9800' // Orange
        };

        // Chart configuration
        const chartConfig = {
            backgroundGradientFrom: '#1e1e1e',
            backgroundGradientTo: '#1e1e1e',
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            propsForLabels: {
                fontSize: 12,
            },
        };

        if (loading && !refreshing) { // Show loading indicator only during initial load
            return (
                <SafeAreaView style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </SafeAreaView>
            );
        }

        if (error) {
            return (
                <SafeAreaView style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
                        <Icon name="refresh" size={24} color="#ffffff" />
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            );
        }

        // Prepare aggregated data for the total pie chart
        const aggregatedData = [
            {
                name: 'Taken',
                count: totalTaken,
                color: chartColors.taken,
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            },
            {
                name: 'Not Taken',
                count: totalNotTaken,
                color: chartColors.notTaken,
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            },
            {
                name: 'Remaining',
                count: totalRemaining,
                color: chartColors.remaining,
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            },
        ];

        // Compute the total across all aggregated data
        const totalOverallCount = aggregatedData.reduce((acc, cur) => acc + cur.count, 0);

        return (
            <SafeAreaView style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ffffff']} />
                    }
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Medication Progress</Text>
                        {/* Refresh Button */}
                        {/*<TouchableOpacity style={styles.refreshButtonTop} onPress={loadData}>*/}
                        {/*    <Icon name="refresh" size={24} color="#ffffff" />*/}
                        {/*    <Text style={styles.refreshButtonText}>Refresh</Text>*/}
                        {/*</TouchableOpacity>*/}
                    </View>

                    {/* Aggregated Pie Chart */}
                    <View style={styles.aggregatedChartContainer}>
                        <Text style={styles.sectionTitle}>Overall Medication Progress</Text>
                        {totalOverallCount > 0 ? (
                            <>
                                <PieChart
                                    data={aggregatedData}
                                    width={screenWidth - 40}
                                    height={220}
                                    chartConfig={chartConfig}
                                    accessor="count"
                                    backgroundColor="transparent"
                                    paddingLeft="15"
                                    absolute
                                    hasLegend={false}
                                />
                                <View style={styles.aggregatedStats}>
                                    {aggregatedData.map((segment) => (
                                        <View key={segment.name} style={styles.statItem}>
                                            <View
                                                style={[
                                                    styles.statIndicator,
                                                    { backgroundColor: segment.color },
                                                ]}
                                            />
                                            <Text style={styles.statText}>
                                                {segment.name}: {segment.count}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        ) : (
                            <Text style={styles.noDataText}>No intake records available.</Text>
                        )}
                    </View>

                    {/* Display Aggregated Counts for Debugging */}
                    <View style={styles.debugContainer}>
                        <Text style={styles.debugText}>Aggregated Taken: {totalTaken}</Text>
                        <Text style={styles.debugText}>Aggregated Not Taken: {totalNotTaken}</Text>
                        <Text style={styles.debugText}>Aggregated Remaining: {totalRemaining}</Text>
                    </View>

                    {/* Medication List */}
                    <View style={styles.medicationsListContainer}>
                        <Text style={styles.sectionTitle}>Individual Medications</Text>
                        {medications.length === 0 ? (
                            <Text style={styles.noMedicationsText}>No medications found.</Text>
                        ) : (
                            medications.map((medication) => {
                                // Prepare data for individual medication pie chart
                                const data = [
                                    {
                                        name: 'Taken',
                                        count: medication.taken,
                                        color: chartColors.taken,
                                        legendFontColor: '#7F7F7F',
                                        legendFontSize: 12,
                                    },
                                    {
                                        name: 'Not Taken',
                                        count: medication.notTaken,
                                        color: chartColors.notTaken,
                                        legendFontColor: '#7F7F7F',
                                        legendFontSize: 12,
                                    },
                                ];

                                if (medication.remaining !== null) {
                                    data.push({
                                        name: 'Remaining',
                                        count: medication.remaining,
                                        color: chartColors.remaining,
                                        legendFontColor: '#7F7F7F',
                                        legendFontSize: 12,
                                    });
                                }

                                // Calculate total for this medication
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
                                                    width={screenWidth - 40}
                                                    height={220}
                                                    chartConfig={chartConfig}
                                                    accessor="count"
                                                    backgroundColor="transparent"
                                                    paddingLeft="15"
                                                    absolute
                                                    hasLegend={false}
                                                />
                                                <View style={styles.medicationStats}>
                                                    {data.map((segment) => (
                                                        <View key={segment.name} style={styles.statItem}>
                                                            <View
                                                                style={[
                                                                    styles.statIndicator,
                                                                    { backgroundColor: segment.color },
                                                                ]}
                                                            />
                                                            <Text style={styles.statText}>
                                                                {segment.name}: {segment.count}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </>
                                        ) : (
                                            <Text style={styles.noDataText}>
                                                No intakes logged for this medication.
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
            backgroundColor: '#121212',
        },
        scrollContainer: {
            padding: 20,
            paddingBottom: 40,
        },
        header: {
            marginBottom: 20,
            alignItems: 'center',
        },
        headerTitle: {
            color: '#ffffff',
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
        },
        refreshButtonTop: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
        },
        refreshButton: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 20,
            padding: 10,
            backgroundColor: '#333333',
            borderRadius: 5,
        },
        refreshButtonText: {
            color: '#ffffff',
            fontSize: 16,
            marginLeft: 5,
        },
        aggregatedChartContainer: {
            backgroundColor: '#1e1e1e',
            borderRadius: 10,
            padding: 15,
            marginBottom: 25,
            alignItems: 'center',
        },
        sectionTitle: {
            color: '#ffffff',
            fontSize: 20,
            fontWeight: '600',
            marginBottom: 10,
            textAlign: 'center',
        },
        aggregatedStats: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: '100%',
            marginTop: 10,
        },
        medicationsListContainer: {
            // Additional styling if needed
        },
        medicationContainer: {
            backgroundColor: '#1e1e1e',
            borderRadius: 10,
            padding: 15,
            marginBottom: 25,
            alignItems: 'center',
        },
        medicationName: {
            color: '#ffffff',
            fontSize: 20,
            fontWeight: '600',
            marginBottom: 10,
        },
        medicationStats: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: '100%',
            marginTop: 10,
        },
        statItem: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        statIndicator: {
            width: 12,
            height: 12,
            borderRadius: 6,
            marginRight: 5,
        },
        statText: {
            color: '#d1d1d1',
            fontSize: 14,
        },
        loadingContainer: {
            flex: 1,
            backgroundColor: '#121212',
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorContainer: {
            flex: 1,
            backgroundColor: '#121212',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        errorText: {
            color: '#F44336',
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 20,
        },
        noMedicationsText: {
            color: '#d1d1d1',
            fontSize: 16,
            textAlign: 'center',
            marginTop: 50,
        },
        noDataText: {
            color: '#d1d1d1',
            fontSize: 16,
            textAlign: 'center',
            marginTop: 20,
        },
        debugContainer: {
            backgroundColor: '#1e1e1e',
            borderRadius: 10,
            padding: 15,
            marginBottom: 25,
            alignItems: 'flex-start',
        },
        debugText: {
            color: '#ffffff',
            fontSize: 14,
        },
    });

    export default PatientMedicationProgress;
