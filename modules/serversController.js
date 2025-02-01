import * as PREDEFINED from "./predefined.js";          // Importa constantes predefinidas
import * as COMMONS from "./commons.js";               // Funciones comunes
import * as SERVERS_MANAGER from "./serversManager.js"; // Módulo para gestionar servidores
import * as FILE_MANAGER from "./fileManager.js";      // Módulo para gestión de archivos
import * as MULTILANG from "./multiLanguage.js";       // Módulo para gestión de idiomas
import * as ERRORS_PARSER from "./minecraftErrorsParser.js"; // Módulo para análisis de errores de Minecraft
import fs from "fs";                                   // Módulo para manejo de archivos
import path from "path";                               // Módulo para manejo de rutas
import treekill from "tree-kill";                      // Librería para matar procesos y sus hijos
import spParser from "minecraft-server-properties";    // Librería para parsear server.properties
import { spawn } from "node:child_process";            // Módulo para crear procesos hijos
import mcs from "node-mcstatus";                       // Librería para consultar el estado de servidores Minecraft

// Variables globales para gestionar instancias de servidores
globalThis.serversInstances = {};       // Almacena las instancias de los servidores
globalThis.instancesLogs = {};          // Almacena los logs de los servidores
globalThis.restartAttempts = {};        // Almacena los intentos de reinicio de los servidores
globalThis.serversToManualRestart = []; // Lista de servidores que deben reiniciarse manualmente

// Verifica si un servidor está listo para iniciar
export const isServerReadyToStart = (serverName) => {
    let serverStarterPath = getStartFilePath(serverName); // Obtiene la ruta del archivo de inicio
    if (serverStarterPath === false) {
        return false;
    }
    // Verifica si el servidor existe, está detenido y el archivo de inicio existe
    return Object.keys(serversConfig).includes(serverName) && 
           serversConfig[serverName].status === PREDEFINED.SERVER_STATUSES.STOPPED && 
           fs.existsSync(serverStarterPath);
};

// Obtiene el log de un servidor
export const getServerLog = (serverName, linesCountMinus = -100) => {
    if (COMMONS.isObjectsValid(instancesLogs[serverName])) {
        // Limita el número de líneas del log y escapa caracteres especiales
        return instancesLogs[serverName].split(/\r?\n/).slice(linesCountMinus).join("\r\n")
               .replaceAll(/\</gim, "&lt;").replaceAll(/\>/gim, "&gt;");
    }
    return "";
};

// Escribe datos en el log de un servidor
export const writeServerLog = (serverName, data) => {
    instancesLogs[serverName] = instancesLogs[serverName] + data;
    return true;
};

// Limpia los logs de todos los servidores
export const doServersLogsCleanup = () => {
    Object.keys(instancesLogs).forEach(serverName => {
        instancesLogs[serverName] = instancesLogs[serverName].split(/\r?\n/)
            .slice(PREDEFINED.MAX_SERVER_LOGS_LENGTH_MINUS)
            .join("\r\n");
    });
    return true;
};

// Prepara un servidor para iniciar
export const prepareServerToStart = (serverName) => {
    instancesLogs[serverName] = ""; // Limpia el log del servidor
    let serverStarterPath = getStartFilePath(serverName); // Obtiene la ruta del archivo de inicio
    if (serverStarterPath === false) {
        return false;
    }
    let spawnArgs = [];
    // Configura los argumentos de spawn según la plataforma
    if (process.platform === "win32") {
        spawnArgs[0] = path.resolve(serverStarterPath); // Windows: usa el archivo .bat
    } else if (process.platform === "linux" || process.platform === "android") {
        spawnArgs[0] = "sh"; // Linux/Android: usa el archivo .sh
        spawnArgs[1] = [path.resolve(serverStarterPath)];
    } else {
        return false; // Plataforma no soportada
    }
    SERVERS_MANAGER.setServerStatus(serverName, PREDEFINED.SERVER_STATUSES.STARTING); // Cambia el estado a "iniciando"
    return {
        path: serverStarterPath,
        spawnArgs: spawnArgs
    };
};

// Detiene un servidor
export const stopServer = (serverName) => {
    if (SERVERS_MANAGER.isServerExists(serverName) && 
        SERVERS_MANAGER.getServerStatus(serverName) === PREDEFINED.SERVER_STATUSES.RUNNING) {
        writeToStdin(serverName, SERVERS_MANAGER.getServerInfo(serverName).stopCommand); // Envía el comando de detención
        return true;
    }
    return false;
};

// Inicia un servidor
export const startServer = (serverName) => {
    if (isServerReadyToStart(serverName)) {
        let startProps = prepareServerToStart(serverName); // Prepara el servidor para iniciar
        if (startProps !== false) {
            // Crea un proceso hijo para iniciar el servidor
            if (startProps.spawnArgs.length === 1) {
                serversInstances[serverName] = spawn(`"${startProps.spawnArgs[0]}"`, { shell: true });
            } else if (startProps.spawnArgs.length === 2) {
                serversInstances[serverName] = spawn(`"${startProps.spawnArgs[0]}"`, startProps.spawnArgs[1], { shell: true });
            } else {
                return false;
            }
            addInstanceCloseEventHandler(serverName); // Añade manejador de cierre
            addInstanceStdEventHandler(serverName);   // Añade manejador de salida estándar
            return true;
        }
    }
    return false;
};

// Reinicia un servidor
export const restartServer = (serverName) => {
    serversToManualRestart.push(serverName); // Añade el servidor a la lista de reinicio
    stopServer(serverName); // Detiene el servidor
    return true;
};

// Añade un manejador de eventos para el cierre de la instancia
export const addInstanceCloseEventHandler = (serverName) => {
    serversInstances[serverName].on("close", (code) => {
        SERVERS_MANAGER.setServerStatus(serverName, PREDEFINED.SERVER_STATUSES.STOPPED); // Cambia el estado a "detenido"
        if (code != null && code > 1 && code !== 127) {
            // Si el servidor se detuvo de manera anormal
            writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.stopCode}}", code));
            if (serversConfig[serverName].restartOnError === true) {
                if (restartAttempts[serverName] >= serversConfig[serverName].maxRestartAttempts) {
                    // Si se superó el número máximo de intentos de reinicio
                    writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.restartFailed}}", restartAttempts[serverName]));
                } else {
                    // Intenta reiniciar el servidor
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
            // Si el servidor fue detenido manualmente
            writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.killed}}"));
        } else {
            // Si el servidor se detuvo correctamente
            writeServerLog(serverName, MULTILANG.translateText(currentLanguage, "{{serverConsole.gracefulShutdown}}"));
            // Reinicia el servidor si está en la lista de reinicio manual
            if (serversToManualRestart.includes(serverName)) {
                startServer(serverName);
                serversToManualRestart.splice(serversToManualRestart.indexOf(serverName), 1);
            }
        }
    });
};

// Manejador de la salida estándar del servidor
export const handleServerStd = (serverName, data) => {
    data = data.toString(); // Convierte los datos a cadena
    writeServerLog(serverName, data); // Escribe los datos en el log
    // Verifica si hay errores en los datos
    let isAnyErrorsHere = ERRORS_PARSER.checkStringForErrors(data);
    if (isAnyErrorsHere !== false) {
        writeServerLog(serverName, "§c§l" + MULTILANG.translateText(currentLanguage, isAnyErrorsHere)); // Añade el error al log
    }

    // Verifica los marcadores de cambio de estado
    Object.keys(PREDEFINED.SERVER_STATUS_CHANGE_MARKERS).forEach((key) => {
        if (COMMONS.testForRegexArray(data, PREDEFINED.SERVER_STATUS_CHANGE_MARKERS[key])) {
            SERVERS_MANAGER.setServerStatus(serverName, PREDEFINED.SERVER_STATUSES[key]); // Cambia el estado del servidor
        }
    });
};

// Añade manejadores de eventos para la salida estándar y errores
export const addInstanceStdEventHandler = (serverName) => {
    serversInstances[serverName].stdout.on("data", (data) => {
        handleServerStd(serverName, data);
    });
    serversInstances[serverName].stderr.on("data", (data) => {
        handleServerStd(serverName, data);
    });
};

// Escribe en la entrada estándar del servidor
export const writeToStdin = (serverName, data) => {
    if (COMMONS.isObjectsValid(serversInstances[serverName])) {
        data = Buffer.from(data, "utf-8").toString(); // Convierte los datos a cadena
        writeServerLog(serverName, data + "\n"); // Escribe en el log
        serversInstances[serverName].stdin.write(data + "\n"); // Escribe en la entrada estándar
        return true;
    }
    return false;
};

// Mata un servidor y todos sus procesos hijos
export const killServer = (serverName) => {
    if (COMMONS.isObjectsValid(serversInstances[serverName], serversInstances[serverName].pid)) {
        treekill(serversInstances[serverName].pid, () => {}); // Mata el proceso
        return true;
    }
    return false;
};

// Obtiene el script de inicio de un servidor
export const getStartScript = (serverName) => {
    let startFileData, startFilePath;
    if (SERVERS_MANAGER.isServerExists(serverName)) {
        startFilePath = getStartFilePath(serverName); // Obtiene la ruta del archivo de inicio
        startFileData = fs.readFileSync(startFilePath); // Lee el archivo
        startFileData = startFileData.toString().split("\n");
        return startFileData[startFileData.length - 1]; // Devuelve la última línea
    }
    return false;
};

// Establece el script de inicio de un servidor
export const setStartScript = (serverName, data) => {
    let startFileData, startFilePath;
    if (SERVERS_MANAGER.isServerExists(serverName)) {
        startFilePath = getStartFilePath(serverName); // Obtiene la ruta del archivo de inicio
        startFileData = fs.readFileSync(startFilePath); // Lee el archivo
        startFileData = startFileData.toString().split("\n");
        startFileData[startFileData.length - 1] = data; // Actualiza la última línea
        fs.writeFileSync(startFilePath, startFileData.join("\n")); // Escribe el archivo
        return true;
    }
    return false;
};

// Obtiene la ruta del archivo de inicio de un servidor
export const getStartFilePath = (serverName) => {
    if (process.platform === "win32") {
        return "./servers/" + serverName + "/start.bat"; // Windows: archivo .bat
    } else if (process.platform === "linux" || process.platform === "android") {
        return "./servers/" + serverName + "/start.sh"; // Linux/Android: archivo .sh
    } else {
        return false; // Plataforma no soportada
    }
};

// Obtiene las propiedades de un servidor desde server.properties
export const getServerProperties = (serverName) => {
    let spFilePath = "./servers/" + serverName + "/server.properties"; // Ruta del archivo
    if (fs.existsSync(spFilePath)) {
        let spFileData = fs.readFileSync(spFilePath).toString(); // Lee el archivo
        let parsed = spParser.parse(spFileData); // Parsea el archivo
        if (parsed['generator-settings']) {
            parsed['generator-settings'] = JSON.stringify(parsed['generator-settings']); // Convierte a JSON si es necesario
        }
        return parsed;
    }
    return false;
};

// Guarda las propiedades de un servidor en server.properties
export const saveServerProperties = (serverName, data) => {
    let parsed = JSON.parse(data); // Parsea los datos
    console.log("data", data, serverName, parsed);

    let result = "";
    for (const [key, value] of Object.entries(parsed)) {
        // Convierte valores nulos a cadenas vacías
        const stringValue = value === null ? "" : value.toString();
        result += "\n" + key.toString() + "=" + stringValue; // Construye el archivo
    }

    FILE_MANAGER.writeFile(serverName, "/server.properties", result); // Escribe el archivo
    return true;
};

// Consulta el estado de un servidor
export const queryServer = (serverName, cb) => {
    let spData = getServerProperties(serverName); // Obtiene las propiedades del servidor
    if (COMMONS.isObjectsValid(spData['server-port']) && COMMONS.isObjectsValid(serversInstances[serverName])) {
        let chkPort = spData['server-port']; // Obtiene el puerto del servidor
        const chkOptions = { query: false };
        mcs.statusJava("127.0.0.1", chkPort, chkOptions) // Consulta el estado del servidor
            .then((result) => {
                cb(result); // Devuelve el resultado
            })
            .catch((error) => {
                console.error(error);
                cb(false); // Devuelve false en caso de error
            });
    } else {
        cb(false); // Devuelve false si no hay datos válidos
    }
};