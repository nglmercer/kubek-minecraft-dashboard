function initializedSectionSystemMonitor() {
    KubekHardware.getSummary((data) => {
        systemMonitor(data);
    });
}
function systemMonitor(data) {
    const systemMonitor = document.querySelector('system-monitor');
    console.log("###systemMonitor", data, systemMonitor);
    if (!data) return;
    systemMonitor.renderdata(data);
}
initializedSectionSystemMonitor();
async function initConsole() {
    KubekUI.setTitle("Kubek | {{sections.console}}");
    KubekHardware.getUsage((usage) => {
        console.log("usage", usage);
        if (!usage || !usage.cpu || !usage.ram) {
            return;
        }
        KubekConsoleUI.refreshUsageItems(usage.cpu, usage.ram.percent, usage.ram);
    });

}
initConsole();