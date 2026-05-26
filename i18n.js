const HD_LANG_KEY = "helpdebs_language";

const translations = {
  pt: {
    english_on: "English ON",
    portuguese_on: "Português ON"
  },
  en: {
    english_on: "English ON",
    portuguese_on: "Português ON"
  }
};

function getSavedLanguage() {
  return localStorage.getItem(HD_LANG_KEY) || "pt";
}

function setLanguage(lang) {
  localStorage.setItem(HD_LANG_KEY, lang);
  applyLanguage(lang);
}

function applyLanguage(lang) {
  document.documentElement.lang = lang === "en" ? "en" : "pt-BR";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const text = translations?.[lang]?.[key];

    if (text) el.textContent = text;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const text = translations?.[lang]?.[key];

    if (text) el.placeholder = text;
  });

  const btn = document.getElementById("languageToggle");
  if (btn) {
    btn.textContent = lang === "en" ? "Português ON" : "English ON";
  }
}

function toggleLanguage() {
  const current = getSavedLanguage();
  const next = current === "en" ? "pt" : "en";
  setLanguage(next);
}

document.addEventListener("DOMContentLoaded", () => {
  applyLanguage(getSavedLanguage());

  const btn = document.getElementById("languageToggle");
  if (btn) {
    btn.addEventListener("click", toggleLanguage);
  }
});
