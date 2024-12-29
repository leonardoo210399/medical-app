// app/medication/[patientId].jsx

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    Alert,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import moment from "moment";
import Collapsible from "react-native-collapsible";

import {
    getPatientMedicationList,
    deletePatientMedication,
    getPatientDetails,
    updatePatientMedication, // New import
} from "../../lib/appwrite";
import MedicationForm from "../../components/MedicationForm";

const PatientMedicationScreen = () => {
    const router = useRouter();
    const { patientId } = useLocalSearchParams();
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMedicationForm, setShowMedicationForm] = useState(false);
    const [patientName, setPatientName] = useState("");
    const [loadingPatient, setLoadingPatient] = useState(true);
    const [activeRow, setActiveRow] = useState(null); // Track the expanded row
    const [editingMedication, setEditingMedication] = useState(null); // Track medication being edited

    useEffect(() => {
        fetchMedications();
        fetchPatientDetails();
    }, [patientId]);

    const fetchMedications = async () => {
        try {
            setLoading(true);
            const medicationResponse = await getPatientMedicationList(patientId);
            setMedications(medicationResponse.documents || []);
        } catch (error) {
            console.error("Error fetching medication data:", error);
            Alert.alert("Error", "Failed to fetch medication data.");
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientDetails = async () => {
        try {
            setLoadingPatient(true);
            const patientDetails = await getPatientDetails(patientId);
            setPatientName(patientDetails.documents[0].name);
        } catch (error) {
            console.error("Error fetching patient details:", error);
            Alert.alert("Error", "Failed to fetch patient details.");
        } finally {
            setLoadingPatient(false);
        }
    };

    const handleDeleteMedication = async (medicationId) => {
        try {
            await deletePatientMedication(medicationId);
            Alert.alert("Success", "Medication deleted successfully.");
            fetchMedications();
        } catch (error) {
            console.error("Error deleting medication:", error);
            Alert.alert("Error", "Failed to delete medication.");
        }
    };

    const handleAddMedication = () => {
        setEditingMedication(null); // Ensure no medication is being edited
        setShowMedicationForm(true);
    };

    const handleEditMedication = (medication) => {
        setEditingMedication(medication);
        setShowMedicationForm(true);
    };

    const handleMedicationFormClose = () => {
        setShowMedicationForm(false);
        setEditingMedication(null);
    };

    const handleMedicationSubmit = () => {
        fetchMedications();
        setShowMedicationForm(false);
        setEditingMedication(null);
    };

    const toggleExpand = (id) => {
        setActiveRow(activeRow === id ? null : id);
    };

    const renderMedicationItem = ({ item }) => {
        const isActive = activeRow === item.$id;

        return (
            <View style={styles.cardContainer}>
                <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleExpand(item.$id)}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardTitleContainer}>
                        <Ionicons
                            name={isActive ? "chevron-up-outline" : "chevron-down-outline"}
                            size={20}
                            color="#2C3A59"
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.cardTitle}>{item.medicineName}</Text>
                    </View>
                    <View style={styles.cardActions}>
                        <TouchableOpacity
                            onPress={() => handleEditMedication(item)}
                            accessibilityLabel={`Edit ${item.medicineName}`}
                            style={styles.actionButton}
                        >
                            <Ionicons name="create-outline" size={20} color="#2980B9" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDeleteMedication(item.$id)}
                            accessibilityLabel={`Delete ${item.medicineName}`}
                            style={styles.actionButton}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF5C5C" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {/* Collapsible Section for Detailed View */}
                <Collapsible collapsed={!isActive} align="center">
                    <View style={styles.collapsibleContent}>
                        {item.dosage ? (
                            <DetailRow label="Dosage" value={item.dosage} />
                        ) : null}
                        {item.frequency ? (
                            <DetailRow
                                label="Frequency"
                                value={capitalizeFirstLetter(item.frequency)}
                            />
                        ) : null}
                        {item.times && item.times.length > 0 ? (
                            <DetailRow
                                label="Times"
                                value={item.times.join(", ")}
                            />
                        ) : null}
                        {item.startDate && item.endDate ? (
                            <DetailRow
                                label="Date Range"
                                value={`${moment(item.startDate).format("MMM DD, YYYY")} - ${moment(
                                    item.endDate
                                ).format("MMM DD, YYYY")}`}
                            />
                        ) : null}
                        {item.dailyTimes !== undefined && item.dailyTimes !== null ? (
                            <DetailRow label="Daily Times" value={item.dailyTimes} />
                        ) : null}
                        {item.specificDays && item.specificDays.length > 0 ? (
                            <DetailRow
                                label="Specific Days"
                                value={item.specificDays.join(", ")}
                            />
                        ) : null}
                        {item.onDemand !== undefined && item.onDemand !== null ? (
                            <DetailRow
                                label="On Demand"
                                value={item.onDemand ? "Yes" : "No"}
                            />
                        ) : null}
                        {item.intervalType ? (
                            <DetailRow label="Interval Type" value={item.intervalType} />
                        ) : null}
                        {item.intervalValue !== undefined && item.intervalValue !== null ? (
                            <DetailRow
                                label="Interval Value"
                                value={`${item.intervalValue} ${item.intervalType || ""}`}
                            />
                        ) : null}
                        {item.cyclicIntakeDays !== undefined && item.cyclicIntakeDays !== null ? (
                            <DetailRow
                                label="Cyclic Intake Days"
                                value={item.cyclicIntakeDays}
                            />
                        ) : null}
                        {item.cyclicPauseDays !== undefined && item.cyclicPauseDays !== null ? (
                            <DetailRow
                                label="Cyclic Pause Days"
                                value={item.cyclicPauseDays}
                            />
                        ) : null}
                        {item.description ? (
                            <DetailRow
                                label="Description"
                                value={item.description}
                                isLast
                            />
                        ) : null}
                    </View>
                </Collapsible>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>
                    Medications for {patientName || "Unknown Patient"}
                </Text>
            </View>

            {/* Medication List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF9C01" />
                </View>
            ) : medications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="medkit-outline" size={50} color="#7F8FA6" />
                    <Text style={styles.emptyText}>No medications found.</Text>
                </View>
            ) : (
                <FlatList
                    data={medications}
                    keyExtractor={(item) => item.$id}
                    renderItem={renderMedicationItem}
                    contentContainerStyle={styles.listContainer}
                    refreshing={loading}
                    onRefresh={fetchMedications}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Add Medication Button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddMedication}
                accessibilityLabel="Add new medication"
            >
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Medication</Text>
            </TouchableOpacity>

            {/* Medication Form Modal */}
            <MedicationForm
                visible={showMedicationForm}
                patientId={patientId}
                onClose={handleMedicationFormClose}
                onSubmit={handleMedicationSubmit}
                medication={editingMedication} // Pass the medication being edited
            />
        </SafeAreaView>
    );
};

// Reusable component for detail rows
const DetailRow = ({ label, value, isLast }) => (
    <View style={[styles.detailRow, isLast && styles.lastDetailRow]}>
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

// Utility function to capitalize the first letter
const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "android" ? 25 : 0,
    },
    headerContainer: {
        marginVertical: 20,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#2C3A59",
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
        paddingHorizontal: 20,
    },
    emptyText: {
        textAlign: "center",
        color: "#7F8FA6",
        marginTop: 10,
        fontSize: 16,
    },
    listContainer: {
        paddingBottom: 100, // To ensure content is not hidden behind the add button
    },
    // Card Styles
    cardContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // For Android shadow
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#2C3A59",
    },
    cardActions: {
        flexDirection: "row",
    },
    actionButton: {
        marginLeft: 16,
    },
    collapsibleContent: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#ECECEC",
        paddingTop: 12,
    },
    detailRow: {
        flexDirection: "row",
        marginBottom: 8,
    },
    lastDetailRow: {
        marginBottom: 0,
    },
    detailLabel: {
        fontWeight: "600",
        color: "#34495E",
        width: 150,
    },
    detailValue: {
        color: "#7F8FA6",
        flex: 1,
        flexWrap: "wrap",
    },
    // Add Button Styles
    addButton: {
        flexDirection: "row",
        backgroundColor: "#FF8E01",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        bottom: 30,
        left: 20,
        right: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 10,
    },
});

export default PatientMedicationScreen;
