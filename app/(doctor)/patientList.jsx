// app/scheduleFollowUp/[patientId].jsx

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import {
  getPatientCollection,
  updatePatientProfile,
  getMedicationCollection,
} from "../../lib/appwrite";
import { SafeAreaView } from "react-native-safe-area-context";
import EditPatientDetails from "../../components/EditPatientDetails";
import MedicationForm from "../../components/MedicationForm";
import PatientCard from "../../components/PatientCard";
import ScheduleFollowUpForm from "../../components/ScheduleFollowUpForm";
import debounce from "lodash.debounce";
import Ionicons from 'react-native-vector-icons/Ionicons';
import FollowUpList from "../../components/FollowUpList";
import { useRouter } from "expo-router"; // Import useRouter from Expo Router

const PatientList = () => {
  const [db, setDb] = useState([]);
  const [filteredDb, setFilteredDb] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editPatientModalVisible, setEditPatientModalVisible] = useState(false);
  const [patientMedicationModalVisible, setPatientMedicationModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medications, setMedications] = useState([]);

  // States for ScheduleFollowUpForm
  const [scheduleFollowUpModalVisible, setScheduleFollowUpModalVisible] = useState(false);

  // States for Action Modal
  const [actionModalVisible, setActionModalVisible] = useState(false);

  // States for Schedule Follow-Up List Modal
  const [scheduleFollowUpListModalVisible, setScheduleFollowUpListModalVisible] = useState(false);

  const router = useRouter(); // Initialize the router

  useEffect(() => {
    fetchPatients();
    fetchMedications();
  }, []);

  // Optimized search filtering using debounce
  const handleSearch = useCallback(
      debounce((query) => {
        const filtered = db.filter((patient) =>
            patient?.name?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredDb(filtered);
      }, 300),
      [db]
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const dbResponse = await getPatientCollection();
      setDb(dbResponse.documents || []);
      setFilteredDb(dbResponse.documents || []);
    } catch (error) {
      console.error("Error fetching patient data:", error);
      Alert.alert("Error", "Failed to fetch patient data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMedications = async () => {
    try {
      const medicationResponse = await getMedicationCollection();
      setMedications(medicationResponse.documents || []);
    } catch (error) {
      console.error("Error fetching medication data:", error);
      Alert.alert("Error", "Failed to fetch medication data.");
    }
  };

  const handleEditPatient = () => {
    setEditPatientModalVisible(true);
    setActionModalVisible(false);
  };

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return;

    try {
      const updatedPatient = await updatePatientProfile(selectedPatient);

      setDb((prevDb) =>
          prevDb.map((patient) =>
              patient.$id === updatedPatient.$id ? updatedPatient : patient
          )
      );
      setFilteredDb((prevFilteredDb) =>
          prevFilteredDb.map((patient) =>
              patient.$id === updatedPatient.$id ? updatedPatient : patient
          )
      );

      setEditPatientModalVisible(false);
    } catch (error) {
      console.error("Error updating patient details:", error);
      Alert.alert("Error", "Failed to update patient details.");
    }
  };

  const handleManageMedications = () => {
    setActionModalVisible(false);
    // Navigate to the MedicationListScreen with patientId
    router.push({
      pathname: `/medication/${selectedPatient?.users?.$id}`,
    });
  };

  const handleScheduleFollowUp = () => {
    setActionModalVisible(false);
    // Navigate to the ScheduleFollowUpScreen with patientId
    router.push({
      pathname: `/scheduleFollowUp/${selectedPatient?.users?.$id}`,
    });
  };

  const handleMedicationProgress = () => {
    setActionModalVisible(false);
    // Navigate to the PatientMedicationProgress screen with patientId
    router.push({
      pathname: `/patientMedicationProgress/${selectedPatient?.users?.$id}`,
    });
  };

  const handleCloseScheduleFollowUpList = () => {
    setScheduleFollowUpListModalVisible(false);
  };

  const handleFollowUpSubmit = () => {
    console.log("Follow-Up/Dialysis scheduled successfully");
    // Refresh the FollowUpList by re-fetching or relying on useEffect in FollowUpList
    handleCloseScheduleFollowUpList();
  };

  // Handle Action Selection from the Action Modal
  const handleActionSelect = (action) => {
    switch (action) {
      case "edit":
        handleEditPatient();
        break;
      case "medication":
        handleManageMedications();
        break;
      case "followUp":
        handleScheduleFollowUp();
        break;
      case "medicationProgress":
        handleMedicationProgress();
        break;
      case "cancel":
      default:
        setActionModalVisible(false);
        break;
    }
  };

  // Handle pressing on a PatientCard to open the Action Modal
  const handleCardPress = (patient) => {
    setSelectedPatient(patient);
    setActionModalVisible(true);
  };

  // Function to close the ScheduleFollowUpModal
  const handleCloseScheduleFollowUpModal = () => {
    setScheduleFollowUpModalVisible(false);
  };

  return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Patient List</Text>

        <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor="#CDCDE0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search patients by name"
        />

        {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF9C01" />
            </View>
        ) : (
            <FlatList
                data={filteredDb}
                keyExtractor={(item) => item.$id}
                renderItem={({ item }) => (
                    <PatientCard
                        patient={item}
                        onPress={() => handleCardPress(item)}
                    />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No patients found.
                  </Text>
                }
            />
        )}

        {/* Edit Patient Details Modal */}
        <EditPatientDetails
            visible={editPatientModalVisible}
            patient={selectedPatient}
            setPatient={setSelectedPatient}
            onClose={() => setEditPatientModalVisible(false)}
            onUpdate={handleUpdatePatient}
        />

        {/* Medication Form Modal */}
        <MedicationForm
            visible={patientMedicationModalVisible}
            patient={selectedPatient}
            onClose={() => {
              setPatientMedicationModalVisible(false);
            }}
            onSubmit={() => {
              console.log("Medication added successfully");
              fetchMedications();
            }}
        />

        {/* Schedule Follow-Up/Dialysis Form Modal */}
        <ScheduleFollowUpForm
            visible={scheduleFollowUpModalVisible}
            onClose={handleCloseScheduleFollowUpModal}
            patient={selectedPatient}
            onSubmit={handleFollowUpSubmit}
        />

        {/* Action Modal */}
        <Modal
            visible={actionModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setActionModalVisible(false)} // Handles Android back button
        >
          {/* Backdrop: Closes modal when pressed */}
          <TouchableWithoutFeedback onPress={() => setActionModalVisible(false)}>
            <View style={styles.actionModalBackground}>
              {/* Prevent modal content from closing the modal when pressed */}
              <TouchableWithoutFeedback onPress={() => { /* Do nothing */ }}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select an Action</Text>

                  {/* Edit Patient Details */}
                  <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => handleActionSelect("edit")}
                      accessibilityLabel="Edit patient details"
                      accessibilityRole="button"
                  >
                    <Ionicons name="create-outline" size={20} color="#FF8E01" />
                    <Text style={styles.modalButtonText}>Edit Patient Details</Text>
                  </TouchableOpacity>

                  {/* Manage Medication List */}
                  <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => handleActionSelect("medication")}
                      accessibilityLabel="Manage medication list"
                      accessibilityRole="button"
                  >
                    <Ionicons name="medkit-outline" size={20} color="#FF8E01" />
                    <Text style={styles.modalButtonText}>Manage Medication List</Text>
                  </TouchableOpacity>

                  {/* Schedule Follow-Up/Dialysis */}
                  <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => handleActionSelect("followUp")}
                      accessibilityLabel="Schedule follow-up or dialysis"
                      accessibilityRole="button"
                  >
                    <Ionicons name="calendar-outline" size={20} color="#FF8E01" />
                    <Text style={styles.modalButtonText}>Schedule Follow-Up/Dialysis</Text>
                  </TouchableOpacity>

                  {/* Medication Progress */}
                  <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => handleActionSelect("medicationProgress")}
                      accessibilityLabel="View medication progress"
                      accessibilityRole="button"
                  >
                    <Ionicons name="stats-chart-outline" size={20} color="#FF8E01" />
                    <Text style={styles.modalButtonText}>Medication Progress</Text>
                  </TouchableOpacity>

                  {/* Cancel */}
                  <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => handleActionSelect("cancel")}
                      accessibilityLabel="Cancel action"
                      accessibilityRole="button"
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#FF8E01" />
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Schedule Follow-Up List Modal */}
        <Modal
            visible={scheduleFollowUpListModalVisible}
            animationType="slide"
            transparent
            onRequestClose={handleCloseScheduleFollowUpList}
        >
          <TouchableWithoutFeedback onPress={handleCloseScheduleFollowUpList}>
            <View style={styles.scheduleFollowUpModalBackground}>
              <TouchableWithoutFeedback onPress={() => { /* Do nothing to prevent modal closing */ }}>
                <View style={styles.scheduleFollowUpContent}>
                  <Text style={styles.modalTitle}>Follow-Up/Dialysis Schedule</Text>

                  {/* Render your existing FollowUpList component */}
                  <FollowUpList patientId={selectedPatient?.users?.$id} />

                  {/* Button to Add New Follow-Up */}
                  <TouchableOpacity
                      style={styles.addFollowUpButton}
                      onPress={() => {
                        // Open the ScheduleFollowUpForm modal
                        setScheduleFollowUpListModalVisible(false);
                        setScheduleFollowUpModalVisible(true);
                      }}
                      accessibilityLabel="Add new follow-up/dialysis"
                      accessibilityRole="button"
                  >
                    <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.addFollowUpButtonText}>Add Follow-Up/Dialysis</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
  );
};

// Utility function to capitalize the first letter
const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const styles = StyleSheet.create({
  // ... (your existing styles)
  container: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    padding: 16,
    paddingBottom: 0
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "bold",
    color: "#2C3A59",
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#7F8FA6",
    marginTop: 20,
    fontSize: 16,
  },
  actionModalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Semi-transparent background
    justifyContent: "flex-end",
    padding: 0, // Removed outer padding
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 20, // Maintained internal padding
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#2C3A59",
    textAlign: "center",
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20, // Ensures adequate touch area
    borderBottomColor: "#EEEEEE",
    borderBottomWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#2C3A59",
  },
  cancelButton: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  scheduleFollowUpModalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Semi-transparent background
    justifyContent: "center",
    padding: 0, // Removed outer padding
  },
  scheduleFollowUpContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20, // Maintained internal padding
    maxHeight: "80%",
  },
  addFollowUpButton: {
    flexDirection: "row",
    backgroundColor: "#FF8E01",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  addFollowUpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
});

export default PatientList;
