import { en } from "./locales/en.js";
import { vi } from "./locales/vi.js";

const DEFAULT_STORAGE_KEY = "language";
const DEFAULT_LANGUAGE = "vi";

const locales = {
    en,
    vi
};

export function addLocale(code, messages) {
    locales[code] = messages;
}

export function getAvailableLanguages() {
    return Object.keys(locales);
}

export function getCurrentLanguage(storageKey = DEFAULT_STORAGE_KEY, fallback = DEFAULT_LANGUAGE) {
    const lang = localStorage.getItem(storageKey) || fallback;
    return locales[lang] ? lang : fallback;
}

function setElementText(element, value) {
    if (typeof value === "string") {
        element.textContent = value;
    }
}

function translateElement(element, messages) {
    const textKey = element.getAttribute("data-i18n");
    const placeholderKey = element.getAttribute("data-i18n-placeholder");
    const titleKey = element.getAttribute("data-i18n-title");

    if (textKey && Object.prototype.hasOwnProperty.call(messages, textKey)) {
        setElementText(element, messages[textKey]);
    }

    if (placeholderKey && Object.prototype.hasOwnProperty.call(messages, placeholderKey)) {
        element.setAttribute("placeholder", messages[placeholderKey]);
    }

    if (titleKey && Object.prototype.hasOwnProperty.call(messages, titleKey)) {
        element.setAttribute("title", messages[titleKey]);
    }
}

export function applyLanguage(lang, options = {}) {
    const {
        defaultLanguage = DEFAULT_LANGUAGE,
        titleKey = "pageTitle"
    } = options;

    const selectedLanguage = locales[lang] ? lang : defaultLanguage;
    const messages = locales[selectedLanguage] || locales[defaultLanguage];
    const translatableElements = document.querySelectorAll("[data-i18n], [data-i18n-placeholder], [data-i18n-title]");

    document.documentElement.lang = selectedLanguage;

    if (Object.prototype.hasOwnProperty.call(messages, titleKey)) {
        document.title = messages[titleKey];
    }

    translatableElements.forEach((element) => {
        translateElement(element, messages);
    });

    return selectedLanguage;
}

export function initI18n(options = {}) {
    const {
        selector = "#language",
        storageKey = DEFAULT_STORAGE_KEY,
        defaultLanguage = DEFAULT_LANGUAGE,
        titleKey = "pageTitle"
    } = options;

    const languageSelect = document.querySelector(selector);
    const activeLanguage = getCurrentLanguage(storageKey, defaultLanguage);

    if (languageSelect) {
        languageSelect.value = activeLanguage;
        languageSelect.addEventListener("change", (event) => {
            const nextLang = event.target.value;
            const appliedLang = applyLanguage(nextLang, { defaultLanguage, titleKey });
            localStorage.setItem(storageKey, appliedLang);
        });
    }

    const appliedLang = applyLanguage(activeLanguage, { defaultLanguage, titleKey });
    localStorage.setItem(storageKey, appliedLang);

    return {
        language: appliedLang,
        languages: getAvailableLanguages()
    };
}
