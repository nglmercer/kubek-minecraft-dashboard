import * as PREDEFINED from "./predefined.js";
import * as SECURITY from "./security.js";
import * as CONFIGURATION from "./configuration.js";
import { SHA256 } from "crypto-js/sha256";
export const createNewAccount = (login, password, permissions = [], email = "", servers = []) => {
    CONFIGURATION.reloadAllConfigurations();
    if (login !== "kubek" && !SECURITY.isUserExists(login)) {
        if (login.match(PREDEFINED.LOGIN_REGEX) != null && password.match(PREDEFINED.PASSWORD_REGEX) != null) {
            if (email === "" || email.match(PREDEFINED.EMAIL_REGEX) != null) {
                // Создаём недостающие переменные
                let serversRestricted = false;
                let userHash = SECURITY.generateSecureID();
                if (servers.length > 0) {
                    serversRestricted = true;
                }
                // Добавляем стандартный permission
                permissions.push(PREDEFINED.PERMISSIONS.DEFAULT);
                // Добавляем пользователя в конфиг и сохраняем
                usersConfig[login] = {
                    username: login,
                    password: SHA256(password).toString(),
                    secret: userHash,
                    permissions: permissions,
                    email: email,
                    serversAccessRestricted: serversRestricted,
                    serversAllowed: servers
                }
                CONFIGURATION.writeUsersConfig(usersConfig);
                return true;
            }
        }
    }
    return false;
};
export const updateAccount = (login, password = "", permissions = [], email = "", servers = []) => {    
    CONFIGURATION.reloadAllConfigurations();
    if (login.match(PREDEFINED.LOGIN_REGEX) != null && SECURITY.isUserExists(login)) {
        if (email === "" || email.match(PREDEFINED.EMAIL_REGEX) != null) {
            if (password === "" || password.match(PREDEFINED.PASSWORD_REGEX) != null) {
                // Создаём недостающие переменные
                let serversRestricted = false;
                if (servers.length > 0) {
                    serversRestricted = true;
                }
                // Добавляем стандартный permission
                permissions.push(PREDEFINED.PERMISSIONS.DEFAULT);
                // Обновляем конфиг пользователя
                usersConfig[login].permissions = permissions;
                usersConfig[login].email = email;
                usersConfig[login].serversAccessRestricted = serversRestricted;
                usersConfig[login].serversAllowed = servers;
                if (password !== "") {
                    usersConfig[login].password = SHA256(password).toString();
                    usersConfig[login].secret = SECURITY.generateSecureID();
                }
                CONFIGURATION.writeUsersConfig(usersConfig);
                return true;
            }
        }
    }
    return false;
}
export const regenUserHash = (login) => {
    CONFIGURATION.reloadAllConfigurations();
    if (SECURITY.isUserExists(login)) {
        usersConfig[login].secret = SECURITY.generateSecureID();
        CONFIGURATION.writeUsersConfig(usersConfig);
        return true;
    }
    return false;
};
export const changePassword = (login, password) => {
    CONFIGURATION.reloadAllConfigurations();
    if (SECURITY.isUserExists(login)) {
        usersConfig[login].password = SHA256(password).toString();
        this.regenUserHash(login);
        CONFIGURATION.writeUsersConfig(usersConfig);
        return true;
    }
    return false;
};
export const deleteUser = (login) => {
    CONFIGURATION.reloadAllConfigurations();
    if (login !== "kubek" && SECURITY.isUserExists(login)) {
        usersConfig[login] = null;
        delete usersConfig[login];
        CONFIGURATION.writeUsersConfig(usersConfig);
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
    CONFIGURATION.reloadAllConfigurations();
    return Object.keys(usersConfig);
};

// DEVELOPED by seeeroy