import * as PREDEFINED from "./predefined.js";
import * as CORES_URL_GEN from "./coresURLGenerator.js";
export const getCoreVersions = (core, cb) => {
    if (typeof PREDEFINED.SERVER_CORES[core] !== "undefined") {
        let coreItem = PREDEFINED.SERVER_CORES[core];
        const name = coreItem.name || coreItem.versionsMethod;
        switch (coreItem.versionsMethod) {
            case "externalURL":
                CORES_URL_GEN.getAllCoresByExternalURL(coreItem.versionsUrl, cb, name);
                console.log("coreItem.versionsUrl", coreItem.versionsUrl);
                break;
            case "paper":
                CORES_URL_GEN.getAllPaperLikeCores(cb, coreItem.name, name);
                console.log("paper", coreItem, cb, "getAllPaperLikeCores");
                break;
            case "purpur":
                CORES_URL_GEN.getAllPurpurCores(cb, name);
                console.log("Purpur");
                break;
            case "magma":
                CORES_URL_GEN.getAllMagmaCores(cb, name);
                console.log("Magma");
                break;
            default:
                cb(false);
                break;
        }
    } else {
        cb(false);
    }
};
export const getCoreVersionURL = (core, version, cb) => {
    if (typeof PREDEFINED.SERVER_CORES[core] !== "undefined" && version !== "undefined") {
        let coreItem = PREDEFINED.SERVER_CORES[core];
        switch (coreItem.urlGetMethod) {
            case "externalURL":
                CORES_URL_GEN.getCoreByExternalURL(coreItem.versionsUrl, version, cb);
                console.log("externalURL", coreItem.versionsUrl, version);
                break;
            case "paper":
                CORES_URL_GEN.getPaperCoreURL(coreItem.name, version, cb);
                console.log("Paper", coreItem.name, version);
                break;
            case "purpur":
                CORES_URL_GEN.getPurpurCoreURL(version, cb);
                console.log("Purpur", version);
                break;
            case "magma":
                CORES_URL_GEN.getMagmaCoreURL(version, cb);
                console.log("Magma", version);
                break;
            default:
                cb(false);
                break;
        }
    } else {
        cb(false);
    }
};
export const getCoresList = () => {
    return PREDEFINED.SERVER_CORES;
};