import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LanguageManager {
    static availableLanguages = {};
    static rawDataLanguages = [];
    static allLanguages = [];

    // Load available languages
    static loadAvailableLanguages() {
        const languagesPath = path.join(__dirname, "./../languages");

        if (fs.existsSync(languagesPath)) {
            fs.readdirSync(languagesPath).forEach(file => {
                if (path.extname(file) === ".json") {
                    let langFile = JSON.parse(fs.readFileSync(path.join(languagesPath, file)).toString());
                    LanguageManager.rawDataLanguages = LanguageManager.allLanguages;
                    LanguageManager.allLanguages.push(langFile);
                    if (typeof langFile.info.code !== "undefined" &&
                        typeof langFile.info.id !== "undefined" &&
                        typeof langFile.info.displayNameEnglish !== "undefined") {
                        LanguageManager.availableLanguages[langFile.info.code] = langFile.info;
                    }
                }
            });
            return true;
        }
        return false;
    }

    // Get language info by name
    static getLanguageInfo(language) {
        if (Object.keys(LanguageManager.availableLanguages).includes(language)) {
            return LanguageManager.availableLanguages[language];
        }
        return false;
    }

    // Translate all translation tags in text
    static translateText(language, text, ...placers) {
        text = text.toString();
    
        if (Object.keys(this.availableLanguages).includes(language)) {
            const languagePath = path.join(__dirname, "./../languages", language + ".json");
            let translationFile = JSON.parse(fs.readFileSync(languagePath).toString());
            
            // Find translation placeholders using regex
            let searchMatches = text.match(/\{{[0-9a-zA-Z\-_.]+\}}/gm);
            
            if (searchMatches != null) {
                searchMatches.forEach(match => {
                    // Clean matches from brackets and split into category and key
                    let matchClear = match.replaceAll("{", "").replaceAll("}", "");
                    
                    if (matchClear.split(".").length >= 2) {
                        let category = matchClear.split(".")[0];
                        let key = matchClear.split(".")[1];
                        let modificator = matchClear.split(".")[2];
                        
                        // Replace found translations in text
                        if (typeof translationFile.translations[category]?.[key] !== "undefined") {
                            let matchedTranslation = translationFile.translations[category][key];
                            
                            if (modificator === "upperCase") {
                                matchedTranslation = matchedTranslation.toUpperCase();
                            } else if (modificator === "lowerCase") {
                                matchedTranslation = matchedTranslation.toLowerCase();
                            }
                            
                            text = text.replaceAll(match, matchedTranslation);
                        }
                    }
                });
                
                // Replace text placeholders (%0%, %1%...) with provided objects
                placers.forEach((replacement, i) => {
                    text = text.replaceAll(`%${i}%`, replacement);
                });
            }
            return text;
        }
        return false;
    }

    // Get EULA for specific language
    static getEULA(language) {
        if (LanguageManager.getLanguageInfo(language) !== false) {
            const languagePath = path.join(__dirname, "./../languages", language + ".json");
            let translationFile = JSON.parse(fs.readFileSync(languagePath).toString());
            return translationFile.eula;
        }
        return false;
    }
}

export default LanguageManager;