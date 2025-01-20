class KubekUI {
    // Загрузить секцию в блок
    static loadSection = (name, container = "body", cb = () => {
    }) => {
        $.get("/sections/" + name + ".html", (code) => {
            $(container).append(code);
            cb();
        });
    }

    // Управление прелоудером
    static showPreloader() {
        $("body #main-preloader").show();
        animateCSSJ("body #main-preloader", "fadeIn").then(() => {
        });
    }

    static hidePreloader() {
        animateCSSJ("body #main-preloader", "fadeOut").then(() => {
            $("body #main-preloader").hide();
        });
    }

    static setActiveItemByPage(page) {
        document.querySelectorAll("#main-menu-sidebar .sidebar-item").forEach(item => {
            if (item.dataset.page === page) {
                item.classList.add("active");
            }
        });
    }

    static setAllSidebarItemsUnactive() {
        document.querySelectorAll("#main-menu-sidebar .sidebar-item").forEach(item => {
            item.classList.remove("active");
        });
    }

    static changeItemByPage = (page) => {
        this.setAllSidebarItemsUnactive();
        this.setActiveItemByPage(page);
    }

    // Load the selected server
    static loadSelectedServer = () => {
        if (typeof window.localStorage.selectedServer !== "undefined") {
            selectedServer = window.localStorage.selectedServer;
            KubekServerHeaderUI.loadServerByName(selectedServer, (result) => {
                if (result === false) {
                    KubekServers.getServersList((list) => {
                        window.localStorage.selectedServer = list[0];
                        window.location.reload();
                    });
                }
            });
        } else {
            // Если это первый запуск
            KubekServers.getServersList((list) => {
                window.localStorage.selectedServer = list[0];
                window.location.reload();
            });
        }
    }

    // Load the list of servers
    static loadServersList() {
        const sidebar = document.querySelector("#servers-list-sidebar");
        if (sidebar) {
            sidebar.querySelectorAll(".server-item").forEach(item => item.remove());
            KubekServers.getServersList(servers => {
                servers.forEach(serverItem => {
                    const isActive = serverItem === localStorage.selectedServer ? " active" : "";
                    const serverElement = document.createElement("div");
                    serverElement.className = `server-item sidebar-item${isActive}`;
                    serverElement.onclick = () => {
                        localStorage.selectedServer = serverItem;
                        location.reload();
                    };
                    serverElement.innerHTML = `
                        <div class="icon-circle-bg">
                            <img style="width: 24px; height: 24px;" alt="${serverItem}" src="/api/servers/${serverItem}/icon">
                        </div>
                        <span>${serverItem}</span>
                    `;
                    sidebar.appendChild(serverElement);
                });
            });
        }
    }

    // Handle connection lost
    static connectionLost() {
        KubekAlerts.addAlert("{{commons.connectionLost}}", "warning", moment().format("DD.MM / HH:MM:SS"), 6000);
        this.showPreloader();
    }

    // Handle connection restored
    static connectionRestored() {
        KubekAlerts.addAlert("{{commons.connectionRestored}}", "check", moment().format("DD.MM / HH:MM:SS"), 3000);
        setTimeout(() => {
            location.reload();
        }, 1000);
    }

    // Toggle sidebar for mobile mode
    static toggleSidebar() {
        const sidebar = document.querySelector(".main-layout .sidebar");
        const blurScreen = document.querySelector(".blurScreen");

        if (window.matchMedia("(max-width: 1360px)").matches && sidebar) {
            if (sidebar.classList.contains("minimized")) {
                sidebar.classList.remove("minimized");
                if (blurScreen) blurScreen.style.display = "block";
            } else {
                sidebar.classList.add("minimized");
                if (blurScreen) blurScreen.style.display = "none";
            }
        }
    }

    // Set the document title
    static setTitle(title) {
        document.title = title;
    }
}

const animateCSSJ = (element, animation, fast = true, prefix = "animate__") => {
    return new Promise((resolve) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        if (fast) {
            node.classList.add(`${prefix}animated`, animationName, `${prefix}faster`);
        } else {
            node.classList.add(`${prefix}animated`, animationName);
        }

        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName, `${prefix}faster`);
            resolve("Animation ended");
        }

        node.addEventListener("animationend", handleAnimationEnd, { once: true });
    });
};

