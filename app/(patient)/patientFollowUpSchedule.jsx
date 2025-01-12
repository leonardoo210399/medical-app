// PatientFollowUpSchedule.js

import React, {useCallback, useEffect, useState} from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
    RefreshControl, Modal, FlatList
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Agenda, LocaleConfig} from 'react-native-calendars';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import {useTranslation} from 'react-i18next';
import * as Notifications from 'expo-notifications';

import {getFollowUpsByPatient, updateScheduleStatus} from '../../lib/appwrite';
import {useGlobalContext} from '../../context/GlobalProvider';
import colors from '../../constants/colors';
import {Picker} from "@react-native-picker/picker";

// Configure Locales for Calendar
LocaleConfig.locales["en"] = {
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    today: "Today",
};
LocaleConfig.locales["hi"] = {
    monthNames: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
    monthNamesShort: ["जन", "फ़र", "मार्च", "अप्रै", "मई", "जून", "जुला", "अग", "सितं", "अक्टू", "नव", "दिसं"],
    dayNames: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"],
    dayNamesShort: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
    today: "आज",
};
LocaleConfig.locales["mr"] = {
    monthNames: ["जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"],
    monthNamesShort: ["जाने", "फेब्रु", "मार्च", "एप्रि", "मे", "जून", "जुलै", "ऑग", "सप्टें", "ऑक्टो", "नोव्हे", "डिसें"],
    dayNames: ["रविवार", "सोमवार", "मंगळवार", "बुधवार", "गुरूवार", "शुक्रवार", "शनिवार"],
    dayNamesShort: ["रवि", "सोम", "मंगळ", "बुध", "गुरू", "शुक्र", "शनि"],
    today: "आज",
};
LocaleConfig.defaultLocale = "en";

const PatientFollowUpSchedule = () => {
    const {t, i18n} = useTranslation();
    const {user} = useGlobalContext();
    const patientId = user?.$id;

    const [items, setItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSchedules, setSelectedSchedules] = useState([]);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const handleLanguageChange = () => {
            LocaleConfig.defaultLocale = i18n.language;
        };

        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [i18n]);

    useEffect(() => {
        // Configure notification response listener
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response:', response);
            // Handle notification tap if needed
        });

        // Request permissions and then fetch schedules
        registerForPushNotificationsAsync().then(fetchSchedules);

        return () => {
            subscription.remove();
        };
    }, []);

    const registerForPushNotificationsAsync = async () => {
        const {status: existingStatus} = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const {status} = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert(t('permissionRequired'), t('failedToGetPushToken'));
            return;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.HIGH,
                sound: 'mysoundfile.mp3',
            });
        }
    };

    const scheduleFollowUpNotification = async (schedule, date, message) => {
        try {
            const scheduleTime = moment(date);
            if (scheduleTime.isAfter(moment())) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: t('reminder'),
                        body: message,
                        data: {scheduleId: schedule.$id},
                    },
                    trigger: scheduleTime.toDate(),
                });
            }
        } catch (error) {
            console.error('Error scheduling notification:', error);
        }
    };

    const fetchSchedules = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getFollowUpsByPatient(patientId);
            const fetchedSchedules = response.documents || [];
            const formattedItems = {};
            let minDate = null;
            let maxDate = null;

            // Cancel existing notifications before scheduling new ones
            await Notifications.cancelAllScheduledNotificationsAsync();

            fetchedSchedules.forEach((schedule) => {
                const date = moment(schedule.scheduledDate).format("YYYY-MM-DD");
                if (!formattedItems[date]) {
                    formattedItems[date] = [];
                }
                formattedItems[date].push(schedule);

                const scheduleDate = moment(schedule.scheduledDate).startOf('day');
                if (!minDate || scheduleDate.isBefore(minDate)) minDate = scheduleDate.clone();
                if (!maxDate || scheduleDate.isAfter(maxDate)) maxDate = scheduleDate.clone();

                const appointmentDateTime = moment(schedule.scheduledDate).subtract(1, 'hour');
                const oneDayBefore = moment(schedule.scheduledDate).subtract(1, 'days');

                scheduleFollowUpNotification(
                    schedule,
                    appointmentDateTime,
                    `${t(schedule.type === "followup" ? 'followUpReminderToday' : 'dialysisReminderToday')} ${appointmentDateTime.format('h:mm A')}.`
                );

                scheduleFollowUpNotification(
                    schedule,
                    oneDayBefore,
                    `${t(schedule.type === "followup" ? 'followUpReminderTomorrow' : 'dialysisReminderTomorrow')} ${appointmentDateTime.format('h:mm A')}.`
                );
            });

            if (!minDate) minDate = moment().startOf('day');
            if (!maxDate) maxDate = moment().endOf('day');

            let currentDate = minDate.clone();
            while (currentDate.isSameOrBefore(maxDate)) {
                const dateStr = currentDate.format("YYYY-MM-DD");
                if (!formattedItems[dateStr]) {
                    formattedItems[dateStr] = [];
                }
                currentDate.add(1, 'day');
            }

            setItems(formattedItems);
        } catch (error) {
            console.error("Error fetching schedules:", error);
            Toast.show({
                type: 'error',
                text1: t('error'),
                text2: t('failedToFetchSchedules'),
                position: 'top',
                visibilityTime: 3000,
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [patientId, t]);

    const loadItems = (month) => {
        const updatedItems = {...items};
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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSchedules();
    }, [fetchSchedules]);

    const handleDayPress = useCallback((day) => {
        setSelectedDate(day.dateString);
    }, []);

    const handleStatusUpdate = async (scheduleId, newStatus) => {
        try {
            setUpdating(true);
            await updateScheduleStatus(scheduleId, newStatus);

            setItems((prevItems) => {
                const date = moment(selectedDate).format("YYYY-MM-DD");
                const updatedSchedules = prevItems[date].map((schedule) => {
                    if (schedule.$id === scheduleId) {
                        return {...schedule, status: newStatus};
                    }
                    return schedule;
                });
                return {
                    ...prevItems,
                    [date]: updatedSchedules,
                };
            });

            setSelectedSchedules((prevSchedules) =>
                prevSchedules.map((schedule) =>
                    schedule.$id === scheduleId ? {...schedule, status: newStatus} : schedule
                )
            );

            Toast.show({
                type: 'success',
                text1: t('success'),
                text2: t('scheduleStatusUpdated'),
                position: 'top',
                visibilityTime: 3000,
            });
        } catch (error) {
            console.error("Error updating schedule status:", error);
            Toast.show({
                type: 'error',
                text1: t('error'),
                text2: t('failedToUpdateSchedule'),
                position: 'top',
                visibilityTime: 3000,
            });
        } finally {
            setUpdating(false);
        }
    };

    const renderItem = useCallback((item) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => {
                const dateStr = moment(item.scheduledDate).format("YYYY-MM-DD");
                setSelectedDate(dateStr);
                setSelectedSchedules(items[dateStr] || []);
                setModalVisible(true);
            }}
            accessibilityLabel={`${t('viewDetailsFor')} ${item.type} ${moment(item.scheduledDate).format("MMMM DD, YYYY h:mm A")}`}
            accessibilityRole="button"
        >
            <View style={styles.itemHeader}>
                <Text style={styles.itemType}>
                    {item.type === "followup" ? t('followUp') : t('dialysis')}
                </Text>
                <Text style={[
                    styles.itemStatus,
                    item.status === "scheduled" ? styles.statusScheduled :
                        item.status === "completed" ? styles.statusCompleted :
                            styles.statusCanceled
                ]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
            </View>
            <Text style={styles.itemDate}>
                {moment(item.scheduledDate).format("MMMM DD, YYYY h:mm A")}
            </Text>
            {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
        </TouchableOpacity>
    ), [items, t]);

    const renderEmptyDate = useCallback(() => (
        <View style={styles.emptyDate}>
            <Text style={styles.emptyDateText}>{t('noSchedulesForThisDay')}</Text>
        </View>
    ), [t]);

    const generateMarkedDates = useCallback(() => {
        const marked = {};
        Object.keys(items).forEach((date) => {
            const dots = items[date].map((schedule) => ({
                key: schedule.$id,
                color: schedule.type === 'followup' ? '#00adf5' : '#ff5c5c',
            }));
            marked[date] = {dots};
        });

        marked[selectedDate] = {
            ...(marked[selectedDate] || {}),
            selected: true,
            selectedColor: "#00adf5",
        };

        const today = moment().format("YYYY-MM-DD");
        marked[today] = {
            ...(marked[today] || {}),
            today: true,
            selectedColor: "#00adf5",
        };

        return marked;
    }, [items, selectedDate]);

    // Render modal if needed (not implemented in this snippet)

    const renderModal = () => (
        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setModalVisible(false)}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                        {t('schedulesOnDate', {date: moment(selectedDate).format("MMMM DD, YYYY")})}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)} accessibilityLabel={t('closeModal')}
                                      accessibilityRole="button">
                        <Ionicons name="close" size={24} color="#333"/>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={selectedSchedules}
                    keyExtractor={(item) => item.$id}
                    renderItem={({item}) => (
                        <View style={styles.scheduleItem}>
                            <View style={styles.scheduleHeader}>
                                <Text style={styles.scheduleType}>
                                    {item.type === "followup" ? t('followUp') : t('dialysis')}
                                </Text>
                                <Text style={[
                                    styles.scheduleStatus,
                                    item.status === "scheduled" ? styles.statusScheduled :
                                        item.status === "completed" ? styles.statusCompleted :
                                            styles.statusCanceled
                                ]}>
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </Text>
                            </View>
                            <Text style={styles.scheduleDate}>
                                {moment(item.scheduledDate).format("h:mm A")}
                            </Text>
                            {item.notes ? <Text style={styles.scheduleNotes}>{item.notes}</Text> : null}

                            <View style={styles.statusUpdateContainer}>
                                <Text style={styles.updateLabel}>{t('updateStatus')}:</Text>
                                <Picker
                                    selectedValue={item.status}
                                    style={styles.picker}
                                    onValueChange={(value) => handleStatusUpdate(item.$id, value)}
                                    enabled={!updating}
                                >
                                    <Picker.Item label={t('scheduled')} value="scheduled"/>
                                    <Picker.Item label={t('completed')} value="completed"/>
                                    <Picker.Item label={t('canceled')} value="canceled"/>
                                </Picker>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.noSchedulesContainer}>
                            <Text style={styles.noSchedulesText}>{t('noSchedulesAvailable')}</Text>
                        </View>
                    }
                    contentContainerStyle={styles.scheduleList}
                    refreshing={updating}
                />
                <Toast position="top" topOffset={50}/>
            </SafeAreaView>
        </Modal>
    );


    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>{t('yourScheduleTitle')}</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#00adf5" style={styles.loadingIndicator}/>
            ) : (
                <Agenda
                    items={items}
                    selected={selectedDate}
                    onDayPress={handleDayPress}
                    loadItemsForMonth={loadItems}
                    renderItem={renderItem}
                    renderEmptyDate={renderEmptyDate}
                    rowHasChanged={(r1, r2) => r1.$id !== r2.$id || r1.status !== r2.status}
                    markingType={'multi-dot'}
                    markedDates={generateMarkedDates()}
                    showOnlySelectedDayItems={false}
                    showClosingKnob={true}
                    theme={{
                        selectedDayBackgroundColor: colors.midnight_green.DEFAULT,
                        todayTextColor: colors.picton_blue.DEFAULT,
                        agendaDayTextColor: colors.picton_blue.DEFAULT,
                        agendaTodayColor: colors.picton_blue.DEFAULT,
                        dotColor: colors.picton_blue.DEFAULT,
                        selectedDayTextColor: colors.white,
                        selectedDotColor: "#ffffff",
                        arrowColor: colors.ruddy_blue[100],
                        monthTextColor: "#333",
                        dayTextColor: "#555",
                        textDisabledColor: "#d9e1e8",
                        backgroundColor: "#ffffff",
                        calendarBackground: "#ffffff",
                        agendaKnobColor: colors.ruddy_blue[100],
                    }}
                    // Optionally, add a RefreshControl similar to the medication calendar
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
                />
            )}
            {modalVisible && renderModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginVertical: 10,
        textAlign: "center",
        color: "#333",
    },
    loadingIndicator: {
        marginTop: 20,
    },
    itemContainer: {
        backgroundColor: "#f9f9f9",
        padding: 10,
        borderRadius: 8,
        marginRight: 10,
        marginTop: 17,
    },
    itemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    itemType: {
        fontSize: 16,
        fontWeight: "600",
        color: "#007BFF",
    },
    itemStatus: {
        fontSize: 16,
        fontWeight: "600",
    },
    statusScheduled: {
        color: "#FF9C01",
    },
    statusCompleted: {
        color: "#28a745",
    },
    statusCanceled: {
        color: "#dc3545",
    },
    itemDate: {
        fontSize: 14,
        color: "#555",
        marginBottom: 4,
    },
    itemNotes: {
        fontSize: 14,
        color: "#333",
    },
    emptyDate: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyDateText: {
        fontSize: 16,
        color: "#999",
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    scheduleList: {
        paddingBottom: 20,
    },
    scheduleItem: {
        backgroundColor: "#f2f2f2",
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    scheduleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    scheduleType: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.ruddy_blue[100],
    },
    scheduleStatus: {
        fontSize: 16,
        fontWeight: "600",
    },
    scheduleDate: {
        fontSize: 14,
        color: "#555",
        marginBottom: 4,
    },
    scheduleNotes: {
        fontSize: 14,
        color: "#333",
    },
    noSchedulesContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    noSchedulesText: {
        fontSize: 16,
        color: "#999",
    },
    statusUpdateContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    updateLabel: {
        fontSize: 14,
        color: "#555",
        marginRight: 10,
    },
    picker: {
        flex: 1,
        height: 50,
        color: "#555",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    // ... other styles unchanged
});

export default PatientFollowUpSchedule;
