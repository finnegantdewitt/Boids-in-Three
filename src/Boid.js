import * as THREE from "three";

class Boid {
  constructor(mesh, scene) {
    this.mesh = mesh;
    scene.add(this.mesh);

    this.velocity = new THREE.Vector3()
      .set(Math.random(), Math.random(), Math.random())
      .normalize();

    this.minX = -100;
    this.maxX = 100;
    this.minY = 1;
    this.maxY = 100;
    this.minZ = -100;
    this.maxZ = 100;
    this.wallMargin = 10;
    this.turnFactor = 0.2;
  }
  setXBounds(min, max) {
    this.minX = min;
    this.maxX = max;
  }
  setYBounds(min, max) {
    this.minY = min + 1;
    this.maxY = max;
  }
  setZBounds(min, max) {
    this.minZ = min;
    this.maxZ = max;
  }
  setVelocity(x, y, z) {
    this.velocity.set(x, y, z);
    this.velocity.normalize();
  }
  addToVelocity(x, y, z) {
    this.setVelocity(
      (this.velocity.x += x),
      (this.velocity.y += y),
      (this.velocity.z += z)
    );
  }
  move() {
    // if (
    //   (this.mesh.position.x > this.maxX  && this.velocity.x > 0) ||
    //   (this.mesh.position.x < this.minX && this.velocity.x < 0)
    // ) {
    //   this.velocity.x = -this.velocity.x;
    // }
    // if (
    //   (this.mesh.position.y > this.maxY && this.velocity.y > 0) ||
    //   (this.mesh.position.y < this.minY && this.velocity.y < 0)
    // ) {
    //   this.velocity.y = -this.velocity.y;
    // }
    // if (
    //   (this.mesh.position.z > this.maxZ && this.velocity.z > 0) ||
    //   (this.mesh.position.z < this.minZ && this.velocity.z < 0)
    // ) {
    //   this.velocity.z = -this.velocity.z;
    // }

    if (this.mesh.position.x > this.maxX - this.wallMargin) {
      this.velocity.x += -this.turnFactor;
    }
    if (this.mesh.position.x < this.minX + this.wallMargin) {
      this.velocity.x += this.turnFactor;
    }
    if (this.mesh.position.y > this.maxY - this.wallMargin) {
      this.velocity.y += -this.turnFactor;
    }
    if (this.mesh.position.y < this.minY + this.wallMargin) {
      this.velocity.y += this.turnFactor;
    }
    if (this.mesh.position.z > this.maxZ - this.wallMargin) {
      this.velocity.z += -this.turnFactor;
    }
    if (this.mesh.position.z < this.minZ + this.wallMargin) {
      this.velocity.z += this.turnFactor;
    }

    let targetVec = new THREE.Vector3().addVectors(
      this.mesh.position,
      this.velocity
    );
    this.mesh.lookAt(targetVec);

    this.mesh.position.x += this.velocity.x;
    this.mesh.position.y += this.velocity.y;
    this.mesh.position.z += this.velocity.z;

    // this.meshHelper.update();
    // this.sphereHelper.update();
  }
  isBoidInSight(boid, radius) {
    if (this.distanceToBoid(boid) < radius) {
      let heading = new THREE.Vector3().subVectors(
        boid.mesh.position,
        this.mesh.position
      );
      let isInFront = heading.dot(this.velocity) >= 0;
      return isInFront;
    }
  }
  // Maybe switch to raycasting in the future
  distanceToBoid(boid) {
    let dx = boid.mesh.position.x - this.mesh.position.x;
    let dy = boid.mesh.position.y - this.mesh.position.y;
    let dz = boid.mesh.position.z - this.mesh.position.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

export default Boid;
