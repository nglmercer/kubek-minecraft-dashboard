import * as HARDWARE_MANAGER from "./../modules/hardwareManager.js"; // Módulo para gestionar hardware
import { configManager, mainConfig } from "./../modules/configuration.js";     // Módulo para gestionar configuraciones
import * as COMMONS from "./../modules/commons.js";                 // Funciones comunes
import * as FTP_DAEMON from "./../modules/ftpDaemon.js";            // Módulo para gestionar el servidor FTP
import * as MULTILANG from "./../modules/multiLanguage.js";         // Módulo para gestión de idiomas
import express from "express";                                      // Framework para crear el servidor web
import { createRequire } from 'module';                             // Para usar require en ES modules
const require = createRequire(import.meta.url);
const router = express.Router();                                    // Router de Express para definir endpoints
import { Base64 } from "js-base64";                                 // Librería para codificación Base64
const packageJSON = require("../package.json");                     // Carga el archivo package.json

// Función para inicializar el servidor web
function initializeWebServer() {

    // Endpoint para obtener el uso de recursos del sistema
    router.get("/hardware/usage", function (req, res) {
        HARDWARE_MANAGER.getResourcesUsage((result) => {
            res.send(result); // Envía el resultado al cliente
        });
    });

    // Endpoint para obtener un resumen de la información del hardware
    router.get("/hardware/summary", function (req, res) {
        HARDWARE_MANAGER.getHardwareInfo((result) => {
            res.send(result); // Envía el resultado al cliente
        });
    });

    // Endpoint para obtener la versión actual del proyecto
    router.get("/version", function (req, res) {
        // Verifica si la versión está disponible en packageJSON
        if (!packageJSON.version) {
            res.status(500).json({
                error: 'Versión no disponible',
                packageJSON: packageJSON
            });
            return;
        }
        // Envía la versión actual
        res.json({ version: packageJSON.version });
    });

    router.get("/settings", function (req, res) {
        res.send(mainConfig); // Envía la configuración principal
    });

    router.put("/settings", function (req, res) {
        let q = req.query;
        if (COMMONS.isObjectsValid(q.config)) {
            // Detiene el servidor FTP si está en ejecución
            if (FTP_DAEMON.isFTPStarted()) {
                FTP_DAEMON.stopFTP();
            }
            let writeResult = configManager.writeMainConfig(Base64.decode(q.config));
            configManager.reloadAllConfigurations();
            globalThis.currentLanguage = mainConfig.language;
            // Reinicia el servidor FTP
            FTP_DAEMON.startFTP();
            // Envía el resultado de la operación
            return res.send(writeResult);
        }
        // Si la configuración no es válida, devuelve un error 400
        res.sendStatus(400);
    });

    // Endpoint para aceptar el acuerdo EULA
    router.get("/eula/accept", function (req, res) {
        mainConfig.eulaAccepted = true; // Marca el EULA como aceptado
        configManager.writeMainConfig(mainConfig); // Guarda la configuración actualizada
        configManager.reloadAllConfigurations();   // Recarga las configuraciones
        res.send(true); // Confirma que el EULA fue aceptado
    });

    // Endpoint para obtener la lista de idiomas disponibles
    router.get("/languages", function (req, res) {
        res.send(avaliableLanguages); // Envía la lista de idiomas
    });

    // Endpoint para obtener los datos brutos de los idiomas
    router.get("/rawlanguages", function (req, res) {
        res.send(rawdatalanguages); // Envía los datos brutos de los idiomas
    });
}

// Exporta el router y la función de inicialización del servidor web
export { router, initializeWebServer };