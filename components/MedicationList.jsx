// components/MedicationList.jsx

import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image} from "react-native";
import moment from "moment";
import { deletePatientMedication, getPatientMedicationList } from "../lib/appwrite";
import { icons } from "../constants";

const MedicationList = ({ userID }) => {
  // console.log("Aditya",userID);

  const [medications, setMedications] = useState([]); // Medications list

  useEffect(() => {
    // Fetch initial medications data
    fetchMedications();

    // Set up polling every 10 seconds
    const interval = setInterval(() => {
      fetchMedications();
    }, 10000); // 10,000 milliseconds = 10 seconds

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, [userID]);

  const fetchMedications = async () => {
    try {
      const medicationResponse = await getPatientMedicationList(userID);
      setMedications(medicationResponse.documents || []);
    } catch (error) {
      console.error("Error fetching medication data:", error);
    }
  };

  if (!medications || medications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Medications Assigned.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.medicationItem}>
      <View className="w-full flex-row justify-between items-center">
          <Text className="text-3xl font-bold">
            {item.medicineName}
          </Text>
          <TouchableOpacity onPress={()=>deletePatientMedication(item.$id)} className="flex items-end">
            <Image
              source={icons.close}
              resizeMode="contain"
              className="w-4 h-4"
            />
          </TouchableOpacity>
        </View>
      <Text style={styles.dosage}>dId: {item.$id}</Text>
      <Text style={styles.dosage}>Dosage: {item.dosage}</Text>
      <Text style={styles.frequency}>
        Frequency: {capitalizeFirstLetter(item.frequency)}
      </Text>
      <Text>{item.times}</Text>
      <Text style={styles.dateRange}>
        {moment(item.startDate).format("MMM DD, YYYY")} -{" "}
        {moment(item.endDate).format("MMM DD, YYYY")}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={medications}
      keyExtractor={(item) => item.$id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
    />
  );
};

// Utility function to capitalize the first letter
const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 10,
  },
  medicationItem: {
    backgroundColor: "#ffffff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },
  dosage: {
    fontSize: 14,
    color: "#555555",
    marginTop: 4,
  },
  frequency: {
    fontSize: 14,
    color: "#555555",
    marginTop: 2,
  },
  dateRange: {
    fontSize: 12,
    color: "#777777",
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#888888",
  },
});

export default MedicationList;
