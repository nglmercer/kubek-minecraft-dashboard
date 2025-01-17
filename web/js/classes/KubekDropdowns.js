const DROPDOWN_BASE =
    "<div class='dropdown layout-accent-box' id='dropdown-$1' style='left: $2px; top: $3px; z-index: $4;'>$5</div>";
const DROPDOWN_ITEM_BASE =
    "<div class='dropdown-item' data-data='$3'>$2$1</div>";
const DROPDOWN_ITEM_ICON_BASE =
    "<span class='material-symbols-rounded'>$1</span>";

class KubekDropdowns {
    // Функция для добавления нового дропдауна
    static addDropdown(data, posX, posY, zIndex, callback = () => {}) {
        this.removeAllDropdowns();
        let poolElement = document.body;
        let newID = this.generateDropdownID();
        let dropdownItems = "";

        data.forEach((item) => {
            if (typeof item.icon !== "undefined") {
                dropdownItems += DROPDOWN_ITEM_BASE
                    .replaceAll(/\$1/gim, item.text)
                    .replaceAll(
                        /\$2/gim,
                        DROPDOWN_ITEM_ICON_BASE.replace(/\$1/gim, item.icon)
                    )
                    .replaceAll(/\$3/gim, item.data);
            } else {
                dropdownItems += DROPDOWN_ITEM_BASE
                    .replaceAll(/\$1/gim, item.text)
                    .replaceAll(/\$2/gim, "")
                    .replaceAll(/\$3/gim, item.data);
            }
        });

        let dropdownCode = DROPDOWN_BASE
            .replaceAll("$1", newID)
            .replaceAll("$2", posX)
            .replaceAll("$3", posY)
            .replaceAll("$4", zIndex)
            .replaceAll("$5", dropdownItems);

        // Crear y agregar el dropdown al DOM
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = dropdownCode;
        const dropdownElement = tempDiv.firstElementChild;
        poolElement.appendChild(dropdownElement);

        // Agregar eventos a los elementos del dropdown
        const dropdownItemsElements = dropdownElement.querySelectorAll(".dropdown-item");
        dropdownItemsElements.forEach((item) => {
            item.addEventListener("click", () => {
                callback(item.getAttribute("data-data"));
                KubekDropdowns.removeAllDropdowns();
            });
        });
    }

    // Получить ID для нового дропдауна
    static generateDropdownID() {
        return document.querySelectorAll("body .dropdown").length;
    }

    // Удалить все дропдауны
    static removeAllDropdowns() {
        const dropdowns = document.querySelectorAll("body .dropdown");
        dropdowns.forEach((dropdown) => dropdown.remove());
    }
}