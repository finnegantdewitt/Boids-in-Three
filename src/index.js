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

let camera, scene, renderer, controls;

const objects = [];

let raycaster = new THREE.Raycaster();

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let stats;
const objCount = 10;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();
const white = new THREE.Color().setHex(0xffffff);

init();
animate();

function makeIcosahedron() {
  const Geometry = new THREE.IcosahedronGeometry(1);
  const Material = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const Count = objCount;
  const Mesh = new THREE.InstancedMesh(Geometry, Material, Count);
  const Offset = Count * 2.5;
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < Count; i++) {
    matrix.setPosition(0, Offset - i * 2.5, -20);
    Mesh.setMatrixAt(i, matrix);
    Mesh.setColorAt(i, new THREE.Color().setHex(0xffffff));
  }
  return Mesh;
}

function makeCubes() {
  const Geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
  const Material = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const Count = objCount;
  const Mesh = new THREE.InstancedMesh(Geometry, Material, Count);
  const Offset = Count * 2.5;
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < Count; i++) {
    matrix.setPosition(5, Offset - i * 2.5, -20);
    Mesh.setMatrixAt(i, matrix);
    Mesh.setColorAt(i, new THREE.Color().setHex(0xffffff));
  }
  return Mesh;
}
function makeCylinders() {
  const Geometry = new THREE.CylinderGeometry(1.3, 1.3, 1, 12);
  const Material = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const Count = objCount;
  const Mesh = new THREE.InstancedMesh(Geometry, Material, Count);
  const Offset = Count * 2.5;
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < Count; i++) {
    matrix.setPosition(10, Offset - i * 2.5, -20);
    Mesh.setMatrixAt(i, matrix);
    Mesh.setColorAt(i, new THREE.Color().setHex(0xffffff));
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
  camera.position.y = 10;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  controls = new PointerLockControls(camera, document.body);

  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");
  const crosshair = document.getElementById("crosshair");

  instructions.addEventListener("click", function () {
    controls.lock();
  });
  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
    crosshair.style.display = "";
  });
  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
    crosshair.style.display = "none";
  });

  scene.add(controls.getObject());

  //   const spotLight = new THREE.SpotLight(0xffffff, 1);
  //   spotLight.position.set(...camera.position);
  //   spotLight.target.position.set(
  //     spotLight.position.x,
  //     camera.position.y / 2,
  //     camera.position.z + 10
  //   );
  //   spotLight.angle = Math.PI / 4;
  //   camera.add(spotLight);
  //   camera.add(spotLight.target);
  //   console.log(camera);
  //   let spotLightHelper = new THREE.SpotLightHelper(spotLight);
  //   camera.add(spotLightHelper);

  //   let gui = new GUI();
  //   gui
  //     .add(spotLight.position, "x", 0, 100, 1)
  //     .name("x")
  //     .onChange((x) => {
  //       spotLight.position.x = x;
  //       spotLight.target.position.set(
  //         spotLight.position.x,
  //         spotLight.position.y / 2,
  //         spotLight.position.z
  //       );
  //     });
  //   gui
  //     .add(spotLight.position, "y", 0, 100, 1)
  //     .name("y")
  //     .onChange((y) => {
  //       spotLight.position.y = y;
  //       spotLight.target.position.set(
  //         spotLight.position.x,
  //         spotLight.position.y / 2,
  //         spotLight.position.z
  //       );
  //     });
  //   gui
  //     .add(spotLight.position, "z", 0, 100, 1)
  //     .name("z")
  //     .onChange((z) => {
  //       spotLight.position.z = z;
  //       spotLight.target.position.set(
  //         spotLight.position.x,
  //         spotLight.position.y / 2,
  //         spotLight.position.z
  //       );
  //     });
  //   gui.add(spotLight, "angle", 0, Math.PI / 3, Math.PI / 180).name("angle");
  //   gui.open();

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
  let spheresMesh = makeIcosahedron();
  objects.push(spheresMesh);
  scene.add(spheresMesh);

  let cubesMesh = makeCubes();
  objects.push(cubesMesh);
  scene.add(cubesMesh);

  let cylindersMesh = makeCylinders();
  objects.push(cylindersMesh);
  scene.add(cylindersMesh);

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
    let mouse3D = new THREE.Vector3();
    mouse3D.normalize();
    controls.getDirection(mouse3D);

    raycaster.set(camera.position, mouse3D);

    const intersections = raycaster.intersectObjects(objects);
    if (intersections.length > 0) {
      const closest = intersections.reduce((prev, curr) => {
        return prev.distance < curr.distance ? prev : curr;
      });

      const instanceId = closest.instanceId;
      const mesh = closest.object;

      mesh.getColorAt(instanceId, color);

      if (color.equals(white)) {
        mesh.setColorAt(instanceId, color.setHex(Math.random() * 0xffffff));
        mesh.instanceColor.needsUpdate = true;
      }
    }

    // causally move shapes
    const clock = Date.now() * 0.001;
    const dummy = new THREE.Object3D();
    const dummyMatrix = new THREE.Matrix4();
    const offset = objCount * 2.5;
    objects.forEach((obj, idx) => {
      for (let i = 0; i < objCount; i++) {
        dummy.position.set(idx * 5, offset - i * 2.5, -20);
        dummy.rotation.y =
          Math.sin(i / 4 + clock) +
          Math.sin(i / 4 + clock) +
          Math.sin(i / 4 + clock);
        dummy.rotation.z = dummy.rotation.y * 2;
        dummy.updateMatrix();
        obj.setMatrixAt(i, dummy.matrix);
        // const speed = 0.2 + i * 0.1;
        // const rot = time * speed;
        // obj[idx].rotation.x = rot;
        // obj[idx].rotation.y = rot;
      }
      obj.instanceMatrix.needsUpdate = true;
    });

    // objects.forEach((obj) => {
    //   const clock = Date.now() * 0.001;
    //   obj.rotation.x = Math.sin(clock / 4);
    //   obj.rotation.y = Math.sin(clock / 2);

    //   const dummy = new THREE.Object3D();
    //   for (let i = 0; i < objCount; i++) {
    //     dummy.position.set(obj.position.x, obj.position.y, obj.position.z);
    //     dummy.rotation.y =
    //       Math.sin(i / 4 + clock) +
    //       Math.sin(i / 4 + clock) +
    //       Math.sin(i / 4 + clock);
    //     dummy.rotation.z = dummy.rotation.y * 2;
    //     dummy.updateMatrix();
    //     obj.setMatrixAt(i++, dummy.matrix);
    //   }
    // });
  }

  prevTime = time;
  renderer.render(scene, camera);
  stats.update();
}
