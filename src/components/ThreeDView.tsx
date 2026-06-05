import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// --- VOICE COMMAND SPECTRUM 3D ---
interface VoiceSpectrum3DProps {
  isListening: boolean;
  themeMode: 'dark' | 'light';
}

export const VoiceSpectrum3D: React.FC<VoiceSpectrum3DProps> = ({ isListening, themeMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    scene.background = null; // transparent background

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(themeMode === 'dark' ? 0x00f0ff : 0x3b82f6, 1.5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // SPECTRUM OBJECTS (A ring of 3D bars)
    const barCount = 36;
    const bars: THREE.Mesh[] = [];
    const barGroup = new THREE.Group();

    const barGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const radius = 4;

      // Color gradient or neon glows
      const colorVal = new THREE.Color();
      // Hue rotating over the circle
      colorVal.setHSL(i / barCount, 0.8, 0.5);

      const barMaterial = new THREE.MeshPhongMaterial({
        color: colorVal,
        emissive: colorVal,
        emissiveIntensity: 0.3,
        shininess: 60,
      });

      const bar = new THREE.Mesh(barGeometry, barMaterial);
      
      // Position on the ring
      bar.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      
      // Orient towards or perpendicular to center
      bar.rotation.z = angle + Math.PI / 2;

      barGroup.add(bar);
      bars.push(bar);
    }

    scene.add(barGroup);

    // PARTICLES IN THE CENTER
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Cylindrical coordinates
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 2;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      speeds[i] = 0.01 + Math.random() * 0.03;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: themeMode === 'dark' ? 0x00ffcc : 0x10b981,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // MOUSE INTERACTION (DRAGGING)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      barGroup.rotation.y += deltaX * 0.01;
      barGroup.rotation.x += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      barGroup.rotation.y += deltaX * 0.01;
      barGroup.rotation.x += deltaY * 0.01;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onMouseUp);

    // ANIMATION LOOP
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate whole ring gently
      barGroup.rotation.z += 0.005;
      
      // Update bars scale
      bars.forEach((bar, index) => {
        let targetScale = 0.15;
        if (isListening) {
          // Dynamic simulation of frequency heights using noise/waves
          const wave1 = Math.sin(index * 0.5 + elapsedTime * 12) * 1.5;
          const wave2 = Math.cos(index * 1.2 - elapsedTime * 8) * 0.8;
          targetScale = Math.max(0.2, (wave1 + wave2 + 2.0) * 1.3);
        } else {
          // Flatten when idle
          targetScale = 0.2 + Math.abs(Math.sin(index * 0.1 + elapsedTime * 2)) * 0.15;
        }
        bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, targetScale, 0.15);
        
        // Emissive intensity pulsing
        if (isListening) {
          (bar.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.3 + bar.scale.y * 0.15;
        } else {
          (bar.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.15;
        }
      });

      // Update inner particles
      const positionsArr = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        // Move along Z axis
        let z = positionsArr[i * 3 + 2];
        z += speeds[i] * (isListening ? 4 : 1);
        if (z > 4) {
          z = -4;
        }
        positionsArr[i * 3 + 2] = z;

        // Twist slightly
        const x = positionsArr[i * 3];
        const y = positionsArr[i * 3 + 1];
        const rotSpeed = 0.01 * (isListening ? 3 : 1);
        positionsArr[i * 3] = x * Math.cos(rotSpeed) - y * Math.sin(rotSpeed);
        positionsArr[i * 3 + 1] = x * Math.sin(rotSpeed) + y * Math.cos(rotSpeed);
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // RESIZE OBSERVER
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: entryWidth, height: entryHeight } = entries[0].contentRect;
      camera.aspect = entryWidth / entryHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(entryWidth, entryHeight);
    });
    resizeObserver.observe(container);

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);

      // Dispose Geometries and Materials
      barGeometry.dispose();
      bars.forEach(b => {
        if (b.material instanceof Array) {
          b.material.forEach(m => m.dispose());
        } else {
          b.material.dispose();
        }
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
      
      if (rendererRef.current && rendererRef.current.domElement) {
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [isListening, themeMode]);

  return (
    <div 
      id="voice-spectrum-canvas-container"
      ref={containerRef} 
      className="w-full h-[260px] relative cursor-grab active:cursor-grabbing rounded-xl overflow-hidden glassmorphism border border-white/5"
    />
  );
};

// --- SUHU EMOTICON 3D ---
interface SuhuEmoticon3DProps {
  temperature: number;
  themeMode: 'dark' | 'light';
}

export const SuhuEmoticon3D: React.FC<SuhuEmoticon3DProps> = ({ temperature, themeMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // DETERMINE THEME AND PHYSICAL EMOTICON PARAMETERS
    let skinColor = 0x10b981; // default normal (green)
    let condition = 'Normal';
    let pulseSpeed = 1;

    if (temperature < 25) {
      skinColor = 0x3b82f6; // cool blue
      condition = 'Dingin';
      pulseSpeed = 0.5;
    } else if (temperature >= 25 && temperature <= 30) {
      skinColor = 0x10b981; // normal green
      condition = 'Normal';
      pulseSpeed = 1.0;
    } else if (temperature > 30 && temperature <= 35) {
      skinColor = 0xf59e0b; // warm orange
      condition = 'Panas';
      pulseSpeed = 2.0;
    } else {
      skinColor = 0xef4444; // hot red
      condition = 'Sangat Panas';
      pulseSpeed = 4.0;
    }

    const faceGroup = new THREE.Group();

    // 1. SPHERE FOR FACE
    const faceGeometry = new THREE.SphereGeometry(1.8, 32, 32);
    const faceMaterial = new THREE.MeshPhongMaterial({
      color: skinColor,
      shininess: 40,
      flatShading: false,
    });
    const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
    faceGroup.add(faceMesh);

    // 2. EYES (SphereGeometry kecil - Hitam)
    const eyeGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const eyeMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 80 });

    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.6, 0.4, 1.5);
    faceGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.6, 0.4, 1.5);
    faceGroup.add(rightEye);

    // 3. MOUTH (Curve / Torus)
    let mouthMesh: THREE.Mesh;
    if (condition === 'Dingin') {
      // Shivering mouth: thin cylinder/line wavy shape
      const mouthGeom = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8);
      const mouthMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
      mouthMesh = new THREE.Mesh(mouthGeom, mouthMat);
      mouthMesh.position.set(0, -0.4, 1.6);
      mouthMesh.rotation.z = Math.PI / 2;
    } else if (condition === 'Normal') {
      // Smiling mouth: Torus arc
      const mouthGeom = new THREE.TorusGeometry(0.4, 0.08, 8, 24, Math.PI);
      const mouthMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
      mouthMesh = new THREE.Mesh(mouthGeom, mouthMat);
      mouthMesh.position.set(0, -0.1, 1.6);
      mouthMesh.rotation.x = Math.PI / 1.1; // adjust to smile upward
      mouthMesh.rotation.z = Math.PI;
    } else if (condition === 'Panas') {
      // Panas mouth: simple small circle (shocked / gasping / panting)
      const mouthGeom = new THREE.TorusGeometry(0.24, 0.08, 8, 24, Math.PI * 2);
      const mouthMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
      mouthMesh = new THREE.Mesh(mouthGeom, mouthMat);
      mouthMesh.position.set(0, -0.4, 1.6);
    } else {
      // Sangat Panas mouth: wider flat circle to look extremely exhausted/angry
      const mouthGeom = new THREE.TorusGeometry(0.35, 0.1, 8, 24, Math.PI);
      const mouthMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
      mouthMesh = new THREE.Mesh(mouthGeom, mouthMat);
      mouthMesh.position.set(0, -0.5, 1.6);
      mouthMesh.rotation.x = -Math.PI / 1.1; // frown downward
    }

    if (mouthMesh) faceGroup.add(mouthMesh);

    // Sweat drop or small heat bands depending on status
    if (condition === 'Sangat Panas' || condition === 'Panas') {
      // Little horn / heat drop on forehead
      const dropGeom = new THREE.ConeGeometry(0.12, 0.4, 4);
      const dropMat = new THREE.MeshPhongMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.8 });
      const sweatDrop = new THREE.Mesh(dropGeom, dropMat);
      sweatDrop.position.set(0.6, 0.9, 1.4);
      sweatDrop.rotation.z = -0.3;
      sweatDrop.rotation.x = 0.3;
      faceGroup.add(sweatDrop);
    }

    scene.add(faceGroup);

    // 4. PARTICLES AROUND
    const pCount = 80;
    const pGeom = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pSpeeds = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      pSpeeds[i] = 0.01 + Math.random() * 0.02;
    }

    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    
    // Choose particle color
    let partColor = 0x10b981; // Green
    if (condition === 'Dingin') partColor = 0xa5f3fc; // Snow / cyan
    else if (condition === 'Normal') partColor = 0x34d399; // emerald
    else if (condition === 'Panas') partColor = 0xfba91a; // orange spark
    else partColor = 0xef4444; // red flames

    const pMat = new THREE.PointsMaterial({
      color: partColor,
      size: 0.1,
      transparent: true,
      opacity: 0.7,
    });
    const pSystem = new THREE.Points(pGeom, pMat);
    scene.add(pSystem);

    // MOUSE DRAGGING FOR ROTATION
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dX = e.clientX - prevMouseX;
      const dY = e.clientY - prevMouseY;
      faceGroup.rotation.y += dX * 0.01;
      faceGroup.rotation.x += dY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // ANIMATION
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Rotation / Shiver effect
      if (condition === 'Dingin') {
        // Cold shiver: fast tiny vibrations + slow rotation
        faceGroup.rotation.y = Math.sin(time * 0.5) * 0.2 + Math.sin(time * 45) * 0.02;
        faceGroup.rotation.x = Math.sin(time * 30) * 0.02;
      } else if (condition === 'Normal') {
        // Smooth serene rotation
        faceGroup.rotation.y = time * 0.4;
        faceGroup.position.y = Math.sin(time * 1.5) * 0.1;
      } else if (condition === 'Panas') {
        // Fast rotation
        faceGroup.rotation.y = time * 1.1;
        faceGroup.position.y = Math.sin(time * 3) * 0.15;
      } else {
        // Very fast rotation + angry jitter
        faceGroup.rotation.y = time * 2.0 + Math.sin(time * 60) * 0.04;
        faceGroup.position.y = Math.sin(time * 5) * 0.2 + Math.sin(time * 40) * 0.03;
      }

      // Update particles
      const positions = pSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pCount; i++) {
        if (condition === 'Dingin') {
          // Fall down (snow-like)
          positions[i * 3 + 1] -= pSpeeds[i] * 0.6;
          if (positions[i * 3 + 1] < -3) {
            positions[i * 3 + 1] = 3;
            positions[i * 3] = (Math.random() - 0.5) * 6;
          }
        } else {
          // Rise up (heat-like)
          positions[i * 3 + 1] += pSpeeds[i] * pulseSpeed * 0.7;
          if (positions[i * 3 + 1] > 3) {
            positions[i * 3 + 1] = -3;
            positions[i * 3] = (Math.random() - 0.5) * 6;
          }
        }
      }
      pSystem.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: w, height: h } = entries[0].contentRect;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      faceGeometry.dispose();
      faceMaterial.dispose();
      eyeGeom.dispose();
      eyeMat.dispose();
      if (mouthMesh) {
        mouthMesh.geometry.dispose();
        (mouthMesh.material as THREE.Material).dispose();
      }
      pGeom.dispose();
      pMat.dispose();

      if (rendererRef.current && rendererRef.current.domElement) {
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [temperature, themeMode]);

  return (
    <div 
      id="suhu-emoticon-canvas-container"
      ref={containerRef} 
      className="w-full h-[220px] relative cursor-grab active:cursor-grabbing rounded-xl overflow-hidden glassmorphism flex justify-center items-center"
    />
  );
};

// --- KELEMBAPAN EMOTICON 3D ---
interface KelembapanEmoticon3DProps {
  humidity: number;
  themeMode: 'dark' | 'light';
}

export const KelembapanEmoticon3D: React.FC<KelembapanEmoticon3DProps> = ({ humidity, themeMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(-5, 8, 4);
    scene.add(dirLight);

    // EMBODIMENT VALUES
    let faceColor = 0x10b981; // green default
    let condition = 'Normal';
    let floatSpeed = 1.0;

    if (humidity < 40) {
      faceColor = 0xeab308; // dry yellow
      condition = 'Kering';
      floatSpeed = 0.5;
    } else if (humidity >= 40 && humidity <= 70) {
      faceColor = 0x10b981; // normal green
      condition = 'Normal';
      floatSpeed = 1.0;
    } else {
      faceColor = 0x06b6d4; // damp cyan/blue-light
      condition = 'Lembap';
      floatSpeed = 2.0;
    }

    const faceGroup = new THREE.Group();

    // 1. SPHERE FACE
    const faceGeometry = new THREE.SphereGeometry(1.8, 32, 32);
    const faceMaterial = new THREE.MeshPhongMaterial({
      color: faceColor,
      shininess: 50,
    });
    const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
    faceGroup.add(faceMesh);

    // 2. CRYING OR SWEATING DROPLETS
    // Create droplet shape path
    const dropletGroup = new THREE.Group();
    if (condition === 'Lembap') {
      const dropGeom = new THREE.ConeGeometry(0.15, 0.4, 16);
      const dropMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 });
      
      // Left sweat drop
      const leftDrop = new THREE.Mesh(dropGeom, dropMat);
      leftDrop.position.set(-0.7, 0.8, 1.4);
      leftDrop.rotation.z = 0.2;
      dropletGroup.add(leftDrop);

      // Right sweat drop
      const rightDrop = new THREE.Mesh(dropGeom, dropMat);
      rightDrop.position.set(0.8, 0.2, 1.4);
      rightDrop.rotation.z = -0.4;
      dropletGroup.add(rightDrop);
    } else if (condition === 'Kering') {
      // Dry scales / cracks mesh simulation or uncomfortable face band
      const crackGeom = new THREE.TorusGeometry(0.2, 0.04, 4, 16, Math.PI);
      const crackMat = new THREE.MeshPhongMaterial({ color: 0x71717a });
      const leftCrack = new THREE.Mesh(crackGeom, crackMat);
      leftCrack.position.set(-0.8, -0.6, 1.4);
      leftCrack.rotation.z = -0.4;
      dropletGroup.add(leftCrack);
    }

    faceGroup.add(dropletGroup);

    // EYES
    const eyeGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const eyeMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 80 });

    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.6, 0.4, 1.5);
    faceGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.6, 0.4, 1.5);
    faceGroup.add(rightEye);

    // MOUTH
    let mouthMesh: THREE.Mesh;
    if (condition === 'Kering') {
      // flat straight straight face line
      const mouthGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8);
      const mouthMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
      mouthMesh = new THREE.Mesh(mouthGeom, mouthMat);
      mouthMesh.position.set(0, -0.4, 1.6);
      mouthMesh.rotation.z = Math.PI / 2;
    } else if (condition === 'Normal') {
      // smiley arc
      const mouthGeom = new THREE.TorusGeometry(0.4, 0.08, 8, 24, Math.PI);
      const mouthMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
      mouthMesh = new THREE.Mesh(mouthGeom, mouthMat);
      mouthMesh.position.set(0, -0.1, 1.6);
      mouthMesh.rotation.x = Math.PI / 1.1;
      mouthMesh.rotation.z = Math.PI;
    } else {
      // super humid smiley / mouth open to absorb water
      const mouthGeom = new THREE.TorusGeometry(0.3, 0.09, 8, 24, Math.PI * 2);
      const mouthMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
      mouthMesh = new THREE.Mesh(mouthGeom, mouthMat);
      mouthMesh.position.set(0, -0.4, 1.6);
    }
    faceGroup.add(mouthMesh);

    scene.add(faceGroup);

    // PARTICLES (Water droplets or dust)
    const pCount = 80;
    const pGeom = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pSpeeds = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      pSpeeds[i] = 0.01 + Math.random() * 0.02;
    }

    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    let partColor = 0x67e8f9; // Cyan
    if (condition === 'Kering') partColor = 0xfef08a; // Warm yellow dust
    else if (condition === 'Normal') partColor = 0x34d399; // Emerald

    const pMat = new THREE.PointsMaterial({
      color: partColor,
      size: condition === 'Lembap' ? 0.14 : 0.08,
      transparent: true,
      opacity: 0.8,
    });
    const pSystem = new THREE.Points(pGeom, pMat);
    scene.add(pSystem);

    // MOUSE DRAGGING FOR ROTATION
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dX = e.clientX - prevMouseX;
      const dY = e.clientY - prevMouseY;
      faceGroup.rotation.y += dX * 0.01;
      faceGroup.rotation.x += dY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // ANIMATION
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Buoyancy / floating wave action
      if (condition === 'Lembap') {
        // waving sine up and down (representing underwater wave)
        faceGroup.position.y = Math.sin(time * 2.5) * 0.25;
        faceGroup.rotation.y = time * 0.6;
        faceGroup.rotation.z = Math.sin(time * 1.5) * 0.05;

        // drip droplets
        dropletGroup.position.y = Math.sin(time * 5) * 0.05;
      } else if (condition === 'Normal') {
        // smooth circular motion
        faceGroup.position.y = Math.sin(time * 1.2) * 0.1;
        faceGroup.rotation.y = time * 0.4;
      } else {
        // slow rotation for dry conditions
        faceGroup.position.y = Math.sin(time * 0.6) * 0.05;
        faceGroup.rotation.y = time * 0.15;
      }

      // Update particles
      const positions = pSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pCount; i++) {
        if (condition === 'Lembap') {
          // Humid/rain droplets drifting down and waving slightly
          positions[i * 3 + 1] -= pSpeeds[i] * 1.2;
          positions[i * 3] += Math.sin(time + i) * 0.005;
          if (positions[i * 3 + 1] < -3) {
            positions[i * 3 + 1] = 3;
            positions[i * 3] = (Math.random() - 0.5) * 6;
          }
        } else {
          // slow floating ambient dust particles
          positions[i * 3 + 1] += (Math.sin(time * 0.5 + i) * 0.003) * floatSpeed;
          positions[i * 3] += (Math.cos(time * 0.5 + i) * 0.003) * floatSpeed;
        }
      }
      pSystem.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: w, height: h } = entries[0].contentRect;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      faceGeometry.dispose();
      faceMaterial.dispose();
      eyeGeom.dispose();
      eyeMat.dispose();
      if (mouthMesh) {
        mouthMesh.geometry.dispose();
        (mouthMesh.material as THREE.Material).dispose();
      }
      pGeom.dispose();
      pMat.dispose();

      if (rendererRef.current && rendererRef.current.domElement) {
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [humidity, themeMode]);

  return (
    <div 
      id="kelembapan-emoticon-canvas-container"
      ref={containerRef} 
      className="w-full h-[220px] relative cursor-grab active:cursor-grabbing rounded-xl overflow-hidden glassmorphism flex justify-center items-center"
    />
  );
};
