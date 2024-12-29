// components/ScheduleFollowUpForm.js

import React, {useState, useEffect} from "react";
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
    Platform,
    TextInput,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from "react-native-modal-datetime-picker";
import {addFollowUp, updateFollowUp} from "../lib/appwrite"; // Import update function
import {useGlobalContext} from '../context/GlobalProvider'; // Adjust the import path as necessary
import {Formik} from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import {Picker} from "@react-native-picker/picker";

const ScheduleFollowUpForm = ({visible, onClose, patient, onSubmit, followUp}) => { // Accept followUp prop
    const {user} = useGlobalContext(); // Assuming the doctor is logged in and available via context
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    // Form Validation Schema using Yup
    const validationSchema = Yup.object().shape({
        type: Yup.string().oneOf(['followup', 'dialysis']).required('Type is required'),
        scheduledDate: Yup.date()
            .required('Scheduled date is required')
            .min(new Date(), 'Scheduled date must be in the future'),
        notes: Yup.string().max(500, 'Notes cannot exceed 500 characters'),
        status: Yup.string().oneOf(['scheduled', 'completed', 'cancelled']).required('Status is required'),
    });

    // Initialize form values based on whether editing or adding
    const initialValues = {
        type: followUp ? followUp.type : 'followup',
        scheduledDate: followUp ? new Date(followUp.scheduledDate) : new Date(),
        notes: followUp ? followUp.notes : '',
        status: followUp ? followUp.status : 'scheduled',
    };

    // Handle form submission
    const handleSubmit = async (values, {resetForm, setSubmitting}) => {
        try {
            const data = {
                doctorId: user.$id,
                patientId: patient?.users?.$id || '', // Ensure patientId is set from props
                type: values.type,
                scheduledDate: values.scheduledDate.toISOString(),
                notes: values.notes,
                status: values.status,
            };

            if (followUp) {
                // Update existing follow-up
                await updateFollowUp(followUp.$id, data);
                Alert.alert("Success", "Follow-up updated successfully.");
            } else {
                // Create new follow-up
                await addFollowUp(data);
                Alert.alert("Success", "Follow-up scheduled successfully.");
            }

            resetForm();
            onSubmit(); // Call the onSubmit handler passed from parent
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
            {/* Backdrop: Closes modal when pressed */}
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalBackground}>
                    {/* Prevent modal content from closing the modal when pressed */}
                    <TouchableWithoutFeedback onPress={() => {
                    }}>
                        <View style={styles.modalContainer}>
                            <ScrollView contentContainerStyle={styles.scrollContainer}
                                        showsVerticalScrollIndicator={false}>
                                <Text
                                    style={styles.title}>{followUp ? "Edit Follow-Up / Dialysis" : "Schedule Follow-Up / Dialysis"}</Text>

                                <Formik
                                    initialValues={initialValues}
                                    validationSchema={validationSchema}
                                    onSubmit={handleSubmit}
                                    enableReinitialize={true} // Reinitialize form when followUp changes
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
                                            <View className="flex-row">
                                                <Text style={styles.label}>Patient Name : </Text>
                                                <Text style={styles.patientName}>{patient?.name || "Unknown"}</Text>
                                            </View>
                                            {/*<View style={styles.patientInfoContainer}>*/}
                                            {/*    <Text style={styles.patientId}>ID: {patient?.users?.$id || "N/A"}</Text>*/}
                                            {/*</View>*/}

                                            {/* Type Picker */}
                                            <Text style={styles.label}>Type *</Text>
                                            <View
                                                style={[styles.pickerContainer, errors.type && touched.type && styles.errorInput]}>
                                                <Picker
                                                    selectedValue={values.type}
                                                    onValueChange={(itemValue) => setFieldValue('type', itemValue)}
                                                    style={styles.picker}
                                                    mode="dropdown"
                                                    accessibilityLabel="Select Follow-Up Type"
                                                >
                                                    <Picker.Item label="Follow-Up" value="followup"/>
                                                    <Picker.Item label="Dialysis" value="dialysis"/>
                                                </Picker>
                                            </View>
                                            {errors.type && touched.type && (
                                                <Text style={styles.errorText}>{errors.type}</Text>
                                            )}

                                            {/* Scheduled Date */}
                                            <Text style={styles.label}>Scheduled Date & Time *</Text>
                                            <TouchableOpacity
                                                onPress={() => setDatePickerVisible(true)}
                                                style={[styles.datePickerButton, errors.scheduledDate && touched.scheduledDate && styles.errorInput]}
                                                accessibilityLabel="Select Date and Time"
                                                accessibilityRole="button"
                                            >
                                                <Text
                                                    style={values.scheduledDate ? styles.datePickerText : styles.placeholderText}>
                                                    {values.scheduledDate ? moment(values.scheduledDate).format('MMMM DD, YYYY h:mm A') : "Select Scheduled Date"}
                                                </Text>
                                                <Ionicons name="calendar" size={20} color="#2C3A59"/>
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
                                                style={[styles.textInput, styles.notesInput, errors.notes && touched.notes && styles.errorInput]}
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

                                            {/* Status Picker */}
                                            <Text style={styles.label}>Status *</Text>
                                            <View
                                                style={[styles.pickerContainer, errors.status && touched.status && styles.errorInput]}>
                                                <Picker
                                                    selectedValue={values.status}
                                                    onValueChange={(itemValue) => setFieldValue('status', itemValue)}
                                                    style={styles.picker}
                                                    mode="dropdown"
                                                    accessibilityLabel="Select Status"
                                                >
                                                    <Picker.Item label="Scheduled" value="scheduled"/>
                                                    <Picker.Item label="Completed" value="completed"/>
                                                    <Picker.Item label="Cancelled" value="cancelled"/>
                                                </Picker>
                                            </View>
                                            {errors.status && touched.status && (
                                                <Text style={styles.errorText}>{errors.status}</Text>
                                            )}

                                            {/* Submit and Cancel Buttons */}
                                            <View style={styles.buttonContainer}>
                                                <TouchableOpacity
                                                    onPress={handleSubmit}
                                                    style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                                                    disabled={isSubmitting}
                                                    accessibilityLabel={followUp ? "Update Follow-Up" : "Submit Follow-Up"}
                                                    accessibilityRole="button"
                                                >
                                                    {isSubmitting ? (
                                                        <ActivityIndicator color="#fff"/>
                                                    ) : (
                                                        <Text
                                                            style={styles.buttonText}>{followUp ? "Update" : "Add"}</Text>
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
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
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
        backgroundColor: "#fff", // Light background for better readability
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
        color: "#2C3A59",
        textAlign: "center",
    },
    label: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 5,
        color: "#2C3A59",
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
        color: "#2C3A59",
        marginBottom:10
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
        color: '#2C3A59',
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
        color: '#2C3A59',
    },
    placeholderText: {
        fontSize: 16,
        color: '#999',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: Platform.OS === 'ios' ? 15 : 10,
        marginBottom: 10,
        minHeight: 80,
        textAlignVertical: 'top', // For Android to align text at the top
        color: '#2C3A59',
    },
    notesInput: {
        height: 80,
    },
    charCount: {
        alignSelf: 'flex-end',
        color: '#7f8c8d',
        fontSize: 12,
        marginBottom: 10,
    },
    errorText: {
        color: "#e74c3c",
        marginBottom: 5,
        fontSize: 12,
    },
    errorInput: {
        borderColor: "#e74c3c",
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
        backgroundColor: "#6c757d",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default ScheduleFollowUpForm;
