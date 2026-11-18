
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ======================================
// 1. ЭЛЕМЕНТЫ ИНТЕРФЕЙСА
// ======================================

const container = document.getElementById('scene');
const shapeSelect = document.getElementById('shape');
const parameters = document.getElementById('parameters');
const results = document.getElementById('results');
const arButton = document.getElementById('arButton');
const arStatus = document.getElementById('arStatus');

// ======================================
// 2. СОЗДАНИЕ 3D-СЦЕНЫ
// ======================================

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
    antialias: true,
    alpha: true
});

renderer.setSize(
    container.clientWidth,
    container.clientHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

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

// ======================================
// 3. ПАРАМЕТРЫ ГЕОМЕТРИЧЕСКИХ ФИГУР
// ======================================

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

// ======================================
// 4. ПОЛУЧЕНИЕ РАЗМЕРОВ
// ======================================

function getValues() {
    const values = {};

    for (const item of dimensions[currentShape]) {
        const input = document.getElementById(item.key);
        const value = Number(input.value);

        if (!Number.isFinite(value) || value <= 0 || value > 100) {
            throw new Error('Размер должен быть от 0.1 до 100.');
        }

        values[item.key] = value;
    }

    defaults[currentShape] = { ...values };

    return values;
}

// ======================================
// 5. СОЗДАНИЕ ПОЛЕЙ ВВОДА
// ======================================

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

// ======================================
// 6. УДАЛЕНИЕ ПРЕДЫДУЩЕЙ МОДЕЛИ
// ======================================

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

// ======================================
// 7. СОЗДАНИЕ 3D-ФИГУР
// ======================================

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
                v.a / Math.SQRT2, v.h, 4
            );
            break;
    }

    const material = new THREE.MeshStandardMaterial({
        color: 0x168bd2,
        metalness: 0.15,
        roughness: 0.4
    });

    const mesh = new THREE.Mesh(geometry, material);

    const edges = new THREE.EdgesGeometry(geometry);

    const lines = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
            color: 0xffffff
        })
    );

    currentModel = new THREE.Group();
    currentModel.add(mesh);
    currentModel.add(lines);

    scene.add(currentModel);
}

// ======================================
// 8. МАТЕМАТИЧЕСКИЕ ВЫЧИСЛЕНИЯ
// ======================================

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
            const l = Math.sqrt(v.r ** 2 + v.h ** 2);

            volume = Math.PI * v.r ** 2 * v.h / 3;
            area = Math.PI * v.r * (v.r + l);
            break;
        }

        case 'pyramid': {
            const l = Math.sqrt(v.h ** 2 + (v.a / 2) ** 2);

            volume = v.a ** 2 * v.h / 3;
            area = v.a ** 2 + 2 * v.a * l;
            break;
        }
    }

    results.innerHTML = `
        <h3>Результаты вычислений</h3>
        <p>Объём: <b>${volume.toFixed(3)}</b> куб. ед.</p>
        <p>Площадь поверхности:
        <b>${area.toFixed(3)}</b> кв. ед.</p>
    `;
}

// ======================================
// 9. СОБЫТИЯ ИНТЕРФЕЙСА
// ======================================

shapeSelect.addEventListener('change', showParameters);

parameters.addEventListener('input', () => {
    updateModel();
    calculate();
});

document.getElementById('calculate').addEventListener(
    'click',
    calculate
);

document.getElementById('resetView').addEventListener(
    'click',
    () => {
        camera.position.set(4, 3, 6);
        controls.target.set(0, 0, 0);
        controls.update();
    }
);

// ======================================
// 10. АДАПТАЦИЯ ЭКРАНА
// ======================================

window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
});

// ======================================
// 11. ПОДГОТОВКА AR
// ======================================

const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.12, 0.17, 32),
    new THREE.MeshBasicMaterial({
        color: 0x55ff88,
        side: THREE.DoubleSide
    })
);

reticle.rotation.x = -Math.PI / 2;
reticle.matrixAutoUpdate = false;
reticle.visible = false;

scene.add(reticle);

let hitTestSource = null;
let arSession = null;
let arObjects = [];

const arMaterial = new THREE.MeshStandardMaterial({
    color: 0x168bd2,
    roughness: 0.5
});

// Проверка поддержки AR
async function checkAR() {
    if (!window.isSecureContext) {
        arStatus.textContent =
            'Для AR необходимо HTTPS-соединение или localhost.';
        return;
    }

    if (!navigator.xr) {
        arStatus.textContent =
            'WebXR не обнаружен. Используйте совместимый браузер на Android.';
        return;
    }

    try {
        const supported = await navigator.xr.isSessionSupported(
            'immersive-ar'
        );

        if (supported) {
            arStatus.textContent =
                'AR поддерживается. Можно запускать режим.';
        } else {
            arStatus.textContent =
                'Ваше устройство не поддерживает immersive AR.';
        }
    } catch (error) {
        arStatus.textContent =
            'Не удалось проверить AR: ' + error.message;
    }
}

// Геометрия выбранной фигуры для AR
function createARGeometry() {
    const v = getValues();

    switch (currentShape) {
        case 'cube':
            return new THREE.BoxGeometry(v.a, v.a, v.a);

        case 'sphere':
            return new THREE.SphereGeometry(v.r, 32, 24);

        case 'cylinder':
            return new THREE.CylinderGeometry(v.r, v.r, v.h, 32);

        case 'cone':
            return new THREE.ConeGeometry(v.r, v.h, 32);

        case 'pyramid':
            return new THREE.ConeGeometry(
                v.a / Math.SQRT2, v.h, 4
            );
    }
}

// Размещение фигуры на поверхности
function placeARObject() {
    if (!reticle.visible) return;

    let geometry;

    try {
        geometry = createARGeometry();
    } catch (error) {
        arStatus.textContent = error.message;
        return;
    }

    const object = new THREE.Mesh(geometry, arMaterial.clone());

    object.position.setFromMatrixPosition(reticle.matrix);
    object.quaternion.setFromRotationMatrix(reticle.matrix);

    // Размер модели в метрах: масштаб 0.25
    object.scale.setScalar(0.25);

    scene.add(object);
    arObjects.push(object);

    arStatus.textContent =
        'Фигура размещена! Можно выбрать другое место.';
}

// Запуск AR
async function startAR() {
    arButton.disabled = true;
    arStatus.textContent = 'Запускаем дополненную реальность...';

    try {
        if (!window.isSecureContext) {
            throw new Error(
                'Нужен HTTPS. Откройте приложение через защищённый адрес.'
            );
        }

        if (!navigator.xr) {
            throw new Error(
                'WebXR недоступен. Попробуйте Chrome на совместимом Android.'
            );
        }

        const supported = await navigator.xr.isSessionSupported(
            'immersive-ar'
        );

        if (!supported) {
            throw new Error(
                'Устройство не поддерживает AR.'
            );
        }

        arSession = await navigator.xr.requestSession(
            'immersive-ar',
            {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: document.body }
            }
        );

        scene.background = null;
        renderer.setClearColor(0x000000, 0);

        await renderer.xr.setSession(arSession);

        const viewerSpace = await arSession.requestReferenceSpace(
            'viewer'
        );

        hitTestSource = await arSession.requestHitTestSource({
            space: viewerSpace
        });

        arSession.addEventListener(
            'select',
            placeARObject
        );

        arSession.addEventListener('end', () => {
            hitTestSource = null;
            arSession = null;

            reticle.visible = false;

            scene.background = new THREE.Color(0x0c1422);
            renderer.setClearColor(0x0c1422, 1);

            arObjects.forEach(object => {
                scene.remove(object);
                object.geometry.dispose();
                object.material.dispose();
            });

            arObjects = [];

            arStatus.textContent = 'AR-сеанс завершён.';
            arButton.disabled = false;
        });

        arStatus.textContent =
            'Наведите камеру на поверхность. Нажмите на экран для размещения фигуры.';

    } catch (error) {
        console.error('AR error:', error);

        arStatus.textContent = 'Ошибка AR: ' + error.message;

        if (arSession) {
            try {
                await arSession.end();
            } catch {}
        }

        arButton.disabled = false;
    }
}

arButton.addEventListener('click', startAR);

// ======================================
// 12. ЗАПУСК ПРИЛОЖЕНИЯ
// ======================================

showParameters();

checkAR();

renderer.setAnimationLoop((time, frame) => {
    if (frame && hitTestSource) {
        const referenceSpace = renderer.xr.getReferenceSpace();

        const hits = frame.getHitTestResults(hitTestSource);

        if (hits.length > 0) {
            const pose = hits[0].getPose(referenceSpace);

            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
        } else {
            reticle.visible = false;
        }
    }

    if (!renderer.xr.isPresenting) {
        controls.update();
    }

    renderer.render(scene, camera);
});
