import * as JAVA_MANAGER from "./../modules/javaManager.js";
import * as STATS_COLLECTOR from "./../modules/statsCollection.js";
import * as DOWNLOADS_MANAGER from "./../modules/downloadsManager.js";
import express from "express";

const router = express.Router();
function initializeWebServer() {
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
    const result = JAVA_MANAGER.getDownloadableJavaVersions();
    res.send(result);
});

// Endpoint для получения общего списка Java
router.get("/all", async (req, res) => {
    let result = {
        installed: STATS_COLLECTOR.getAllJavaInstalled(),
        kubek: JAVA_MANAGER.getLocalJavaVersions(),
        online: []
    };

    try {
        const onlineresult = await JAVA_MANAGER.getDownloadableJavaVersions();
        console.log("onlineresult", onlineresult);

        if (onlineresult) {
            // Usar un Set para evitar duplicados
            const uniqueOnline = new Set(result.online); 
            
            onlineresult.forEach((onItem) => {
                uniqueOnline.add(onItem);
            });

            // Convertir el Set de vuelta a un array
            result.online = Array.from(uniqueOnline);
        }

        console.log("alljava", result);
        res.send(result);
    } catch (error) {
        console.error("Error fetching Java versions:", error);
        res.status(500).send({ error: "Error fetching Java versions" });
    }
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
}
export { router, initializeWebServer };