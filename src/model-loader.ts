import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, MToonMaterialLoaderPlugin } from '@pixiv/three-vrm';
// idk bugged?
// import { MToonNodeMaterial } from '@pixiv/three-vrm/nodes';

console.debug('⏳ Initializing renderer & scene');

// renderer
const renderer = new THREE.WebGPURenderer();
console.debug('Renderer created:', renderer);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
console.debug('Canvas appended to document.body');

// camera
const camera = new THREE.PerspectiveCamera(30.0, window.innerWidth / window.innerHeight, 0.1, 20.0);
camera.position.set(0.0, 1.0, 5.0);
console.debug('Camera set at', camera.position);

// camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.set(0.0, 1.0, 0.0);
controls.update();
console.debug('OrbitControls initialized, target:', controls.target);

// scene
const scene = new THREE.Scene();
console.debug('Scene initialized');

// light
const light = new THREE.DirectionalLight(0xffffff, Math.PI);
light.position.set(1.0, 1.0, 1.0).normalize();
scene.add(light);
console.debug('DirectionalLight added at', light.position);

// helpers
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
console.debug('Helpers added: GridHelper, AxesHelper');

// gltf and vrm
let currentVrm: any;
const loader = new GLTFLoader();
loader.crossOrigin = 'anonymous';
console.debug('GLTFLoader created');

loader.register((parser) => {
  console.debug('Registering VRM plugin for parser:', parser);
  const mtoonMaterialPlugin = new MToonMaterialLoaderPlugin(parser);
  return new VRMLoaderPlugin(parser, { mtoonMaterialPlugin });
});

function load(url: string) {
  console.log(`▶ Loading VRM from URL: ${url}`);
  loader.load(
    url,
    (gltf) => {
      console.log('✅ GLTF loaded:', gltf);
      const vrm = gltf.userData.vrm;
      console.debug('Extracted VRM:', vrm);

      console.debug('Applying VRMUtils optimizations');
      // VRM.removeUnnecessaryVertices(gltf.scene);
      // VRM.combineSkeletons(gltf.scene);
      // VRM.combineMorphs(vrm);

      if (currentVrm) {
        console.debug('Disposing previous VRM:', currentVrm);
        scene.remove(currentVrm.scene);
        // VRM.deepDispose(currentVrm.scene);
      }

      console.debug('Disabling frustum culling on new VRM');
      vrm.scene.traverse((obj: any) => {
        obj.frustumCulled = false;
      });

      currentVrm = vrm;
      scene.add(vrm.scene);
      console.log('➕ VRM added to scene:', vrm.scene);

      console.debug('Rotating VRM0.0 if needed');
      // VRM.rotateVRM0(vrm);

      console.log('🎉 VRM setup complete:', vrm);
    },
    (progress) => {
      const pct = (100 * progress.loaded / progress.total).toFixed(2);
      console.log(`⏳ Loading model... ${pct}%`);
    },
    (error) => {
      console.error('❌ Error while loading VRM:', error);
    }
  );
}

load('../assets/model.vrm');

// animate
const clock = new THREE.Clock();
clock.start();
console.debug('Animation clock started');

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (currentVrm) {
    currentVrm.update(delta);
    console.debug(`VRM updated (delta: ${delta.toFixed(4)}s)`);
  }

  // renderer.renderAsync returns a Promise
  renderer.renderAsync(scene, camera)
    .then(() => {
      console.debug('Frame rendered');
    })
    .catch((e) => {
      console.error('RenderAsync error:', e);
    });
}

animate();
console.debug('Entering render loop');

// drag & drop handler
window.addEventListener('dragover', (event) => {
  event.preventDefault();
  console.debug('dragover event');
});

window.addEventListener('drop', (event: DragEvent) => {
  event.preventDefault();
  console.log('File dropped');

  // 1) narrow dataTransfer from DragEvent | null to DataTransfer
  const dt = event.dataTransfer;
  if (!dt) {
    console.warn('No DataTransfer object on drop event');
    return;
  }

  // 2) pull out files and guard against empty FileList
  const files = dt.files;
  if (files.length === 0) {
    console.warn('No files found in drop event');
    return;
  }

  // 3) safely grab the first file
  const file = files[0]!;
  console.log('Creating blob URL for file:', file.name);

  // 4) create and load the blob URL
  const blob = new Blob([file], { type: file.type || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  load(url);
});

window.addEventListener('resize', () => {
  console.log('Window resized to', window.innerWidth, 'x', window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
