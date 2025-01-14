import * as PREDEFINED from "./predefined.js";
import * as COMMONS from "./commons.js";    
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const packageJSON = require("./../package.json");
globalThis.cachedUpdate = null;

// Функция для получения объекта релизов с GitHub
export const getGitHubReleases = (cb) => {
    COMMONS.getDataByURL(PREDEFINED.UPDATES_URL_API, cb);
};

// Получить последнюю версию из релизов на GitHub   
export const getLatestVersionOnGitHub = (cb) => {
    getGitHubReleases((ghReleases) => {
        if (ghReleases !== false) {
            if (typeof ghReleases !== "undefined" && typeof ghReleases[0] !== "undefined" && typeof ghReleases[0].tag_name !== "undefined") {
                cb({
                    version: ghReleases[0].tag_name.replace("v", ""),
                    url: ghReleases[0].html_url,
                    body: ghReleases[0].body
                });
            } else {
                cb(false);
            }
        } else {
            cb(false);
        }

    });
};

// Проверить обновления (возвращает false или ссылку на обновление)
export const checkForUpdates = (cb) => {
    getLatestVersionOnGitHub((ghLatestVer) => {
        saveUpdateToCache(ghLatestVer);
        if (ghLatestVer !== false) {
            if (packageJSON.version !== ghLatestVer.version) {
                cb(ghLatestVer.url);
            } else {
                cb(false);
            }
        } else {
            cb(false);
        }
    });
};

// Сохранить обновление в кеш
export const saveUpdateToCache = (latVer) => {
    if (latVer !== false && packageJSON.version !== latVer.version) {
        cachedUpdate = {
            hasUpdate: true,
            version: {
                current: packageJSON.version,
                new: latVer.version
            },
            url: latVer.url,
            body: latVer.body
        }
        return;
    }
    cachedUpdate = {
        hasUpdate: false
    }
};

// Получить информацию об обновлении из кеша
export const getCachedUpdate = () => {
    if(cachedUpdate === null){
        return false;
    }
    return cachedUpdate;
}