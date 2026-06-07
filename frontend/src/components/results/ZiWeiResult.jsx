import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, Copy, Download, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ZiWeiResult({ data, system, form, copyPrompt, runAiReading, isAiReading, isFavorite, toggleFavorite, aiTargets = [] }) {
  // 建立截圖參考節點與匯出狀態
  const exportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showPromptMenu, setShowPromptMenu] = useState(false);

  // 接收傳入的表單資料，若無則給予預設值防呆
  const safeForm = form || { name: '未知名', gender: '未知', birthDate: 'YYYY/MM/DD', birthTime: '未知', birthPlace: '' };

  const fortuneMetrics = [
    { label: '事業運', score: 88, color: 'linear-gradient(90deg, rgba(0,100,255,0.8), rgba(0,204,255,0.9))' },
    { label: '財運', score: 82, color: 'linear-gradient(90deg, rgba(0,100,255,0.8), rgba(0,204,255,0.9))' },
    { label: '感情運', score: 75, color: 'linear-gradient(90deg, rgba(0,100,255,0.8), rgba(0,204,255,0.9))' },
    { label: '健康運', score: 70, color: 'linear-gradient(90deg, rgba(0,100,255,0.8), rgba(0,204,255,0.9))' },
    { label: '貴人運', score: 85, color: 'linear-gradient(90deg, rgba(0,100,255,0.8), rgba(0,204,255,0.9))' },
  ];

  const mainStars = [
    { palace: '命宮', star: '天府', type: '帶福之星', note: '穩重、管理、理財能力強' },
    { palace: '身宮', star: '天相', type: '輔佐之星', note: '公正穩健，得貴人扶持' },
    { palace: '財帛宮', star: '武曲', type: '財星', note: '財務規劃佳，重視效率' },
    { palace: '官祿宮', star: '天相', type: '事業星', note: '適合行政、管理、顧問' },
    { palace: '夫妻宮', star: '天府', type: '穩定之星', note: '關係重視承諾，互助互信' },
  ];

  const gridPositions = [
    { gridColumn: '1', gridRow: '1' }, { gridColumn: '2', gridRow: '1' },
    { gridColumn: '3', gridRow: '1' }, { gridColumn: '4', gridRow: '1' },
    { gridColumn: '4', gridRow: '2' }, { gridColumn: '4', gridRow: '3' },
    { gridColumn: '4', gridRow: '4' }, { gridColumn: '3', gridRow: '4' },
    { gridColumn: '2', gridRow: '4' }, { gridColumn: '1', gridRow: '4' },
    { gridColumn: '1', gridRow: '3' }, { gridColumn: '1', gridRow: '2' },
  ];

  const safePalaces = data?.palaces?.length === 12 ? data.palaces : Array(12).fill({ palace: '未知', decade: '', main: '', aux: '', stem: '', branch: '' });

  // 匯出成圖片功能
  const handleExport = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#02060f', // 確保底色是深藍黑，避免透明變白底
        scale: 2, // 2倍高畫質匯出
        useCORS: true, // 允許跨域圖片（星盤圖片）
        logging: false
      });
      
      const image = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `命盤結果_${new Date().getTime()}.jpg`;
      link.click();
    } catch (err) {
      console.error('匯出失敗:', err);
      alert('匯出圖片時發生錯誤，請稍後再試。');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    // 綁定 exportRef 到這個最外層 Wrapper
    <div ref={exportRef} className="ziwei-fullscreen-wrapper" style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        padding: '24px 4% 20px', 
        boxSizing: 'border-box',
        color: '#fff', 
        fontFamily: "'Noto Serif TC', serif",
        display: 'flex',
        flexDirection: 'column'
    }}>
        
        <style>{`
        .mystic-result-panel { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .mystic-result-panel::before { display: none !important; }
        .mystic-result-panel > div:first-child { display: none !important; }
        
        .glass-btn {
            height: 42px; padding: 0 16px; background: rgba(0, 204, 255, 0.03); border: 1px solid rgba(0, 204, 255, 0.3);
            color: rgba(255, 255, 255, 0.85); border-radius: 4px; font-size: 0.8rem; cursor: pointer;
            display: flex; align-items: center; gap: 6px; transition: all 0.3s ease; backdrop-filter: blur(4px);
        }
        .glass-btn:hover { background: rgba(0, 204, 255, 0.1); border-color: rgba(0, 204, 255, 0.6); color: #fff; }
        
        .glow-btn {
            height: 42px; padding: 0 24px; background: rgba(0, 15, 30, 0.6); border: 1px solid #00ccff;
            color: #00ccff; border-radius: 4px; font-size: 0.8rem; cursor: pointer; display: flex;
            align-items: center; gap: 6px; transition: all 0.3s ease; backdrop-filter: blur(4px);
            box-shadow: inset 0 0 12px rgba(0,204,255,0.15), 0 0 15px rgba(0,204,255,0.1);
        }
        .glow-btn:hover {
            box-shadow: inset 0 0 18px rgba(0,204,255,0.3), 0 0 25px rgba(0,204,255,0.3);
            text-shadow: 0 0 8px rgba(0,204,255,0.5); background: rgba(0, 25, 45, 0.8); color: #fff;
        }

        .ghost-btn {
            height: 42px; padding: 0 14px; background: transparent; border: none; color: rgba(255, 255, 255, 0.5);
            font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.3s ease;
        }
        .ghost-btn:hover:not(:disabled) { color: #fff; }
        .ghost-btn:disabled { cursor: not-allowed; opacity: 0.6; }
        .ziwei-prompt-menu button {
            min-height: 34px;
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            border: 1px solid transparent;
            border-radius: 4px;
            background: rgba(0,204,255,0.035);
            color: rgba(255,255,255,0.82);
            cursor: pointer;
            padding: 0 10px;
            letter-spacing: 0.08em;
        }
        .ziwei-prompt-menu button:hover {
            border-color: rgba(0,204,255,0.44);
            background: rgba(0,204,255,0.12);
            color: #e6f7ff;
        }

        @keyframes slowSpin { 100% { transform: rotate(360deg); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>

        {/* 粒子流動背景 */}
        <div style={{ position: 'absolute', inset: -100, zIndex: -1, pointerEvents: 'none', opacity: 0.75 }}>
        <ChartParticleField systemKey="ziwei" />
        </div>
        <button
          type="button"
          onClick={toggleFavorite}
          title="收藏"
          style={{
            position: 'absolute',
            top: 18,
            right: 22,
            zIndex: 8,
            width: 38,
            height: 38,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            border: '1px solid rgba(0,204,255,0.38)',
            background: isFavorite ? 'rgba(0,204,255,0.16)' : 'rgba(0,0,0,0.26)',
            color: isFavorite ? '#00ccff' : 'rgba(0,204,255,0.78)',
            cursor: 'pointer',
            boxShadow: isFavorite ? '0 0 18px rgba(0,204,255,0.34)' : 'none',
            transition: 'filter 160ms ease, transform 160ms ease, background 160ms ease'
          }}
        >
          <Heart size={18} fill={isFavorite ? '#00ccff' : 'transparent'} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1.8fr', gap: '40px', flex: 1, alignItems: 'stretch' }}>
        
        {/* =========================================
            左側欄：標題 -> 縮小版 12宮格 -> 操作按鈕
        ========================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(0,204,255,0.7)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Zi Wei Dou Shu Result</div>
            <h1 style={{ 
                fontSize: '2rem', fontWeight: 300, margin: '6px 0 0', letterSpacing: '0.15em', 
                textShadow: '0 0 20px rgba(0,204,255,0.3)', color: '#e6f7ff'
            }}>命盤結果</h1>
            </div>

            <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: '4px', 
            background: 'rgba(2, 8, 16, 0.5)', padding: '6px', borderRadius: '8px', 
            border: '1px solid rgba(0, 204, 255, 0.2)', aspectRatio: '1', width: '100%',
            maxWidth: '390px'
            }}>
            {safePalaces.map((p, idx) => (
                <motion.div key={idx} style={{
                    ...gridPositions[idx], border: '1px solid rgba(0, 204, 255, 0.1)', borderRadius: '4px', padding: '6px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.4), rgba(0, 5, 15, 0.7))', cursor: 'pointer'
                }}
                whileHover={{ scale: 1.04, borderColor: 'rgba(0,204,255,0.6)', boxShadow: '0 0 15px rgba(0, 204, 255, 0.25)', zIndex: 10 }}
                >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>
                    <span>{p.palace}</span><span>{p.decade}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 400, color: '#00ccff', textShadow: '0 0 8px rgba(0, 204, 255, 0.4)', letterSpacing: '0.05em' }}>{p.main || '空'}</span>
                    {p.aux && <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{p.aux}</div>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
                    <span>{p.stem}{p.branch}</span><span style={{ color: '#00ccff' }}>{idx === 6 ? '祿權科' : ''}</span>
                </div>
                </motion.div>
            ))}

            {/* 🎯 中央：命主專屬資料區 */}
            <div style={{ gridColumn: '2 / 4', gridRow: '2 / 4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 4, color: 'rgba(255,255,255,0.15)', fontSize: '0.55rem' }}>北</div>
                <div style={{ position: 'absolute', bottom: 4, color: 'rgba(255,255,255,0.15)', fontSize: '0.55rem' }}>南</div>
                <div style={{ position: 'absolute', left: 4, color: 'rgba(255,255,255,0.15)', fontSize: '0.55rem' }}>西</div>
                <div style={{ position: 'absolute', right: 4, color: 'rgba(255,255,255,0.15)', fontSize: '0.55rem' }}>東</div>
                
                {/* 背景微光星芒 */}
                <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(0,204,255,0.12) 0%, transparent 65%)', display: 'grid', placeItems: 'center', zIndex: 0, pointerEvents: 'none' }}>
                <span style={{ color: 'rgba(0,204,255,0.35)', fontSize: '5.5rem', filter: 'blur(3px)', animation: 'slowSpin 25s linear infinite' }}>✦</span>
                </div>

                {/* 命主詳細資料 */}
                <div style={{ zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{ fontSize: '0.6rem', color: 'rgba(0,204,255,0.7)', letterSpacing: '0.2em' }}>QUERENT</div>
                <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 500, letterSpacing: '0.1em', textShadow: '0 0 10px rgba(0,204,255,0.5)', margin: '2px 0' }}>{safeForm.name}</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>
                    {safeForm.gender} {safeForm.birthPlace ? `· ${safeForm.birthPlace}` : ''}
                </div>

                {/* 分隔線 */}
                <div style={{ width: '28px', height: '1px', background: 'rgba(0,204,255,0.4)', margin: '5px 0' }} />

                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>{safeForm.birthDate}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace' }}>{safeForm.birthTime || '未知時辰'}</div>

                {/* 命身主小標 */}
                <div style={{ marginTop: '8px', fontSize: '0.6rem', color: '#00ccff', background: 'rgba(0,204,255,0.1)', border: '1px solid rgba(0,204,255,0.25)', padding: '2px 8px', borderRadius: '12px' }}>
                    命主：天府 · 身主：天相
                </div>
                </div>
            </div>
            </div>

            {/* 🎯 按鈕移動到這裡！匯出按鈕掛上 handleExport 並且在匯出時有 Loading 狀態 */}
            <div data-html2canvas-ignore="true" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginTop: '28px', width: '100%', maxWidth: '390px' }}>
            <button className="glow-btn" onClick={runAiReading} disabled={isAiReading}>
                {isAiReading ? <Loader2 size={14} style={{ animation: 'spin 2s linear infinite' }} /> : <Sparkles size={14} />}
                {isAiReading ? 'AI 解讀中' : 'AI 智能解讀'}
            </button>
            <div style={{ position: 'relative' }}>
                <button className="glass-btn" onClick={() => setShowPromptMenu((open) => !open)}>
                    <Copy size={12} /> 複製 Prompt
                </button>
                {showPromptMenu && (
                    <div className="ziwei-prompt-menu" style={{
                        position: 'absolute',
                        left: 0,
                        bottom: 'calc(100% + 8px)',
                        zIndex: 20,
                        display: 'grid',
                        gap: 6,
                        minWidth: 150,
                        padding: 8,
                        borderRadius: 6,
                        border: '1px solid rgba(0,204,255,0.34)',
                        background: 'rgba(0,8,18,0.96)',
                        boxShadow: '0 18px 32px rgba(0,0,0,0.48), 0 0 18px rgba(0,204,255,0.16)'
                    }}>
                        {aiTargets.map((target) => (
                            <button key={target.label} type="button" onClick={() => {
                                copyPrompt?.(target.url);
                                setShowPromptMenu(false);
                            }}>
                                {target.label}<ExternalLink size={13} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button className="ghost-btn" onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 size={12} style={{ animation: 'spin 2s linear infinite' }} /> : <Download size={12} />} 
                {isExporting ? '匯出中...' : '匯出'}
            </button>
            </div>

        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '15px', paddingBottom: '30px' }}>

            <div style={{ background: 'rgba(0, 8, 18, 0.4)', border: '1px solid rgba(0,204,255,0.12)', padding: '22px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#00ccff', fontSize: '0.85rem', margin: '0 0 12px', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '6px' }}>✦ 命格摘要</h3>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: '1.7', margin: 0, flex: 1 }}>
                命宮為天府坐命，格局穩健，具領導與統籌能力。天府得襯權科，象徵財富與貴人相助，人生多得資源與支持。官祿宮天相得襯福科，事業上有貴人提攜，適合公職、管理或策劃類工作。財帛宮武曲由襯祿權，理財能力佳，善於累積不動產與長期資產。整體格局屬中上，穩中求進。
            </p>
            </div>

            <div style={{ background: 'rgba(0, 8, 18, 0.4)', border: '1px solid rgba(0,204,255,0.12)', padding: '22px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#00ccff', fontSize: '0.85rem', margin: '0 0 14px', fontWeight: 400 }}>✦ 主星配置</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left', flex: 1 }}>
                <thead>
                <tr style={{ color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ paddingBottom: '6px', fontWeight: 400 }}>宮位</th><th style={{ paddingBottom: '6px', fontWeight: 400 }}>主星</th><th style={{ paddingBottom: '6px', fontWeight: 400 }}>性質</th><th style={{ paddingBottom: '6px', fontWeight: 400 }}>重點解析</th>
                </tr>
                </thead>
                <tbody>
                {mainStars.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 0', color: 'rgba(255,255,255,0.6)' }}>{row.palace}</td>
                    <td style={{ padding: '8px 0', color: '#00ccff' }}>{row.star}</td>
                    <td style={{ padding: '8px 0', color: 'rgba(255,255,255,0.5)' }}>{row.type}</td>
                    <td style={{ padding: '8px 0', color: 'rgba(255,255,255,0.5)' }}>{row.note}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>

            <div style={{ background: 'rgba(0, 8, 18, 0.4)', border: '1px solid rgba(0,204,255,0.12)', padding: '22px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#00ccff', fontSize: '0.85rem', margin: '0 0 16px', fontWeight: 400 }}>✦ 運勢重點</h3>
            <div style={{ display: 'grid', gap: '14px', alignContent: 'center', flex: 1 }}>
                {fortuneMetrics.map((m) => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', width: '45px' }}>{m.label}</span>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.score}%` }} transition={{ duration: 1.2, ease: "easeOut" }} style={{ height: '100%', background: m.color, boxShadow: '0 0 8px rgba(0,204,255,0.4)' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(0,204,255,0.8)', width: '50px', textAlign: 'right', fontFamily: 'monospace' }}>{m.score} / 100</span>
                </div>
                ))}
            </div>
            </div>

            <div style={{ background: 'rgba(0, 8, 18, 0.4)', border: '1px solid rgba(0,204,255,0.12)', padding: '22px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#00ccff', fontSize: '0.85rem', margin: '0 0 14px', fontWeight: 400 }}>✦ 重點提示 · AI 洞察</h3>
            <div style={{ display: 'grid', gap: '12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, alignContent: 'center', flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px' }}><Star size={12} style={{ color: '#f3d18a', flexShrink: 0, marginTop: '3px', opacity: 0.8 }} /> <span>命宮天府星旺，宜穩中求進，切忌冒進投機。</span></div>
                <div style={{ display: 'flex', gap: '8px' }}><Star size={12} style={{ color: '#f3d18a', flexShrink: 0, marginTop: '3px', opacity: 0.8 }} /> <span>官祿宮得襯權科，近期事業發展有升遷或轉機機會。</span></div>
                <div style={{ display: 'flex', gap: '8px' }}><Star size={12} style={{ color: '#f3d18a', flexShrink: 0, marginTop: '3px', opacity: 0.8 }} /> <span>財帛宮武曲由襯祿權，適合長期投資與不動產佈局。</span></div>
                <div style={{ display: 'flex', gap: '8px' }}><Star size={12} style={{ color: '#f3d18a', flexShrink: 0, marginTop: '3px', opacity: 0.8 }} /> <span>流年逢吉星拱照，把握機會可大幅提升成果。</span></div>
            </div>
            </div>

        </div>
        </div>
    </div>
    );
}

export function ChartParticleField({ systemKey }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;
    let particles = [];
    let tick = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: 350 }, () => ({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * canvas.width,
        speed: 0.1 + Math.random() * 0.25,
        size: 0.4 + Math.random() * 1.0,
        color: ['#ffffff', '#00aaff', '#55ccff'][Math.floor(Math.random() * 3)],
        alpha: 0.15 + Math.random() * 0.5
      }));
    };

    const render = () => {
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.5;
      tick += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const aura = ctx.createRadialGradient(cx, cy, 10, cx, cy, canvas.width * 0.6);
      aura.addColorStop(0, 'rgba(0,150,255,0.06)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.z -= p.speed;
        if (p.z <= 0) {
          p.x = (Math.random() - 0.5) * canvas.width * 2;
          p.y = (Math.random() - 0.5) * canvas.height * 2;
          p.z = canvas.width;
        }
        const depth = 150 / p.z;
        const x = p.x * depth + cx + Math.sin(tick + p.y * 0.003) * 10;
        const y = p.y * depth + cy;
        if (x < -20 || x > canvas.width + 20 || y < -20 || y > canvas.height + 20) return;

        ctx.globalAlpha = p.alpha * Math.max(0.1, 1 - p.z / canvas.width);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (0.6 + depth * 1.2), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      frameId = requestAnimationFrame(render);
    };

    resize();
    render();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', mixBlendMode: 'screen' }} />;
}
