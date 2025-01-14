// Загружаем нужные самописные модули
import * as COMMONS from "./modules/commons.js";
import * as CONFIGURATION from "./modules/configuration.js";    

// Создаём нужные папки (если их не существует)
COMMONS.makeBaseDirs();

// Загружаем файлы конфигурации в глобальные переменные
CONFIGURATION.reloadAllConfigurations();
CONFIGURATION.migrateOldMainConfig();
CONFIGURATION.migrateOldServersConfig();

import * as LOGGER from "./modules/logger.js";
import * as MULTI_LANGUAGE from "./modules/multiLanguage.js";
import * as WEBSERVER from "./modules/webserver.js";
import * as STATS_COLLECTION from "./modules/statsCollection.js";
import * as FTP_DAEMON from "./modules/ftpDaemon.js";

const collStats = STATS_COLLECTION.collectStats();
STATS_COLLECTION.sendStatsToServer(collStats, true);

// Загружаем доступные языки и ставим переменную с языком из конфига
MULTI_LANGUAGE.loadAvailableLanguages();
global.currentLanguage = mainConfig.language;

// Показываем приветствие
LOGGER.kubekWelcomeMessage();

WEBSERVER.loadAllDefinedRouters();
WEBSERVER.startWebServer();

// Запускаем FTP-сервер
global.ftpDaemon = null;
FTP_DAEMON.startFTP();

// Автоматически запустить сервера, которые были запущены при закрытии Kubek
CONFIGURATION.autoStartServers();