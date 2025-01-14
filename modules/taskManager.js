// Переменная для сохранения всех задач
globalThis.tasks = {};
import * as LOGGER from "./logger.js";
import * as MULTILANG from "./multiLanguage.js";
import * as PREDEFINED from "./predefined.js";
import colors from "colors";
import crypto from "crypto";

// Получить ID для новой задачи
export const getNewTaskID = () => {
    return crypto.randomUUID().toString();
};

// Добавить новую задачу
export const addNewTask = (data) => {
    let newTaskID = getNewTaskID();
    tasks[newTaskID] = data;
    LOGGER.log(MULTILANG.translateText(mainConfig.language, "{{console.taskAdded}}", colors.cyan(newTaskID), colors.cyan(data.type)));
    return newTaskID;
};

// Удалить задачу по ID
export const removeTask = (taskID) => {
    if (typeof tasks[taskID] !== 'undefined') {
        tasks[taskID] = null;
        delete tasks[taskID];
        LOGGER.log(MULTILANG.translateText(mainConfig.language, "{{console.taskRemoved}}", colors.cyan(taskID)));
        return true;
    }
    return false;
};

// Установить данные для задачи по ID
export const setTaskData = (taskID, data) => {
    if (typeof tasks[taskID] !== 'undefined') {
        tasks[taskID] = data;
        return true;
    }
    return false;
}

// Проверить задачу на существование
export const isTaskExists = (taskID) => {
    return typeof tasks[taskID] !== 'undefined';
};

// Получить данные задачи по ID
export const getTaskData = (taskID) => {
    if (typeof tasks[taskID] !== 'undefined') {
        return tasks[taskID];
    }
    return false;
};
export const removeCompletedTasks = () => {
    for (const [key, value] of Object.entries(tasks)) {
        if (typeof value.currentStep !== "undefined" || typeof value.status !== "undefined") {
            if (value.currentStep === PREDEFINED.SERVER_CREATION_STEPS.COMPLETED || value.status === PREDEFINED.SERVER_CREATION_STEPS.COMPLETED) {
                tasks[key] = null;
                delete tasks[key];
            }
        }
    }
    return true;
};