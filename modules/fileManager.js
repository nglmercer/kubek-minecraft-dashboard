import fs from "fs";
let fileWrites = {};
import { Base64 } from "js-base64";
import * as SECURITY from './security.js';

export const scanDirectory = (server, directory, cb) => {
    let relDirectoryPath = "./servers/" + server + directory;

    if (!this.verifyPathForTraversal(relDirectoryPath)) {
        // Если найден path traversal, то ничего не делаем
        cb(false);
        return;
    }

    if (
        fs.existsSync(relDirectoryPath) &&
        fs.lstatSync(relDirectoryPath).isDirectory()
    ) {
        fs.readdir(relDirectoryPath, function (err, readResult) {
            if (err) throw err;
            if (typeof readResult !== "undefined") {
                let filesResult = [];
                readResult.forEach((element) => {
                    let filePath = relDirectoryPath + "/" + element;
                    let fileStats = fs.lstatSync(filePath);
                    let fileItem = {
                        name: element,
                        path: filePath,
                        type: fileStats.isDirectory() ? "directory" : "file",
                        size: fileStats.size,
                        modify: fileStats.mtime,
                    };
                    filesResult.push(fileItem);
                });
                cb(filesResult);
                return;
            }
            cb(false);
        });
    } else {
        cb(false);
    }
};

export const readFile = (server, path, cb) => {
    let filePath = this.constructFilePath(server, path);

    if (!this.verifyPathForTraversal(filePath)) {
        // Если найден path traversal, то ничего не делаем
        cb(false);
        return;
    }

    if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
        fs.readFile(filePath, (err, data) => {
            if (err) throw err;
            cb(data);
        });
    } else {
        cb(false);
    }
};

export const writeFile = (server, path, data) => {
    let filePath = this.constructFilePath(server, path);

    if (!this.verifyPathForTraversal(filePath)) {
        // Если найден path traversal, то ничего не делаем
        return false;
    }

    fs.writeFileSync(filePath, data);
    return true;
};

export const deleteFile = (server, path) => {
    let filePath = this.constructFilePath(server, path);

    if (!this.verifyPathForTraversal(filePath)) {
        // Если найден path traversal, то ничего не делаем
        return false;
    }

    if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
};

export const deleteEmptyDirectory = (server, path) => {
    let filePath = this.constructFilePath(server, path);

    if (!this.verifyPathForTraversal(filePath)) {
        // Если найден path traversal, то ничего не делаем
        return false;
    }

    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory() && fs.readdirSync(filePath).length === 0) {
        fs.rmdirSync(filePath);
        return true;
    }
    return false;
};

export const renameFile = (server, path, newName) => {
    let filePath = this.constructFilePath(server, path);
    let newPath = filePath.split("/").slice(0, -1).join("/") + "/";

    if (!this.verifyPathForTraversal(filePath) || !this.verifyPathForTraversal(newPath)) {
        // Если найден path traversal, то ничего не делаем
        return false;
    }

    if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, newPath + newName);
        return true;
    }
    return false;
};

export const newDirectory = (server, path, name) => {
    let filePath = this.constructFilePath(server, path);

    if (!this.verifyPathForTraversal(filePath)) {
        // Если найден path traversal, то ничего не делаем
        return false;
    }

    fs.mkdirSync(filePath + "/" + name, {
        recursive: true
    })
};

export const constructFilePath = (server, path) => {
    return "./servers/" + server + path;
}

export const verifyPathForTraversal = (path) => {
    return path.match(/\%2e\./gim) == null &&
        path.match(/\%2e\%2e/gim) == null &&
        path.match(/\.\%2e/gim) == null &&
        path.match(/\.\./gim) == null;
};

/* ЗАПИСЬ ФАЙЛОВ ПО ЧАНКАМ */
// Начать запись
export const startChunkyFileWrite = (server, path) => {
    let filePath = this.constructFilePath(server, path);

    if (!this.verifyPathForTraversal(filePath)) {
        // Если найден path traversal, то ничего не делаем
        return false;
    }

    let randomUUID = SECURITY.generateSecureID(8);
    fileWrites[randomUUID] = {
        id: randomUUID,
        path: filePath,
        text: ""
    }
    return randomUUID;
};

export const addFileChunk = (id, chunk) => {
    if (typeof fileWrites[id] !== "undefined") {
        fileWrites[id].text === "" ? fileWrites[id].text = Base64.decode(chunk) : fileWrites[id].text += "\n" + Base64.decode(chunk);
        return true;
    } else {
        return false;
    }
};

export const endChunkyFileWrite = (id) => {
    if (typeof fileWrites[id] !== "undefined") {
        fs.writeFileSync(fileWrites[id].path, fileWrites[id].text);
        fileWrites[id] = null;
        delete fileWrites[id];
        return true;
    } else {
        return false;
    }
};