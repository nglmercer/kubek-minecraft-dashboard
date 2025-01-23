// Constants
const UPPER_DIR_ITEM = "<tr onclick='KubekFileManagerUI.upperDir()'><td></td><td>..</td><td></td><td></td></tr>";
const DIR_ITEM_PLACEHOLDER = "<tr data-filename='$0' data-path='$1' data-type='$5'><td><div class='icon-bg'><span class='material-symbols-rounded'>$2</span></div></td><td>$0</td><td>$3</td><td>$4</td></tr>";
const FILE_NAME_REGEXP = /^[\w,\s-]+\.[A-Za-z]{1,15}$/gi;

let currentPath = "/";
let currentEditorLang = "plaintext";
let currentDataParts = [];
let currentChunkID = null;
let currentChunkWriting = null;
const tableListElement = document.querySelector("#fm-table tbody");

const editableExtensions = [
    "txt", "log", "yml", "xml", "cfg", "conf", "config",
    "json", "yaml", "properties", "sh", "bat"
];

// Initialize on DOM load
    KubekUI.setTitle("Kubek | {{sections.fileManager}}");
    const hoverStyles = `
    <style>
        .dropdown-item {
            background: var(--bg-dark-accent);
            border-radius: 8px;
            padding: 4px 8px;
            display: flex;
            flex-direction: row;
            align-items: center;
            cursor: pointer;
            height: 48px;
            font-size: 12pt;
            width: 100%;
        }
        .dropdown-item:hover {
            background: #2e3e53;
        }
    </style>
    `;

class KubekFileManagerUI {
    static refreshDir(saveScroll = true) {
        KubekFileManager.readDirectory(currentPath, (data) => {
            // Sort data to put directories on top
            if (data.length > 0) {
                data = sortToDirsAndFiles(data);
            }

            let bindEvent = window.matchMedia("(min-width: 320px)").matches && 
                           window.matchMedia("(max-width: 480px)").matches ? "click" : "dblclick";

            // Save scroll position if needed
            const scrollData = saveScroll ? 
                document.querySelector(".fm-container").scrollTop : 0;

            tableListElement.innerHTML = "";
            console.log("currentPath", currentPath, "data", data);
            const explorer = document.querySelector('file-explorer');
            explorer.data = data;
            document.getElementById('path-display').textContent = `Current Path: ${currentPath}`;
            // Bind breadcrumb events
            this.bindBreadcrumbClicks();


            // Bind file list events
            this.bindFMFilesList(bindEvent);

            document.getElementById("fm-table").scrollTop = scrollData;
        });
    }
    static initaddeventlisteners() {
        const explorer = document.querySelector('file-explorer');
        explorer.addEventListener('item-dblclick', (e) => {
            explorer.setAttribute('current-path', currentPath);
            console.log('Double click en:', e.detail.item);
            if (!e.detail.item) { this.upperDir(); return; }
                const { path, name, type } = e.detail.item;
                explorer.setAttribute('current-path', currentPath);
                console.log("verify", editableExtensions.includes(KubekUtils.pathExt(name)),"e",e.detail);
                const verifycurrentpath = currentPath.endsWith("/") ? currentPath : currentPath + "/";
                if (type === 'directory') {
                    currentPath = verifycurrentpath + name;

                    KubekFileManagerUI.refreshDir();
                } else if (type === 'file' && 
                         editableExtensions.includes(KubekUtils.pathExt(name))) {
                            KubekFileManagerUI.editFile(verifycurrentpath + name);
                }
        });

        explorer.addEventListener('item-contextmenu', (e) => {
            console.log('Click derecho en:', e.detail.item);
            if (!e.detail.item) return;
            console.log('Posición:', e.detail.x, e.detail.y);
        });
    }
    static bindFMFilesList(bindEvent) {
        const baseOptions = [
            {
                id: 'delete',
                text: '{{commons.delete}}',
                icon: 'delete',
                callback: (dataTarget) => {
                    console.log('delete', dataTarget);
                    const path = dataTarget.path;
                    KubekNotifyModal.create(
                        "{{commons.delete}}", 
                        "{{fileManager.areYouWantToDelete}} " + KubekUtils.pathFilename(path),
                        "{{commons.delete}}", 
                        "delete",
                        () => {
                            KubekFileManager.delete(path, (result) => {
                                if (result === false) {
                                    KubekAlerts.addAlert(
                                        "{{commons.actionFailed}}", 
                                        "warning",
                                        "{{commons.delete}} " + KubekUtils.pathFilename(path),
                                        4000,
                                        "colored"
                                    );
                                }
                                KubekFileManagerUI.refreshDir();
                            });
                        },
                        KubekPredefined.MODAL_CANCEL_BTN
                    );
                }
            },
            {
                id: 'rename',
                text: '{{commons.rename}}',
                icon: 'bookmark_manager',
                callback: (dataTarget) => {
                    KubekNotifyModal.askForInput(
                        "{{commons.rename}}",
                        "bookmark_manager",
                        (txt) => {
                            KubekFileManager.renameFile(dataTarget.path, txt, () => {
                                KubekFileManagerUI.refreshDir();
                            });
                        },
                        "",
                        "{{fileManager.enterName}}",
                        KubekUtils.pathFilename(dataTarget.path),
                        "text"
                    );
                }
            }
        ];

        const downloadOption = {
            id: 'download',
            text: '{{commons.download}}',
            icon: 'download',
            callback: (dataTarget) => {
                const basePath = currentPath.length < 1 ? "" : currentPath;
                const parsedPath = (basePath.endsWith("/") ? basePath : basePath + "/") + dataTarget.filename;
                KubekFileManager.downloadFile(parsedPath, () => {});
            }
        };

        const getElementData = (target) => {
            const parent = target.closest('tr');
            return {
                filename: parent.dataset.filename,
                path: parent.dataset.path,
                type: parent.dataset.type
            };
        };

        // Bind context menu
        document.querySelectorAll('#fm-table tbody tr').forEach(row => {
            row.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const dataTarget = getElementData(e.target);
                const options = [...baseOptions];
                
                if (dataTarget.type !== 'directory') {
                    options.push(downloadOption);
                }

                const popupOptions = options.map(option => ({
                    html: `${hoverStyles}
                        <div class="dropdown-item">
                            <span class="material-symbols-rounded">${option.icon}</span>
                            <span class="default-font">${option.text}</span>
                        </div>
                    `,
                    callback: () => option.callback(dataTarget)
                }));

                setPopupOptions(popupOptions);
                openPopup(e.target);
            });

            // Bind click/double-click
            row.addEventListener(bindEvent, function(e) {
                const data = getElementData(e.target);
                console.log("data", data);
                if (data.type === "directory") {
                    currentPath = currentPath + data.filename;
                    KubekFileManagerUI.refreshDir();
                } else if (data.type === "file" && 
                         editableExtensions.includes(KubekUtils.pathExt(data.filename))) {
                    KubekFileManagerUI.editFile(currentPath + data.filename);
                }
            });
        });
    }

    static bindBreadcrumbClicks() {
        const breadcrumbLinks = document.querySelectorAll("#fm-breadcrumb a:not(:last-child)");
        
        breadcrumbLinks.forEach(link => {
            link.addEventListener("click", function() {
                if (this.textContent === selectedServer) {
                    currentPath = "/";
                    KubekFileManagerUI.refreshDir(false);
                    return;
                }

                let path = "";
                const currentIndex = Array.from(breadcrumbLinks).indexOf(this);
                
                breadcrumbLinks.forEach((item, index) => {
                    if (item.textContent !== selectedServer && index <= currentIndex) {
                        path += item.textContent + "/";
                    }
                });

                currentPath = path;
                KubekFileManagerUI.refreshDir(false);
            });
        });
    }

    static newDirectory() {
        KubekNotifyModal.askForInput(
            "{{fileManager.newDirectory}}",
            "create_new_folder",
            (txt) => {
                KubekFileManager.newDirectory(currentPath, txt, () => {
                    KubekFileManagerUI.refreshDir();
                });
            },
            "",
            "{{commons.input}}",
            "",
            "text"
        );
    }

    static upperDir() {
        const pathParts = currentPath.split("/");
        pathParts.pop();
        pathParts.pop();
        currentPath = pathParts.join("/") + "/";
        KubekFileManagerUI.refreshDir(false);
        console.log("currentPath", currentPath);
    }

    static uploadFile() {
        const inputElement = document.getElementById("g-file-input");
        inputElement.click();
        
        // Remove old listener and add new one
        const oldListener = inputElement.onchange;
        if (oldListener) {
            inputElement.removeEventListener('change', oldListener);
        }

        inputElement.addEventListener("change", () => {
            const formData = new FormData(document.getElementById("g-file-form"));
            KubekRequests.post(
                `/fileManager/upload?server=${selectedServer}&path=${currentPath}`,
                () => { KubekFileManagerUI.refreshDir(); },
                formData
            );
        });
    }


    static editFile(path) {
        const fileExt = KubekUtils.pathExt(path);
        const languageMap = {
            'xml': 'xml',
            'yml': 'yaml',
            'yaml': 'yaml',
            'css': 'css',
            'js': 'javascript',
            'json': 'json',
            'properties': 'ini'
        };
        
        currentEditorLang = languageMap[fileExt] || "plaintext";

        KubekFileManager.readFile(path, (data) => {
            const codeEdit = document.getElementById("code-edit");
            codeEdit.textContent = data;
            this.formatCode(false);
            
            document.querySelector(".blurScreen").style.display = "block";
            document.querySelector(".fileEditor input").value = KubekUtils.pathFilename(path);
            document.querySelector(".fileEditor").style.display = "block";
        });
    }

    static writeFile() {
        const inputElement = document.querySelector(".fileEditor input");
        if (!inputElement.value || !FILE_NAME_REGEXP.test(inputElement.value)) {
            return false;
        }

        const path = currentPath + inputElement.value;
        const data = document.getElementById("code-edit").textContent;
        
        this.closeEditor();
        currentDataParts = data.match(/[\s\S]{1,500}/g) || [];
        currentChunkWriting = -1;

        KubekFileManager.startChunkWrite(path, (result) => {
            currentChunkID = result;
            console.log("Starting write for", currentChunkID);
            this.writeNextChunk();
        });

        return true;
    }

    static writeNextChunk() {
        currentChunkWriting++;
        if (currentDataParts[currentChunkWriting]) {
            console.log("Writing chunk", currentChunkWriting, "to ID", currentChunkID);
            KubekFileManager.addChunkWrite(
                currentChunkID,
                Base64.encodeURI(currentDataParts[currentChunkWriting]),
                () => { this.writeNextChunk(); }
            );
        } else {
            KubekFileManager.endChunkWrite(currentChunkID, () => {
                console.log("Write of", currentChunkID, "ended");
                currentChunkID = null;
                currentDataParts = null;
                currentChunkWriting = null;
                KubekAlerts.addAlert("{{fileManager.writeEnd}}", "check", "", 4000);
                this.refreshDir();
            });
        }
    }

    static formatCode(saveCaret = true) {
        const codeEdit = document.getElementById("code-edit");
        let restore;
        
        if (saveCaret) {
            restore = saveCaretPosition(codeEdit);
        }

        const result = hljs.highlight(codeEdit.textContent, {
            language: currentEditorLang
        });
        
        codeEdit.innerHTML = result.value;
        
        if (saveCaret) {
            restore();
        }
    }

    static closeEditor() {
        document.querySelector(".fileEditor").style.display = "none";
        document.querySelector(".fileEditor input").value = "";
        document.getElementById("code-edit").textContent = "";
        document.querySelector(".blurScreen").style.display = "none";
    }
}
KubekFileManagerUI.initaddeventlisteners();
KubekFileManagerUI.refreshDir();
// Event listener for code editing
document.getElementById("code-edit").addEventListener("input", function() {
    KubekFileManagerUI.formatCode();
});

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
function openPopup(element, popupId = "#fm-popup") {
    const popupElement = document.querySelector(popupId);
    if (!popupElement) return;
    if (typeof element === "string") {
        const buttonElement  = document.querySelector(element);
            popupElement.showAtElement(buttonElement);
    } else {
        const buttonElement = element;
        popupElement.showAtElement(buttonElement);
    }
}


function setPopupOptions(popupOptions){
    const popupElement = document.querySelector('#fm-popup');
    popupElement.options = popupOptions;
}
function gettemplatebutton(text, icon) {
    return `${hoverStyles}
        <div class="dropdown-item">
            <span class="material-symbols-rounded">${icon}</span>
            <span class="default-font">${text}</span>
        </div>
    `;
}