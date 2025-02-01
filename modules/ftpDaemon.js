/**
 * FTP Server Module
 * @module FTPServer
 */

import MULTILANG from "./multiLanguage.js";  // Multi-language support module
import LOGGER from './logger.js';                 // Logging utility module
import ftpd from "ftpd";                          // FTP server library
import colors from "colors";                      // Terminal text coloring
import path from "path";                          // Path manipulation utilities
import { configManager } from "./configuration.js";
// Default FTP server configuration
const defaultOptions = {
    host: "127.0.0.1",         // Default binding address
    port: 21,                  // Default control port
    tls: null                  // TLS/SSL configuration (disabled by default)
};

// Global FTP server instance reference
let ftpDaemon = null;
export const startFTP = () => {
    const isEnabled = configManager.mainConfig.ftpd.enabled;
    
    if (!isEnabled) return false;

    // Server configuration initialization
    const initPath = path.normalize("./");               // Root directory
    const { username, password, port } = configManager.mainConfig.ftpd; // Auth credentials

    // Create FTP server instance
    ftpDaemon = new ftpd.FtpServer(defaultOptions.host, {
        getInitialCwd: () => "/",                // Initial working directory
        getRoot: () => initPath,                 // Filesystem root
        pasvPortRangeStart: 1025,                // Passive mode port range
        pasvPortRangeEnd: 1050,
        tlsOptions: defaultOptions.tls,          // TLS configuration
        allowUnauthorizedTls: true,              // Allow self-signed certificates
        useWriteFile: false,                     // Disable file write buffering
        useReadFile: false,                      // Disable file read buffering
        uploadMaxSlurpSize: 7000,                // Max upload chunk size (7KB)
        allowedCommands: [
            "XMKD",
            "AUTH",
            "TLS",
            "SSL",
            "USER",
            "PASS",
            "PWD",
            "OPTS",
            "TYPE",
            "PORT",
            "PASV",
            "LIST",
            "CWD",
            "MKD",
            "SIZE",
            "STOR",
            "MDTM",
            "DELE",
            "QUIT",
            "EPSV",
            "RMD",
            "RETR",
            "RNFR",
            "RNTO",
        ]
    });

    // Error handling
    ftpDaemon.on("error", (error) => {
        LOGGER.error(`${MULTILANG.translateText(configManager.mainConfig.language, "{{console.ftpError}}")} ${error}`);
    });

    // Client connection handling
    ftpDaemon.on("client:connected", (connection) => {
        LOGGER.log(MULTILANG.translateText(configManager.mainConfig.language, "{{console.ftpNewConnection}}"));

        // Username validation
        connection.on("command:user", (user, success, failure) => {
            user === username ? success() : failure();
        });

        // Password validation
        connection.on("command:pass", (pass, success, failure) => {
            if (pass === password) {
                LOGGER.log(`${MULTILANG.translateText(configManager.mainConfig.language, "{{console.ftpConnected}}")} ${colors.green(username)}`);
                success(username);
            } else {
                failure();
            }
        });
    });

    // Server initialization
    ftpDaemon.debugging = 0;  // Disable debug output
    ftpDaemon.listen(port);
    LOGGER.log(`${MULTILANG.translateText(configManager.mainConfig.language, "{{console.ftpStarted}}")} ${colors.cyan(port)}`);
    return true;
};


export const stopFTP = () => {
    if (!ftpDaemon) return false;
    
    ftpDaemon.close();
    ftpDaemon = null;
    LOGGER.log(MULTILANG.translateText(configManager.mainConfig.language, "{{console.ftpStopped}}"));
    return true;
};

/**
 * Checks if FTP server is running
 * @returns {boolean} Server status
 */
export const isFTPStarted = () => {
    return ftpDaemon !== null;
};