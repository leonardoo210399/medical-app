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
import { databases } from '../lib/appwrite';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

const MedicationItem = ({ item, onStatusUpdate }) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState('pending');
    const [isUpdating, setIsUpdating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isDescriptionVisible, setDescriptionVisible] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const formattedDate = moment(item.date).format('YYYYMMDD');
                const formattedTime = moment(item.time, ['h:mm A', 'H:mm']).format('HHmm');
                const documentId = `${item.id}-${formattedDate}-${formattedTime}`;
                const document = await databases.getDocument(
                    'HealthManagementDatabaseId',
                    'IntakeRecords',
                    documentId
                );
                if (document && document.status) {
                    setStatus(document.status);
                }
            } catch (error) {
                if (error.code !== 404) {
                    console.error('Error fetching intake status:', error);
                    Alert.alert(t('error'), t('failedToFetchIntakeStatus'));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [item.id, item.date, item.time, t]);

    const handleStatusUpdate = async (newStatus) => {
        setIsUpdating(true);
        try {
            const formattedDate = moment(item.date).format('YYYYMMDD');
            const formattedTime = moment(item.time, ['h:mm A', 'H:mm']).format('HHmm');
            const documentId = `${item.id}-${formattedDate}-${formattedTime}`;

            let documentExists = false;
            try {
                await databases.getDocument(
                    'HealthManagementDatabaseId',
                    'IntakeRecords',
                    documentId
                );
                documentExists = true;
            } catch (error) {
                if (error.code === 404) {
                    documentExists = false;
                } else {
                    throw error;
                }
            }

            if (documentExists) {
                await databases.updateDocument(
                    'HealthManagementDatabaseId',
                    'IntakeRecords',
                    documentId,
                    { status: newStatus }
                );
            } else {
                await databases.createDocument(
                    'HealthManagementDatabaseId',
                    'IntakeRecords',
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

            setStatus(newStatus);
            onStatusUpdate(item.id, formattedDate, formattedTime, newStatus);
        } catch (error) {
            console.error('Error updating intake status:', error);
            setStatus('pending');
            Alert.alert(t('error'), t('failedToUpdateIntakeStatus'));
        } finally {
            setIsUpdating(false);
        }
    };

    const renderDescriptionModal = () => (
        <Modal
            visible={isDescriptionVisible}
            animationType="fade"
            transparent
            onRequestClose={() => setDescriptionVisible(false)}
        >
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{t('description')}</Text>
                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.modalText}>
                            {item.description ? item.description : t('noDescription')}
                        </Text>
                    </ScrollView>
                    <TouchableOpacity
                        onPress={() => setDescriptionVisible(false)}
                        style={styles.closeButton}
                        accessibilityLabel={t('close')}
                        accessibilityRole="button"
                    >
                        <Text style={styles.closeButtonText}>{t('close')}</Text>
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
                <TouchableOpacity
                    onPress={() => setDescriptionVisible(true)}
                    style={styles.infoIcon}
                    accessibilityLabel={t('showDescription')}
                    accessibilityRole="button"
                >
                    <Ionicons name="information-circle-outline" size={20} color="#007BFF" />
                </TouchableOpacity>
            </View>
            <Text style={styles.dosage}>{t('dosage')}: {item.dosage}</Text>
            <Text style={styles.timeText}>{t('time')}: {item.time}</Text>
            <View style={styles.statusContainer}>
                <TouchableOpacity
                    style={[
                        styles.statusButton,
                        status === 'taken' && styles.takenButton,
                    ]}
                    onPress={() => handleStatusUpdate('taken')}
                    disabled={isUpdating || status === 'taken'}
                    accessibilityLabel={t('markAsTaken')}
                    accessibilityRole="button"
                >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.statusText}>{t('taken')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.statusButton,
                        status === 'not_taken' && styles.notTakenButton,
                    ]}
                    onPress={() => handleStatusUpdate('not_taken')}
                    disabled={isUpdating || status === 'not_taken'}
                    accessibilityLabel={t('markAsNotTaken')}
                    accessibilityRole="button"
                >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.statusText}>{t('notTaken')}</Text>
                </TouchableOpacity>
            </View>
            {status !== 'pending' && (
                <Text style={styles.statusLabel}>
                    {t('status')}: {status === 'taken' ? `✅ ${t('taken')}` : `❌ ${t('notTaken')}`}
                </Text>
            )}
            {isUpdating && (
                <ActivityIndicator size="small" color="#00adf5" style={styles.loadingIndicator} />
            )}
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
        flex: 1,
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
        backgroundColor: '#28a745',
    },
    notTakenButton: {
        backgroundColor: '#dc3545',
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
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
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
