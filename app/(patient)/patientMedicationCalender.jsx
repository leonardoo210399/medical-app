import React, { useCallback, useEffect, useState, memo } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases, Query } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import { Agenda } from 'react-native-calendars';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import MedicationItem from '../../components/MedicationItem';


// const MedicationItem = memo(({ item }) => (
//     <View style={styles.itemContainer}>
//         <Text style={styles.medicineName}>{item?.medicineName}</Text>
//         <Text style={styles.dosage}>
//             Dosage: {item?.dosage}
//         </Text>
//         <Text style={styles.timeText}>Time: {item?.time}</Text>
//         <Text style={styles.dateRange}>
//             {item?.formattedStartDate} - {item?.formattedEndDate}
//         </Text>
//     </View>
// ), (prevProps, nextProps) => prevProps.item === nextProps.item);

const PatientMedicationCalender = () => {
    const { user } = useGlobalContext();

    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState({});
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const refetch = async () => {
        try {
            setRefreshing(true);
            await init();
        } catch (error) {
            console.error('Error during refetch:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        refetch();
    }, []);

    const init = async () => {
        try {
            setLoading(true);
            const dbResponse = await databases.listDocuments(
                'HealthManagementDatabaseId', // Replace with actual Database ID
                'MedicationsCollectionId',    // Replace with actual Collection ID
                [Query.equal('userMedication', user.$id)]
            );
            const fetchedMedications = dbResponse.documents || [];
            setMedications(fetchedMedications);
            processMedications(fetchedMedications);
        } catch (error) {
            console.error('Error fetching patient data:', error);
            setMedications([]);
            setItems({});
        } finally {
            setLoading(false);
        }
    };

    /**
     * Utility: Add an event to items
     */
    const addEvent = (itemsObj, dateStr, med, time) => {
        if (!itemsObj[dateStr]) {
            itemsObj[dateStr] = [];
        }
        itemsObj[dateStr].push({
            id: `${med.$id}-${dateStr}-${time}`,
            medicineName: med.medicineName,
            dosage: med.dosage,
            time: time,
            formattedStartDate: moment(med.startDate).format('MMM DD, YYYY'),
            formattedEndDate: moment(med.endDate).format('MMM DD, YYYY'),
        });
    };

    /**
     * For interval frequency (days), we need to check if a given day should have medication.
     */
    const isIntervalDay = (dayIndex, intervalValue) => {
        // If dayIndex starts from 0 at startDate, medication day if dayIndex % intervalValue == 0
        return (dayIndex % intervalValue) === 0;
    };

    /**
     * Process medications based on their frequency and populate the agenda items.
     */
    const processMedications = (medicationsList) => {
        const updatedItems = {};

        medicationsList.forEach((med) => {
            const start = moment(med.startDate).startOf('day');
            const end = moment(med.endDate).startOf('day');

            const frequency = med.frequency;
            // Use provided times or fallback
            let times = Array.isArray(med.times) && med.times.length > 0 ? med.times : null;
            const defaultTime = "08:00";

            // Convert specificDays to a consistent format
            const specificDays = Array.isArray(med.specificDays)
                ? med.specificDays.map(d => d.toLowerCase())
                : [];

            switch (frequency) {
                case 'daily': {
                    // Daily frequency: take every day
                    let dailyTimesCount = med.dailyTimes || (times ? times.length : 1);
                    let dailyTimesArray = times ? times : Array(dailyTimesCount).fill(defaultTime);

                    const current = start.clone();
                    while (current.isSameOrBefore(end)) {
                        const dateStr = current.format('YYYY-MM-DD');
                        dailyTimesArray.forEach((t) => {
                            addEvent(updatedItems, dateStr, med, t);
                        });
                        current.add(1, 'day');
                    }
                    break;
                }

                case 'interval': {
                    // Interval can be hours or days
                    const intervalType = med.intervalType;
                    const intervalValue = med.intervalValue || 1;

                    if (intervalType === 'hours') {
                        // For hours, start from the first provided time in times[], or default if none provided
                        const initialTime = times ? times[0] : defaultTime;
                        // Construct a starting datetime from startDate with initialTime
                        let startDateTime = moment(med.startDate);
                        const [hour, minute] = initialTime.split(':').map(Number);
                        startDateTime.set({ hour, minute, second: 0 });

                        let current = startDateTime.clone();
                        while (current.isSameOrBefore(end, 'day') || current.isSameOrBefore(end)) {
                            const dateStr = current.format('YYYY-MM-DD');
                            const timeStr = current.format('HH:mm');
                            addEvent(updatedItems, dateStr, med, timeStr);
                            current.add(intervalValue, 'hours');
                            // Stop if we exceed the end date
                            if (current.isAfter(end.endOf('day'))) break;
                        }
                    } else if (intervalType === 'days') {
                        // Every X days
                        let dayIndex = 0;
                        let current = start.clone();
                        let dayTimes = times ? times : [defaultTime];

                        while (current.isSameOrBefore(end)) {
                            if (isIntervalDay(dayIndex, intervalValue)) {
                                const dateStr = current.format('YYYY-MM-DD');
                                dayTimes.forEach((t) => {
                                    addEvent(updatedItems, dateStr, med, t);
                                });
                            }
                            current.add(1, 'day');
                            dayIndex++;
                        }
                    }
                    break;
                }

                case 'specificDays': {
                    // Certain weekdays only
                    const dayTimes = times ? times : [defaultTime];
                    const current = start.clone();
                    while (current.isSameOrBefore(end)) {
                        const weekday = current.format('dddd').toLowerCase();
                        if (specificDays.includes(weekday)) {
                            const dateStr = current.format('YYYY-MM-DD');
                            dayTimes.forEach((t) => {
                                addEvent(updatedItems, dateStr, med, t);
                            });
                        }
                        current.add(1, 'day');
                    }
                    break;
                }

                case 'cyclic': {
                    // Cycle of intakeDays then pauseDays
                    const intakeDays = med.cyclicIntakeDays || 0;
                    const pauseDays = med.cyclicPauseDays || 0;
                    const cycleLength = intakeDays + pauseDays;

                    if (cycleLength === 0) {
                        console.warn(`Cyclic medication ${med.medicineName} has no valid cycle length.`);
                        break;
                    }

                    let dayTimes = times ? times : [defaultTime];
                    let current = start.clone();
                    let dayIndex = 0;

                    while (current.isSameOrBefore(end)) {
                        const dayInCycle = dayIndex % cycleLength;
                        if (dayInCycle < intakeDays) {
                            const dateStr = current.format('YYYY-MM-DD');
                            dayTimes.forEach((t) => {
                                addEvent(updatedItems, dateStr, med, t);
                            });
                        }
                        current.add(1, 'day');
                        dayIndex++;
                    }
                    break;
                }

                case 'onDemand': {
                    // No events for onDemand
                    break;
                }

                default: {
                    console.warn(`Unknown frequency: ${frequency} for medication ${med.medicineName}`);
                    break;
                }
            }
        });

        // Sort events by time for each day
        Object.keys(updatedItems).forEach((date) => {
            updatedItems[date].sort((a, b) => {
                return moment(a.time, 'HH:mm').diff(moment(b.time, 'HH:mm'));
            });
        });

        setItems(updatedItems);
    };

    const renderItem = useCallback((item) => {
        return <MedicationItem item={item} />;
    }, []);

    const renderEmptyDate = useCallback(() => {
        return (
            <View style={styles.emptyDateContainer}>
                <Text style={styles.noMedicationsText}>No Medications</Text>
            </View>
        );
    }, []);

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00adf5" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Medication Calendar</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color="#00adf5" />
                </TouchableOpacity>
            </View>

            <Agenda
                items={items}
                selected={moment().format('YYYY-MM-DD')}
                renderItem={renderItem}
                renderEmptyDate={renderEmptyDate}
                showOnlySelectedDayItems={false}
                theme={{
                    selectedDayBackgroundColor: '#FF9C01',
                    todayTextColor: '#00adf5',
                    agendaDayTextColor: '#00adf5',
                    agendaTodayColor: '#00adf5',
                    dotColor: '#00adf5',
                    selectedDayTextColor: '#ffffff',
                }}
            />

            {refreshing && (
                <View style={styles.refreshingOverlay}>
                    <ActivityIndicator size="small" color="#00adf5" />
                    <Text style={styles.refreshingText}>Refreshing...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    medicineName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333333',
    },
    dosage: {
        fontSize: 14,
        marginBottom: 5,
        color: '#555555',
    },
    timeText: {
        fontSize: 14,
        marginBottom: 5,
        color: '#555555',
    },
    dateRange: {
        fontSize: 12,
        color: '#777777',
    },
    emptyDateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    noMedicationsText: {
        fontSize: 16,
        color: '#888888',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
    },
    refreshButton: {
        padding: 5,
    },
    refreshingOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -75 }, { translateY: -25 }],
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 15,
        borderRadius: 10,
        elevation: 5,
    },
    refreshingText: {
        marginLeft: 10,
        color: '#00adf5',
        fontSize: 16,
    },
});

export default PatientMedicationCalender;
