import * as PREDEFINED from "./predefined.js";
import * as CORES_URL_GEN from "./coresURLGenerator.js";
export const getCoreVersions = async (core, cb) => {
    if (typeof PREDEFINED.SERVER_CORES[core] !== "undefined") {
        let coreItem = PREDEFINED.SERVER_CORES[core];
        if (!coreItem) {
            cb(false);
            console.log("coreItem false", coreItem);
            return;
        }
        const name = coreItem.name || coreItem.versionsMethod;
        switch (coreItem.versionsMethod) {

            case "vanilla":
                const allVersions = await getAllMinecraftVersions();
                cb(Object.keys(allVersions));
                break;
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
export const getCoreVersionURL = async (core, version, cb) => {
    if (typeof PREDEFINED.SERVER_CORES[core] !== "undefined" && version !== "undefined") {
        let coreItem = PREDEFINED.SERVER_CORES[core];
        if (!coreItem) {
            cb(false);
            console.log("coreItem false", coreItem);
            return;
        }
        switch (coreItem.urlGetMethod) {
            case "vanilla":
                const allVersions = await getAllMinecraftVersions();
                cb(allVersions[version]);
                break;
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
import https from 'https';

const manifestUrl = 'https://piston-meta.mojang.com/mc/game/version_manifest.json';

function getAllMinecraftVersions() {
    return new Promise((resolve, reject) => {
        https.get(manifestUrl, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const manifest = JSON.parse(data);
                const versions = {};
                let pendingRequests = manifest.versions.length;

                if (pendingRequests === 0) resolve(versions);

                manifest.versions.forEach((version) => {
                    https.get(version.url, (versionRes) => {
                        let versionData = '';

                        versionRes.on('data', (chunk) => {
                            versionData += chunk;
                        });

                        versionRes.on('end', () => {
                            try {
                                const versionInfo = JSON.parse(versionData);
                                if (versionInfo.downloads && versionInfo.downloads.server) {
                                    versions[version.id] = versionInfo.downloads.server.url;
                                }
                            } catch (error) {
                                console.error(`Error parsing version ${version.id}:`, error.message);
                            }

                            pendingRequests--;
                            if (pendingRequests === 0) resolve(versions);
                        });
                    }).on('error', (err) => {
                        console.error(`Error fetching version details for ${version.id}:`, err.message);
                        pendingRequests--;
                        if (pendingRequests === 0) resolve(versions);
                    });
                });
            });
        }).on('error', (err) => {
            reject(`Error fetching version manifest: ${err.message}`);
        });
    });
}


//getAllMinecraftVersions().then(console.log).catch(console.error);