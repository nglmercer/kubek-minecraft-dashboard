ACCOUNT_ITEM = "<div class='item' data-account='$0'><div class='iconBg'><span class='material-symbols-rounded'>person</span></div><span>$0</span></div>";
NEW_ACCOUNT_ITEM = "<div class='item' data-account='newAccItem'><div class='iconBg'><span class='material-symbols-rounded'>add</span></div><span>{{kubekSettings.addNewAccount}}</span></div>";
LANGUAGE_ITEM = '<div class="item" data-lang="$0"> <div class="text" style="display: flex; justify-content: center; flex-direction: column"> <span>$1 <sup style="color: var(--bg-dark-accent-lighter)">by $3</sup></span> <span style="color: var(--bg-dark-accent-lighter)">$2</span> </div> <span class=\'check material-symbols-rounded\'>check</span> </div>';

currentEditorMode = null;
currentConfig = null;

$(function () {
    KubekUI.setTitle("Kubek | {{sections.kubekSettings}}");

    KubekSettingsUI.refreshLanguagesList(() => {
        // Бинды кликов на языки
        $("#language-list .item").on("click", function () {
            if (!$(this).hasClass("active")) {
                $("#language-list .item.active").removeClass("active");
                $(this).addClass("active");
            }
        });

        KubekSettingsUI.loadConfig();
        KubekSettingsUI.refreshUsersList();
    })

    $(".userEditModal input[type='checkbox']").on("change", () => {
        KubekSettingsUI.validateInputs();
    });

    $(".userEditModal input[type='email'], .userEditModal input[type='password'], .userEditModal input[type='text']").on("input", () => {
        KubekSettingsUI.validateInputs();
    });

    // Скрытие/показ списка разрешённых серверов при переключении... переключателя
    $(".userEditModal #restrict-servers-access").on("change", function () {
        $(this).is(":checked") ? $(".userEditModal #allowed-servers-list").show() : $(".userEditModal #allowed-servers-list").hide();
    });

    $(".userEditModal #delete-account-btn").on("click", function () {
        let username = $(".userEditModal #username-input").val();
        KubekRequests.delete("/accounts/" + username, () => {
            KubekSettingsUI.hideUserEditor();
            KubekSettingsUI.refreshUsersList();
        });
    });

    // Обновляем список серверов
    KubekServers.getServersList((servers) => {
        servers.forEach(server => {
            $(".userEditModal #allowed-servers-list").append('<div class="item" data-server="' + server + '"><span class="text">' + server + '</span><span class="material-symbols-rounded check">check</span></div>');
        })

        $(".userEditModal #allowed-servers-list .item").on("click", function () {
            $(this).hasClass("active") ? $(this).removeClass("active") : $(this).addClass("active");
        });
    });

    // Загружаем версию Kubek
    KubekRequests.get("/kubek/version", (version) => {
        $("#kubek-version").text(version)
    });
});

KubekSettingsUI = class {
    // Получить конфиг
    static getConfig = (cb = () => {
    }) => {
      var urlink = "/kubek/settings";  
      KubekRequests.get(urlink, cb);
      console.log("urlink", urlink);    
    }

    // Загрузить конфиг в интерфейс
    static loadConfig = (cb = () => { }) => {
        this.getConfig((config) => {
          console.log("config", config, currentConfig);
            currentConfig = config;
            $("#language-list .item[data-lang='" + config.language + "']").addClass("active");
            $("#server-port-input").val(config.webserverPort);
            this.switchASwtich($("#ftp-server-enabled"), config.ftpd.enabled);
            $("#ftp-login-input").val(config.ftpd.username);
            $("#ftp-password-input").val(config.ftpd.password);
            $("#ftp-port-input").val(config.ftpd.port);
            this.switchASwtich($("#auth-enabled"), config.authorization);
            this.switchASwtich($("#ips-access-switch"), config.allowOnlyIPsList);
            $("#subnets-list").val(config.IPsAllowed.join("\n"));
            cb();
        });
    }

    // Сохранить конфигурацию
    static saveConfig = () => {
        let language = $("#language-list .item.active").data("lang");
        let serverPort = $("#server-port-input").val();
        let ftpEnabled = $("#ftp-server-enabled").is(":checked");
        let ftpLogin = $("#ftp-login-input").val();
        let ftpPassword = $("#ftp-password-input").val();
        let ftpPort = $("#ftp-port-input").val();
        let authorization = $("#auth-enabled").is(":checked");
        let ipsAccess = $("#ips-access-switch").is(":checked");
        let subnets = $("#subnets-list").val().split("\n");
        currentConfig.language = language;
        currentConfig.webserverPort = serverPort;
        currentConfig.ftpd.enabled = ftpEnabled;
        currentConfig.ftpd.username = ftpLogin;
        currentConfig.ftpd.password = ftpPassword;
        currentConfig.ftpd.port = ftpPort;
        currentConfig.authorization = authorization;
        currentConfig.allowOnlyIPsList = ipsAccess;
        currentConfig.IPsAllowed = subnets;
        KubekRequests.put("/kubek/settings?config=" + Base64.encodeURI(JSON.stringify(currentConfig)), (result) => {
            if (result === true) {
                KubekAlerts.addAlert("{{kubekSettings.configSaved}}", "check", "", 5000);
            } else {
                KubekAlerts.addAlert("{{kubekSettings.configNotSaved}}", "warning", result.toString(), 5000);
            }
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }

    // Обновить список пользователей
    static refreshUsersList = () => {
        $("#accounts-list").html("");
        KubekRequests.get("/accounts", (accounts) => {
            $("#accounts-list").append(NEW_ACCOUNT_ITEM);
            accounts.forEach((account) => {
                $("#accounts-list").append(ACCOUNT_ITEM.replaceAll("$0", account));
            });

            $("#accounts-list .item").on("click", function () {
                let account = $(this).data("account");
                if (account === "newAccItem") {
                    KubekSettingsUI.showNewUserEditor();
                } else {
                    KubekSettingsUI.openUserEditorByUsername(account);
                }
            });
        });
    }

    // Переключить переключатель
    static switchASwtich = (element, state) => {
        if (state === true) {
            $(element).attr("checked", true);
        } else {
            $(element).removeAttr("checked");
        }
    };

    // Сбросить значения в редакторе пользователей
    static resetUserEditorValues = () => {
        $(".userEditModal input[type=checkbox]").removeAttr("checked");
        $(".userEditModal input[type=text], .userEditModal input[type=email], .userEditModal input[type=password]").val("");
        $(".userEditModal #allowed-servers-list .item.active").removeClass("active");
        $(".userEditModal #allowed-servers-list").hide();
    };

    // Открыть редактор в режиме создания нового пользователя
    static showNewUserEditor = () => {
        this.resetUserEditorValues();
        $(".userEditModal #delete-account-btn").hide();
        //$(".userEditModal #password-input").show();
        //$(".userEditModal #password-rules").show();
        $(".userEditModal #save-btn").attr("disabled", true);
        this.showUserEditor();
        currentEditorMode = "new";
    }

    // Получить данные по username и передать их в редактор
    static openUserEditorByUsername = (username) => {
        KubekRequests.get("/accounts/" + username, (data) => {
            this.showExistingUserEditor(data.username, data.email, data.permissions, data.serversAccessRestricted, data.serversAllowed);
        });
    };

    // Загрузить данные пользователя в поля редактора
    static showExistingUserEditor = (username, email, permissions, serversRestricted, allowedServersList) => {
        this.resetUserEditorValues();
        $(".userEditModal #delete-account-btn").show();
        //$(".userEditModal #password-input").hide();
        //$(".userEditModal #password-rules").hide();
        $(".userEditModal #username-input").val(username);
        $(".userEditModal #email-input").val(email);
        permissions.forEach((permItem) => {
            $(".userEditModal #perm-" + permItem).attr("checked", true);
        });
        if (serversRestricted === true) {
            $(".userEditModal #restrict-servers-access").attr("checked", true);
            $(".userEditModal #allowed-servers-list").show();
            allowedServersList.forEach((allowedServer) => {
                $(".userEditModal #allowed-servers-list .item[data-server='" + allowedServer + "']").addClass("active");
            });
        }
        this.showUserEditor();
        currentEditorMode = "existing";
    }

    // Показать интерфейс редактора
    static showUserEditor = () => {
        $(".blurScreen").show();
        $(".userEditModal").show();
    }

    // Скрыть интерфейс редактор
    static hideUserEditor = () => {
        $(".blurScreen").hide();
        $(".userEditModal").hide();
    }

    // Получить список выбранных серверов (для restrict access)
    static getSelectedServersInList = () => {
        let servers = [];
        $(".userEditModal #allowed-servers-list .item.active").each((i, item) => {
            servers.push($(item).data("server"));
        });
        return servers;
    };

    // Валидировать поля ввода
    static validateInputs = () => {
        let username = $(".userEditModal #username-input").val();
        let email = $(".userEditModal #email-input").val();
        let password = $(".userEditModal #password-input").val();

        if (username.match(KubekPredefined.LOGIN_REGEX) != null) {
            $(".userEditModal #username-input").removeClass("error");
        } else {
            $(".userEditModal #username-input").addClass("error");
            $(".userEditModal #save-btn").attr("disabled", true);
            return;
        }

        if (email === "" || email.match(KubekPredefined.EMAIL_REGEX) != null) {
            $(".userEditModal #email-input").removeClass("error");
        } else {
            $(".userEditModal #email-input").addClass("error");
            $(".userEditModal #save-btn").attr("disabled", true);
            return;
        }

        if (password.match(KubekPredefined.PASSWORD_REGEX) != null || (currentEditorMode !== "new" && password === "")) {
            $(".userEditModal #password-input").removeClass("error");
        } else {
            $(".userEditModal #password-input").addClass("error");
            $(".userEditModal #save-btn").attr("disabled", true);
            return;
        }

        $(".userEditModal #save-btn").removeAttr("disabled");
    }

    // Получить список выбранных пермсов
    static getSelectedPermissions = () => {
        let perms = [];
        $(".userEditModal .permissions input[type=checkbox]:checked").each((i, el) => {
            perms.push($(el)[0].id.replace("perm-", ""));
        });
        return perms;
    }

    // Сохранить нового/существующего пользователя
    static saveUser = () => {
        let login = $(".userEditModal #username-input").val();
        let password = $(".userEditModal #password-input").val();
        let email = $(".userEditModal #email-input").val();
        let isServersRestricted = $(".userEditModal #restrict-servers-access").is(":checked");
        let selectedServersInList = this.getSelectedServersInList();
        let permissions = this.getSelectedPermissions().join(",");
        if (!isServersRestricted) {
            selectedServersInList = [];
        }
        let reqURL;
        if (currentEditorMode === "new") {
            if (selectedServersInList.length === 0) {
                reqURL = "/accounts?login=" + login + "&email=" + email + "&permissions=" + permissions + "&password=" + password;
            } else {
                selectedServersInList = selectedServersInList.join(",");
                reqURL = "/accounts?login=" + login + "&email=" + email + "&servers=" + selectedServersInList + "&permissions=" + permissions + "&password=" + password;
            }
            KubekRequests.put(reqURL, (result) => {
                KubekSettingsUI.hideUserEditor();
                if (result === true) {
                    KubekAlerts.addAlert("{{kubekSettings.userAdded}}", "check", login, 5000);
                } else {
                    KubekAlerts.addAlert("{{kubekSettings.userNotAdded}}", "warning", login, 5000);
                }
                KubekSettingsUI.refreshUsersList();
            });
        } else {
            if (selectedServersInList.length === 0) {
                reqURL = "/accounts/" + login + "?email=" + email + "&permissions=" + permissions;
            } else {
                selectedServersInList = selectedServersInList.join(",");
                reqURL = "/accounts/" + login + "?email=" + email + "&servers=" + selectedServersInList + "&permissions=" + permissions;
            }
            if (password !== "") {
                reqURL += "&password=" + password;
            }
            KubekRequests.put(reqURL, (result) => {
                KubekSettingsUI.hideUserEditor();
                if (result === true) {
                    KubekAlerts.addAlert("{{kubekSettings.userSaved}}", "check", login, 5000);
                } else {
                    KubekAlerts.addAlert("{{kubekSettings.userNotEdited}}", "warning", login, 5000);
                }
                KubekSettingsUI.refreshUsersList();
            });
        }
    }

    // Функция для обновления списка языков
    static refreshLanguagesList = (cb) => {
        KubekRequests.get("/kubek/languages", (langs) => {
            $("#language-list").html("");
            Object.values(langs).forEach(lang => {
                $("#language-list").append(LANGUAGE_ITEM.replaceAll("$0", lang.code).replaceAll("$1", lang.displayName).replaceAll("$2", lang.displayNameEnglish).replaceAll("$3", lang.author));
            });
            cb();
        });
    };
}
var makeAjaxRequest = (url, type, data = "", apiEndpoint = true, cb = () => {}) => {
  if (apiEndpoint) {
      url = KubekPredefined.API_ENDPOINT + url;
  }

  const options = {
      method: type.toUpperCase(),
      headers: {}
  };

  if (data !== "") {
      options.body = data; // Para enviar datos en la solicitud
      // Si necesitas enviar JSON, descomenta la línea siguiente
      // options.headers["Content-Type"] = "application/json";
  }

  fetch(url, options)
      .then(response => {
          if (!response.ok) {
              if (response.status === 403) {
                  KubekAlerts.addAlert(
                      "{{commons.failedToRequest}}", 
                      "warning", 
                      "{{commons.maybeUDoesntHaveAccess}}", 
                      5000
                  );
              }
              throw new Error(`${response.statusText} (status: ${response.status})`);
          }
          return response.json(); // O response.text(), según la respuesta esperada
      })
      .then(data => cb(data))
      .catch((error) => {
          cb(false, error.message, error);
      });
};

function refreshLanguagesList(cb) {
  var apiget = (url, callback, apiEndpoint = true) => {
    makeAjaxRequest(url, "GET", "", apiEndpoint, callback);
  }
  var settingslink = "/kubek/settings"; 
  var languageslink = "/kubek/languages";
  apiget(languageslink, (langs) => {
/*       $("#language-list").html("");
      Object.values(langs).forEach(lang => {
          $("#language-list").append(LANGUAGE_ITEM.replaceAll("$0", lang.code).replaceAll("$1", lang.displayName).replaceAll("$2", lang.displayNameEnglish).replaceAll("$3", lang.author));
      });
      cb(); */
      cb();
      console.log("langs", langs);
      setlangselector(langs);
      return langs;
  });
};
class KubekSettings extends HTMLElement {
  constructor() {
      super();
      this.currentEditorMode = null;
      this.currentConfig = null;
      this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
      this.setupStyles();
      this.setupEventListeners();
      this.init();
  }

  init() {
      this.setTitle("Kubek | Settings");
      refreshLanguagesList(() => {
          //this.setupLanguageClickHandlers();
          this.loadConfig();
          this.refreshUsersList();
      });
  }

  setupStyles() {
      this.shadowRoot.innerHTML = `
          <style>
              .item {
                  display: flex;
                  align-items: center;
                  padding: 10px;
                  cursor: pointer;
              }
              .active {
                  background-color: var(--bg-accent);
              }
              .error {
                  border-color: red;
              }
          </style>
          <div id="main-container">
              <div id="language-list"></div>
              <div id="accounts-list"></div>
              <div class="userEditModal" style="display: none;">
                  <!-- Modal content -->
              </div>
          </div>
      `;
  }

  setTitle(title) {
      document.title = title;
  }

  async getConfig(callback = () => {}) {
      try {
          const response = await fetch('/api/kubek/settings');
          console.log("config", response);
          const config = await response.json();
          callback(config);
      } catch (error) {
          console.error('Error fetching config:', error);
      }
  }

  loadConfig(callback = () => {}) {
      this.getConfig((config) => {
          console.log("config", config);
          this.currentConfig = config;
          this.updateUIWithConfig(config);
          callback();
      });
  }

  updateUIWithConfig(config) {
      const languageItem = this.shadowRoot.querySelector(`#language-list .item[data-lang='${config.language}']`);
      if (languageItem) languageItem.classList.add('active');
      
      this.switchASwitch(this.shadowRoot.querySelector('#ftp-server-enabled'), config.ftpd.enabled);
      this.switchASwitch(this.shadowRoot.querySelector('#auth-enabled'), config.authorization);
      this.switchASwitch(this.shadowRoot.querySelector('#ips-access-switch'), config.allowOnlyIPsList);
      
      // Update input values
      const inputs = {
          'server-port-input': config.webserverPort,
          'ftp-login-input': config.ftpd.username,
          'ftp-password-input': config.ftpd.password,
          'ftp-port-input': config.ftpd.port,
          'subnets-list': config.IPsAllowed.join('\n')
      };

      Object.entries(inputs).forEach(([id, value]) => {
          const input = this.shadowRoot.querySelector(`#${id}`);
          if (input) input.value = value;
      });
  }

  async saveConfig() {
      const newConfig = this.gatherConfigFromUI();
      try {
          const response = await fetch('/kubek/settings', {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(newConfig)
          });
          
          const result = await response.json();
          this.handleSaveResult(result);
      } catch (error) {
          console.error('Error saving config:', error);
          this.showAlert('Error saving configuration', 'error');
      }
  }

  async refreshUsersList() {
      try {
          const response = await fetch('/api/accounts');
          const accounts = await response.json();
          this.renderUsersList(accounts);
      } catch (error) {
          console.error('Error fetching users:', error);
      }
  }

  renderUsersList(accounts) {
      const accountsList = this.shadowRoot.querySelector('#accounts-list');
      accountsList.innerHTML = this.createNewAccountItem();
      
      accounts.forEach(account => {
          accountsList.innerHTML += this.createAccountItem(account);
      });

      //this.setupUserClickHandlers();
  }

  createAccountItem(account) {
      return `
          <div class="item" data-account="${account}">
              <div class="iconBg">
                  <span class="material-symbols-rounded">person</span>
              </div>
              <span>${account}</span>
          </div>
      `;
  }

  createNewAccountItem() {
      return `
          <div class="item" data-account="newAccItem">
              <div class="iconBg">
                  <span class="material-symbols-rounded">add</span>
              </div>
              <span>Add New Account</span>
          </div>
      `;
  }

  switchASwitch(element, state) {
      if (!element) return;
      element.checked = state;
  }

  validateInputs() {
      const inputs = {
          username: this.shadowRoot.querySelector('#username-input'),
          email: this.shadowRoot.querySelector('#email-input'),
          password: this.shadowRoot.querySelector('#password-input')
      };

      const validation = {
          username: /^[a-zA-Z0-9_-]+$/,
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
      };

      let isValid = true;

      Object.entries(inputs).forEach(([key, input]) => {
          if (!input) return;
          
          const value = input.value;
          const isValidInput = key === 'email' && value === '' ? true : validation[key].test(value);
          
          if (!isValidInput) {
              input.classList.add('error');
              isValid = false;
          } else {
              input.classList.remove('error');
          }
      });

      const saveButton = this.shadowRoot.querySelector('#save-btn');
      if (saveButton) {
          saveButton.disabled = !isValid;
      }

      return isValid;
  }

  setupEventListeners() {
      this.shadowRoot.addEventListener('input', (e) => {
          if (e.target.matches('.userEditModal input')) {
              this.validateInputs();
          }
      });

      this.shadowRoot.addEventListener('click', (e) => {
          if (e.target.matches('#save-btn')) {
              this.saveUser();
          } else if (e.target.matches('#delete-account-btn')) {
              this.deleteUser();
          }
      });
  }

  async saveUser() {
      if (!this.validateInputs()) return;

      const userData = this.gatherUserData();
      const url = this.currentEditorMode === 'new' ? '/accounts' : `/accounts/${userData.username}`;

      try {
          const response = await fetch(url, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(userData)
          });

          const result = await response.json();
          this.handleSaveUserResult(result, userData.username);
      } catch (error) {
          console.error('Error saving user:', error);
          this.showAlert('Error saving user', 'error');
      }
  }

  gatherUserData() {
      return {
          username: this.shadowRoot.querySelector('#username-input').value,
          email: this.shadowRoot.querySelector('#email-input').value,
          password: this.shadowRoot.querySelector('#password-input').value,
          permissions: this.getSelectedPermissions(),
          serversRestricted: this.shadowRoot.querySelector('#restrict-servers-access').checked,
          allowedServers: this.getSelectedServersInList()
      };
  }

  getSelectedServersInList() {
      return Array.from(
          this.shadowRoot.querySelectorAll('#allowed-servers-list .item.active')
      ).map(item => item.dataset.server);
  }

  getSelectedPermissions() {
      return Array.from(
          this.shadowRoot.querySelectorAll('.permissions input[type=checkbox]:checked')
      ).map(checkbox => checkbox.id.replace('perm-', ''));
  }

  showAlert(message, type, duration = 5000) {
      const alert = document.createElement('div');
      alert.className = `alert ${type}`;
      alert.textContent = message;
      document.body.appendChild(alert);
      setTimeout(() => alert.remove(), duration);
  }
}

customElements.define('kubek-settings', KubekSettings);
class LanguageSelector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._langs = [];
    this._selectedLang = null;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: rgb(34, 44, 58);
          color: rgb(255, 255, 255);
          padding: 8px;
          border-radius: 8px;
          font-family: Arial, sans-serif;
        }
        .lang-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
        }
        .lang-item {
          padding: 14px;
          gap: 8px;
          cursor: pointer;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          border-radius: 8px;
          background-color: rgb(46, 62, 83);
          color: rgb(255, 255, 255);
        }
        .lang-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .lang-item.selected {
          background-color: rgba(50, 213, 131, 0.1);
          color: rgb(50, 213, 131);
        }
        .author {
          font-size: 14px;
          color: rgb(104, 121, 138);
          margin-left: auto;
        }
        .display-name-english {
          color: rgb(104, 121, 138);
        }
      </style>
      <ul class="lang-list"></ul>
    `;
  }

  static get observedAttributes() {
    return ['selected'];
  }

  get langs() {
    return this._langs;
  }

  set langs(value) {
    this._langs = value;
    this.render();
  }

  get selected() {
    return this._selectedLang;
  }

  set selected(value) {
    if (this._selectedLang !== value) {
      this._selectedLang = value;
      this.dispatchEvent(new CustomEvent('language-change', {
        detail: {
          langCode: value,
          language: this._langs.find(lang => lang.code === value)
        },
        bubbles: true,
        composed: true
      }));
      this.render();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'selected' && oldValue !== newValue) {
      this.selected = newValue;
    }
  }

  render() {
    const list = this.shadowRoot.querySelector('.lang-list');
    list.innerHTML = '';
    console.log('Rendering languages:', this._langs);
    if (!this._langs.length) {
      return;
    }
    this._langs.forEach(lang => {
      const li = document.createElement('li');
      li.className = `lang-item ${lang.code === this._selectedLang ? 'selected' : ''}`;
      li.innerHTML = `
        <span class="display-name">${lang.displayName}</span>
        <span class="display-name-english">${lang.displayNameEnglish}</span>
        <span class="author">by ${lang.author}</span>
      `;
      li.addEventListener('click', () => {
        this.selected = lang.code;
      });
      list.appendChild(li);
    });
  }
}

customElements.define('language-selector', LanguageSelector);
const langSelector = document.querySelector('language-selector');
// transform objeto en array
var objlang = {
  en: {
    code: "en",
    id: "en",
    displayName: "English",
    displayNameEnglish: "English",
    author: "Seeroy"
  },
  es: {
    code: "es",
    id: "es",
    displayName: "Español",
    displayNameEnglish: "Spanish",
    author: "melser"
  },
};
langSelector.langs = Object.values(objlang);
function setlangselector(langs = []) {
  const objtoarray = Object.values(langs);
  if (!langs.length) {
    langSelector.langs = objtoarray;
  } else {
    langSelector.langs = langs;
  }
}
// Listen for language changes
langSelector.addEventListener('language-change', (event) => {
  console.log('Selected language:', event.detail.langCode);
  console.log('Language data:', event.detail.language);
});
/*$(document).ready(function () {
  loadUsersList();
  loadKubekSettings();
  $.get("/kubek/tgOTP", function (otp) {
    $(".tgbot-otp").val(otp);
  });
  $("#tgbot-checkbox").change(function () {
    if ($(this).is(":checked")) {
      $("#tgbot-token-item").show();
      $("#tgbot-otp-item").show();
    } else {
      $("#tgbot-token-item").hide();
      $("#tgbot-otp-item").hide();
    }
  });
  $("#auth-checkbox").change(function () {
    if ($(this).is(":checked")) {
      $("#auth-users-item").show();
      showModal("needtosave-auth-warn-modal", "fadeIn");
      startNSAModalTimeout();
    } else {
      $("#auth-users-item").hide();
    }
  });
  $("#ftpserver-checkbox").change(function () {
    if ($(this).is(":checked")) {
      $("#ftp-login-item").show();
      $("#ftp-pass-item").show();
    } else {
      $("#ftp-login-item").hide();
      $("#ftp-pass-item").hide();
    }
  });

  $("#blurrange-range").change(function () {
    window.localStorage.setItem("blurrange", $(this).val());
    refreshBlurRange();
  });

  $("#backgrounds-select").change(function () {
    window.localStorage.setItem(
      "background",
      $(this).find("option:selected").val()
    );
    refreshBackgroundImage();
  });
  $("#toastspos-select").change(function () {
    window.localStorage.setItem(
      "toastspos",
      $(this).find("option:selected").val()
    );
    refreshToastsPosition();
    Toaster("Test", 800, false, "success");
  });
  $("#fontfamily-select").change(function () {
    window.localStorage.setItem(
      "fontfamily",
      $(this).find("option:selected").val()
    );
    refreshFont();
  });

  $("#noupdatenotify-checkbox").change(function () {
    window.localStorage.setItem(
      "noupdatenotify",
      $(this).is(":checked").toString()
    );
  });
  $("#norounded-checkbox").change(function () {
    window.localStorage.setItem("norounded", $(this).is(":checked").toString());
    refreshNoRounded();
  });
  $("#nolowpriority-checkbox").change(function () {
    window.localStorage.setItem(
      "nolowpriority",
      $(this).is(":checked").toString()
    );
  });
  $("#nobackdrop-checkbox").change(function () {
    window.localStorage.setItem(
      "nobackdrop",
      $(this).is(":checked").toString()
    );
    refreshNoBackdrop();
  });
  $("#simplify-checkbox").change(function () {
    window.localStorage.setItem("simplify", $(this).is(":checked").toString());
    refreshSimplify();
  });
});

function loadKubekSettings() {
  $.get("/kubek/config", function (data) {
    kubekCfg = data;
    if (kubekCfg["ftpd"] == true) {
      $("#ftpserver-checkbox").attr("checked", true);
    }

    if (window.localStorage.getItem("simplify") == "true") {
      $("#simplify-checkbox").attr("checked", true);
    }

    if (window.localStorage.getItem("nobackdrop") == "true") {
      $("#nobackdrop-checkbox").attr("checked", true);
    }

    if (window.localStorage.getItem("blurrange") != null) {
      $("#blurrange-range").val(window.localStorage.getItem("blurrange"));
    }

    if (window.localStorage.getItem("norounded") == "true") {
      $("#norounded-checkbox").attr("checked", true);
    }

    if (window.localStorage.getItem("noupdatenotify") == "true") {
      $("#noupdatenotify-checkbox").attr("checked", true);
    }

    if (window.localStorage.getItem("nolowpriority") == "true") {
      $("#nolowpriority-checkbox").attr("checked", true);
    }

    $.get("/kubek/bgList", function (bgList) {
      bgList.forEach(function (bg, i) {
        iv = i + 1;
        $("#backgrounds-select").append(
          "<option value='" + bg + "'>Image " + iv + "</option>"
        );
      });
      if (window.localStorage.background != null) {
        $(
          "#backgrounds-select option[value='" +
            window.localStorage.background +
            "']"
        ).prop("selected", true);
      }
    });

    if (window.localStorage.getItem("toastspos") != null) {
      $(
        "#toastspos-select option[value='" +
          window.localStorage.getItem("toastspos") +
          "']"
      ).prop("selected", true);
    }

    if (window.localStorage.getItem("fontfamily") != null) {
      $(
        "#fontfamily-select option[value='" +
          window.localStorage.getItem("fontfamily") +
          "']"
      ).prop("selected", true);
    }

    if (kubekCfg["tgbot-enabled"] == true) {
      $("#tgbot-checkbox").attr("checked", true);
      $("#tgbot-token-item").show();
      $("#tgbot-otp-item").show();
      $(".tgbot-token").val(kubekCfg["tgbot-token"]);
    }

    if (kubekCfg["auth"] == true) {
      $("#auth-checkbox").attr("checked", true);
    }

    if (kubekCfg["save-logs"] == true) {
      $("#savelogs-checkbox").attr("checked", true);
    }

    if (kubekCfg["internet-access"] == true) {
      $("#allowintacc-checkbox").attr("checked", true);
    }

    $(".ftppass").val(kubekCfg["ftpd-password"]);
    $(".ftpuser").val(kubekCfg["ftpd-user"]);
    $(".webserverport").val(kubekCfg["webserver-port"]);
    $(".socketport").val(kubekCfg["socket-port"]);

    $.get("/kubek/support-uid", function (supuid) {
      $("#supuid").text(supuid);
    });

    if ($("#tgbot-checkbox").is(":checked")) {
      $("#tgbot-token-item").show();
      $("#tgbot-otp-item").show();
    } else {
      $("#tgbot-token-item").hide();
      $("#tgbot-otp-item").hide();
    }
    if ($("#auth-checkbox").is(":checked")) {
      $("#auth-users-item").show();
    } else {
      $("#auth-users-item").hide();
    }
    if ($("#ftpserver-checkbox").is(":checked")) {
      $("#ftp-login-item").show();
      $("#ftp-pass-item").show();
    } else {
      $("#ftp-login-item").hide();
      $("#ftp-pass-item").hide();
    }
  });

  $("#user-edit-modal .password-input").keyup(function () {
    passwd = $("#user-edit-modal .password-input").val();
    if (passwd.match(PASSWORD_REGEX) != null) {
      $("#user-edit-modal .passwd-err").hide();
    } else {
      $("#user-edit-modal .passwd-err").show();
    }
  });
}

function shutdownKubek() {
  showModal("turnoff-warn-modal", "fadeIn", function () {
    $.get("/kubek/shutdown");
  });
}

function setNewUserMode(bool) {
  if (bool) {
    $("#user-edit-modal #user-edit-modal-label").text("{{adding-usr-ks}}");
    $("#user-edit-modal .input-bg").show();
    $("#user-edit-modal .passwd-err").hide();
    $("#user-edit-modal .buttons-cont").hide();
    modalModeNewUser = true;
  } else {
    $("#user-edit-modal #user-edit-modal-label").text("{{editing-usr-ks}}");
    $("#user-edit-modal .input-bg").hide();
    $("#user-edit-modal .passwd-err").hide();
    $("#user-edit-modal .buttons-cont").show();
    modalModeNewUser = false;
  }
  setModalDefaultValues();
}

function setModalDefaultValues() {
  $("#user-edit-modal input[type=checkbox]:not(:disabled)").each(function () {
    $(this).prop("checked", false);
  });
  $(
    "#user-edit-modal input[type=text], #user-edit-modal input[type=password], #user-edit-modal input[type=email]"
  ).each(function () {
    $(this).val("");
  });
}

function openNewUserModal() {
  setNewUserMode(true);
  setModalDefaultValues();
  showModal("user-edit-modal", "fadeIn", function () {
    saveUser();
  });
}

function saveUser() {
  usrname = $("#user-edit-modal .usrname-input").val();
  mail = $("#user-edit-modal .mail-input").val();
  if (mail == "" || mail.match(EMAIL_REGEX)) {
    if (usrname.match(LOGIN_REGEX)) {
      perms = [];
      $("#user-edit-modal input[type=checkbox]:checked:not(:disabled)").each(
        function () {
          perm = $(this).data("perm");
          perms.push(perm);
        }
      );
      perms = perms.join(",");
      if (modalModeNewUser == true) {
        passwd = $("#user-edit-modal .password-input").val();
        if (passwd.match(PASSWORD_REGEX)) {
          if (mail == "") {
            reqUrl =
              "/auth/newUser?login=" +
              usrname +
              "&permissions=" +
              perms +
              "&password=" +
              passwd;
          } else {
            reqUrl =
              "/auth/newUser?login=" +
              usrname +
              "&mail=" +
              mail +
              "&permissions=" +
              perms +
              "&password=" +
              passwd;
          }
          $.get(reqUrl, function (res) {
            if (res == "Users count is limited to 5 users") {
              Toaster("{{users-limited-count-ks}}", 3000, false, "warning");
            }
            loadUsersList();
          });
        }
      } else {
        $.get(
          "/auth/editUser?login=" +
            usrname +
            "&mail=" +
            mail +
            "&permissions=" +
            perms,
          function () {
            loadUsersList();
          }
        );
      }
    }
  }
}

function setModalDataByUserInfo(userInfo) {
  setModalDefaultValues();
  currEdit = userInfo.username;
  $("#user-edit-modal .usrname-input").val(userInfo.username);
  $("#user-edit-modal .mail-input").val(userInfo.mail);
  perms = userInfo.permissions;
  $("#user-edit-modal input[type=checkbox]").each(function () {
    perm = $(this).data("perm");
    if (perms.includes(perm)) {
      $(this).prop("checked", true);
    }
  });
}

function saveKubekSettings() {
  ftpd = $("#ftpserver-checkbox").is(":checked");
  auth = $("#auth-checkbox").is(":checked");
  savelogs = $("#savelogs-checkbox").is(":checked");
  allowint = $("#allowintacc-checkbox").is(":checked");
  tgbot = $("#tgbot-checkbox").is(":checked");
  if (tgbot == false || $(".tgbot-token").val() != "") {
    if (kubekCfg["tgbot-enabled"] != tgbot && tgbot == true) {
      showModal("about-otp-modal", "fadeIn", function () {
        saveSettingsStage2();
      });
    } else {
      saveSettingsStage2();
    }
  }
}

function saveSettingsStage2() {
  if (kubekCfg["ftpd"] != ftpd) {
    showModal("ftp-need-res-modal", "fadeIn", function () {
      saveSettingsStage3();
    });
  } else {
    saveSettingsStage3();
  }
}

function saveSettingsStage3() {
  if (kubekCfg["internet-access"] != allowint) {
    showModal("othip-need-res-modal", "fadeIn", function () {
      saveSettingsStage35();
    });
  } else {
    saveSettingsStage35();
  }
}

function saveSettingsStage35() {
  if (
    kubekCfg["webserver-port"] != $(".webserverport").val() ||
    kubekCfg["socket-port"] != $(".socketport").val()
  ) {
    if (
      $(".webserverport").val() >= 80 &&
      $(".webserverport").val() <= 65500 &&
      $(".socketport").val() >= 81 &&
      $(".socketport").val() <= 65500
    ) {
      showModal("othport-need-res-modal", "fadeIn", function () {
        saveSettingsStage4();
      });
    }
  } else {
    saveSettingsStage4();
  }
}

function saveSettingsStage4() {
  kubekCfg["ftpd"] = ftpd;
  kubekCfg["auth"] = auth;
  kubekCfg["tgbot-enabled"] = tgbot;
  kubekCfg["internet-access"] = allowint;
  kubekCfg["save-logs"] = savelogs;
  kubekCfg["ftpd-password"] = $(".ftppass").val();
  kubekCfg["ftpd-user"] = $(".ftpuser").val();
  kubekCfg["tgbot-token"] = $(".tgbot-token").val();
  kubekCfg["socket-port"] = $(".socketport").val();
  kubekCfg["webserver-port"] = $(".webserverport").val();
  kubekCfg["tgbot-chatid"] = [];
  $.get(
    "/kubek/saveConfig?data=" + encodeURI(JSON.stringify(kubekCfg)),
    function (data) {
      $.get("/kubek/setFTPDStatus?value=" + ftpd, function (data) {
        location.reload();
      });
    }
  );
}

function changeAdminPass() {
  oldPass = $("#admin-edit-modal .opassword-input").val();
  newPass = $("#admin-edit-modal .npassword-input").val();
  if (oldPass != "" && newPass != "") {
    $.get(
      "/auth/changeAdminPass?oldPass=" + oldPass + "&newPass=" + newPass,
      function (ret) {
        if (ret == true) {
          window.location = "/";
        } else {
          $("#admin-edit-modal .opassword-input").val("");
          $("#admin-edit-modal .npassword-input").val("");
        }
      }
    );
  }
}

function deleteCurrUserAccount() {
  $.get("/auth/deleteUser?login=" + currEdit, function () {
    loadUsersList();
    $("#user-edit-modal").hide();
  });
}

function regenCurrUserHash() {
  $.get("/auth/regenUserHash?login=" + currEdit, function () {
    loadUsersList();
    $("#user-edit-modal").hide();
  });
}

function openEditAdminModal() {
  showModal("admin-edit-modal", "fadeIn", function () {
    changeAdminPass();
  });
}

function openEditUserModal(username) {
  setNewUserMode(false);
  $.get("/auth/getUserInfo?username=" + username, function (usrdata) {
    setModalDataByUserInfo(usrdata);
    showModal("user-edit-modal", "fadeIn", function () {
      saveUser();
    });
  });
}

function loadUsersList() {
  $("#users-list tr:not(.addusr)").each(function () {
    $(this).remove();
  });
  htmlc = "";
  $.get("/auth/listUsers", function (users) {
    htmlc =
      htmlc +
      '<tr class="bg-white dark:bg-gray-800 cursor-pointer" onclick="openEditAdminModal()"><th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"><div class="flex items-center"><i class="ri-user-2-fill text-xl"></i><span style="margin-left: 16px"></span></div></th><td class="px-6 py-4">{{admin-acc-ks}}</td></tr>';
    for (const [key, value] of Object.entries(users)) {
      usr = value;
      if (usr.mail == "undefined" || usr.mail == null || usr.mail == "") {
        usr.mail = "{{mail-no-ks}}";
      }
      if (usr.username != "kubek") {
        htmlc =
          htmlc +
          '<tr class="bg-white dark:bg-gray-800 cursor-pointer" onclick="openEditUserModal(' +
          "'" +
          usr.username +
          "'" +
          ')"><th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"><div class="flex items-center"><i class="ri-user-fill text-xl"></i><span style="margin-left: 16px"></span></div></th><td class="px-6 py-4">' +
          usr.username +
          "</td></tr>";
      }
    }
    $("#users-list").append(htmlc);
  });
}

function startNSAModalTimeout(){
  $("#needtosave-auth-warn-modal button").hide();
  $("#needtosave-auth-warn-modal .nsatimeout-span").text(nsatimeout + "s");
  setInterval(function(){
    if(nsatimeout > 1){
      nsatimeout--;
      $("#needtosave-auth-warn-modal .nsatimeout-span").text(nsatimeout + "s");
    } else {
      $("#needtosave-auth-warn-modal .nsatimeout-span").hide();
      $("#needtosave-auth-warn-modal button").show();
    }
  }, 1000);
}*/