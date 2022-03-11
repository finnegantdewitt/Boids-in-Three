import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import arcade_carpet from "./img/arcade_carpet.png";
import skybox_back from "./img/sky/skybox_back.png";
import skybox_down from "./img/sky/skybox_down.png";
import skybox_front from "./img/sky/skybox_front.png";
import skybox_left from "./img/sky/skybox_left.png";
import skybox_right from "./img/sky/skybox_right.png";
import skybox_up from "./img/sky/skybox_up.png";
import GUI from "lil-gui";
import Stats from "three/examples/jsm/libs/stats.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
// import AsterFireTitleScreen from "./Arcade_Cabinet_Obj/AsterFire Title screen.png";

let camera, scene, renderer, controls;

const objects = [];
const textObjs = [];
const boids = [];

let raycaster = new THREE.Raycaster();

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let stats;
const objCount = 10;
let colorsFilled = 0;
let isColorsFilled = false;

let isMouseDown = false;
let theGuy;
let pointLightMesh;
let pointLight;

let spotLightHelper;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const color = new THREE.Color();
const white = new THREE.Color().setHex(0xffffff);

init();
animate();

function makeBoids() {
  const Geometry = new THREE.ConeGeometry(1, 3.9, 12);
  const Material = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const edgeAmount = 10;
  const totalAmount = Math.pow(edgeAmount, 3);
  const Mesh = new THREE.InstancedMesh(Geometry, Material, totalAmount);
  const XSpacing = 5;
  const XOffset = 35;
  const YSpacing = 4;
  const YOffset = 1;
  const ZSpacing = 4;
  const ZOffset = -20;
  const matrix = new THREE.Matrix4();
  let matIdx = 0;
  for (let i = 0; i < edgeAmount; i++) {
    for (let j = 0; j < edgeAmount; j++) {
      for (let k = 0; k < edgeAmount; k++) {
        matrix.makeRotationX(-Math.PI / 2);
        matrix.setPosition(
          j * XSpacing + XOffset,
          i * YSpacing + YOffset,
          k * ZSpacing + ZOffset
        );
        Mesh.setMatrixAt(matIdx, matrix);
        Mesh.setColorAt(matIdx, new THREE.Color().setHex(0xffffff));
        matIdx++;
      }
    }
  }
  return Mesh;
}

function init() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.x = 60;
  camera.position.y = 15;
  camera.position.z = 70;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  controls = new PointerLockControls(camera, document.body);

  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");
  const crosshair = document.getElementById("crosshair");
  const crosshairImage = document.getElementById("crosshairImage");
  crosshairImage.style.display = "none";

  instructions.addEventListener("click", function () {
    controls.lock();
  });
  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
    crosshair.style.display = "";
    crosshairImage.style.display = "";
  });
  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
    crosshair.style.display = "none";
    crosshairImage.style.display = "none";
  });
  window.addEventListener("mousedown", () => {
    isMouseDown = true;
  });
  window.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;
      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;
      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;
      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;
    }
  };
  const onKeyUp = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;
      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;
      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  // skybox
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const skybox = cubeTextureLoader.load([
    skybox_left,
    skybox_right,
    skybox_up,
    skybox_down,
    skybox_front,
    skybox_back,
  ]);
  scene.background = skybox;

  // floor plane
  const planeSize = 2000;
  const loader = new THREE.TextureLoader();
  const floorTexture = loader.load(arcade_carpet);
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.magFilter = THREE.NearestFilter;
  floorTexture.repeat.set(planeSize / 64, planeSize / 64);

  const floorMaterial = new THREE.MeshPhongMaterial({
    map: floorTexture,
  });
  const floorGeometry = new THREE.PlaneGeometry(
    planeSize,
    planeSize,
    100,
    100
  ).toNonIndexed();
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.rotation.x = -Math.PI / 2;

  scene.add(floorMesh);

  // basic scene
  let boidsMesh = makeBoids();
  boids.push(boidsMesh);
  scene.add(boidsMesh);

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();

  if (controls.isLocked === true) {
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 5.0 * delta;
    velocity.z -= velocity.z * 5.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) {
      velocity.z -= direction.z * 400.0 * delta;
    }
    if (moveLeft || moveRight) {
      velocity.x -= direction.x * 400.0 * delta;
    }
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    // raycaster stuff
    // let mouse3D = new THREE.Vector3();
    // mouse3D.normalize();
    // controls.getDirection(mouse3D);

    // raycaster.set(camera.position, mouse3D);

    // const intersections = raycaster.intersectObjects(objects);
    // if (intersections.length > 0) {
    //   const closest = intersections.reduce((prev, curr) => {
    //     return prev.distance < curr.distance ? prev : curr;
    //   });

    //   const instanceId = closest.instanceId;
    //   const mesh = closest.object;

    //   mesh.getColorAt(instanceId, color);

    //   if (color.equals(white)) {
    //     mesh.setColorAt(instanceId, color.setHex(Math.random() * 0xffffff));
    //     colorsFilled += 1;
    //     mesh.instanceColor.needsUpdate = true;
    //   }
    // }

    // // check the guy have the mouseDown on him
    // if (isMouseDown) {
    //   const intersected = raycaster.intersectObject(theGuy);
    //   if (intersected.length > 0) {
    //     textObjs.forEach((obj) => {
    //       if (obj.name === "Click Me!") {
    //         obj.visible = false;
    //       }
    //       if (obj.name === "Hello, I have a point light for you") {
    //         obj.visible = true;
    //       }
    //     });
    //     pointLightMesh.visible = true;
    //     pointLight.intensity = 1;
    //   }
    //   console.log(intersected);
    // }

    // // check if shapes have been filled
    // if (colorsFilled === objCount * 3 && !isColorsFilled) {
    //   textObjs.forEach((obj) => {
    //     if (obj.name === "Fill The Colors!") {
    //       obj.visible = false;
    //     }
    //     if (obj.name === "Great job King") {
    //       obj.visible = true;
    //     }
    //   });
    //   isColorsFilled = true;
    // }

    // // causally move shapes
    // const clock = Date.now() * 0.001;
    // const dummy = new THREE.Object3D();
    // const offset = objCount * 2.5;
    // objects.forEach((obj, idx) => {
    //   for (let i = 0; i < objCount; i++) {
    //     dummy.position.set(idx * 5, offset - i * 2.5, -20);
    //     dummy.rotation.y =
    //       Math.sin(i / 4 + clock) +
    //       Math.sin(i / 4 + clock) +
    //       Math.sin(i / 4 + clock);
    //     dummy.rotation.z = dummy.rotation.y * 2;
    //     dummy.updateMatrix();
    //     obj.setMatrixAt(i, dummy.matrix);
    //   }
    //   obj.instanceMatrix.needsUpdate = true;
    // });
  }
  //   spotLightHelper.update();
  prevTime = time;
  renderer.render(scene, camera);
  stats.update();
}
