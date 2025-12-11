// ------------------------------------------------------
// ✅ 匯入 Three.js 與相關模組
// ------------------------------------------------------
import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { EXRLoader } from "./libs/EXRLoader.js";


// ------------------------------------------------------
// ✅ 控制面板設定值（由 HTML 滑桿控制）
// ------------------------------------------------------
const settings = {
  autoRotate: false,      // 模型是否自動旋轉
  rotateSpeed: 0.01,      // 模型旋轉速度
  ambientIntensity: 1,    // 環境光強度
  envRotation: 0          // HDRI 旋轉角度（弧度）
};


// ------------------------------------------------------
// ✅ 建立場景
// ------------------------------------------------------
const scene = new THREE.Scene();


// ------------------------------------------------------
// ✅ 建立 Renderer（渲染器）
// ------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ✅ 視窗縮放時更新畫面
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});


// ------------------------------------------------------
// ✅ 建立相機
// ------------------------------------------------------
const camera = new THREE.PerspectiveCamera(
  45,                                 // 視角 FOV
  window.innerWidth / window.innerHeight, // 畫面比例
  0.1,                                // 最近可見距離
  100                                 // 最遠可見距離
);
camera.position.set(1, 1, 0.2);       // 相機位置
camera.lookAt(0, 0, 0);               // 看向模型中心


// ------------------------------------------------------
// ✅ 滑鼠控制 OrbitControls
// ------------------------------------------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;        // 阻尼（更滑順）
controls.dampingFactor = 0.05;


// ------------------------------------------------------
// ✅ 環境光（AmbientLight）
// ------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
scene.add(ambientLight);


// ------------------------------------------------------
// ✅ HTML 控制面板事件綁定
// ------------------------------------------------------

// ✅ 自動旋轉開關
document.getElementById("autoRotate").addEventListener("change", e => {
  settings.autoRotate = e.target.checked;
});

// ✅ 模型旋轉速度
document.getElementById("rotateSpeed").addEventListener("input", e => {
  settings.rotateSpeed = parseFloat(e.target.value);
});

// ✅ 相機視角 FOV
document.getElementById("cameraFov").addEventListener("input", e => {
  camera.fov = parseFloat(e.target.value);
  camera.updateProjectionMatrix(); // 必須更新才能生效
});

// ✅ 環境光強度
document.getElementById("ambientIntensity").addEventListener("input", e => {
  ambientLight.intensity = parseFloat(e.target.value);
});

// ✅ HDRI 旋轉滑桿
document.getElementById("envRotation").addEventListener("input", e => {
  settings.envRotation = THREE.MathUtils.degToRad(parseFloat(e.target.value));
  updateHDRI(settings.envRotation); // ✅ 更新 HDRI 光照 + 背景
});


// ------------------------------------------------------
// ✅ HDRI 光照旋轉核心：旋轉 EXR → 重新 PMREM → 更新光照
// ------------------------------------------------------
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let hdrTexture = null;   // 原始 EXR HDRI
let envMap = null;       // PMREM 生成的光照貼圖
let bgMesh = null;       // HDRI 背景球體

function updateHDRI(angleRad) {
  if (!hdrTexture) return;

  // ✅ 旋轉原始 HDRI（光照來源）
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
  hdrTexture.rotation = angleRad;

  // ✅ 重新 PMREM（產生新的光照貼圖）
  const newEnvMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;

  // ✅ 更新場景光照
  scene.environment = newEnvMap;

  // ✅ 背景球體同步旋轉
  if (bgMesh) {
    bgMesh.rotation.y = angleRad;
  }

  // ✅ 清除舊的 envMap（避免記憶體累積）
  if (envMap) envMap.dispose();
  envMap = newEnvMap;
}


// ------------------------------------------------------
// ✅ 載入 EXR HDRI（背景 + 光照）
// ------------------------------------------------------
new EXRLoader()
  .setPath("./hdr/")
  .load("lebombo.exr", function (texture) {

    hdrTexture = texture; // 保存原始 HDRI

    // ✅ 建立 HDRI 背景球體（可旋轉）
    const bgGeo = new THREE.SphereGeometry(50, 64, 64);
    bgGeo.scale(-1, 1, 1); // 反轉球體，貼圖在內側

    const bgMat = new THREE.MeshBasicMaterial({ map: hdrTexture });
    bgMesh = new THREE.Mesh(bgGeo, bgMat);
    scene.add(bgMesh);

    updateHDRI(0); // 初始角度
  });


// ------------------------------------------------------
// ✅ 載入 GLB 模型
// ------------------------------------------------------
let model;
new GLTFLoader().load("./model/BL-360.glb", gltf => {
  model = gltf.scene;
  scene.add(model);
});


// ------------------------------------------------------
// ✅ 動畫迴圈（每秒 60 次）
// ------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  // ✅ 模型自動旋轉
  if (model && settings.autoRotate) {
    model.rotation.y += settings.rotateSpeed;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
