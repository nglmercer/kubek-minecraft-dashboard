CORE_GRID_ITEM_PLACEHOLDER = "<div class='card centered' data-id='$1'> <img alt='$0 logo' class='icon' src='/assets/icons/cores/$1.png'> <span class='title'>$0</span> </div>";
JAVA_ITEM_PLACEHOLDER = "<div class='item' data-type='$0' data-data='$1'> <span class='text'>$2</span> <span class='check material-symbols-rounded'>check</span> </div>";
SERVER_NAME_REGEXP = /^[a-zA-Z0-9\-\_]{1,20}$/;
AIKAR_FLAGS = "--add-modules=jdk.incubator.vector -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20";

currentSelectedCore = "";
currentSelectedVersion = "";
allServersList = [];

$(function () {
    KubekUI.setTitle("Kubek | {{commons.create}} {{commons.server.lowerCase}}");

    // Заполняем список серверов для проверки на существование
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
        $(".new-server-container #server-mem").val(totalDigit);
        $(".new-server-container #server-mem").attr("max", maxMemory);
        validateNewServerInputs();
        console.log("usage server-mem input precalculated", usage);
    });
});

function validateNewServerInputs(){
    const server_name_input = document.querySelector('#server_name_input');
    const cores_grid = document.querySelector('#cores-grids');
    const core_upload = document.querySelector('#core-upload');
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
    if (!verifyobj.server_name_input || !verifyobj.server_name_input) {
    return false;
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
    document.querySelector('#server-core-input').trigger("click");
    document.querySelector('#server-core-input').off("change");
    document.querySelector('#server-core-input').on("change", () => {
        document.querySelector(".new-server-container #core-upload #uploaded-file-name").text(document.querySelector("#server-core-input")[0].files[0].name);
        validateNewServerInputs();
    });
}

function refreshJavaList(cb) {
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
        cb(true);
    });
}

// Собрать start script запуска сервера
function generateNewServerStart(){
    let result = "-Xmx" + $("#server-mem").val() * 1024 + "M";
    if($("#add-aikar-flags").is(":checked")){
        result = result + " " + encodeURIComponent(AIKAR_FLAGS);
    }
    return result;
}

function prepareServerCreation(){
    $(".new-server-container #create-server-btn .text").text("{{newServerWizard.creationStartedShort}}");
    //$(".new-server-container #create-server-btn").attr("disabled", "true");
    $(".new-server-container #create-server-btn .material-symbols-rounded:not(.spinning)").hide();
    $(".new-server-container #create-server-btn .material-symbols-rounded.spinning").show();
    let serverName = document.querySelector('#server_name_input').getInputValues();
    let memory = $(".new-server-container #server-mem").val();
    let serverPort = $(".new-server-container #server-port").val();
    let serverCore = "";
    let serverVersion = "";
    let javaVersion = "";
    let startScript = "";
    const serverVersion_select = document.querySelector('#customselect_versions');
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
        memory : memory
    }
    console.log("javaVersion mapedserverdata", mapedserverdata);
/*
    if($(".new-server-container #core-upload").css("display") === "none"){
        serverCore = currentSelectedCore;
        serverVersion = currentSelectedVersion;
        startServerCreation(serverName, serverCore, serverVersion, startScript, javaVersion, serverPort);
    } else {
        serverCore = $("#server-core-input")[0].files[0].name;
        serverVersion = serverCore;
        let formData = new FormData($("#server-core-form")[0]);
        KubekRequests.post("/cores/" + serverName, () => {
            startServerCreation(serverName, serverCore, serverVersion, startScript, javaVersion, serverPort);
        }, formData);
    } */
}

function startServerCreation(serverName, serverCore, serverVersion, startScript, javaVersion, serverPort){
    KubekRequests.get("/servers/new?server=" + serverName + "&core=" + serverCore + "&coreVersion=" + serverVersion + "&startParameters=" + startScript + "&javaVersion=" + javaVersion + "&port=" + serverPort, () => {
        $(".new-server-container #after-creation-text").text("{{newServerWizard.creationCompleted}}");
    });
}