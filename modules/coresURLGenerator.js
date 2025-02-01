import * as COMMONS from './commons.js';
import LOGGER from "./logger.js";

/////////////////////////////////////////////////////
/* FUNCTIONS TO GET CORE DOWNLOAD LINKS            */
/////////////////////////////////////////////////////

/**
 * Get Paper-based core download URL (Paper, Folia, etc.)
 * Verified API (2024-05-22): https://api.papermc.io/service-page
 */
export const getPaperCoreURL = (core, version, cb) => {
    const firstStepURL = `https://api.papermc.io/v2/projects/${core}/versions/${version}`;
    LOGGER.log("PaperCore First Step URL", firstStepURL);
    
    COMMONS.getDataByURL(firstStepURL, (data) => {
        if (!data) {
            LOGGER.warning("Failed to fetch Paper build data");
            cb(false);
            return;
        }
        
        const lastBuildNumber = Math.max(...data.builds);
        COMMONS.getDataByURL(`${firstStepURL}/builds/${lastBuildNumber}`, (data2) => {
            if (!data2) {
                LOGGER.warning("Failed to fetch Paper build details");
                cb(false);
                return;
            }
            
            const downloadFileName = data2.downloads.application.name;
            const finishURL = `${firstStepURL}/builds/${lastBuildNumber}/downloads/${downloadFileName}`;
            cb(finishURL);
        });
    });
};

/**
 * Get Purpur core download URL
 * Verified API (2024-05-22): https://purpurmc.org/docs/api
 */
export const getPurpurCoreURL = (version, cb) => {
    cb(`https://api.purpurmc.org/v2/purpur/${version}/latest/download`);
};

/**
 * Get Magma core download URL
 * Verified API (2024-05-22): https://magmafoundation.org/api-docs
 */
export const getMagmaCoreURL = (version, cb) => {
    cb(`https://api.magmafoundation.org/api/v2/${version}/latest/download`);
};

/**
 * Get core URL from external API endpoint
 * Note: External API must return { [version]: url } format
 */
export const getCoreByExternalURL = (url, version, cb) => {
    COMMONS.getDataByURL(url, (data) => {
        if (!data || !data[version]) {
            LOGGER.warning("External API response invalid or missing version");
            cb(false);
            return;
        }
        cb(data[version]);
    });
};

/////////////////////////////////////////////////
/* FUNCTIONS TO GET AVAILABLE CORE VERSIONS    */
/////////////////////////////////////////////////

/**
 * Get Paper-based core versions (Paper, Folia, etc.)
 * Returns reversed version list for chronological order
 */
export const getAllPaperLikeCores = (cb, core = "paper") => {
    const url = `https://api.papermc.io/v2/projects/${core}`;
    COMMONS.getDataByURL(url, (data) => {
        if (!data) {
            LOGGER.warning("Failed to fetch Paper-based core list");
            cb(false);
            return;
        }

        LOGGER.log("PaperCore Version Data", data, core, url);
        const versions = data.versions.reverse();
        cb(versions);
    });
}

/**
 * Get Magma core versions
 * Verified API returns array of versions
 */
export const getAllMagmaCores = (cb) => {
    COMMONS.getDataByURL("https://api.magmafoundation.org/api/v2/allVersions", (data) => {
        if (!data) {
            LOGGER.warning("Failed to fetch Magma versions");
            cb(false);
            return;
        }
        cb(data);
    });
}

/**
 * Get Purpur core versions
 * Returns reversed version list for chronological order
 */
export const getAllPurpurCores = (cb) => {
    COMMONS.getDataByURL("https://api.purpurmc.org/v2/purpur/", (data) => {
        if (!data) {
            LOGGER.warning("Failed to fetch Purpur versions");
            cb(false);
            return;
        }
        const versions = data.versions.reverse();
        cb(versions);
    });
}

/**
 * Get core versions from external source
 * Expects API to return { version: url } object
 */
export const getAllCoresByExternalURL = (url, cb, name) => {
    LOGGER.log("Fetching external cores", url, name);
    COMMONS.getDataByURL(url, (data) => {
        if (!data || typeof data !== 'object') {
            LOGGER.warning("Invalid external core API response", url, data);
            cb(false);
            return;
        }
        
        const resultList = Object.keys(data);
        LOGGER.log("External core versions retrieved", url, resultList, name);
        cb(resultList);
    });
};