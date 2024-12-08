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

/**
 * Props:
 * - title: string - The label for the field
 * - value: various - The current value of the field
 * - placeholder: string - Placeholder text for input fields
 * - handleChangeText: function - Callback to update the parent state
 * - type: string - A field type specifier (e.g. "string", "number", "boolean", "checkbox-group", "textarea", "password", "radio-group", "date", "time")
 * - options: array - For radio groups, checkbox groups, or dropdowns (e.g. [{ label: 'Male', value: 'male' }, ...])
 * - role: string - Current user role (e.g. "Patient" or "Doctor")
 * - confirmedDiagnosisEnabled: boolean - If true, allows "Confirmed Diagnosis" field editing for doctors
 * - otherStyles: object - Additional styles for the container
 * - error: string - Error message for the field
 *
 * Field Type Handling:
 * - "string": Default single-line text
 * - "number": Numeric input (only integers)
 * - "boolean": A toggle for yes/no (e.g. Dialysis)
 * - "checkbox-group": Multiple selection checkboxes (e.g. Comorbidities)
 * - "radio-group": Single selection (e.g. Gender)
 * - "textarea": Multiline text input (e.g. Allergies, Confirmed Diagnosis)
 * - "password": Secure text input with show/hide button
 * - "date": Date picker
 * - "time": Time picker
 */
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

  // Conditional Logic for Editable Fields
  const isConfirmedDiagnosisField = title.toLowerCase().includes("confirmed diagnosis");
  const isEditable = !isConfirmedDiagnosisField || (role === "Doctor" && confirmedDiagnosisEnabled);

  // Function to format date/time
  const formatDate = (date, mode) => {
    if (mode === "date") {
      // Example format: MM/DD/YYYY
      return date.toLocaleDateString();
    } else if (mode === "time") {
      // Example format: HH:MM AM/PM
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return "";
  };

  if (type === "boolean") {
    // Boolean toggle
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
    // Numeric input (only integers)
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
                // Allow only integers
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
    // Dropdown picker
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
    // Multiline text input
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
    // Multiple selection checkboxes
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
    // Single selection radio buttons
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
    // Password field with show/hide
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
    // Date picker
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
    // Time picker
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

  // Default: single-line string input
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
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: "#333",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#fff",
  },
  textareaContainer: {
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 10,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  switchText: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  checkboxGroup: {
    backgroundColor: "#333",
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
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    width: 10,
    height: 10,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  checkboxLabel: {
    color: "#fff",
    fontSize: 16,
  },
  radioGroup: {
    backgroundColor: "#333",
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
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioSelected: {
    width: 10,
    height: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
  },
  radioLabel: {
    color: "#fff",
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
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
    backgroundColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  datePickerText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default FormField;
