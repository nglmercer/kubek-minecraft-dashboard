import * as PREDEFINED from "./predefined.js";

import TASK_MANAGER from "./taskManager.js";
import * as LOGGER from "./logger.js";
import * as MULTILANG from "./multiLanguage.js";
import path from "path";
import axios from "axios";
import fs from "fs";
import decompress from "decompress";    
import colors from "colors";

export async function addDownloadTask(downloadURL, filePath, cb = () => {}) {
    try {
        const response = await axios({
            url: downloadURL,
            method: "GET",
            responseType: "stream",
            timeout: 10000,
        });
        
        const { data, headers } = response;

        // Validar Content-Length
        const contentLength = parseInt(headers['content-length'], 10);
        if (isNaN(contentLength)) {
            const error = new Error("Content-Length header missing or invalid");
            cb(error);
            throw error;
        }

        // Crear nueva tarea
        let dlTaskID = TASK_MANAGER.addNewTask({
            type: PREDEFINED.TASKS_TYPES.DOWNLOADING,
            progress: 0,
            size: {
                total: contentLength,
                current: 0
            },
            url: downloadURL,
            path: filePath,
            filename: path.basename(filePath)
        });

        LOGGER.log(MULTILANG.translateText(mainConfig.language, "{{console.downloadTaskCreated}}", colors.cyan(dlTaskID), colors.cyan(path.basename(filePath))));

        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filePath);

            // Manejar errores en el stream de datos
            data.on('error', (error) => {
                TASK_MANAGER.removeTask(dlTaskID);
                writeStream.destroy(error);
                cb(error);
                reject(error);
            });

            // Manejar errores en el stream de escritura
            writeStream.on('error', (error) => {
                TASK_MANAGER.removeTask(dlTaskID);
                data.destroy();
                cb(error);
                reject(error);
            });

            // Actualizar progreso durante la descarga
            data.on('data', (chunk) => {
                const task = TASK_MANAGER.getTaskData(dlTaskID);
                if (!task) return;

                const newCurrent = task.size.current + chunk.length;
                const newProgress = Math.round((newCurrent / task.size.total) * 100);

                TASK_MANAGER.updateTask(dlTaskID, {
                    size: { current: newCurrent },
                    progress: newProgress
                });
            });

            // Finalización exitosa de la escritura
            writeStream.on('finish', () => {
                TASK_MANAGER.removeTask(dlTaskID);
                cb(true);
                resolve(true);
            });

            data.pipe(writeStream);
        }).catch(error => {
            console.error("Error en la descarga:", error.message);
            cb(error);
        });

    } catch (error) {
        if (error.response && error.response.status === 522) {
            console.error("Connection timed out (522):", error.message);
            cb(new Error("Connection timed out"));
        } else {
            cb(error);
        }
        console.error("Error en la descarga:", error.message);
    }
}

export const unpackArchive = (archivePath, unpackPath, cb, deleteAfterUnpack = false) => {
    fs.mkdirSync(unpackPath, {recursive: true});
    decompress(archivePath, unpackPath)
        .then(function () {
            if (deleteAfterUnpack) {
                fs.unlinkSync(archivePath);
            }
            cb(true);
        })
        .catch(function (error) {
            console.error(error);
            cb(false);
        });
}
export default addDownloadTask;
