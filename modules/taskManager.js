import { v4 as uuidv4 } from 'uuid';
import * as LOGGER from "./logger.js";
import * as MULTILANG from "./multiLanguage.js";
import colors from "colors";
import * as PREDEFINED from "./predefined.js"
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
        for (const [key, value] of Object.entries(this.tasks)) {
            if (typeof value.currentStep !== "undefined" || typeof value.status !== "undefined") {
                if (value.currentStep === PREDEFINED.SERVER_CREATION_STEPS.COMPLETED || value.status === PREDEFINED.SERVER_CREATION_STEPS.COMPLETED) {
                    this.tasks[key] = null;
                    delete this.tasks[key];
                }
            }
        }
        return true;
    }
}

export default new TaskManager();