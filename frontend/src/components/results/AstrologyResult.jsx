import React from 'react';
import { motion } from 'framer-motion';

export default function AstrologyResult({ data, system }) {

    const zodiacSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

    const elements = [
    { name: '火象元素', percent: 31, color: '#ff5555' },
    { name: '土象元素', percent: 26, color: '#ffb86c' },
    { name: '風象元素', percent: 28, color: '#50fa7b' },
    { name: '水象元素', percent: 15, color: '#8be9fd' },
    ];

    return (
        <div className="astrology-perfect-panel" style={{ position: 'relative', overflow: 'hidden', minHeight: 560, display: 'grid', gridTemplateColumns: '380px 1fr', gap: '28px', color: '#fff', fontFamily: "'Noto Serif TC', serif", padding: 20, borderRadius: 8 }}>
            <img
                src="/assets/astrology/astrologyBackground.png"
                alt=""
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.42,
                    mixBlendMode: 'screen',
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 45%, rgba(80,250,123,0.08), rgba(0,0,0,0.54) 58%, rgba(0,0,0,0.82))', pointerEvents: 'none', zIndex: 0 }} />
            
            {/* 左欄：超炫西洋同心圓星盤軌跡儀 */}
            <div style={{ border: '1px solid rgba(80, 250, 123, 0.25)', padding: '24px 16px', background: 'rgba(2, 18, 10, 0.35)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', minHeight: '440px', zIndex: 1 }}>
            
            {/* 外層黃道刻度發光大圈 */}
            <div style={{
                width: '240px', height: '240px', borderRadius: '50%', border: '2px solid #50fa7b', position: 'relative',
                background: 'repeating-conic-gradient(from 0deg, rgba(80,250,123,0.06) 0deg 15deg, transparent 15deg 30deg)',
                boxShadow: '0 0 25px rgba(80,250,123,0.15), inset 0 0 20px rgba(80,250,123,0.15)',
                display: 'grid', placeItems: 'center'
            }}>
                {/* 內嵌相位交織光網幾何圓 */}
                <div style={{ position: 'absolute', width: '80%', height: '80%', border: '1px dashed rgba(80,250,123,0.25)', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(80,250,123,0.3), transparent)', transform: 'rotate(45deg)' }} />
                <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,85,85,0.3), transparent)', transform: 'rotate(115deg)' }} />
                <span style={{ color: '#50fa7b', fontSize: '2.8rem', filter: 'drop-shadow(0 0 10px #50fa7b)' }}>✵</span>
                </div>

                {/* 軸線標示: ASC, DSC, MC, IC */}
                <div style={{ position: 'absolute', left: '-25px', fontSize: '0.68rem', color: '#50fa7b', fontWeight: 'bold' }}>ASC</div>
                <div style={{ position: 'absolute', right: '-25px', fontSize: '0.68rem', color: '#50fa7b', fontWeight: 'bold' }}>DSC</div>
                <div style={{ position: 'absolute', top: '-20px', fontSize: '0.68rem', color: '#50fa7b', fontWeight: 'bold' }}>MC</div>

                {/* 環狀放射渲染 12 星座星體刻度記號 */}
                {zodiacSymbols.map((sym, idx) => (
                <div key={idx} style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: `rotate(${idx * 30}deg) translateY(-106px) rotate(-${idx * 30}deg)`,
                    color: 'rgba(80,250,123,0.8)', fontSize: '0.95rem'
                }}>{sym}</div>
                ))}
            </div>

            {/* 底部軸位度數資訊 */}
            <div style={{ marginTop: '24px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', letterSpacing: '0.06em', lineHeight: 1.5 }}>
                <div>出生資料：1995年08月23日 15:45</div>
                <div style={{ color: '#50fa7b' }}>台北市, 台灣 (GMT+8)</div>
            </div>
            </div>

            {/* 右欄：本命星盤摘要 + 三巨頭 + 四元素 + 星體落點詳細表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
            
            {/* 1. 本命星盤摘要 */}
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                <h4 style={{ color: '#50fa7b', fontSize: '0.88rem', margin: '0 0 6px' }}>你的本命星盤摘要</h4>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
                你的星盤展現出理性與感性的平衡，內在渴望理解世界並以實際行動帶來改變。你擁有強烈的洞察力與溝通能力，能在關係中建立深層連結，並在多元領域中發揮影響力。
                </p>
            </div>

            {/* 2. 雙欄配置：核心配置 + 四元素分佈 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                {/* 三巨頭核心 */}
                <div style={{ border: '1px solid rgba(80,250,123,0.15)', padding: '12px 14px', borderRadius: '6px', background: 'rgba(0,10,5,0.2)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ color: '#50fa7b', fontWeight: 'bold', fontSize: '0.82rem', marginBottom: '4px' }}>核心配置</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>☀️ 太陽星座 (Sun)</span> <strong style={{ color: '#fff' }}>獅子座 0°42'</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>🌙 月亮星座 (Moon)</span> <strong style={{ color: '#fff' }}>天蠍座 18°27'</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>⇡ 上升星座 (Asc)</span> <strong style={{ color: '#50fa7b' }}>雙子座 12°15'</strong></div>
                </div>

                {/* 元素分佈 */}
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px', borderRadius: '6px', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', justifyGap: 'center', gap: '6px' }}>
                {elements.map(e => (
                    <div key={e.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{e.name}</span>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', margin: '0 10px', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${e.percent}%`, height: '100%', background: e.color }} />
                    </div>
                    <span style={{ fontWeight: 'bold', width: '30px', textAlign: 'right' }}>{e.percent}%</span>
                    </div>
                ))}
                </div>
            </div>

            {/* 3. 行星落點細緻數據表格 */}
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: 'rgba(80,250,123,0.12)', color: '#50fa7b' }}>
                    <th style={{ padding: '8px 12px' }}>行星</th>
                    <th style={{ padding: '8px 12px' }}>落入星座</th>
                    <th style={{ padding: '8px 12px' }}>精確度數</th>
                    <th style={{ padding: '8px 12px' }}>落入宮位</th>
                    </tr>
                </thead>
                <tbody>
                    {(data.planets || [
                    { planet: '太陽 ☉', sign: '獅子座', degree: "00°42'", house: '第1宮' },
                    { planet: '月亮 ☽', sign: '天蠍座', degree: "18°27'", house: '第6宮' },
                    { planet: '水星 ☿', sign: '處女座', degree: "14°11'", house: '第4宮' },
                    { planet: '金星 ♀', sign: '巨蟹座', degree: "27°03'", house: '第2宮' },
                    { planet: '火星 ♂', sign: '天秤座', degree: "06°48'", house: '第5宮' },
                    ]).map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '8px 12px', color: '#fff', fontWeight: '500' }}>{p.planet}</td>
                        <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.8)' }}>{p.sign}</td>
                        <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{p.degree}</td>
                        <td style={{ padding: '8px 12px', color: '#50fa7b' }}>{p.house}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            </div>
        </div>
    );
}
