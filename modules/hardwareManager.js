import os from "os";
import nodeDiskInfo from "node-disk-info";
import osutils from "os-utils";
// Получить информацию об использовании ЦПУ и ОЗУ
export const getResourcesUsage = (cb) => {
    osutils.cpuUsage(function (cpuValue) {
        cb({
            cpu: Math.round(cpuValue * 100),
            ram: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                percent: 100 - Math.round((os.freemem() / os.totalmem()) * 100)
            }
        });
    });
};

// Получить суммарную информацию о системе и железе
export const getHardwareInfo = (cb) => {
    nodeDiskInfo
        .getDiskInfo()
        .then((disks) => {
            let cpuItem = os.cpus()[0];
            cb({
                uptime: Math.round(process.uptime()),
                platform: {
                    name: os.type(),
                    release: os.release(),
                    arch: process.arch,
                    version: os.version(),
                },
                totalmem: Math.round(os.totalmem() / 1024 / 1024),
                cpu: {
                    model: cpuItem.model,
                    speed: cpuItem.speed,
                    cores: os.cpus().length,
                },
                enviroment: process.env,
                disks: disks,
                networkInterfaces: os.networkInterfaces(),
            })
        })
        .catch((reason) => {
            console.error(reason);
        });
}
/*
import { execSync } from 'child_process';
import os from 'os';

export const getHardwareInfo = (cb) => {
    try {
        // Usar PowerShell para obtener información del disco
        const command = `powershell "Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID,FreeSpace,Size,VolumeSerialNumber,Description | ConvertTo-Json"`;
        const disksData = JSON.parse(execSync(command).toString());
        
        // Formatear la información del disco
        const disks = Array.isArray(disksData) ? disksData : [disksData];
        const formattedDisks = disks.map(disk => ({
            filesystem: disk.DeviceID,
            blocks: parseInt(disk.Size || 0),
            used: parseInt((disk.Size || 0) - (disk.FreeSpace || 0)),
            available: parseInt(disk.FreeSpace || 0),
            capacity: disk.Size ? Math.round(((disk.Size - disk.FreeSpace) / disk.Size) * 100) : 0,
            mounted: disk.DeviceID,
            serial: disk.VolumeSerialNumber,
            description: disk.Description
        }));

        let cpuItem = os.cpus()[0];
        cb({
            uptime: Math.round(process.uptime()),
            platform: {
                name: os.type(),
                release: os.release(),
                arch: process.arch,
                version: os.version(),
            },
            totalmem: Math.round(os.totalmem() / 1024 / 1024),
            cpu: {
                model: cpuItem.model,
                speed: cpuItem.speed,
                cores: os.cpus().length,
            },
            environment: process.env,
            disks: formattedDisks,
            networkInterfaces: os.networkInterfaces(),
        });
    } catch (error) {
        console.error('Error al obtener información del hardware:', error);
        cb({
            error: 'No se pudo obtener la información del hardware',
            details: error.message
        });
    }
};

// La función getResourcesUsage permanece igual
export const getResourcesUsage = async (cb) => {
    const osutils = await import('os-utils');
    osutils.cpuUsage(function(cpuValue) {
        cb({
            cpu: Math.round(cpuValue * 100),
            ram: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                percent: 100 - Math.round((os.freemem() / os.totalmem()) * 100)
            }
        });
    });
};
*/