import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { EXRLoader } from "./libs/EXRLoader.js";

// ✅ 控制面板設定
const settings = {
  autoRotate: false,
  rotateSpeed: 0.01,
  ambientIntensity: 1
};

// ✅ 場景
const scene = new THREE.Scene();

// ✅ Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ✅ 視窗縮放
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ✅ 相機
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

// ✅ 環境光
const ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
scene.add(ambientLight);

// ✅ 控制面板事件
document.getElementById("autoRotate").addEventListener("change", e => {
  settings.autoRotate = e.target.checked;
});

document.getElementById("rotateSpeed").addEventListener("input", e => {
  settings.rotateSpeed = parseFloat(e.target.value);
});

document.getElementById("cameraFov").addEventListener("input", e => {
  camera.fov = parseFloat(e.target.value);
  camera.updateProjectionMatrix();
});

document.getElementById("ambientIntensity").addEventListener("input", e => {
  ambientLight.intensity = parseFloat(e.target.value);
});

// ✅ HDRI 光照旋轉核心
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let hdrTexture = null;
let envMap = null;
let bgMesh = null;

// ✅ 更新 HDRI 光照（背景球體同步旋轉）
function updateHDRI(angleRad) {
  if (!hdrTexture) return;

  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
  hdrTexture.rotation = angleRad;

  const newEnvMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;

  scene.environment = newEnvMap;

  if (bgMesh) bgMesh.rotation.y = angleRad;

  if (envMap) envMap.dispose();
  envMap = newEnvMap;
}

// ✅ 載入 HDRI
new EXRLoader()
  .setPath("./hdr/")
  .load("lebombo.exr", function (texture) {
    hdrTexture = texture;

    // ✅ 建立背景球體
    const geo = new THREE.SphereGeometry(50, 64, 64);
    geo.scale(-1, 1, 1);

    const mat = new THREE.MeshBasicMaterial({ map: hdrTexture });
    bgMesh = new THREE.Mesh(geo, mat);
    scene.add(bgMesh);

    updateHDRI(0); // 初始角度
  });

// ✅ 載入模型
let model;
new GLTFLoader().load("./model/BL-360.glb", gltf => {
  model = gltf.scene;
  scene.add(model);
});

// ✅ 動畫
function animate() {
  requestAnimationFrame(animate);

  if (model && settings.autoRotate) {
    model.rotation.y += settings.rotateSpeed;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
