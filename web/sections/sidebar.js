document.addEventListener("DOMContentLoaded", () => {
  console.log("sidebar", document.querySelector('sidebar-menu'));

    setTimeout(() => {
      document.querySelector('#menu-btn').addEventListener('click', () => {
        document.querySelector('sidebar-menu').toggleSidebar();
        console.log("toggleSidebar", document.querySelector('sidebar-menu'));
    });
        const sidebarItems = document.querySelectorAll("#main-menu-sidebar .sidebar-item");

        sidebarItems.forEach(item => {
            item.addEventListener("click", () => {
                console.log("click", item);
                const page = item.getAttribute("data-page");
                KubekUI.changeItemByPage(page);
                KubekPageManager.gotoPage(page);
            });
        });

        const sidebar = document.querySelector('sidebar-menu');
        sidebar.addEventListener('page-change', (event) => {
          const detail = event.detail;
          console.log('Changing to page:', detail.page);
          KubekUI.changeItemByPage(detail.page);
          KubekPageManager.gotoPage(detail.page);
        });
        setTimeout(() => {
          if (window.location.search.includes("act")) {
            sidebar.setActiveElement(window.location.search.split("act=")[1]);
          } else 
          if (window.localStorage.selectedServer) {
            sidebar.setActiveElement(window.localStorage.selectedServer);
          }
        }, 555);
        sidebar.addEventListener('new-server', () => {
          console.log('Creating new server');
          // Add your new server logic here
          // href="/?act=newServer"
          window.location = '/?act=newServer';
        });
      
        sidebar.addEventListener('toggle-sidebar', () => {
          console.log('Toggling sidebar');
          // Add your sidebar toggle logic here
        });
        sidebar.addEventListener('server-change', (event) => {
        //window.localStorage.selectedServer = `test1231`; window.location.reload()
          console.log('Changing to server:', event.detail);
          window.localStorage.selectedServer = event.detail.server;
          window.location.reload();
        });
    }, 555);
});