let currentServerStatus = KubekPredefined.SERVER_STATUSES.STOPPED;

class KubekServerHeaderUI {
    // Обновить хидер сервера
    static refreshServerHeader = (cb) => {
        this.loadServerByName(selectedServer, cb);
    }

    // Загрузить сервер в хидер по названию
    static loadServerByName = (server, cb = () => {
    }) => {
        KubekServers.getServerInfo(server, (data) => {
            if (data.status !== false) {
                $(".content-header > .caption").text(server);
                this.setServerStatus(data.status);
                $(".content-header .icon-bg img").attr(
                    "src",
                    "/api/servers/" + server + "/icon?" + Date.now()
                );
                cb(true);
            } else {
                cb(false);
            }
        });
    }

    // Установить статус сервера в хидер
    static setServerStatus = (status) => {
        const statusElement = document.querySelector('status-element');
        if (typeof KubekPredefined.SERVER_STATUSES_TRANSLATE[status] !== "undefined") {
            currentServerStatus = status;
            console.log("status", status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
            $(".content-header .status .text").text(KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
            $(".content-header .status .circle").removeClass("red yellow green");
            $(".content-header .hide-on-change").hide();
            $(".content-header #server-more-btn").hide();
            if (status === KubekPredefined.SERVER_STATUSES.STARTING || status === KubekPredefined.SERVER_STATUSES.STOPPING) {
                $(".content-header .status .circle").addClass("yellow");
                $(".content-header #server-more-btn").show();
                statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
            } else if (status === KubekPredefined.SERVER_STATUSES.RUNNING) {
                $(".content-header .status .circle").addClass("green");
                $(".content-header #server-restart-btn").show();
                $(".content-header #server-stop-btn").show();
                $(".content-header #server-more-btn").show();
                statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
                console.log("status", status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
            } else if (status === KubekPredefined.SERVER_STATUSES.STOPPED) {
                $(".content-header .status .circle").addClass("red");
                $(".content-header #server-start-btn").show();
                statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
            }
        } else {
            return false;
        }
        return true;
    }

}
function initializedrodownload() {
    const buttonevent = document.querySelector('#server-more-btn');
    buttonevent.addEventListener('click', () => {
        const popup = document.querySelector('custom-popup');
        popup.showAtElement(buttonevent);
    });
    const popup = document.querySelector('custom-popup');
    const onhoverstylecolor = `
        <style>
            .div {
                background: var(--bg-dark-accent);
                border-radius: 8px;
                padding: 4px 8px;
            }
            .div:hover {
                background: #2e3e53;
            }
        </style>
    `;

    popup.addButton(`${onhoverstylecolor} <div style=" display: flex ; flex-direction: row; align-items: center; cursor: pointer; height: 48px; font-size: 12pt; width: 100%;" class="div"><span class="material-symbols-rounded">dangerous</span><span class="default-font">Forzar salida</span></div>`, () => {
        console.log('Button clicked');
        popup.hide();
        if (currentServerStatus !== KubekPredefined.SERVER_STATUSES.STOPPED) {
            KubekRequests.get("/servers/" + selectedServer + "/kill");
        }
    });
}
setTimeout(() => {
    initializedrodownload();
}, 500);