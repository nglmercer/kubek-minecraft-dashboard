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
    }, 1000);
});