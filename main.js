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

// ✅ 載入 GLB 模型
let model;
const loader = new GLTFLoader();
loader.load("./model/BL-360.glb", function (gltf) {
  model = gltf.scene;
  scene.add(model);
});

// ✅ 動畫迴圈
function animate() {
  requestAnimationFrame(animate);

  // ✅ 自動旋轉（速度 = 0 就不動）
  if (model && settings.rotateSpeed > 0) {
    model.rotation.y += settings.rotateSpeed;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
