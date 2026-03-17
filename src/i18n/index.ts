import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pl from './pl';
import en from './en';

i18n.use(initReactI18next).init({
    resources: {
        pl: { translation: pl },
        en: { translation: en },
    },
    lng: localStorage.getItem('lang') ?? 'pl',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
});

export default i18n;
