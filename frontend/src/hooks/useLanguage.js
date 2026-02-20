import { useState, useEffect } from 'react';
import { getCurrentLanguage, setLanguage as setLang, t as translate } from '../utils/i18n';

export function useLanguage() {
  const [language, setLanguageState] = useState(getCurrentLanguage());

  const changeLanguage = (lang) => {
    if (setLang(lang)) {
      setLanguageState(lang);
      window.location.reload(); // 重新加载页面以应用新语言
    }
  };

  const t = (key) => translate(key);

  return { language, changeLanguage, t };
}

