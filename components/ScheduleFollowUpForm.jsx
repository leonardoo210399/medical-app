// ScheduleFollowUpForm.js
import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    TextInput,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from "react-native-modal-datetime-picker";
import { addFollowUp } from "../lib/appwrite"; // Ensure this function is correctly implemented
import { useGlobalContext } from '../context/GlobalProvider'; // Adjust the import path as necessary
import { Formik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import {Picker} from "@react-native-picker/picker";

const ScheduleFollowUpForm = ({ visible, onClose, patient, onSubmit }) => {
    console.log(patient)
    const { user } = useGlobalContext(); // Assuming the doctor is logged in and available via context
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    // Determine if the form is pre-filled with a patient
    const isPatientPreSelected = !!patient;

    // Form Validation Schema using Yup
    const validationSchema = Yup.object().shape({
        type: Yup.string().oneOf(['followup', 'dialysis']).required('Type is required'),
        scheduledDate: Yup.date()
            .required('Scheduled date is required')
            .min(new Date(), 'Scheduled date must be in the future'),
        notes: Yup.string().max(500, 'Notes cannot exceed 500 characters'),
    });

    // Handle form submission
    const handleSubmit = async (values, { resetForm, setSubmitting }) => {
        try {
            await addFollowUp({
                doctorId: user.$id,
                patientId: patient?.users?.$id || '', // Ensure patientId is set from props
                type: values.type,
                scheduledDate: values.scheduledDate.toISOString(),
                notes: values.notes,
                status: 'scheduled',
            });
            Alert.alert('Success', `Scheduled ${values.type === 'followup' ? 'Follow-Up' : 'Dialysis'} successfully.`);
            resetForm();
            onSubmit(); // Call the onSubmit handler passed from PatientList
            onClose();
        } catch (error) {
            console.error('Error scheduling follow-up:', error);
            Alert.alert('Error', 'Failed to schedule follow-up. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        <Text style={styles.title}>Schedule Follow-Up / Dialysis</Text>

                        <Formik
                            initialValues={{
                                type: 'followup',
                                scheduledDate: new Date(),
                                notes: '',
                            }}
                            validationSchema={validationSchema}
                            onSubmit={handleSubmit}
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
                                    {/* Display Patient Information */}
                                    <Text style={styles.label}>Patient *</Text>
                                    <View style={styles.patientInfoContainer}>
                                        <Text style={styles.patientName}>{patient?.name || "Unknown"}</Text>
                                        <Text style={styles.patientId}>ID: {patient?.users?.$id || "N/A"}</Text>
                                    </View>

                                    {/* Type Picker */}
                                    <Text style={styles.label}>Type *</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={values.type}
                                            onValueChange={(itemValue) => setFieldValue('type', itemValue)}
                                            style={styles.picker}
                                            mode="dropdown"
                                            accessibilityLabel="Select Type"
                                        >
                                            <Picker.Item label="Follow-Up" value="followup" />
                                            <Picker.Item label="Dialysis" value="dialysis" />
                                        </Picker>
                                    </View>
                                    {errors.type && touched.type && (
                                        <Text style={styles.errorText}>{errors.type}</Text>
                                    )}

                                    {/* Scheduled Date */}
                                    <Text style={styles.label}>Scheduled Date & Time *</Text>
                                    <TouchableOpacity
                                        onPress={() => setDatePickerVisible(true)}
                                        style={styles.datePickerButton}
                                        accessibilityLabel="Select Date and Time"
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.datePickerText}>
                                            {moment(values.scheduledDate).format('MMMM DD, YYYY h:mm A')}
                                        </Text>
                                        <Ionicons name="calendar" size={20} color="#00adf5" />
                                    </TouchableOpacity>
                                    {errors.scheduledDate && touched.scheduledDate && (
                                        <Text style={styles.errorText}>{errors.scheduledDate}</Text>
                                    )}
                                    <DateTimePicker
                                        isVisible={isDatePickerVisible}
                                        mode="datetime"
                                        onConfirm={(date) => {
                                            setDatePickerVisible(false);
                                            setFieldValue('scheduledDate', date);
                                        }}
                                        onCancel={() => setDatePickerVisible(false)}
                                        minimumDate={new Date()}
                                    />

                                    {/* Notes */}
                                    <Text style={styles.label}>Notes</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        multiline
                                        numberOfLines={4}
                                        onChangeText={handleChange('notes')}
                                        onBlur={handleBlur('notes')}
                                        value={values.notes}
                                        placeholder="Enter additional notes (optional)"
                                        maxLength={500}
                                        placeholderTextColor="#999"
                                        accessibilityLabel="Notes Input"
                                    />
                                    {errors.notes && touched.notes && (
                                        <Text style={styles.errorText}>{errors.notes}</Text>
                                    )}
                                    <Text style={styles.charCount}>{values.notes.length}/500</Text>

                                    {/* Submit and Cancel Buttons */}
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            onPress={handleSubmit}
                                            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                                            disabled={isSubmitting}
                                            accessibilityLabel="Submit Schedule"
                                            accessibilityRole="button"
                                        >
                                            {isSubmitting ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.buttonText}>Schedule</Text>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={onClose}
                                            style={styles.cancelButton}
                                            accessibilityLabel="Cancel Schedule"
                                            accessibilityRole="button"
                                        >
                                            <Text style={styles.buttonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </Formik>
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
        padding: 20,
    },
    modalContainer: {
        backgroundColor: "#fff", // Light background
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
        color: "#333",
        textAlign: "center",
    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        color: "#333",
    },
    patientInfoContainer: {
        backgroundColor: "#f9f9f9",
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
    },
    patientName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    patientId: {
        fontSize: 14,
        color: "#666",
        marginTop: 5,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 15,
        marginBottom: 10,
    },
    datePickerText: {
        fontSize: 16,
        color: '#333',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: Platform.OS === 'ios' ? 15 : 10,
        marginBottom: 10,
        minHeight: 80,
        textAlignVertical: 'top', // For Android to align text at the top
        color: '#333',
    },
    charCount: {
        alignSelf: 'flex-end',
        color: '#999',
        fontSize: 12,
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    submitButton: {
        backgroundColor: "#28a745",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: "#dc3545",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        flex: 1,
        marginLeft: 10,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: "#6c757d",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    errorText: {
        color: "#ff5c5c",
        marginBottom: 5,
    },
});

export default ScheduleFollowUpForm;
