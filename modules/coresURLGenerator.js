import * as COMMONS from './commons.js';
import * as LOGGER from "./logger.js";

/////////////////////////////////////////////////////
/* ФУНКЦИИ ДЛЯ ПОЛУЧЕНИЯ ССЫЛОК НА СКАЧИВАНИЕ ЯДЕР */
/////////////////////////////////////////////////////
export const getPaperCoreURL = (core, version, cb) => {
    let firstStepURL = "https://api.papermc.io/v2/projects/" + core + "/versions/" + version;
    LOGGER.log("firstStepURL", firstStepURL);
    COMMONS.getDataByURL(firstStepURL, (data) => {
        if (data === false) {
            LOGGER.warning("Oops! An error occurred while fetching cores");
            cb(false);
            return;
        }
        let lastBuildNumber = Math.max.apply(null, data.builds);
        COMMONS.getDataByURL(firstStepURL + "/builds/" + lastBuildNumber, (data2) => {
            if (data2 === false) {
                LOGGER.warning("Oops! An error occurred while fetching cores");
                cb(false);
                return;
            }
            let downloadFileName = data2.downloads.application.name;
            let finishURL = firstStepURL + "/builds/" + lastBuildNumber + "/downloads/" + downloadFileName;
            cb(finishURL);
        });
    });
};

export const getPurpurCoreURL = (version, cb) => {
    cb("https://api.purpurmc.org/v2/purpur/" + version + "/latest/download");
};

export const getMagmaCoreURL = (version, cb) => {
    cb("https://api.magmafoundation.org/api/v2/" + version + "/latest/download");
};

export const getCoreByExternalURL = (url, version, cb) => {
    COMMONS.getDataByURL(url, (data) => {
        if (data === false) {
            LOGGER.warning("Oops! An error occurred while fetching cores");
            cb(false);
            return;
        }
        cb(data[version]);
    });
};

/////////////////////////////////////////////////
/* ФУНКЦИИ ДЛЯ ПОЛУЧЕНИЯ СПИСКА ДОСТУПНЫХ ЯДЕР */
/////////////////////////////////////////////////

export const getAllPaperLikeCores = (cb, core = "paper") => {
    const url = "https://api.papermc.io/v2/projects/" + core;
    COMMONS.getDataByURL(url, (data) => {
        if (data === false) {
            LOGGER.warning("Oops! An error occurred while fetching cores");
            cb(false);
            return;
        }

        LOGGER.log("data paper", data, core,url);
        let paperCoresList = data.versions;
        paperCoresList.reverse();
        cb(paperCoresList);
    });
}

export const getAllMagmaCores = (cb) => {
    COMMONS.getDataByURL("https://api.magmafoundation.org/api/v2/allVersions", (data) => {
        if (data === false) {
            LOGGER.warning("Oops! An error occurred while fetching cores");
            cb(false);
            return;
        }
        cb(data);
    });
}

export const getAllPurpurCores = (cb) => {
    COMMONS.getDataByURL("https://api.purpurmc.org/v2/purpur/", (data) => {
        if (data === false) {
            LOGGER.warning("Oops! An error occurred while fetching cores");
            cb(false);
            return;
        }
        let purpurCores2 = data.versions;
        purpurCores2.reverse();
        cb(purpurCores2);
    });
}

export const getAllCoresByExternalURL = (url, cb, name) => {
    let resultList = [];
    LOGGER.log("url", url, name);
    COMMONS.getDataByURL(url, (data) => {
        if (data === false) {
            LOGGER.warning("Oops! An error occurred while fetching cores", url, data);
            cb(false);
            return;
        }
        for (const [key] of Object.entries(data)) {
            resultList.push(key);
        }
        LOGGER.log("url", url, resultList, name);
        cb(resultList);
    });
};