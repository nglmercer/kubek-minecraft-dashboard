import * as FILE_MANAGER from "./../modules/fileManager.js";
import * as SERVERS_MANAGER from "./../modules/serversManager.js";
import * as COMMONS from "./../modules/commons.js";
import * as WEBSERVER from "./../modules/webserver.js";
import express from "express";
const router = express.Router();
function initializeWebServer() {
// Endpoint списка плагинов
router.get("/:server", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.params;
    if (COMMONS.isObjectsValid(q.server) && SERVERS_MANAGER.isServerExists(q.server)) {
        FILE_MANAGER.scanDirectory(q.server, "/plugins", (result) => {
            if (result === false) {
                return res.send([]);
            }
            let resultArray = [];
            if (result && result.length >= 1){
                result.forEach((item) => {
                    if (item.type === "file") {
                        resultArray.push(item.name);
                    }
                });
            }
            res.send(resultArray);
        });
    } else {
        res.sendStatus(400);
    }
});

// Endpoint для загрузки плагина
router.post("/:server", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let sourceFile;
    // Проверяем присутствие файлов в запросе
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
    }

    sourceFile = req.files["server-plugin-input"];
    // DEVELOPED by seeeroy

    COMMONS.moveUploadedFile(q.server, sourceFile, "/plugins/" + sourceFile.name, (result) => {
        if (result === true) {
            return res.send(true);
        }
        console.log(result);
        res.sendStatus(400);
    })
});

// Endpoint удаления плагина
router.delete("/:server", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.params;
    let q2 = req.query;
    if (COMMONS.isObjectsValid(q.server, q2.plugin) && SERVERS_MANAGER.isServerExists(q.server)) {
        let delResult = FILE_MANAGER.deleteFile(q.server, "/plugins/" + q2.plugin);
        return res.send(delResult);
    }
    res.sendStatus(400);
});
router.post("/:server/from-url", WEBSERVER.serversRouterMiddleware, (req, res) => {
    const { server } = req.params;
    const { url } = req.body;
    console.log("url plugin", url);
    COMMONS.downloadFileFromUrl(
        server,
        url,
        "/plugins/" + COMMONS.getSafeFilename(url),
        (result, error) => {
            if (result === true) return res.send(true);
            console.error(error);
            res.status(500).send(error || "Error al descargar el plugin");
        }
    );
});
}
export { router, initializeWebServer };