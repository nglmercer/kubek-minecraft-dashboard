let loadedScript;

class KubekPageManager {
    // Load page
    static gotoPage(page) {
        this.loadPageContent(page);
    }

    // Load page content into block (function without checks)
    static loadPageContent(page) {
        const contentPlace = document.getElementById('content-place');
        contentPlace.innerHTML = '';
        
        const preloader = document.createElement('div');
        preloader.id = 'content-preloader';
        preloader.innerHTML = '<div class="lds-spinner"><div></div><div></div><div></div></div>';
        contentPlace.appendChild(preloader);
        
        console.log("[UI]", "Trying to load page:", page);

        fetch(`/pages/${page}.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(result => {
                console.log("[UI]", "We got page content");
                KubekPageManager.setPageURL(page);
                KubekUI.setActiveItemByPage(page);

                setTimeout(() => {
                    // Dynamically load page script
                    if (typeof loadedScript !== "undefined") {
                        document.head.removeChild(loadedScript);
                    }
                    loadedScript = document.createElement("script");
                    loadedScript.src = `/pages/${page}.js`;
                    document.head.appendChild(loadedScript);

                    // Load the page itself
                    contentPlace.insertAdjacentHTML('beforeend', result);
                    document.getElementById('content-preloader').remove();
                }, 100);
            })
            .catch(error => {
                console.error(
                    "[UI]",
                    "Error happened when loading page:",
                    error.message
                );
                this.gotoPage("console");
            });
    }

    // Update parameter in browser URL
    static updateURLParameter(url, param, paramVal) {
        const urlObj = new URL(url);
        urlObj.searchParams.set(param, paramVal);
        return urlObj.toString();
    }

    // Set browser URL
    static setPageURL(page) {
        window.history.replaceState(
            "",
            "",
            this.updateURLParameter(window.location.href, "act", page)
        );
    }
}