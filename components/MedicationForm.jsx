// components/MedicationForm.jsx

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { addMedication, updatePatientMedication } from "../lib/appwrite"; // Import update function
import FormField from "./FormField"; // Adjust the import path as necessary
import Icon from 'react-native-vector-icons/Ionicons'; // Ensure Ionicons is installed
import DateTimePicker from "react-native-modal-datetime-picker";
import moment from "moment"; // Ensure moment is installed

const MedicationForm = ({ visible, onClose, onSubmit, patientId, medication }) => {
  // State management
  const [formData, setFormData] = useState({
    medicineName: "",
    startDate: null, // ISO string
    endDate: null,   // ISO string
    frequency: "daily",
    dailyTimes: "1",
    intervalType: "hours",
    intervalValue: "1",
    specificDays: [],
    cyclicIntakeDays: "21",
    cyclicPauseDays: "7",
    times: [], // Array of formatted time strings e.g., "08:00 AM"
    dosage: "",
    onDemand: false,
    description: "", // New field added
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  // Populate form data when editing a medication
  useEffect(() => {
    if (medication) {
      setFormData({
        medicineName: medication.medicineName || "",
        startDate: medication.startDate ? moment(medication.startDate).format("YYYY-MM-DD") : null,
        endDate: medication.endDate ? moment(medication.endDate).format("YYYY-MM-DD") : null,
        frequency: medication.frequency || "daily",
        dailyTimes: medication.dailyTimes ? String(medication.dailyTimes) : "1",
        intervalType: medication.intervalType || "hours",
        intervalValue: medication.intervalValue ? String(medication.intervalValue) : "1",
        specificDays: Array.isArray(medication.specificDays) ? medication.specificDays : [],
        cyclicIntakeDays: medication.cyclicIntakeDays ? String(medication.cyclicIntakeDays) : "21",
        cyclicPauseDays: medication.cyclicPauseDays ? String(medication.cyclicPauseDays) : "7",
        times: Array.isArray(medication.times) ? medication.times : [],
        dosage: medication.dosage || "",
        onDemand: medication.onDemand || false,
        description: medication.description || "",
      });
    } else {
      // Reset form when not editing
      setFormData({
        medicineName: "",
        startDate: null,
        endDate: null,
        frequency: "daily",
        dailyTimes: "1",
        intervalType: "hours",
        intervalValue: "1",
        specificDays: [],
        cyclicIntakeDays: "21",
        cyclicPauseDays: "7",
        times: [],
        dosage: "",
        onDemand: false,
        description: "",
      });
    }
    setErrors({});
  }, [medication]);

  // Function to update form fields
  const updateField = (field, value) => {
    // If the field is description, enforce max length
    if (field === "description") {
      if (value.length > 1000) {
        Alert.alert("Character Limit", "Description cannot exceed 1000 characters.");
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear errors for the field as user modifies it
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Function to validate form fields
  const validate = () => {
    const newErrors = {};
    if (!formData.medicineName.trim()) {
      newErrors.medicineName = "Medicine name is required.";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required.";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required.";
    }
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = "End date cannot be before start date.";
    }
    if (formData.frequency === "daily" && (!formData.dailyTimes || parseInt(formData.dailyTimes, 10) < 1)) {
      newErrors.dailyTimes = "Please enter a valid number of times.";
    }
    if (formData.frequency === "interval" && (!formData.intervalValue || parseInt(formData.intervalValue, 10) < 1)) {
      newErrors.intervalValue = "Please enter a valid interval value.";
    }
    if (formData.frequency === "specificDays" && formData.specificDays.length === 0) {
      newErrors.specificDays = "Please select at least one day.";
    }
    if (formData.frequency === "cyclic" && (!formData.cyclicIntakeDays || parseInt(formData.cyclicIntakeDays, 10) < 1)) {
      newErrors.cyclicIntakeDays = "Please enter a valid number of intake days.";
    }
    if (formData.frequency === "cyclic" && (!formData.cyclicPauseDays || parseInt(formData.cyclicPauseDays, 10) < 1)) {
      newErrors.cyclicPauseDays = "Please enter a valid number of pause days.";
    }
    if (!formData.dosage.trim()) {
      newErrors.dosage = "Dosage is required.";
    }
    if (formData.frequency !== "onDemand" && formData.times.length === 0) {
      newErrors.times = "Please add at least one time.";
    }
    if (formData.description.length > 1000) {
      newErrors.description = "Description cannot exceed 1000 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to handle adding a new time
  const handleAddTime = (selectedTime) => {
    const formattedTime = formatTime(selectedTime);
    if (!formData.times.includes(formattedTime)) {
      setFormData((prev) => ({ ...prev, times: [...prev.times, formattedTime] }));
    } else {
      Alert.alert("Duplicate Time", "This time has already been added.");
    }
  };

  // Function to remove a time
  const handleRemoveTime = (timeToRemove) => {
    setFormData((prev) => ({ ...prev, times: prev.times.filter((time) => time !== timeToRemove) }));
  };

  // Function to handle specific day selection
  const handleToggleSpecificDay = (day) => {
    setFormData((prev) => {
      const updatedDays = prev.specificDays.includes(day)
          ? prev.specificDays.filter((d) => d !== day)
          : [...prev.specificDays, day];
      return { ...prev, specificDays: updatedDays };
    });
    // Clear specificDays error if any
    setErrors((prev) => ({ ...prev, specificDays: null }));
  };

  // Function to format time
  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert to 12-hour format
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse necessary fields to integers
      const data = {
        medicineName: formData.medicineName,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        frequency: formData.frequency,
        dosage: formData.dosage,
        onDemand: formData.onDemand,
        description: formData.description, // Include description
        userMedication: patientId,
      };

      // Conditionally add fields based on frequency
      if (formData.frequency === "daily") {
        data.dailyTimes = parseInt(formData.dailyTimes, 10);
      } else if (formData.frequency === "interval") {
        data.intervalType = formData.intervalType;
        data.intervalValue = parseInt(formData.intervalValue, 10);
      } else if (formData.frequency === "specificDays") {
        data.specificDays = formData.specificDays;
      } else if (formData.frequency === "cyclic") {
        data.cyclicIntakeDays = parseInt(formData.cyclicIntakeDays, 10);
        data.cyclicPauseDays = parseInt(formData.cyclicPauseDays, 10);
      }

      // Always include times if frequency is not onDemand
      if (formData.frequency !== "onDemand") {
        data.times = formData.times; // Assuming Appwrite accepts array of strings for times
      }

      if (medication) {
        // Update existing medication
        await updatePatientMedication(medication.$id, data);
        Alert.alert("Success", "Medication updated successfully.");
      } else {
        // Create new medication
        await addMedication(data);
        Alert.alert("Success", "Medication added successfully.");
      }
      onSubmit();
      onClose();
      // Reset form
      setFormData({
        medicineName: "",
        startDate: null,
        endDate: null,
        frequency: "daily",
        dailyTimes: "1",
        intervalType: "hours",
        intervalValue: "1",
        specificDays: [],
        cyclicIntakeDays: "21",
        cyclicPauseDays: "7",
        times: [],
        dosage: "",
        onDemand: false,
        description: "",
      });
      setErrors({});
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "There was an error submitting the medication. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>{medication ? "Edit Medication" : "Add Medication"}</Text>

              {/* Medicine Name */}
              <FormField
                  title="Medicine Name *"
                  value={formData.medicineName}
                  placeholder="Enter medicine name"
                  handleChangeText={(text) => updateField("medicineName", text)}
                  type="string"
                  error={errors.medicineName}
              />

              {/* Start Date */}
              <FormField
                  title="Start Date *"
                  value={formData.startDate}
                  placeholder="Select start date"
                  handleChangeText={(date) => updateField("startDate", date)}
                  type="date"
                  error={errors.startDate}
              />

              {/* End Date */}
              <FormField
                  title="End Date *"
                  value={formData.endDate}
                  placeholder="Select end date"
                  handleChangeText={(date) => updateField("endDate", date)}
                  type="date"
                  error={errors.endDate}
              />

              {/* Frequency Picker */}
              <FormField
                  title="Frequency *"
                  value={formData.frequency}
                  handleChangeText={(value) => updateField("frequency", value)}
                  type="dropdown"
                  options={[
                    { label: "Daily, X times a day", value: "daily" },
                    { label: "Interval (X hours/days)", value: "interval" },
                    { label: "Specific days of the week", value: "specificDays" },
                    { label: "Cyclic mode (X days intake/pause)", value: "cyclic" },
                    { label: "On demand (no reminders)", value: "onDemand" },
                  ]}
              />

              {/* Conditional Frequency Fields */}
              {formData.frequency === "daily" && (
                  <FormField
                      title="Number of times a day *"
                      value={formData.dailyTimes}
                      placeholder="Enter number"
                      handleChangeText={(text) => updateField("dailyTimes", text)}
                      type="number"
                      error={errors.dailyTimes}
                  />
              )}

              {formData.frequency === "interval" && (
                  <>
                    <FormField
                        title="Interval Type *"
                        value={formData.intervalType}
                        handleChangeText={(value) => updateField("intervalType", value)}
                        type="dropdown"
                        options={[
                          { label: "Every X hours", value: "hours" },
                          { label: "Every X days", value: "days" },
                        ]}
                    />
                    <FormField
                        title={`Interval (${formData.intervalType}) *`}
                        value={formData.intervalValue}
                        placeholder={`Enter interval in ${formData.intervalType}`}
                        handleChangeText={(text) => updateField("intervalValue", text)}
                        type="number"
                        error={errors.intervalValue}
                    />
                  </>
              )}

              {formData.frequency === "specificDays" && (
                  <View style={styles.specificDaysContainer}>
                    <Text style={styles.label}>Select Days *</Text>
                    <View style={styles.daysContainer}>
                      {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                          <TouchableOpacity
                              key={day}
                              onPress={() => handleToggleSpecificDay(day)}
                              style={[
                                styles.dayButton,
                                formData.specificDays.includes(day) && styles.selectedDayButton,
                              ]}
                              accessibilityLabel={`Select ${day}`}
                              accessibilityRole="button"
                          >
                            <Text
                                style={[
                                  styles.dayText,
                                  formData.specificDays.includes(day) && styles.selectedDayText,
                                ]}
                            >
                              {day.slice(0, 3)}
                            </Text>
                          </TouchableOpacity>
                      ))}
                    </View>
                    {errors.specificDays && <Text style={styles.errorText}>{errors.specificDays}</Text>}
                  </View>
              )}

              {formData.frequency === "cyclic" && (
                  <>
                    <FormField
                        title="Intake Days *"
                        value={formData.cyclicIntakeDays}
                        placeholder="Enter number of intake days"
                        handleChangeText={(text) => updateField("cyclicIntakeDays", text)}
                        type="number"
                        error={errors.cyclicIntakeDays}
                    />
                    <FormField
                        title="Pause Days *"
                        value={formData.cyclicPauseDays}
                        placeholder="Enter number of pause days"
                        handleChangeText={(text) => updateField("cyclicPauseDays", text)}
                        type="number"
                        error={errors.cyclicPauseDays}
                    />
                  </>
              )}

              {formData.frequency === "onDemand" && (
                  <FormField
                      title="On Demand?"
                      value={formData.onDemand}
                      handleChangeText={(value) => updateField("onDemand", value)}
                      type="boolean"
                  />
              )}

              {/* Times */}
              {formData.frequency !== "onDemand" && (
                  <View style={styles.timesContainer}>
                    <Text style={styles.label}>Times *</Text>
                    {errors.times && <Text style={styles.errorText}>{errors.times}</Text>}
                    <FlatList
                        data={formData.times}
                        keyExtractor={(item, index) => `${item}-${index}`}
                        renderItem={({ item }) => (
                            <View style={styles.timeItemContainer}>
                              <Text style={styles.timeItem}>{item}</Text>
                              <TouchableOpacity
                                  onPress={() => handleRemoveTime(item)}
                                  style={styles.removeTimeButton}
                                  accessibilityLabel={`Remove time ${item}`}
                                  accessibilityRole="button"
                              >
                                <Icon name="close-circle" size={24} color="#ff5c5c" />
                              </TouchableOpacity>
                            </View>
                        )}
                        horizontal
                        contentContainerStyle={styles.timesList}
                        showsHorizontalScrollIndicator={false}
                    />
                    <TouchableOpacity
                        onPress={() => setTimePickerVisible(true)}
                        style={styles.addTimeButton}
                        accessibilityLabel="Add Time"
                        accessibilityRole="button"
                    >
                      <Icon name="add-circle" size={36} color="#007BFF" />
                    </TouchableOpacity>

                    {/* Time Picker */}
                    <DateTimePicker
                        isVisible={isTimePickerVisible}
                        mode="time"
                        onConfirm={(time) => {
                          handleAddTime(time);
                          setTimePickerVisible(false);
                        }}
                        onCancel={() => setTimePickerVisible(false)}
                    />
                  </View>
              )}

              {/* Dosage */}
              <FormField
                  title="Dosage *"
                  value={formData.dosage}
                  placeholder="Enter dosage"
                  handleChangeText={(text) => updateField("dosage", text)}
                  type="string"
                  error={errors.dosage}
              />

              {/* Description */}
              <FormField
                  title="Description"
                  value={formData.description}
                  placeholder="Enter additional information (max 1000 characters)"
                  handleChangeText={(text) => updateField("description", text)}
                  type="multiline" // Ensure FormField can handle multiline input
                  maxLength={1000}
                  error={errors.description}
                  // Optionally, you can add a character count
                  additionalComponent={
                    <Text style={styles.charCount}>{formData.description.length}/1000</Text>
                  }
              />

              {/* Submit and Cancel */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                    onPress={handleSubmit}
                    style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                    disabled={isSubmitting}
                    accessibilityLabel="Submit Medication"
                    accessibilityRole="button"
                >
                  {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                  ) : (
                      <Text style={styles.buttonText}>{medication ? "Update" : "Add"}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onClose}
                    style={styles.cancelButton}
                    accessibilityLabel="Cancel"
                    accessibilityRole="button"
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Semi-transparent background
    justifyContent: "center",
    padding: 20
  },
  modalContainer: {
    backgroundColor: "#1e1e1e", // Light background for better readability
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#fff",
  },
  specificDaysContainer: {
    marginBottom: 15,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 5
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#2C3A59'
  },
  selectedDayButton: {
    backgroundColor: "#2C3A59",
    borderColor: "#2C3A59"
  },
  dayText: {
    fontWeight: "bold",
    color: '#2C3A59'
  },
  selectedDayText: {
    color: "#fff"
  },
  timesContainer: {
    marginBottom: 15,
  },
  timesList: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  timeItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: '#2C3A59',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  timeItem: {
    fontSize: 16,
    color: '#fff',
    marginRight: 8,
  },
  removeTimeButton: {
    padding: 4,
  },
  addTimeButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#2980B9",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: "#95a5a6",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: "#7f8c8d",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#e74c3c",
    marginTop: 5,
  },
  charCount: {
    alignSelf: 'flex-end',
    color: '#7f8c8d',
    fontSize: 12,
    marginTop: 4,
  },
});

export default MedicationForm;
