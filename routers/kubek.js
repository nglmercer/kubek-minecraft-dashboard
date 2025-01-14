import * as HARDWARE_MANAGER from "./../modules/hardwareManager.js";
import * as CONFIGURATION from "./../modules/configuration.js";
import * as COMMONS from "./../modules/commons.js";
import * as FTP_DAEMON from "./../modules/ftpDaemon.js";
import * as MULTILANG from "./../modules/multiLanguage.js";
import express from "express";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const router = express.Router();
import { Base64 } from "js-base64";
const packageJSON = require("../package.json");
function initializeWebServer(){

// Endpoint для получения использования ресурсов
router.get("/hardware/usage", function (req, res) {
    HARDWARE_MANAGER.getResourcesUsage((result) => {
        res.send(result);
    })
});

// Endpoint для получения всей информации о hardware
router.get("/hardware/summary", function (req, res) {
    HARDWARE_MANAGER.getHardwareInfo((result) => {
        res.send(result);
    })
});

// Endpoint для получения версии Kubek
router.get("/version", function (req, res) {
    res.send(packageJSON.version);
});

// Endpoint для получения настроек Kubek
router.get("/settings", function (req, res) {
    res.send(mainConfig);
});

// Endpoint для сохранения настроек Kubek
router.put("/settings", function (req, res) {
    let q = req.query;
    if (COMMONS.isObjectsValid(q.config)) {
        if(FTP_DAEMON.isFTPStarted()){
            FTP_DAEMON.stopFTP();
        }
        let writeResult = CONFIGURATION.writeMainConfig(Base64.decode(q.config));
        CONFIGURATION.reloadAllConfigurations();
        globalThis.currentLanguage = mainConfig.language;
        FTP_DAEMON.startFTP();
        return res.send(writeResult);
    }
    res.sendStatus(400);
});

// Endpoint для соглашения с EULA
router.get("/eula/accept", function (req, res) {
    mainConfig.eulaAccepted = true;
    CONFIGURATION.writeMainConfig(mainConfig);
    CONFIGURATION.reloadAllConfigurations();
    res.send(true);
});

// Endpoint для получения списка языков
router.get("/languages", function (req, res) {
    res.send(avaliableLanguages);
});
}
export { router, initializeWebServer };