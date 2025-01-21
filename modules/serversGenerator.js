import * as TASK_MANAGER from "./taskManager.js";
import * as CORES_MANAGER from "./coresManager.js";
import * as JAVA_MANAGER from "./javaManager.js";
import * as DOWNLOADS_MANAGER from "./downloadsManager.js";
import * as SERVERS_MANAGER from "./serversManager.js";
import * as PREDEFINED from "./predefined.js";
import * as CONFIGURATION from "./configuration.js";
import * as LOGGER from "./logger.js";
import * as MULTILANG from "./multiLanguage.js";
import fs from "fs";
import path from "path";
import colors from "colors";

export async function prepareJavaForServer(javaVersion, cb) {
    try {
        let javaExecutablePath = "";
        let javaDownloadURL = "";
        let isJavaNaN = isNaN(parseInt(javaVersion));

        if (isJavaNaN && fs.existsSync(javaVersion)) {
            javaExecutablePath = javaVersion;
        } else if (!isJavaNaN) {
            // Si se pasa una versión de Java, no hacer nada
        } else {
            cb(false);
            return;
        }

        if (!isJavaNaN) {
            javaExecutablePath = JAVA_MANAGER.getJavaPath(javaVersion);

            if (javaExecutablePath === false) {
                let javaVerInfo = JAVA_MANAGER.getJavaInfoByVersion(javaVersion);
                javaDownloadURL = javaVerInfo.url;
                console.log(javaDownloadURL, javaVerInfo);
                await DOWNLOADS_MANAGER.addDownloadTask(javaDownloadURL, javaVerInfo.downloadPath, (javaDlResult) => {
                    if (javaDlResult === true) {
                        DOWNLOADS_MANAGER.unpackArchive(javaVerInfo.downloadPath, javaVerInfo.unpackPath, (javaUnpackResult) => {
                            if (javaUnpackResult === true) {
                                javaExecutablePath = JAVA_MANAGER.getJavaPath(javaVersion);
                                cb(javaExecutablePath);
                            } else {
                                LOGGER.warning(MULTILANG.translateText(mainConfig.language, "{{console.javaUnpackFailed}}"));
                                cb(false);
                            }
                        }, true);
                    } else {
                        LOGGER.warning(MULTILANG.translateText(mainConfig.language, "{{console.javaDownloadFailed}}"));
                        cb(false);
                    }
                });
            } else {
                cb(javaExecutablePath);
            }
        } else {
            cb(javaExecutablePath);
        }
    } catch (error) {
        console.error("Error in prepareJavaForServer:", error);
        cb(false);
    }
}

// startJavaServerGeneration // GENERATE JAVA SERVER
export async function startJavaServerGeneration(serverName, core, coreVersion, startParameters, javaExecutablePath, serverPort, cb) {
    let coreDownloadURL = "";
    let coreFileName = core + "-" + coreVersion + ".jar";

    // Создаём задачу на создание сервера
    let creationTaskID = TASK_MANAGER.addNewTask({
        type: PREDEFINED.TASKS_TYPES.CREATING,
        serverName: serverName,
        core: core,
        coreVersion: coreVersion,
        startParameters: startParameters,
        javaExecutablePath: javaExecutablePath,
        currentStep: null
    })

    // Если сервер с таким названием уже существует - не продолжаем
    if (SERVERS_MANAGER.isServerExists(serverName)) {
        cb(false);
        return false;
    }

    if (javaExecutablePath !== false) {
        // Создаём весь путь для сервера
        let serverDirectoryPath = "./servers/" + serverName;
        fs.mkdirSync(serverDirectoryPath, {recursive: true});

        if (core.match(/\:\/\//gim) === null && fs.existsSync("./servers/" + serverName + path.sep + core)) {
            // ЕСЛИ ЯДРО РАСПОЛОЖЕНО ЛОКАЛЬНО
            tasks[creationTaskID].currentStep = PREDEFINED.SERVER_CREATION_STEPS.COMPLETED;
            // Добавляем новый сервер в конфиг
            serversConfig[serverName] = {
                status: PREDEFINED.SERVER_STATUSES.STOPPED,
                restartOnError: true,
                maxRestartAttempts: 3,
                game: "minecraft",
                minecraftType: "java",
                stopCommand: "stop"
            };
            // DEVELOPED by seeeroy
            CONFIGURATION.writeServersConfig(serversConfig);
            writeJavaStartFiles(serverName, core, startParameters, javaExecutablePath, serverPort);
            LOGGER.log(MULTILANG.translateText(mainConfig.language, "{{console.serverCreatedSuccess}}", colors.cyan(serverName)));
            cb(true);
        } else {
            // ЕСЛИ ЯДРО НУЖНО СКАЧИВАТЬ
            tasks[creationTaskID].currentStep = PREDEFINED.SERVER_CREATION_STEPS.SEARCHING_CORE;
            CORES_MANAGER.getCoreVersionURL(core, coreVersion, (url) => {
                coreDownloadURL = url;
                tasks[creationTaskID].currentStep = PREDEFINED.SERVER_CREATION_STEPS.CHECKING_JAVA;
                // Скачиваем ядро для сервера
                tasks[creationTaskID].currentStep = PREDEFINED.SERVER_CREATION_STEPS.DOWNLOADING_CORE;
                DOWNLOADS_MANAGER.addDownloadTask(coreDownloadURL, serverDirectoryPath + path.sep + coreFileName, (coreDlResult) => {
                    if (coreDlResult === true) {
                        tasks[creationTaskID].currentStep = PREDEFINED.SERVER_CREATION_STEPS.COMPLETED;
                        // Добавляем новый сервер в конфиг
                        serversConfig[serverName] = {
                            status: PREDEFINED.SERVER_STATUSES.STOPPED,
                            restartOnError: true,
                            maxRestartAttempts: 3,
                            game: "minecraft",
                            minecraftType: "java",
                            stopCommand: "stop"
                        };
                        CONFIGURATION.writeServersConfig(serversConfig);
                        writeJavaStartFiles(serverName, coreFileName, startParameters, javaExecutablePath, serverPort);
                        LOGGER.log(MULTILANG.translateText(mainConfig.language, "{{console.serverCreatedSuccess}}", colors.cyan(serverName)));
                        cb(true);
                    } else {
                        tasks[creationTaskID].currentStep = PREDEFINED.SERVER_CREATION_STEPS.FAILED;
                        LOGGER.warning(MULTILANG.translateText(mainConfig.language, "{{console.coreDownloadFailed}}"));
                        cb(false);
                    }
                });
            });
        }
    }
}
const isTermux = () => {
    return process.platform === 'android' || fs.existsSync('/data/data/com.termux');
};

// Escribir archivos de inicio para servidor Java
export const writeJavaStartFiles = (serverName, coreFileName, startParameters, javaExecutablePath, serverPort) => {
    let fullStartParameters = "-Dfile.encoding=UTF-8 " + startParameters + " -jar " + coreFileName + " nogui";
    let fullJavaExecutablePath = path.resolve(javaExecutablePath);
    
    // Asegurar que el directorio existe
    const serverDir = path.join("./servers", serverName);
    if (!fs.existsSync(serverDir)){
        fs.mkdirSync(serverDir, { recursive: true });
    }

    // Escribir EULA
    fs.writeFileSync(path.join(serverDir, "eula.txt"), "eula=true");

    // Escribir archivo de inicio según la plataforma
    if (isTermux()) {
        // Script de inicio para Termux
        const startScript = `#!/data/data/com.termux/files/usr/bin/bash
        cd "$(dirname "$0")"
        export LD_LIBRARY_PATH=/data/data/com.termux/files/usr/lib
        "${fullJavaExecutablePath}" ${fullStartParameters}`;
        
        fs.writeFileSync(path.join(serverDir, "start.sh"), startScript);
        // Hacer ejecutable el script
        fs.chmodSync(path.join(serverDir, "start.sh"), '755');
    } else if (process.platform === "win32") {
        // Windows
        fs.writeFileSync(
            path.join(serverDir, "start.bat"),
            `@echo off\nchcp 65001>nul\ncd servers\ncd ${serverName}\n"${fullJavaExecutablePath}" ${fullStartParameters}`
        );
    } else if (process.platform === "linux") {
        // Linux
        fs.writeFileSync(
            path.join(serverDir, "start.sh"),
            `cd servers\ncd ${serverName}\n"${fullJavaExecutablePath}" ${fullStartParameters}`
        );
        // Hacer ejecutable el script
        fs.chmodSync(path.join(serverDir, "start.sh"), '755');
    }
    fs.writeFileSync(
        "./servers/" + serverName + "/server.properties",
        "server-port=" +
        serverPort +
        "\nquery.port=" +
        serverPort +
        "\nenable-query=true\nonline-mode=false" +
        "\nmotd=\u00A7f" +
        serverName
    );
    return true;
};
export const writeBedrockStartFiles = (serverName) => {
    const serverDir = path.join("./servers", serverName);
    
    // Asegurar que el directorio existe
    if (!fs.existsSync(serverDir)){
        fs.mkdirSync(serverDir, { recursive: true });
    }

    // Escribir EULA
    fs.writeFileSync(path.join(serverDir, "eula.txt"), "eula=true");

    if (isTermux()) {
        // Script de inicio para Termux
        const startScript = `#!/data/data/com.termux/files/usr/bin/bash
            cd "$(dirname "$0")"
            export LD_LIBRARY_PATH=.
            ./bedrock_server`;
        
        fs.writeFileSync(path.join(serverDir, "start.sh"), startScript);
        // Hacer ejecutable el script
        fs.chmodSync(path.join(serverDir, "start.sh"), '755');
    } else if (process.platform === "win32") {
        fs.writeFileSync(
            path.join(serverDir, "start.bat"),
            "pushd %~dp0\nbedrock_server.exe\npopd"
        );
    } else if (process.platform === "linux") {
        fs.writeFileSync(
            path.join(serverDir, "start.sh"),
            "LD_LIBRARY_PATH=. ./bedrock_server"
        );
        // Hacer ejecutable el script
        fs.chmodSync(path.join(serverDir, "start.sh"), '755');
    }

    return true;
};
//fix android platform