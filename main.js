import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { EXRLoader } from "./libs/EXRLoader.js";
import * as fflate from "./libs/fflate.module.js"; // ✅ EXRLoader 需要

// ======================================================
// ✅ 基本設定（旋轉速度、環境光強度）
// ======================================================
const settings = {
  rotateSpeed: 0,   // ✅ 一開始不旋轉（你要求的）
  ambientIntensity: 1
};

// ======================================================
// ✅ 建立場景
// ======================================================
const scene = new THREE.Scene();

// ======================================================
// ✅ 建立 Renderer
// ======================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ✅ 視窗縮放
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ======================================================
// ✅ 建立相機
// ======================================================
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// ✅ 判斷是否為手機（螢幕寬度 <= 768px）
const isMobile = window.innerWidth <= 768;

// ✅ 根據裝置調整鏡頭距離
const cameraZ = isMobile ? 3.0 : 0.9;   // 手機拉遠、桌機較近
const cameraY = isMobile ? -0.15 : -0.15;     // 手機視角稍微往上  高度仰角
const cameraX = isMobile ? -0.3 : -0.3;     // 手機視角更置中

// ✅ 套用相機位置
camera.position.set(cameraX, cameraY, cameraZ);
camera.lookAt(-1, 0, 2);

// ✅ 視角也依裝置調整
camera.fov = isMobile ? 45 : 45;
camera.updateProjectionMatrix();
// ======================================================
// ✅ OrbitControls（滑鼠控制）
// ======================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1;
controls.maxDistance = 10;

// ======================================================
// ✅ 環境光
// ======================================================
const ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
scene.add(ambientLight);

// ======================================================
// ✅ UI 滑桿事件
// ======================================================
document.getElementById("rotateSpeed").addEventListener("input", e => {
  settings.rotateSpeed = parseFloat(e.target.value);
});

document.getElementById("ambientIntensity").addEventListener("input", e => {
  ambientLight.intensity = parseFloat(e.target.value);
});

document.getElementById("cameraFov").addEventListener("input", e => {
  camera.fov = parseFloat(e.target.value);
  camera.updateProjectionMatrix();
});

// ======================================================
// ✅ 載入 HDRI（EXR）
// ======================================================
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let envMesh;

new EXRLoader()
  .setPath("./hdr/")
  .load("lebombo.exr", function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap;
    scene.background = envMap;

    // ✅ 建立背景球體
    const geometry = new THREE.SphereGeometry(50, 64, 64);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ map: texture });
    envMesh = new THREE.Mesh(geometry, material);

    // ⭐ 正確放在這裡：Mesh 建立後才能旋轉
    envMesh.rotation.y = THREE.MathUtils.degToRad(45); // ← 你要的角度

    scene.add(envMesh);

    texture.dispose();
    pmremGenerator.dispose();
  });

// ======================================================
// ✅ ✅ ✅ 模型切換系統（旋轉切換動畫）
// ======================================================

// ✅ 目前場景中的模型
let currentModel = null;

// ✅ 是否為第一次載入（用來取消第一次旋轉動畫）
let isFirstLoad = true;

// ✅ 舊模型旋轉離場
function rotateOut(model, onComplete) {
  let progress = 0;

  function animate() {
    progress += 0.05;

    model.rotation.y += 0.08; // ✅ 旋轉速度
    model.position.y -= 0.01; // ✅ 微微下降（更自然）

    if (progress >= 1) {
      scene.remove(model);
      onComplete();
      return;
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// ✅ 新模型旋轉進場
function rotateIn(model) {
  model.rotation.y = Math.PI; // ✅ 從背面開始
  model.position.y = -0.2;    // ✅ 從下方開始

  let progress = 0;

  function animate() {
    progress += 0.05;

    model.rotation.y -= 0.08; // ✅ 旋轉進場  + - 控制旋轉方向
    model.position.y += 0.01; // ✅ 微微上升

    if (progress >= 1) return;

    requestAnimationFrame(animate);
  }

  animate();
}

// ✅ 載入模型（統一管理）
function loadModel(modelPath) {
  const loader = new GLTFLoader();

  loader.load(modelPath, (gltf) => {
    const newModel = gltf.scene;

    // 如果不是第一次載入 → 執行旋轉切換
    if (currentModel && !isFirstLoad) {
      rotateOut(currentModel, () => {
        currentModel = newModel;
        scene.add(currentModel);

        resetCamera();          // ✅ 每次模型切換都回到初始視角
        rotateIn(currentModel); // 旋轉進場
      });
    } else {
      // 第一次載入 → 不旋轉
      currentModel = newModel;
      scene.add(currentModel);

      resetCamera();            // ⭐ 第一次也要確保在正確視角

      isFirstLoad = false;
    }
  });
}

// ======================================================
// ✅ 左下角按鈕事件（切換模型）
// ======================================================
const modelButtons = document.querySelectorAll(".model-btn");

modelButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    modelButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const modelPath = btn.getAttribute("data-model");
    loadModel(modelPath);
  });
});

// ✅ 預設載入 4ft（BL-360）
loadModel("./model/BL-360.glb");
document
  .querySelector('[data-model="./model/BL-360.glb"]')
  .classList.add("active");

// ======================================================
// ✅ 動畫迴圈（自動旋轉）
// ======================================================
function animate() {
  requestAnimationFrame(animate);

  if (currentModel) {
    currentModel.rotation.y += settings.rotateSpeed;
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();
