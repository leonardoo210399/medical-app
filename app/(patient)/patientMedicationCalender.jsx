// PatientMedicationCalendar.js

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases, Query } from '../../lib/appwrite'; // Adjust the import path as needed
import { useGlobalContext } from '../../context/GlobalProvider'; // Adjust the import path as needed
import { Agenda } from 'react-native-calendars';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import MedicationItem from '../../components/MedicationItem';
import * as Notifications from 'expo-notifications';
import Toast from "react-native-toast-message";
import colors from '../../constants/colors'; // Import centralized colors

// Define action identifiers and category
const TAKEN_ACTION = 'taken';
const NOT_TAKEN_ACTION = 'not_taken';
const CATEGORY_ID = 'medicationReminder';

const PatientMedicationCalendar = () => {
    const { user } = useGlobalContext();

    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [intakeRecords, setIntakeRecords] = useState({});

    useEffect(() => {
        registerForPushNotificationsAsync()
            .then(registerNotificationCategory) // Register categories after permissions
            .then(init);

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            const { notification, actionIdentifier } = response;
            const { data } = notification.request.content;

            const medicationId = data.medicationId;
            const date = data.date;
            const time = data.time;

            if (actionIdentifier === TAKEN_ACTION) {
                // Update intake status to 'taken'
                updateIntakeRecord(medicationId, date, time, 'taken');
            } else if (actionIdentifier === NOT_TAKEN_ACTION) {
                // Update intake status to 'not_taken'
                updateIntakeRecord(medicationId, date, time, 'not_taken');
            } else {
                // Handle default notification tap if needed
                console.log('Default notification tap');
            }
        });

        return () => {
            Notifications.removeNotificationSubscription(responseListener);
        };
    }, []);

    /**
     * Registers the device for push notifications.
     */
    const registerForPushNotificationsAsync = async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert('Permission Required', 'Failed to get push token for notifications!');
            return;
        }
    };

    /**
     * Registers notification categories and actions.
     */
    const registerNotificationCategory = async () => {
        await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
            {
                identifier: TAKEN_ACTION,
                buttonTitle: 'Taken',
                options: {
                    foreground: false, // Prevents the app from opening
                },
            },
            {
                identifier: NOT_TAKEN_ACTION,
                buttonTitle: 'Not Taken',
                options: {
                    foreground: false, // Prevents the app from opening
                },
            },
        ]);
    };

    /**
     * Initializes the component by fetching medications and intake records.
     */
    const init = async () => {
        try {
            setLoading(true);
            // Cancel all existing notifications to prevent duplicates
            await Notifications.cancelAllScheduledNotificationsAsync();

            // Fetch medications from the database
            const medResponse = await databases.listDocuments(
                'HealthManagementDatabaseId',                 // Replace with your actual Database ID
                'MedicationsCollectionId',                    // Replace with your Medications Collection ID
                [Query.equal('userMedication', user.$id)]
            );
            const fetchedMedications = medResponse.documents || [];
            setMedications(fetchedMedications);

            // Fetch intake records
            const intakeResponse = await databases.listDocuments(
                'HealthManagementDatabaseId',                 // Replace with your actual Database ID
                'IntakeRecords',                              // Replace with your Intake Records Collection ID
                [
                    Query.equal('users', user.$id),
                    // Optional: Add date range queries if needed
                ]
            );
            const fetchedIntakeRecords = intakeResponse.documents || [];
            const intakeMap = {};
            fetchedIntakeRecords.forEach(record => {
                const key = `${record.medications}_${record.date}_${record.time}`;
                intakeMap[key] = record.status;
            });
            setIntakeRecords(intakeMap);

            // Process medications to prepare agenda items and schedule notifications
            await processMedications(fetchedMedications);
        } catch (error) {
            console.error('Error fetching patient data:', error);
            Alert.alert('Error', 'Failed to fetch medication data.');
            setMedications([]);
            setItems({});
        } finally {
            setLoading(false);
        }
    };

    /**
     * Refetches medication data with loading and error handling.
     */
    const refetch = async () => {
        try {
            setRefreshing(true);
            await init();
        } catch (error) {
            console.error('Error during refetch:', error);
            Alert.alert('Error', 'Failed to refresh data.');
        } finally {
            setRefreshing(false);
        }
    };

    /**
     * Handles the refresh button press.
     */
    const onRefresh = useCallback(() => {
        refetch();
    }, [medications]);

    /**
     * Adds an event to the agenda items.
     */
    const addEvent = (itemsObj, dateStr, med, time) => {
        if (!itemsObj[dateStr]) {
            itemsObj[dateStr] = [];
        }
        itemsObj[dateStr].push({
            id: `${med.$id}`,
            medicineName: med.medicineName,
            dosage: med.dosage,
            time: time,
            date: dateStr,
            userId: user.$id, // Ensure userId is included for IntakeRecords
            formattedStartDate: moment(med.startDate).format('MMM DD, YYYY'),
            formattedEndDate: moment(med.endDate).format('MMM DD, YYYY'),
            description: med.description || '', // **Added Description**
        });
    };

    /**
     * Determines if a day is an interval day based on the interval value.
     */
    const isIntervalDay = (dayIndex, intervalValue) => {
        return (dayIndex % intervalValue) === 0;
    };

    /**
     * Schedules a notification for a medication at a specific date and time.
     */
    const scheduleMedicationNotification = async (med, date, time) => {
        console.log(`Scheduling notification for: ${med.medicineName} on ${date} at ${time}`);

        const timeFormats = ["h:mm A", "H:mm"]; // Supports both 12-hour and 24-hour formats
        const timeMoment = moment(time, timeFormats, true); // 'true' for strict parsing

        if (!timeMoment.isValid()) {
            console.error(`Invalid time format for medication ${med.medicineName}: ${time}`);
            return null;
        }

        const hour = timeMoment.hour();
        const minute = timeMoment.minute();

        // Create the notification date by combining the date and time
        let notificationDate = moment(date)
            .set({ hour, minute, second: 0, millisecond: 0 })
            .local(); // Ensure local time

        console.log(`Initial Notification Date: ${notificationDate.format('YYYY-MM-DD HH:mm:ss')}`);

        // Adjust if notification time is in the past
        if (notificationDate.isSameOrBefore(moment())) {
            notificationDate.add(1, 'day');
            console.log(`Adjusted Notification Date (next day): ${notificationDate.format('YYYY-MM-DD HH:mm:ss')}`);
        }

        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Medication Reminder',
                    body: `It's time to take your medicine: ${med.medicineName} (${med.dosage})`,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    categoryIdentifier: CATEGORY_ID, // Assign the category
                    data: {
                        medicationId: med.$id,
                        date: date,
                        time: time,
                        description: med.description || '', // **Include Description in Notification Data (Optional)**
                    },
                },
                trigger: {
                    date: notificationDate.toDate(),
                },
            });
            console.log(`Scheduled notification ID: ${notificationId} at ${notificationDate.format('YYYY-MM-DD HH:mm:ss')}`);
            return notificationId;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return null;
        }
    };

    /**
     * Processes the medication list and schedules notifications accordingly.
     */
    const processMedications = async (medicationsList) => {
        const updatedItems = {};
        const defaultTime = "00:00"; // Define default time here

        // Variables to determine the overall date range
        let minDate = null;
        let maxDate = null;

        for (const med of medicationsList) {
            const start = moment(med.startDate).startOf('day');
            const end = moment(med.endDate).endOf('day');

            // Update minDate and maxDate
            if (!minDate || start.isBefore(minDate)) minDate = start.clone();
            if (!maxDate || end.isAfter(maxDate)) maxDate = end.clone();

            const frequency = med.frequency;
            let times = Array.isArray(med.times) && med.times.length > 0 ? med.times : [defaultTime];

            const specificDays = Array.isArray(med.specificDays)
                ? med.specificDays.map(d => d.toLowerCase())
                : [];

            switch (frequency) {
                case 'daily':
                    for (const t of times) {
                        const current = start.clone();
                        while (current.isSameOrBefore(end)) {
                            const dateStr = current.format('YYYY-MM-DD');
                            addEvent(updatedItems, dateStr, med, t);
                            await scheduleMedicationNotification(med, dateStr, t);
                            current.add(1, 'day');
                        }
                    }
                    break;

                case 'interval':
                    const intervalType = med.intervalType;
                    const intervalValue = med.intervalValue || 1;

                    if (intervalType === 'hours') {
                        const initialTime = times[0] || defaultTime;
                        let startDateTime = moment(med.startDate);
                        const [hour, minute] = initialTime.split(':').map(Number);
                        startDateTime.set({ hour, minute, second: 0, millisecond: 0 });

                        let current = startDateTime.clone();
                        while (current.isSameOrBefore(end)) {
                            const dateStr = current.format('YYYY-MM-DD');
                            const timeStr = current.format('h:mm A');
                            addEvent(updatedItems, dateStr, med, timeStr);
                            await scheduleMedicationNotification(med, dateStr, timeStr);
                            current.add(intervalValue, 'hours');
                            if (current.isAfter(end)) break;
                        }
                    } else if (intervalType === 'days') {
                        let dayIndex = 0;
                        let current = start.clone();
                        const dayTimes = times.length > 0 ? times : [defaultTime];

                        while (current.isSameOrBefore(end)) {
                            if (isIntervalDay(dayIndex, intervalValue)) {
                                const dateStr = current.format('YYYY-MM-DD');
                                for (const t of dayTimes) {
                                    addEvent(updatedItems, dateStr, med, t);
                                    await scheduleMedicationNotification(med, dateStr, t);
                                }
                            }
                            current.add(1, 'day');
                            dayIndex++;
                        }
                    }
                    break;

                case 'specificDays':
                    const dayTimes = times.length > 0 ? times : [defaultTime];
                    const current = start.clone();
                    while (current.isSameOrBefore(end)) {
                        const weekday = current.format('dddd').toLowerCase();
                        if (specificDays.includes(weekday)) {
                            const dateStr = current.format('YYYY-MM-DD');
                            for (const t of dayTimes) {
                                addEvent(updatedItems, dateStr, med, t);
                                await scheduleMedicationNotification(med, dateStr, t);
                            }
                        }
                        current.add(1, 'day');
                    }
                    break;

                case 'cyclic':
                    const intakeDays = med.cyclicIntakeDays || 0;
                    const pauseDays = med.cyclicPauseDays || 0;
                    const cycleLength = intakeDays + pauseDays;

                    if (cycleLength === 0) {
                        console.warn(`Cyclic medication ${med.medicineName} has no valid cycle length.`);
                        break;
                    }

                    const cyclicDayTimes = times.length > 0 ? times : [defaultTime];
                    let cyclicCurrent = start.clone();
                    let dayIndex = 0;

                    while (cyclicCurrent.isSameOrBefore(end)) {
                        const dayInCycle = dayIndex % cycleLength;
                        if (dayInCycle < intakeDays) {
                            const dateStr = cyclicCurrent.format('YYYY-MM-DD');
                            for (const t of cyclicDayTimes) {
                                addEvent(updatedItems, dateStr, med, t);
                                await scheduleMedicationNotification(med, dateStr, t);
                            }
                        }
                        cyclicCurrent.add(1, 'day');
                        dayIndex++;
                    }
                    break;

                case 'onDemand':
                    // No events for onDemand
                    break;

                default:
                    console.warn(`Unknown frequency: ${frequency} for medication ${med.medicineName}`);
                    break;
            }
        }

        // Ensure minDate and maxDate are set
        if (!minDate) minDate = moment().startOf('day');
        if (!maxDate) maxDate = moment().add(1, 'month').endOf('day');

        // Populate all dates within the range with empty arrays if they don't have medications
        let currentDate = minDate.clone();
        while (currentDate.isSameOrBefore(maxDate)) {
            const dateStr = currentDate.format('YYYY-MM-DD');
            if (!updatedItems[dateStr]) {
                updatedItems[dateStr] = [];
            }
            currentDate.add(1, 'day');
        }

        // Sort events by time for each day
        Object.keys(updatedItems).forEach((date) => {
            updatedItems[date].sort((a, b) => {
                return moment(a.time, 'h:mm A').diff(moment(b.time, 'h:mm A'));
            });
        });

        setItems(updatedItems);
    };
    const loadItems = (month) => {
        const updatedItems = { ...items };
        const start = moment(month.dateString).startOf('month').subtract(15, 'days'); // Adjust as needed
        const end = moment(month.dateString).endOf('month').add(15, 'days'); // Adjust as needed

        let current = start.clone();
        while (current.isSameOrBefore(end)) {
            const dateStr = current.format('YYYY-MM-DD');
            if (!updatedItems[dateStr]) {
                updatedItems[dateStr] = []; // Initialize with empty array
                // Optionally, add logic to fetch and add medications for this date
            }
            current.add(1, 'day');
        }

        setItems(updatedItems);
    };

    /**
     * Renders each medication item in the agenda.
     */
    const renderItem = useCallback((item) => {
        const key = `${item.id}_${item.date}_${item.time}`;
        const intakeStatus = intakeRecords[key] || 'pending';

        return (
            <MedicationItem
                key={key}
                item={{
                    ...item,
                    intakeStatus,
                    userId: user.$id,
                    description: item.description, // **Pass Description to MedicationItem**
                }}
                onStatusUpdate={updateIntakeRecord}
            />
        );
    }, [intakeRecords]);

    /**
     * Renders the view when there are no medications on a selected date.
     */
    const renderEmptyDate = useCallback(() => {
        return (
            <View style={styles.emptyDateContainer}>
                <Text style={styles.noMedicationsText}>No Medications</Text>
            </View>
        );
    }, []);

    /**
     * Updates the intakeRecords state when a medication status is updated.
     */
    const updateIntakeRecord = async (medicationId, date, time, status) => {
        try {
            // Format the date and time to match the documentId format
            const formattedDate = moment(date).format('YYYYMMDD');
            const formattedTime = moment(time, ['h:mm A', 'H:mm']).format('HHmm');

            const documentId = `${medicationId}-${formattedDate}-${formattedTime}`;

            // Check if document exists
            let documentExists = false;
            try {
                await databases.getDocument(
                    'HealthManagementDatabaseId', // Replace with your actual Database ID
                    'IntakeRecords',             // Replace with your Intake Records Collection ID
                    documentId
                );
                documentExists = true;
            } catch (error) {
                if (error.code === 404) {
                    documentExists = false;
                } else {
                    throw error;
                }
            }

            if (documentExists) {
                await databases.updateDocument(
                    'HealthManagementDatabaseId',
                    'IntakeRecords',
                    documentId,
                    { status }
                );
            } else {
                await databases.createDocument(
                    'HealthManagementDatabaseId',
                    'IntakeRecords',
                    documentId,
                    {
                        medications: medicationId,
                        users: user.$id,
                        date: formattedDate,
                        time: formattedTime,
                        status,
                    }
                );
            }

            // Update local state
            const key = `${medicationId}_${date}_${time}`;
            setIntakeRecords(prev => ({
                ...prev,
                [key]: status,
            }));

            // Provide user feedback using Toast
            if (status === 'taken') {
                Toast.show({
                    type: 'success',
                    text1: 'Great Job!',
                    text2: 'You have taken your medication.',
                    position: 'top', // Changed from 'bottom' to 'top'
                    visibilityTime: 3000,
                    autoHide: true,
                });
            } else {
                Toast.show({
                    type: 'info',
                    text1: 'Reminder',
                    text2: 'You have not taken your medication.',
                    position: 'top', // Changed from 'bottom' to 'top'
                    visibilityTime: 3000,
                    autoHide: true,
                });
            }
        } catch (error) {
            console.error('Error updating intake status:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update intake status. Please try again.',
                position: 'top', // Changed from 'bottom' to 'top'
                visibilityTime: 3000,
                autoHide: true,
            });
        }
    };


    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                {/*<ActivityIndicator size="large" color="#00adf5" />*/}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Medication Calendar</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton} accessibilityLabel="Refresh">
                    <Ionicons name="refresh" size={24} color={colors.picton_blue.DEFAULT} />
                </TouchableOpacity>
            </View>

            <Agenda
                items={items}
                loadItemsForMonth={loadItems}
                selected={moment().format('YYYY-MM-DD')}
                renderItem={renderItem}
                renderEmptyDate={renderEmptyDate}
                showOnlySelectedDayItems={false}
                showClosingKnob={true}
                theme={{
                    selectedDayBackgroundColor: colors.midnight_green.DEFAULT, // '#FF9C01'
                    todayTextColor: colors.picton_blue.DEFAULT,            // '#57B2E5'
                    agendaDayTextColor: colors.picton_blue.DEFAULT,        // '#57B2E5'
                    agendaTodayColor: colors.picton_blue.DEFAULT,          // '#57B2E5'
                    dotColor: colors.picton_blue.DEFAULT,                  // '#57B2E5'
                    selectedDayTextColor: colors.white,                    // '#FFFFFF'
                    agendaKnobColor: colors.ruddy_blue[100],
                }}
            />

            {refreshing && (
                <View style={styles.refreshingOverlay}>
                    <ActivityIndicator size="small" color={colors.picton_blue.DEFAULT} />
                    <Text style={styles.refreshingText}>Refreshing...</Text>
                </View>
            )}

            {/* Ensure Toast is rendered within this component if not at the root */}
            <Toast
                position="top"
                topOffset={50} // Adjust this value as needed for desired top padding
            />
        </SafeAreaView>)
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white, // Maintained white background
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.white, // Maintained white background
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyDateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    noMedicationsText: {
        fontSize: 16,
        color: colors.gray[200], // Updated text color
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: colors.white, // Light gray background
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[300], // Medium gray border
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.gray[200], // Dark Gray text
    },
    refreshButton: {
        padding: 5,
    },
    refreshingOverlay: {
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
        color: colors.picton_blue.DEFAULT, // '#57B2E5'
        fontSize: 16,
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
    errorContainer: {
        flex: 1,
        backgroundColor: colors.white, // Maintained white background
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: colors.gray[600], // Updated error text color
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    noDataText: {
        color: colors.gray[200], // Updated text color
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
});

export default PatientMedicationCalendar;
