let refreshIntervals = {};
let isItFirstLogRefresh = false;
let previousConsoleUpdateLength = 0;
let timeStampRegexp = /\[[0-9]{2}\:[0-9]{2}\:[0-9]{2}\]/gm;

class KubekRefresher {
    // Добавить рефреш-интервал
    static addRefreshInterval = (interval, handler, name) => {
        refreshIntervals[name] = setInterval(handler, interval);
    }

    // Удалить рефреш-интервал
    static removeRefreshInterval = (name) => {
        clearInterval(refreshIntervals[name]);
    }

    // Добавить интервал обновления server header (каждые 2 секунды)
    static addRefreshServerHeaderInterval = () => {
        this.addRefreshInterval(1500, () => {
            KubekServerHeaderUI.refreshServerHeader(() => {
            });
        }, "serverHeader");
    };

    // Добавить интервал обновления server log (каждые 650 мсек)
    static addRefreshServerLogInterval = () => {
        this.addRefreshInterval(650, () => {
            this.refreshConsoleLog();
        }, "serverConsole");
    };

    // Добавить интервал обновления использования рес-ов (каждые 4 сек)
    static addRefreshUsageInterval = () => {
        this.addRefreshInterval(5000, () => {
            if (typeof KubekConsoleUI !== "undefined") {
                KubekHardware.getUsage((usage) => {
                    KubekConsoleUI.refreshUsageItems(usage.cpu, usage.ram.percent, usage.ram);
                });
            }
        }, "usage");
    }

    // Обновить текст в консоли
    static refreshConsoleLog = () => {
        let consoleTextElem = document.querySelector('game-console');
        if (consoleTextElem) {
            //console.log("consoleTextElem", consoleTextElem, typeof consoleTextElem);
            KubekServers.getServerLog(selectedServer, (serverLog) => {
                //console.log("getServerLog", selectedServer, {serverLog});
                consoleTextElem.refreshConsoleLog(serverLog);
            });
        }
    }

    // Интервал обновления списка задач
    static addRefreshTasksInterval = () => {
        this.addRefreshInterval(500, () => {
            KubekTasksUI.refreshTasksList();
        }, "tasksList");
    }
}

class GameConsole extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.obfuscators = {};
        this.alreadyParsed = [];
        this.currId = 0;
        this.isItFirstLogRefresh = false;
        this.previousConsoleUpdateLength = 0;
        
        // Estilos para códigos Minecraft
        this.styleMap = {
            '§0': 'color:#000000',
            '§1': 'color:#0000AA',
            '§2': 'color:#00AA00',
            '§3': 'color:#00AAAA',
            '§4': 'color:#AA0000',
            '§5': 'color:#AA00AA',
            '§6': 'color:#FFAA00',
            '§7': 'color:#AAAAAA',
            '§8': 'color:#555555',
            '§9': 'color:#5555FF',
            '§a': 'color:#55FF55',
            '§b': 'color:#55FFFF',
            '§c': 'color:#FF5555',
            '§d': 'color:#FF55FF',
            '§e': 'color:#FFFF55',
            '§f': 'color:#FFFFFF',
            '§l': 'font-weight:bold',
            '§m': 'text-decoration:line-through',
            '§n': 'text-decoration:underline',
            '§o': 'font-style:italic'
        };
    }

    connectedCallback() {
        this.render();
    }

    getStyles() {
        return `
            .console-layout {
                width: 100%;
                height: 100%;
                min-height: 300px;
                background: var(--bg-darker);
                border-radius: 8px;
                box-sizing: border-box;
            }

            .console {
                width: 100%;
                height: 100%;
                max-height: 500px;
                overflow-y: auto;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 14px;
                line-height: 1.5;
                color: var(--text-primary);
                padding-right: 8px;
                scroll-behavior: smooth;
            }

            .console::-webkit-scrollbar {
                width: 8px;
            }

            .console::-webkit-scrollbar-track {
                background: var(--bg-darker);
                border-radius: 4px;
            }

            .console::-webkit-scrollbar-thumb {
                background: var(--bg-dark-accent);
                border-radius: 4px;
            }

            .console::-webkit-scrollbar-thumb:hover {
                background: var(--bg-dark-accent-lighter);
            }`;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="console-layout">
                <div class="console" id="console-text"></div>
            </div>
        `;
    }

    // Minecraft Parser Implementation
    obfuscate(elem, string) {
        const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        
        const replaceRand = (str, i) => {
            const randChar = String.fromCharCode(randInt(64, 95));
            return str.substr(0, i) + randChar + str.substr(i + 1, str.length);
        };

        const initMagic = (el, str) => {
            let i = 0;
            const obsStr = str || el.innerHTML;
            const strLen = obsStr.length;
            
            if (!strLen) return;
            
            if (!this.obfuscators[this.currId]) {
                this.obfuscators[this.currId] = [];
            }

            this.obfuscators[this.currId].push(
                window.setInterval(() => {
                    if (i >= strLen) i = 0;
                    let newStr = replaceRand(obsStr, i);
                    el.innerHTML = newStr;
                    i++;
                }, 0)
            );
        };

        if (string.indexOf('<br>') > -1) {
            elem.innerHTML = string;
            const listLen = elem.childNodes.length;
            
            for (let nodeI = 0; nodeI < listLen; nodeI++) {
                const currNode = elem.childNodes[nodeI];
                if (currNode.nodeType === 3) {
                    const multiMagic = document.createElement('span');
                    multiMagic.innerHTML = currNode.nodeValue;
                    elem.replaceChild(multiMagic, currNode);
                    initMagic(multiMagic);
                }
            }
        } else {
            initMagic(elem, string);
        }
    }

    applyCode(string, codes) {
        const elem = document.createElement('span');
        let obfuscated = false;

        string = string.replace(/\x00/g, '');

        codes.forEach(code => {
            if (this.styleMap[code]) {
                elem.style.cssText += this.styleMap[code] + ';';
            }
            if (code === '§k') {
                this.obfuscate(elem, string);
                obfuscated = true;
            }
        });

        if (!obfuscated) {
            elem.innerHTML = string;
        }

        return elem;
    }

    mineParse(string) {
        const finalPre = document.createElement('pre');
        const codes = string.match(/§.{1}/g) || [];
        const indexes = [];
        let apply = [];

        if (!this.obfuscators[this.currId]) {
            this.obfuscators[this.currId] = [];
        }

        string = string.replace(/\n|\\n/g, '<br>');

        // Get indexes of all codes
        codes.forEach((code, i) => {
            indexes.push(string.indexOf(code));
            string = string.replace(code, '\x00\x00');
        });

        // Handle text before first code
        if (indexes[0] !== 0) {
            finalPre.appendChild(this.applyCode(string.substring(0, indexes[0]), []));
        }

        // Process codes and text
        for (let i = 0; i < codes.length; i++) {
            let indexDelta = indexes[i + 1] - indexes[i];
            
            if (indexDelta === 2) {
                while (indexDelta === 2) {
                    apply.push(codes[i]);
                    i++;
                    indexDelta = indexes[i + 1] - indexes[i];
                }
                apply.push(codes[i]);
            } else {
                apply.push(codes[i]);
            }

            if (apply.lastIndexOf('§r') > -1) {
                apply = apply.slice(apply.lastIndexOf('§r') + 1);
            }

            const strSlice = string.substring(indexes[i], indexes[i + 1]);
            finalPre.appendChild(this.applyCode(strSlice, apply));
        }

        this.alreadyParsed.push(finalPre);
        this.currId++;

        return {
            parsed: finalPre,
            raw: finalPre.innerHTML
        };
    }

    clearObfuscators(id) {
        if (this.obfuscators[id]) {
            this.obfuscators[id].forEach(interval => {
                clearInterval(interval);
            });
            this.alreadyParsed[id] = [];
            this.obfuscators[id] = [];
        }
    }

    refreshConsoleLog(serverLog) {
        const consoleTextElem = this.shadowRoot.querySelector('#console-text');
        if (!consoleTextElem) return;

        if (serverLog.length === this.previousConsoleUpdateLength) {
            return;
        }

        this.previousConsoleUpdateLength = serverLog.length;
        const parsedServerLog = serverLog.split(/\r?\n/);
        consoleTextElem.innerHTML = '';

        parsedServerLog.forEach(line => {
            let html_text = '';
            const parsedText = this.parseANSI(this.linkify(this.mineParse(line).raw));

            if (parsedText.length > 1) {
                let joinedLine = '';
                parsedText.forEach(item => {
                    let resultText = "<span style='";
                    if (item.bold) {
                        resultText += "font-weight:bold;";
                    }
                    if (item.foreground && item.bold) {
                        resultText += `color:${item.foreground};`;
                    }
                    resultText += `'>${item.text}</span>`;
                    joinedLine += resultText;
                });
                html_text += joinedLine + '<br>';
            } else {
                html_text += parsedText[0].text + '<br>';
            }

            consoleTextElem.innerHTML += html_text;
        });

        // Handle scrolling
        const scrollHeight = consoleTextElem.scrollHeight - Math.round(consoleTextElem.clientHeight) - 24;
        if (!this.isItFirstLogRefresh) {
            this.isItFirstLogRefresh = true;
            consoleTextElem.scrollTop = scrollHeight;
        } else if ((scrollHeight - consoleTextElem.scrollTop) < 200) {
            consoleTextElem.scrollTop = scrollHeight;
        }
    }

    parseANSI(text) {
        // Implementación básica - puedes expandirla según tus necesidades
        return [{ text, bold: false }];
    }

    linkify(text) {
        // Implementación básica - puedes expandirla según tus necesidades
        return text;
    }
}

// Registrar el componente
customElements.define('game-console', GameConsole);
class inputCommand extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    getstyles() {
        return `
        :host {
        width: 100%;
        border-radius: 8px;
        box-sizing: border-box;
        border: 1px solid #333;
        font-family: 'Material Symbols Rounded';
        }
.material-symbols-outlined {
  font-variation-settings:
  'FILL' 0,
  'wght' 400,
  'GRAD' 0,
  'opsz' 24
}
.input {
    display: flex;
    gap: 8px;
    width: 100%;
    padding: 8px;
    background: var(--bg-darker);
    border-radius: 8px;
    box-sizing: border-box;
}

#cmd-input {
    flex: 1;
    background: var(--bg-dark);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 8px 12px;
    color: var(--text-primary);
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s ease;
}

#cmd-input:focus {
    border-color: var(--primary-color);
}

#cmd-input::placeholder {
    color: var(--text-secondary);
}

.dark-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-dark);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 8px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.dark-btn:hover {
    background: var(--bg-dark-accent);
    border-color: var(--primary-color);
}

.dark-btn .material-symbols-rounded {
    font-size: 20px;
}

.icon-only {
    width: 36px;
    height: 36px;
    padding: 0;
}`;
    }
    render() {
        this.shadowRoot.innerHTML = `
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
        <style>${this.getstyles()}</style>
        <div class="input">
            <input type="text" id="cmd-input" placeholder="Enter command"/>
            <button class="dark-btn icon-only">
                <span class="material-symbols-outlined">
                send
                </span>
            </button>
        </div>
        `;
    }
    setupEventListeners() {
        const button = this.shadowRoot.querySelector('button');
        const input = this.shadowRoot.querySelector('#cmd-input');

        button.addEventListener('click', () => {
            this.sendCommand();
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendCommand();
            }
        });
    }
    
    sendCommand() {
        const input = this.shadowRoot.querySelector('#cmd-input');
        const command = input.value;
        if (command) {
            // Dispatch custom event for command sending
            this.dispatchEvent(new CustomEvent('command', {
                detail: { command },
                bubbles: true,
                composed: true
            }));
            input.value = '';
        }
    }
}
customElements.define('input-command', inputCommand);
