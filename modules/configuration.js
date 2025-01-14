import fs from "fs";
import path from "path";
import colors from "colors";
import * as PREDEFINED from "./predefined.js";
import * as COMMONS from "./commons.js";
import * as SECURITY from "./security.js";
import * as SERVERS_CONTROLLER from "./serversController.js";


globalThis.autoStartedServers = [];
export const migrateOldMainConfig = () => {
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
    } else {
        return false;
    }
};

export const migrateOldServersConfig = () => {
    let newConfig = PREDEFINED.CONFIGURATIONS.SERVERS;
    let oldConfig = this.readAnyConfig("./servers/servers.json");
    if(Object.keys(oldConfig).length > 0 && typeof oldConfig[Object.keys(oldConfig)[0]].game === "undefined"){
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
            }
        });
        this.writeAnyConfig("./servers/servers.json", newConfig);
        this.reloadAllConfigurations();
        console.log(colors.yellow("servers.json"), " migration success!");
        return true;
    } else {
        return false;
    }
};

export const writeDefaultConfig = () => {
    let preparedDefaultConfig = PREDEFINED.CONFIGURATIONS.MAIN;
    preparedDefaultConfig["language"] = COMMONS.detectUserLocale();
    this.writeAnyConfig("config.json", preparedDefaultConfig);
    return true;
};

export const writeDefaultUsersConfig = () => {
    let newHash = SECURITY.generateSecureID();
    let preparedUsersConfig = PREDEFINED.CONFIGURATIONS.USERS;
    preparedUsersConfig["kubek"]["secret"] = newHash;
    this.writeAnyConfig("users.json", preparedUsersConfig);
    return true;
};

export const readAnyConfig = (filePath) => {
    if (path.extname(filePath) === ".json") {
        return JSON.parse(fs.readFileSync(filePath).toString());
    } else {
        return false;
    }
};

export const writeAnyConfig = (filePath, data) => {
    if (path.extname(filePath) === ".json") {
        // Если data в виде объекта, то превращаем в JSON
        typeof data === "object" ? data = JSON.stringify(data, null, "\t") : data;
        fs.writeFileSync(filePath, data);
        return true;
    } else {
        return false;
    }
};


export const readMainConfig = () => {
    if (!fs.existsSync("config.json")) {
        this.writeDefaultConfig();
        return PREDEFINED.CONFIGURATIONS.MAIN;
    } else {
        return this.readAnyConfig("config.json");
    }
};

export const writeMainConfig = (data) => {
    return this.writeAnyConfig("config.json", data);
};


export const readUsersConfig = () => {
    if (!fs.existsSync("users.json")) {
        this.writeDefaultUsersConfig();
        return PREDEFINED.CONFIGURATIONS.USERS;
    } else {
        return this.readAnyConfig("users.json");
    }
};

export const writeUsersConfig = (data) => {
    return this.writeAnyConfig("users.json", data);
};


export const readServersConfig = () => {
    if (!fs.existsSync("./servers/servers.json")) {
        this.writeAnyConfig("./servers/servers.json", PREDEFINED.CONFIGURATIONS.SERVERS);
        return PREDEFINED.CONFIGURATIONS.SERVERS;
    } else {
        return this.readAnyConfig("./servers/servers.json");
    }
};

export const autoStartServers = () => {
    for (const [key, value] of Object.entries(serversConfig)) {
        if(serversConfig[key].status !== PREDEFINED.SERVER_STATUSES.STOPPED && !autoStartedServers.includes(key)){
            // Запускаем сервер, который был запущен до остановки Kubek
            serversConfig[key].status = PREDEFINED.SERVER_STATUSES.STOPPED;
            SERVERS_CONTROLLER.startServer(key);
            autoStartedServers.push(key);
        }
    }
};

export const writeServersConfig = (data) => {
    return this.writeAnyConfig("./servers/servers.json", data);
};

export const reloadAllConfigurations = async () => {
    globalThis.mainConfig = await this.readMainConfig();
    globalThis.usersConfig = await this.readUsersConfig();
    globalThis.serversConfig = await this.readServersConfig();
};

// DEVELOPED by seeeroy