const HD_LANG_KEY = "helpdebs_language";

function getSavedLanguage() {
  return localStorage.getItem(HD_LANG_KEY) || "pt";
}

function setLanguage(lang) {
  localStorage.setItem(HD_LANG_KEY, lang);
  applyLanguage(lang);
}

function toggleLanguage() {
  const current = getSavedLanguage();
  setLanguage(current === "en" ? "pt" : "en");
}

function applyLanguage(lang) {
  document.documentElement.lang = lang === "en" ? "en" : "pt-BR";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const value = window.HD_I18N?.[lang]?.[key];
    if (value) el.textContent = value;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const value = window.HD_I18N?.[lang]?.[key];
    if (value) el.placeholder = value;
  });

  const btn = document.getElementById("languageToggle");
  if (btn) {
    btn.textContent = lang === "en" ? "Português ON" : "English ON";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyLanguage(getSavedLanguage());

  const btn = document.getElementById("languageToggle");
  if (btn) {
    btn.addEventListener("click", toggleLanguage);
  }
}); 
