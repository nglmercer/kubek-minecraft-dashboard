class WebDebugger {
  static isEnabled = true;
  static callSites = new Map();
  
  static toggleLogs(enable = !this.isEnabled) {
    this.isEnabled = enable;
  }

  static registerCallSite(file, line) {
    const error = new Error();
    // Agregar marca única para identificación más fácil
    error.isDebugMarker = true;
    this.callSites.set(error, { file, line });
    return error;
  }

  static log(...args) {
    if (!this.isEnabled) return;

    const error = new Error();
    const stackLines = error.stack?.split('\n') || [];
    let callerInfo = { file: 'Unknown', line: '0' };

    // Regex mejorado para múltiples formatos de stack trace
    const stackRegex = /(\S+):(\d+):(\d+)/;
    
    // Buscar primera línea relevante en el stack
    for (const line of stackLines.slice(2)) {
      const match = line.match(stackRegex);
      if (match) {
        callerInfo = { file: match[1], line: match[2] };
        break;
      }
    }

    // Buscar ubicación registrada usando marca
    const registeredSite = Array.from(this.callSites.entries()).find(([key]) => {
      return stackLines.some(line => line.includes(key.stack.split('\n')[0]));
    });

    if (registeredSite) {
      callerInfo = registeredSite[1];
      this.callSites.delete(registeredSite[0]);
    }

    const label = `${callerInfo.file}:${callerInfo.line}`;
    
    console.groupCollapsed(
      `%cDebug [${label}]`, 
      'color: #4CAF50; font-weight: bold; cursor: pointer;'
    );
    
    console.log(`%cCaller: ${label}`, 'color: #9E9E9E; font-size: 0.8em;');
    
    args.forEach(arg => {
      if (arg instanceof Error) {
        console.error('%cError:', 'color: #ff4444;', arg);
      } else if (typeof arg === 'object') {
        console.dir(arg);
      } else {
        console.log(arg);
      }
    });
    
    console.groupEnd();
  }

  static getcallSites() {
    return this.callSites;
  }
}
class DebuggerGroup {
  constructor(name) {
    this.name = name;
    this.isEnabled = true;
    this.callSites = new Map();
  }

  registerCallSite(file, line) {
    const error = new Error();
    this.callSites.set(error, { file, line });
    return error;
  }

  toggle(enable = !this.isEnabled) {
    this.isEnabled = enable;
  }

  log(...args) {
    if (!this.isEnabled) return;

    const error = new Error();
    const stackLines = error.stack?.split('\n') || [];
    let callerInfo = { file: 'Unknown', line: '0' };

    // Extracción de ubicación
    const stackRegex = /(\S+):(\d+):(\d+)/;
    for (const line of stackLines.slice(2)) {
      const match = line.match(stackRegex);
      if (match) {
        callerInfo = { file: match[1], line: match[2] };
        break;
      }
    }

    // Buscar ubicación registrada
    const registeredSite = Array.from(this.callSites.entries()).find(([key]) => {
      return stackLines.some(line => line.includes(key.stack.split('\n')[0]));
    });

    if (registeredSite) {
      callerInfo = registeredSite[1];
      this.callSites.delete(registeredSite[0]);
    }

    const label = `${callerInfo.file}:${callerInfo.line}`;
    
    console.groupCollapsed(
      `%c${this.name} [${label}]`, 
      'color: #4CAF50; font-weight: bold; cursor: pointer;'
    );
    
    console.log(`%cCaller: ${label}`, 'color: #9E9E9E; font-size: 0.8em;');
    
    args.forEach(arg => {
      if (arg instanceof Error) {
        console.error('%cError:', 'color: #ff4444;', arg);
      } else if (typeof arg === 'object') {
        console.dir(arg);
      } else {
        console.log(arg);
      }
    });
    
    console.groupEnd();
  }
}

class DebuggerGroupManager {
  static groups = new Map();

  static create(name) {
    if (!this.groups.has(name)) {
      this.groups.set(name, new DebuggerGroup(name));
    }
    return this.groups.get(name);
  }

  static get(name) {
    return this.groups.get(name);
  }

  static toggleGroup(name, enable) {
    const group = this.groups.get(name);
    if (group) group.toggle(enable);
  }

  static toggleAll(enable) {
    this.groups.forEach(group => group.toggle(enable));
  }
}
class KubekUtils {
  // Convertir tamaño de archivo a un formato legible por humanos
  static humanizeFileSize(size) {
      if (size < 1024) {
          size = size + " B";
      } else if (size < 1024 * 1024) {
          size = Math.round((size / 1024) * 10) / 10 + " Kb";
      } else if (size < 1024 * 1024 * 1024) {
          size = Math.round((size / 1024 / 1024) * 10) / 10 + " Mb";
      } else if (size >= 1024 * 1024 * 1024) {
          size = Math.round((size / 1024 / 1024 / 1024) * 10) / 10 + " Gb";
      } else {
          size = size + " ?";
      }
      return size;
  }

  // Convertir segundos a un formato legible por humanos
  static humanizeSeconds(seconds) {
      let hours = Math.floor(seconds / (60 * 60));
      let minutes = Math.floor((seconds % (60 * 60)) / 60);
      seconds = Math.floor(seconds % 60);

      return (
          this.padZero(hours) + "{{commons.h}} " +
          this.padZero(minutes) + "{{commons.m}} " +
          this.padZero(seconds) + "{{commons.s}}"
      );
  }

  // Añadir un cero delante de un número (para fechas)
  static padZero(number) {
      return (number < 10 ? "0" : "") + number;
  }

  // Seleccionar un color de degradado según una fracción
  static pickGradientFadeColor(fraction, color1, color2, color3) {
      let fade = fraction * 2;

      if (fade >= 1) {
          fade -= 1;
          color1 = color2;
          color2 = color3;
      }

      let diffRed = color2.red - color1.red;
      let diffGreen = color2.green - color1.green;
      let diffBlue = color2.blue - color1.blue;

      let gradient = {
          red: parseInt(Math.floor(color1.red + diffRed * fade), 10),
          green: parseInt(Math.floor(color1.green + diffGreen * fade), 10),
          blue: parseInt(Math.floor(color1.blue + diffBlue * fade), 10),
      };

      return `rgb(${gradient.red}, ${gradient.green}, ${gradient.blue})`;
  }

  // Obtener un color de degradado basado en el progreso
  static getProgressGradientColor(progress) {
      let color1 = { red: 46, green: 204, blue: 113 };
      let color2 = { red: 241, green: 196, blue: 15 };
      let color3 = { red: 231, green: 76, blue: 60 };

      return this.pickGradientFadeColor(progress / 100, color1, color2, color3);
  }

  // Generar un UUID v4
  // Generar un UUID v4 sin usar la librería crypto
  static uuidv4() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
          let r = Math.random() * 16 | 0; // Generar un número aleatorio entre 0 y 15
          let v = c === "x" ? r : (r & 0x3 | 0x8); // Usar 4 para la posición fija de versión y ajustar los bits de "y"
          return v.toString(16); // Convertir a hexadecimal
      });
  }


  // Obtener el nombre del archivo desde una ruta
  static pathFilename(path) {
      let rgx = /\\|\//gm;
      let spl = path.split(rgx);
      return spl[spl.length - 1];
  }

  // Obtener la extensión de un archivo desde una ruta
  static pathExt(path) {
      let spl = path.split(".");
      return spl[spl.length - 1];
  }

  // Hacer que los enlaces en un texto sean clicables
  static linkify(inputText) {
      let replacedText;
      let replacePattern1, replacePattern2, replacePattern3;

      // URLs que comienzan con http://, https:// o ftp://
      replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
      replacedText = inputText.replace(
          replacePattern1,
          '<a href="$1" target="_blank">$1</a>'
      );

      // URLs que comienzan con "www." (sin // delante)
      replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
      replacedText = replacedText.replace(
          replacePattern2,
          '$1<a href="http://$2" target="_blank">$2</a>'
      );

      // Convertir direcciones de correo electrónico en enlaces mailto
      replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
      replacedText = replacedText.replace(
          replacePattern3,
          '<a href="mailto:$1">$1</a>'
      );

      return replacedText;
  }
}
