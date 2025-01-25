import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases, Query } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import { Agenda } from 'react-native-calendars';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import MedicationItem from '../../components/MedicationItem';
import * as Notifications from 'expo-notifications';
import Toast from "react-native-toast-message";
import colors from '../../constants/colors';
import { useTranslation } from 'react-i18next';

const TAKEN_ACTION = 'taken';
const NOT_TAKEN_ACTION = 'not_taken';
const CATEGORY_ID = 'medicationReminder';

const PatientMedicationCalendar = () => {
    const { user } = useGlobalContext();
    const { t, i18n } = useTranslation();

    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [intakeRecords, setIntakeRecords] = useState({});
    const [, setLangChanged] = useState(0);

    useEffect(() => {
        const handleLanguageChange = () => {
            setLangChanged(prev => prev + 1);
        };

        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [i18n]);

    useEffect(() => {
        registerForPushNotificationsAsync()
            .then(registerNotificationCategory)
            .then(init);

        const setupNotificationChannel = async () => {
            if (Platform.OS === 'android') {
                try {
                    const channel = await Notifications.setNotificationChannelAsync('medicationReminderChannel', {
                        name: 'Medication Reminders',
                        importance: Notifications.AndroidImportance.HIGH,
                        sound: 'mysoundfile.mp3',
                        vibrationPattern: [0, 250, 250, 250],
                        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    });
                    console.log('Notification Channel:', channel);
                } catch (error) {
                    console.error('Error setting notification channel:', error);
                }
            }
        };
        setupNotificationChannel();

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            const { notification, actionIdentifier } = response;
            const { data } = notification.request.content;
            const medicationId = data.medicationId;
            const date = data.date;
            const time = data.time;

            if (actionIdentifier === TAKEN_ACTION) {
                updateIntakeRecord(medicationId, date, time, 'taken');
            } else if (actionIdentifier === NOT_TAKEN_ACTION) {
                updateIntakeRecord(medicationId, date, time, 'not_taken');
            } else {
                console.log('Default notification tap');
            }
        });

        return () => {
            Notifications.removeNotificationSubscription(responseListener);
        };
    }, []);

    const registerForPushNotificationsAsync = async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert(t('permissionRequired'), t('failedToGetPushToken'));
            return;
        }
    };

    const registerNotificationCategory = async () => {
        await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
            {
                identifier: TAKEN_ACTION,
                buttonTitle: t('taken'),
                options: { foreground: false },
            },
            {
                identifier: NOT_TAKEN_ACTION,
                buttonTitle: t('notTaken'),
                options: { foreground: false },
            },
        ]);
    };

    const init = async () => {
        try {
            setLoading(true);
            await Notifications.cancelAllScheduledNotificationsAsync();

            const medResponse = await databases.listDocuments(
                'HealthManagementDatabaseId',
                'MedicationsCollectionId',
                [Query.equal('userMedication', user.$id)]
            );
            const fetchedMedications = medResponse.documents || [];
            setMedications(fetchedMedications);

            const intakeResponse = await databases.listDocuments(
                'HealthManagementDatabaseId',
                'IntakeRecords',
                [Query.equal('users', user.$id)]
            );
            const fetchedIntakeRecords = intakeResponse.documents || [];
            const intakeMap = {};
            fetchedIntakeRecords.forEach(record => {
                const key = `${record.medications}_${record.date}_${record.time}`;
                intakeMap[key] = record.status;
            });
            setIntakeRecords(intakeMap);

            await processMedications(fetchedMedications);
        } catch (error) {
            console.error('Error fetching patient data:', error);
            Alert.alert(t('error'), t('errorFetchingMedicationData'));
            setMedications([]);
            setItems({});
        } finally {
            setLoading(false);
        }
    };

    const refetch = async () => {
        try {
            setRefreshing(true);
            await init();
        } catch (error) {
            console.error('Error during refetch:', error);
            Alert.alert(t('error'), t('errorRefreshingData'));
        } finally {
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        refetch();
    }, [medications]);

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
            userId: user.$id,
            formattedStartDate: moment(med.startDate).format('MMM DD, YYYY'),
            formattedEndDate: moment(med.endDate).format('MMM DD, YYYY'),
            description: med.description || '',
        });
    };

    const isIntervalDay = (dayIndex, intervalValue) => {
        return (dayIndex % intervalValue) === 0;
    };

    const scheduleMedicationNotification = async (med, date, time) => {
        console.log(`Scheduling notification for: ${med.medicineName} on ${date} at ${time}`);

        const timeFormats = ["h:mm A", "H:mm"];
        const timeMoment = moment(time, timeFormats, true);

        if (!timeMoment.isValid()) {
            console.error(`Invalid time format for medication ${med.medicineName}: ${time}`);
            return null;
        }

        const hour = timeMoment.hour();
        const minute = timeMoment.minute();

        let notificationDate = moment(date)
            .set({ hour, minute, second: 0, millisecond: 0 })
            .local();

        console.log(`Initial Notification Date: ${notificationDate.format('YYYY-MM-DD HH:mm:ss')}`);

        if (notificationDate.isSameOrBefore(moment())) {
            notificationDate.add(1, 'day');
            console.log(`Adjusted Notification Date (next day): ${notificationDate.format('YYYY-MM-DD HH:mm:ss')}`);
        }

        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: t('medicationReminderTitle', { medicine: med.medicineName, dosage: med.dosage }) || 'Medication Reminder',
                    body: t('medicationReminderBody', { medicine: med.medicineName, dosage: med.dosage }) || `It's time to take your medicine: ${med.medicineName} (${med.dosage})`,
                    sound: 'mysoundfile.mp3',  // Custom sound
                    vibrate: [0, 250, 250, 250], // Include vibrate property to trigger the sound
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    categoryIdentifier: CATEGORY_ID,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    data: {
                        medicationId: med.$id,
                        date: date,
                        time: time,
                        description: med.description || '',
                    },
                },
                trigger: {
                    date: notificationDate.toDate(),
                    channelId: 'medicationReminderChannel',  // Use custom channel for Android
                },
            });
            console.log(`Scheduled notification ID: ${notificationId} at ${notificationDate.format('YYYY-MM-DD HH:mm:ss')}`);
            return notificationId;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return null;
        }
    };

    const processMedications = async (medicationsList) => {
        const updatedItems = {};
        const defaultTime = "00:00";

        let minDate = null;
        let maxDate = null;

        for (const med of medicationsList) {
            const start = moment(med.startDate).startOf('day');
            const end = moment(med.endDate).endOf('day');

            if (!minDate || start.isBefore(minDate)) minDate = start.clone().subtract(12, 'months');
            if (!maxDate || end.isAfter(maxDate)) maxDate = end.clone().add(12, 'months');

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
                    let currentDay = start.clone();
                    while (currentDay.isSameOrBefore(end)) {
                        const weekday = currentDay.format('dddd').toLowerCase();
                        if (specificDays.includes(weekday)) {
                            const dateStr = currentDay.format('YYYY-MM-DD');
                            for (const t of dayTimes) {
                                addEvent(updatedItems, dateStr, med, t);
                                await scheduleMedicationNotification(med, dateStr, t);
                            }
                        }
                        currentDay.add(1, 'day');
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
                    break;

                default:
                    console.warn(`Unknown frequency: ${frequency} for medication ${med.medicineName}`);
                    break;
            }
        }

        if (!minDate) minDate = moment().startOf('day');
        if (!maxDate) maxDate = moment().add(1, 'month').endOf('day');

        let currentDate = minDate.clone();
        while (currentDate.isSameOrBefore(maxDate)) {
            const dateStr = currentDate.format('YYYY-MM-DD');
            if (!updatedItems[dateStr]) {
                updatedItems[dateStr] = [];
            }
            currentDate.add(1, 'day');
        }

        Object.keys(updatedItems).forEach((date) => {
            updatedItems[date].sort((a, b) => {
                return moment(a.time, 'h:mm A').diff(moment(b.time, 'h:mm A'));
            });
        });

        setItems(updatedItems);
    };

    const loadItems = (month) => {
        const updatedItems = { ...items };
        const start = moment(month.dateString).startOf('month').subtract(15, 'days');
        const end = moment(month.dateString).endOf('month').add(15, 'days');

        let current = start.clone();
        while (current.isSameOrBefore(end)) {
            const dateStr = current.format('YYYY-MM-DD');
            if (!updatedItems[dateStr]) {
                updatedItems[dateStr] = [];
            }
            current.add(1, 'day');
        }

        setItems(updatedItems);
    };

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
                    description: item.description,
                }}
                onStatusUpdate={updateIntakeRecord}
            />
        );
    }, [intakeRecords]);

    const renderEmptyDate = useCallback(() => {
        return (
            <View style={styles.emptyDateContainer}>
                <Text style={styles.noMedicationsText}>{t('noMedications')}</Text>
            </View>
        );
    }, [t]);

    const updateIntakeRecord = async (medicationId, date, time, status) => {
        try {
            const formattedDate = moment(date).format('YYYYMMDD');
            const formattedTime = moment(time, ['h:mm A', 'H:mm']).format('HHmm');
            const documentId = `${medicationId}-${formattedDate}-${formattedTime}`;

            let documentExists = false;
            try {
                await databases.getDocument(
                    'HealthManagementDatabaseId',
                    'IntakeRecords',
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

            const key = `${medicationId}_${date}_${time}`;
            setIntakeRecords(prev => ({
                ...prev,
                [key]: status,
            }));

            if (status === 'taken') {
                Toast.show({
                    type: 'success',
                    text1: t('greatJob'),
                    text2: t('takenMedication'),
                    position: 'top',
                    visibilityTime: 3000,
                    autoHide: true,
                });
            } else {
                Toast.show({
                    type: 'info',
                    text1: t('reminder'),
                    text2: t('notTakenMedication'),
                    position: 'top',
                    visibilityTime: 3000,
                    autoHide: true,
                });
            }
        } catch (error) {
            console.error('Error updating intake status:', error);
            Toast.show({
                type: 'error',
                text1: t('error'),
                text2: t('failedToUpdateIntake'),
                position: 'top',
                visibilityTime: 3000,
                autoHide: true,
            });
        }
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.midnight_green.DEFAULT} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('medicationCalendarTitle')}</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton} accessibilityLabel={t('refresh')}>
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
                    selectedDayBackgroundColor: colors.midnight_green.DEFAULT,
                    todayTextColor: colors.picton_blue.DEFAULT,
                    agendaDayTextColor: colors.picton_blue.DEFAULT,
                    agendaTodayColor: colors.picton_blue.DEFAULT,
                    dotColor: colors.picton_blue.DEFAULT,
                    selectedDayTextColor: colors.white,
                    agendaKnobColor: colors.ruddy_blue[100],
                }}
            />

            {refreshing && (
                <View style={styles.refreshingOverlay}>
                    <ActivityIndicator size="small" color={colors.picton_blue.DEFAULT} />
                    <Text style={styles.refreshingText}>{t('refreshingText')}</Text>
                </View>
            )}

            <Toast position="top" topOffset={50} />
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
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.white,
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
        color: colors.gray[200],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[300],
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.gray[200],
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
        color: colors.picton_blue.DEFAULT,
        fontSize: 16,
    },
    chartCard: {
        backgroundColor: colors.gray[100],
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    sectionTitle: {
        color: colors.midnight_green.DEFAULT,
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
        color: colors.gray[200],
        fontSize: 14,
    },
    medicationsCard: {
        backgroundColor: colors.gray[100],
        borderRadius: 15,
        padding: 10,
        marginBottom: 30,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    medicationContainer: {
        backgroundColor: colors.white,
        borderRadius: 15,
        padding: 15,
        marginBottom: 25,
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    medicationName: {
        color: colors.midnight_green.DEFAULT,
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
        color: colors.gray[200],
        fontSize: 14,
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
    noDataText: {
        color: colors.gray[200],
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
});

export default PatientMedicationCalendar;
