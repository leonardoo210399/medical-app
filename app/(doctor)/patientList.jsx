import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Button,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { databases, updatePatientProfile } from "../../lib/appwrite";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";
import { comorbidityOptions, genderOptions } from "../../constants/options";
import { icons } from "../../constants";

const PatientList = () => {
  const [db, setDb] = useState([]);
  const [filteredDb, setFilteredDb] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

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

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setModalVisible(true);
  };

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return;
    try {
      // Update the patient details in the backend
      updatedPatientProfile = await updatePatientProfile(selectedPatient);

      // Update the local state
      const updatedDb = db.map((patient) =>
        patient.$id === selectedPatient.$id ? selectedPatient : patient
      );
      setDb(updatedDb);
      setFilteredDb(updatedDb);

      setModalVisible(false);
    } catch (error) {
      console.error("Error updating patient details:", error);
    }
  };

  const renderPatient = ({ item }) => (
    <View
      className="bg-white shadow-lg rounded-xl p-5 mb-5"
      style={{ borderColor: "#FF8E01", borderWidth: 1 }}
    >
      <View className="flex-row items-center mb-4">
        <Image
          source={{
            uri: item.users?.avatar || "https://via.placeholder.com/150",
          }}
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
        {/* </View>
            <View> */}
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Allergies: </Text>
          {item.allergies || "None"}
        </Text>
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Comorbidities: </Text>
          {item.comorbidities?.length > 0
            ? item.comorbidities.join(", ")
            : "None"}
        </Text>
        {item.comorbidities.includes("Others") && (
          <Text className="text-sm font-plight">
            <Text className="text-secondary-200">otherComorbidities: </Text>
            {item.otherComorbidities || "-"}
          </Text>
        )}
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Dialysis: </Text>
          {item.dialysis ? "Yes" : "No"}
        </Text>
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Diagnosis: </Text>
          {item.confirmedDiagnosis || "-"}
        </Text>
      </View>
      <View className="flex-row justify-between -ml-4">
        <CustomButton
          title={`Edit Patient \nDetails`}
          handlePress={() => handleEditPatient(item)}
          containerStyles="w-1/2 m-1 px-2"
          textStyles="text-center text-sm"
        />
        <CustomButton
          title={`Add/Remove \nMedication`}
          handlePress={() => {}}
          containerStyles="w-1/2 m-1 px-2 !bg-gray-100"
          textStyles="text-center text-sm"
        />
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
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <ScrollView className="bg-primary rounded-lg p-5 h-full shadow-lg">
          <View className="w-full flex-row justify-between items-center mb-4">
            <Text className="text-3xl text-gray-100 font-bold">
              Edit Patient Details
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="flex items-end "
            >
              <Image
                source={icons.close}
                resizeMode="contain"
                className="w-4 h-4"
              />
            </TouchableOpacity>
          </View>
          <FormField
            title="Name"
            type="string"
            value={selectedPatient?.name}
            placeholder="Enter patient's name"
            handleChangeText={(text) =>
              setSelectedPatient({ ...selectedPatient, name: text })
            }
            otherStyles="py-2"
          />
          <FormField
            title="Age"
            type="number"
            value={selectedPatient?.age}
            placeholder="Enter age"
            handleChangeText={(text) =>
              setSelectedPatient({ ...selectedPatient, age: text })
            }
            otherStyles="py-2"
          />
          <FormField
            title="Gender"
            type="radio-group"
            value={selectedPatient?.gender}
            options={genderOptions}
            handleChangeText={(text) =>
              setSelectedPatient({ ...selectedPatient, gender: text })
            }
            otherStyles="py-2"
          />
          {/* Comorbidities (Checkbox-Group) */}
          <FormField
            title="Comorbidities"
            type="checkbox-group"
            value={selectedPatient?.comorbidities}
            options={comorbidityOptions}
            handleChangeText={(text) =>
              setSelectedPatient({ ...selectedPatient, comorbidities: text })
            }
            otherStyles="py-2"
          />

          {/* If "Others" is selected, show a text input for additional comorbidities */}
          {/* {comorbidities.includes("Others") && ( */}
          <FormField
            title="Other Comorbidities"
            type="string"
            value={selectedPatient?.otherComorbidities}
            placeholder="Specify other comorbidities"
            handleChangeText={(text) =>
              setSelectedPatient({
                ...selectedPatient,
                otherComorbidities: text,
              })
            }
            otherStyles="py-2"
          />
          {/* )} */}

          {/* Dialysis (Boolean) */}
          <FormField
            title="Dialysis"
            type="boolean"
            value={selectedPatient?.dialysis}
            handleChangeText={(text) =>
              setSelectedPatient({ ...selectedPatient, dialysis: text })
            }
            otherStyles="py-2"
          />

          {/*Height (dropdown) */}
          {/* Height (Number) */}
          <FormField
            title="Height"
            type="number"
            value={selectedPatient?.height}
            placeholder="Enter height (in cm)"
            handleChangeText={(text) =>
              setSelectedPatient({ ...selectedPatient, height: text })
            }
          />

          {/* Weight (Number) */}
          <FormField
            title="Weight"
            type="number"
            value={selectedPatient?.weight}
            placeholder="Enter weight (in kg)"
            handleChangeText={(text) =>
              setSelectedPatient({ ...selectedPatient, weight: text })
            }
          />

          <FormField
            title="Allergies"
            type="textarea"
            value={selectedPatient?.allergies}
            placeholder="Describe any known allergies"
            handleChangeText={(text) =>
              setSelectedPatient({ ...selectedPatient, allergies: text })
            }
            otherStyles="py-2"
          />
          <FormField
            title="Diagnosis"
            type="textarea"
            value={selectedPatient?.confirmedDiagnosis}
            placeholder="Enter confirmed diagnosis"
            handleChangeText={(text) =>
              setSelectedPatient({
                ...selectedPatient,
                confirmedDiagnosis: text,
              })
            }
            otherStyles="py-2"
          />
          <View className="w-full flex-row justify-between items-center mt-5 mb-10">
            {/* <CustomButton
            title="Update"
            handlePress={handleUpdatePatient}
            containerStyles="w-1/2 m-1 px-2 !-red"
            textStyles="text-center text-sm"
            /> */}
          <Button title="Update" onPress={handleUpdatePatient} />
          <Button
            title="Cancel"
            onPress={() => setModalVisible(false)}
            color="red"
          />
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
};

export default PatientList;
