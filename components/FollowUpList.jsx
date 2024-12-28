// FollowUpList.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { getFollowUps } from "../lib/appwrite"; // Adjust the import path as necessary
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FollowUpList = ({ patientId }) => {
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     // Fetch initial medications data
    //     fetchFollowUps();
    //
    //     // Set up polling every 10 seconds
    //     const interval = setInterval(() => {
    //         fetchFollowUps();
    //     }, 10000); // 10,000 milliseconds = 10 seconds
    //
    //     // Clean up the interval on component unmount
    //     return () => clearInterval(interval);
    // }, [patientId]);

    const fetchFollowUps = async () => {
        try {
            setLoading(true);
            const response = await getFollowUps(patientId);
            setFollowUps(response.documents || []);
        } catch (error) {
            console.error("Error fetching follow-ups:", error);
            Alert.alert("Error", "Failed to fetch follow-up schedules.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patientId) {
            fetchFollowUps();
        }
    }, [patientId]);

    const renderItem = ({ item }) => (
        <View style={styles.followUpItem}>
            <View style={styles.followUpHeader}>
                <Text style={styles.followUpType}>
                    {item.type === 'followup' ? 'Follow-Up' : 'Dialysis'}
                </Text>
                <Text style={styles.followUpStatus}>
                    {item.status === 'scheduled' ? 'Scheduled' : 'Completed'}
                </Text>
            </View>
            <Text style={styles.followUpDate}>
                {moment(item.scheduledDate).format('MMMM DD, YYYY h:mm A')}
            </Text>
            {item.notes ? (
                <Text style={styles.followUpNotes}>
                    {item.notes}
                </Text>
            ) : null}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.listTitle}>Follow-Up/Dialysis Schedules</Text>
            {loading ? (
                <ActivityIndicator size="small" color="#FF9C01" />
            ) : followUps.length === 0 ? (
                <Text style={styles.emptyText}>No schedules found.</Text>
            ) : (
                <FlatList
                    data={followUps}
                    keyExtractor={(item) => item.$id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 15,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 10,
    },
    followUpItem: {
        backgroundColor: "#f2f2f2",
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    followUpHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    followUpType: {
        fontSize: 14,
        fontWeight: "600",
        color: "#007BFF",
    },
    followUpStatus: {
        fontSize: 14,
        fontWeight: "600",
        color: "#28a745",
    },
    followUpDate: {
        fontSize: 14,
        color: "#555",
        marginBottom: 4,
    },
    followUpNotes: {
        fontSize: 14,
        color: "#333",
    },
    emptyText: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
        marginTop: 10,
    },
    listContent: {
        paddingBottom: 10,
    },
});

export default FollowUpList;
