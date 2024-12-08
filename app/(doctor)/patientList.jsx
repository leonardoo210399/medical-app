import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  ActivityIndicator,
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
import debounce from "lodash.debounce";

const PatientList = () => {
  const [db, setDb] = useState([]); // Full database
  const [filteredDb, setFilteredDb] = useState([]); // Filtered patients
  const [searchQuery, setSearchQuery] = useState(""); // Search term
  const [loading, setLoading] = useState(true); // Loading state
  const [editPatientModalVisible, setEditPatientModalVisible] = useState(false); // Modal visibility
  const [patientMedicationModalVisible, setPatientMedicationModalVisible] =
    useState(false); // Modal visibility
  const [selectedPatient, setSelectedPatient] = useState(null); // Current patient for editing
  const [medications, setMedications] = useState([]); // Medications list

  useEffect(() => {
    // Fetch patients and medications on component mount
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
      setFilteredDb(dbResponse.documents || []); // Initialize filtered data
    } catch (error) {
      console.error("Error fetching patient data:", error);
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
    }
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setEditPatientModalVisible(true);
  };

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return;

    try {
      const updatedPatient = await updatePatientProfile(selectedPatient);

      // Update state with the updated patient
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
    }
  };

  const handleViewMedications = (patient) => {
    // Filter medications by patient ID
    const patientMedications = medications.filter(
      (med) => med.userMedication?.$id === patient.users.$id
    );
    setSelectedPatient({
      ...patient,
      medications: patientMedications,
    });
    setPatientMedicationModalVisible(true);
  };

  return (
    <SafeAreaView className="bg-black-100 p-4 flex-1">
      <Text className="text-xl text-center mb-5 font-pbold text-secondary">
        Patient List
      </Text>

      <TextInput
        className="bg-white rounded-xl px-4 py-3 mb-4 shadow"
        placeholder="Search by name..."
        placeholderTextColor="#CDCDE0"
        value={searchQuery}
        onChangeText={setSearchQuery}
        accessibilityLabel="Search patients by name"
      />

      {loading ? (
        <View className="flex justify-center items-center">
          <ActivityIndicator size="large" color="#FF9C01" />
        </View>
      ) : (
        <FlatList
          data={filteredDb}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              onEdit={() => handleEditPatient(item)}
              onMedication={() => handleViewMedications(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-5">
              No patients found.
            </Text>
          }
        />
      )}

      <EditPatientDetails
        visible={editPatientModalVisible}
        patient={selectedPatient}
        setPatient={setSelectedPatient}
        onClose={() => setEditPatientModalVisible(false)}
        onUpdate={handleUpdatePatient}
      />
      <MedicationForm
        visible={patientMedicationModalVisible}
        patient={selectedPatient}
        onClose={() => {
          setPatientMedicationModalVisible(false); // Close the modal
        }}
        onSubmit={() => {
          console.log("Medication added successfully"); // Log success
          fetchMedications(); // Refresh the medications list
        }}
      />
    </SafeAreaView>
  );
};

export default PatientList;
