import PREDEFINED from "./predefined.js";
import * as SECURITY from "./security.js";
import { configManager, mainConfig } from "./configuration.js";
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // Número de rondas de sal para bcrypt

let usersConfig = globalThis.usersConfig;

export const createNewAccount = async (login, password, permissions = [], email = "", servers = []) => {
    configManager.reloadAllConfigurations();
    if (login !== "kubek" && !SECURITY.isUserExists(login)) {
        if (login.match(PREDEFINED.LOGIN_REGEX) != null && password.match(PREDEFINED.PASSWORD_REGEX) != null) {
            if (email === "" || email.match(PREDEFINED.EMAIL_REGEX) != null) {
                // Crear hash de la contraseña
                const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

                // Crear variables adicionales
                let serversRestricted = false;
                let userHash = SECURITY.generateSecureID();
                if (servers.length > 0) {
                    serversRestricted = true;
                }

                // Agregar permiso por defecto
                permissions.push(PREDEFINED.PERMISSIONS.DEFAULT);

                // Agregar usuario al config y guardar
                usersConfig[login] = {
                    username: login,
                    password: hashedPassword,
                    secret: userHash,
                    permissions: permissions,
                    email: email,
                    serversAccessRestricted: serversRestricted,
                    serversAllowed: servers
                };

                configManager.writeUsersConfig(usersConfig);
                return true;
            }
        }
    }
    return false;
};

export const updateAccount = async (login, password = "", permissions = [], email = "", servers = []) => {
    configManager.reloadAllConfigurations();
    if (login.match(PREDEFINED.LOGIN_REGEX) != null && SECURITY.isUserExists(login)) {
        if (email === "" || email.match(PREDEFINED.EMAIL_REGEX) != null) {
            if (password === "" || password.match(PREDEFINED.PASSWORD_REGEX) != null) {
                // Crear variables adicionales
                let serversRestricted = false;
                if (servers.length > 0) {
                    serversRestricted = true;
                }

                // Agregar permiso por defecto
                permissions.push(PREDEFINED.PERMISSIONS.DEFAULT);

                // Actualizar config del usuario
                usersConfig[login].permissions = permissions;
                usersConfig[login].email = email;
                usersConfig[login].serversAccessRestricted = serversRestricted;
                usersConfig[login].serversAllowed = servers;

                if (password !== "") {
                    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
                    usersConfig[login].password = hashedPassword;
                    usersConfig[login].secret = SECURITY.generateSecureID();
                }

                configManager.writeUsersConfig(usersConfig);
                return true;
            }
        }
    }
    return false;
};

export const regenUserHash = (login) => {
    configManager.reloadAllConfigurations();
    if (SECURITY.isUserExists(login)) {
        usersConfig[login].secret = SECURITY.generateSecureID();
        configManager.writeUsersConfig(usersConfig);
        return true;
    }
    return false;
};

export const changePassword = async (login, password) => {
    configManager.reloadAllConfigurations();
    if (SECURITY.isUserExists(login)) {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        usersConfig[login].password = hashedPassword;
        regenUserHash(login);
        configManager.writeUsersConfig(usersConfig);
        return true;
    }
    return false;
};

export const deleteUser = (login) => {
    configManager.reloadAllConfigurations();
    if (login !== "kubek" && SECURITY.isUserExists(login)) {
        usersConfig[login] = null;
        delete usersConfig[login];
        configManager.writeUsersConfig(usersConfig);
        return true;
    }
    return false;
};

export const getUserData = (login) => {
    if (SECURITY.isUserExists(login)) {
        return usersConfig[login];
    }
    return false;
};

export const getUsersList = () => {
    configManager.reloadAllConfigurations();
    return Object.keys(usersConfig);
};