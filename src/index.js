import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper";
import arcade_carpet from "./img/arcade_carpet.png";
import skybox_back from "./img/sky/skybox_back.png";
import skybox_down from "./img/sky/skybox_down.png";
import skybox_front from "./img/sky/skybox_front.png";
import skybox_left from "./img/sky/skybox_left.png";
import skybox_right from "./img/sky/skybox_right.png";
import skybox_up from "./img/sky/skybox_up.png";
import GUI from "lil-gui";
import Stats from "three/examples/jsm/libs/stats.module";

class Boid {
  constructor(mesh) {
    this.mesh = mesh;
    this.meshHelper = new THREE.BoxHelper(mesh, 0xffff00);
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.lookAt = new THREE.Vector3();
    this.velocity.set(Math.random(), Math.random(), Math.random()).normalize();
  }
  move() {
    if (this.mesh.position.x > 100 || this.mesh.position.x < -100) {
      this.velocity.x = -this.velocity.x;
    }
    if (this.mesh.position.y > 100 || this.mesh.position.y < 1) {
      this.velocity.y = -this.velocity.y;
    }
    if (this.mesh.position.z > 100 || this.mesh.position.z < -100) {
      this.velocity.z = -this.velocity.z;
    }

    let targetVec = new THREE.Vector3().subVectors(
      this.mesh.position,
      this.velocity
    );
    this.mesh.lookAt(targetVec);

    this.mesh.position.x += -this.velocity.x;
    this.mesh.position.y += -this.velocity.y;
    this.mesh.position.z += -this.velocity.z;
    this.meshHelper.update();
  }
}

let camera, scene, renderer, controls;

const objects = [];
const textObjs = [];
const boids = [];
const edgeAmount = 3;

let raycaster = new THREE.Raycaster();

const groundLevel = 10;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let stats;
const objCount = 10;
let colorsFilled = 0;
let isColorsFilled = false;

let isMouseDown = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

init();
animate();

function makeIndividualBoids() {
  const boidGeo = new THREE.ConeGeometry(1, 3.9, 12);
  boidGeo.rotateX(Math.PI * 0.5);
  const boidMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const XSpacing = 5;
  const XOffset = 35;
  const YSpacing = 4;
  const YOffset = 2;
  const ZSpacing = 4;
  const ZOffset = -20;
  for (let i = 0; i < edgeAmount; i++) {
    for (let j = 0; j < edgeAmount; j++) {
      for (let k = 0; k < edgeAmount; k++) {
        const boidMesh = new THREE.Mesh(boidGeo, boidMat);
        boidMesh.translateX(j * XSpacing + XOffset);
        boidMesh.translateY(i * YSpacing + YOffset);
        boidMesh.translateZ(k * ZSpacing + ZOffset);
        const newBoid = new Boid(boidMesh);
        boids.push(newBoid);
      }
    }
  }
}

function init() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.x = 60;
  camera.position.y = groundLevel;
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
      case "KeyE":
        moveUp = true;
        break;
      case "ArrowRight":
      case "KeyQ":
        moveDown = true;
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
      case "KeyE":
        moveUp = false;
        break;
      case "ArrowRight":
      case "KeyQ":
        moveDown = false;
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
  makeIndividualBoids();
  for (let i = 0; i < boids.length; i++) {
    scene.add(boids[i].mesh);
    // scene.add(boids[i].meshHelper);
    // scene.add(boids[i].meshVertexNormalHelper);
  }

  // add wire box for boids
  const boidBoxMesh = new THREE.LineSegments(
    box(200, 100, 200),
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 1,
      scale: 1,
      dashSize: 3,
      gapSize: 1,
    })
  );
  boidBoxMesh.computeLineDistances();
  boidBoxMesh.translateY(50);
  scene.add(boidBoxMesh);

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
    velocity.y -= velocity.y * 5.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.y = Number(moveDown) - Number(moveUp);
    direction.normalize();

    if (moveForward || moveBackward) {
      velocity.z -= direction.z * 400.0 * delta;
    }
    if (moveLeft || moveRight) {
      velocity.x -= direction.x * 400.0 * delta;
    }
    if (moveUp || moveDown) {
      velocity.y -= direction.y * 400.0 * delta;
    }
    if (controls.getObject().position.y < groundLevel) {
      controls.getObject().position.y = groundLevel;
      velocity.y = 0;
    }
    controls.getObject().position.y += velocity.y * delta;
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    for (let i = 0; i < boids.length; i++) {
      boids[i].move();
    }
  }
  prevTime = time;
  renderer.render(scene, camera);
  stats.update();
}

function box(width, height, depth) {
  (width = width * 0.5), (height = height * 0.5), (depth = depth * 0.5);

  const geometry = new THREE.BufferGeometry();
  const position = [];

  position.push(
    -width,
    -height,
    -depth,
    -width,
    height,
    -depth,

    -width,
    height,
    -depth,
    width,
    height,
    -depth,

    width,
    height,
    -depth,
    width,
    -height,
    -depth,

    width,
    -height,
    -depth,
    -width,
    -height,
    -depth,

    -width,
    -height,
    depth,
    -width,
    height,
    depth,

    -width,
    height,
    depth,
    width,
    height,
    depth,

    width,
    height,
    depth,
    width,
    -height,
    depth,

    width,
    -height,
    depth,
    -width,
    -height,
    depth,

    -width,
    -height,
    -depth,
    -width,
    -height,
    depth,

    -width,
    height,
    -depth,
    -width,
    height,
    depth,

    width,
    height,
    -depth,
    width,
    height,
    depth,

    width,
    -height,
    -depth,
    width,
    -height,
    depth
  );

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(position, 3)
  );

  return geometry;
}
