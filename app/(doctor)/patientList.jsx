import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TextInput, ActivityIndicator } from "react-native";
import { databases } from "../../lib/appwrite";
import { SafeAreaView } from "react-native-safe-area-context";
import tailwind from "tailwind-react-native-classnames";

const PatientList = () => {
    const [db, setDb] = useState([]);
    const [filteredDb, setFilteredDb] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        const filtered = db.filter((patient) =>
            patient?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredDb(filtered);
    }, [searchQuery, db]);

    const init = async () => {
        try {
            setLoading(true);
            const dbResponse = await databases.listDocuments(
                "HealthManagementDatabaseId",
                "PatientsCollectionId"
            );
            setDb(dbResponse.documents || []);
            setFilteredDb(dbResponse.documents || []);
        } catch (error) {
            console.error("Error fetching patient data:", error);
            setDb([]);
            setFilteredDb([]);
        } finally {
            setLoading(false);
        }
    };

    const renderPatient = ({ item }) => (
        <View
            className="bg-white shadow-lg rounded-xl p-5 mb-5"
            style={{ borderColor: "#FF8E01", borderWidth: 1 }}
        >
            <View className="flex-row items-center mb-4">
                <Image
                    source={{ uri: item.users?.avatar || "https://via.placeholder.com/150" }}
                    className="w-16 h-16 rounded-full mr-4"
                />
                <View>
                    <Text className="text-lg text-primary font-psemibold">
                        {item.name || "Unknown"}
                    </Text>
                    <Text className="text-sm font-pregular text-gray-100">
                        {item.users?.email || "No Email"}
                    </Text>
                </View>
            </View>
            <View className="mb-2">
                <Text className="text-sm font-plight">
                    <Text className="text-secondary-200">Age: </Text>
                    {item.age || "N/A"}
                </Text>
                <Text className="text-sm font-plight">
                    <Text className="text-secondary-200">Gender: </Text>
                    {item.gender || "N/A"}
                </Text>
                <Text className="text-sm font-plight">
                    <Text className="text-secondary-200">Height: </Text>
                    {item.height || "N/A"} cm
                </Text>
                <Text className="text-sm font-plight">
                    <Text className="text-secondary-200">Weight: </Text>
                    {item.weight || "N/A"} kg
                </Text>
            </View>
            <View>
                <Text className="text-sm font-plight">
                    <Text className="text-secondary-200">Allergies: </Text>
                    {item.allergies || "None"}
                </Text>
                <Text className="text-sm font-plight">
                    <Text className="text-secondary-200">Comorbidities: </Text>
                    {item.comorbidities?.length > 0 ? item.comorbidities.join(", ") : "None"}
                </Text>
                <Text className="text-sm font-plight">
                    <Text className="text-secondary-200">Dialysis: </Text>
                    {item.dialysis ? "Yes" : "No"}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="bg-black-100 p-4 flex-1">
            <Text className="text-xl text-center mb-5 font-pbold text-secondary">
                Patient List
            </Text>

            <TextInput
                className="bg-white rounded-xl px-4 py-3 mb-4 shadow"
                placeholder="Search by name..."
                placeholderTextColor="#CDCDE0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search patients by name"
            />

            {loading ? (
                <View className="flex justify-center items-center">
                    <ActivityIndicator size="large" color="#FF9C01" />
                </View>
            ) : (
                <FlatList
                    data={filteredDb}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPatient}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <Text className="text-center text-gray-500 mt-5">
                            No patients found.
                        </Text>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default PatientList;
