import * as LOGGER from "./logger.js";
import * as PREDEFINED from "./predefined.js";
import * as COMMONS from "./commons.js";
import * as SECURITY from "./security.js";
import * as FILE_MANAGER from "./fileManager.js";
import * as MULTILANG from "./multiLanguage.js";
import fs from "fs";
import express from 'express';
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import colors from "colors";
import mime from "mime";
import path from 'path';

import { isInSubnet } from "is-in-subnet";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as permissionsMiddleware from "./permissionsMiddleware.js";
import * as coresRouter from "./../routers/cores.js";
import * as tasksRouter from "./../routers/tasks.js";
import * as fileManagerRouter from "./../routers/fileManager.js";
import * as serversRouter from "./../routers/servers.js";
import * as modsRouter from "./../routers/mods.js";
import * as pluginsRouter from "./../routers/plugins.js";
import * as javaRouter from "./../routers/java.js";
import * as authRouter from "./../routers/auth.js";
import * as accountsRouter from "./../routers/accounts.js";
import * as kubekRouter from "./../routers/kubek.js";
import * as updatesRouter from "./../routers/updates.js";
//t tasksRouter = require("./../routers/tasks.js");

let webServer = express();
globalThis.webPagesPermissions = {};
webServer.use(cookieParser());
webServer.use(express.json());
webServer.use(express.urlencoded({ extended: true }));
webServer.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
    })
);

// Получаем порт веб-сервера из конфига
let webPort = globalThis.mainConfig?.webserverPort;
export const logWebRequest = (req, res, username = null) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    ip = ip.replace("::ffff:", "").replace("::1", "127.0.0.1");
    let additionalInfo2 = "";
    if (username !== null) {
        additionalInfo2 = "[" + colors.cyan(username) + "]"
    }
    LOGGER.log("[" + colors.yellow(ip) + "]", additionalInfo2, colors.green(req.method) + " - " + req.originalUrl);
};

// Middleware для всех роутеров
export const authLoggingMiddleware = (req, res, next) => {
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    ip = ip.replace("::ffff:", "").replace("::1", "127.0.0.1");

    // Проверяем существование куков у пользователя на предмет логина
    let username = null;
    if (SECURITY.isUserHasCookies(req) && mainConfig.authorization === true) {
        username = req.cookies["kbk__login"];
    }

    // Показываем запрос в логах
    if (!COMMONS.testForRegexArray(req.path, PREDEFINED.NO_LOG_URLS)) {
        logWebRequest(req, res, username);
    }

    // Добавляем проверку на вхождение IP в range (при включенной функции)
    if (mainConfig.allowOnlyIPsList === true && !isInSubnet(ip, mainConfig.IPsAllowed)) {
        return; // При простом return на запрос не будет ответа, т.е. запрос просто зависнет
    }

    // Проверяем включена ли авторизация и есть ли у пользователя доступ к серверу
    if (mainConfig.authorization === true && !COMMONS.testForRegexArray(req.originalUrl, PREDEFINED.SKIP_AUTH_URLS)) {
        if (SECURITY.isUserHasCookies(req) && SECURITY.authenticateUser(req.cookies["kbk__login"], req.cookies["kbk__hash"])) {
            return next();
        } else {
            return res.redirect("/login.html");
        }
    } else {
        return next();
    }

    // Если ни один из этапов ранее не пропустил запрос дальше
    return res.sendStatus(403);
};

// Middleware для статических страниц
export const staticsMiddleware = (req, res, next) => {
    let filePath = path.join(__dirname, "./../web", req.path);
    let ext = path.extname(req.path).replace(".", "").toLowerCase();
    if (req.path === "/") {
        filePath = path.join(__dirname, "./../web", "/index.html");
        ext = "html";
    }
    if (PREDEFINED.ALLOWED_STATIC_EXTS.includes(ext) && FILE_MANAGER.verifyPathForTraversal(filePath) && fs.existsSync(filePath)) {
        // Если все проверки пройдены - детектим и отправляем content-type
        res.set(
            "content-type",
            mime.getType(filePath)
        );
        let fileData = fs.readFileSync(filePath);
        // Переводим файл, если нужно
        if (PREDEFINED.TRANSLATION_STATIC_EXTS.includes(ext)) {
            fileData = MULTILANG.translateText(currentLanguage, fileData);
        }
        // Возвращаем файл
        return res.send(fileData);
    }
    return next();
};

// Middleware для проверки на доступ к серверу (ставится ко всем роутерам!)
export const serversRouterMiddleware = (req, res, next) => {
    // Если авторизация отключена
    if (mainConfig.authorization === false) {
        return next();
    }

    let chkValue = false;
    if (COMMONS.isObjectsValid(req.params.server)) {
        chkValue = req.params.server;
    } else if (COMMONS.isObjectsValid(req.query.server)) {
        chkValue = req.query.server;
    }

    // Если проверка не требуется
    if (chkValue === false) {
        return next();
    }

    if (SECURITY.isUserHasCookies(req) && SECURITY.isUserHasServerAccess(req.cookies["kbk__login"], chkValue)) {
        return next();
    }
    return res.sendStatus(403);
}

// Функция для загрузки всех роутеров из списка в predefined
export const loadAllDefinedRouters = () => {
    permissionsMiddleware.initializeWebServer(webServer);
    coresRouter.initializeWebServer(webServer);
    tasksRouter.initializeWebServer(webServer);
    fileManagerRouter.initializeWebServer(webServer);
    serversRouter.initializeWebServer(webServer);
    modsRouter.initializeWebServer(webServer);
    pluginsRouter.initializeWebServer(webServer);
    javaRouter.initializeWebServer(webServer);
    authRouter.initializeWebServer(webServer);
    accountsRouter.initializeWebServer(webServer);
    kubekRouter.initializeWebServer(webServer);
    updatesRouter.initializeWebServer(webServer);
    webServer.use(authLoggingMiddleware);
    webServer.use(staticsMiddleware);

    webServer.use("/api/cores", coresRouter.router);


    webServer.use("/api/tasks", tasksRouter.router);

    webServer.use("/api/fileManager", fileManagerRouter.router);

    webServer.use("/api/servers", serversRouter.router);

    webServer.use("/api/mods", modsRouter.router);

    webServer.use("/api/plugins", pluginsRouter.router);

    webServer.use("/api/java", javaRouter.router);

    webServer.use("/api/auth", authRouter.router);

    webServer.use("/api/accounts", accountsRouter.router);

    webServer.use("/api/kubek", kubekRouter.router);

    webServer.use("/api/updates", updatesRouter.router);

    // Хэндлер для ошибки 404
    webServer.use((req, res) => {
        if (!res.headersSent) {
            let errFile = fs.readFileSync(path.join(__dirname, "./../web/404.html")).toString();
            return res.status(404).send(errFile);
        }
    });
};

// Запустить веб-сервер на выбранном порту
export const startWebServer = () => {
    webServer.listen(webPort, () => {
        LOGGER.log(MULTILANG.translateText(mainConfig.language, "{{console.webserverStarted}}", colors.cyan(webPort)));
    });
};

export { webServer };