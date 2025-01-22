import * as PREDEFINED from "./predefined.js";
import fs from "fs";
import axios from "axios";
import path from "path";

export const detectUserLocale = () => {
    // Idiomas soportados por la aplicación
    const supportedLocales = ["ru", "nl", "en", "es"];

    // Detectar el idioma del usuario
    let userLocale = Intl.DateTimeFormat()
        .resolvedOptions()
        .locale.toString()
        .split("-")[0]
        .toLowerCase();

    // Verificar si el idioma detectado está soportado
    if (!supportedLocales.includes(userLocale)) {
        userLocale = "en"; // Idioma predeterminado
    }

    return userLocale;
};
export const makeBaseDirs = () => {
    PREDEFINED.BASE_DIRS.forEach(function (dir) {
        if (!fs.existsSync("./" + dir)) {
            fs.mkdirSync("./" + dir);
        }
    });
};

export const isObjectsValid = (...objects) => {
    let validCount = 0;
    let summCount = objects.length;
    objects.forEach(function (obj) {
        if (typeof obj !== "undefined" && obj !== null) {
            validCount++;
        }
    });
    return summCount === validCount;
};

export const getDataByURL = (url, cb) => {
    axios
        .get(url)
        .then(function (response) {
            cb(response.data);
        })
        .catch(function (error) {
            cb(false);
            return console.error(error.data);
        });
};

export const moveUploadedFile = (server, sourceFile, filePath, cb) => { 
    if (isObjectsValid(server, sourceFile.name)) {
        let uploadPath;
        uploadPath = "./servers/" + server + filePath;
        fs.mkdirSync(path.dirname(uploadPath), {recursive: true});
        sourceFile.mv(uploadPath, function (err) {
            if (err) {
                return cb(err);
            }

            cb(true);
        });
    } else {
        cb(400);
    }
}

export const testForRegexArray = (text, regexArray) => {
    let testResult = false;
    regexArray.forEach((regexpItem) => {
        if (typeof regexpItem == "object" && text.match(regexpItem) !== null) {
            testResult = true;
        } else if (typeof regexpItem == "string" && regexpItem === text) {
            testResult = true;
        }
    });
    return testResult;
};
export const downloadFileFromUrl = (server, url, filePath, cb) => {
    try {
        // Validación de parámetros
        if (!isObjectsValid(server, url, filePath)) {
            return cb(false, "Parámetros inválidos");
        }

        // Validación de URL
        if (!isValidUrl(url)) {
            return cb(false, "URL inválida");
        }

        // Construir ruta completa
        const uploadPath = path.join("./servers", server, filePath);

        // Crear directorio si no existe
        fs.mkdirSync(path.dirname(uploadPath), { recursive: true });

        // Descargar archivo
        axios({
            method: "get",
            url: url,
            responseType: "stream"
        })
        .then(response => {
            const writer = fs.createWriteStream(uploadPath);
            response.data.pipe(writer);

            writer.on("finish", () => cb(true));
            writer.on("error", err => {
                fs.unlink(uploadPath, () => cb(false, err.message));
            });
        })
        .catch(error => {
            cb(false, error.message);
        });

    } catch (error) {
        cb(false, error.message);
    }
};
export const isValidUrl = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};
export const getSafeFilename = (url) => {
    const parsed = new URL(url);
    return parsed.pathname
        .split("/")
        .pop()
        .replace(/[^a-z0-9\.]/gi, "_");
};
// DEVELOPED by seeeroy