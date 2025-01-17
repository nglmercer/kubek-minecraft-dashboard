import * as COMMONS from './commons.js';
import * as PREDEFINED from './predefined.js';
import path from "path";    
import fs from "fs";            
import { execSync } from 'child_process';

// Detectar si estamos en Termux
const isTermux = () => {
    return process.platform === 'android' || fs.existsSync('/data/data/com.termux');
};

// Convertir versión del juego a versión Java requerida
export const gameVersionToJava = (version) => {
    let sec = parseInt(version.split(".")[1]);
    let ter = parseInt(version.split(".")[2]);
    if (sec < 8) {
        return 8;
    } else if (sec >= 8 && sec <= 11) {
        return 11;
    } else if (sec >= 12 && sec <= 15) {
        return 11;
    } else if (sec === 16) {
        if (ter <= 4) {
            return 11;
        } else {
            return 16;
        }
    } else if (sec >= 17) {
        return 18;
    } else if (sec >= 20) {
        return 20;
    }
};

// Instalar Java en Termux
export const installJavaTermux = async (version) => {
    try {
        execSync(`pkg install -y openjdk-${version}`);
        return true;
    } catch (error) {
        console.error('Error instalando Java en Termux:', error);
        return false;
    }
};

// Verificar si una versión específica de Java está instalada en Termux
export const checkJavaVersionTermux = (version) => {
    try {
        const output = execSync('pkg list-installed | grep openjdk').toString();
        return output.includes(`openjdk-${version}`);
    } catch (error) {
        return false;
    }
};

// Obtener versiones de Java disponibles
export const getDownloadableJavaVersions = (cb) => {
    if (isTermux()) {
        try {
            // En Termux, buscamos las versiones disponibles en pkg
            const output = execSync('pkg search "^openjdk-[0-9]+"').toString();
            const versions = output.match(/openjdk-(\d+)/g)
                .map(v => v.replace('openjdk-', ''))
                .filter(v => parseInt(v) >= 8 && parseInt(v) <= 21);
            cb(versions);
        } catch (error) {
            console.error('Error obteniendo versiones disponibles:', error);
            cb(false);
        }
        return;
    }

    // Para otras plataformas
    COMMONS.getDataByURL(PREDEFINED.JAVA_LIST_URL, (data) => {
        if (data !== false) {
            let availReleases = data.available_releases;
            availReleases.forEach((release, i) => {
                availReleases[i] = release.toString();
            });
            cb(availReleases);
            return;
        }
        cb(false);
    });
};

// Obtener versiones locales de Java
export const getLocalJavaVersions = () => {
    if (isTermux()) {
        try {
            const output = execSync('pkg list-installed | grep openjdk').toString();
            return output.match(/openjdk-(\d+)/g)
                .map(v => v.replace('openjdk-', ''));
        } catch (error) {
            console.error('Error obteniendo versiones locales:', error);
            return [];
        }
    }

    // Para otras plataformas
    let startPath = "./binaries/java";
    if (!fs.existsSync(startPath)) {
        return [];
    }
    let rdResult = fs.readdirSync(startPath);
    rdResult = rdResult.filter(entry => fs.lstatSync(startPath + path.sep + entry).isDirectory());
    return rdResult;
};

// Obtener información de Java por versión
export const getJavaInfoByVersion = (javaVersion) => {
    if (isTermux()) {
        return {
            isTermux: true,
            version: javaVersion,
            packageName: `openjdk-${javaVersion}`,
            installCmd: `pkg install openjdk-${javaVersion}`,
            javaPath: `/data/data/com.termux/files/usr/bin/java`,
            installed: checkJavaVersionTermux(javaVersion)
        };
    }

    let platformName = "";
    let fileExtension = "";
    let platformArch = "";

    if (process.platform === "win32") {
        platformName = "windows";
        fileExtension = ".zip";
    } else if (process.platform === "linux") {
        platformName = "linux";
        fileExtension = ".tar.gz";
    } else {
        return false;
    }

    if (process.arch === "x64") {
        platformArch = "x64";
    } else if (process.arch === "x32") {
        platformArch = "x86";
    } else if (process.arch === "arm64") {
        platformArch = "aarch64";
    } else if (process.arch === "arm") {
        platformArch = "arm";
    } else {
        return false;
    }

    let resultURL =
        "https://api.adoptium.net/v3/binary/latest/" +
        javaVersion +
        "/ga/" +
        platformName +
        "/" +
        platformArch +
        "/jdk/hotspot/normal/eclipse?project=jdk";
    let filename = "Java-" + javaVersion + "-" + platformArch + fileExtension;
    return {
        url: resultURL,
        filename: filename,
        version: javaVersion,
        platformArch: platformArch,
        platformName: platformName,
        downloadPath: "." + path.sep + "binaries" + path.sep + "java" + path.sep + filename,
        unpackPath: "." + path.sep + "binaries" + path.sep + "java" + path.sep + javaVersion + path.sep
    }
};

// Obtener ruta de Java
export const getJavaPath = (javaVersion) => {
    if (isTermux()) {
        const termuxJavaPath = '/data/data/com.termux/files/usr/bin/java';
        if (fs.existsSync(termuxJavaPath)) {
            try {
                // Verificar que la versión instalada coincide
                const output = execSync(`${termuxJavaPath} -version 2>&1`).toString();
                const installedVersion = output.match(/version "(\d+)/)[1];
                if (installedVersion === javaVersion.toString()) {
                    return termuxJavaPath;
                }
            } catch (error) {
                console.error('Error verificando versión de Java:', error);
            }
        }
        return false;
    }

    let javaDirPath = "." + path.sep + "binaries" + path.sep + "java" + path.sep + javaVersion;
    let javaSearchPath1 = javaDirPath + path.sep + "bin" + path.sep + "java";
    if(process.platform === "win32"){
        javaSearchPath1 += ".exe";
    }
    if (fs.existsSync(javaDirPath) && fs.lstatSync(javaDirPath).isDirectory()) {
        if (fs.existsSync(javaSearchPath1)) {
            return javaSearchPath1;
        } else {
            let javaReaddir = fs.readdirSync(javaDirPath);
            if (fs.readdirSync(javaDirPath).length === 1) {
                let javaChkPath = javaDirPath + path.sep + javaReaddir[0] + path.sep + "bin" + path.sep + "java";
                if(process.platform === "win32"){
                    javaChkPath += ".exe";
                }
                if (fs.existsSync(javaChkPath)) {
                    return javaChkPath;
                }
            }
        }
    }
    return false;
};

// Verificar si Java está instalado y es funcional
export const verifyJavaInstallation = async (version) => {
    if (isTermux()) {
        try {
            const javaPath = getJavaPath(version);
            if (!javaPath) return false;
            
            execSync(`${javaPath} -version`);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    // Para otras plataformas
    const javaPath = getJavaPath(version);
    if (!javaPath) return false;
    
    try {
        execSync(`"${javaPath}" -version`);
        return true;
    } catch (error) {
        return false;
    }
};