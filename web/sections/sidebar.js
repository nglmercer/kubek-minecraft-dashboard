document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const sidebarItems = document.querySelectorAll("#main-menu-sidebar .sidebar-item");

        sidebarItems.forEach(item => {
            item.addEventListener("click", () => {
                console.log("click", item);
                const page = item.getAttribute("data-page");
                KubekUI.changeItemByPage(page);
                KubekPageManager.gotoPage(page);
            });
        });
        const newServerBtn = document.getElementById('new-server-btn');
        newServerBtn.addEventListener('click', () => {
        window.location = '/?act=newServer';
        });
        const sidebar = document.querySelector('sidebar-menu');
        sidebar.toggleSidebar();
        sidebar.addEventListener('page-change', (event) => {
          const detail = event.detail;
          console.log('Changing to page:', detail.page);
/*           KubekUI.changeItemByPage(detail.page);
          KubekPageManager.gotoPage(detail.page); */
        });
      
        sidebar.addEventListener('new-server', () => {
          console.log('Creating new server');
          // Add your new server logic here
        });
      
        sidebar.addEventListener('toggle-sidebar', () => {
          console.log('Toggling sidebar');
          // Add your sidebar toggle logic here
        });
    }, 444);
});