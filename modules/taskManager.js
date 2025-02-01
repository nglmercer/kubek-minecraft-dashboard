import { v4 as uuidv4 } from 'uuid';
import LOGGER from './logger.js';
import * as MULTILANG from "./multiLanguage.js";
import colors from "colors";
import PREDEFINED from "./predefined.js"
class TaskManager {
    constructor() {
        this.tasks = {};
    }

    getNewTaskID() {
        return uuidv4();
    }

    addNewTask(data) {
        const newTaskID = this.getNewTaskID();
        this.tasks[newTaskID] = {
            ...data,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        LOGGER.log(MULTILANG.translateText(
            mainConfig.language, 
            "{{console.taskAdded}}", 
            colors.cyan(newTaskID), 
            colors.cyan(data.type)
        ));
        return newTaskID;
    }

    removeTask(taskID) {
        if (this.tasks[taskID]) {
            delete this.tasks[taskID];
            LOGGER.log(MULTILANG.translateText(
                mainConfig.language, 
                "{{console.taskRemoved}}", 
                colors.cyan(taskID)
            ));
            return true;
        }
        return false;
    }

    setTaskData(taskID, data) {
        if (typeof this.tasks[taskID] !== 'undefined') {
            this.tasks[taskID] = data;
            return true;
        }
        return false;
    }
    updateTask(taskID, data) {
        if (typeof this.tasks[taskID] !== 'undefined') {
            this.tasks[taskID] = {
                ...this.tasks[taskID],
                ...data
            };
            return true;
        }
        return false;
    }
    getTaskData(taskID) {
        if (typeof this.tasks[taskID] !== 'undefined') {
            return this.tasks[taskID];
        }
        return false;
    }
    isTaskExists(taskID) {
        return typeof this.tasks[taskID] !== 'undefined';
    }
    removeCompletedTasks() {
        const now = Date.now();
        for (const [taskID, task] of Object.entries(this.tasks)) {
            if (task.status === PREDEFINED.TASK_STATUS.COMPLETED && 
                now - task.updatedAt > 5000) { // 5 segundos después de completar
                delete this.tasks[taskID];
            }
        }
        return true;
    }
}

export default new TaskManager();