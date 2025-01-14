const TASK_MANAGER = require("./taskManager");
const PREDEFINED = require("./predefined");
const LOGGER = require("./logger");
const MULTILANG = require("./multiLanguage");

const path = require("path");
const axios = require("axios");
const fs = require("fs");
const decompress = require("decompress");
const colors = require("colors");

// Создать задачу на скачивание
async function addDownloadTask(downloadURL, filePath, cb = () => {}) {
    try {
        const response = await axios({
            url: downloadURL,
            method: "GET",
            responseType: "stream",
            timeout: 10000, // Set a timeout (e.g., 10 seconds)
        });
        
        const { data, headers } = response;

        // Crear nueva tarea
        let dlTaskID = TASK_MANAGER.addNewTask({
            type: PREDEFINED.TASKS_TYPES.DOWNLOADING,
            progress: 0,
            size: {
                total: parseInt(headers['content-length']),
                current: 0
            },
            url: downloadURL,
            path: filePath,
            filename: path.basename(filePath)
        });

        LOGGER.log(MULTILANG.translateText(mainConfig.language, "{{console.downloadTaskCreated}}", colors.cyan(dlTaskID), colors.cyan(path.basename(filePath))));

        return new Promise((resolve, reject) => {
            // Manejar errores en el stream
            data.on('error', (error) => {
                TASK_MANAGER.removeTask(dlTaskID);
                cb(error);
                reject(error);
            });

            // Manejar los chunks de datos
            data.on('data', (chunk) => {
                tasks[dlTaskID].size.current = tasks[dlTaskID].size.current + chunk.length;
                tasks[dlTaskID].progress = Math.round((tasks[dlTaskID].size.current / tasks[dlTaskID].size.total) * 100);
                if (tasks[dlTaskID].size.current === tasks[dlTaskID].size.total) {
                    TASK_MANAGER.removeTask(dlTaskID);
                    cb(true);
                    resolve(true);
                }
            });

            // Crear el writeStream y manejar sus errores
            const writeStream = fs.createWriteStream(filePath);
            writeStream.on('error', (error) => {
                TASK_MANAGER.removeTask(dlTaskID);
                cb(error);
                reject(error);
            });

            data.pipe(writeStream);
        });

    } catch (error) {
        if (error.response && error.response.status === 522) {
            console.error("Connection timed out (522):", error.message);
            cb(new Error("Connection timed out"));
        } else {
            cb(error);
        }
        throw error;
    }
}

// Распаковать архив по нужному пути
exports.unpackArchive = (archivePath, unpackPath, cb, deleteAfterUnpack = false) => {
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

module.exports.addDownloadTask = addDownloadTask;