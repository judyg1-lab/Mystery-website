import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Points, PointMaterial, Environment } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { Wand2, ArrowRight, BookOpen } from 'lucide-react';
import { useHandGesture } from '../hooks/useHandGesture';
import * as THREE from 'three';

// ================= 沙漏主體 =================
function CosmicGate({ phase, isCleaning }) {
  const pointsRef = useRef();
  const count = 120000;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3); // particle positions (x, y, z)
    const cols = new Float32Array(count * 3); // particle colors (r, g, b)
    const palette = [new THREE.Color('#ffffff'), new THREE.Color('#bc13fe'), new THREE.Color('#7000ff'), new THREE.Color('#d4af37')];
    const planeY = 26; // define the vertical range of the tornado
    const coreConcave = 4; //define the radius of the core at the center (y=0), smaller is tighter, larger is looser
    const concaveFactor = 0.045; // control how quickly the tornado expands as it goes up/down, smaller is more cylindrical, larger is more conical

    for (let i = 0; i < count; i++) {
      const i3 = i * 3; // index for x, y, z in the positions array and r, g, b in the colors array
      const theta = Math.random() * Math.PI * 2;
      const py = (Math.random() - 0.5) * (planeY * 2.1); // particle's y position, allowing some to go slightly beyond the defined plane for a more natural look
      const radiusAtY = coreConcave + (Math.abs(py) * Math.abs(py) * concaveFactor); // calculate the radius of the tornado at this y level, using a quadratic function for a more natural curve
      const r = radiusAtY + (Math.random() - 0.5) * 2.0; // control each particle's distance from the center axis, smaller range is more uniform, larger range is more chaotic
      const twist = py * 0.2;
      pos[i3] = Math.cos(theta + twist) * r;
      pos[i3 + 1] = py;
      pos[i3 + 2] = Math.sin(theta + twist) * r;

      const colorSample = palette[Math.floor(Math.random() * palette.length)];
      const dist = Math.sqrt(pos[i3]*pos[i3] + pos[i3+2]*pos[i3+2]); // distance from the center axis (plane distance)
      const brightness = Math.max(0.4, 2.2 - (dist / 35)); // particles closer to the center are brighter, those farther away are dimmer, with a minimum brightness threshold
      cols[i3] = colorSample.r * brightness;
      cols[i3 + 1] = colorSample.g * brightness;
      cols[i3 + 2] = colorSample.b * brightness;
    }
    return [pos, cols];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime(); // get the time for animation

    if (phase === 0) {
      if (isCleaning) {
        // --- 龍捲風加速旋轉 ---
        pointsRef.current.rotation.y += delta * 6.0;
        pointsRef.current.scale.setScalar(1 + Math.sin(time * 25) * 0.04);
      } else {
        pointsRef.current.rotation.y = time * 0.06;
        pointsRef.current.position.y = Math.sin(time * 0.5) * 0.4;
        pointsRef.current.scale.setScalar(1);
      }
    } else {
      // --- 終極 Shut Down ---
      pointsRef.current.scale.x = THREE.MathUtils.lerp(pointsRef.current.scale.x, 0, 0.25);
      pointsRef.current.scale.z = THREE.MathUtils.lerp(pointsRef.current.scale.z, 0, 0.25); //props(current,target,speed)
      pointsRef.current.scale.y = THREE.MathUtils.lerp(pointsRef.current.scale.y, 2.0, 0.1);
      pointsRef.current.position.z += delta * 60; // rapidly move forward to create a warp effect
    }
  });

  return (
    <Suspense fallback={null}>
      <Points ref={pointsRef} positions={positions} colors={colors}>
        <PointMaterial size={0.05} vertexColors transparent opacity={0.9} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
      </Points>
    </Suspense>
  );
}

// ================= 白色閃電 =================
function LightningStrikes({ phase, isCleaning }) {
  const groupRef = useRef();
  const linesRef = useRef([]);
  // 數量大幅下修，只留 8 根，讓畫面更高級
  const count = 8;

  const lightningData = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const points = [];
      // 半徑鎖定在 0.5 ~ 3.5 之間，確保閃電只在龍捲風核心內部
      const radius = 0.5 + Math.random() * 3.0;
      const angle = Math.random() * Math.PI * 2;
      let y = (Math.random() - 0.5) * 20;
      const segments = 6;

      let x = Math.cos(angle) * radius;
      let z = Math.sin(angle) * radius;

      for (let j = 0; j < segments; j++) {
        // 減少擴散 (Spread)，讓線條更聚攏
        x += (Math.random() - 0.5) * 0.4;
        z += (Math.random() - 0.5) * 0.4;
        y += (Math.random() - 0.5) * 2.8; // 控制閃電的垂直走向，讓它更有層次感
        points.push(new THREE.Vector3(x, y, z));
      }
      arr.push({
        geometry: new THREE.BufferGeometry().setFromPoints(points),
        speed: 0.05 + Math.random() * 0.1,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    // 嚴格限制：沒在轉或已進入導向，絕對隱藏
    if (!isCleaning || phase !== 0) {
      linesRef.current.forEach(line => { if (line) line.visible = false; });
      return;
    }

    const time = state.clock.getElapsedTime();
    // 閃電跟隨龍捲風慢速旋轉
    groupRef.current.rotation.y = time * 0.1;

    linesRef.current.forEach((line, i) => {
      if (!line) return;

      // 正常的頻率
      const flicker = Math.sin(time * 5 + i * 2);

      if (flicker > 0.82) {
        line.visible = true;
        line.material.opacity = 0.5 + Math.random() * 0.5;
        //  稍微放大增加存在感
        line.scale.setScalar(1.2 + Math.random() * 0.8);
      } else {
        line.visible = false;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {lightningData.map((item, i) => (
        <line key={i} ref={(el) => (linesRef.current[i] = el)} geometry={item.geometry}>
          <lineBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} linewidth={2} />
        </line>
      ))}
    </group>
  );
}

// ================= 主頁面 =================
export default function EnterPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);
  const [isSensor, setIsSensor] = useState(false);
  const [castProgress, setCastProgress] = useState(0);
  const [isCleaning, setIsCleaning] = useState(false);

  const canvasRef = useRef(null);
  const { videoRef, gestureData } = useHandGesture(canvasRef, isSensor);
  const lastPos = useRef(null);

  const triggerWarp = () => {
    if (phase !== 0) return;
    setCastProgress(100);
    setIsSensor(false);
    setIsCleaning(true);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());// stop webcam immediately
    }

    setTimeout(() => {
      setPhase(1);
      setTimeout(() => { navigate('/login'); }, 1800);
    }, 1200);
  };

  useEffect(() => {
    if (phase !== 0 || !isSensor || !gestureData || !gestureData.active || isCleaning) {
      lastPos.current = null;
      return;
    }
    if (!lastPos.current) {
      lastPos.current = { x: gestureData.x, y: gestureData.y };
      return;
    }
    const dx = gestureData.x - lastPos.current.x;
    const dy = gestureData.y - lastPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy); // calculate the distance moved since the last frame

    if (distance > 0.03) {
      setCastProgress(prev => {
        const bonus = distance * 400; // scale gesture impact, adjust multiplier for faster/slower progress
        const next = prev + bonus;
        if (next >= 100) { triggerWarp(); return 100; }
        return next;
      });
    }
    lastPos.current = { x: gestureData.x, y: gestureData.y };
  }, [gestureData, phase, isSensor, isCleaning]);

  return (
    <div style={{ height: '100vh', backgroundColor: '#000', color: '#fff', position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(circle at center, #0a0212 0%, #000000 85%)' }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <Canvas>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 5, 38]} fov={phase === 1 ? 110 : 35} />
            <ambientLight intensity={0.3} />
            <CosmicGate phase={phase} isCleaning={isCleaning} />
            <LightningStrikes phase={phase} isCleaning={isCleaning} />
            <Environment preset="night" />
          </Suspense>
        </Canvas>
      </div>

      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>

        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            opacity: phase === 0 ? 1 : 0,
            transform: phase === 0 ? 'scale(1)' : 'scale(2.5) translateZ(150px)',
            transition: 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <h2 style={{ fontFamily: 'Cinzel', fontSize: '1.2rem', letterSpacing: '14px', color: 'rgba(212, 175, 55, 0.8)', marginBottom: '10px' }}>
            MYSTIC ARCHIVE
          </h2>

          <h1 style={{
              fontFamily: 'Cinzel', fontSize: '8.5rem', margin: '0', fontWeight: '900',
              color: '#ffffff', letterSpacing: '20px',
              textShadow: '0 0 50px rgba(188, 19, 254, 0.5)'
          }}>
            ALOHOMORA
          </h1>

          <div style={{
            marginTop: '35px', padding: '15px 30px', background: 'rgba(10, 5, 20, 0.5)',
            backdropFilter: 'blur(5px)', borderRadius: '2px', border: '1px solid rgba(212, 175, 55, 0.2)',
            display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <BookOpen size={20} color="#d4af37" style={{ filter: 'drop-shadow(0 0 5px #d4af37)' }} />
            <p style={{ color: '#ddd', letterSpacing: '5px', fontSize: '0.9rem', margin: 0, fontFamily: 'Cinzel', fontWeight: '500' }}>
              WEAVE THE ARCANE THREADS TO UNLOCK THE GATES OF TRUTH
            </p>
          </div>

          <div style={{ width: '550px', marginTop: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#aaa', fontFamily: 'Cinzel', fontSize: '0.75rem', letterSpacing: '4px' }}>
                <span>{isCleaning ? 'INITIATING VOID JUMP...' : 'ALIGNING DIMENSIONS...'}</span>
                <span>{Math.floor(castProgress)}%</span>
            </div>
            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }}>
              <div style={{ height: '100%', background: isCleaning ? '#bc13fe' : '#fff', width: `${castProgress}%`, boxShadow: isCleaning ? '0 0 20px #bc13fe' : '0 0 15px #fff', transition: 'width 0.2s ease-out, background 0.4s' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '30px', marginTop: '60px', pointerEvents: 'auto' }}>
            <button onClick={() => setIsSensor(!isSensor)}
              style={{ padding: '16px 40px', background: isSensor ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid #555', color: '#fff', cursor: 'pointer', fontFamily: 'Cinzel', letterSpacing: '4px', fontSize: '0.8rem', transition: 'all 0.3s ease', borderRadius: '2px' }}
              onMouseEnter={(e) => { e.target.style.borderColor = '#ffffff'; e.target.style.boxShadow = '0 0 25px rgba(255,255,255,0.6)'; }}
              onMouseLeave={(e) => { e.target.style.borderColor = isSensor ? '#ffffff' : '#555';e.target.style.boxShadow = 'none'; }}
            >
              <Wand2 size={16} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
              {isSensor ? 'ARCANE READY' : 'WAKE SENSOR'}
            </button>
            <button onClick={triggerWarp}
                style={{ padding: '16px 40px', background: '#fff', border: 'none', color: '#000', cursor: 'pointer', fontFamily: 'Cinzel', fontWeight: 'bold', letterSpacing: '5px', fontSize: '0.8rem', transition: 'all 0.3s ease', borderRadius: '2px' }}
                onMouseEnter={(e) => { e.target.style.borderColor = '#bc13fe'; e.target.style.boxShadow = '0 0 20px rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { e.target.style.borderColor = '#fff'; e.target.style.boxShadow = 'none';}}>
                INVOKE GATE
                <ArrowRight size={16} style={{ marginLeft: '10px', verticalAlign: 'middle' }} />
            </button>
          </div>
        </div>
      </div>

      <video ref={videoRef} autoPlay playsInline style={{ display: 'none' }} />
      <div style={{
          position: 'absolute', bottom: '40px', left: '40px', zIndex: 100,
          width: '200px', height: '140px', borderRadius: '4px', overflow: 'hidden', 
          border: `1px solid ${isSensor ? '#fff' : '#333'}`, background: '#000', 
          opacity: (isSensor && phase === 0 && !isCleaning) ? 0.85 : 0, transition: '0.6s', pointerEvents: 'none',
      }}>
        <div style={{ position: 'absolute', top: '5px', left: '0', width: '100%', textAlign: 'center', color: '#fff', fontSize: '0.6rem', fontFamily: 'Cinzel', zIndex: 10 }}>
            WAVE TO ALIGN
        </div>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
      </div>
    </div>
  );
}
