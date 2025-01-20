import React, { useState, useEffect, useMemo } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePicker from "react-native-modal-datetime-picker";
import { addFollowUp, updateFollowUp } from "../lib/appwrite"; // Import update function
import { useGlobalContext } from "../context/GlobalProvider"; // Adjust the import path as necessary
import { Formik } from "formik";
import * as Yup from "yup";
import moment from "moment";
import { Picker } from "@react-native-picker/picker";

const ScheduleFollowUpForm = ({ visible, onClose, patient, onSubmit, followUp }) => {
    const { user } = useGlobalContext(); // Assuming the doctor is logged in and available via context
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    // Validation Schema
    const validationSchema = Yup.object().shape({
        type: Yup.string().oneOf(["followup", "dialysis"]).required("Type is required"),
        scheduledDate: Yup.date()
            .required("Scheduled date is required")
            .min(new Date(), "Scheduled date must be in the future"),
        notes: Yup.string().max(500, "Notes cannot exceed 500 characters"),
        status: Yup.string()
            .oneOf(["scheduled", "completed", "cancelled"])
            .required("Status is required"),
    });

    // Memoize initial values to prevent unnecessary resets
    const initialValues = useMemo(() => ({
        type: followUp?.type || "followup",
        scheduledDate: followUp ? new Date(followUp.scheduledDate) : new Date(),
        notes: followUp?.notes || "",
        status: followUp?.status || "scheduled",
    }), [followUp]);

    // Handle Form Submission
    const handleSubmit = async (values, { resetForm, setSubmitting }) => {
        try {
            const data = {
                doctorId: user.$id,
                patientId: patient?.users?.$id || "", // Ensure patientId is set from props
                type: values.type,
                scheduledDate: values.scheduledDate.toISOString(),
                notes: values.notes,
                status: values.status,
            };

            if (followUp) {
                await updateFollowUp(followUp.$id, data); // Update follow-up
                Alert.alert("Success", "Follow-up updated successfully.");
            } else {
                await addFollowUp(data); // Add new follow-up
                Alert.alert("Success", "Follow-up scheduled successfully.");
            }

            resetForm();
            onSubmit(); // Notify parent component
            onClose(); // Close modal
        } catch (error) {
            console.error("Error scheduling follow-up:", error);
            Alert.alert("Error", "Failed to schedule follow-up. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalBackground}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                            <ScrollView contentContainerStyle={styles.scrollContainer}>
                                <Text style={styles.title}>
                                    {followUp ? "Edit Follow-Up / Dialysis" : "Schedule Follow-Up / Dialysis"}
                                </Text>

                                <Formik
                                    initialValues={initialValues}
                                    validationSchema={validationSchema}
                                    onSubmit={handleSubmit}
                                    enableReinitialize={true}
                                >
                                    {({
                                          handleChange,
                                          handleBlur,
                                          handleSubmit,
                                          setFieldValue,
                                          values,
                                          errors,
                                          touched,
                                          isSubmitting,
                                      }) => (
                                        <View>
                                            {/* Patient Name */}
                                            <Text style={styles.label}>Patient Name:</Text>
                                            <Text style={styles.patientName}>
                                                {patient?.name || "Unknown"}
                                            </Text>

                                            {/* Type Picker */}
                                            <Text style={styles.label}>Type *</Text>
                                            <View style={[styles.pickerContainer, touched.type && errors.type && styles.errorInput]}>
                                                <Picker
                                                    selectedValue={values.type}
                                                    onValueChange={(itemValue) => setFieldValue("type", itemValue)}
                                                    style={styles.picker}
                                                >
                                                    <Picker.Item label="Follow-Up" value="followup" />
                                                    <Picker.Item label="Dialysis" value="dialysis" />
                                                </Picker>
                                            </View>
                                            {touched.type && errors.type && <Text style={styles.errorText}>{errors.type}</Text>}

                                            {/* Date Picker */}
                                            <Text style={styles.label}>Scheduled Date & Time *</Text>
                                            <TouchableOpacity
                                                onPress={() => setDatePickerVisible(true)}
                                                style={[styles.datePickerButton, touched.scheduledDate && errors.scheduledDate && styles.errorInput]}
                                            >
                                                <Text style={values.scheduledDate ? styles.datePickerText : styles.placeholderText}>
                                                    {values.scheduledDate
                                                        ? moment(values.scheduledDate).format("MMMM DD, YYYY h:mm A")
                                                        : "Select Scheduled Date"}
                                                </Text>
                                                <Ionicons name="calendar" size={20} color="#2C3A59" />
                                            </TouchableOpacity>
                                            {touched.scheduledDate && errors.scheduledDate && (
                                                <Text style={styles.errorText}>{errors.scheduledDate}</Text>
                                            )}
                                            <DateTimePicker
                                                isVisible={isDatePickerVisible}
                                                mode="datetime"
                                                onConfirm={(date) => {
                                                    setDatePickerVisible(false);
                                                    setFieldValue("scheduledDate", date);
                                                }}
                                                onCancel={() => setDatePickerVisible(false)}
                                                minimumDate={new Date()}
                                            />

                                            {/* Notes */}
                                            <Text style={styles.label}>Notes</Text>
                                            <TextInput
                                                style={[styles.textInput, styles.notesInput, touched.notes && errors.notes && styles.errorInput]}
                                                multiline
                                                numberOfLines={4}
                                                onChangeText={handleChange("notes")}
                                                onBlur={handleBlur("notes")}
                                                value={values.notes}
                                                placeholder="Enter additional notes (optional)"
                                                maxLength={500}
                                            />
                                            {touched.notes && errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}

                                            {/* Status Picker */}
                                            <Text style={styles.label}>Status *</Text>
                                            <View style={[styles.pickerContainer, touched.status && errors.status && styles.errorInput]}>
                                                <Picker
                                                    selectedValue={values.status}
                                                    onValueChange={(itemValue) => setFieldValue("status", itemValue)}
                                                    style={styles.picker}
                                                >
                                                    <Picker.Item label="Scheduled" value="scheduled" />
                                                    <Picker.Item label="Completed" value="completed" />
                                                    <Picker.Item label="Cancelled" value="cancelled" />
                                                </Picker>
                                            </View>
                                            {touched.status && errors.status && <Text style={styles.errorText}>{errors.status}</Text>}

                                            {/* Submit and Cancel Buttons */}
                                            <View style={styles.buttonContainer}>
                                                <TouchableOpacity
                                                    onPress={handleSubmit}
                                                    style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <ActivityIndicator color="#fff" />
                                                    ) : (
                                                        <Text style={styles.buttonText}>
                                                            {followUp ? "Update" : "Add"}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                                                    <Text style={styles.buttonText}>Cancel</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </Formik>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
        maxHeight: "90%",
    },
    scrollContainer: { paddingBottom: 20 },
    title: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
    label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
    patientName: { fontSize: 16, marginBottom: 10, color: "#2C3A59" },
    pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, marginBottom: 10 },
    picker: { height: 50, color: "#2C3A59" },
    datePickerButton: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 15, marginBottom: 10 },
    datePickerText: { fontSize: 16, color: "#2C3A59" },
    placeholderText: { fontSize: 16, color: "#999" },
    textInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginBottom: 10, minHeight: 80, textAlignVertical: "top" },
    notesInput: { height: 80 },
    errorText: { color: "#e74c3c", fontSize: 12, marginBottom: 5 },
    buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
    submitButton: { backgroundColor: "#2980B9", padding: 15, borderRadius: 10, flex: 1, marginRight: 10, alignItems: "center" },
    cancelButton: { backgroundColor: "#95a5a6", padding: 15, borderRadius: 10, flex: 1, marginLeft: 10, alignItems: "center" },
    disabledButton: { backgroundColor: "#6c757d" },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

export default ScheduleFollowUpForm;
