import * as PREDEFINED from "./predefined.js";
import * as COMMONS from "./commons.js";
import * as SERVERS_MANAGER from "./serversManager.js";
import * as FILE_MANAGER from "./fileManager.js";
import * as MULTILANG from "./multiLanguage.js";
import * as ERRORS_PARSER from "./minecraftErrorsParser.js";
import fs from "fs";
import path from "path";
import treekill from "tree-kill";
import spParser from "minecraft-server-properties";
import {spawn} from "node:child_process";
import mcs from "node-mcstatus";
globalThis.serversInstances = {};
globalThis.instancesLogs = {};
globalThis.restartAttempts = {};
globalThis.serversToManualRestart = [];

export const isServerReadyToStart = (serverName) => {
    let serverStarterPath = getStartFilePath(serverName);
    if (serverStarterPath === false) {
        return false;
    }
    return Object.keys(serversConfig).includes(serverName) && serversConfig[serverName].status === PREDEFINED.SERVER_STATUSES.STOPPED && fs.existsSync(serverStarterPath);
};

export const getServerLog = (serverName, linesCountMinus = -100) => {
    if (COMMONS.isObjectsValid(instancesLogs[serverName])) {
        return instancesLogs[serverName].split(/\r?\n/).slice(linesCountMinus).join("\r\n").replaceAll(/\</gim, "&lt;").replaceAll(/\>/gim, "&gt;");
    }
    return "";
};

export const writeServerLog = (serverName, data) => {
    instancesLogs[serverName] = instancesLogs[serverName] + data;
    return true;
};

export const doServersLogsCleanup = () => {
    Object.keys(instancesLogs).forEach(serverName => {
        instancesLogs[serverName] = instancesLogs[serverName].split(/\r?\n/)
            .slice(PREDEFINED.MAX_SERVER_LOGS_LENGTH_MINUS)
            .join("\r\n");
    });
    return true;
};

export const prepareServerToStart = (serverName) => {
    instancesLogs[serverName] = "";
    let serverStarterPath = getStartFilePath(serverName);
    if (serverStarterPath === false) {
        return false;
    }
    let spawnArgs = [];
    // Создаём аргументы для spawn и путь к файлу в зависимости от платформы
    if (process.platform === "win32") {
        spawnArgs[0] = path.resolve(serverStarterPath);
    } else if (process.platform === "linux") {
        spawnArgs[0] = "sh";
        spawnArgs[1] = [path.resolve(serverStarterPath)];
    } else {
        return false;
    }
    SERVERS_MANAGER.setServerStatus(serverName, PREDEFINED.SERVER_STATUSES.STARTING);
    return {
        path: serverStarterPath,
        spawnArgs: spawnArgs
    };
};

export const stopServer = (serverName) => {
    if (SERVERS_MANAGER.isServerExists(serverName) && SERVERS_MANAGER.getServerStatus(serverName) === PREDEFINED.SERVER_STATUSES.RUNNING) {
        writeToStdin(serverName, SERVERS_MANAGER.getServerInfo(serverName).stopCommand);
        return true;
    }
    return false;
}

export const startServer = (serverName) => {
    if (isServerReadyToStart(serverName)) {
        // Получаем параметры запуска и производим запуск
        let startProps = prepareServerToStart(serverName);
        if (startProps !== false) {
            // Создаём spawn и добавляем хэндлеры
            if (startProps.spawnArgs.length === 1) {
                serversInstances[serverName] = spawn(`"${startProps.spawnArgs[0]}"`, {shell: true});
            } else if (startProps.spawnArgs.length === 2) {
                serversInstances[serverName] = spawn(`"${startProps.spawnArgs[0]}"`, startProps.spawnArgs[1], {shell: true});
            } else {
                return false;
            }
            addInstanceCloseEventHandler(serverName);
            addInstanceStdEventHandler(serverName);
            return true;
        }
    }
    return false;
};

export const restartServer = (serverName) => {
    serversToManualRestart.push(serverName);
    stopServer(serverName);
    return true;
};

export const addInstanceCloseEventHandler = (serverName) => {
    serversInstances[serverName].on("close", (code) => {
        SERVERS_MANAGER.setServerStatus(serverName, PREDEFINED.SERVER_STATUSES.STOPPED);
        if (code != null && code > 1 && code !== 127) {
            // Если сервер завершился НЕНОРМАЛЬНО
            writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.stopCode}}", code));
            if (serversConfig[serverName].restartOnError === true) {
                if (restartAttempts[serverName] >= serversConfig[serverName].maxRestartAttempts) {
                    // Если не удалось запустить сервер после макс. кол-ва попыток
                    writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.restartFailed}}", restartAttempts[serverName]));
                } else {
                    // Пробуем перезапустить сервер
                    if (COMMONS.isObjectsValid(restartAttempts[serverName])) {
                        restartAttempts[serverName]++;
                    } else {
                        restartAttempts[serverName] = 1;
                    }
                    writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.restartAttempt}}", restartAttempts[serverName]));
                    startServer(serverName);
                }
            }
        } else if (code === 1 || code === 127) {
            // Если сервер был убит
            writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.killed}}"));
        } else {
            writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.gracefulShutdown}}"));
            // Перезапускаем сервер, если он есть в массиве для перезапуска
            if(serversToManualRestart.includes(serverName)){
                startServer(serverName);
                serversToManualRestart.splice(serversToManualRestart.indexOf(serverName), 1);
            }
        }
    });
};

export const handleServerStd = (serverName, data) => {
    //data = iconvlite.decode(data, "utf-8").toString();
    data = data.toString();
    writeServerLog(serverName, data);
    // Проверяем на ошибки
    let isAnyErrorsHere = ERRORS_PARSER.checkStringForErrors(data);
    if(isAnyErrorsHere !== false){
        // Добавляем в лог описание найденных ошибок
        writeServerLog(serverName, "§c§l" + MULTILANG.translateText(currentLanguage, isAnyErrorsHere));
    }

    // Проверяем маркеры смены статуса
    Object.keys(PREDEFINED.SERVER_STATUS_CHANGE_MARKERS).forEach((key) => {
        if (COMMONS.testForRegexArray(data, PREDEFINED.SERVER_STATUS_CHANGE_MARKERS[key])) {
            // При нахождении маркера меняем статус
            SERVERS_MANAGER.setServerStatus(serverName, PREDEFINED.SERVER_STATUSES[key]);
        }
    });
};

export const addInstanceStdEventHandler = (serverName) => {
    serversInstances[serverName].stdout.on("data", (data) => {
        handleServerStd(serverName, data);
    });
    serversInstances[serverName].stderr.on("data", (data) => {
        handleServerStd(serverName, data);
    });
};

export const writeToStdin = (serverName, data) => {
    if (COMMONS.isObjectsValid(serversInstances[serverName])) {
        data = Buffer.from(data, "utf-8").toString();
        writeServerLog(serverName, data + "\n");
        serversInstances[serverName].stdin.write(data + "\n");
        return true;
    }
    return false;
};

export const killServer = (serverName) => { 
    if (COMMONS.isObjectsValid(serversInstances[serverName], serversInstances[serverName].pid)) {
        treekill(serversInstances[serverName].pid, () => {
        });
        return true;
    }
    return false;
};

export const getStartScript = (serverName) => {
    let startFileData, startFilePath;
    if (SERVERS_MANAGER.isServerExists(serverName)) {
        startFilePath = getStartFilePath(serverName);
        startFileData = fs.readFileSync(startFilePath);
        startFileData = startFileData.toString().split("\n");
        return startFileData[startFileData.length - 1];
    }
    return false;
};

export const setStartScript = (serverName, data) => {
    let startFileData, startFilePath;
    if (SERVERS_MANAGER.isServerExists(serverName)) {
        startFilePath = getStartFilePath(serverName);
        startFileData = fs.readFileSync(startFilePath);
        startFileData = startFileData.toString().split("\n");
        startFileData[startFileData.length - 1] = data;
        fs.writeFileSync(startFilePath, startFileData.join("\n"));
        return true;
    }
    return false;
};

export const getStartFilePath = (serverName) => {
    if (process.platform === "win32") {
        return "./servers/" + serverName + "/start.bat";
    } else if (process.platform === "linux") {
        return "./servers/" + serverName + "/start.sh";
    } else {
        return false;
    }
};

export const getServerProperties = (serverName) => {
    let spFilePath = "./servers/" + serverName + "/server.properties";
    if (fs.existsSync(spFilePath)) {
        let spFileData = fs.readFileSync(spFilePath).toString();
        let parsed = spParser.parse(spFileData);
        if(parsed['generator-settings']){
            parsed['generator-settings'] = JSON.stringify(parsed['generator-settings']);
        }
        return parsed;
    }
    return false;
};

export const saveServerProperties = (serverName, data) => {
    let parsed = JSON.parse(data);
    let result = "";
    for (const [key, value] of Object.entries(parsed)) {
        result += "\n" + key.toString() + "=" + value.toString();
    }
    FILE_MANAGER.writeFile(serverName, "/server.properties", result);
    return true;
};

export const queryServer = (serverName, cb) => {
    let spData = getServerProperties(serverName);
    if (COMMONS.isObjectsValid(spData['server-port']) && COMMONS.isObjectsValid(serversInstances[serverName])) {
        let chkPort = spData['server-port'];
        const chkOptions = {query: false};
        mcs.statusJava("127.0.0.1", chkPort, chkOptions)
            .then((result) => {
                cb(result);
            })
            .catch((error) => {
                console.error(error);
                cb(false);
            })
    } else {
        cb(false);
    }
}

// DEVELOPED by seeeroy