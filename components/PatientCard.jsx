import React from "react";
import { View, Text, Image } from "react-native";
import CustomButton from "./CustomButton";

const PatientCard = ({ patient, onEdit, onMedication }) => {
  return (
    <View
      className="bg-white shadow-lg rounded-xl p-5 mb-5"
      style={{ borderColor: "#FF8E01", borderWidth: 1 }}
    >
      <View className="flex-row items-center mb-4">
        <Image
          source={{
            uri: patient?.users?.avatar || "https://via.placeholder.com/150",
          }}
          className="w-16 h-16 rounded-full mr-4"
        />
        <View>
          <Text className="text-lg text-primary font-psemibold">
            {patient?.name || "Unknown"}
          </Text>
          <Text className="text-sm font-pregular text-gray-100">
            {patient?.users?.email || "No Email"}
          </Text>
        </View>
      </View>
      <View className="mb-2">
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Age: </Text>
          {patient?.age || "N/A"}
        </Text>
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Gender: </Text>
          {patient?.gender || "N/A"}
        </Text>
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Height: </Text>
          {patient?.height || "N/A"} cm
        </Text>
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Weight: </Text>
          {patient?.weight || "N/A"} kg
        </Text>
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Allergies: </Text>
          {patient?.allergies || "None"}
        </Text>
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Comorbidities: </Text>
          {patient?.comorbidities?.length > 0
            ? patient.comorbidities.join(", ")
            : "None"}
        </Text>
        {patient?.comorbidities?.includes("Others") && (
          <Text className="text-sm font-plight">
            <Text className="text-secondary-200">Other Comorbidities: </Text>
            {patient?.otherComorbidities || "-"}
          </Text>
        )}
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Dialysis: </Text>
          {patient?.dialysis ? "Yes" : "No"}
        </Text>
        <Text className="text-sm font-plight">
          <Text className="text-secondary-200">Diagnosis: </Text>
          {patient?.confirmedDiagnosis || "-"}
        </Text>
      </View>
      <View className="flex-row justify-between -ml-4">
        <CustomButton
          title={`Edit Patient \nDetails`}
          handlePress={onEdit}
          containerStyles="w-1/2 m-1 px-2"
          textStyles="text-center text-sm"
        />
        <CustomButton
          title={`Add/Remove \nMedication`}
          handlePress={onMedication}
          containerStyles="w-1/2 m-1 px-2 !bg-gray-100"
          textStyles="text-center text-sm"
        />
      </View>
    </View>
  );
};

export default PatientCard;
