WebDebugger.registerCallSite('kubekSereverHeaderui.js', 1).stack
// Current server status, initialized as stopped
/**
 * Class responsible for managing the server header UI components
 * and server status updates
 */
class KubekServerHeaderUI {
    /**
     * Refreshes the server header information
     * @param {Function} callback - Callback function to execute after refresh
     */
    static refreshServerHeader(callback) {
        this.loadServerByName(selectedServer, callback);
    }

    /**
     * Loads server information by server name and updates the UI
     * @param {string} server - Name of the server to load
     * @param {Function} callback - Callback function to execute after loading
     */
    static loadServerByName(server, callback = () => {}) {
        KubekServers.getServerInfo(server, (data) => {
            if (data.status !== false) {
                // Update server title
                const captionElement = document.querySelector('.content-header > .caption');
                if (captionElement) {
                    captionElement.textContent = server;
                }

                // Update server status
                this.setServerStatus(data.status);

                // Update server icon
                const iconElement = document.querySelector('.content-header .icon-bg img');
                if (iconElement) {
                    iconElement.src = `/api/servers/${server}/icon?${Date.now()}`;
                }

                callback(true);
            } else {
                callback(false);
            }
        });
    }

    /**
     * Updates the server status in the header and shows/hides relevant buttons
     * @param {string} status - The new server status
     * @returns {boolean} - Success status of the update
     */
    static setServerStatus(status) {
        const statusElement = document.querySelector('status-element');
        
        if (!KubekPredefined.SERVER_STATUSES_TRANSLATE[status]) {
            return false;
        }

        currentServerStatus = status;
        WebDebugger.log("status", status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
        WebDebugger.toggleLogs(false);
        // Hide all conditional elements
        const headerElements = document.querySelectorAll('.content-header .hide-on-change');
        const actionButtons = document.querySelector('action-buttons');
        actionButtons.hideAllButtons();
        headerElements.forEach(element => element.style.display = 'none');
        
        const moreButton = document.querySelector('.content-header #server-more-btn');
        moreButton.style.display = 'none';

        // Show relevant buttons based on status
        switch (status) {
            case KubekPredefined.SERVER_STATUSES.STARTING:
            case KubekPredefined.SERVER_STATUSES.STOPPING:
                statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
                moreButton.style.display = 'block';
                actionButtons.showButton('more-server-actions');
                break;

            case KubekPredefined.SERVER_STATUSES.RUNNING:
                statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
                actionButtons.hideButton('start-server');
                actionButtons.showButton('restart-server');
                actionButtons.showButton('stop-server');
                actionButtons.showButton('more-server-actions');
                document.querySelector('.content-header #server-restart-btn').style.display = 'block';
                document.querySelector('.content-header #server-stop-btn').style.display = 'flex';
                moreButton.style.display = 'block';
                break;

            case KubekPredefined.SERVER_STATUSES.STOPPED:
                document.querySelector('.content-header #server-start-btn').style.display = 'flex';
                statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
                break;
        }

        return true;
    }
}

/**
 * Initializes the dropdown menu for server actions
 */
function initializeServerDropdown() {
    const buttonElement = document.querySelector('#server-more-btn');
    const popupElement = document.querySelector('#server-popup');

    // Add click event listener to show popup
    buttonElement.addEventListener('click', () => {
        popupElement.showAtElement(buttonElement);
    });

    // Define hover styles for dropdown items
    var hoverStyles = `
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

    // Add force quit button to popup
    popupElement.addOption(
        `${hoverStyles}<div class="dropdown-item">
            <span class="material-symbols-rounded">dangerous</span>
            <span class="default-font">Force Quit</span>
        </div>`,
        () => {
            popupElement.hide();
            if (currentServerStatus !== KubekPredefined.SERVER_STATUSES.STOPPED) {
                KubekRequests.get(`/servers/${selectedServer}/kill`);
            }
        }
    );
}
