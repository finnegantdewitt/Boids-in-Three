import * as THREE from "three";

class Boid {
  constructor(mesh, scene) {
    this.mesh = mesh;
    scene.add(this.mesh);

    // this.meshHelper = new THREE.BoxHelper(mesh, 0xffff00);
    // scene.add(this.meshHelper);

    this.radiusOfVision = 25;
    // this.sphereHelper = new THREE.LineSegments(
    //   new THREE.WireframeGeometry(
    //     new THREE.SphereGeometry(this.radiusOfVision, 16, 16)
    //   )
    // );
    // this.mesh.add(this.sphereHelper);
    this.velocity = new THREE.Vector3()
      .set(Math.random(), Math.random(), Math.random())
      .normalize();
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
    if (this.mesh.position.x > 100 || this.mesh.position.x < -100) {
      this.velocity.x = -this.velocity.x;
    }
    if (this.mesh.position.y > 100 || this.mesh.position.y < 1) {
      this.velocity.y = -this.velocity.y;
    }
    if (this.mesh.position.z > 100 || this.mesh.position.z < -100) {
      this.velocity.z = -this.velocity.z;
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
  isBoidInSight(boid) {
    if (this.distanceToBoid(boid) < this.radiusOfVision) {
      let heading = new THREE.Vector3().subVectors(
        boid.mesh.position,
        this.mesh.position
      );
      let isInFront = heading.dot(this.velocity) >= 0;
      if (isInFront) {
        boid.mesh.material.color.setHex(0x00ff00);
      } else {
        boid.mesh.material.color.setHex(0xffffff);
      }
      return isInFront;
    } else {
      boid.mesh.material.color.setHex(0xffffff);
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
