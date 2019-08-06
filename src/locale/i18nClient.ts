import i18n from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { ru, en } from './index';

const config = {
  load: ['en', 'en-US', 'en-GB', 'ru', 'ru-RU'],
  whitelist: ['en', 'en-US', 'en-GB', 'ru', 'ru-RU'],
  fallbackLng: 'ru',
  lngs: ['en-US', 'ru-RU'],
  react: {
    wait: true, // set to true if you like to wait for loaded in every translated hoc
    nsMode: 'default' // set it to fallback to let passed namespaces to translated hoc act as fallbacks
  },
  defaultNS: 'locale.ru',
  resources: {
    en: {
      'locale.en': en
    },
    'en-US': {
      'locale.en': en
    },
    'en-GB': {
      'local.en': en
    },
    ru: {
      'locale.ru': ru
    },
    'ru-RU': {
      'locale.ru': ru
    }
  }
};

const i18nClient = i18n.use(LanguageDetector).init(config);

export default i18nClient;
