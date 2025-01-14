import * as PREDEFINED from "./predefined.js";
import fs from "fs";
import axios from "axios";
import path from "path";

export const detectUserLocale = () => {
    let userLocale = Intl.DateTimeFormat()
        .resolvedOptions()
        .locale.toString()
        .split("-")[0];
    if (userLocale !== "ru" && userLocale !== "nl") {
        userLocale = "en";
    }
    return userLocale.toLowerCase();
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
    if (this.isObjectsValid(server, sourceFile.name)) {
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

// DEVELOPED by seeeroy