import express from 'express';
import { discoveredServers } from '../modules/networkDiscovery.js';
import { configManager } from "./../modules/configuration.js";
export const router = express.Router();
router.get('/', (req, res) => {
    res.json({
        name: configManager.mainConfig.serverName || 'Kubek Server',
        port: configManager.mainConfig.webserverPort,
        version: globalThis.kubekVersion,
        servers: configManager.mainConfig.servers
    });
});

router.get('/list', (req, res) => {
    const servers = Array.from(discoveredServers.values());    
    // Combinar datos
    const response = {
        servers: servers
    };
    
    res.json(response);
});
setTimeout(() => {
    const server = Array.from(discoveredServers.values());

// Mostrar la lista
server.forEach(server => {
    console.log(`Servidor encontrado: IP ${server.ip}, Puerto ${server.port}`);
});
console.log('Lista de servidores encontrados:', server);
}, 10000);
export function initializeWebServer(webServer) {
    // Middleware adicional si es necesario
}