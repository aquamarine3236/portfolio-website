document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("hero-neural-container");
  if (!container) return;

  // ── Theme colors ──
  function getThemeColors() {
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    if (isDark) {
      return {
        palette: [
          new THREE.Color(0x0a2a6e),
          new THREE.Color(0x103caa),
          new THREE.Color(0x1955d4),
          new THREE.Color(0x2b6fff),
          new THREE.Color(0x4da6ff),
          new THREE.Color(0x38cfef),
        ],
        glowColor: 0x1955d4,
        glowOpacity: 0.025,
        edgeOpacity: 0.4,
        pulseColor: new THREE.Color(0x4da6ff),
        outerGlowColor: 0x2b6fff,
        outerGlowOpacity: 0.012,
        blending: THREE.AdditiveBlending,
      };
    } else {
      return {
        palette: [
          new THREE.Color(0x0a2a6e),
          new THREE.Color(0x103caa),
          new THREE.Color(0x1a56db),
          new THREE.Color(0x1d4ed8),
          new THREE.Color(0x2563eb),
          new THREE.Color(0x1e3a8a), // Darker blues for contrast
        ],
        glowColor: 0x1a56db,
        glowOpacity: 0.04,
        edgeOpacity: 0.3,
        pulseColor: new THREE.Color(0x2563eb),
        outerGlowColor: 0x2563eb,
        outerGlowOpacity: 0.02,
        blending: THREE.NormalBlending,
      };
    }
  }

  // ── Scene ──
  const scene = new THREE.Scene();

  // ── Camera ──
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, -6, 280);

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // ── Main group ──
  const networkGroup = new THREE.Group();
  scene.add(networkGroup);

  // ── Brain-shaped point distribution ──
  const neuronCount = 750;
  const positions = new Float32Array(neuronCount * 3);
  const colors = new Float32Array(neuronCount * 3);
  const baseSizes = new Float32Array(neuronCount);
  const sizes = new Float32Array(neuronCount);

  function brainPoint() {
    // Ellipsoidal radii – brain-like proportions (longer front-to-back, narrower left-to-right)
    const rx = 50; // Left-Right (narrower)
    const ry = 55; // Bottom-Top
    const rz = 68; // Front-Back

    // Random point inside unit sphere via rejection sampling
    let ux, uy, uz;
    do {
      ux = THREE.MathUtils.randFloatSpread(2);
      uy = THREE.MathUtils.randFloatSpread(2);
      uz = THREE.MathUtils.randFloatSpread(2);
    } while (ux * ux + uy * uy + uz * uz > 1);

    // Strong surface bias – most points near the outer shell for defined silhouette
    const surfaceRange = Math.random();
    let surfaceBias;
    if (surfaceRange < 0.65) {
      // 65% of points in the outer 20% shell
      surfaceBias = 0.80 + Math.random() * 0.20;
    } else if (surfaceRange < 0.88) {
      // 23% in the middle region
      surfaceBias = 0.50 + Math.random() * 0.30;
    } else {
      // 12% scattered in the interior
      surfaceBias = 0.15 + Math.random() * 0.35;
    }

    const len = Math.sqrt(ux * ux + uy * uy + uz * uz);
    if (len > 0) {
      ux = (ux / len) * surfaceBias;
      uy = (uy / len) * surfaceBias;
      uz = (uz / len) * surfaceBias;
    }

    let x = ux * rx;
    let y = uy * ry;
    let z = uz * rz;

    // ── Medial fissure (deep crease separating hemispheres) ──
    const topness = Math.max(0, y / ry);
    const centerDist = Math.abs(x) / rx;
    if (centerDist < 0.18 && topness > 0.15) {
      const creaseStrength = (1 - centerDist / 0.18) * topness;
      // Push points outward from the midline
      x += Math.sign(x || (Math.random() > 0.5 ? 1 : -1)) * creaseStrength * rx * 0.38;
      // Dip the top center downward to form the fissure groove
      y -= creaseStrength * ry * 0.28;
    }

    // ── Cerebral cortex surface ridges (gyri / sulci simulation) ──
    const theta = Math.atan2(z, x);
    const phi = Math.atan2(Math.sqrt(x * x + z * z), y);
    const ridgePattern =
      Math.sin(theta * 6 + phi * 4) * 0.03 +
      Math.sin(theta * 3 - phi * 7) * 0.02 +
      Math.sin(theta * 10) * 0.015;
    const distFromCenter = Math.sqrt(ux * ux + uy * uy + uz * uz);
    if (distFromCenter > 0.6) {
      const ridgeInfluence = (distFromCenter - 0.6) / 0.4;
      x *= 1 + ridgePattern * ridgeInfluence * 2.5;
      y *= 1 + ridgePattern * ridgeInfluence * 1.8;
      z *= 1 + ridgePattern * ridgeInfluence * 2.5;
    }

    // ── Lateral bulge for hemisphere fullness ──
    const lateralBulge = 1 + 0.10 * Math.sin(theta * 2);
    x *= lateralBulge;
    z *= lateralBulge;

    // ── Temporal lobe protrusion (sides, lower) ──
    const lowness = Math.max(0, -y / ry);
    const sideness = Math.abs(x) / rx;
    if (lowness > 0.3 && sideness > 0.5) {
      x *= 1.08;
      z *= 1.05;
    }

    // ── Frontal lobe (front, slight protrusion) ──
    if (z > rz * 0.5 && topness > 0.2) {
      z *= 1.06;
    }

    // ── Occipital lobe (back, slight bulge) ──
    if (z < -rz * 0.5 && topness < 0.4) {
      z *= 1.08;
    }

    // ── Brain stem: tapered extension downward at center back ──
    if (y < -ry * 0.55 && Math.sqrt(x * x + z * z) < 22) {
      const stemFactor = Math.max(0, (-y / ry - 0.55) / 0.45);
      y -= stemFactor * 14;
      x *= 1 - stemFactor * 0.5;
      z *= 1 - stemFactor * 0.35;
      // Taper toward back
      z -= stemFactor * 8;
    }

    return { x, y, z };
  }

  let themeColors = getThemeColors();

  function assignColors() {
    for (let i = 0; i < neuronCount; i++) {
      const col = themeColors.palette[Math.floor(Math.random() * themeColors.palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
  }

  // Generate neuron positions
  for (let i = 0; i < neuronCount; i++) {
    const p = brainPoint();
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;

    // Varied sizes – larger for surface points, smaller for interior
    const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    const maxDist = 85;
    const surfaceProximity = Math.min(dist / maxDist, 1);
    const s = THREE.MathUtils.lerp(2.0, 5.0, surfaceProximity) *
      THREE.MathUtils.randFloat(0.8, 1.4);
    baseSizes[i] = s;
    sizes[i] = s;
  }

  assignColors();

  // ── Neuron Points (enhanced shader with multi-layer glow) ──
  const neuronGeometry = new THREE.BufferGeometry();
  neuronGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  neuronGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  neuronGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const neuronVertexShader = `
    attribute float size;
    varying vec3 vColor;
    varying float vSize;
    void main() {
      vColor = color;
      vSize = size;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (200.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const neuronFragmentShader = `
    varying vec3 vColor;
    varying float vSize;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;

      // Multi-layer glow: bright core + soft outer halo
      float core = 1.0 - smoothstep(0.0, 0.15, d);
      float midGlow = 1.0 - smoothstep(0.0, 0.32, d);
      float outerGlow = 1.0 - smoothstep(0.0, 0.5, d);

      float intensity = core * 0.7 + midGlow * 0.4 + outerGlow * 0.2;
      float alpha = intensity * 0.7;

      // Brighter core color
      vec3 brightColor = vColor * 1.4 + vec3(0.1, 0.1, 0.15) * core;

      gl_FragColor = vec4(brightColor, alpha);
    }
  `;

  const neuronMaterial = new THREE.ShaderMaterial({
    vertexShader: neuronVertexShader,
    fragmentShader: neuronFragmentShader,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: themeColors.blending,
  });

  const neuronPoints = new THREE.Points(neuronGeometry, neuronMaterial);
  networkGroup.add(neuronPoints);

  // ── Connect nearby neurons with visible edge lines ──
  const edgePairs = [];
  const maxEdgeDist = 15; // Tight distance for clean connections

  // Spatial hashing for performance
  const cellSize = maxEdgeDist;
  const grid = new Map();

  for (let i = 0; i < neuronCount; i++) {
    const cx = Math.floor(positions[i * 3] / cellSize);
    const cy = Math.floor(positions[i * 3 + 1] / cellSize);
    const cz = Math.floor(positions[i * 3 + 2] / cellSize);
    const key = `${cx},${cy},${cz}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  }

  for (const [key, indices] of grid) {
    const [cx, cy, cz] = key.split(",").map(Number);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nKey = `${cx + dx},${cy + dy},${cz + dz}`;
          const neighborIndices = grid.get(nKey);
          if (!neighborIndices) continue;
          for (const i of indices) {
            for (const j of neighborIndices) {
              if (j <= i) continue;
              const ix = positions[i * 3], iy = positions[i * 3 + 1], iz = positions[i * 3 + 2];
              const jx = positions[j * 3], jy = positions[j * 3 + 1], jz = positions[j * 3 + 2];
              const distSq = (ix - jx) ** 2 + (iy - jy) ** 2 + (iz - jz) ** 2;
              if (distSq < maxEdgeDist * maxEdgeDist) {
                const dist = Math.sqrt(distSq);
                const t = dist / maxEdgeDist;
                const alpha = (1.0 - t * t) * 1.5;
                edgePairs.push({ i, j, alpha });
              }
            }
          }
        }
      }
    }
  }

  let edgeVertices = [];
  let edgeColorsArray = [];
  for (let p = 0; p < edgePairs.length; p++) {
    const { i, j, alpha } = edgePairs[p];
    edgeVertices.push(
      positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
      positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
    );
    edgeColorsArray.push(
      colors[i * 3] * alpha, colors[i * 3 + 1] * alpha, colors[i * 3 + 2] * alpha,
      colors[j * 3] * alpha, colors[j * 3 + 1] * alpha, colors[j * 3 + 2] * alpha
    );
  }

  let edgeLines;
  let edgeMaterial;
  const edgeGeometry = new THREE.BufferGeometry();

  if (edgePairs.length > 0) {
    edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(edgeVertices, 3));
    edgeGeometry.setAttribute("color", new THREE.Float32BufferAttribute(edgeColorsArray, 3));

    edgeMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: themeColors.edgeOpacity,
      blending: themeColors.blending,
      depthWrite: false,
      linewidth: 2,
    });

    edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    networkGroup.add(edgeLines);
  }

  function updateEdgeColors() {
    if (!edgeGeometry.hasAttribute("color")) return;
    const colorAttr = edgeGeometry.getAttribute("color");
    let idx = 0;
    for (let p = 0; p < edgePairs.length; p++) {
      const { i, j, alpha } = edgePairs[p];
      colorAttr.array[idx++] = colors[i * 3] * alpha;
      colorAttr.array[idx++] = colors[i * 3 + 1] * alpha;
      colorAttr.array[idx++] = colors[i * 3 + 2] * alpha;
      colorAttr.array[idx++] = colors[j * 3] * alpha;
      colorAttr.array[idx++] = colors[j * 3 + 1] * alpha;
      colorAttr.array[idx++] = colors[j * 3 + 2] * alpha;
    }
    colorAttr.needsUpdate = true;
  }

  // ── Ambient glow sphere (inner) ──
  const glowSphereGeo = new THREE.SphereGeometry(68, 32, 32);
  const glowSphereMat = new THREE.MeshBasicMaterial({
    color: themeColors.glowColor,
    transparent: true,
    opacity: themeColors.glowOpacity,
    side: THREE.BackSide,
  });
  const glowSphere = new THREE.Mesh(glowSphereGeo, glowSphereMat);
  networkGroup.add(glowSphere);

  // ── Outer glow sphere (larger, softer) ──
  const outerGlowGeo = new THREE.SphereGeometry(100, 32, 32);
  const outerGlowMat = new THREE.MeshBasicMaterial({
    color: themeColors.outerGlowColor,
    transparent: true,
    opacity: themeColors.outerGlowOpacity,
    side: THREE.BackSide,
  });
  const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
  networkGroup.add(outerGlow);

  // ── Synaptic pulse system ──
  const pulseCount = 25;
  const pulsePositions = new Float32Array(pulseCount * 3);
  const pulseSizes = new Float32Array(pulseCount);
  const pulseAlphas = new Float32Array(pulseCount);
  const pulseData = [];

  for (let i = 0; i < pulseCount; i++) {
    pulseData.push({
      startIdx: 0,
      endIdx: 1,
      progress: Math.random(),
      speed: THREE.MathUtils.randFloat(0.3, 0.8),
      life: Math.random(),
      active: Math.random() < 0.5,
    });
    pulseAlphas[i] = 0;
    pulseSizes[i] = 2.5;
  }

  const pulseGeometry = new THREE.BufferGeometry();
  pulseGeometry.setAttribute("position", new THREE.BufferAttribute(pulsePositions, 3));
  pulseGeometry.setAttribute("size", new THREE.BufferAttribute(pulseSizes, 1));

  const pulseVertexShader = `
    attribute float size;
    uniform float uAlphas[${pulseCount}];
    varying float vAlpha;
    varying float vIdx;
    void main() {
      vAlpha = 1.0;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (220.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const pulseFragmentShader = `
    uniform vec3 uPulseColor;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float glow = 1.0 - smoothstep(0.0, 0.5, d);
      float intensity = pow(glow, 1.5);
      gl_FragColor = vec4(uPulseColor * 1.8, intensity * 0.9);
    }
  `;

  const pulseMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPulseColor: { value: themeColors.pulseColor },
    },
    vertexShader: pulseVertexShader,
    fragmentShader: pulseFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: themeColors.blending,
  });

  const pulsePoints = new THREE.Points(pulseGeometry, pulseMaterial);
  networkGroup.add(pulsePoints);

  // ── Tilt to show the brain from a natural 3/4 angle ──
  networkGroup.rotation.x = -0.18;
  networkGroup.rotation.z = 0.06;

  // ── Theme change listener ──
  function onThemeChange() {
    themeColors = getThemeColors();

    // Update neuron colors and blending mode
    assignColors();
    neuronGeometry.getAttribute("color").needsUpdate = true;
    neuronMaterial.blending = themeColors.blending;
    neuronMaterial.needsUpdate = true;

    // Update glow spheres
    glowSphereMat.color.set(themeColors.glowColor);
    glowSphereMat.opacity = themeColors.glowOpacity;
    outerGlowMat.color.set(themeColors.outerGlowColor);
    outerGlowMat.opacity = themeColors.outerGlowOpacity;

    // Update edges
    if (edgeMaterial) {
      edgeMaterial.opacity = themeColors.edgeOpacity;
      edgeMaterial.blending = themeColors.blending;
      edgeMaterial.needsUpdate = true;
      updateEdgeColors();
    }

    // Update pulse color and blending mode
    pulseMaterial.uniforms.uPulseColor.value = themeColors.pulseColor;
    pulseMaterial.blending = themeColors.blending;
    pulseMaterial.needsUpdate = true;
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === "data-theme") {
        onThemeChange();
        break;
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true });

  // ── Mouse interactivity ──
  let mouseX = 0;
  let mouseY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;

  document.addEventListener("mousemove", (event) => {
    mouseX = (event.clientX - windowHalfX) / windowHalfX;
    mouseY = (event.clientY - windowHalfY) / windowHalfY;
  });

  // ── Resize ──
  window.addEventListener("resize", () => {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    renderer.setSize(cw, ch);
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
  });

  // ── Animation ──
  const clock = new THREE.Clock();

  const animate = () => {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    const delta = clock.getDelta();

    // Gentle continuous rotation
    networkGroup.rotation.y += 0.0015;

    // Subtle organic drift for neuron positions
    const posAttr = neuronGeometry.getAttribute("position");
    for (let i = 0; i < neuronCount; i++) {
      posAttr.array[i * 3] += Math.sin(elapsed * 0.2 + i * 0.9) * 0.004;
      posAttr.array[i * 3 + 1] += Math.cos(elapsed * 0.18 + i * 0.6) * 0.004;
      posAttr.array[i * 3 + 2] += Math.sin(elapsed * 0.12 + i * 1.1) * 0.003;
    }
    posAttr.needsUpdate = true;

    // Gentle pulsating sizes
    const sizeAttr = neuronGeometry.getAttribute("size");
    for (let i = 0; i < neuronCount; i++) {
      const pulse = Math.sin(elapsed * 0.7 + i * 0.35) * 0.10;
      sizeAttr.array[i] = baseSizes[i] + pulse;
    }
    sizeAttr.needsUpdate = true;

    // ── Synaptic pulses ──
    const pulsePos = pulseGeometry.getAttribute("position");
    const pulseSz = pulseGeometry.getAttribute("size");

    for (let i = 0; i < pulseCount; i++) {
      const pd = pulseData[i];

      if (!pd.active) {
        pd.life -= 0.005;
        if (pd.life <= 0) {
          // Activate new pulse along a random edge
          pd.startIdx = Math.floor(Math.random() * neuronCount);
          // Find a nearby neuron
          let bestJ = (pd.startIdx + 1) % neuronCount;
          let bestDist = Infinity;
          const sx = positions[pd.startIdx * 3];
          const sy = positions[pd.startIdx * 3 + 1];
          const sz = positions[pd.startIdx * 3 + 2];
          // Sample a few random neurons to find a close one
          for (let attempt = 0; attempt < 20; attempt++) {
            const j = Math.floor(Math.random() * neuronCount);
            const dx = positions[j * 3] - sx;
            const dy = positions[j * 3 + 1] - sy;
            const dz = positions[j * 3 + 2] - sz;
            const dist = dx * dx + dy * dy + dz * dz;
            if (dist < bestDist && dist > 4) {
              bestDist = dist;
              bestJ = j;
            }
          }
          pd.endIdx = bestJ;
          pd.progress = 0;
          pd.speed = THREE.MathUtils.randFloat(0.4, 1.0);
          pd.active = true;
          pd.life = 1;
        }
        pulseSz.array[i] = 0;
        continue;
      }

      pd.progress += pd.speed * 0.012;

      if (pd.progress >= 1) {
        pd.active = false;
        pd.life = THREE.MathUtils.randFloat(0.3, 1.2);
        pulseSz.array[i] = 0;
        continue;
      }

      // Interpolate position
      const si = pd.startIdx * 3;
      const ei = pd.endIdx * 3;
      const t = pd.progress;
      pulsePos.array[i * 3] = positions[si] + (positions[ei] - positions[si]) * t;
      pulsePos.array[i * 3 + 1] = positions[si + 1] + (positions[ei + 1] - positions[si + 1]) * t;
      pulsePos.array[i * 3 + 2] = positions[si + 2] + (positions[ei + 2] - positions[si + 2]) * t;

      // Size peaks in the middle of travel
      const sizeCurve = Math.sin(t * Math.PI);
      pulseSz.array[i] = 2.5 * sizeCurve;
    }
    pulsePos.needsUpdate = true;
    pulseSz.needsUpdate = true;

    // Mouse parallax
    const targetRotY = mouseX * 0.25;
    const targetRotX = mouseY * 0.2;
    scene.rotation.y += (targetRotY - scene.rotation.y) * 0.035;
    scene.rotation.x += (targetRotX - scene.rotation.x) * 0.035;

    renderer.render(scene, camera);
  };

  animate();
});
