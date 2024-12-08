// PatientMedicationCalender.jsx

import React, { useCallback, useEffect, useState, memo } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases, Query } from '../../lib/appwrite'; // Ensure Query is imported correctly
import { useGlobalContext } from '../../context/GlobalProvider';
import { Agenda } from 'react-native-calendars';
import moment from 'moment'; // For date manipulation
import { Ionicons } from '@expo/vector-icons'; // For refresh icon (optional)

// Memoized Item Component
const MedicationItem = memo(({ item }) => (
    <View style={styles.itemContainer}>
        <Text style={styles.medicineName}>{item?.medicineName}</Text>
        <Text style={styles.dosage}>
            Dosage: {item?.dosesPerDay} time(s)/day
        </Text>
        <Text style={styles.timeText}>Time: {item?.time}</Text>
        <Text style={styles.dateRange}>
            {item?.formattedStartDate} - {item?.formattedEndDate}
        </Text>
    </View>
), (prevProps, nextProps) => {
    // Only re-render if item props have changed
    return prevProps.item === nextProps.item;
});

const PatientMedicationCalender = () => {
    const { user } = useGlobalContext(); // Ensure user context is correctly set

    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState({});
    const [refreshing, setRefreshing] = useState(false); // Added refreshing state

    useEffect(() => {
        init();
    }, []);

    /**
     * Refetches medication data.
     */
    const refetch = async () => {
        try {
            setRefreshing(true);
            await init();

        } catch (error) {
            console.error('Error during refetch:', error);
        } finally {
            setRefreshing(false);
        }
    };

    /**
     * Callback for handling refresh action.
     */
    const onRefresh = useCallback(() => {
        refetch();
    }, []);

    /**
     * Initializes and fetches medication data from the database.
     */
    const init = async () => {
        try {
            setLoading(true);
            const dbResponse = await databases.listDocuments(
                'HealthManagementDatabaseId', // Replace with your actual Database ID
                'MedicationsCollectionId',    // Replace with your actual Collection ID
                [Query.equal('userMedication', user.$id)] // Ensure 'userId' is the correct field linking to the user
            );
            const fetchedMedications = dbResponse.documents || [];
            setMedications(fetchedMedications);
            processMedications(fetchedMedications);
            // console.log('Fetched Medications:', fetchedMedications); // Log the fetched documents
        } catch (error) {
            console.error('Error fetching patient data:', error);
            setMedications([]);
            setItems({});
        } finally {
            setLoading(false);
        }
    };

    /**
     * Processes medication data to organize it by date and time for the Agenda component.
     * Each time in the 'times' array is treated as a separate event.
     * @param {Array} medicationsList - List of medication documents.
     */
    const processMedications = (medicationsList) => {
        const items = {};

        medicationsList.forEach((med) => {
            const start = moment(med.startDate).startOf('day');
            const end = moment(med.endDate).startOf('day');
            const current = start.clone();

            while (current.isSameOrBefore(end)) {
                const dateStr = current.format('YYYY-MM-DD');

                med.times.forEach((time) => {
                    const eventTime = moment(time, 'HH:mm').format('HH:mm');
                    const eventId = `${med.$id}-${dateStr}-${eventTime}`; // Unique ID for each event

                    if (!items[dateStr]) {
                        items[dateStr] = [];
                    }

                    items[dateStr].push({
                        id: eventId,
                        medicineName: med.medicineName,
                        dosesPerDay: med.dosesPerDay,
                        time: eventTime,
                        formattedStartDate: moment(med.startDate).format('MMM DD, YYYY'),
                        formattedEndDate: moment(med.endDate).format('MMM DD, YYYY'),
                    });
                });

                current.add(1, 'days');
            }
        });

        // Optionally, sort items by time for each day
        Object.keys(items).forEach((date) => {
            items[date].sort((a, b) => {
                return moment(a.time, 'HH:mm').diff(moment(b.time, 'HH:mm'));
            });
        });

        setItems(items);
        console.log(items)
        console.log("the end")
    };

    /**
     * Memoized renderItem function.
     */
    const renderItem = useCallback((item) => {
        return <MedicationItem item={item} />;
    }, []);

    /**
     * Renders content for empty dates in the Agenda.
     */
    const renderEmptyDate = useCallback(() => {
        return (
            <View style={styles.emptyDateContainer}>
                <Text style={styles.noMedicationsText}>No Medications</Text>
            </View>
        );
    }, []);

    /**
     * Conditionally renders the loading indicator during the initial data fetch.
     */
    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00adf5" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with Title and Refresh Button */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Medication Calendar</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color="#00adf5" />
                </TouchableOpacity>
            </View>

            {/* Agenda Component to Display Medications */}
            <Agenda
                items={items}
                selected={moment().format('YYYY-MM-DD')}
                renderItem={renderItem}
                renderEmptyDate={renderEmptyDate}
                showOnlySelectedDayItems={false}
                theme={{
                    selectedDayBackgroundColor: '#FF9C01',
                    todayTextColor: '#00adf5',
                    agendaDayTextColor: '#00adf5',
                    agendaTodayColor: '#00adf5',
                    dotColor: '#00adf5',
                    selectedDayTextColor: '#ffffff',
                    // Additional theming options can be added here
                }}
                // Optionally, customize the markingType or other props
                // Add additional props to optimize performance
                // For example:
                // maxItemsPerDay={5}
                // removeClippedSubviews={true}
                // initialNumToRender={10}
                // windowSize={21}
            />

            {/* Refreshing Indicator Overlay */}
            {refreshing && (
                <View style={styles.refreshingOverlay}>
                    <ActivityIndicator size="small" color="#00adf5" />
                    <Text style={styles.refreshingText}>Refreshing...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        backgroundColor: '#ffffff',
        padding: 15,
        marginRight: 10,
        marginTop: 17,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    medicineName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333333',
    },
    dosage: {
        fontSize: 14,
        marginBottom: 5,
        color: '#555555',
    },
    timeText: {
        fontSize: 14,
        marginBottom: 5,
        color: '#555555',
    },
    dateRange: {
        fontSize: 12,
        color: '#777777',
    },
    emptyDateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    noMedicationsText: {
        fontSize: 16,
        color: '#888888',
    },
    header: { // Header containing the title and refresh button
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
    },
    refreshButton: {
        padding: 5,
    },
    refreshingOverlay: { // Overlay shown during refreshing
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -75 }, { translateY: -25 }],
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 15,
        borderRadius: 10,
        elevation: 5,
    },
    refreshingText: {
        marginLeft: 10,
        color: '#00adf5',
        fontSize: 16,
    },
});

export default PatientMedicationCalender;
