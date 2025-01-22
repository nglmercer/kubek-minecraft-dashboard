class KubekPredefined {
    // Права
    static PERMISSIONS = {
        DEFAULT: "default",
        ACCOUNTS: "accounts",
        FILE_MANAGER: "file_manager",
        MANAGE_SERVERS: "manage_servers",
        MAKING_SERVERS: "making_servers",
        MONITOR_SERVERS: "monitor_servers",
        MANAGE_JAVA: "manage_java",
        MANAGE_PLUGINS: "manage_plugins"
    };

    // См. название :)
    static API_ENDPOINT = "/api";

    // Переводы статусов серверов
    static SERVER_STATUSES_TRANSLATE = {
        "stopped": "{{serverStatus.stopped}}",
        "starting": "{{serverStatus.starting}}",
        "stopping": "{{serverStatus.stopping}}",
        "running": "{{serverStatus.running}}"
    }

    // Статусы серверов
    static SERVER_STATUSES = {
        STOPPED: "stopped",
        RUNNING: "running",
        STARTING: "starting",
        STOPPING: "stopping"
    }

    // Базовые типы задач
    static TASKS_TYPES = {
        DOWNLOADING: "downloading",
        INSTALLING: "installing",
        ZIPPING: "zipping",
        UNPACKING: "unpacking",
        UPDATING: "updating",
        RESTARTING: "restarting",
        CREATING: "creating",
        DELETION: "deletion",
        COMMON: "common",
        UNKNOWN: "unknown"
    }

    // Шаги создания сервера
    static SERVER_CREATION_STEPS = {
        SEARCHING_CORE: "searchingCore",
        CHECKING_JAVA: "checkingJava",
        DOWNLOADING_JAVA: "downloadingJava",
        UNPACKING_JAVA: "unpackingJava",
        DOWNLOADING_CORE: "downloadingCore",
        CREATING_BAT: "creatingBat",
        COMPLETION: "completion",
        COMPLETED: "completed",
        FAILED: "failed",
    }

    // REGEX для авторизации
    static PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,64}$/g;
    static LOGIN_REGEX = /^[a-zA-Z0-9_.-]{3,16}$/g;
    static EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;

    static MODAL_CANCEL_BTN = '<button class="dark-btn" onclick="KubekNotifyModal.destroyAllModals()">{{commons.close}}</button>';
}
const NOTIFY_MODAL_TEMPLATE = `
    <div class="notify-modal modal-bg" id="{id}">
        <div class="notify-window">
            <div class="notify-icon">{icon}</div>
            <div class="notify-caption">{caption}</div>
            <div class="notify-description">{description}</div>
            <button id="cmbtn-{id}" class="primary-btn">{buttonText}</button>
            {additionalElements}
        </div>
    </div>
`;
//3
const getNotify_modal_template = (parseddata) =>  {
    const {id,icon,caption,description,buttonText,additionalElements} = parseddata;
    const modal = document.createElement('div');
    modal.className = "notify-modal modal-bg";
    modal.id = id;

    const notify_window = document.createElement('div');
    notify_window.className = "notify-window";

    const notify_icon = document.createElement('div');
    notify_icon.className = "notify-icon";
    notify_icon.innerHTML = icon;

    const notify_caption = document.createElement('div');
    notify_caption.className = "notify-caption";
    notify_caption.innerHTML = caption;

    const notify_description = document.createElement('div');
    notify_description.className = "notify-description";
    notify_description.innerHTML = description;

    const cmbtn = document.createElement('button');
    cmbtn.id = `${id}`;
    cmbtn.className = "primary-btn";
    cmbtn.innerHTML = buttonText;
    notify_window.appendChild(notify_icon);
    notify_window.appendChild(notify_caption);
    notify_window.appendChild(notify_description);
    notify_window.appendChild(cmbtn);
    notify_window.appendChild(additionalElements);
    modal.appendChild(notify_window);
    return modal;
}
class KubekNotifyModal {
    /**
     * Crear una ventana modal de notificación
     * @param {string} caption - El título de la notificación
     * @param {string} text - La descripción del mensaje
     * @param {string} buttonText - El texto del botón principal
     * @param {string} icon - El icono que se mostrará
     * @param {Function} cb - Callback a ejecutar al cerrar la ventana
     * @param {string} additionalElements - Elementos adicionales que se agregarán
     */
    static create(caption, text, buttonText, icon, cb = () => {}, additionalElements = "") {
        // Mostrar pantalla difuminada
        const blurScreen = document.querySelector(".blurScreen");
        if (blurScreen) blurScreen.style.display = "block";

        const randomID = `notify-${Math.floor(Math.random() * 991) + 10}`;
        const iconElement = `<span class='material-symbols-rounded'>${icon}</span>`;
        const parseddata = {
            id: randomID,
            icon: iconElement,
            caption: caption,
            description: text,
            buttonText: buttonText,
            additionalElements: additionalElements,
        }
        const modalHTML = getNotify_modal_template(parseddata);
        // Insertar el modal en el body
        const modalElement = document.createElement("div");
        modalElement.innerHTML = modalHTML;
        document.body.appendChild(modalElement.firstElementChild);
        const button = document.getElementById(`${id}`);
        console.log("button",button);
        if (button) {
            button.addEventListener("click", () => {
                console.log("button",button);
                animateCSS(`#${id}`, "fadeOut").then(() => {
                    const modal = document.getElementById(id);
                    if (modal) modal.remove();
                });
                if (blurScreen) blurScreen.style.display = "none";
                cb(); 
            })
        }
    }

    /**
     * Eliminar todos los modales de notificación
     */
    static destroyAllModals() {
        const modals = document.querySelectorAll(".notify-modal");
        modals.forEach((modal) => modal.remove());

        const blurScreen = document.querySelector(".blurScreen");
        if (blurScreen) blurScreen.style.display = "none";
    }

    /**
     * Crear un modal solicitando entrada del usuario
     * @param {string} caption - El título del modal
     * @param {string} icon - El icono que se mostrará
     * @param {Function} cb - Callback que recibe el valor ingresado
     * @param {string} description - La descripción del modal
     * @param {string} placeholder - Placeholder del campo de entrada
     * @param {string} value - Valor por defecto en el campo de entrada
     * @param {string} iType - Tipo del campo de entrada (por defecto "text")
     */
    static askForInput(
        caption,
        icon,
        cb = () => {},
        description = "",
        placeholder = "{{commons.input}}",
        value = "",
        iType = "text"
    ) {
        const inputRandID = `input-${Math.floor(Math.random() * 10000)}`;
        const inputField = `
            <p>${description}</p>
            <input 
                style="width: 300px;" 
                id="${inputRandID}" 
                type="${iType}" 
                placeholder="${placeholder}" 
                value="${value}"
            >
        `;
        this.create(
            caption,
            inputField,
            "{{commons.save}}",
            icon,
            () => {
                const inputElement = document.getElementById(inputRandID);
                if (inputElement) cb(inputElement.value);
            },
            KubekPredefined.MODAL_CANCEL_BTN
        );
    }

    /**
     * Animar un elemento usando clases CSS
     * @param {string} selector - Selector del elemento
     * @param {string} animation - Nombre de la animación
     * @returns {Promise} - Promesa que se resuelve al finalizar la animación
     */
    static animateCSS(selector, animation) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (!element) return resolve();

            element.classList.add("animate__animated", `animate__${animation}`);
            element.addEventListener(
                "animationend",
                () => {
                    element.classList.remove("animate__animated", `animate__${animation}`);
                    resolve();
                },
                { once: true }
            );
        });
    }
}


const DROPDOWN_BASE =
    "<div class='dropdown layout-accent-box' id='dropdown-$1' style='left: $2px; top: $3px; z-index: $4;'>$5</div>";
const DROPDOWN_ITEM_BASE =
    "<div class='dropdown-item' data-data='$3'>$2$1</div>";
const DROPDOWN_ITEM_ICON_BASE =
    "<span class='material-symbols-rounded'>$1</span>";

class KubekDropdowns {
    // Функция для добавления нового дропдауна
    static addDropdown(data, posX, posY, zIndex, callback = () => {}) {
        this.removeAllDropdowns();
        let poolElement = document.body;
        let newID = this.generateDropdownID();
        let dropdownItems = "";

        data.forEach((item) => {
            if (typeof item.icon !== "undefined") {
                dropdownItems += DROPDOWN_ITEM_BASE
                    .replaceAll(/\$1/gim, item.text)
                    .replaceAll(
                        /\$2/gim,
                        DROPDOWN_ITEM_ICON_BASE.replace(/\$1/gim, item.icon)
                    )
                    .replaceAll(/\$3/gim, item.data);
            } else {
                dropdownItems += DROPDOWN_ITEM_BASE
                    .replaceAll(/\$1/gim, item.text)
                    .replaceAll(/\$2/gim, "")
                    .replaceAll(/\$3/gim, item.data);
            }
        });

        let dropdownCode = DROPDOWN_BASE
            .replaceAll("$1", newID)
            .replaceAll("$2", posX)
            .replaceAll("$3", posY)
            .replaceAll("$4", zIndex)
            .replaceAll("$5", dropdownItems);

        // Crear y agregar el dropdown al DOM
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = dropdownCode;
        const dropdownElement = tempDiv.firstElementChild;
        poolElement.appendChild(dropdownElement);

        // Agregar eventos a los elementos del dropdown
        const dropdownItemsElements = dropdownElement.querySelectorAll(".dropdown-item");
        dropdownItemsElements.forEach((item) => {
            item.addEventListener("click", () => {
                callback(item.getAttribute("data-data"));
                KubekDropdowns.removeAllDropdowns();
            });
        });
    }

    // Получить ID для нового дропдауна
    static generateDropdownID() {
        return document.querySelectorAll("body .dropdown").length;
    }

    // Удалить все дропдауны
    static removeAllDropdowns() {
        const dropdowns = document.querySelectorAll("body .dropdown");
        dropdowns.forEach((dropdown) => dropdown.remove());
    }
}

$(function () {
    KubekUI.setTitle("Kubek | {{sections.fileManager}}");

    KubekFileManagerUI.refreshDir();
})

KubekFileManagerUI = class {
    // Обновить содержимое папки
    static refreshDir = (saveScroll = true) => {
        KubekFileManager.readDirectory(currentPath, (data) => {
            // Сортируем данные, чтоб папки были сверху
            if (data.length > 0) {
                data = sortToDirsAndFiles(data);
            }
            let bindEvent, scrollData;
            // Для телефона делаем открытие по двойному тапу
            if (
                window.matchMedia("(min-width: 320px)").matches &&
                window.matchMedia("(max-width: 480px)").matches
            ) {
                bindEvent = "click";
            } else {
                bindEvent = "dblclick";
            }
            // Сохраняем скролл, если требуется
            if (saveScroll === true) {
                scrollData = $(".fm-container").scrollTop();
            } else {
                scrollData = 0;
            }
            tableListElement.html("");
            let currentPathSplit = currentPath.split("/");
            currentPathSplit = currentPathSplit.filter((element) => {
                return element !== "";
            });
            // Загружаем путь в breadcrumb
            $("#fm-breadcrumb").html("");
            $("#fm-breadcrumb").append("<span>/</span>");
            $("#fm-breadcrumb").append("<a>" + selectedServer + "</a>");
            if (currentPath !== "/") {
                currentPathSplit.forEach((item) => {
                    $("#fm-breadcrumb").append("<span>/</span>");
                    $("#fm-breadcrumb").append("<a>" + item + "</a>");
                });
            }
            // Биндим эвенты для breadcrumb
            KubekFileManagerUI.bindBreadcrumbClicks();
            if (currentPath !== "/") {
                tableListElement.append(UPPER_DIR_ITEM);
            }
            // Добавляем файлы в список
            data.forEach((file) => {
                let fileName = file.name;
                let filePath = file.path;
                let fileIcon;
                file.type === "file" ? fileIcon = "description" : fileIcon = "folder";
                let modifyDateVanilla = new Date(file.modify);
                let modifyDate = moment(modifyDateVanilla).format("DD.MM.YYYY HH:mm:ss");
                let fileSize = KubekUtils.humanizeFileSize(file.size);
                tableListElement.append(DIR_ITEM_PLACEHOLDER.replaceAll("$0", fileName).replaceAll("$1", filePath).replaceAll("$2", fileIcon).replaceAll("$3", modifyDate).replaceAll("$4", fileSize).replaceAll("$5", file.type))
            })

            // Биндим клики на файлы
            KubekFileManagerUI.bindFMFilesList(bindEvent);

            // Возвраащем значение скролла
            $("#fm-table").scrollTop(scrollData);
        });
    }

    // Бинд кликов на файлы
    static bindFMFilesList(bindEvent) {
        // Event для открытия контекстного меню
        $("#fm-table tbody tr").on("contextmenu", function (e) {
            let fileName = $(e.currentTarget).data("filename");
            let fileType = $(e.currentTarget).data("type");
            let dropdownData = [
                {
                    "icon": "delete",
                    "text": "{{commons.delete}}",
                    "data": "delete:" + currentPath + fileName
                },
                {
                    "icon": "bookmark_manager",
                    "text": "{{commons.rename}}",
                    "data": "rename:" + currentPath + fileName
                },
                {
                    "icon": "download",
                    "text": "{{commons.download}}",
                    "data": "download:" + currentPath + fileName
                }
            ]

            // Если директория - удалить лишнее
            if (fileType === "directory") {
                dropdownData.splice(2, 1);
            }

            KubekDropdowns.addDropdown(dropdownData, e.clientX, e.clientY, 5, (clickResult) => {
                if (typeof clickResult !== "undefined") {
                    let spl = clickResult.split(":");
                    let action = spl[0];
                    let path = spl.slice(1).join("");
                    switch (action) {
                        case "rename":
                            // Переименование файла/папки
                            KubekNotifyModal.askForInput("{{commons.rename}}", "bookmark_manager", (txt) => {
                                KubekFileManager.renameFile(path, txt, () => {
                                    KubekFileManagerUI.refreshDir();
                                })
                            }, "", "{{fileManager.enterName}}", KubekUtils.pathFilename(path), "text");
                            break;
                        case "delete":
                            // Удаление файла/папки
                            KubekNotifyModal.create("{{commons.delete}}", "{{fileManager.areYouWantToDelete}} " + KubekUtils.pathFilename(path), "{{commons.delete}}", "delete", () => {
                                KubekFileManager.delete(path, (result) => {
                                    if (result === false) {
                                        KubekAlerts.addAlert("{{commons.actionFailed}}", "warning", "{{commons.delete}} " + KubekUtils.pathFilename(path), 4000, "colored");
                                    }
                                    KubekFileManagerUI.refreshDir();
                                });
                            }, KubekPredefined.MODAL_CANCEL_BTN);
                            break;
                        case "download":
                            // Скачивание файла
                            KubekFileManager.downloadFile(path, () => {
                            });
                            break;
                    }
                }
            });
            e.preventDefault();
            return false;
        });
        // Event для клика
        $("#fm-table tbody tr").on(bindEvent, function () {
            let fileName = $(this).data("filename");
            let filePath = $(this).data("path");
            let fileType = $(this).data("type");
            // Открываем папку, если это папка :)
            if (fileType === "directory") {
                currentPath = currentPath + fileName + "/";
                KubekFileManagerUI.refreshDir();
            } else if (fileType === "file" && editableExtensions.includes(KubekUtils.pathExt(fileName))) {
                KubekFileManagerUI.editFile(currentPath + fileName);
            }
        });
    }

    // Бинд кликов на breadcrumb
    static bindBreadcrumbClicks() {
        $("#fm-breadcrumb a:not(:last-child)").on("click", function () {
            if ($(this).text() === selectedServer) {
                currentPath = "/";
                KubekFileManagerUI.refreshDir(false);
            } else {
                let path = "";
                let index = $(this).index();
                $("#fm-breadcrumb a:not(:last-child)").each(function (ind) {
                    if (
                        $(this).text() !== selectedServer &&
                        ind <= index
                    ) {
                        path = path + $(this).text() + "/";
                    }
                });
                currentPath = path;
                KubekFileManagerUI.refreshDir(false);
            }
        });
    }

    // Создание новой директории
    static newDirectory = () => {
        KubekNotifyModal.askForInput("{{fileManager.newDirectory}}", "create_new_folder", (txt) => {
            KubekFileManager.newDirectory(currentPath, txt, () => {
                KubekFileManagerUI.refreshDir();
            });
        }, "", "{{commons.input}}", "", "text");
    }

    // ..
    static upperDir = () => {
        currentPath = currentPath.split("/");
        currentPath.pop();
        currentPath.pop();
        currentPath = currentPath.join("/") + "/";
        console.log("currentPath", currentPath);
        KubekFileManagerUI.refreshDir(false);
    };

    // Загрузить файл на сервер
    static uploadFile = () => {
        let inputElement = $("#g-file-input");
        inputElement.trigger("click");
        inputElement.off("change");
        inputElement.on("change", () => {
            let formData = new FormData($("#g-file-form")[0]);
            KubekRequests.post("/fileManager/upload?server=" + selectedServer + "&path=" + currentPath, () => {
                KubekFileManagerUI.refreshDir();
            }, formData);
        });
    }

    // Открыть пустой редактор
    static openEmptyEditor = () => {
        KubekFileManagerUI.closeEditor();
        currentEditorLang = "plaintext";
        $(".blurScreen").show();
        $(".fileEditor").show();
    };

    // Открыть файл на редактирование
    static editFile = (path) => {
        let fileExt = KubekUtils.pathExt(path);
        let language = "plaintext";
        if (fileExt === "xml") {
            language = "xml";
        } else if (fileExt === "yml" || fileExt === "yaml") {
            language = "yaml";
        } else if (fileExt === "css") {
            language = "css";
        } else if (fileExt === "js") {
            language = "javascript";
        } else if (fileExt === "json") {
            language = "json";
        } else if (fileExt === "properties") {
            language = "ini";
        }
        currentEditorLang = language;
        KubekFileManager.readFile(path, (data) => {
            $("#code-edit").text(data);
            KubekFileManagerUI.formatCode(false);
            $(".blurScreen").show();
            $(".fileEditor input").val(KubekUtils.pathFilename(path));
            $(".fileEditor").show();
        });
    };

    // Сохранить файл
    static writeFile() {
        let inputVal = $(".fileEditor input").val();
        if (inputVal === "" || !FILE_NAME_REGEXP.test(inputVal)) {
            return false;
        }
        let path = currentPath + inputVal;
        let data = $("#code-edit").text();
        KubekFileManagerUI.closeEditor();
        currentDataParts = data.match(/[\s\S]{1,500}/g) || [];
        currentChunkWriting = -1;
        KubekFileManager.startChunkWrite(path, (result) => {
            currentChunkID = result;
            console.log("Starting write for", currentChunkID);
            KubekFileManagerUI.writeNextChunk();
        });
        return true;
    }

    // Записать следующий чанк
    static writeNextChunk() {
        currentChunkWriting++;
        if (typeof currentDataParts[currentChunkWriting] !== "undefined") {
            // Если чанки не закончились - записываем
            console.log("Writing chunk", currentChunkWriting, "to ID", currentChunkID);
            KubekFileManager.addChunkWrite(currentChunkID, Base64.encodeURI(currentDataParts[currentChunkWriting]), () => {
                KubekFileManagerUI.writeNextChunk();
            });
        } else {
            // Если закончились чанки - завершаем запись
            KubekFileManager.endChunkWrite(currentChunkID, () => {
                console.log("Write of", currentChunkID, "ended");
                currentChunkID = null;
                currentDataParts = null;
                currentChunkWriting = null;
                KubekAlerts.addAlert("{{fileManager.writeEnd}}", "check", "", 4000);
                KubekFileManagerUI.refreshDir();
            });
        }
    }

    // Форматировать текст в редакторе
    static formatCode(saveCaret = true) {
        let restore;
        saveCaret ? restore = saveCaretPosition($("#code-edit")[0]) : saveCaret = false;
        let result = hljs.highlight($("#code-edit").text(), {
            language: currentEditorLang
        });
        $("#code-edit").html(result.value);
        saveCaret ? restore() : saveCaret = false;
    }

    // Закрыть редактор
    static closeEditor() {
        $(".fileEditor").hide();
        $(".fileEditor input").val("");
        $("#code-edit").text("");
        $(".blurScreen").hide();
    }
}

// Форматировать код при вводе в редакторе
$("#code-edit").on("input", function () {
    KubekFileManagerUI.formatCode();
});

// Отсортировать по папкам и файлам
function sortToDirsAndFiles(data) {
    let dirs = [];
    let files = [];
    data.forEach(function (item) {
        if (item.type === "directory") {
            dirs.push(item);
        } else {
            files.push(item);
        }
    });
    let datanew = [];
    dirs.forEach(function (item) {
        datanew.push(item);
    });
    files.forEach(function (item) {
        datanew.push(item);
    });
    return datanew;
}

function saveCaretPosition(context) {
    let selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        let range = selection.getRangeAt(0);
        range.setStart(context, 0);
        let len = range.toString().length;

        return function restore() {
            let pos = getTextNodeAtPosition(context, len);
            selection.removeAllRanges();
            let range = new Range();
            range.setStart(pos.node, pos.position);
            selection.addRange(range);

        }
    } else {
        return function restore() {
        }
    }
}

function getTextNodeAtPosition(root, index) {
    const NODE_TYPE = NodeFilter.SHOW_TEXT;
    let treeWalker = document.createTreeWalker(root, NODE_TYPE, function next(elem) {
        if (index > elem.textContent.length) {
            index -= elem.textContent.length;
            return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT;
    });
    let c = treeWalker.nextNode();
    return {
        node: c ? c : root,
        position: index
    };
}