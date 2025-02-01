import UserAuth from "./../modules/security.js";         // Módulo para gestionar la seguridad
import * as SERVERS_MANAGER from "./../modules/serversManager.js"; // Módulo para gestionar servidores
import * as MULTI_LANGUAGE from "./../modules/multiLanguage.js";   // Módulo para gestión de idiomas
import * as COMMONS from "./../modules/commons.js";                // Funciones comunes
import express from "express";                                     // Framework para crear el servidor web
import { configManager, mainConfig } from "./../modules/configuration.js";
const SECURITY = new UserAuth(mainConfig, usersConfig);
const router = express.Router(); // Router de Express para definir endpoints

// Función para inicializar el servidor web
function initializeWebServer() {

    // Endpoint para iniciar sesión
    router.get("/login/:login/:password", function (req, res) {
        let q = req.params;
        // Si la autorización está desactivada en la configuración
        if (mainConfig.authorization === false) {
            return res.send({
                success: false,
                error: MULTI_LANGUAGE.translateText(currentLanguage, "{{security.authDisabled}}")
            });
        }
        // Verifica si los parámetros de inicio de sesión son válidos
        if (COMMONS.isObjectsValid(q.login, q.password)) {
            let authUser = SECURITY.authorizeUser(q.login, q.password); // Intenta autorizar al usuario
            if (authUser) {
                // Configura las opciones de las cookies
                let options = {
                    maxAge: 120 * 24 * 60 * 60 * 1000, // Duración de la cookie (120 días)
                    httpOnly: true,                    // La cookie solo es accesible desde el servidor
                };
                // Establece las cookies de sesión
                res.cookie("kbk__hash", usersConfig[q.login].secret, options);
                res.cookie("kbk__login", usersConfig[q.login].username, options);
                return res.send({
                    success: true // Indica que el inicio de sesión fue exitoso
                });
            }
            // Si las credenciales son incorrectas
            return res.send({
                success: false,
                error: MULTI_LANGUAGE.translateText(currentLanguage, "{{security.wrongCredentials}}")
            });
        }
        // Si los parámetros no son válidos, devuelve un error 400
        res.sendStatus(400);
    });

    // Endpoint para obtener la lista de permisos del usuario
    router.get("/permissions", function (req, res) {
        if (SECURITY.isUserHasCookies(req)) { // Verifica si el usuario tiene cookies válidas
            return res.send(SECURITY.getUserDataByUsername(req.cookies["kbk__login"]).permissions);
        }
        // Si no tiene permisos, devuelve un error 403
        res.sendStatus(403);
    });

    // Endpoint para obtener la lista de servidores accesibles por el usuario
    router.get("/servers", function (req, res) {
        if (SECURITY.isUserHasCookies(req)) { // Verifica si el usuario tiene cookies válidas
            let usrObject = SECURITY.getUserDataByUsername(req.cookies["kbk__login"]);
            if (usrObject !== false) {
                // Si el acceso a servidores está restringido, devuelve la lista permitida
                if (usrObject.serversAccessRestricted === true) {
                    res.send(usrObject.serversAllowed);
                } else {
                    // Si no está restringido, devuelve todos los servidores
                    res.send(SERVERS_MANAGER.getServersList());
                }
                return;
            }
        }
        // Si no tiene permisos, devuelve un error 403
        res.sendStatus(403);
    });

    // Endpoint para obtener el nombre de usuario (login) del usuario actual
    router.get("/login", function (req, res) {
        if (SECURITY.isUserHasCookies(req)) { // Verifica si el usuario tiene cookies válidas
            return res.send(req.cookies["kbk__login"]);
        }
        // Si no tiene permisos, devuelve un error 403
        res.sendStatus(403);
    });

    // Endpoint para cerrar sesión
    router.get("/logout", function (req, res) {
        if (SECURITY.isUserHasCookies(req)) { // Verifica si el usuario tiene cookies válidas
            // Elimina las cookies de sesión
            res.clearCookie("kbk__login");
            res.clearCookie("kbk__hash");
            return res.send({
                success: true // Indica que el cierre de sesión fue exitoso
            });
        }
        // Si no tiene permisos, devuelve un error
        res.send({
            success: false
        });
    });

    // Endpoint para verificar si la autorización está habilitada
    router.get("/isEnabled", (req, res) => {
        res.send(mainConfig.authorization); // Devuelve el estado de la autorización
    });
}

// Exporta el router y la función de inicialización del servidor web
export { router, initializeWebServer };