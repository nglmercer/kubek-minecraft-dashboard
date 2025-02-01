import PREDEFINED from "./predefined.js";
import * as CONFIGURATION from "./configuration.js";
import * as COMMONS from "./commons.js";
import fs from "fs";
import TASK_MANAGER from "./taskManager.js";
import path from "path";

export const isServerExists = (serverName) => {
    return typeof serversConfig[serverName] !== "undefined";
};

export const getServerInfo = (serverName) => {
    if (isServerExists(serverName)) {
        return serversConfig[serverName];
    }
    return false;
};

export const writeServerInfo = (serverName, data) => {
    if (isServerExists(serverName)) {
        serversConfig[serverName] = data;
        CONFIGURATION.writeServersConfig(serversConfig);
        return true;
    }
    return false;
};

export const getServerStatus = (serverName) => {
    let serverData = getServerInfo(serverName);
    if (serverData !== false) {
        return serverData.status;
    }
    return false;
};

export const setServerStatus = (serverName, status) => {
    if (isServerExists(serverName) && Object.values(PREDEFINED.SERVER_STATUSES).includes(status) && serversConfig[serverName].status !== status) {
        serversConfig[serverName].status = status;
        CONFIGURATION.writeServersConfig(serversConfig);
        return true;
    }
    return false;
};

export const setServerProperty = (serverName, property, value) => {
    if (isServerExists(serverName) && COMMONS.isObjectsValid(property, value, serversConfig[serverName][property])) {
        serversConfig[serverName][property] = value;
        CONFIGURATION.writeServersConfig(serversConfig);
        return true;
    }
    return false;
};

export const getServersList = () => {
    return Object.keys(serversConfig);
};

export const deleteServer = (serverName) => {
    if(isServerExists(serverName) && getServerStatus(serverName) === PREDEFINED.SERVER_STATUSES.STOPPED){
        // Добавляем новую таску
        let serverDelTaskID = TASK_MANAGER.addNewTask({
            type: PREDEFINED.TASKS_TYPES.DELETION,
            server: serverName,
            status: PREDEFINED.SERVER_STATUSES.RUNNING
        })

        // Запускаем удаление папки
        fs.rm("./servers/" + serverName, { recursive: true, force: true }, (err) => {
            if(err){
                throw err;
            }
            // Удаляем сервер из конфигурации и меняем статус таски
            serversConfig[serverName] = null;
            delete serversConfig[serverName];
            CONFIGURATION.writeServersConfig(serversConfig);
            let tData = TASK_MANAGER.getTaskData(serverDelTaskID);
            tData.status = PREDEFINED.SERVER_CREATION_STEPS.COMPLETED;
        });
        return true;
    }
    return false;
};