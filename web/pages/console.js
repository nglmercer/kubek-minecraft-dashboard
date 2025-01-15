const cpuElem = document.getElementById("cpu-bar");
cpuElem.setAttribute("value", 55);
cpuElem.setAttribute("active-color", "#007bff");
const ramElem = document.getElementById("ram-bar");
ramElem.setAttribute("value", 55);
ramElem.setAttribute("active-color", "#007bff");

function changeProgressvalue(element, value, action = "setvalue") {
    const elements = {
        "cpu": cpuElem,
        "ram": ramElem
    };
    const actions = {
        "setvalue": "value",
        "setactivecolor": "active-color"
    }
    if (typeof elements[element] !== "undefined") {
        if (typeof actions[action] !== "undefined") {
            elements[element].setAttribute(actions[action], value);
        }
    }
}
KubekConsoleUI = class {
    // Обновить progress бары использования рес-ов
    static refreshUsageItems(cpu, ram, ramElem) {
        changeProgressvalue("cpu", cpu);
        changeProgressvalue("ram", ram);
        changeProgressvalue("ram", KubekUtils.getProgressGradientColor(ram), "setactivecolor");
        changeProgressvalue("cpu", KubekUtils.getProgressGradientColor(cpu), "setactivecolor");

        $("#ram-usage-text").text(KubekUtils.humanizeFileSize(ramElem.used) + " / " + KubekUtils.humanizeFileSize(ramElem.total));
        if ($("#cpu-usage-bar").css("display") === "none") {
            $("#cpu-usage-spinner").hide();
            $("#ram-usage-spinner").hide();
        }
    }
}

$(function () {
    KubekUI.setTitle("Kubek | {{sections.console}}");

    KubekHardware.getUsage((usage) => {
        KubekConsoleUI.refreshUsageItems(usage.cpu, usage.ram.percent, usage.ram);
    });

    $("#cmd-input").on("keydown", (e) => {
        if (e.originalEvent.code === "Enter") {
            KubekServers.sendCommandFromInput(selectedServer);
        }
    });
})