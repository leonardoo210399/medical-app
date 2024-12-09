import { View, Text, StyleSheet} from 'react-native'
import React,{memo} from 'react'
import moment from 'moment';


const MedicationItem = memo(({ item }) => (
    <View style={styles.itemContainer}>
        <Text style={styles.medicineName}>{item?.medicineName}</Text>
        <Text style={styles.dosage}>
            Dosage: {item?.dosage}
        </Text>
        <Text style={styles.timeText}>Time: {item?.time}</Text>
        <Text style={styles.dateRange}>
            {item?.formattedStartDate} - {item?.formattedEndDate}
        </Text>
    </View>
), (prevProps, nextProps) => prevProps.item === nextProps.item);

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

export default MedicationItem