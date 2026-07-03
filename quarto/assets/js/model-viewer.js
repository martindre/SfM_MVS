import * as THREE from "./vendor/three.module.js";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { PLYLoader } from "./vendor/PLYLoader.js";

const initialized = new WeakSet();

function setStatus(root, text) {
  const status = root.querySelector(".viewer-status");
  if (status) status.textContent = text;
}

function viewerSize(root) {
  const rect = root.getBoundingClientRect();
  return {
    width: Math.max(320, Math.round(rect.width || root.clientWidth || 800)),
    height: Math.max(320, Math.round(rect.height || 390))
  };
}

function colorFromDataset(root, fallback) {
  return new THREE.Color(root.dataset.color || fallback);
}

function sortedQuantile(values, q) {
  const sorted = Array.from(values).sort((a, b) => a - b);
  const index = (sorted.length - 1) * q;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  return low === high ? sorted[low] : sorted[low] + (sorted[high] - sorted[low]) * (index - low);
}

function normalizeGeometry(geometry, root) {
  if (root.hasAttribute("data-flip-y")) {
    geometry.scale(1, -1, -1);
  }

  const positions = geometry.getAttribute("position");
  if (!positions || positions.count === 0) return { center: new THREE.Vector3(), radius: 1 };

  const mode = root.dataset.mode || "mesh";
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  if (mode === "points" && positions.count > 16) {
    const xs = new Float32Array(positions.count);
    const ys = new Float32Array(positions.count);
    const zs = new Float32Array(positions.count);
    for (let i = 0; i < positions.count; i += 1) {
      xs[i] = positions.getX(i);
      ys[i] = positions.getY(i);
      zs[i] = positions.getZ(i);
    }
    minX = sortedQuantile(xs, 0.02);
    maxX = sortedQuantile(xs, 0.98);
    minY = sortedQuantile(ys, 0.02);
    maxY = sortedQuantile(ys, 0.98);
    minZ = sortedQuantile(zs, 0.02);
    maxZ = sortedQuantile(zs, 0.98);
  } else {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    minX = box.min.x;
    minY = box.min.y;
    minZ = box.min.z;
    maxX = box.max.x;
    maxY = box.max.y;
    maxZ = box.max.z;
  }

  const center = new THREE.Vector3(
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2
  );
  const scale = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;

  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(1 / scale, 1 / scale, 1 / scale);
  geometry.computeBoundingSphere();

  return {
    center: new THREE.Vector3(),
    radius: Math.max(geometry.boundingSphere?.radius || 0.75, 0.25)
  };
}

function makeObject(geometry, root) {
  const hasVertexColors = Boolean(geometry.getAttribute("color"));
  const mode = root.dataset.mode || "mesh";
  const materialColor = hasVertexColors
    ? new THREE.Color(0xffffff)
    : colorFromDataset(root, mode === "points" ? "#1f6feb" : "#9aa3ad");

  if (mode === "points") {
    const pointSize = Math.max(0.003, Number(root.dataset.pointSize || 1.5) * 0.0045);
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: materialColor,
        size: pointSize,
        sizeAttenuation: true,
        vertexColors: hasVertexColors
      })
    );
  }

  if (!geometry.getAttribute("normal")) {
    geometry.computeVertexNormals();
  }

  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: materialColor,
      roughness: 0.72,
      metalness: 0.02,
      side: THREE.DoubleSide,
      vertexColors: hasVertexColors
    })
  );
}

function frameObject(camera, controls, radius) {
  const distance = radius * 2.8;
  camera.near = Math.max(radius / 100, 0.001);
  camera.far = radius * 100;
  camera.position.set(distance, distance * 0.65, distance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.update();
  return {
    cameraPosition: camera.position.clone(),
    target: controls.target.clone()
  };
}

function initViewer(root) {
  if (initialized.has(root)) return;
  initialized.add(root);

  const canvas = root.querySelector("canvas");
  if (!canvas || !root.dataset.src) return;

  setStatus(root, "Lade Viewer...");

  const size = viewerSize(root);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3f6f8);

  const camera = new THREE.PerspectiveCamera(45, size.width / size.height, 0.001, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(size.width, size.height, false);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
  keyLight.position.set(3, 5, 4);
  scene.add(keyLight);

  let resetState = null;
  let object = null;

  new PLYLoader().load(
    root.dataset.src,
    (geometry) => {
      const frame = normalizeGeometry(geometry, root);
      object = makeObject(geometry, root);
      scene.add(object);
      resetState = frameObject(camera, controls, frame.radius);

      const pointCount = geometry.getAttribute("position")?.count || 0;
      const indexCount = geometry.getIndex()?.count || 0;
      const triangleCount = root.dataset.mode === "mesh"
        ? Math.round((indexCount || pointCount) / 3)
        : 0;

      setStatus(
        root,
        root.dataset.mode === "mesh"
          ? `${pointCount.toLocaleString("de-DE")} Punkte · ${triangleCount.toLocaleString("de-DE")} Dreiecke`
          : `${pointCount.toLocaleString("de-DE")} Punkte`
      );
    },
    undefined,
    (error) => {
      console.error("PLY konnte nicht geladen werden:", root.dataset.src, error);
      setStatus(root, "Modell konnte nicht geladen werden");
    }
  );

  const resetButton = root.querySelector("[data-reset]");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (!resetState) return;
      camera.position.copy(resetState.cameraPosition);
      controls.target.copy(resetState.target);
      controls.update();
    });
  }

  function resize() {
    const nextSize = viewerSize(root);
    camera.aspect = nextSize.width / nextSize.height;
    camera.updateProjectionMatrix();
    renderer.setSize(nextSize.width, nextSize.height, false);
  }

  window.addEventListener("resize", resize);
  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(root);
  }

  function animate() {
    controls.update();
    if (object) renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

function initWhenVisible(root) {
  if (!("IntersectionObserver" in window)) {
    initViewer(root);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      initViewer(root);
      observer.disconnect();
    }
  }, { rootMargin: "160px" });

  observer.observe(root);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-model-viewer]").forEach(initWhenVisible);

  const items = document.querySelectorAll(".lidar-accordion .lidar-item");
  items.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      items.forEach((other) => { if (other !== item) other.open = false; });
      item.querySelectorAll("[data-model-viewer]").forEach(initViewer);
      window.dispatchEvent(new Event("resize"));
    });
  });
});
