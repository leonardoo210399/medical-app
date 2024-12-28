// PatientFollowUpSchedule.js

import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    TouchableOpacity,
    FlatList,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Agenda, LocaleConfig } from "react-native-calendars";
import moment from "moment";
import { getFollowUpsByPatient, updateScheduleStatus } from "../../lib/appwrite"; // Ensure you have updateScheduleStatus
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useGlobalContext } from '../../context/GlobalProvider';
import { Picker } from "@react-native-picker/picker";

// Configure the calendar locale (optional)
LocaleConfig.locales["en"] = {
    monthNames: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ],
    monthNamesShort: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ],
    dayNames: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ],
    dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    today: "Today",
};
LocaleConfig.defaultLocale = "en";

const PatientFollowUpSchedule = () => {
    // State variables
    const [items, setItems] = useState({}); // Agenda items
    const [loading, setLoading] = useState(true); // Loading state for initial load
    const [selectedSchedules, setSelectedSchedules] = useState([]); // Schedules for selected date
    const [modalVisible, setModalVisible] = useState(false); // Modal visibility
    const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh state
    const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD")); // Selected date
    const [updating, setUpdating] = useState(false); // Status update loading state

    // Access global context for user information
    const { user } = useGlobalContext(); // Ensure your GlobalProvider provides 'user'
    const patientId = user?.$id; // Adjust based on your user object structure

    // Fetch schedules on component mount
    useEffect(() => {
        fetchSchedules();
    }, []);

    // Function to fetch schedules
    const fetchSchedules = useCallback(async () => {
        try {
            // Fetch schedules from backend
            const response = await getFollowUpsByPatient(patientId);
            const fetchedSchedules = response.documents || [];

            // Process schedules and organize them by date
            const formattedItems = {};

            fetchedSchedules.forEach((schedule) => {
                const date = moment(schedule.scheduledDate).format("YYYY-MM-DD");
                if (!formattedItems[date]) {
                    formattedItems[date] = [];
                }
                formattedItems[date].push(schedule);
            });

            // Replace the entire items state to ensure immutability
            setItems(formattedItems);
        } catch (error) {
            console.error("Error fetching schedules:", error);
            Alert.alert("Error", "Failed to fetch your schedules. Please try again later.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [patientId]);

    // Handle pull-to-refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSchedules();
    }, [fetchSchedules]);

    // Handle day selection without opening the modal
    const handleDayPress = useCallback((day) => {
        setSelectedDate(day.dateString);
        // Optionally, you can fetch schedules for the selected date if needed
    }, []);

    // Function to handle status update
    const handleStatusUpdate = async (scheduleId, newStatus) => {
        try {
            setUpdating(true);
            // Update status in backend
            await updateScheduleStatus(scheduleId, newStatus);

            // Update local state
            setItems((prevItems) => {
                const date = moment(selectedDate).format("YYYY-MM-DD");
                const updatedSchedules = prevItems[date].map((schedule) => {
                    if (schedule.$id === scheduleId) {
                        return { ...schedule, status: newStatus };
                    }
                    return schedule;
                });
                return {
                    ...prevItems,
                    [date]: updatedSchedules,
                };
            });

            // Update selectedSchedules as well
            setSelectedSchedules((prevSchedules) =>
                prevSchedules.map((schedule) =>
                    schedule.$id === scheduleId ? { ...schedule, status: newStatus } : schedule
                )
            );

            Alert.alert("Success", "Schedule status updated successfully.");
        } catch (error) {
            console.error("Error updating schedule status:", error);
            Alert.alert("Error", "Failed to update schedule status. Please try again.");
        } finally {
            setUpdating(false);
        }
    };

    // Render each schedule item in the Agenda
    const renderItem = useCallback((item) => {
        return (
            <TouchableOpacity
                style={styles.itemContainer}
                onPress={() => {
                    setSelectedDate(moment(item.scheduledDate).format("YYYY-MM-DD")); // Update selected date
                    setSelectedSchedules(items[moment(item.scheduledDate).format("YYYY-MM-DD")] || []);
                    setModalVisible(true);
                }}
                accessibilityLabel={`View details for ${item.type} on ${moment(item.scheduledDate).format("MMMM DD, YYYY h:mm A")}`}
                accessibilityRole="button"
            >
                <View style={styles.itemHeader}>
                    <Text style={styles.itemType}>
                        {item.type === "followup" ? "Follow-Up" : "Dialysis"}
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
        );
    }, [items]);

    // Render empty date message with conditional rendering
    const renderEmptyDate = useCallback(() => {
        const today = moment().format("YYYY-MM-DD");
        if (selectedDate === today) {
            return null; // Show nothing for today's agenda if there are no items
        }
        return (
            <View style={styles.emptyDate}>
                <Text style={styles.emptyDateText}>No schedules for this day.</Text>
            </View>
        );
    }, [selectedDate]);

    // Generate marked dates with dots
    const generateMarkedDates = useCallback(() => {
        const marked = {};

        Object.keys(items).forEach((date) => {
            const dots = items[date].map((schedule) => ({
                key: schedule.$id,
                color: schedule.type === 'followup' ? '#00adf5' : '#ff5c5c',
            }));
            marked[date] = {
                dots,
            };
        });

        // Highlight the selected date
        marked[selectedDate] = {
            ...(marked[selectedDate] || {}),
            selected: true,
            selectedColor: "#00adf5",
        };

        // Optionally, highlight today
        const today = moment().format("YYYY-MM-DD");
        marked[today] = {
            ...(marked[today] || {}),
            today: true,
            selectedColor: "#00adf5",
        };

        return marked;
    }, [items, selectedDate]);

    // Render modal content
    const renderModal = () => (
        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setModalVisible(false)}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Schedules on {moment(selectedDate).format("MMMM DD, YYYY")}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)} accessibilityLabel="Close modal" accessibilityRole="button">
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={selectedSchedules}
                    keyExtractor={(item) => item.$id}
                    renderItem={({ item }) => (
                        <View style={styles.scheduleItem}>
                            <View style={styles.scheduleHeader}>
                                <Text style={styles.scheduleType}>
                                    {item.type === "followup" ? "Follow-Up" : "Dialysis"}
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

                            {/* Status Update Section */}
                            <View style={styles.statusUpdateContainer}>
                                <Text style={styles.updateLabel}>Update Status:</Text>
                                <Picker
                                    selectedValue={item.status}
                                    style={styles.picker}
                                    onValueChange={(value) => handleStatusUpdate(item.$id, value)}
                                    enabled={!updating}
                                >
                                    <Picker.Item label="Scheduled" value="scheduled" />
                                    <Picker.Item label="Completed" value="completed" />
                                    <Picker.Item label="Canceled" value="canceled" />
                                </Picker>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.noSchedulesContainer}>
                            <Text style={styles.noSchedulesText}>No schedules available.</Text>
                        </View>
                    }
                    contentContainerStyle={styles.scheduleList}
                    refreshing={updating}
                    // Optionally, you can show a loading indicator when updating
                />
            </SafeAreaView>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Your Follow-Up/Dialysis Schedule</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#00adf5" style={styles.loadingIndicator} />
            ) : (
                <Agenda
                    items={items}
                    selected={selectedDate}
                    onDayPress={handleDayPress}
                    loadItemsForMonth={fetchSchedules}
                    renderItem={renderItem}
                    renderEmptyDate={renderEmptyDate} // Updated renderEmptyDate
                    rowHasChanged={(r1, r2) => r1.$id !== r2.$id || r1.status !== r2.status}
                    markingType={'multi-dot'}
                    markedDates={generateMarkedDates()}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#FF9C01']}
                        />
                    }
                    theme={{
                        selectedDayBackgroundColor: "#00adf5",
                        todayTextColor: "#00adf5",
                        dotColor: "#00adf5",
                        selectedDotColor: "#ffffff",
                        arrowColor: "#00adf5",
                        monthTextColor: "#333",
                        dayTextColor: "#555",
                        textDisabledColor: "#d9e1e8",
                        backgroundColor: "#ffffff",
                        calendarBackground: "#ffffff",
                        agendaTodayColor: '#00adf5',
                        agendaKnobColor: '#00adf5',
                        // Add any additional theming here
                    }}
                />
            )}
            {modalVisible && renderModal()}
        </SafeAreaView>
    );
};

// Stylesheet
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
        height: 60,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyDateText: {
        fontSize: 16,
        color: "#999",
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
        color: "#007BFF",
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
});

export default PatientFollowUpSchedule;
