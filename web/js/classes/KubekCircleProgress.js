/* class KubekCircleProgress {
    // Конструктор
    constructor(el, value, radius, centerColor, bgColor, activeColor, text = "") {
        this.value = value;
        this.element = el;
        this.centerColor = centerColor;
        this.bgColor = bgColor;
        this.activeColor = activeColor;
        this.radius = radius;
        if(text !== ""){
            this.text = text;
        } else {
            this.text = value + "%";
        }
    }

    // Создать элемент прогресса
    create() {
        $(this.element).prop("role", "progressbar");
        $(this.element).addClass("circle-progress");
        $(this.element).css("width", this.radius + "px");
        $(this.element).css("height", this.radius + "px");
        $(this.element).html("<span class='text'>" + this.text + "</span>");
        this.refreshColors();
    }

    // Получить прогресс
    getValue() {
        return this.value;
    }

    // Установить прогресс
    setValue(value, updateText = true) {
        this.value = value;
        this.refreshColors();
        if(updateText){
            this.text = value + "%";
            $(this.element).html("<span class='text'>" + this.text + "</span>");
        }
    }

    refreshColors(){
        $(this.element).css("background", KubekCircleProgress.generateGradient(this.centerColor, this.bgColor, this.activeColor, this.value));
    }

    // Установить текст внутрь
    setText(text){
        this.text = text;
        $(this.element).html("<span class='text'>" + this.text + "</span>");
    }

    // Получить установленный текст
    getText(){
        return this.text;
    }

    // Установить главный цвет
    setActiveColor(color){
        this.activeColor = color;
        this.refreshColors();
    }

    // Установить цвет центральной части
    setCenterColor(color){
        this.centerColor = color;
        this.refreshColors();
    }

    // Установить цвет неактивной части прогресса
    setBgColor(color){
        this.bgColor = color;
        this.refreshColors();
    }

    // Сгенерировать градиент для круглого бара
    static generateGradient(centerColor, bgColor, activeColor, value) {
        return 'radial-gradient(closest-side, ' + centerColor + ' 79%, transparent 80% 100%), conic-gradient(' + activeColor + ' ' + value + '%, ' + bgColor + ' 0)'
    }
} */
class KubekCircleProgress1 extends HTMLElement {
    // Constructor
    constructor() {
        super();
        this.value = 0;
        this.centerColor = '#000';
        this.bgColor = '#e0e0e0';
        this.activeColor = '#007bff';
        this.radius = 100;
        this.text = '';
    }

    // Método para observar los atributos que queremos que sean reactivos
    static get observedAttributes() {
        return ['value', 'center-color', 'bg-color', 'active-color', 'radius', 'text'];
    }

    // Método que se llama cuando el elemento es añadido al DOM
    connectedCallback() {
        this.create();
    }

    // Método que se llama cuando un atributo observado cambia
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'value':
                    this.value = parseFloat(newValue);
                    break;
                case 'center-color':
                    this.centerColor = newValue;
                    break;
                case 'bg-color':
                    this.bgColor = newValue;
                    break;
                case 'active-color':
                    this.activeColor = newValue;
                    break;
                case 'radius':
                    this.radius = parseFloat(newValue);
                    break;
                case 'text':
                    this.text = newValue;
                    break;
            }
            this.refreshColors();
            this.updateText(); // Actualizar el texto cuando cambia el atributo
        }
    }

    // Crear el elemento de progreso
    create() {
        this.setAttribute('role', 'progressbar');
        this.classList.add('circle-progress');
        this.style.width = `${this.radius}px`;
        this.style.height = `${this.radius}px`;
        this.innerHTML = `<span class='text'>${this.text || this.value + '%'}</span>`;
        this.refreshColors();
    }

    // Obtener el valor del progreso
    getValue() {
        return this.value;
    }

    // Establecer el valor del progreso
    setValue(value, updateText = true) {
        this.value = value;
        this.setAttribute('value', value);
        if (updateText) {
            this.text = value + '%';
            this.setAttribute('text', this.text); // Actualizar el atributo text
        }
        this.refreshColors();
        this.updateText(); // Actualizar el texto cuando cambia el valor
    }

    // Refrescar los colores del círculo
    refreshColors() {
        this.style.background = this.generateGradient(this.centerColor, this.bgColor, this.activeColor, this.value);
    }

    // Establecer el texto dentro del círculo
    setText(text) {
        this.text = text;
        this.setAttribute('text', text);
        this.updateText(); // Actualizar el texto cuando se establece directamente
    }

    // Obtener el texto establecido
    getText() {
        return this.text;
    }

    // Establecer el color activo
    setActiveColor(color) {
        this.activeColor = color;
        this.setAttribute('active-color', color);
        this.refreshColors();
    }

    // Establecer el color del centro
    setCenterColor(color) {
        this.centerColor = color;
        this.setAttribute('center-color', color);
        this.refreshColors();
    }

    // Establecer el color de fondo
    setBgColor(color) {
        this.bgColor = color;
        this.setAttribute('bg-color', color);
        this.refreshColors();
    }

    // Generar el gradiente para el círculo
    generateGradient(centerColor, bgColor, activeColor, value) {
        return `radial-gradient(closest-side, ${centerColor} 79%, transparent 80% 100%), conic-gradient(${activeColor} ${value}%, ${bgColor} 0)`;
    }

    // Método para actualizar el texto dentro del círculo
    updateText() {
        const textElement = this.querySelector('.text');
        if (textElement) {
            textElement.textContent = this.text || this.value + '%';
        }
    }
}

// Definir el nuevo elemento personalizado
customElements.define('kubek-circle-progress', KubekCircleProgress1);