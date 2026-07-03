function updateQualityWidget() {
  const overlap = document.getElementById("overlap");
  const texture = document.getElementById("texture");
  const control = document.getElementById("control");
  if (!overlap || !texture || !control) return;

  const values = {
    overlap: Number(overlap.value),
    texture: Number(texture.value),
    control: Number(control.value)
  };
  const score = Math.round(values.overlap * 0.38 + values.texture * 0.34 + values.control * 0.28);
  const label = score >= 82 ? "sehr gute Rekonstruktion" : score >= 62 ? "solide Rekonstruktion" : score >= 42 ? "riskante Rekonstruktion" : "wahrscheinlich instabil";

  document.getElementById("overlap-value").textContent = values.overlap;
  document.getElementById("texture-value").textContent = values.texture;
  document.getElementById("control-value").textContent = values.control;
  document.getElementById("quality-score").textContent = score;
  document.getElementById("quality-label").textContent = label;
}

function drawPointCloud(mode = "sparse") {
  const canvas = document.getElementById("pointcloud-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "#f8fbfc";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#d7e0e5";
  ctx.lineWidth = 1;
  for (let x = 60; x < w; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 60; y < h; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const count = mode === "dense" ? 1800 : 170;
  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    const band = Math.floor(t * 5);
    const x = 115 + ((i * 47) % 670);
    const roof = 135 + Math.abs(x - 450) * 0.18;
    const base = 320 - Math.abs(x - 450) * 0.05;
    const yBase = band < 2 ? roof + ((i * 31) % 70) : base - ((i * 23) % 120);
    const jitter = mode === "dense" ? 7 : 18;
    const y = yBase + Math.sin(i * 12.9898) * jitter;
    const radius = mode === "dense" ? 1.3 : 3.1;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = band % 3 === 0 ? "#1f6feb" : band % 3 === 1 ? "#1a8f8a" : "#b45f06";
    ctx.globalAlpha = mode === "dense" ? 0.72 : 0.95;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#172026";
  ctx.font = "18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(mode === "dense" ? "MVS: dichte Punktwolke" : "SfM: sparse Punktwolke", 28, 36);
}

function bindPointCloudDemo() {
  const buttons = document.querySelectorAll("[data-cloud-mode]");
  if (!buttons.length) return;
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((other) => {
        other.classList.toggle("btn-primary", other === button);
        other.classList.toggle("btn-outline-primary", other !== button);
      });
      drawPointCloud(button.dataset.cloudMode);
    });
  });
  drawPointCloud("sparse");
}

function bindMethodDecision() {
  const answer = document.getElementById("method-answer");
  if (!answer) return;

  const copy = {
    geometry: "Empfehlung: SfM/MVS. Die Pipeline liefert explizite Punkte, Kameras, Meshes und damit die beste Grundlage für Messung und Dokumentation.",
    views: "Empfehlung: NeRF. Wenn neue Ansichten und fotorealistisches Rendering im Zentrum stehen, ist ein Radiance-Field-Ansatz naheliegend.",
    realtime: "Empfehlung: 3D Gaussian Splatting. Für schnelle visuelle Navigation durch rekonstruierte Szenen ist GS häufig sehr attraktiv."
  };

  document.querySelectorAll("[data-method-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      answer.textContent = copy[button.dataset.methodChoice];
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ["overlap", "texture", "control"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.addEventListener("input", updateQualityWidget);
  });
  updateQualityWidget();
  bindPointCloudDemo();
  bindMethodDecision();
});
