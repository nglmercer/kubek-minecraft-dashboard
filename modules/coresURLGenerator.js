const COMMONS = require('./commons');
const LOGGER = require("./logger");

/////////////////////////////////////////////////////
/* ФУНКЦИИ ДЛЯ ПОЛУЧЕНИЯ ССЫЛОК НА СКАЧИВАНИЕ ЯДЕР */
/////////////////////////////////////////////////////

// Метод с API PaperMC
exports.getPaperCoreURL = (core, version, cb) => {
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

// Метод с API PurpurMC
exports.getPurpurCoreURL = (version, cb) => {
    cb("https://api.purpurmc.org/v2/purpur/" + version + "/latest/download");
};

// Метод с API MagmaFoundation
exports.getMagmaCoreURL = (version, cb) => {
    cb("https://api.magmafoundation.org/api/v2/" + version + "/latest/download");
};

// Метод с external URL
exports.getCoreByExternalURL = (url, version, cb) => {
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

// Метод с API PaperMC
exports.getAllPaperLikeCores = (cb, core = "paper") => {
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

// Метод с API MagmaFoundation
exports.getAllMagmaCores = (cb) => {
    COMMONS.getDataByURL("https://api.magmafoundation.org/api/v2/allVersions", (data) => {
        if (data === false) {
            LOGGER.warning("Oops! An error occurred while fetching cores");
            cb(false);
            return;
        }
        cb(data);
    });
}

// Метод с API PurpurMC
exports.getAllPurpurCores = (cb) => {
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

// Метод с external URL
exports.getAllCoresByExternalURL = (url, cb, name) => {
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