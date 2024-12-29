// app/scheduleFollowUp/[patientId].jsx

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    Alert,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import moment from "moment";

import {
    getFollowUpsByPatient,    // Function to fetch follow-ups by patient ID
    deleteFollowUp,           // Function to delete a follow-up
    getPatientDetails,        // Function to fetch patient details
    updateFollowUp,           // Function to update a follow-up
} from "../../lib/appwrite"; // Adjust the import path based on your project structure

import ScheduleFollowUpForm from "../../components/ScheduleFollowUpForm"; // Your existing form component

const PatientScheduleFollowUpScreen = () => {
    const router = useRouter();
    const { patientId } = useLocalSearchParams(); // Extract patientId from route params
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFollowUpForm, setShowFollowUpForm] = useState(false);
    const [patientName, setPatientName] = useState(""); // State for patient name
    const [loadingPatient, setLoadingPatient] = useState(true); // Loading state for patient details
    const [editingFollowUp, setEditingFollowUp] = useState(null); // Track follow-up being edited

    useEffect(() => {
        if (patientId) {
            fetchFollowUps();
            fetchPatientDetails();
        }
    }, [patientId]);

    // Fetch follow-ups for the patient
    const fetchFollowUps = async () => {
        try {
            setLoading(true);
            const followUpResponse = await getFollowUpsByPatient(patientId);
            setFollowUps(followUpResponse.documents || []);
        } catch (error) {
            console.error("Error fetching follow-up data:", error);
            Alert.alert("Error", "Failed to fetch follow-up schedules.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch patient details
    const fetchPatientDetails = async () => {
        try {
            setLoadingPatient(true);
            const patientDetails = await getPatientDetails(patientId);
            // Assuming 'name' is a field in the patient document
            const patientNameFetched = patientDetails.documents[0]?.name || "Unknown Patient";
            setPatientName(patientNameFetched);
        } catch (error) {
            console.error("Error fetching patient details:", error);
            Alert.alert("Error", "Failed to fetch patient details.");
        } finally {
            setLoadingPatient(false);
        }
    };

    // Handle deletion of a follow-up
    const handleDeleteFollowUp = (followUpId, followUpType) => {
        Alert.alert(
            "Confirm Deletion",
            `Are you sure you want to delete this ${followUpType}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteFollowUp(followUpId);
                            Alert.alert("Success", `${capitalizeFirstLetter(followUpType)} deleted successfully.`);
                            fetchFollowUps(); // Refresh the list after deletion
                        } catch (error) {
                            console.error("Error deleting follow-up:", error);
                            Alert.alert("Error", "Failed to delete follow-up.");
                        }
                    },
                },
            ]
        );
    };

    // Handle adding a new follow-up
    const handleAddFollowUp = () => {
        setEditingFollowUp(null); // Ensure no follow-up is being edited
        setShowFollowUpForm(true);
    };

    // Handle editing an existing follow-up
    const handleEditFollowUp = (followUp) => {
        setEditingFollowUp(followUp);
        setShowFollowUpForm(true);
    };

    // Handle closing the follow-up form
    const handleFollowUpFormClose = () => {
        setShowFollowUpForm(false);
        setEditingFollowUp(null);
    };

    // Handle after a follow-up is successfully added or edited
    const handleFollowUpSubmit = () => {
        fetchFollowUps(); // Refresh the list after adding or editing
        setShowFollowUpForm(false);
        setEditingFollowUp(null);
    };

    // Render each follow-up item
    const renderFollowUpItem = ({ item }) => (
        <View style={styles.followUpItem}>
            <View style={styles.followUpHeader}>
                <View style={styles.followUpTitleContainer}>
                    <Text style={styles.followUpType}>
                        {capitalizeFirstLetter(item.type)}
                    </Text>
                </View>
                <View style={styles.followUpActions}>
                    <TouchableOpacity
                        onPress={() => handleEditFollowUp(item)}
                        style={styles.actionButton}
                        accessibilityLabel={`Edit ${item.type} scheduled on ${moment(item.scheduledDate).format("MMM DD, YYYY h:mm A")}`}
                        accessibilityRole="button"
                    >
                        <Ionicons name="create-outline" size={20} color="#2980B9" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDeleteFollowUp(item.$id, item.type)}
                        style={styles.actionButton}
                        accessibilityLabel={`Delete ${item.type} scheduled on ${moment(item.scheduledDate).format("MMM DD, YYYY h:mm A")}`}
                        accessibilityRole="button"
                    >
                        <Ionicons name="trash-outline" size={20} color="#FF5C5C" />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.followUpDate}>
                {moment(item.scheduledDate).format("MMMM DD, YYYY h:mm A")}
            </Text>
            {item.notes ? (
                <Text style={styles.followUpNotes}>{item.notes}</Text>
            ) : null}
            <Text style={styles.followUpStatus}>
                Status: {capitalizeFirstLetter(item.status)}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Display loading indicator for patient details */}
            {loadingPatient ? (
                <View style={styles.loadingPatientContainer}>
                    <ActivityIndicator size="small" color="#FF9C01" />
                </View>
            ) : (
                <Text style={styles.title}>Follow-Ups for {patientName}</Text>
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF9C01" />
                </View>
            ) : followUps.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No follow-up schedules found.</Text>
                </View>
            ) : (
                <FlatList
                    data={followUps}
                    keyExtractor={(item) => item.$id}
                    renderItem={renderFollowUpItem}
                    contentContainerStyle={styles.listContainer}
                    refreshing={loading}
                    onRefresh={fetchFollowUps}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Add Follow-Up Button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddFollowUp}
                accessibilityLabel="Add new follow-up schedule"
                accessibilityRole="button"
            >
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Follow-Up</Text>
            </TouchableOpacity>

            {/* Schedule Follow-Up Form Modal */}
            <ScheduleFollowUpForm
                visible={showFollowUpForm}
                onClose={handleFollowUpFormClose}
                patient={{
                    name: patientName,
                    users: { $id: patientId }, // Ensure the structure matches what's expected in ScheduleFollowUpForm.js
                }}
                onSubmit={handleFollowUpSubmit}
                followUp={editingFollowUp} // Pass the follow-up being edited
            />
        </SafeAreaView>
    );
};

// Utility function to capitalize the first letter
const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F0F0F0",
        padding: 16,
    },
    title: {
        fontSize: 24,
        textAlign: "center",
        marginBottom: 16,
        fontWeight: "bold",
        color: "#2C3A59",
    },
    loadingPatientContainer: {
        alignItems: "center",
        marginBottom: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        textAlign: "center",
        color: "#7F8FA6",
        marginTop: 20,
        fontSize: 16,
    },
    listContainer: {
        paddingBottom: 80, // To ensure content is not hidden behind the add button
    },
    followUpItem: {
        backgroundColor: "#ffffff",
        padding: 15,
        marginVertical: 8,
        borderRadius: 8,
        elevation: 2,
    },
    followUpHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    followUpTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    followUpType: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333333",
    },
    followUpActions: {
        flexDirection: "row",
    },
    actionButton: {
        marginLeft: 16,
    },
    followUpDate: {
        fontSize: 14,
        color: "#555555",
        marginTop: 4,
    },
    followUpNotes: {
        fontSize: 14,
        color: "#555555",
        marginTop: 2,
        fontStyle: "italic",
    },
    followUpStatus: {
        fontSize: 14,
        color: "#555555",
        marginTop: 2,
        fontWeight: "500",
    },
    addButton: {
        flexDirection: "row",
        backgroundColor: "#FF8E01",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        bottom: 20,
        left: 16,
        right: 16,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        marginLeft: 8,
        fontWeight: "500",
    },
});

export default PatientScheduleFollowUpScreen;
