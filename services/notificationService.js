// services/notificationService.js
import * as Notifications from 'expo-notifications';
import moment from 'moment';

/**
 * Schedules a local notification for a medication event.
 * @param {Object} medication - The medication object.
 * @param {string} medication.id - Unique identifier for the medication.
 * @param {string} medication.medicineName - Name of the medicine.
 * @param {string} medication.date - Date of the event (e.g., "2024-12-24").
 * @param {string} medication.time - Time of the event (e.g., "08:00 AM").
 * @returns {Promise<string|null>} - The ID of the scheduled notification or null if not scheduled.
 */
export const scheduleMedicationNotification = async (medication) => {
    try {
        const { id, medicineName, date, time } = medication;

        // Combine date and time into a single Date object
        const eventDateTime = moment(`${date} ${time}`, 'YYYY-MM-DD hh:mm A').toDate();

        // Check if the eventDateTime is in the future
        if (eventDateTime <= new Date()) {
            console.log(`Event time for ${medicineName} is in the past. Notification not scheduled.`);
            return null;
        }

        // Schedule the notification
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Medication Reminder',
                body: `It's time to take your medication: ${medicineName}`,
                sound: true,
                data: { medicationId: id },
            },
            trigger: eventDateTime,
        });

        console.log(`Scheduled notification (${notificationId}) for ${medicineName} at ${eventDateTime}`);
        return notificationId;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
};
