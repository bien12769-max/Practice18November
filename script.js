
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// =====================================
// 1. ЭЛЕМЕНТЫ ИНТЕРФЕЙСА
// =====================================

const container = document.getElementById('scene');
const shapeSelect = document.getElementById('shape');
const parameters = document.getElementById('parameters');
const results = document.getElementById('results');

// =====================================
// 2. СОЗДАНИЕ 3D-СЦЕНЫ
// =====================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x0c1422);

const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100
);

camera.position.set(4, 3, 6);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    container.clientWidth,
    container.clientHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

container.appendChild(renderer.domElement);

// Управление камерой
const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2;
controls.maxDistance = 15;

// Освещение
scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const light = new THREE.DirectionalLight(0xffffff, 3);

light.position.set(5, 8, 5);

scene.add(light);

// Сетка
const grid = new THREE.GridHelper(
    10, 10, 0x416080, 0x263b55
);

grid.position.y = -1.5;

scene.add(grid);

// =====================================
// 3. ПАРАМЕТРЫ ФИГУР
// =====================================

const defaults = {
    cube: { a: 2 },
    sphere: { r: 1 },
    cylinder: { r: 1, h: 2 },
    cone: { r: 1, h: 2 },
    pyramid: { a: 2, h: 2 }
};

const dimensions = {
    cube: [
        { key: 'a', label: 'Длина ребра' }
    ],

    sphere: [
        { key: 'r', label: 'Радиус' }
    ],

    cylinder: [
        { key: 'r', label: 'Радиус основания' },
        { key: 'h', label: 'Высота' }
    ],

    cone: [
        { key: 'r', label: 'Радиус основания' },
        { key: 'h', label: 'Высота' }
    ],

    pyramid: [
        { key: 'a', label: 'Сторона основания' },
        { key: 'h', label: 'Высота' }
    ]
};

let currentModel = null;
let currentShape = 'cube';

// =====================================
// 4. ПОЛУЧЕНИЕ РАЗМЕРОВ
// =====================================

function getValues() {
    const values = {};

    for (const item of dimensions[currentShape]) {

        const input = document.getElementById(item.key);

        const value = Number(input.value);

        if (!Number.isFinite(value) || value <= 0 || value > 100) {
            throw new Error('Введите размеры от 0.1 до 100.');
        }

        values[item.key] = value;
    }

    defaults[currentShape] = { ...values };

    return values;
}

// =====================================
// 5. ПОЛЯ ВВОДА
// =====================================

function showParameters() {

    currentShape = shapeSelect.value;

    parameters.innerHTML = '';

    dimensions[currentShape].forEach(item => {

        const div = document.createElement('div');

        div.className = 'parameter';

        const label = document.createElement('label');

        label.textContent = item.label;

        const input = document.createElement('input');

        input.type = 'number';
        input.id = item.key;
        input.min = '0.1';
        input.max = '100';
        input.step = '0.1';
        input.value = defaults[currentShape][item.key];

        div.append(label, input);

        parameters.appendChild(div);
    });

    updateModel();
    calculate();
}

// =====================================
// 6. УДАЛЕНИЕ СТАРОЙ МОДЕЛИ
// =====================================

function removeModel() {

    if (!currentModel) return;

    scene.remove(currentModel);

    currentModel.traverse(object => {

        if (object.geometry) {
            object.geometry.dispose();
        }

        if (object.material) {

            if (Array.isArray(object.material)) {
                object.material.forEach(m => m.dispose());
            } else {
                object.material.dispose();
            }
        }
    });

    currentModel = null;
}

// =====================================
// 7. СОЗДАНИЕ ГЕОМЕТРИЧЕСКИХ ФИГУР
// =====================================

function updateModel() {

    let v;

    try {
        v = getValues();
    } catch (error) {
        return;
    }

    removeModel();

    let geometry;

    switch (currentShape) {

        case 'cube':

            geometry = new THREE.BoxGeometry(
                v.a, v.a, v.a
            );

            break;

        case 'sphere':

            geometry = new THREE.SphereGeometry(
                v.r, 48, 32
            );

            break;

        case 'cylinder':

            geometry = new THREE.CylinderGeometry(
                v.r, v.r, v.h, 48
            );

            break;

        case 'cone':

            geometry = new THREE.ConeGeometry(
                v.r, v.h, 48
            );

            break;

        case 'pyramid':

            geometry = new THREE.ConeGeometry(
                v.a / Math.SQRT2,
                v.h,
                4
            );

            break;
    }

    const material = new THREE.MeshStandardMaterial({
        color: 0x168bd2,
        metalness: 0.15,
        roughness: 0.4
    });

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    const edges = new THREE.EdgesGeometry(geometry);

    const lines = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
            color: 0xffffff
        })
    );

    currentModel = new THREE.Group();

    if (currentShape === 'pyramid') {
        currentModel.rotation.y = Math.PI / 4;
    }

    currentModel.add(mesh);
    currentModel.add(lines);

    scene.add(currentModel);
}

// =====================================
// 8. ВЫЧИСЛЕНИЕ ОБЪЁМА И ПЛОЩАДИ
// =====================================

function calculate() {

    let v;

    try {
        v = getValues();
    } catch (error) {

        results.innerHTML = `<p>${error.message}</p>`;

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
        <h3>Результаты вычислений</h3>

        <p>Фигура:
        <b>${shapeSelect.options[shapeSelect.selectedIndex].text}</b>
        </p>

        <p>Объём:
        <b>${volume.toFixed(3)}</b> куб. ед.
        </p>

        <p>Площадь поверхности:
        <b>${area.toFixed(3)}</b> кв. ед.
        </p>
    `;
}

// =====================================
// 9. СОБЫТИЯ
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

document.getElementById('calculate').addEventListener(
    'click',
    calculate
);

// Сброс положения камеры
document.getElementById('resetView').addEventListener(
    'click',
    () => {

        camera.position.set(4, 3, 6);

        controls.target.set(0, 0, 0);

        controls.update();
    }
);

// =====================================
// 10. ИЗМЕНЕНИЕ РАЗМЕРА ОКНА
// =====================================

window.addEventListener('resize', () => {

    const width = container.clientWidth;

    const height = container.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
});

// =====================================
// 11. ЗАПУСК
// =====================================

showParameters();

renderer.setAnimationLoop(() => {

    controls.update();

    renderer.render(scene, camera);

});
