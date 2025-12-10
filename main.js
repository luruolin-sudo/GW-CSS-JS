import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { EXRLoader } from "./libs/EXRLoader.js"; // ✅ 載入 EXRLoader

// ✅ 定義設定值物件
const settings = {
  autoRotate: false,   // 預設不旋轉
  rotateSpeed: 0.01,   // 預設旋轉速度
  ambientIntensity: 1, // 環境光強度
  directionalIntensity: 2, // 方向光強度
  lightX: 2,   // 方向光初始位置 X
  lightY: 3,   // 方向光初始位置 Y
  lightZ: 4    // 方向光初始位置 Z
};

// 建立場景
const scene = new THREE.Scene();
scene.background = envMap; // ✅ 把 HDRI 當背景顯示
scene.environment = envMap; // ✅ 同時用來做反射

// 建立 renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(1200, 600);
document.body.appendChild(renderer.domElement);
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// 建立相機
const camera = new THREE.PerspectiveCamera(
  45,   // FOV (視角角度)
  renderer.domElement.width / renderer.domElement.height, // 畫面寬高比
  0.1,  // 最近能看到的距離
  100   // 最遠能看到的距離
);

camera.position.set(1, 1, 0.2);
camera.lookAt(0, 0, 0);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1;
controls.maxDistance = 10;

// 燈光
const ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
scene.add(ambientLight);

const light = new THREE.DirectionalLight(0xffffff, settings.directionalIntensity);
light.position.set(settings.lightX, settings.lightY, settings.lightZ);
scene.add(light);

// ✅ 綁定控制面板事件 (HTML + CSS)
document.getElementById("autoRotate").addEventListener("change", e => {
  settings.autoRotate = e.target.checked;
});

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

document.getElementById("directionalIntensity").addEventListener("input", e => {
  light.intensity = parseFloat(e.target.value);
});

document.getElementById("lightX").addEventListener("input", e => {
  light.position.x = parseFloat(e.target.value);
});
document.getElementById("lightY").addEventListener("input", e => {
  light.position.y = parseFloat(e.target.value);
});
document.getElementById("lightZ").addEventListener("input", e => {
  light.position.z = parseFloat(e.target.value);
});

// ✅ 載入 EXR HDRI 環境光
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new EXRLoader()
  .setPath("./hdr/") // HDRI 檔案資料夾
  .load("lebombo.exr", function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap;   // ✅ 模型反射用
    scene.background = new THREE.Color(0x000000); // 背景保持黑色

    texture.dispose();
    pmremGenerator.dispose();
  });

// 載入 GLB 模型
let model;
const loader = new GLTFLoader();
loader.load("./model/BL-360.glb", function (gltf) {
  model = gltf.scene;
  scene.add(model);
});

// 動畫函式
function animate() {
  requestAnimationFrame(animate);

  if (model && settings.autoRotate) {
    model.rotation.y += settings.rotateSpeed;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
