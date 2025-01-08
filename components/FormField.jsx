import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "react-native-modal-datetime-picker";
import Icon from 'react-native-vector-icons/Ionicons'; // Ensure Ionicons is installed

const FormField = ({
                     title,
                     value,
                     placeholder,
                     handleChangeText,
                     type = "string",
                     options = [],
                     role = "Patient",
                     confirmedDiagnosisEnabled = false,
                     otherStyles = {},
                     error,
                     ...props
                   }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  // Determine if field is editable based on role and field type
  const isConfirmedDiagnosisField = title.toLowerCase().includes("confirmed diagnosis");
  const isEditable = !isConfirmedDiagnosisField || (role === "Doctor" && confirmedDiagnosisEnabled);

  const formatDate = (date, mode) => {
    if (mode === "date") {
      return date.toLocaleDateString();
    } else if (mode === "time") {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return "";
  };

  // Field render logic based on type
  if (type === "boolean") {
    return (
        <View style={[styles.container, otherStyles]}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>{value ? "Yes" : "No"}</Text>
            <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={value ? "#f5dd4b" : "#f4f3f4"}
                onValueChange={isEditable ? handleChangeText : () => {}}
                value={value}
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
  }

  if (type === "number") {
    return (
        <View style={[styles.container, otherStyles]}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.inputContainer}>
            <TextInput
                style={styles.textInput}
                value={value !== undefined && value !== null ? String(value) : ""}
                placeholder={placeholder}
                placeholderTextColor="#7B7B8B"
                keyboardType="numeric"
                onChangeText={(text) => {
                  if (isEditable) {
                    handleChangeText(text.replace(/[^0-9]/g, ''));
                  }
                }}
                editable={isEditable}
                {...props}
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
  }

  if (type === "dropdown") {
    return (
        <View style={[styles.container, otherStyles]}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.pickerContainer}>
            <Picker
                selectedValue={value}
                onValueChange={(itemValue) => {
                  if (isEditable) {
                    handleChangeText(itemValue);
                  }
                }}
                style={styles.picker}
                enabled={isEditable}
                dropdownIconColor="#7B7B8B"
            >
              {options?.map((option) => (
                  <Picker.Item
                      label={option.label}
                      value={option.value}
                      key={option.value}
                  />
              ))}
            </Picker>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
  }

  if (type === "textarea") {
    return (
        <View style={[styles.container, otherStyles]}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.textareaContainer}>
            <TextInput
                style={[styles.textInput, styles.textarea]}
                value={value}
                placeholder={placeholder}
                placeholderTextColor="#7B7B8B"
                multiline
                onChangeText={(text) => isEditable && handleChangeText(text)}
                editable={isEditable}
                {...props}
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
  }

  if (type === "checkbox-group") {
    const toggleCheckbox = (val) => {
      if (!isEditable) return;
      if (value.includes(val)) {
        handleChangeText(value.filter((item) => item !== val));
      } else {
        handleChangeText([...value, val]);
      }
    };

    return (
        <View style={[styles.container, otherStyles]}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.checkboxGroup}>
            {options.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    onPress={() => toggleCheckbox(option.value)}
                    style={styles.checkboxItem}
                    accessibilityLabel={`Toggle ${option.label}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: value.includes(option.value) }}
                >
                  <View style={styles.checkbox}>
                    {value.includes(option.value) && <View style={styles.checkboxChecked} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{option.label}</Text>
                </TouchableOpacity>
            ))}
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
  }

  if (type === "radio-group") {
    const selectRadio = (val) => {
      if (isEditable) {
        handleChangeText(val);
      }
    };

    return (
        <View style={[styles.container, otherStyles]}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.radioGroup}>
            {options.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    onPress={() => selectRadio(option.value)}
                    style={styles.radioItem}
                    accessibilityLabel={`Select ${option.label}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: value === option.value }}
                >
                  <View style={styles.radio}>
                    {value === option.value && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
            ))}
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
  }

  if (type === "password") {
    return (
        <View style={[styles.container, otherStyles]}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.passwordContainer}>
            <TextInput
                style={styles.textInput}
                value={value}
                placeholder={placeholder}
                placeholderTextColor="#7B7B8B"
                secureTextEntry={!showPassword}
                onChangeText={(text) => isEditable && handleChangeText(text)}
                editable={isEditable}
                {...props}
            />
            <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                accessibilityRole="button"
            >
              <Icon
                  name={!showPassword ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color="#7B7B8B"
              />
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
  }

  if (type === "date") {
    return (
        <View style={[styles.container, otherStyles]}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
              onPress={() => isEditable && setDatePickerVisible(true)}
              style={styles.datePickerContainer}
              accessibilityLabel={`Select ${title}`}
              accessibilityRole="button"
          >
            <Text style={styles.datePickerText}>
              {value ? formatDate(new Date(value), "date") : placeholder}
            </Text>
            <Icon name="calendar-outline" size={24} color="#7B7B8B" />
          </TouchableOpacity>
          <DateTimePicker
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={(date) => {
                handleChangeText(date.toISOString());
                setDatePickerVisible(false);
              }}
              onCancel={() => setDatePickerVisible(false)}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
  }

  if (type === "time") {
    return (
        <View style={[styles.container, otherStyles]}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
              onPress={() => isEditable && setDatePickerVisible(true)}
              style={styles.datePickerContainer}
              accessibilityLabel={`Select ${title}`}
              accessibilityRole="button"
          >
            <Text style={styles.datePickerText}>
              {value ? formatDate(new Date(value), "time") : placeholder}
            </Text>
            <Icon name="time-outline" size={24} color="#7B7B8B" />
          </TouchableOpacity>
          <DateTimePicker
              isVisible={isDatePickerVisible}
              mode="time"
              onConfirm={(time) => {
                handleChangeText(time.toISOString());
                setDatePickerVisible(false);
              }}
              onCancel={() => setDatePickerVisible(false)}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
  }

  // Default single-line string input
  return (
      <View style={[styles.container, otherStyles]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.inputContainer}>
          <TextInput
              style={styles.textInput}
              value={value}
              placeholder={placeholder}
              placeholderTextColor="#7B7B8B"
              onChangeText={(text) => isEditable && handleChangeText(text)}
              editable={isEditable}
              {...props}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#FFFFFF", // White text
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#08505A", // midnight_green
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    color: "#FFFFFF", // White text
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: "#08505A", // midnight_green
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#FFFFFF",
  },
  textareaContainer: {
    backgroundColor: "#08505A", // midnight_green
    borderRadius: 10,
    padding: 10,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
    color: "#FFFFFF",
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#08505A", // midnight_green
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  switchText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  checkboxGroup: {
    backgroundColor: "#08505A", // midnight_green
    borderRadius: 10,
    padding: 10,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    width: 10,
    height: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  checkboxLabel: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  radioGroup: {
    backgroundColor: "#08505A", // midnight_green
    borderRadius: 10,
    padding: 10,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioSelected: {
    width: 10,
    height: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
  },
  radioLabel: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#08505A", // midnight_green
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  passwordIcon: {
    width: 24,
    height: 24,
  },
  errorText: {
    color: "#ff4d4f",
    marginTop: 4,
    fontSize: 14,
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#08505A", // midnight_green
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  datePickerText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});

export default FormField;
