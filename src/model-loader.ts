import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, MToonMaterialLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(30.0, window.innerWidth / window.innerHeight, 0.1, 20.0);
camera.position.set(0.0, 1.0, 5.0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.set(0.0, 1.0, 0.0);
controls.update();

const scene = new THREE.Scene();

let modelOffset = { x: 0, y: 0 };

if (window.electronAPI) {
  window.electronAPI.onMoveModel((event, offset) => {
    modelOffset = offset;
  });
}

const light = new THREE.DirectionalLight(0xffffff, Math.PI);
light.position.set(1.0, 1.0, 1.0).normalize();
scene.add(light);

let currentVrm: any;
const loader = new GLTFLoader();
loader.crossOrigin = 'anonymous';

loader.register((parser) => {
  const mtoonMaterialPlugin = new MToonMaterialLoaderPlugin(parser);
  return new VRMLoaderPlugin(parser, { mtoonMaterialPlugin });
});

function load(url: string) {
  loader.load(
    url,
    (gltf) => {
      const vrm = gltf.userData.vrm;
      VRMUtils.removeUnnecessaryVertices(gltf.scene);
      VRMUtils.combineSkeletons(gltf.scene);
      VRMUtils.combineMorphs(vrm);

      if (currentVrm) {
        scene.remove(currentVrm.scene);
        VRMUtils.deepDispose(currentVrm.scene);
      }

      vrm.scene.traverse((obj: any) => {
        obj.frustumCulled = false;
      });

      currentVrm = vrm;
      scene.add(vrm.scene);
      VRMUtils.rotateVRM0(vrm);
    },
    () => {},
    (error) => {
      console.error('Error loading VRM:', error);
    }
  );
}

load('../assets/model.vrm');

const clock = new THREE.Clock();
clock.start();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (currentVrm) {
    currentVrm.update(delta);
    currentVrm.scene.position.x = modelOffset.x * 0.01;
    currentVrm.scene.position.z = modelOffset.y * 0.01;
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('dragover', (event) => {
  event.preventDefault();
});

window.addEventListener('drop', (event: DragEvent) => {
  event.preventDefault();

  const dt = event.dataTransfer;
  if (!dt) return;

  const files = dt.files;
  if (files.length === 0) return;

  const file = files[0]!
  const blob = new Blob([file], { type: file.type || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  load(url);
});

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
