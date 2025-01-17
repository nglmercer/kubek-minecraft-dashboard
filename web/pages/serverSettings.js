loadedSettings = null;


KubekServerSettingsUI = class {
    // Загрузить настройки в интерфейс
    static loadSettings = () => {
        KubekRequests.get("/servers/" + selectedServer + "/info", (kSettings) => {
            loadedSettings = kSettings;
            if (kSettings.restartOnError === false) {
                document.querySelector('#restart-on-error').setInputValues(false);
            } else {
                document.querySelector('#restart-on-error').setInputValues(true);
            }
            document.querySelector("#stop-command").setInputValues(kSettings.stopCommand);
            document.querySelector('#restart-attempts').setInputValues(kSettings.maxRestartAttempts);
        });
    }

    // Загрузить start script в интерфейс
    static loadStartScript = () => {
        KubekRequests.get("/servers/" + selectedServer + "/startScript", (startScript) => {
            document.querySelector('#start-script').setInputValues(startScript);
        });
    }

    // Сохранить настройки и start script
    static writeSettings = () => {
        loadedSettings.maxRestartAttempts = document.querySelector('#restart-attempts').getInputValues();
        loadedSettings.restartOnError = document.querySelector('#restart-on-error').getInputValues();
        loadedSettings.stopCommand = document.querySelector("#stop-command").getInputValues();
        let startScript = document.querySelector('#start-script').getInputValues();
        KubekRequests.put("/servers/" + selectedServer + "/info?data=" + Base64.encodeURI(JSON.stringify(loadedSettings)), (result) => {
            KubekRequests.put("/servers/" + selectedServer + "/startScript?data=" + Base64.encodeURI(startScript), (result2) => {
                if (result !== false && result2 !== false) {
                    KubekAlerts.addAlert("{{fileManager.writeEnd}}", "check", "", 5000);
                }
            });
        });


    };

    // este metodo es para mostrar el dialogo de confirmacion de borrado
    static deleteServer = () => {
      console.log("deleteServer", selectedServer);
        KubekNotifyModal.create(selectedServer, "{{serverSettings.deleteServer}}", "{{commons.delete}}", "delete", () => {
            KubekRequests.delete("/servers/" + selectedServer, () => {});
        }, KubekPredefined.MODAL_CANCEL_BTN);
    }
}
var restartOnErrorswitch = document.querySelector('#restart-on-error');
restartOnErrorswitch.addEventListener('input-change', (e) => {
    console.log("restartOnErrorswitch", e.detail);
  if (e.detail.value === true) {
    document.querySelector('#restart-attempts-tr').classList.remove('hidden');
  } else {
    document.querySelector('#restart-attempts-tr').classList.add('hidden');
  }
});


  function setAllInputValues(dataObject) {
    const inputs = document.querySelectorAll('custom-input');
    
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      const name = input.getAttribute('name');
      
      // Buscar el valor en el objeto usando id o name como clave
      const value = dataObject[id] || dataObject[name];
      
      if (value !== undefined) {
        input.setInputValues(value);
      }
    });
  }
  function getAllInputValues() {
    const allData = {};
    const inputs = document.querySelectorAll('custom-input');
    
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      const value = input.getInputValues();
      allData[id] = value;
    });
    
    return allData;
  }
  (()=>{
    KubekUI.setTitle("Kubek | {{sections.serverSettings}}");
  
    KubekServerSettingsUI.loadSettings();
    KubekServerSettingsUI.loadStartScript();
  }) ();