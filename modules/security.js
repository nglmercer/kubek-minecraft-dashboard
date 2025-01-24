/**
 * User Authentication & Authorization Module
 * @module UserAuth
 */

import sha256 from 'crypto-js/sha256.js';
const SHA256 = sha256;  // Cryptographic hash function for password security

/**
 * Check if user has specific permission
 * @param {string} username - User identifier
 * @param {string} permission - Permission to verify
 * @returns {boolean} Authorization status
 */
export const isUserHasPermission = (username, permission) => {  
    if (!mainConfig.authorization) return true;
    const userData = getUserDataByUsername(username);
    return !!userData?.permissions?.includes(permission);
};

/**
 * Verify server access privileges
 * @param {string} username - User identifier
 * @param {string} server - Server ID/name
 * @returns {boolean} Access authorization status
 */
export const isUserHasServerAccess = (username, server) => {
    if (!mainConfig.authorization) return true;
    const userData = getUserDataByUsername(username);
    return userData && (
        !userData.serversAccessRestricted || 
        userData.serversAllowed?.includes(server)
    );
};

/**
 * Authenticate user credentials
 * @param {string} login - User login
 * @param {string} password - Plain text password
 * @returns {boolean} Authentication success
 */
export const authorizeUser = (login, password) => {
    if (!mainConfig.authorization) return true;
    const userData = getUserDataByUsername(login);
    return userData?.password === SHA256(password).toString();
};

/**
 * Validate secret token authentication
 * @param {string} login - User login
 * @param {string} secret - Security token
 * @returns {boolean} Token validation result
 */
export const authenticateUser = (login, secret) => {
    if (!mainConfig.authorization) return true;
    const userData = getUserDataByUsername(login);
    return userData?.secret === secret;
};

/**
 * Retrieve user data by username
 * @param {string} username - User identifier
 * @returns {object|boolean} User data or false
 */
export const getUserDataByUsername = (username) => {
    return Object.values(usersConfig).find(
        user => user.username === username
    ) || false;
};

/**
 * Check authentication cookies presence
 * @param {object} req - HTTP request object
 * @returns {boolean} Cookies existence status
 */
export const isUserHasCookies = (req) => {
    return 'kbk__hash' in req.cookies && 'kbk__login' in req.cookies;
};

/**
 * Verify user existence in system
 * @param {string} username - User identifier
 * @returns {boolean} User registration status
 */
export const isUserExists = (username) => {
    return getUserDataByUsername(username) !== false;
};

/**
 * Generate random security identifier
 * @param {number} [length=18] - ID length
 * @returns {string} Generated security token
 */
export const generateSecureID = (length = 18) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({length}, () => 
        charset.charAt(Math.floor(Math.random() * charset.length))
    ).join('');
};