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
        const defaultTime = "08:00"; // Define default time here

        for (const med of medicationsList) {
            const start = moment(med.startDate).startOf('day');
            const end = moment(med.endDate).endOf('day');

            const frequency = med.frequency;
            let times = Array.isArray(med.times) && med.times.length > 0 ? med.times : [defaultTime];

            const specificDays = Array.isArray(med.specificDays)
                ? med.specificDays.map(d => d.toLowerCase())
                : [];

            switch (frequency) {
                case 'daily': {
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
                }

                case 'interval': {
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
                }

                case 'specificDays': {
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
                }

                case 'cyclic': {
                    const intakeDays = med.cyclicIntakeDays || 0;
                    const pauseDays = med.cyclicPauseDays || 0;
                    const cycleLength = intakeDays + pauseDays;

                    if (cycleLength === 0) {
                        console.warn(`Cyclic medication ${med.medicineName} has no valid cycle length.`);
                        break;
                    }

                    const dayTimes = times.length > 0 ? times : [defaultTime];
                    let current = start.clone();
                    let dayIndex = 0;

                    while (current.isSameOrBefore(end)) {
                        const dayInCycle = dayIndex % cycleLength;
                        if (dayInCycle < intakeDays) {
                            const dateStr = current.format('YYYY-MM-DD');
                            for (const t of dayTimes) {
                                addEvent(updatedItems, dateStr, med, t);
                                await scheduleMedicationNotification(med, dateStr, t);
                            }
                        }
                        current.add(1, 'day');
                        dayIndex++;
                    }
                    break;
                }

                case 'onDemand': {
                    // No events for onDemand
                    break;
                }

                default: {
                    console.warn(`Unknown frequency: ${frequency} for medication ${med.medicineName}`);
                    break;
                }
            }
        }

        // Sort events by time for each day
        Object.keys(updatedItems).forEach((date) => {
            updatedItems[date].sort((a, b) => {
                return moment(a.time, 'h:mm A').diff(moment(b.time, 'h:mm A'));
            });
        });

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

            // Optionally, provide user feedback
            Alert.alert('Success', `Marked as ${status === 'taken' ? 'Taken' : 'Not Taken'}`);
        } catch (error) {
            console.error('Error updating intake status:', error);
            Alert.alert('Error', 'Failed to update intake status. Please try again.');
        }
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00adf5" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Medication Calendar</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color="#00adf5" />
                </TouchableOpacity>
            </View>

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
                }}
            />

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
    header: {
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
        color: '#00adf5',
        fontSize: 16,
    },
});

export default PatientMedicationCalendar;
