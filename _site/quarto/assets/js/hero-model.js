import * as THREE from "./vendor/three.module.js";
import { PLYLoader } from "./vendor/PLYLoader.js";

function fitGeometry(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = Math.max(size.x, size.y, size.z) || 1;

  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(1 / scale, 1 / scale, 1 / scale);
  geometry.rotateX(Math.PI - 0.18);
  geometry.computeBoundingSphere();
}

function initHeroModel() {
  const canvas = document.querySelector("[data-hero-model]");
  if (!canvas) return;

  const root = canvas.closest(".home-hero");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 80);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const group = new THREE.Group();
  group.rotation.set(-0.18, -0.58, 0.03);
  scene.add(group);

  camera.position.set(0.42, 0.58, 2.05);
  camera.lookAt(0, -0.08, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x23313a, 1.4));

  function resize() {
    const rect = root.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(320, Math.round(rect.height));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  new PLYLoader().load(
    "models/examples/wohnzimmer_points.ply",
    (geometry) => {
      fitGeometry(geometry);
      const hasColors = Boolean(geometry.getAttribute("color"));
      const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: hasColors ? 0xffffff : 0x75d6cb,
          size: 0.006,
          sizeAttenuation: true,
          vertexColors: hasColors,
          transparent: true,
          opacity: 0.92
        })
      );
      points.position.set(0.5, -0.03, 0);
      group.add(points);
      canvas.dataset.loaded = "true";
    },
    undefined,
    () => {
      canvas.dataset.loaded = "false";
    }
  );

  function animate() {
    group.rotation.y += 0.0018;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize);
  animate();
}

document.addEventListener("DOMContentLoaded", initHeroModel);
