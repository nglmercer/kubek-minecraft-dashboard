import fs from "fs";
import path from "path";
import colors from "colors";
import * as PREDEFINED from "./predefined.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJSON = require("./../package.json");

// Configuración de rutas
const LOGS_DIR = path.join(process.cwd(), "logs");

// Crear directorio de logs si no existe
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Formatear la hora actual
export const getTimeFormatted = () => {
    const dateTime = new Date();
    return `[${dateTime.getHours().toString().padStart(2, "0")}:${dateTime.getMinutes().toString().padStart(2, "0")}:${dateTime.getSeconds().toString().padStart(2, "0")}.${dateTime.getMilliseconds().toString().padStart(3, "0")}]`;
};

// Obtener el nombre del archivo de log
export const getLastLogFileName = () => {
    const dateTime = new Date();
    return `${dateTime.getDate().toString().padStart(2, "0")}-${(dateTime.getMonth() + 1).toString().padStart(2, "0")}-${dateTime.getFullYear()}.log`;
};

// Escribir una línea en el archivo de log
export const writeLineToLog = async (line) => {
    const fileName = getLastLogFileName();
    const filePath = path.join(LOGS_DIR, fileName);

    try {
        await fs.promises.appendFile(filePath, `${line}\n`);
    } catch (err) {
        console.error(colors.red(`Error writing to log file: ${err.message}`));
    }
};

// Función auxiliar para formatear y registrar mensajes
const logMessage = async (level, colorFn, ...text) => {
    const preparedText = `${getTimeFormatted()} ${level ? `[${level}] ` : ""}${text.join(" ")}`;
    console.log(colorFn ? colorFn(preparedText) : preparedText);
    await writeLineToLog(preparedText);
};

// Registrar mensajes de log
export const log = (...text) => logMessage("", null, ...text);

// Registrar mensajes de advertencia
export const warning = (...text) => logMessage("WARN", colors.yellow, ...text);

// Registrar mensajes de error
export const error = (...text) => logMessage("ERR", colors.red, ...text);

// Mostrar mensaje de bienvenida de Kubek
export const kubekWelcomeMessage = () => {
    console.log("");
    console.log(colors.cyan(PREDEFINED.KUBEK_LOGO_ASCII));
    console.log("");
    console.log(colors.inverse(`Kubek ${packageJSON.version}`));
    console.log(colors.inverse(packageJSON.repository.url.split("+")[1]));
    console.log("");
};