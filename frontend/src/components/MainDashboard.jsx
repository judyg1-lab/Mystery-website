import React, { useState, useRef, useMemo, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, Environment, Points, PointMaterial } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { Brain, Search, Menu } from 'lucide-react';
import { useHandGesture } from '../hooks/useHandGesture';
import * as THREE from 'three';
import { debounce } from 'lodash';
import ProfileIcon from './ProfileIcon';

const PARTICLE_COUNT = 5000;

const MYSTIC_REALMS = [
  { id: 'tarot', titleEn: 'TAROT', titleZh: '托特塔羅', color: '#bc13fe', desc: 'THE MIRROR OF SOUL', path: '/tarot' },
  { id: 'bazi', titleEn: 'BAZI', titleZh: '四柱八字', color: '#ffcc00', desc: 'RHYTHM OF FIVE ELEMENTS', path: '/bazi' },
  { id: 'ziwei', titleEn: 'ZI WEI', titleZh: '紫微斗數', color: '#00ccff', desc: 'STELLAR DESTINY COMPASS', path: '/ziwei' },
  { id: 'astrology', titleEn: 'ASTROLOGY', titleZh: '占星命盤', color: '#00fa9a', desc: 'COSMIC BLUEPRINT', path: '/astrology' }
];

// ================= NavLink =================
const NavLink = ({ label, color, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative', cursor: 'pointer', padding: '5px 10px',
        fontFamily: 'Cinzel', fontSize: '0.9rem', letterSpacing: '4px',
        color: isHovered ? '#fff' : '#aaa',
        textShadow: isHovered ? `0 0 15px ${color}` : 'none',
        transition: 'all 0.4s ease'
      }}
    >
      {label}
      <div style={{
        position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)',
        width: isHovered ? '100%' : '0%', height: '1.5px',
        background: color, boxShadow: `0 0 10px ${color}`,
        transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }} />
    </div>
  );
};

// ================= math generate shape =================
function generateShapes() {
  const shapes = {
    tarot: new Float32Array(PARTICLE_COUNT * 3),
    bazi: new Float32Array(PARTICLE_COUNT * 3),
    ziwei: new Float32Array(PARTICLE_COUNT * 3),
    astrology: new Float32Array(PARTICLE_COUNT * 3),
    baziColors: new Float32Array(PARTICLE_COUNT * 3)
  }; // 5000 particles, each with x,y,z

  const wuxingColors = [
    new THREE.Color('#2e7d32'), // 木
    new THREE.Color('#d32f2f'), // 火
    new THREE.Color('#fbc02d'), // 土
    new THREE.Color('#eeeeee'), // 金
    new THREE.Color('#1565c0')  // 水
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    // Tarot
    const tAngle = (i % 5) * (Math.PI * 2 / 5);
    const tNext = ((i % 5) + 2) * (Math.PI * 2 / 5);
    const t = Math.random();
    shapes.tarot[i3] = THREE.MathUtils.lerp(Math.cos(tAngle) * 16, Math.cos(tNext) * 16, t) + (Math.random()-0.5)*0.2;
    shapes.tarot[i3+1] = THREE.MathUtils.lerp(Math.sin(tAngle) * 16, Math.sin(tNext) * 16, t) + (Math.random()-0.5)*0.2;
    shapes.tarot[i3+2] = (Math.random() - 0.5) * 1.5;

    // Bazi
    const bIdx = Math.floor(Math.random() * 8);
    const bAngle = (bIdx * Math.PI) / 4;
    const bR = Math.random() > 0.3 ? 16 : 6;
    shapes.bazi[i3] = Math.cos(bAngle) * bR + (Math.random()-0.5)*0.8;
    shapes.bazi[i3+1] = Math.sin(bAngle) * bR + (Math.random()-0.5)*0.8;
    shapes.bazi[i3+2] = (Math.random() - 0.5) * 1.5;
    const col = wuxingColors[i % 5];
    shapes.baziColors[i3] = col.r; shapes.baziColors[i3+1] = col.g; shapes.baziColors[i3+2] = col.b;

    // Ziwei
    const rRing = (i % 4 + 1) * 4.5;
    const rTheta = Math.random() * 2 * Math.PI;
    shapes.ziwei[i3] = Math.cos(rTheta) * rRing + (Math.random()-0.5)*0.2;
    shapes.ziwei[i3+1] = Math.sin(rTheta) * rRing + (Math.random()-0.5)*0.2;
    shapes.ziwei[i3+2] = (Math.random() - 0.5) * 1;

    // Astrology
    const nR = Math.pow(Math.random(), 1.5) * 35;
    const nTheta = Math.random() * 2 * Math.PI;
    shapes.astrology[i3] = nR * Math.cos(nTheta);
    shapes.astrology[i3+1] = nR * Math.sin(nTheta);
    shapes.astrology[i3+2] = (Math.random() - 0.5) * 6;
  }
  return shapes;
}

// ================= 核心粒子系統 =================
function CosmicCore({ currentId, color, gestureData }) {
  const pointsRef = useRef();
  const geoRef = useRef();
  const persistentScale = useRef(1);
  const shapes = useMemo(() => generateShapes(), []);

  // ===== 滑鼠：平滑跟隨版本（重點升級）=====
  const mouse = useRef(new THREE.Vector3(0, 0, 0));
  const smoothMouse = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      mouse.current.set(x * 20, y * 20, 0);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useFrame((state, delta) => {
    if (!geoRef.current) return;

    const pos = geoRef.current.attributes.position.array;
    const colAttr = geoRef.current.attributes.color.array;
    const targetPos = shapes[currentId] || shapes.tarot;

    if (!targetPos) return;

    // ===== smooth mouse（讓滑鼠變“水晶球感”）=====
    smoothMouse.current.lerp(mouse.current, 0.12);

    const mx = smoothMouse.current.x;
    const my = smoothMouse.current.y;
    const mz = smoothMouse.current.z;

    for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
      const tx = targetPos[i];
      const ty = targetPos[i + 1];

      // ===== 形狀回彈 =====
      pos[i] = THREE.MathUtils.lerp(pos[i], tx, 0.08);
      pos[i + 1] = THREE.MathUtils.lerp(pos[i + 1], ty, 0.08);
      pos[i + 2] = THREE.MathUtils.lerp(pos[i + 2], targetPos[i + 2], 0.08);

      // ===== mouse interaction =====
      const dx = pos[i] - mx;
      const dy = pos[i + 1] - my;

      const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;

      const influenceRadius = 4;
      const strength = 0.08;

      if (dist < influenceRadius) {
        const force = 1 - dist / influenceRadius;

        pos[i] += (dx / dist) * force * strength;
        pos[i + 1] += (dy / dist) * force * strength;
      }

      // ===== color =====
      if (currentId === "bazi") {
        colAttr[i] = THREE.MathUtils.lerp(colAttr[i], shapes.baziColors[i], 0.1);
        colAttr[i + 1] = THREE.MathUtils.lerp(colAttr[i + 1], shapes.baziColors[i + 1], 0.1);
        colAttr[i + 2] = THREE.MathUtils.lerp(colAttr[i + 2], shapes.baziColors[i + 2], 0.1);
      } else {
        const c = new THREE.Color(color);
        colAttr[i] = THREE.MathUtils.lerp(colAttr[i], c.r, 0.1);
        colAttr[i + 1] = THREE.MathUtils.lerp(colAttr[i + 1], c.g, 0.1);
        colAttr[i + 2] = THREE.MathUtils.lerp(colAttr[i + 2], c.b, 0.1);
      }

      // ===== glow =====
      const glow = Math.max(0, 1 - dist / 5);
      colAttr[i] += glow * 1.2;
      colAttr[i + 1] += glow * 1.2;
      colAttr[i + 2] += glow * 1.2;

      // ===== center energy =====
      const centerDist = Math.sqrt(pos[i] * pos[i] + pos[i + 1] * pos[i + 1]);
      const centerGlow = Math.max(0, 1 - centerDist / 20);

      colAttr[i] += centerGlow * 0.3;
      colAttr[i + 1] += centerGlow * 0.3;
      colAttr[i + 2] += centerGlow * 0.3;
    }

    geoRef.current.attributes.position.needsUpdate = true;
    geoRef.current.attributes.color.needsUpdate = true;

    // ===== gesture scale =====
    if (gestureData.active) {
      persistentScale.current = THREE.MathUtils.lerp(
        persistentScale.current,
        gestureData.scale,
        0.1
      );
    }

    pointsRef.current.scale.setScalar(persistentScale.current);
    pointsRef.current.rotation.y += delta * 0.4;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={shapes[currentId]}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={new Float32Array(PARTICLE_COUNT * 3)}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        size={0.12}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ================= 專屬彩色銀河背景 (Galaxy Nebula Background) =================
function GalaxyBackground() {
  const pointsRef = useRef();
  const count = 20000; // 增加到 2 萬顆，更壯觀

  // 產生位置與顏色資料
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    
    const palette = [
      new THREE.Color('#00ccff'), // 冰藍
      new THREE.Color('#bc13fe'), // 幽冥紫
      new THREE.Color('#ff0080'), // 玫瑰粉
      new THREE.Color('#ffffff'), // 純白
      new THREE.Color('#d4af37'), // 魔法金
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // 隨機分佈在一個巨大的圓球空間 (半徑 100~400)
      const radius = 100 + Math.random() * 300; 
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);

      // 隨機選顏色並加上亮度
      const col = palette[Math.floor(Math.random() * palette.length)];
      cols[i3] = col.r;
      cols[i3 + 1] = col.g;
      cols[i3 + 2] = col.b;
    }
    return [pos, cols];
  }, []);

  useFrame((state, delta) => {
    // 銀河自轉
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
      pointsRef.current.rotation.z += delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}           // 【放大】讓星星更明顯
        sizeAttenuation={true}
        vertexColors={true}
        transparent={true}
        opacity={0.8}        // 【加深】透明度
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
// ================= 主畫面 =================
export default function MainDashboard() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0); //control which realm is active
  const [isSensor, setIsSensor] = useState(false);
  const canvasRef = useRef(null);

  const currentRealm = MYSTIC_REALMS[currentIndex];
  const { videoRef, gestureData } = useHandGesture(canvasRef, isSensor);

   //remember function reference to avoid unnecessary re-renders
  const nextRealm = useCallback(() => setCurrentIndex(p => (p + 1) % MYSTIC_REALMS.length), []);
  const prevRealm = useCallback(() => setCurrentIndex(p => (p - 1 + MYSTIC_REALMS.length) % MYSTIC_REALMS.length), []);

  const scrollLock = useRef(false);
  const handleWheel = (e) => {
    if (scrollLock.current) return;
    if (Math.abs(e.deltaY) < 30) return; // ignore small scrolls

    if (e.deltaY > 0) nextRealm(); //deltaY= mouse scroll speed /strength
    else prevRealm();

    scrollLock.current = true;
    setTimeout(() => { scrollLock.current = false; }, 500);
  };

  // up/down swipe gesture effect
  useEffect(() => {
    if (!gestureData.swipe) return;
    if (gestureData.swipe === 'DOWN') nextRealm();
    if (gestureData.swipe === 'UP') prevRealm();
  }, [gestureData.swipe, nextRealm, prevRealm]);

  const [btnHover, setBtnHover] = useState(false);
  const [sensorHover, setSensorHover] = useState(false);
  const [searchHover, setSearchHover] = useState(false);

  return (
    <div style={{ height: '100vh', background: '#000', color: '#fff', position: 'relative', overflow: 'hidden' }} onWheel={handleWheel}>

      {/* Navbar */}
        <nav style={{
          position: 'absolute', top: 0, width: '100%', zIndex: 100,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '40px 60px', pointerEvents: 'auto', boxSizing: 'border-box'
        }}>
        {/* left: logo name */}
        <div style={{ fontFamily: 'Cinzel', fontSize: '1.4rem', letterSpacing: '6px', fontWeight: 'bold', width: '200px' }}>
          MYSTIC
        </div>

        {/* center: links and search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '55px', justifyContent: 'center', flex: 1 }}>
          <NavLink label="TAROT" color={currentRealm.color} onClick={() => navigate('/tarot')} /><div style={{ width: '1px', height: '18px', background: '#444' }} />
          <NavLink label="BaZi" color={currentRealm.color} onClick={() => navigate('/bazi')} /><div style={{ width: '1px', height: '18px', background: '#444' }} />
          <NavLink label="ZiWei" color={currentRealm.color} onClick={() => navigate('/ziwei')} /><div style={{ width: '1px', height: '18px', background: '#444' }} />
          <NavLink label="Astrology" color={currentRealm.color} onClick={() => navigate('/astrology')} /><div style={{ width: '1px', height: '18px', background: '#444' }} />
        </div>

        {/* right:Profile */}
        <div onClick={() => navigate('/profile')} style={{ width: '200px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center',gap: '12px', cursor: 'pointer'}}>
          <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
            <div style={{ fontSize: '0.65rem', color: currentRealm.color, letterSpacing: '3px', fontFamily: 'Cinzel', fontWeight: 'bold' }}>ONLINE</div>
            <div style={{ fontSize: '0.6rem', color: '#666', letterSpacing: '1px' }}>AGENT JUDY</div>
          </div>
          <ProfileIcon color={currentRealm.color} />
        </div>
      </nav>

      {/* 2. center UI */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center', pointerEvents: 'auto' }}>
            <h1 style={{
                fontFamily: 'Cinzel', fontSize: '10rem', margin: '0',
                color: currentRealm.color,
                textShadow: `0 0 50px ${currentRealm.color}60, -2px -2px 0px rgba(0,0,0,0.8), 2px 2px 0px rgba(0,0,0,0.8)`,
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                letterSpacing: '-2px'
            }}>
                {currentRealm.titleEn}
            </h1>
            <h2 style={{
                fontSize: '2.5rem', fontWeight: 300, letterSpacing: '35px',
                color: '#fff', opacity: 0.8, marginTop: '-25px',
                textShadow: '0 5px 15px rgba(0,0,0,1)'
            }}>{currentRealm.titleZh}</h2>

            <p style={{ color: '#aaa', marginTop: '60px', letterSpacing: '12px', fontSize: '0.85rem', fontFamily: 'Cinzel' }}>
                — {currentRealm.desc} —
            </p>

            <button
                onClick={() => navigate(currentRealm.path)}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                    marginTop: '50px', padding: '16px 60px', border: `1px solid ${currentRealm.color}`,
                    background: btnHover ? currentRealm.color : 'transparent',
                    color: btnHover ? '#000' : '#fff',textAlign: 'center', fontSize: '0.9rem',
                    cursor: 'pointer', fontFamily: 'Cinzel', letterSpacing: '5px',
                    transition: 'all 0.4s ease', borderRadius: '2px',
                    boxShadow: btnHover ? `0 0 20px ${currentRealm.color}80` : 'none'
                }}
            >INVOKE REALM</button>
        </div>
      </div>

      {/* 3. 3D show */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <Canvas gl={{ alpha: true, preserveDrawingBuffer: true }}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 35]} fov={35} />
            <OrbitControls enablePan={false} enableZoom={false} enableDamping dampingFactor={0.08} rotateSpeed={0.2} />
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={3} color={currentRealm.color} />

            <Float speed={2.5} rotationIntensity={0.6} floatIntensity={0.6}>
                <CosmicCore currentId={currentRealm.id} color={currentRealm.color} gestureData={gestureData} />
            </Float>

            {/* 彩色銀河 */}
            <GalaxyBackground />
            <Environment preset="night" />
          </Suspense>
        </Canvas>
      </div>

      {/* sensor control */}
      <div style={{ position: 'absolute', bottom: '50px', left: '60px', zIndex: 100, display: 'flex', alignItems: 'center', gap: '30px' }}>
        <video ref={videoRef} autoPlay playsInline style={{ display: 'none' }} />
        <button
            onClick={() => setIsSensor(!isSensor)}
            onMouseEnter={() => setSensorHover(true)}
            onMouseLeave={() => setSensorHover(false)}
            style={{
                background: isSensor ? currentRealm.color : (sensorHover ? '#222' : 'transparent'), 
                color: isSensor ? '#000' : '#fff',
                border: `1px solid ${isSensor ? currentRealm.color : '#444'}`,
                padding: '12px 35px', borderRadius: '4px', cursor: 'pointer',
                fontFamily: 'Cinzel', letterSpacing: '3px', fontSize: '0.75rem', transition: '0.4s',
                display: 'flex', alignItems: 'center', gap: '10px',
                boxShadow: isSensor ? `0 0 15px ${currentRealm.color}80` : 'none'
            }}
        >
          <Brain size={16} /> {isSensor ? "SYSTEM ONLINE" : "WAKE SENSOR"}
        </button>

        <div style={{
            width: '160px', height: '110px', borderRadius: '4px', overflow: 'hidden',
            border: `1px solid ${isSensor ? currentRealm.color : '#333'}`,
            background: '#000', opacity: isSensor ? 1 : 0, transition: '0.3s',
            pointerEvents: isSensor ? 'auto' : 'none'
        }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
        </div>
      </div>

      {/* right side page indicators */}
      <div style={{ position: 'absolute', right: '60px', top: '50%', transform: 'translateY(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '35px' }}>
        {MYSTIC_REALMS.map((realm, i) => (
            <div key={i} onClick={() => setCurrentIndex(i)} style={{
                width: i === currentIndex ? '5px' : '1px',
                height: i === currentIndex ? '70px' : '25px',
                background: i === currentIndex ? realm.color : '#444',
                transition: '0.8s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer',
                boxShadow: i === currentIndex ? `0 0 15px ${realm.color}` : 'none'
            }} />
        ))}
      </div>
    </div>
  );
}