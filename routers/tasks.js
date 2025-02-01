import * as COMMONS from "./../modules/commons.js";
import TASK_MANAGER from "./../modules/taskManager.js";
import express from "express";
const router = express.Router();
function initializeWebServer() {
// Endpoint GET and POST for getting tasks
router.get("/", function (req, res) {
    res.set("Content-Type", "application/json");
    res.send(TASK_MANAGER.tasks);
    TASK_MANAGER.removeCompletedTasks();
});

// Endpoint GET and POST for getting a task
router.get("/:id", function (req, res) {
    let q = req.params;
    if (COMMONS.isObjectsValid(q.id) && Object.keys(TASK_MANAGER.tasks).includes(q.id)) {
        res.set("Content-Type", "application/json");
        const taskobj = TASK_MANAGER.getTaskData(q.id);
        if (taskobj) {
        return  res.send(taskobj);
        }
    }
    res.sendStatus(400);
});
}
export { router, initializeWebServer };