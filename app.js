// Cargamos los módulos personalizados necesarios
import * as COMMONS from "./modules/commons.js";
import { configManager, mainConfig } from "./modules/configuration.js";   
import * as CONFIGURATION from "./modules/configuration.js";
// Creamos las carpetas necesarias (si no existen)
COMMONS.makeBaseDirs();
// Cargamos los archivos de configuración en variables globales
configManager.reloadAllConfigurations();
configManager.migrateOldMainConfig();
configManager.migrateOldServersConfig();
import LOGGER from "./modules/logger.js";
import * as MULTI_LANGUAGE from "./modules/multiLanguage.js";
import * as WEBSERVER from "./modules/webserver.js";
import * as STATS_COLLECTION from "./modules/statsCollection.js";
import * as FTP_DAEMON from "./modules/ftpDaemon.js";

const collStats = STATS_COLLECTION.collectStats();
STATS_COLLECTION.sendStatsToServer(collStats, true);

// Cargamos los idiomas disponibles y establecemos la variable con el idioma de la configuración
MULTI_LANGUAGE.loadAvailableLanguages();
globalThis.currentLanguage = mainConfig.language;

// Mostramos un mensaje de bienvenida
LOGGER.kubekWelcomeMessage();


WEBSERVER.loadAllDefinedRouters();
WEBSERVER.startWebServer();

// Iniciamos el servidor FTP
globalThis.ftpDaemon = null;
FTP_DAEMON.startFTP();

// Iniciamos automáticamente los servidores que estaban en ejecución cuando se cerró Kubek
configManager.autoStartServers();
CONFIGURATION.autoStartServers(); // FIX THIS