// languageUtils.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../translations/i18n'; // Adjust the path as needed

export const changeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem('appLanguage', lng);
};
