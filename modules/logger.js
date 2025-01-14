import fs from "fs";
import colors from "colors";
import * as PREDEFINED from "./predefined.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const packageJSON = require("./../package.json");

export const getTimeFormatted = () => {
    let dateTime = new Date();
    return (
        "[" +
        dateTime.getHours().toString().padStart(2, "0") +
        ":" +
        dateTime.getMinutes().toString().padStart(2, "0") +
        ":" +
        dateTime.getSeconds().toString().padStart(2, "0") +
        "." +
        dateTime.getMilliseconds().toString().padStart(2, "0") +
        "]"
    );
};

// Получить имя файла для лога
export const getLastLogFileName = () => {
    let dateTime = new Date();
    return dateTime.getDate().toString().padStart(2, "0") +
        "-" +
        (dateTime.getMonth() + 1).toString().padStart(2, "0") +
        "-" +
        dateTime.getFullYear().toString().padStart(2, "0") +
        ".log";
};

// Записать строку в лог
export const writeLineToLog = (line) => {
    let fileName = this.getLastLogFileName();
    let readLog = "";
    if (fs.existsSync("./logs/" + fileName)) {
        readLog = fs.readFileSync("./logs/" + fileName);
    }
    readLog = readLog + "\n" + line;
    fs.writeFileSync("./logs/" + fileName, readLog);
};

// Вывести текст в консоль и записать в файл
export const log = (...text) => {
    let preparedText = this.getTimeFormatted() + " " + text.join(" ");
    console.log(preparedText);
    this.writeLineToLog(preparedText);
};

// Вывести текст типа WARNING в консоль и записать в файл
export const warning = (...text) => {
    let preparedText = this.getTimeFormatted() + " " + text.join(" ");
    console.log(colors.yellow(preparedText));
    this.writeLineToLog("[WARN] " + preparedText);
};

// Вывести текст типа ERROR в консоль и записать в файл
export const error = (...text) => {
    let preparedText = this.getTimeFormatted() + " " + text.join(" ");
    console.log(colors.red(preparedText));
    this.writeLineToLog("[ERR] " + preparedText);
};

// Вывести приветственное сообщение Kubek
export const kubekWelcomeMessage = () => {
    console.log("");
    console.log(colors.cyan(PREDEFINED.KUBEK_LOGO_ASCII));
    console.log("");
    console.log(colors.inverse("Kubek " + packageJSON.version));
    console.log(colors.inverse(packageJSON.repository.url.split("+")[1]));
    console.log("");
}