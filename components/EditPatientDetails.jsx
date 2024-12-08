import React from "react";
import { View, Text, Modal, Button, ScrollView, TouchableOpacity, Image } from "react-native";
import FormField from "./FormField";
import { genderOptions, comorbidityOptions } from "../constants/options";
import { icons } from "../constants";

const EditPatientDetails = ({
  visible,
  patient,
  setPatient,
  onClose,
  onUpdate,
}) => {
  if (!patient) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <ScrollView className="bg-primary rounded-lg p-5 h-full shadow-lg">
        <View className="w-full flex-row justify-between items-center mb-4">
          <Text className="text-3xl text-gray-100 font-bold">
            Edit Patient Details
          </Text>
          <TouchableOpacity onPress={onClose} className="flex items-end">
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
          value={patient.name}
          placeholder="Enter patient's name"
          handleChangeText={(text) => setPatient({ ...patient, name: text })}
          otherStyles="py-2"
        />

        <FormField
          title="Age"
          type="number"
          value={patient.age}
          placeholder="Enter age"
          handleChangeText={(text) => setPatient({ ...patient, age: text })}
          otherStyles="py-2"
        />

        <FormField
          title="Gender"
          type="radio-group"
          value={patient.gender}
          options={genderOptions}
          handleChangeText={(text) => setPatient({ ...patient, gender: text })}
          otherStyles="py-2"
        />

        <FormField
          title="Comorbidities"
          type="checkbox-group"
          value={patient.comorbidities}
          options={comorbidityOptions}
          handleChangeText={(text) =>
            setPatient({ ...patient, comorbidities: text })
          }
          otherStyles="py-2"
        />

        <FormField
          title="Other Comorbidities"
          type="string"
          value={patient.otherComorbidities}
          placeholder="Specify other comorbidities"
          handleChangeText={(text) =>
            setPatient({ ...patient, otherComorbidities: text })
          }
          otherStyles="py-2"
        />

        <FormField
          title="Dialysis"
          type="boolean"
          value={patient.dialysis}
          handleChangeText={(text) =>
            setPatient({ ...patient, dialysis: text })
          }
          otherStyles="py-2"
        />

        <FormField
          title="Height"
          type="number"
          value={patient.height}
          placeholder="Enter height (in cm)"
          handleChangeText={(text) =>
            setPatient({ ...patient, height: text })
          }
        />

        <FormField
          title="Weight"
          type="number"
          value={patient.weight}
          placeholder="Enter weight (in kg)"
          handleChangeText={(text) =>
            setPatient({ ...patient, weight: text })
          }
        />

        <FormField
          title="Allergies"
          type="textarea"
          value={patient.allergies}
          placeholder="Describe any known allergies"
          handleChangeText={(text) =>
            setPatient({ ...patient, allergies: text })
          }
          otherStyles="py-2"
        />

        <FormField
          title="Diagnosis"
          type="textarea"
          value={patient.confirmedDiagnosis}
          placeholder="Enter confirmed diagnosis"
          handleChangeText={(text) =>
            setPatient({ ...patient, confirmedDiagnosis: text })
          }
          otherStyles="py-2"
        />

        <View className="w-full flex-row justify-between items-center mt-5 mb-10">
          <Button title="Update" onPress={onUpdate} />
          <Button title="Cancel" onPress={onClose} color="red" />
        </View>
      </ScrollView>
    </Modal>
  );
};

export default EditPatientDetails;
