const JAVA_MANAGER = require("./../modules/javaManager");
const STATS_COLLECTOR = require("./../modules/statsCollection");
const DOWNLOADS_MANAGER = require("./../modules/downloadsManager");

const express = require("express");
const router = express.Router();

// Endpoint списка установленных версий Java
router.get("/", function (req, res) {
    res.send(STATS_COLLECTOR.getAllJavaInstalled());
});

// Endpoint списка установленных версий Java в Kubek
router.get("/kubek", function (req, res) {
    res.send(JAVA_MANAGER.getLocalJavaVersions());
});

// Endpoint списка доступных для скачивания версий Java
router.get("/online", function (req, res) {
    JAVA_MANAGER.getDownloadableJavaVersions((result) => {
        res.send(result);
    });
});

// Endpoint для получения общего списка Java
router.get("/all", (req, res) => {
    let result = {
        installed: STATS_COLLECTOR.getAllJavaInstalled(),
        kubek: JAVA_MANAGER.getLocalJavaVersions(),
        online: []
    }

    JAVA_MANAGER.getDownloadableJavaVersions((online) => {
        online.forEach((onlItem) => {
            if(!result.kubek.includes(onlItem)){
                result.online.push(onlItem);
            }
        });
        res.send(result);
    });
});

router.get("/download/:version", async function (req, res) {
    let q = req.params;
    let localJavaVersions = JAVA_MANAGER.getLocalJavaVersions();

    if (!localJavaVersions.includes(q.version)) {
        let javaInfo = JAVA_MANAGER.getJavaInfoByVersion(q.version);

        try {
            await DOWNLOADS_MANAGER.addDownloadTask(javaInfo.url, javaInfo.downloadPath, (result) => {
                if (result === true) {
                    DOWNLOADS_MANAGER.unpackArchive(javaInfo.downloadPath, javaInfo.unpackPath, () => {
                        res.send(true); // Send response after unpacking
                    }, true);
                } else {
                    res.status(500).send("Download failed"); // Handle download failure
                }
            });
        } catch (error) {
            console.error("Download error:", error);
            res.status(500).send("Download failed due to an error");
        }
    } else {
        res.sendStatus(400); // Version already exists
    }
});

module.exports.router = router;