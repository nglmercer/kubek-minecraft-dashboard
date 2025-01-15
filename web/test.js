let refreshIntervals = {};
let isItFirstLogRefresh = false;
let previousConsoleUpdateLength = 0;
let timeStampRegexp = /\[[0-9]{2}\:[0-9]{2}\:[0-9]{2}\]/gm;
class GameConsole extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }
    getstyles() {
        return `.console-layout {
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
        <style>${this.getstyles()}</style>
        <div class="console-layout">
            <div class="console" id="console-text"></div>
        </div>
        `;
    }
    
    refreshConsoleLog(serverLog) {
        const consoleTextElem = this.shadowRoot.querySelector('#console-text');
        if (!consoleTextElem) return;

        if (serverLog.length === previousConsoleUpdateLength) {
            return;
        }

        previousConsoleUpdateLength = serverLog.length;
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

            // Parse timestamps
            let matches;
            while (matches = timeStampRegexp.exec(html_text)) {
                const startIndex = timeStampRegexp.lastIndex - matches[0].length;
                const endIndex = timeStampRegexp.lastIndex;
                const cutTimestamp = html_text.substring(startIndex, endIndex);
                const resTimestamp = `<span style='color: var(--bg-dark-accent-lighter);'>${cutTimestamp}</span>`;
                html_text = resTimestamp + html_text.substring(endIndex);
            }

            consoleTextElem.innerHTML += html_text;
        });

        // Handle scrolling
        const scrollHeight = consoleTextElem.scrollHeight - Math.round(consoleTextElem.clientHeight) - 24;
        if (!isItFirstLogRefresh) {
            isItFirstLogRefresh = true;
            consoleTextElem.scrollTop = scrollHeight;
        } else if ((scrollHeight - consoleTextElem.scrollTop) < 200) {
            consoleTextElem.scrollTop = scrollHeight;
        }
    }

    // Utility methods (you'll need to implement these based on your needs)
    parseANSI(text) {
        // Implement your ANSI parsing logic here
        return [{ text, bold: false }];
    }

    linkify(text) {
        // Implement your link parsing logic here
        return text;
    }

    mineParse(text) {
        // Implement your minecraft text parsing logic here
        return { raw: text };
    }
}

// Register the custom element
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
        return `.input {
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
        <style>${this.getstyles()}</style>
        <div class="input">
            <input type="text" id="cmd-input" placeholder="Enter command"/>
            <button class="dark-btn icon-only">
                <span class="material-symbols-rounded">send</span>
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
