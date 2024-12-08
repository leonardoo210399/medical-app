import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "react-native-modal-datetime-picker";
import { addMedication } from "../lib/appwrite";

const AddPatientMedication = ({ visible, onClose, onAddMedication, patient }) => {
  const [medicineName, setMedicineName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [frequency, setFrequency] = useState("daily");
  const [dailyTimes, setDailyTimes] = useState(1);
  const [intervalType, setIntervalType] = useState("hours");
  const [intervalValue, setIntervalValue] = useState(1);
  const [specificDays, setSpecificDays] = useState([]);
  const [cyclicIntakeDays, setCyclicIntakeDays] = useState(21);
  const [cyclicPauseDays, setCyclicPauseDays] = useState(7);
  const [times, setTimes] = useState([]);
  const [dosage, setDosage] = useState("");
  const [onDemand, setOnDemand] = useState(false);

  const handleAddTime = (selectedTime) => {
    const formattedTime = selectedTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setTimes((prev) => [...prev, formattedTime]);
  };

  const handleRemoveTime = (timeToRemove) => {
    setTimes((prev) => prev.filter((time) => time !== timeToRemove));
  };

  const handleAddSpecificDay = (day) => {
    if (!specificDays.includes(day)) {
      setSpecificDays((prev) => [...prev, day]);
    } else {
      setSpecificDays((prev) => prev.filter((d) => d !== day));
    }
  };

  const handleSubmit = async () => {
    if (!medicineName || !dosage || !startDate || !endDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const medicationData = {
      medicineName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      frequency,
      dailyTimes: frequency === "daily" ? dailyTimes : null,
      intervalType: frequency === "interval" ? intervalType : null,
      intervalValue: frequency === "interval" ? intervalValue : null,
      specificDays: frequency === "specificDays" ? specificDays : null,
      cyclicIntakeDays: frequency === "cyclic" ? cyclicIntakeDays : null,
      cyclicPauseDays: frequency === "cyclic" ? cyclicPauseDays : null,
      onDemand,
      times,
      dosage,
      userMedication: patient?.$id,
    };

    await addMedication(medicationData);
    onAddMedication();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modal}>
        <Text style={styles.title}>Add Medication</Text>

        {/* Medicine Name */}
        <TextInput
          style={styles.input}
          placeholder="Medicine Name"
          value={medicineName}
          onChangeText={setMedicineName}
        />

        {/* Start Date */}
        <TouchableOpacity
          onPress={() => setStartDatePickerVisible(true)}
          style={styles.datePickerButton}
        >
          <Text style={styles.datePickerText}>Start Date: {startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <DateTimePicker
          isVisible={isStartDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            setStartDate(date);
            setStartDatePickerVisible(false);
          }}
          onCancel={() => setStartDatePickerVisible(false)}
        />

        {/* End Date */}
        <TouchableOpacity
          onPress={() => setEndDatePickerVisible(true)}
          style={styles.datePickerButton}
        >
          <Text style={styles.datePickerText}>End Date: {endDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <DateTimePicker
          isVisible={isEndDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            setEndDate(date);
            setEndDatePickerVisible(false);
          }}
          onCancel={() => setEndDatePickerVisible(false)}
        />

        {/* Frequency */}
        <Text style={styles.label}>Frequency</Text>
        <Picker selectedValue={frequency} onValueChange={(value) => setFrequency(value)} style={styles.picker}>
          <Picker.Item label="Daily, X times a day" value="daily" />
          <Picker.Item label="Interval" value="interval" />
          <Picker.Item label="Specific days of the week" value="specificDays" />
          <Picker.Item label="Cyclic mode" value="cyclic" />
          <Picker.Item label="On demand (no reminders)" value="onDemand" />
        </Picker>

        {/* Frequency-Specific Fields */}
        {frequency === "daily" && (
          <TextInput
            style={styles.input}
            placeholder="Number of times a day"
            keyboardType="numeric"
            value={String(dailyTimes)}
            onChangeText={(value) => setDailyTimes(Number(value))}
          />
        )}

        {frequency === "interval" && (
          <View>
            <Picker selectedValue={intervalType} onValueChange={(value) => setIntervalType(value)} style={styles.picker}>
              <Picker.Item label="Every X hours" value="hours" />
              <Picker.Item label="Every X days" value="days" />
            </Picker>
            <TextInput
              style={styles.input}
              placeholder={`Interval (${intervalType})`}
              keyboardType="numeric"
              value={String(intervalValue)}
              onChangeText={(value) => setIntervalValue(Number(value))}
            />
          </View>
        )}

        {frequency === "specificDays" && (
          <View>
            <Text style={styles.label}>Select Days</Text>
            <View style={styles.daysContainer}>
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => handleAddSpecificDay(day)}
                  style={[
                    styles.dayButton,
                    specificDays.includes(day) && styles.selectedDayButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      specificDays.includes(day) && styles.selectedDayText,
                    ]}
                  >
                    {day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {frequency === "cyclic" && (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Intake Days"
              keyboardType="numeric"
              value={String(cyclicIntakeDays)}
              onChangeText={(value) => setCyclicIntakeDays(Number(value))}
            />
            <TextInput
              style={styles.input}
              placeholder="Pause Days"
              keyboardType="numeric"
              value={String(cyclicPauseDays)}
              onChangeText={(value) => setCyclicPauseDays(Number(value))}
            />
          </View>
        )}

        {frequency === "onDemand" && (
          <View style={styles.onDemandContainer}>
            <Text style={styles.label}>Is On Demand?</Text>
            <Switch value={onDemand} onValueChange={setOnDemand} />
          </View>
        )}

        {/* Times */}
        <Text style={styles.label}>Times</Text>
        <FlatList
          data={times}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.timeItemContainer}>
              <Text style={styles.timeItem}>{item}</Text>
              <Button title="Remove" onPress={() => handleRemoveTime(item)} />
            </View>
          )}
        />
        <Button title="Add Time" onPress={() => handleAddTime(new Date())} />

        {/* Dosage */}
        <TextInput
          style={styles.input}
          placeholder="Dosage"
          value={dosage}
          onChangeText={setDosage}
        />

        {/* Submit */}
        <Button title="Submit" onPress={handleSubmit} />
        <Button title="Cancel" color="red" onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#2e2e2e",
    color: "white",
  },
  datePickerButton: {
    padding: 10,
    backgroundColor: "#2e2e2e",
    borderRadius: 5,
    marginBottom: 10,
  },
  datePickerText: {
    color: "white",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  picker: {
    color: "white",
    backgroundColor: "#2e2e2e",
    borderRadius: 5,
    marginBottom: 10,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    margin: 5,
  },
  selectedDayButton: {
    backgroundColor: "#007BFF",
    borderColor: "#007BFF",
  },
  dayText: {
    color: "white",
  },
  selectedDayText: {
    color: "white",
  },
  timeItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  timeItem: {
    color: "white",
    marginRight: 10,
  },
});

export default AddPatientMedication;
