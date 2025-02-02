import PREDEFINED from "./predefined.js";
import { configManager } from "./configuration.js";
import UserAuth from "./security.js";
import * as COMMONS from "./commons.js";
let usersConfig = globalThis.usersConfig;
const SECURITY = new UserAuth(configManager.mainConfig, usersConfig);
// Проверка permissions для управления аккаунтами
export function initializeWebServer(webServer) {
    webServer.use("/api/accounts", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        if (chkUserPermission(req, PREDEFINED.PERMISSIONS.ACCOUNTS)) {
            return next();
        }
        return res.sendStatus(403);
    })
    
    // Проверка permissions для управления ядрами
    webServer.use("/api/cores", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        if (chkUserPermission(req, PREDEFINED.PERMISSIONS.MAKING_SERVERS)) {
            return next();
        }
        return res.sendStatus(403);
    })
    
    // Проверка permissions для создания сервера
    webServer.use("/api/servers/new", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        if (chkUserPermission(req, PREDEFINED.PERMISSIONS.MAKING_SERVERS)) {
            return next();
        }
        return res.sendStatus(403);
    })
    
    // Проверка permissions для управления файлами
    webServer.use("/api/fileManager", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        if (chkUserPermission(req, PREDEFINED.PERMISSIONS.FILE_MANAGER)) {
            return next();
        }
        return res.sendStatus(403);
    })
    
    // Проверка permissions для управления и установки Java
    webServer.use("/api/java", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        if (chkUserPermission(req, PREDEFINED.PERMISSIONS.MANAGE_JAVA)) {
            return next();
        }
        return res.sendStatus(403);
    })
    
    // Проверка permissions для управления модами
    webServer.use("/api/mods", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        if (chkUserPermission(req, PREDEFINED.PERMISSIONS.MANAGE_PLUGINS)) {
            return next();
        }
        return res.sendStatus(403);
    })
    
    // Проверка permissions для управления плагинами
    webServer.use("/api/plugins", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        if (chkUserPermission(req, PREDEFINED.PERMISSIONS.MANAGE_PLUGINS)) {
            return next();
        }
        return res.sendStatus(403);
    })
    
    // Проверка permissions для управления настройками Kubek
    webServer.use("/api/kubek/settings", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        if (chkUserPermission(req, PREDEFINED.PERMISSIONS.KUBEK_SETTINGS)) {
            return next();
        }
        return res.sendStatus(403);
    })
    
    // Проверка permissions для мониторинга системы
    webServer.use("/api/kubek/hardware/summary", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        if (chkUserPermission(req, PREDEFINED.PERMISSIONS.SYSTEM_MONITORING)) {
            return next();
        }
        return res.sendStatus(403);
    })
    
    // Проверка permissions для просмотра задач
    webServer.use("/api/tasks", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        if (chkUserPermission(req, PREDEFINED.PERMISSIONS.DEFAULT)) {
            return next();
        }
        return res.sendStatus(403);
    })
    
    // Проверка permissions для авторизации
    webServer.use("/api/auth", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        if (chkUserPermission(req, PREDEFINED.PERMISSIONS.DEFAULT)) {
            return next();
        }
        return res.sendStatus(403);
    })
    
    // Проверка permissions для создания сервера
    webServer.use("/api/servers", (req, res, next) => {
        // Проверка URL на разрешённую для пропуска проверки прав
        if (COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
            return next();
        }
    
        let method = req.method;
        let semiPath = req.path;
        let chkMonitor = chkUserPermission(req, PREDEFINED.PERMISSIONS.MONITOR_SERVERS);
        let chkManage = chkUserPermission(req, PREDEFINED.PERMISSIONS.MANAGE_SERVERS);
        if (chkManage && chkMonitor) {
            return next();
        } else if (!chkManage && chkMonitor) {
            let isFoundInArray = false;
            PREDEFINED.MONITOR_SERVERS_PERM_URLS.forEach((item) => {
                if ((typeof item.url === "string" && item.url === semiPath) || (typeof item.url === "object" && semiPath.match(item.url) !== null)) {
                    if (item.method === method) {
                        isFoundInArray = true;
                    }
                }
            });
            if(isFoundInArray === true){
                return next();
            }
        }
        return res.sendStatus(403);
    })
}
export const chkUserPermission = (req, permission) => {
    if (configManager.mainConfig.authorization === false) {
        return true;
    }
    return !!(SECURITY.isUserHasCookies(req) && SECURITY.isUserHasPermission(req.cookies["kbk__login"], permission));

};