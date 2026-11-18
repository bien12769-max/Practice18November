
// =====================================
// 1. ЭЛЕМЕНТЫ ИНТЕРФЕЙСА
// =====================================

const shapeSelect = document.getElementById('arShape');
const parameters = document.getElementById('arParameters');
const results = document.getElementById('arResults');
const status = document.getElementById('arStatus');

const model = document.getElementById('arModel');
const marker = document.getElementById('hiroMarker');

// =====================================
// 2. ПАРАМЕТРЫ ФИГУР
// Размеры указываются в метрах
// =====================================

const defaults = {
    cube: { a: 0.5 },
    sphere: { r: 0.3 },
    cylinder: { r: 0.25, h: 0.6 },
    cone: { r: 0.25, h: 0.6 },
    pyramid: { a: 0.5, h: 0.6 }
};

const dimensions = {
    cube: [
        { key: 'a', label: 'Длина ребра (м)' }
    ],

    sphere: [
        { key: 'r', label: 'Радиус (м)' }
    ],

    cylinder: [
        { key: 'r', label: 'Радиус основания (м)' },
        { key: 'h', label: 'Высота (м)' }
    ],

    cone: [
        { key: 'r', label: 'Радиус основания (м)' },
        { key: 'h', label: 'Высота (м)' }
    ],

    pyramid: [
        { key: 'a', label: 'Сторона основания (м)' },
        { key: 'h', label: 'Высота (м)' }
    ]
};

let currentShape = 'cube';

// =====================================
// 3. СОЗДАНИЕ ПОЛЕЙ ВВОДА
// =====================================

function showParameters() {

    currentShape = shapeSelect.value;

    parameters.innerHTML = '';

    dimensions[currentShape].forEach(item => {

        const label = document.createElement('label');

        label.textContent = item.label;

        const input = document.createElement('input');

        input.type = 'number';
        input.id = item.key;
        input.min = '0.05';
        input.max = '2';
        input.step = '0.05';

        input.value = defaults[currentShape][item.key];

        parameters.appendChild(label);
        parameters.appendChild(input);

    });

    updateModel();
    calculate();
}

// =====================================
// 4. ПОЛУЧЕНИЕ РАЗМЕРОВ
// =====================================

function getValues() {

    const values = {};

    dimensions[currentShape].forEach(item => {

        const input = document.getElementById(item.key);

        const value = Number(input.value);

        if (!Number.isFinite(value) || value < 0.05 || value > 2) {
            throw new Error(
                'Размер должен быть от 0.05 до 2 метров.'
            );
        }

        values[item.key] = value;

    });

    defaults[currentShape] = { ...values };

    return values;
}

// =====================================
// 5. ОБНОВЛЕНИЕ 3D-МОДЕЛИ НА МАРКЕРЕ
// =====================================

function updateModel() {

    let v;

    try {
        v = getValues();
    } catch (error) {
        status.textContent = error.message;
        return;
    }

    let geometry;
    let positionY;
    let rotationY = 0;

    switch (currentShape) {

        case 'cube':

            geometry = {
                primitive: 'box',
                width: v.a,
                height: v.a,
                depth: v.a
            };

            positionY = v.a / 2;

            break;

        case 'sphere':

            geometry = {
                primitive: 'sphere',
                radius: v.r,
                segmentsWidth: 32,
                segmentsHeight: 24
            };

            positionY = v.r;

            break;

        case 'cylinder':

            geometry = {
                primitive: 'cylinder',
                radius: v.r,
                height: v.h,
                segmentsRadial: 48
            };

            positionY = v.h / 2;

            break;

        case 'cone':

            geometry = {
                primitive: 'cone',
                radiusBottom: v.r,
                radiusTop: 0,
                height: v.h,
                segmentsRadial: 48
            };

            positionY = v.h / 2;

            break;

        case 'pyramid':

            geometry = {
                primitive: 'cone',
                radiusBottom: v.a / Math.SQRT2,
                radiusTop: 0,
                height: v.h,
                segmentsRadial: 4
            };

            positionY = v.h / 2;
            rotationY = 45;

            break;
    }

    model.setAttribute('geometry', geometry);

    model.setAttribute('position', {
        x: 0,
        y: positionY,
        z: 0
    });

    model.setAttribute('rotation', {
        x: 0,
        y: rotationY,
        z: 0
    });

    model.setAttribute('material', {
        color: '#168bd2',
        metalness: 0.15,
        roughness: 0.4
    });

}

// =====================================
// 6. МАТЕМАТИЧЕСКИЕ ВЫЧИСЛЕНИЯ
// =====================================

function calculate() {

    let v;

    try {
        v = getValues();
    } catch (error) {

        results.textContent = error.message;

        return;
    }

    let volume = 0;
    let area = 0;

    switch (currentShape) {

        case 'cube':

            volume = v.a ** 3;

            area = 6 * v.a ** 2;

            break;

        case 'sphere':

            volume = 4 / 3 * Math.PI * v.r ** 3;

            area = 4 * Math.PI * v.r ** 2;

            break;

        case 'cylinder':

            volume = Math.PI * v.r ** 2 * v.h;

            area = 2 * Math.PI * v.r * (v.r + v.h);

            break;

        case 'cone': {

            const l = Math.sqrt(
                v.r ** 2 + v.h ** 2
            );

            volume = Math.PI * v.r ** 2 * v.h / 3;

            area = Math.PI * v.r * (v.r + l);

            break;
        }

        case 'pyramid': {

            const l = Math.sqrt(
                v.h ** 2 + (v.a / 2) ** 2
            );

            volume = v.a ** 2 * v.h / 3;

            area = v.a ** 2 + 2 * v.a * l;

            break;
        }
    }

    results.innerHTML = `
        <p>Объём:
        <b>${volume.toFixed(4)}</b> м³
        </p>

        <p>Площадь поверхности:
        <b>${area.toFixed(4)}</b> м²
        </p>
    `;
}

// =====================================
// 7. ПЕРЕКЛЮЧЕНИЕ ФИГУР
// =====================================

shapeSelect.addEventListener(
    'change',
    showParameters
);

parameters.addEventListener(
    'input',
    () => {
        updateModel();
        calculate();
    }
);

document.getElementById('arCalculate').addEventListener(
    'click',
    () => {
        updateModel();
        calculate();
    }
);

// =====================================
// 8. РАСПОЗНАВАНИЕ МАРКЕРА
// =====================================

marker.addEventListener('markerFound', () => {

    status.textContent =
        'Маркер обнаружен! Геометрическая фигура отображается в AR.';

});

marker.addEventListener('markerLost', () => {

    status.textContent =
        'Маркер потерян. Наведите камеру на него снова.';

});

// =====================================
// 9. ЗАПУСК ПРИЛОЖЕНИЯ
// =====================================

showParameters();

document.querySelector('#arScene').addEventListener(
    'camera-init',
    () => {
        status.textContent =
            'Камера запущена. Наведите её на маркер Hiro.';
    }
);

document.querySelector('#arScene').addEventListener(
    'camera-error',
    event => {
        console.error(event);

        status.textContent =
            'Не удалось запустить камеру. Проверьте разрешения браузера.';
    }
);
