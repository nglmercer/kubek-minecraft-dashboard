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
        let consoleTextElem = $("#console-text")
        if (consoleTextElem.length !== 0) {
            KubekServers.getServerLog(selectedServer, (serverLog) => {
                let parsedServerLog = serverLog.split(/\r?\n/);
                if(previousConsoleUpdateLength === serverLog.length){
                    return;
                }
                previousConsoleUpdateLength = serverLog.length;
                $(consoleTextElem).html("");
                parsedServerLog.forEach(function (line) {
                    let html_text = "";
                    let parsedText = ANSIParse(KubekUtils.linkify(mineParse(line).raw));
                    if (parsedText.length > 1) {
                        let joinedLine = "";
                        // Некоторая магия парсинга
                        parsedText.forEach((item) => {
                            let resultText = "<span style='";
                            if (typeof item.bold !== "undefined" && item.bold === true) {
                                resultText += "font-weight:bold;"
                            }
                            if (typeof item.foreground !== "undefined" && item.bold === true) {
                                resultText += "color:" + item.foreground + ";"
                            }
                            resultText += "'>" + item.text + "</span>";
                            joinedLine += resultText;
                        });
                        html_text += joinedLine + "<br>";
                    } else {
                        html_text += parsedText[0].text + "<br>";
                    }

                    // Парсинг timestampов ([00:00:00])

                    let matches;
                    while(matches = timeStampRegexp.exec(html_text)){
                        let startIndex = timeStampRegexp.lastIndex - matches[0].length;
                        let endIndex = timeStampRegexp.lastIndex;

                        let cutTimestamp = html_text.substring(startIndex, endIndex);
                        let resTimestamp = "<span style='color: var(--bg-dark-accent-lighter);'>" + cutTimestamp + "</span>";
                        html_text = resTimestamp + html_text.substring(endIndex);
                    }
                    $(consoleTextElem).html($(consoleTextElem).html() + html_text);
                });
                // Если это первое обновление консоли - прокручиваем консоль до конца
                let scrollHeight = consoleTextElem[0].scrollHeight - Math.round($(".console").height()) - 24; // SOME STUPID MATH
                if (isItFirstLogRefresh === false) {
                    isItFirstLogRefresh = true;
                    consoleTextElem.scrollTop(scrollHeight);
                } else {
                    if ((scrollHeight - consoleTextElem.scrollTop()) < 200) {
                        consoleTextElem.scrollTop(scrollHeight);
                    }
                }
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
class KubekRefresherComponent extends HTMLElement {
    constructor() {
        super();
        this.refreshIntervals = {};
        this.isItFirstLogRefresh = false;
        this.previousConsoleUpdateLength = 0;
        this.timeStampRegexp = /\[[0-9]{2}\:[0-9]{2}\:[0-9]{2}\]/gm;
    }

    // Método para añadir un intervalo de refresco
    addRefreshInterval(interval, handler, name) {
        this.refreshIntervals[name] = setInterval(handler, interval);
    }

    // Método para eliminar un intervalo de refresco
    removeRefreshInterval(name) {
        clearInterval(this.refreshIntervals[name]);
    }

    // Método para añadir el intervalo de refresco del encabezado del servidor
    addRefreshServerHeaderInterval() {
        this.addRefreshInterval(1500, () => {
            KubekServerHeaderUI.refreshServerHeader(() => {});
        }, "serverHeader");
    }

    // Método para añadir el intervalo de refresco del log del servidor
    addRefreshServerLogInterval() {
        this.addRefreshInterval(650, () => {
            this.refreshConsoleLog();
        }, "serverConsole");
    }

    // Método para añadir el intervalo de refresco del uso de recursos
    addRefreshUsageInterval() {
        this.addRefreshInterval(5000, () => {
            if (typeof KubekConsoleUI !== "undefined") {
                KubekHardware.getUsage((usage) => {
                    KubekConsoleUI.refreshUsageItems(usage.cpu, usage.ram.percent, usage.ram);
                });
            }
        }, "usage");
    }

    // Método para refrescar el log de la consola
    refreshConsoleLog() {
        let consoleTextElem = this.querySelector("#console-text");
        if (consoleTextElem) {
            KubekServers.getServerLog(selectedServer, (serverLog) => {
                let parsedServerLog = serverLog.split(/\r?\n/);
                if (this.previousConsoleUpdateLength === serverLog.length) {
                    return;
                }
                this.previousConsoleUpdateLength = serverLog.length;
                consoleTextElem.innerHTML = "";
                parsedServerLog.forEach((line) => {
                    let html_text = "";
                    let parsedText = ANSIParse(KubekUtils.linkify(mineParse(line).raw));
                    if (parsedText.length > 1) {
                        let joinedLine = "";
                        parsedText.forEach((item) => {
                            let resultText = "<span style='";
                            if (typeof item.bold !== "undefined" && item.bold === true) {
                                resultText += "font-weight:bold;";
                            }
                            if (typeof item.foreground !== "undefined" && item.bold === true) {
                                resultText += "color:" + item.foreground + ";";
                            }
                            resultText += "'>" + item.text + "</span>";
                            joinedLine += resultText;
                        });
                        html_text += joinedLine + "<br>";
                    } else {
                        html_text += parsedText[0].text + "<br>";
                    }

                    let matches;
                    while ((matches = this.timeStampRegexp.exec(html_text)) !== null) {
                        let startIndex = this.timeStampRegexp.lastIndex - matches[0].length;
                        let endIndex = this.timeStampRegexp.lastIndex;

                        let cutTimestamp = html_text.substring(startIndex, endIndex);
                        let resTimestamp = "<span style='color: var(--bg-dark-accent-lighter);'>" + cutTimestamp + "</span>";
                        html_text = resTimestamp + html_text.substring(endIndex);
                    }
                    consoleTextElem.innerHTML += html_text;
                });

                let scrollHeight = consoleTextElem.scrollHeight - Math.round(consoleTextElem.clientHeight) - 24;
                if (!this.isItFirstLogRefresh) {
                    this.isItFirstLogRefresh = true;
                    consoleTextElem.scrollTop = scrollHeight;
                } else {
                    if ((scrollHeight - consoleTextElem.scrollTop) < 200) {
                        consoleTextElem.scrollTop = scrollHeight;
                    }
                }
            });
        }
    }

    // Método para añadir el intervalo de refresco de la lista de tareas
    addRefreshTasksInterval() {
        this.addRefreshInterval(500, () => {
            KubekTasksUI.refreshTasksList();
        }, "tasksList");
    }
}

// Definir el nuevo elemento personalizado
customElements.define('kubek-refresher', KubekRefresherComponent);
/* setTimeout(() => {
    const kubekRefresher = document.querySelector('kubek-refresher');

// Iniciar los intervalos de refresco
kubekRefresher.addRefreshServerHeaderInterval();
kubekRefresher.addRefreshServerLogInterval();
kubekRefresher.addRefreshUsageInterval();
kubekRefresher.addRefreshTasksInterval();
}, 1000); */