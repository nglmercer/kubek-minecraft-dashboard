/* // init logs
var uiDebugger = DebuggerGroupManager.create('UI');   
 uiDebugger.registerCallSite('kukeb-ui.js', 0).stack
class KubekUI {
    // Cargar sección en bloque - Reemplazamos $.get por fetch
    static loadSection = (name, container = "body", cb = () => {}) => {
     fetch(`/sections/${name}.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(code => {
                console.log("Loading section:", name, container);
                //$(container).append(code);
                document.querySelector(container).insertAdjacentHTML('beforeend', code);

                //container.appendChild(code);
                //document.querySelector(container).appendChild(code);
                cb();
            })
            .catch(error => {
                console.error('Error loading section:', error);
            }); 
    }

    static showPreloader() {
        const preloader = document.querySelector("body #main-preloader");
        if (preloader) {
            preloader.style.display = "block";
            animateCSSJ("body #main-preloader", "fadeIn");
        }
    }

    static hidePreloader() {
        const preloader = document.querySelector("body #main-preloader");
        if (preloader) {
            animateCSSJ("body #main-preloader", "fadeOut").then(() => {
                preloader.style.display = "none";
            });
        }
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

    static loadSelectedServer = () => {
        if (typeof window.localStorage.selectedServer !== "undefined") {
            selectedServer = window.localStorage.selectedServer;
            KubekServerHeaderUI.loadServerByName(selectedServer, (result) => {
                uiDebugger.log('loadSelectedServer, loadServerByName',selectedServer, result);
                if (result === false) {
                    KubekServers.getServersList((list) => {
                        window.localStorage.selectedServer = list[0];
                        uiDebugger.log('loadSelectedServer, getServersList',selectedServer, list);
                        window.location.reload();
                    });
                }
            });
        } else {
            KubekServers.getServersList((list) => {
                uiDebugger.log('loadSelectedServer, getServersList',selectedServer, list);
                window.localStorage.selectedServer = list[0];
                window.location.reload();
            });
        }
    }

    static loadServersList() {
            KubekServers.getServersList(servers => {
                const allserver = [];
                if (!servers) return;
                console.log("servers getServersList", servers);
                servers.forEach(serverItem => {
                    const sidebar = document.querySelector('sidebar-menu');
                    const parsedserver = {
                        title: serverItem,
                        icon: `/api/servers/${serverItem}/icon`
                    }
                    allserver.push(parsedserver);
                    sidebar.setServersList(allserver);
                    uiDebugger.log('loadServersList, getServersList',serverItem, servers);
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

    static connectionLost() {
        KubekAlerts.addAlert("{{commons.connectionLost}}", "warning", moment().format("DD.MM / HH:MM:SS"), 6000);
        this.showPreloader();
    }

    static connectionRestored() {
        KubekAlerts.addAlert("{{commons.connectionRestored}}", "check", moment().format("DD.MM / HH:MM:SS"), 3000);
        setTimeout(() => {
            location.reload();
        }, 1000);
    }

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
}; */