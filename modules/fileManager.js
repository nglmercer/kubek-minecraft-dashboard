import fs from "fs";
import { Base64 } from "js-base64";
import * as SECURITY from './security.js';
/**
 * @namespace FileOperations
 * @description Provides secure file system operations for server management with path validation and chunked file writing capabilities.
 * Includes protection against directory traversal attacks.
 */

let fileWrites = {}; // Stores ongoing chunked write operations
// modules/fileManager.js
export const scanDirectory = (server, path, callback) => {
    try {
        const fullPath = constructFilePath(server, path);
        const files = fs.readdirSync(fullPath, { withFileTypes: true });
        const result = files.map(dirent => {
            const filePath = `${fullPath}/${dirent.name}`;
            const stats = fs.statSync(filePath);
            return {
                name: dirent.name,
                type: dirent.isDirectory() ? "directory" : "file",
                size: stats.size, // Size in bytes
                lastModified: stats.mtime, // Last modified timestamp
                stats: stats // Full stats object
            };
        });
        
        if (callback) callback(result);
        return result;
    } catch (error) {
        console.error('Error scanning directory:', error);
        if (callback) callback(false);
        return false;
    }
};

// Helper functions remain the same
export const constructFilePath = (server, path) => {
    return "./servers/" + server + path;
}

export const verifyPathForTraversal = (path) => {
    return path.match(/\%2e\./gim) == null &&
        path.match(/\%2e\%2e/gim) == null &&
        path.match(/\.\%2e/gim) == null &&
        path.match(/\.\./gim) == null;
};
  
  export const newReadFile = (server, path) => {
    let filePath = constructFilePath(server, path);
    if (!verifyPathForTraversal(filePath)) return false;
    
    if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
        try {
            return fs.readFileSync(filePath);
        } catch (err) {
            console.error(err);
            return false;
        }
    }
    return false;
}
export const readFile = (server, path, cb) => {
    let result = newReadFile(server,path)
    console.log(result)
    if (cb){
        cb(result)
    }else{
        return result
    }
};

export const writeFile = (server, path, data) => {
    let filePath = constructFilePath(server, path);

    if (!verifyPathForTraversal(filePath)) {
        return false;
    }

    fs.writeFileSync(filePath, data);
    return true;
};

export const deleteFile = (server, path) => {
    let filePath = constructFilePath(server, path);

    if (!verifyPathForTraversal(filePath)) {
        return false;
    }

    if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
};

export const deleteEmptyDirectory = (server, path) => {
    let filePath = constructFilePath(server, path);

    if (!verifyPathForTraversal(filePath)) {
        return false;
    }

    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory() && fs.readdirSync(filePath).length === 0) {
        fs.rmdirSync(filePath);
        return true;
    }
    return false;
};

export const renameFile = (server, path, newName) => {
    let filePath = constructFilePath(server, path);
    let newPath = filePath.split("/").slice(0, -1).join("/") + "/";

    if (!verifyPathForTraversal(filePath) || !verifyPathForTraversal(newPath)) {
        return false;
    }

    if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, newPath + newName);
        return true;
    }
    return false;
};

export const newDirectory = (server, path, name) => {
    let filePath = constructFilePath(server, path);

    if (!verifyPathForTraversal(filePath)) {
        return false;
    }

    fs.mkdirSync(filePath + "/" + name, {
        recursive: true
    })
};



export const startChunkyFileWrite = (server, path) => {
    let filePath = constructFilePath(server, path);

    if (!verifyPathForTraversal(filePath)) {
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