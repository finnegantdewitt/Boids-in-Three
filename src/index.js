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
import Boids from "./Boids.js";

let camera, scene, renderer, controls;

let boids;
const objects = [];

let boidBoxWidth = 300;
let boidBoxHeight = 100;
let boidBoxDepth = 300;

let raycaster = new THREE.Raycaster();
let mouse3D = new THREE.Vector3(); // used for raycaster

const groundLevel = 10;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let pauseBoids = false;
let stats;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

init();
animate();

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

  scene.add(controls.getObject());

  const onKeyPress = function (event) {
    switch (event.code) {
      case "KeyT":
        pauseBoids = !pauseBoids;
        break;
      case "KeyF":
        controls.getDirection(mouse3D);
        raycaster.set(camera.position, mouse3D);
        const intersections = [];
        for (let i = 0; i < boids.length(); i++) {
          intersections.push(...raycaster.intersectObject(boids.get(i).mesh));
        }
        if (intersections.length > 0) {
          const closest = intersections.reduce((prev, curr) => {
            return prev.distance < curr.distance ? prev : curr;
          });
          const mesh = closest.object;
          for (let i = 0; i < boids.length(); i++) {
            if (boids.get(i).mesh.id == mesh.id) {
              // console.log(boids.get(i));
              console.log(
                "Pos: %o\nVel: %o",
                boids.get(i).mesh.position,
                boids.get(i).velocity
              );
            }
          }
          mesh.material.color.setHex(0xff00000);
        }
        break;
      case "KeyU":
        boids.avoidFactor += 1;
        console.log("avoidFactor: %o", boids.avoidFactor);
        break;
      case "KeyJ":
        if (boids.avoidFactor > 0) {
          boids.avoidFactor -= 1;
        }
        console.log("avoidFactor: %o", boids.avoidFactor);
        break;
      case "KeyI":
        boids.alignFactor += 1;
        console.log("alignFactor: %o", boids.alignFactor);
        break;
      case "KeyK":
        if (boids.alignFactor > 0) {
          boids.alignFactor -= 1;
        }
        console.log("alignFactor: %o", boids.alignFactor);
        break;
      case "KeyO":
        boids.centeringFactor += 1;
        console.log("centeringFactor: %o", boids.centeringFactor);
        break;
      case "KeyL":
        if (boids.centeringFactor > 0) {
          boids.centeringFactor -= 1;
        }
        console.log("centeringFactor: %o", boids.centeringFactor);
        break;
    }
  };

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
  document.addEventListener("keypress", onKeyPress);

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
  console.log(floorMesh.position);

  scene.add(floorMesh);

  // Bring In The Boids
  boids = new Boids(scene, boidBoxWidth, boidBoxHeight, boidBoxDepth);
  const gui = new GUI();
  gui.add(boids, "avoidFactor", 0, 100, 1).listen().name("Avoid Factor (U/J)");
  gui
    .add(boids, "alignFactor", 0, 100, 1)
    .listen()
    .name("Alignment Factor (I/K)");
  gui
    .add(boids, "centeringFactor", 0, 100, 1)
    .listen()
    .name("Centering Factor (O/L)");

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
    if (!pauseBoids) {
      boids.moveBoids();
    }
  }
  prevTime = time;
  renderer.render(scene, camera);
  stats.update();
}
