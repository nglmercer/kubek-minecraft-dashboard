CORE_GRID_ITEM_PLACEHOLDER = "<div class='card centered' data-id='$1'> <img alt='$0 logo' class='icon' src='/assets/icons/cores/$1.png'> <span class='title'>$0</span> </div>";
JAVA_ITEM_PLACEHOLDER = "<div class='item' data-type='$0' data-data='$1'> <span class='text'>$2</span> <span class='check material-symbols-rounded'>check</span> </div>";
SERVER_NAME_REGEXP = /^[a-zA-Z0-9\-\_]{1,20}$/;
AIKAR_FLAGS = "--add-modules=jdk.incubator.vector -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20";

currentSelectedCore = "";
currentSelectedVersion = "";
allServersList = [];
$(".new-server-container #core-category .item").on("click", function () {
    if (!$(this).hasClass("active")) {
        $(".new-server-container #core-category .item.active").removeClass("active");
        $(this).addClass("active");
        if ($(this).data("item") === "list") {
            $(".new-server-container #cores-grid").show();
            $(".new-server-container #cores-versions-parent").show();
            $(".new-server-container #core_upload").hide();
        } else {
            $(".new-server-container #cores-grid").hide();
            $(".new-server-container #cores-versions-parent").hide();
            $(".new-server-container #core_upload").show();
        }
        validateNewServerInputs();
    }
});
$(function () {
    KubekUI.setTitle("Kubek | {{commons.create}} {{commons.server.lowerCase}}");

    $("#servers-list-sidebar .sidebar-item span:last-child").each((i, el) => {
        allServersList.push($(el).text());
        console.log("allServersList", allServersList);
    });

    refreshServerCoresList(() => {
        refreshCoreVersionsList(() => {
            refreshJavaList(() => {});
        });
    });
    $(".new-server-container #server-port").val(25565);

    // Получаем кол-во ОЗУ, настраиваем поле ввода ОЗУ
    KubekRequests.get("/kubek/hardware/usage", (usage) => {
        let totalMemory = Math.ceil(Math.round(usage.ram.total / 1024 / 1024) / 512) * 512;
        let totalDigit = (totalMemory / 1024).toFixed(1) / 2;
        let maxMemory = (totalMemory / 1024).toFixed(1);
        document.querySelector(".new-server-container #server-mem").value = totalDigit;
        document.querySelector(".new-server-container #server-mem").max = maxMemory;
        validateNewServerInputs();
        console.log("usage server-mem input precalculated", usage);
    });
});

function validateNewServerInputs(){
    const server_name_input = document.querySelector('#server_name_input');
    const cores_grid = document.querySelector('#cores-grids');
    const core_upload = document.querySelector('#core-upload') || document.querySelector('#core_upload');
    const customselect_versions = document.querySelector('#customselect_versions');
    const javas_list = document.querySelector('#javas_list');
    const server_mem = document.querySelector('#server-mem');
    const server_port = document.querySelector('#server-port');
    const verifyobj = {
        server_name_input: server_name_input.getInputValues(),
        cores_grid: cores_grid.selected,
        core_upload: core_upload.style.display !== "none",
        customselect_versions: customselect_versions.getSelectedOptions(),
        javas_list: javas_list.getSelectedOptions(),
        server_mem: server_mem.value,
        server_port: server_port.value
    }
    console.log("verifyobj", verifyobj);
    if (!verifyobj.server_name_input || !verifyobj.javas_list) {
    return false;
    }
    if (verifyobj.core_upload === true) {
        return "uploadfile"
    }
    if (!verifyobj.server_name_input || !verifyobj.customselect_versions || !verifyobj.javas_list) {
    return false;
    }
    return true;
}

function refreshServerCoresList(cb = () => {
}) {
    currentSelectedCore = "";
    currentSelectedVersion = "";
    KubekCoresManager.getList((cores) => {
        console.log("cores", cores);
        const coresgrid = document.querySelector('#cores-grids');
        const allcoresmap = [];
        Object.entries(cores).forEach(([key, value]) => {
            console.log("value", value, "key", key);
            const parsedcore = {
                id: key,
                title: value.displayName,
                img: `/assets/icons/cores/${key}.png`
            }
            allcoresmap.push(parsedcore);
        });
        coresgrid.data = allcoresmap;
        coresgrid.addEventListener('change', (e) => {
            console.log("e", e.detail);
            currentSelectedCore = e.detail.selected;
            refreshCoreVersionsList(() => {
                validateNewServerInputs();
                KubekUI.hidePreloader();
            });
        });
        coresgrid.selected = "vanilla";

        cb(true);
    });
}

function refreshCoreVersionsList(cb = () => {
}) {
    currentSelectedVersion = "";
    KubekCoresManager.getCoreVersions(currentSelectedCore, (versions) => {
        if (!versions) {
            cb(false);
            return;
        }
        console.log("versions", versions);

        const allversions = []

        versions.forEach((ver) => {
            const optionserver = {
                label: ver,
                value: ver
             }
             allversions.push(optionserver);
        });
        const customselect_versions = document.querySelector('#customselect_versions');
        console.log("customselect_versions", customselect_versions);
        customselect_versions.setOptions(allversions);
        cb(true);
    });
}

function uploadCore() {
    $("#server-core-input").trigger("click");
    $("#server-core-input").off("change");
    $("#server-core-input").on("change", () => {
        $(".new-server-container #core-upload #uploaded-file-name").text($("#server-core-input")[0].files[0].name);
        validateNewServerInputs();
    });
}

function refreshJavaList(cb) {
    document.querySelector("#java-list-placeholder").style.display = "block";
    document.querySelector("#javas-list").style.display = "none";

    const javas_list = document.querySelector('#javas_list');
    const alljavas = []
    KubekJavaManager.getAllJavas((javas) => {
        console.log("javas", javas);
        const parseToOptions = (data) => {
            return Object.entries(data).flatMap(([state, items]) =>
              items.map(item => ({
                label: item,
                value: item,
                state
              }))
            );
          };
        alljavas.push(...parseToOptions(javas));
        javas_list.setOptions(alljavas);
        localStorage.setItem("javas", JSON.stringify(javas));
        document.querySelector("#java-list-placeholder").style.display = "none";
        document.querySelector("#javas-list").style.display = "block";
        cb(true);
    });
}

// Собрать start script запуска сервера
function generateNewServerStart(){
    let result = "-Xmx" + document.querySelector('#server-mem').value * 1024 + "M";
    if(document.querySelector('#add-aikar-flags').checked){
        result = result + " " + encodeURIComponent(AIKAR_FLAGS);
    }
    return result;
}

function prepareServerCreation(){
    document.querySelector(".new-server-container #create-server-btn .text").innerHTML = "{{newServerWizard.creationStartedShort}}";
    //document.querySelector(".new-server-container #create-server-btn").attr("disabled", "true");
    document.querySelector(".new-server-container #create-server-btn .material-symbols-rounded:not(.spinning)").style.display = "none";
    document.querySelector(".new-server-container #create-server-btn .material-symbols-rounded.spinning").style.display = "block";
    let serverName = document.querySelector('#server_name_input').getInputValues();
    let memory = document.querySelector('#server-mem').value;
    let serverPort = document.querySelector('#server-port').value;
    let serverCore = "";
    let serverVersion = "";
    let javaVersion = "";
    let startScript = "";
    const serverVersion_select = document.querySelector('#customselect_versions');
    const fileUpload = document.querySelector('#core_upload');
    serverVersion = serverVersion_select.getValue();
    const javaversion_select = document.querySelector('#javas_list');
    console.log("javas_list", javaversion_select);
    javaVersion = javaversion_select.getValue();
         startScript = generateNewServerStart();
         serverCore = currentSelectedCore;
    const mapedserverdata = {
        serverName : serverName,
        serverCore : serverCore,// create webcomponent for this list: ['vanilla', 'paper', 'waterfall', 'purpur', 'spigot',"velocity"]
        serverVersion : serverVersion,
        startScript : startScript, //start script
        javaVersion : javaVersion,
        serverPort : serverPort,
        memory : memory,
        formData : fileUpload.getSelectfile()
    }
    console.log("javaVersion mapedserverdata", mapedserverdata);
    if(validateNewServerInputs() === true){
        startServerCreation(mapedserverdata);
    } else if (validateNewServerInputs() === "uploadfile") {
/*         KubekRequests.post("/cores/" + serverName, () => {
            startServerCreation(mapedserverdata);
        }, fileUpload.getSelectfile().formData); */
        sendServerData(serverName,)
        return;
    } else {
        console.log("validateNewServerInputs", validateNewServerInputs(), mapedserverdata);
        return;
    }


/*     if($(".new-server-container #core-upload").css("display") === "none"){
        serverCore = currentSelectedCore;
        serverVersion = currentSelectedVersion;
        startServerCreation(serverName, serverCore, serverVersion, startScript, javaVersion, serverPort);
    } else {
        serverCore = $("#server-core-input")[0].files[0].name;
        serverVersion = serverCore;
        KubekRequests.post("/cores/" + serverName, () => {
            startServerCreation(serverName, serverCore, serverVersion, startScript, javaVersion, serverPort);
        }, formData);
    } */
}


function startServerCreation(mapedserverdata){
    const { serverName, serverCore, serverVersion, startScript, javaVersion, serverPort } = mapedserverdata;
    KubekRequests.get("/servers/new?server=" + serverName + "&core=" + serverCore + "&coreVersion=" + serverVersion + "&startParameters=" + startScript + "&javaVersion=" + javaVersion + "&port=" + serverPort, () => {
        document.querySelector(".new-server-container #after-creation-text").textContent = "{{newServerWizard.creationCompleted}}";
    }); 
}
const fileUpload = document.querySelector('#core_upload');
fileUpload.addEventListener('file-upload', (e) => {
    const detail = e.detail;
    console.log("detail", detail);
    const fileselected = fileUpload.getSelectfile();
    console.log("fileselected", fileselected);
    const serverName = document.querySelector('#server_name_input').getInputValues();
    sendServerData(serverName, fileselected.formData, fileselected.fileName, null);
    console.log(checkFileDataType(fileselected.formData),"checkFileDataType");
});

function sendServerData(serverName, fileData, fileName, parsedsenddatamap) {
    let formDataToSend = new FormData();
    
    if (fileData instanceof FormData) {
        // Get the file from the existing FormData
        const file = getFileFromFormData(fileData);
        if (file) {
            // Create a new FormData with the file and ensure the name is preserved
            formDataToSend.append('server-core-input', file, file.name);
        } else {
            console.error('No se encontró archivo en FormData');
            return;
        }
    } else if (fileData instanceof File) {
        formDataToSend.append('server-core-input', fileData, fileData.name);
    } else if (typeof fileData === 'string' && fileData.startsWith('data:')) {
        const base64File = dataURLtoFile(fileData, fileName);
        formDataToSend.append('server-core-input', base64File, fileName);
    } else {
        try {
            const binaryFile = new File([fileData], fileName, {
                type: 'application/octet-stream'
            });
            formDataToSend.append('server-core-input', binaryFile, fileName);
        } catch (error) {
            console.error('Error al procesar el archivo:', error);
            return;
        }
    }

    return KubekRequests.post("/cores/" + serverName, () => {
        if (parsedsenddatamap) {
            console.log('Archivo subido exitosamente');
            startServerCreation(parsedsenddatamap);
        }
    }, formDataToSend);
}
function checkFileDataType(fileData) {
    if (fileData instanceof File) {
        return 'FILE';
    } else if (fileData instanceof FormData) {
        return 'FORMDATA';
    } else if (typeof fileData === 'string' && fileData.startsWith('data:')) {
        return 'BASE64';
    }
    return 'OTHER';
}
function getFileFromFormData(formData) {
    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            return value;
        }
    }
    return null;
}