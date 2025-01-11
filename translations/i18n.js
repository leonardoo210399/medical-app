// i18n.js
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from "./en";
import hi from "./hi";
import mr from "./mr"; // Import AsyncStorage


// Translation resources
const resources = {
    en: {
        translation: en
    },
    hi: {
        translation: hi
    },
    mr: {
        translation: mr
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: Localization.locale.split('-')[0], // Automatically detect language from device locale
        fallbackLng: 'en', // Default fallback language
        interpolation: {
            escapeValue: false, // React already handles escaping
        }
    });

// Retrieve stored language (if any) and update i18next
AsyncStorage.getItem('appLanguage').then((storedLang) => {
    if (storedLang) {
        i18n.changeLanguage(storedLang);
    }
});

export default i18n;
