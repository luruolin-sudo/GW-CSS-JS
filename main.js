import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { EXRLoader } from "./libs/EXRLoader.js";

// ✅ 必須加入這行（ESM 版 fflate）
import * as fflate from "./libs/fflate.module.js";

// ✅ 定義設定值物件
const settings = {
  autoRotate: false,   // 預設不旋轉
  rotateSpeed: 0.005,   // 預設旋轉速度
  ambientIntensity: 1, // 環境光強度
  envRotation: 0       // HDRI 環境旋轉角度
};

// 建立場景
const scene = new THREE.Scene();

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
  45,
  renderer.domElement.width / renderer.domElement.height,
  0.1,
  100
);
camera.position.set(1, 1, 0.2);
camera.lookAt(0, 0, 0);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1;
controls.maxDistance = 10;

// 環境光
const ambientLight = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
scene.add(ambientLight);

// ✅ 綁定控制面板事件
document.getElementById("autoRotate").addEventListener("change", e => {
  settings.autoRotate = e.target.checked;
});


document.getElementById("cameraFov").addEventListener("input", e => {
  camera.fov = parseFloat(e.target.value);
  camera.updateProjectionMatrix();
});

document.getElementById("ambientIntensity").addEventListener("input", e => {
  ambientLight.intensity = parseFloat(e.target.value);
});


// ✅ 載入 EXR HDRI 環境光
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let envMesh;

new EXRLoader()
  .setPath("./hdr/")
  .load("lebombo.exr", function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap;   // ✅ 模型反射用
    scene.background = envMap;    // ✅ 同時顯示背景

    // 建立球體來承載 HDRI
    const geometry = new THREE.SphereGeometry(50, 64, 64);
    geometry.scale(-1, 1, 1); // ✅ 反轉球體，讓貼圖在內側
    const material = new THREE.MeshBasicMaterial({ map: texture });
    envMesh = new THREE.Mesh(geometry, material);
    scene.add(envMesh);

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
