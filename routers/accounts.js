import PREDEFINED from "./../modules/predefined.js";
import * as ACCOUNTS_MANAGER from "./../modules/accountsManager.js";
import * as COMMONS from "./../modules/commons.js";
import * as WEBSERVER from "./../modules/webserver.js";
import express from "express";
import bcrypt from 'bcrypt';

const router = express.Router();

function initializeWebServer() {
    // Endpoint para obtener la lista de cuentas
    router.get("/", function (req, res) {
        res.send(ACCOUNTS_MANAGER.getUsersList());
    });

    // Endpoint para obtener información de una cuenta
    router.get("/:login", function (req, res) {
        let q = req.params;
        if (COMMONS.isObjectsValid(q.login)) {
            return res.send(ACCOUNTS_MANAGER.getUserData(q.login));
        }
        res.sendStatus(400);
    });

    // Endpoint para eliminar una cuenta
    router.delete("/:login", function (req, res) {
        let q = req.params;
        if (COMMONS.isObjectsValid(q.login)) {
            return res.send(ACCOUNTS_MANAGER.deleteUser(q.login));
        }
        res.sendStatus(400);
    });

    // Endpoint para regenerar el hash
    router.get("/:login/regenHash", function (req, res) {
        let q = req.params;
        if (COMMONS.isObjectsValid(q.login)) {
            return res.send(ACCOUNTS_MANAGER.regenUserHash(q.login));
        }
        res.sendStatus(400);
    });

    // Endpoint para cambiar la contraseña de un usuario
    router.put("/:login/password", async function (req, res) {
        let q = req.params;
        let q2 = req.query;

        if (q.login !== "kubek") {
            if (COMMONS.isObjectsValid(q.login, q2.newPassword)) {
                return res.send(await ACCOUNTS_MANAGER.changePassword(q.login, q2.newPassword));
            }
        } else {
            if (COMMONS.isObjectsValid(q.login, q2.oldPassword, q2.newPassword)) {
                let getKubekPwd = ACCOUNTS_MANAGER.getUserData("kubek").password;
                if (await bcrypt.compare(q2.oldPassword, getKubekPwd)) {
                    return res.send(await ACCOUNTS_MANAGER.changePassword(q.login, q2.newPassword));
                } else {
                    return res.send(false);
                }
            }
        }
        res.sendStatus(400);
    });

    // Endpoint para crear un usuario
    router.put("/", async function (req, res) {
        let q2 = req.query;
        let permSplit = [];
        let serversAllowed = [];
        if (COMMONS.isObjectsValid(q2.login, q2.password, q2.permissions)) {
            // Convertir permissions en un array
            if (!q2.permissions) return res.sendStatus(400);
            if (Array.isArray(q2.permissions)) {
                permSplit = q2.permissions;
            } else {
                permSplit = q2.permissions.split(",");
            }
            // Convertir servers en un array
            if (COMMONS.isObjectsValid(q2.servers)) {
                serversAllowed = q2.servers.split(",");
            }
            // Verificar la validez del email
            if (!COMMONS.isObjectsValid(q2.email)) {
                q2.email = "";
            }
            return res.send(await ACCOUNTS_MANAGER.createNewAccount(q2.login, q2.password, permSplit, q2.email, serversAllowed));
        }
        res.sendStatus(400);
    });

    // Endpoint para actualizar un usuario
    router.put("/:login", async function (req, res) {
        let q = req.params;
        let q2 = req.query;
        let permSplit = [];
        let serversAllowed = [];
        if (COMMONS.isObjectsValid(q.login, q2.permissions)) {
            // Convertir permissions en un array
            permSplit = q2.permissions.split(",");
            // Convertir servers en un array
            if (COMMONS.isObjectsValid(q2.servers)) {
                serversAllowed = q2.servers.split(",");
            }
            // Verificar la validez del email
            if (!COMMONS.isObjectsValid(q2.email)) {
                q2.email = "";
            }
            // Verificar la validez de la contraseña
            if (!COMMONS.isObjectsValid(q2.password)) {
                q2.password = "";
            }
            return res.send(await ACCOUNTS_MANAGER.updateAccount(q.login, q2.password, permSplit, q2.email, serversAllowed));
        }
        res.sendStatus(400);
    });
}

export { router, initializeWebServer };