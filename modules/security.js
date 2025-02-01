import bcrypt from 'bcrypt';

class UserAuth {
    constructor(mainConfig, usersConfig) {
        this.mainConfig = mainConfig;
        this.usersConfig = usersConfig;
    }

    /**
     * Check if user has specific permission
     * @param {string} username - User identifier
     * @param {string} permission - Permission to verify
     * @returns {boolean} Authorization status
     */
    isUserHasPermission(username, permission) {
        if (!this.mainConfig.authorization) return true;
        const userData = this.getUserDataByUsername(username);
        return !!userData?.permissions?.includes(permission);
    }

    /**
     * Verify server access privileges
     * @param {string} username - User identifier
     * @param {string} server - Server ID/name
     * @returns {boolean} Access authorization status
     */
    isUserHasServerAccess(username, server) {
        if (!this.mainConfig.authorization) return true;
        const userData = this.getUserDataByUsername(username);
        return userData && (
            !userData.serversAccessRestricted ||
            userData.serversAllowed?.includes(server)
        );
    }

    /**
     * Authenticate user credentials
     * @param {string} login - User login
     * @param {string} password - Plain text password
     * @returns {boolean} Authentication success
     */
    async authorizeUser(login, password) {
        if (!this.mainConfig.authorization) return true;
        const userData = this.getUserDataByUsername(login);
        return userData && await bcrypt.compare(password, userData.password);
    }

    /**
     * Validate secret token authentication
     * @param {string} login - User login
     * @param {string} secret - Security token
     * @returns {boolean} Token validation result
     */
    authenticateUser(login, secret) {
        if (!this.mainConfig.authorization) return true;
        const userData = this.getUserDataByUsername(login);
        return userData?.secret === secret;
    }

    /**
     * Retrieve user data by username
     * @param {string} username - User identifier
     * @returns {object|boolean} User data or false
     */
    getUserDataByUsername(username) {
        return Object.values(this.usersConfig).find(
            user => user.username === username
        ) || false;
    }

    /**
     * Check authentication cookies presence
     * @param {object} req - HTTP request object
     * @returns {boolean} Cookies existence status
     */
    isUserHasCookies(req) {
        return 'kbk__hash' in req.cookies && 'kbk__login' in req.cookies;
    }

    /**
     * Verify user existence in system
     * @param {string} username - User identifier
     * @returns {boolean} User registration status
     */
    isUserExists(username) {
        return this.getUserDataByUsername(username) !== false;
    }

    /**
     * Generate random security identifier
     * @param {number} [length=18] - ID length
     * @returns {string} Generated security token
     */
    static generateSecureID(length = 18) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () =>
            charset.charAt(Math.floor(Math.random() * charset.length))
        ).join('');
    }
    generateID(length = 18) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () =>
            charset.charAt(Math.floor(Math.random() * charset.length))
        ).join('');
    }
}

export default UserAuth;