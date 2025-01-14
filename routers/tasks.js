import * as COMMONS from "./../modules/commons.js";
import * as TASK_MANAGER from "./../modules/taskManager.js";
import express from "express";
const router = express.Router();
function initializeWebServer() {
// Endpoint списка задач
router.get("/", function (req, res) {
    res.set("Content-Type", "application/json");
    res.send(tasks);
    TASK_MANAGER.removeCompletedTasks();
});

// Endpoint задачи по её ID
router.get("/:id", function (req, res) {
    let q = req.params;
    if (COMMONS.isObjectsValid(q.id) && Object.keys(tasks).includes(q.id)) {
        res.set("Content-Type", "application/json");
        return res.send(tasks[q.id]);
    }
    res.sendStatus(400);
});
}
export { router, initializeWebServer };