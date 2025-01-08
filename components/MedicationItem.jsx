import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databases } from '../lib/appwrite'; // Adjust the import path as needed
import moment from 'moment';

const MedicationItem = ({ item, onStatusUpdate }) => {
    // console.log("item",item);
    const [status, setStatus] = useState('pending'); // Default to 'pending'
    const [isUpdating, setIsUpdating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isDescriptionVisible, setDescriptionVisible] = useState(false); // New state for description modal

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const formattedDate = moment(item.date).format('YYYYMMDD');
                const formattedTime = moment(item.time, ['h:mm A', 'H:mm']).format('HHmm');
                const documentId = `${item.id}-${formattedDate}-${formattedTime}`;

                const document = await databases.getDocument(
                    'HealthManagementDatabaseId', // Replace with your actual Database ID
                    'IntakeRecords',             // Replace with your Intake Records Collection ID
                    documentId
                );

                if (document && document.status) {
                    setStatus(document.status);
                }
            } catch (error) {
                if (error.code !== 404) { // Ignore if document doesn't exist
                    console.error('Error fetching intake status:', error);
                    Alert.alert('Error', 'Failed to fetch intake status.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [item.id, item.date, item.time]);

    /**
     * Handles updating the intake status.
     * @param {string} newStatus - The new status ('taken' or 'not_taken').
     */
    const handleStatusUpdate = async (newStatus) => {
        setIsUpdating(true);
        try {
            const formattedDate = moment(item.date).format('YYYYMMDD');
            const formattedTime = moment(item.time, ['h:mm A', 'H:mm']).format('HHmm');
            const documentId = `${item.id}-${formattedDate}-${formattedTime}`;

            // Attempt to fetch the document to check if it exists
            let documentExists = false;
            try {
                await databases.getDocument(
                    'HealthManagementDatabaseId', // Replace with your actual Database ID
                    'IntakeRecords',             // Replace with your Intake Records Collection ID
                    documentId
                );
                documentExists = true;
            } catch (error) {
                if (error.code === 404) {
                    documentExists = false;
                } else {
                    throw error; // Re-throw if it's not a 404 error
                }
            }

            if (documentExists) {
                // Update the existing document's status
                await databases.updateDocument(
                    'HealthManagementDatabaseId', // Replace with your actual Database ID
                    'IntakeRecords',             // Replace with your Intake Records Collection ID
                    documentId,
                    {
                        status: newStatus,
                    }
                );
            } else {
                // Create a new document with the specified documentId
                await databases.createDocument(
                    'HealthManagementDatabaseId', // Replace with your actual Database ID
                    'IntakeRecords',             // Replace with your Intake Records Collection ID
                    documentId,
                    {
                        medications: item.id,
                        users: item.userId,
                        date: formattedDate,
                        time: formattedTime,
                        status: newStatus,
                    }
                );
            }

            // Update local state and notify parent component
            setStatus(newStatus);
            onStatusUpdate(item.id, formattedDate, formattedTime, newStatus);

            // Provide user feedback
            // Alert.alert('Success', `Marked as ${newStatus === 'taken' ? 'Taken' : 'Not Taken'}`);
        } catch (error) {
            console.error('Error updating intake status:', error);
            // Revert local state if backend update fails
            setStatus('pending');
            Alert.alert('Error', 'Failed to update intake status. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    /**
     * Renders the description modal.
     */
    const renderDescriptionModal = () => (
        <Modal
            visible={isDescriptionVisible}
            animationType="fade"
            transparent
            onRequestClose={() => setDescriptionVisible(false)}
        >
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Description</Text>
                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.modalText}>
                            {item.description ? item.description : 'No description available.'}
                        </Text>
                    </ScrollView>
                    <TouchableOpacity
                        onPress={() => setDescriptionVisible(false)}
                        style={styles.closeButton}
                        accessibilityLabel="Close Description"
                        accessibilityRole="button"
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.itemContainer}>
                <ActivityIndicator size="small" color="#00adf5" />
            </View>
        );
    }

    return (
        <View style={styles.itemContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.medicineName}>{item.medicineName}</Text>
                {/* Info Icon */}
                <TouchableOpacity
                    onPress={() => setDescriptionVisible(true)}
                    style={styles.infoIcon}
                    accessibilityLabel="Show Description"
                    accessibilityRole="button"
                >
                    <Ionicons name="information-circle-outline" size={20} color="#007BFF" />
                </TouchableOpacity>
            </View>
            <Text style={styles.dosage}>Dosage: {item.dosage}</Text>
            <Text style={styles.timeText}>Time: {item.time}</Text>
            <View style={styles.statusContainer}>
                <TouchableOpacity
                    style={[
                        styles.statusButton,
                        status === 'taken' && styles.takenButton,
                    ]}
                    onPress={() => handleStatusUpdate('taken')}
                    disabled={isUpdating || status === 'taken'}
                    accessibilityLabel="Mark as Taken"
                    accessibilityRole="button"
                >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.statusText}>Taken</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.statusButton,
                        status === 'not_taken' && styles.notTakenButton,
                    ]}
                    onPress={() => handleStatusUpdate('not_taken')}
                    disabled={isUpdating || status === 'not_taken'}
                    accessibilityLabel="Mark as Not Taken"
                    accessibilityRole="button"
                >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.statusText}>Not Taken</Text>
                </TouchableOpacity>
            </View>
            {status !== 'pending' && (
                <Text style={styles.statusLabel}>
                    Status: {status === 'taken' ? '✅ Taken' : '❌ Not Taken'}
                </Text>
            )}
            {isUpdating && (
                <ActivityIndicator size="small" color="#00adf5" style={styles.loadingIndicator} />
            )}
            {/* Description Modal */}
            {renderDescriptionModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        backgroundColor: '#ffffff',
        padding: 15,
        marginRight: 10,
        marginTop: 17,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    medicineName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        flex: 1, // Takes up remaining space
    },
    infoIcon: {
        padding: 4,
    },
    dosage: {
        fontSize: 14,
        marginBottom: 5,
        color: '#555555',
    },
    timeText: {
        fontSize: 14,
        marginBottom: 10,
        color: '#555555',
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00adf5',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginRight: 5,
    },
    takenButton: {
        backgroundColor: '#28a745', // Green color for "Taken"
    },
    notTakenButton: {
        backgroundColor: '#dc3545', // Red color for "Not Taken"
        marginRight: 0,
        marginLeft: 5,
    },
    statusText: {
        color: '#fff',
        marginLeft: 5,
        fontSize: 14,
    },
    statusLabel: {
        marginTop: 10,
        fontSize: 14,
        color: '#333333',
    },
    loadingIndicator: {
        marginTop: 10,
    },
    // Modal Styles
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)", // Semi-transparent background
        justifyContent: "center",
        padding: 20
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#333",
        textAlign: "center",
    },
    modalContent: {
        marginBottom: 20,
    },
    modalText: {
        fontSize: 16,
        color: '#555',
    },
    closeButton: {
        backgroundColor: "#007BFF",
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default MedicationItem;
