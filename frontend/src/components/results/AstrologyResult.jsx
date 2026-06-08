import React, { useRef, useState } from 'react';
import { Copy, Download, ExternalLink, Heart, Loader2, Sparkles, CalendarDays, Clock, MapPin } from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  TbZodiacAries,
  TbZodiacTaurus,
  TbZodiacGemini,
  TbZodiacCancer,
  TbZodiacLeo,
  TbZodiacVirgo,
  TbZodiacLibra,
  TbZodiacScorpio,
  TbZodiacSagittarius,
  TbZodiacCapricorn,
  TbZodiacAquarius,
  TbZodiacPisces
} from 'react-icons/tb';

const ZODIAC = ['牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];
const SYMBOLS = [
  <TbZodiacAries key="aries" />,
  <TbZodiacTaurus key="taurus" />,
  <TbZodiacGemini key="gemini" />,
  <TbZodiacCancer key="cancer" />,
  <TbZodiacLeo key="leo" />,
  <TbZodiacVirgo key="virgo" />,
  <TbZodiacLibra key="libra" />,
  <TbZodiacScorpio key="scorpio" />,
  <TbZodiacSagittarius key="sagittarius" />,
  <TbZodiacCapricorn key="capricorn" />,
  <TbZodiacAquarius key="aquarius" />,
  <TbZodiacPisces key="pisces" />
];
const elements = [
  { name: '火象', percent: 31, color: '#d88944', icon: '△' },
  { name: '土象', percent: 26, color: '#b8c56f', icon: '◇' },
  { name: '風象', percent: 28, color: '#41d49a', icon: '☍' },
  { name: '水象', percent: 15, color: '#68c9d9', icon: '▽' }
];

export default function AstrologyResult({
  data,
  form,
  report,
  copyPrompt,
  runAiReading,
  isAiReading,
  isFavorite,
  toggleFavorite,
  aiTargets = []
}) {
  const exportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showPromptMenu, setShowPromptMenu] = useState(false);
  const safeForm = form || {};
  const planets = data?.planets?.length ? data.planets : [];
  const summary = report
    ? report.split('\n').filter(Boolean).slice(0, 4).join('\n')
    : '你的星盤展現出理性與感性的平衡，內在渴望理解世界並以實際行動帶來改變。你擁有強烈的洞察力與溝通能力，能在關係中建立深層連結，並在多元領域中發揮影響力。';
  const core = [
    planets[0] || { planet: '太陽', sign: '獅子', degree: "0°42'" },
    planets[1] || { planet: '月亮', sign: '天蠍', degree: "18°27'" },
    { planet: '上升', sign: planets[2]?.sign || '雙子', degree: planets[2]?.degree || "12°15'" }
  ];

  async function handleExport() {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#020907',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.download = `西洋星盤結果_${Date.now()}.jpg`;
      link.click();
    } catch (error) {
      console.error('Astrology export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section ref={exportRef} className="astrology-result-shell" style={shell}>
      <style>{astrologyCSS}</style>
      <img src="/assets/astrology/astrologyBackground.png" alt="" style={bgImage} />
      <div style={bgShade} />

      <button type="button" className="favorite-btn" style={favoriteButton(isFavorite)} onClick={toggleFavorite} title="收藏">
        <Heart size={15} fill={isFavorite ? '#50fa7b' : 'transparent'} />
      </button>

      <aside style={leftPane}>
        <div style={titleBlock}>
          <span style={kicker}>ASTRAL CHART RESULT</span>
          <h1 style={mainTitle}>星盤結果</h1>
        </div>

        <div style={wheelStage}>
          <div style={wheelOuter}>
            {SYMBOLS.map((symbol, index) => (
              <span key={index} style={{ ...zodiacMark, transform: `rotate(${index * 30}deg) translateY(-145px) rotate(-${index * 30}deg)` }}>
                {symbol}
              </span>
            ))}
            {planets.slice(0, 10).map((planet, index) => (
              <span key={`${planet.planet}-${index}`} style={{ ...planetMark, transform: `rotate(${index * 37 + 12}deg) translateY(-85px) rotate(-${index * 37 + 12}deg)` }}>
                {planet.planet?.slice(0, 1)}
              </span>
            ))}
            <span style={{ ...axisLabel, left: '-28px' }}>ASC</span>
            <span style={{ ...axisLabel, right: '-28px' }}>DSC</span>
            <span style={{ ...axisLabel, top: '-20px' }}>MC</span>
            <span style={{ ...axisLabel, bottom: '-20px' }}>IC</span>
            <div style={aspectWeb} />
            <span style={centerStar}>✦</span>
          </div>
        </div>

        <div style={birthBox}>
          <div style={birthRow}><b style={{ color: '#d4af37', letterSpacing: '0.1em' }}>出生資料</b></div>
          <div style={birthRow}><CalendarDays size={14} color="#d4af37" /> <span>{safeForm.birthDate || '1995 年 8 月 23 日 (週三)'}</span></div>
          <div style={birthRow}><Clock size={14} color="#d4af37" /> <span>{safeForm.birthTime || '15:45 (GMT+8)'}</span></div>
          <div style={birthRow}><MapPin size={14} color="#d4af37" /> <span>{safeForm.birthPlace || '台北市, 台灣'}</span></div>
        </div>
      </aside>

      <main style={rightPane}>
        <section style={{ ...panel, gridColumn: '1 / -1' }}>
          <ModuleTitle>你的本命星盤摘要</ModuleTitle>
          <p style={summaryText}>{summary}</p>
        </section>

        <section style={panel}>
          <ModuleTitle>核心配置</ModuleTitle>
          <div style={coreList}>
            {core.map((item, index) => (
              <div key={`${item.planet}-${index}`} style={coreRow}>
                <span style={{ color: '#d4af37', width: '16px', textAlign: 'center' }}>{index === 0 ? '☉' : index === 1 ? '☽' : 'ASC'}</span>
                <b>{item.planet}</b>
                <em>{item.sign}</em>
                <small>{item.degree}</small>
              </div>
            ))}
          </div>
        </section>

        <section style={panel}>
          <ModuleTitle>行星落點</ModuleTitle>
          <div style={planetGrid}>
            {planets.slice(0, 10).map((planet) => (
              <div key={planet.planet} style={planetRow}>
                <b>{planet.planet}</b>
                <span>{planet.sign}</span>
                <small>{planet.degree}</small>
                <em>{planet.house}</em>
              </div>
            ))}
          </div>
        </section>

        <section style={panel}>
          <ModuleTitle>元素分布</ModuleTitle>
          <div style={elementSectionLayout}>
            <div style={elementWrap}>
              {elements.map((item) => (
                <div key={item.name} style={elementRow}>
                  <span style={{ color: item.color, width: '16px' }}>{item.icon}</span>
                  <b>{item.name}</b>
                  <div style={track}><i style={{ display: 'block', height: '100%', borderRadius: 999, width: `${item.percent}%`, background: item.color }} /></div>
                  <small>{item.percent}%</small>
                </div>
              ))}
            </div>
            <div style={doughnutChart}>
              <span style={doughnutCenter}>✦</span>
            </div>
          </div>
        </section>

        <section style={panel}>
          <ModuleTitle>重點提示</ModuleTitle>
          <div style={tips}>
            {[
              '太陽位在獅子座，天生具備舞台魅力與領導力，渴望被看見與肯定。',
              '月亮落在天蠍座，情感深刻敏銳，直覺強，重視真實與信任。',
              '上升雙子座賦予你靈活的表達力與好奇心，適合探索與溝通的領域。',
              '水星處女座，思維細緻務實，擅長分析與組織，是問題解決者。'
            ].map((tip) => <p key={tip}>✦ {tip}</p>)}
          </div>
        </section>
      </main>

      <div style={actionBar} data-html2canvas-ignore="true">
        <div style={timingActions}>
          {[
            ['year', '流年'],
            ['month', '流月'],
            ['day', '流日']
          ].map(([key, label]) => (
            <button key={key} type="button" className="action-btn timing-btn" onClick={() => runAiReading?.(key)} disabled={isAiReading}>
              <CalendarDays size={13} /> {label}
            </button>
          ))}
        </div>
        <div style={promptWrap}>
          <button type="button" className="action-btn" onClick={() => setShowPromptMenu((open) => !open)}>
            <Copy size={14} /> 複製 Prompt 給 AI
          </button>
          {showPromptMenu && (
            <div style={promptMenu}>
              {aiTargets.map((target) => (
                <button key={target.label} type="button" onClick={() => {
                  copyPrompt?.(target.url);
                  setShowPromptMenu(false);
                }}>
                  {target.label}<ExternalLink size={12} />
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="action-btn primary-btn" onClick={runAiReading} disabled={isAiReading}>
          <Sparkles size={14} /> {isAiReading ? 'AI 解讀中...' : 'AI 解讀'}
        </button>
        <button type="button" className="action-btn" onClick={handleExport} disabled={isExporting}>
          {isExporting ? <Loader2 size={14} style={{ animation: 'astroSpin 1.4s linear infinite' }} /> : <Download size={14} />}
          {isExporting ? '匯出中...' : '匯出報告'}
        </button>
      </div>
    </section>
  );
}

function ModuleTitle({ children }) {
  return <h3 style={moduleTitle}><span>{children}</span><i /></h3>;
}

const font = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';
const green = '#50fa7b';

// 外層佈局進一步壓緊 padding 和 gap
const shell = {
  position: 'relative',
  height: 'calc(100vh - 80px)', // 固定高度避免亂長
  display: 'grid',
  gridTemplateColumns: '0.8fr 1.6fr',
  gridTemplateRows: '1fr auto',
  gap: '10px 20px',
  padding: '10px 16px 16px',
  color: '#f6ead2',
  fontFamily: font,
  boxSizing: 'border-box',
  overflow: 'hidden' // 防止內容溢出
};

const bgImage = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, mixBlendMode: 'screen', pointerEvents: 'none' };
const bgShade = { position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.5), rgba(0,14,9,0.2) 48%, rgba(0,0,0,0.4)), radial-gradient(circle at 46% 48%, rgba(80,250,123,0.05), transparent 55%)', pointerEvents: 'none' };

const leftPane = { position: 'relative', zIndex: 1, display: 'grid', gridTemplateRows: 'auto 1fr auto', minWidth: 0, gap: '10px' };
const titleBlock = { alignSelf: 'start' };
const kicker = { display: 'block', color: green, letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: 4 };
const mainTitle = { margin: 0, fontSize: 'clamp(1.4rem, 2vw, 1.8rem)', fontWeight: 500, letterSpacing: '0.1em', color: '#f6ead2', textShadow: '0 0 20px rgba(80,250,123,0.15)' };
const wheelStage = { display: 'grid', placeItems: 'center', minHeight: 0 };

const wheelOuter = {
  position: 'relative',
  width: 'min(320px, min(90%, 45vh))', // 再縮小星盤
  aspectRatio: '1',
  borderRadius: '50%',
  border: '1px solid rgba(212,175,55,0.4)',
  background: 'repeating-conic-gradient(from 0deg, rgba(212,175,55,0.05) 0deg 1deg, transparent 1deg 15deg), radial-gradient(circle, rgba(80,250,123,0.05), rgba(0,0,0,0.2) 58%, rgba(0,0,0,0.4))',
  boxShadow: '0 0 30px rgba(80,250,123,0.1), inset 0 0 30px rgba(212,175,55,0.1)',
  display: 'grid',
  placeItems: 'center'
};

const zodiacMark = { position: 'absolute', left: '50%', top: '50%', color: '#f3d18a', fontSize: '1rem', textShadow: '0 0 10px rgba(212,175,55,0.5)' };
const planetMark = { position: 'absolute', left: '50%', top: '50%', color: green, fontSize: '0.85rem', textShadow: '0 0 10px rgba(80,250,123,0.5)' };
const axisLabel = { position: 'absolute', color: '#f3d18a', fontSize: '0.6rem', letterSpacing: '0.1em' };
const aspectWeb = { width: '55%', aspectRatio: '1', borderRadius: '50%', border: '1px dashed rgba(80,250,123,0.25)', background: 'linear-gradient(35deg, transparent 48%, rgba(80,250,123,0.2) 49%, transparent 51%), linear-gradient(112deg, transparent 48%, rgba(212,175,55,0.2) 49%, transparent 51%)' };
const centerStar = { position: 'absolute', color: '#fff5c8', fontSize: '1.4rem', filter: 'drop-shadow(0 0 15px rgba(255,246,196,0.5))' };

// 出生資料改用 Lucide Icons
const birthBox = { display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 14px', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 4, background: 'rgba(0,8,6,0.3)', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', alignSelf: 'end' };
const birthRow = { display: 'flex', gap: 8, alignItems: 'center' };

// 右側面板進一步縮小
const rightPane = { position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '0.9fr 1.3fr', gridTemplateRows: 'auto auto auto', gap: '8px 12px', minWidth: 0, alignContent: 'start' };
const panel = { minWidth: 0, border: '1px solid rgba(212,175,55,0.2)', borderRadius: 4, background: 'rgba(0,12,8,0.35)', boxShadow: 'inset 0 0 15px rgba(80,250,123,0.02)', padding: '10px 14px', overflow: 'hidden' };
const moduleTitle = { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10, alignItems: 'center', margin: '0 0 6px', color: '#f3d18a', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.1em' };
const summaryText = { margin: 0, whiteSpace: 'pre-line', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, fontSize: '0.75rem' };
const coreList = { display: 'grid', gap: 6 };
const coreRow = { display: 'grid', gridTemplateColumns: '16px 1fr 1fr auto', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem' };
const planetGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' };
const planetRow = { display: 'grid', gridTemplateColumns: '40px 1fr 45px 35px', gap: 4, alignItems: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' };

// 元素分布圓圈縮小
const elementSectionLayout = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' };
const elementWrap = { display: 'grid', gap: 6 };
const elementRow = { display: 'grid', gridTemplateColumns: '16px 35px minmax(0, 1fr) 30px', gap: 6, alignItems: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' };
const track = { height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' };

const doughnutChart = {
  width: 54,
  height: 54,
  borderRadius: '50%',
  background: 'conic-gradient(#d88944 0% 31%, #b8c56f 31% 57%, #41d49a 57% 85%, #68c9d9 85% 100%)',
  WebkitMask: 'radial-gradient(transparent 58%, black 59%)',
  mask: 'radial-gradient(transparent 58%, black 59%)',
  display: 'grid',
  placeItems: 'center',
  marginRight: '8px'
};
const doughnutCenter = { position: 'absolute', color: '#f3d18a', fontSize: '0.8rem', textShadow: '0 0 8px rgba(212,175,55,0.6)' };

const tips = { display: 'grid', gap: 4, color: 'rgba(255,255,255,0.65)', lineHeight: 1.3, fontSize: '0.7rem', margin: 0 };

const actionBar = { gridColumn: '1 / -1', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: '4px 30px 0', alignItems: 'center' };
const promptWrap = { position: 'relative', minWidth: 0 };
const timingActions = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' };

const promptMenu = { position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 6px)', zIndex: 20, display: 'grid', gap: 4, padding: 4, borderRadius: 4, border: '1px solid rgba(80,250,123,0.3)', background: 'rgba(0,10,7,0.95)', boxShadow: '0 10px 20px rgba(0,0,0,0.5), 0 0 10px rgba(80,250,123,0.1)' };
const favoriteButton = (active) => ({ position: 'absolute', top: 12, right: 16, zIndex: 8, width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: '50%', border: '1px solid rgba(80,250,123,0.3)', background: active ? 'rgba(80,250,123,0.15)' : 'rgba(0,0,0,0.2)', color: active ? green : 'rgba(80,250,123,0.6)', cursor: 'pointer' });

// 加入強化的 Hover 效果和 Transition
const astrologyCSS = `
  .astrology-result-panel {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    overflow: visible !important;
  }
  .astrology-result-panel::before,
  .astrology-result-panel > div:first-child {
    display: none !important;
  }
  .astrology-result-shell h3 i {
    height: 1px;
    background: linear-gradient(90deg, rgba(212,175,55,0.5), transparent);
  }
  
  /* 按鈕共用樣式與動畫 */
  .action-btn {
    width: 100%;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 4px;
    border: 1px solid rgba(212,175,55,0.3);
    background: linear-gradient(90deg, rgba(80,250,123,0.05), rgba(0,0,0,0.3), rgba(212,175,55,0.05));
    color: #f6ead2;
    font-family: ${font};
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  /* 主按鈕 (AI 解讀) 樣式 */
  .primary-btn {
    border-color: rgba(246,234,210,0.5);
    box-shadow: 0 0 15px rgba(80,250,123,0.1), inset 0 0 10px rgba(80,250,123,0.05);
  }

  /* Hover 效果：發光、上浮、邊框變亮 */
  .action-btn:hover:not(:disabled) {
    border-color: rgba(80,250,123,0.6);
    background: linear-gradient(90deg, rgba(80,250,123,0.15), rgba(0,0,0,0.4), rgba(80,250,123,0.1));
    color: #fff;
    box-shadow: 0 4px 20px rgba(80,250,123,0.25), inset 0 0 15px rgba(80,250,123,0.1);
    transform: translateY(-2px);
  }
  
  .primary-btn:hover:not(:disabled) {
    border-color: #50fa7b;
    box-shadow: 0 4px 25px rgba(80,250,123,0.35), inset 0 0 20px rgba(80,250,123,0.2);
  }

  .action-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(80,250,123,0.2);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: wait;
    transform: none;
    box-shadow: none;
  }
  
  /* 收藏按鈕 Hover */
  .favorite-btn {
    transition: all 0.2s ease;
  }
  .favorite-btn:hover {
    box-shadow: 0 0 15px rgba(80,250,123,0.4);
    background: rgba(80,250,123,0.2) !important;
  }

  .astrology-result-shell [style*="rgba(0,10,7,0.95)"] button {
    min-height: 28px;
    display: inline-flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid transparent;
    border-radius: 3px;
    background: rgba(80,250,123,0.03);
    color: rgba(255,255,255,0.8);
    cursor: pointer;
    padding: 0 8px;
    font-family: ${font};
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    transition: all 0.2s ease;
  }
  .astrology-result-shell [style*="rgba(0,10,7,0.95)"] button:hover {
    border-color: rgba(80,250,123,0.4);
    background: rgba(80,250,123,0.15);
    color: #fff;
    padding-left: 12px; /* 增加小小的位移動畫 */
  }
  
  @keyframes astroSpin {
    to { transform: rotate(360deg); }
  }
`;
