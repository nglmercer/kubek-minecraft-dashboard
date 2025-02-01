import fs from "fs";
import path from "path";
import colors from "colors";
import PREDEFINED from "./predefined.js";
import * as COMMONS from "./commons.js";
import * as SECURITY from "./security.js";
import * as SERVERS_CONTROLLER from "./serversController.js";

class ConfigManager {
    constructor() {
        this.autoStartedServers = [];
        this.mainConfig = this.readMainConfig();
        this.usersConfig = this.readUsersConfig();
        this.serversConfig = this.readServersConfig();
    }

    // Helper methods
    readAnyConfig(filePath) {
        if (path.extname(filePath) === ".json") {
            return JSON.parse(fs.readFileSync(filePath).toString());
        }
        return false;
    }

    ensureDirectoryExists(filePath) {
        const dirname = path.dirname(filePath);
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, { recursive: true });
        }
    }

    writeAnyConfig(filePath, data) {
        if (path.extname(filePath) === ".json") {
            try {
                this.ensureDirectoryExists(filePath);
                if (typeof data === "object") {
                    data = JSON.stringify(data, null, "\t");
                }
                fs.writeFileSync(filePath, data);
                return true;
            } catch (error) {
                console.error(`Error writing config file ${filePath}:`, error);
                return false;
            }
        }
        return false;
    }

    migrateOldMainConfig() {
        let newConfig = PREDEFINED.CONFIGURATIONS.MAIN;
        let oldConfig = this.readAnyConfig("./config.json");
        if (oldConfig.configVersion !== PREDEFINED.CONFIGURATIONS.MAIN.configVersion) {
            this.writeAnyConfig("./config.json.old", oldConfig);
            newConfig.ftpd.enabled = oldConfig.ftpd;
            newConfig.ftpd.username = oldConfig["ftpd-user"];
            newConfig.ftpd.password = oldConfig["ftpd-password"];
            newConfig.authorization = oldConfig.auth;
            newConfig.language = oldConfig.lang;
            newConfig.webserverPort = oldConfig["webserver-port"];
            this.writeAnyConfig("./config.json", newConfig);
            this.reloadAllConfigurations();
            console.log(colors.yellow("config.json"), " migration success!");
            return true;
        }
        return false;
    }

    migrateOldServersConfig() {
        let newConfig = PREDEFINED.CONFIGURATIONS.SERVERS;
        let oldConfig = this.readAnyConfig("./servers/servers.json");
        if (Object.keys(oldConfig).length > 0 && typeof oldConfig[Object.keys(oldConfig)[0]].game === "undefined") {
            this.writeAnyConfig("./servers/servers.json.old", oldConfig);
            Object.keys(oldConfig).forEach(key => {
                let serverType = "java";
                if (fs.existsSync("./servers/" + key + "/bedrock_server.exe") || fs.existsSync("./servers/" + key + "/bedrock_server")) {
                    serverType = "bedrock";
                }
                newConfig[key] = {
                    status: PREDEFINED.SERVER_STATUSES.STOPPED,
                    restartOnError: true,
                    maxRestartAttempts: 3,
                    game: "minecraft",
                    minecraftType: serverType,
                    stopCommand: oldConfig[key].stopCommand || "stop"
                };
            });
            this.writeAnyConfig("./servers/servers.json", newConfig);
            this.reloadAllConfigurations();
            console.log(colors.yellow("servers.json"), " migration success!");
            return true;
        }
        return false;
    }

    writeDefaultConfig() {
        let preparedDefaultConfig = PREDEFINED.CONFIGURATIONS.MAIN;
        preparedDefaultConfig["language"] = COMMONS.detectUserLocale();
        return this.writeAnyConfig("config.json", preparedDefaultConfig);
    }

    writeDefaultUsersConfig() {
        let newHash = SECURITY.generateSecureID();
        let preparedUsersConfig = PREDEFINED.CONFIGURATIONS.USERS;
        preparedUsersConfig["kubek"]["secret"] = newHash;
        return this.writeAnyConfig("users.json", preparedUsersConfig);
    }

    readMainConfig() {
        if (!fs.existsSync("config.json")) {
            this.writeDefaultConfig();
            return PREDEFINED.CONFIGURATIONS.MAIN;
        }
        return this.readAnyConfig("config.json");
    }

    writeMainConfig(data) {
        return this.writeAnyConfig("config.json", data);
    }

    readUsersConfig() {
        if (!fs.existsSync("users.json")) {
            this.writeDefaultUsersConfig();
            return PREDEFINED.CONFIGURATIONS.USERS;
        }
        return this.readAnyConfig("users.json");
    }

    writeUsersConfig(data) {
        return this.writeAnyConfig("users.json", data);
    }

    readServersConfig() {
        const serversPath = "./servers/servers.json";
        if (!fs.existsSync(serversPath)) {
            this.ensureDirectoryExists(serversPath);
            this.writeAnyConfig(serversPath, PREDEFINED.CONFIGURATIONS.SERVERS);
            return PREDEFINED.CONFIGURATIONS.SERVERS;
        }
        return this.readAnyConfig(serversPath);
    }

    writeServersConfig(data) {
        return this.writeAnyConfig("./servers/servers.json", data);
    }

    reloadAllConfigurations() {
        this.mainConfig = this.readMainConfig();
        this.usersConfig = this.readUsersConfig();
        this.serversConfig = this.readServersConfig();
    }

    autoStartServers() {
        for (const [key, value] of Object.entries(this.serversConfig)) {
            if (this.serversConfig[key].status !== PREDEFINED.SERVER_STATUSES.STOPPED && !this.autoStartedServers.includes(key)) {
                this.serversConfig[key].status = PREDEFINED.SERVER_STATUSES.STOPPED;
                SERVERS_CONTROLLER.startServer(key);
                this.autoStartedServers.push(key);
            }
        }
    }
}

// Export an instance of ConfigManager
export const configManager = new ConfigManager();

globalThis.autoStartedServers = [];

// Helper functions without 'this'
const readAnyConfig = (filePath) => {
    if (path.extname(filePath) === ".json") {
        return JSON.parse(fs.readFileSync(filePath).toString());
    }
    return false;
};
const ensureDirectoryExists = (filePath) => {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
};
const writeAnyConfig = (filePath, data) => {
    if (path.extname(filePath) === ".json") {
        try {
            ensureDirectoryExists(filePath);
            typeof data === "object" ? data = JSON.stringify(data, null, "\t") : data;
            fs.writeFileSync(filePath, data);
            return true;
        } catch (error) {
            console.error(`Error writing config file ${filePath}:`, error);
            return false;
        }
    }
    return false;
};
export const migrateOldMainConfig = () => {
    let newConfig = PREDEFINED.CONFIGURATIONS.MAIN;
    let oldConfig = readAnyConfig("./config.json");
    if (oldConfig.configVersion !== PREDEFINED.CONFIGURATIONS.MAIN.configVersion) {
        writeAnyConfig("./config.json.old", oldConfig);
        newConfig.ftpd.enabled = oldConfig.ftpd;
        newConfig.ftpd.username = oldConfig["ftpd-user"];
        newConfig.ftpd.password = oldConfig["ftpd-password"];
        newConfig.authorization = oldConfig.auth;
        newConfig.language = oldConfig.lang;
        newConfig.webserverPort = oldConfig["webserver-port"];
        writeAnyConfig("./config.json", newConfig);
        reloadAllConfigurations();
        console.log(colors.yellow("config.json"), " migration success!");
        return true;
    }
    return false;
};

export const migrateOldServersConfig = () => {
    let newConfig = PREDEFINED.CONFIGURATIONS.SERVERS;
    let oldConfig = readAnyConfig("./servers/servers.json");
    if(Object.keys(oldConfig).length > 0 && typeof oldConfig[Object.keys(oldConfig)[0]].game === "undefined"){
        writeAnyConfig("./servers/servers.json.old", oldConfig);
        Object.keys(oldConfig).forEach(key => {
            let serverType = "java";
            if (fs.existsSync("./servers/" + key + "/bedrock_server.exe") || fs.existsSync("./servers/" + key + "/bedrock_server")) {
                serverType = "bedrock";
            }
            newConfig[key] = {
                status: PREDEFINED.SERVER_STATUSES.STOPPED,
                restartOnError: true,
                maxRestartAttempts: 3,
                game: "minecraft",
                minecraftType: serverType,
                stopCommand: oldConfig[key].stopCommand || "stop"
            }
        });
        writeAnyConfig("./servers/servers.json", newConfig);
        reloadAllConfigurations();
        console.log(colors.yellow("servers.json"), " migration success!");
        return true;
    }
    return false;
};

export const writeDefaultConfig = () => {
    let preparedDefaultConfig = PREDEFINED.CONFIGURATIONS.MAIN;
    preparedDefaultConfig["language"] = COMMONS.detectUserLocale();
    return writeAnyConfig("config.json", preparedDefaultConfig);
};

export const writeDefaultUsersConfig = () => {
    let newHash = SECURITY.generateSecureID();
    let preparedUsersConfig = PREDEFINED.CONFIGURATIONS.USERS;
    preparedUsersConfig["kubek"]["secret"] = newHash;
    return writeAnyConfig("users.json", preparedUsersConfig);
};

export const readMainConfig = () => {
    if (!fs.existsSync("config.json")) {
        writeDefaultConfig();
        return PREDEFINED.CONFIGURATIONS.MAIN;
    }
    return readAnyConfig("config.json");
};

export const writeMainConfig = (data) => {
    return writeAnyConfig("config.json", data);
};

export const readUsersConfig = () => {
    if (!fs.existsSync("users.json")) {
        writeDefaultUsersConfig();
        return PREDEFINED.CONFIGURATIONS.USERS;
    }
    return readAnyConfig("users.json");
};

export const writeUsersConfig = (data) => {
    return writeAnyConfig("users.json", data);
};

export const readServersConfig = () => {
    const serversPath = "./servers/servers.json";
    if (!fs.existsSync(serversPath)) {
        ensureDirectoryExists(serversPath);
        writeAnyConfig(serversPath, PREDEFINED.CONFIGURATIONS.SERVERS);
        return PREDEFINED.CONFIGURATIONS.SERVERS;
    }
    return readAnyConfig(serversPath);
};

export const writeServersConfig = (data) => {
    return writeAnyConfig("./servers/servers.json", data);
};
globalThis.mainConfig = readMainConfig();
let mainConfig = globalThis.mainConfig;
globalThis.usersConfig = readUsersConfig();
globalThis.serversConfig = readServersConfig();
export const reloadAllConfigurations = async () => {
    globalThis.mainConfig = readMainConfig();
    globalThis.usersConfig = readUsersConfig();
    globalThis.serversConfig = readServersConfig();
};

export const autoStartServers = () => {
    for (const [key, value] of Object.entries(serversConfig)) {
        if(serversConfig[key].status !== PREDEFINED.SERVER_STATUSES.STOPPED && !autoStartedServers.includes(key)){
            serversConfig[key].status = PREDEFINED.SERVER_STATUSES.STOPPED;
            SERVERS_CONTROLLER.startServer(key);
            autoStartedServers.push(key);
        }
    }
};
export { mainConfig };
// DEVELOPED by seeeroy