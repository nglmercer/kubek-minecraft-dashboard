import * as UPDATER from "./../modules/updater.js";
import express from "express";
const router = express.Router();
function initializeWebServer() {
// Endpoint для проверки обновлений
router.get("/", function (req, res) {
    let updInfo = UPDATER.getCachedUpdate();
    if (updInfo === false) {
        UPDATER.checkForUpdates(() => {
            updInfo = UPDATER.getCachedUpdate();
            res.send(updInfo);
        });
    } else {
        res.send(updInfo);
    }
});
}
export { router, initializeWebServer };