import sha256 from 'crypto-js/sha256.js';
const SHA256 = sha256;
// Проверить имеет ли пользователь определённое право
export const isUserHasPermission = (username, permission) => {  
    if (mainConfig.authorization === false) {
        // Сразу разрешаем доступ, если авторизация отключена в конфигурации
        return true;
    }
    let userData = this.getUserDataByUsername(username);
    return userData !== false && userData.permissions.includes(permission);
};

// Проверить, имеет ли пользователь доступ к серверу
export const isUserHasServerAccess = (username, server) => {
    if (mainConfig.authorization === false) {
        // Сразу разрешаем доступ, если авторизация отключена в конфигурации
        return true;
    }
    let userData = this.getUserDataByUsername(username);
    if (userData !== false) {
        if (userData.serversAccessRestricted === false || userData.serversAllowed.includes(server)) {
            return true;
        }
    }
    return false;
};

// Авторизовать пользователя по логину и паролю
export const authorizeUser = (login, password) => {
    if (mainConfig.authorization === false) {
        // Сразу разрешаем доступ, если авторизация отключена в конфигурации
        return true;
    }
    let userData = this.getUserDataByUsername(login);
    return userData !== false && userData.password === SHA256(password).toString();
};

// Провести аутентификацию пользователя
export const authenticateUser = (login, secret) => {
    if (mainConfig.authorization === false) {
        // Сразу разрешаем доступ, если авторизация отключена в конфигурации
        return true;
    }
    let userData = this.getUserDataByUsername(login);
    return userData !== false && userData.secret === secret;
};

// Получить данные пользователя из конфига по имени
export const getUserDataByUsername = (username) => {
    for (const [, userData] of Object.entries(usersConfig)) {
        if (userData.username === username) {
            return userData;
        }
    }
    return false;
};

// Проверить существование куков у пользователя
export const isUserHasCookies = (req) => {
    return typeof req.cookies["kbk__hash"] !== "undefined" && typeof req.cookies["kbk__login"] !== "undefined";
};

// Проверить существование пользователя
export const isUserExists = (username) => {
    return this.getUserDataByUsername(username) !== false;
};

// Сгенерировать рандомный ID безопасности
export const generateSecureID = (length = 18) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}