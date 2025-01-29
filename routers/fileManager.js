import * as COMMONS from "./../modules/commons.js";
import * as FILE_MANAGER from "./../modules/fileManager.js";
import * as WEBSERVER from "./../modules/webserver.js";
import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
function initializeWebServer() {
    
router.get("/get", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.query;
    if (COMMONS.isObjectsValid(q.server, q.path)) {
        res.set("Content-Type", "application/json");
        FILE_MANAGER.readFile(q.server, q.path, (rdResult) => {
            if (rdResult && rdResult !== false) {
                res.send({
                    fileData: rdResult.toString()
                });
                return;
            }
            FILE_MANAGER.scanDirectory(q.server, q.path, (dirRdResult) => {
                //console.log(q.server,q.path,dirRdResult)
                res.send(dirRdResult);
            });
        });
    } else {
        res.sendStatus(400);
    }
});

router.get("/chunkWrite/start", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.query;
    if (COMMONS.isObjectsValid(q.server, q.path)) {
        return res.send(FILE_MANAGER.startChunkyFileWrite(q.server, q.path));
    }
    res.sendStatus(400);
});

router.get("/chunkWrite/add", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.query;
    if (COMMONS.isObjectsValid(q.id, q.data)) {
        return res.send(FILE_MANAGER.addFileChunk(q.id, q.data));
    }
    res.sendStatus(400);
});

router.get("/chunkWrite/end", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.query;
    if (COMMONS.isObjectsValid(q.id)) {
        return res.send(FILE_MANAGER.endChunkyFileWrite(q.id));
    }
    res.sendStatus(400);
});

router.get("/delete", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.query;
    if (COMMONS.isObjectsValid(q.server, q.path)) {
        res.set("Content-Type", "application/json");
        let fileDeleteResult = FILE_MANAGER.deleteFile(q.server, q.path);
        let directoryDeleteResult = FILE_MANAGER.deleteEmptyDirectory(q.server, q.path);
        return res.send(fileDeleteResult || directoryDeleteResult);
    }
    res.sendStatus(400);
});

router.get("/rename", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.query;
    if (COMMONS.isObjectsValid(q.server, q.path, q.newName)) {
        res.set("Content-Type", "application/json");
        return res.send(FILE_MANAGER.renameFile(q.server, q.path, q.newName));
    }
    res.sendStatus(400);
});

router.get("/newDirectory", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.query;
    if (COMMONS.isObjectsValid(q.server, q.path, q.name)) {
        res.set("Content-Type", "application/json");
        return res.send(FILE_MANAGER.newDirectory(q.server, q.path, q.name));
    }
    res.sendStatus(400);
});

router.get("/download", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.query;

    if (COMMONS.isObjectsValid(q.server, q.path)) {
        let fPath = FILE_MANAGER.constructFilePath(q.server, q.path);
        if (fs.existsSync(fPath) && !fs.lstatSync(fPath).isDirectory()) {
            return res.download(path.resolve(fPath));
        }
    }
    res.sendStatus(400);
});

router.post("/upload", WEBSERVER.serversRouterMiddleware, function (req, res) {
    let q = req.query;
    if (COMMONS.isObjectsValid(q.server, q.path)) {
        let sourceFile;
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send("No files were uploaded.");
        }

        sourceFile = req.files["g-file-input"];

        COMMONS.moveUploadedFile(q.server, sourceFile, "/" + sourceFile.name, (result) => {
            if (result === true) {
                return res.send(true);
            }
            console.log(result);
            res.sendStatus(400);
        })
    } else {
        return res.sendStatus(400);
    }
});

}

export { router, initializeWebServer };