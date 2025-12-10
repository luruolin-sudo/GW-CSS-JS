import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { EXRLoader } from "./libs/EXRLoader.js"; // ✅ 載入 EXRLoader

// 建立場景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0.15, 0.15, 0.15); // ✅ 黑色背景

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
  45,   // FOV (視角角度)，越小物體越大，越大物體越小
  renderer.domElement.width / renderer.domElement.height, // 畫面寬高比
  0.1,  // 最近能看到的距離 (near clipping plane)
  100   // 最遠能看到的距離 (far clipping plane)
);

camera.position.set(1, 1, 0.2); // 相機在 (x=2, y=1.5, z=2) 的位置
camera.lookAt(0, 0, 0);         // 相機朝向場景中心 (通常是模型的位置)

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1;
controls.maxDistance = 10;

// 燈光
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const light = new THREE.DirectionalLight(0xffffff, 2); // 預設白光，強度 2
light.position.set(2, 3, 4);
scene.add(light);

// ✅ GUI 面板設定
const gui = new dat.GUI();
const settings = {
  autoRotate: false,   // false 關、true 開
  rotateSpeed: 0.01,
  ambientIntensity: 1,
  directionalIntensity: 2 // 初始值同步 2
};

gui.add(settings, "autoRotate").name("自動旋轉");
gui.add(settings, "rotateSpeed", 0.0005, 0.05).name("旋轉速度");

gui.add(settings, "ambientIntensity", 0, 2).name("環境光強度").onChange(v => {
  ambientLight.intensity = v;
});

gui.add(settings, "directionalIntensity", 0, 5).name("方向光強度").onChange(v => {
  light.intensity = v;
});

// ✅ 燈光方向控制
const lightSettings = { x: 2, y: 3, z: 4 };

gui.add(lightSettings, "x", -10, 10).name("燈光 X").onChange(v => {
  light.position.x = v;
});
gui.add(lightSettings, "y", -10, 10).name("燈光 Y").onChange(v => {
  light.position.y = v;
});
gui.add(lightSettings, "z", -10, 10).name("燈光 Z").onChange(v => {
  light.position.z = v;
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
