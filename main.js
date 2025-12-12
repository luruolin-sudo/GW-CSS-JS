import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { EXRLoader } from "./libs/EXRLoader.js";
import * as fflate from "./libs/fflate.module.js"; // ✅ EXRLoader 需要

// ✅ 設定值（乾淨版）
const settings = {
  rotateSpeed: 0.003,   // 自動旋轉速度（0 = 不動）
  ambientIntensity: 1   // 環境光強度
};

// ✅ 建立場景
const scene = new THREE.Scene();

// ✅ 建立 renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ✅ 視窗縮放
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ✅ 建立相機
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(1, 1, 0.2);
camera.lookAt(0, 0, 0);

// ✅ OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1;
controls.maxDistance = 10;

// ✅ 環境光
const ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
scene.add(ambientLight);

// ✅ 控制面板事件
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

// ✅ 載入 EXR HDRI
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
    scene.add(envMesh);

    texture.dispose();
    pmremGenerator.dispose();
  });

// ✅ 載入 GLB 模型（改成統一用 loadModel 控制）
let currentModel = null;

// ✅ 載入模型的函式（統一管理）
function loadModel(modelPath) {
  const loader = new GLTFLoader();

  loader.load(modelPath, (gltf) => {
    // 移除舊模型
    if (currentModel) {
      scene.remove(currentModel);
    }

    // 加入新模型
    currentModel = gltf.scene;
    scene.add(currentModel);
  });
}

// ✅ 取得所有模型切換按鈕
const modelButtons = document.querySelectorAll(".model-btn");

// ✅ 設定按鈕點擊事件
modelButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // 移除所有 active 樣式
    modelButtons.forEach((b) => b.classList.remove("active"));

    // 加上 active 樣式
    btn.classList.add("active");

    // 取得 data-model 的路徑
    const modelPath = btn.getAttribute("data-model");

    // ✅ 載入模型
    loadModel(modelPath);
  });
});

// ✅ ✅ ✅ 預設載入 BL‑360（4ft）
loadModel("./model/BL-360.glb");

// ✅ ✅ ✅ 預設讓 4ft 按鈕亮起（修正後）
document
  .querySelector('[data-model="./model/BL-360.glb"]')
  .classList.add("active"




// ✅ 動畫迴圈
function animate() {
  requestAnimationFrame(animate);

  // ✅ 自動旋轉模型（使用 currentModel）
  if (currentModel) {
    currentModel.rotation.y += settings.rotateSpeed;
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();
