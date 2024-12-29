// PatientCard.js
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import MedicationList from "./MedicationList";
import FollowUpList from "./FollowUpList";

const PatientCard = ({ patient, onPress }) => {
  return (
      <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={[styles.card, { borderColor: "#FF8E01", borderWidth: 1 }]}
          accessibilityLabel={`Patient card for ${patient?.name || "Unknown"}`}
      >
        <View style={styles.header}>
          <Image
              source={{
                uri: patient?.users?.avatar || "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
          />
          <View>
            <Text style={styles.name}>{patient?.name || "Unknown"}</Text>
            <Text style={styles.email}>
              {patient?.users?.email || "No Email"}
            </Text>
          </View>
        </View>
        <View style={styles.details}>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Age: </Text>
            {patient?.age || "N/A"}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Gender: </Text>
            {patient?.gender || "N/A"}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Height: </Text>
            {patient?.height || "N/A"} cm
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Weight: </Text>
            {patient?.weight || "N/A"} kg
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Allergies: </Text>
            {patient?.allergies || "None"}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Comorbidities: </Text>
            {patient?.comorbidities?.length > 0
                ? patient.comorbidities.join(", ")
                : "None"}
          </Text>
          {patient?.comorbidities?.includes("Others") && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Other Comorbidities: </Text>
                {patient?.otherComorbidities || "-"}
              </Text>
          )}
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Dialysis: </Text>
            {patient?.dialysis ? "Yes" : "No"}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Diagnosis: </Text>
            {patient?.confirmedDiagnosis || "-"}
          </Text>
        </View>
        {/*<MedicationList userID={patient.users.$id} />*/}
        {/*<FollowUpList patientId={patient.users.$id} />*/}
      </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  name: {
    fontSize: 18,
    color: "#2C3A59",
    fontWeight: "600",
  },
  email: {
    fontSize: 14,
    color: "#7F8FA6",
    fontWeight: "400",
  },
  details: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: "#7F8FA6",
    fontWeight: "300",
    marginBottom: 4,
  },
  detailLabel: {
    color: "#FF8E01",
    fontWeight: "500",
  },
});

export default PatientCard;
