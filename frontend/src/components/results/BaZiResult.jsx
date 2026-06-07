import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Copy, Download, ExternalLink, Heart, Loader2, ShieldAlert, Sparkles, Star, Zap } from 'lucide-react';
import html2canvas from 'html2canvas';
import { ChartParticleField } from './ZiWeiResult';

const BAZI_BAGUA_SRC = '/bazi/BaGua-transparent.png';

export default function BaZiResult({
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
  const pillars = data?.pillars?.length ? data.pillars : [
    { name: '年柱', god: '正印', stem: '甲', branch: '子', hidden: '癸水', phase: '沐浴' },
    { name: '月柱', god: '偏印', stem: '乙', branch: '丑', hidden: '己、辛、癸', phase: '墓' },
    { name: '日柱', god: '日主', stem: '丙', branch: '寅', hidden: '甲、丙、戊', phase: '長生' },
    { name: '時柱', god: '劫財', stem: '丁', branch: '卯', hidden: '乙木', phase: '帝旺' }
  ];

  const elementBars = [
    { name: '木', percent: 32, status: '偏旺', color: '#7bd86f' },
    { name: '火', percent: 28, status: '旺', color: '#ff5555' },
    { name: '土', percent: 15, status: '平衡', color: '#ffb86c' },
    { name: '金', percent: 10, status: '偏弱', color: '#f6ead2' },
    { name: '水', percent: 15, status: '平衡', color: '#6aa7c9' }
  ];

  const fortuneRows = [
    { label: '整體運勢', score: 80, icon: <Sparkles size={14} /> },
    { label: '事業運', score: 85, icon: <Award size={14} /> },
    { label: '財運', score: 75, icon: <Download size={14} /> },
    { label: '感情運', score: 70, icon: <Heart size={14} /> },
    { label: '健康運', score: 65, icon: <ShieldAlert size={14} /> }
  ];

  const tips = [
    { title: '貴人相助', body: '命中印星有力，易得長輩、師長提攜。', color: '#7bd86f', icon: <Award size={15} /> },
    { title: '事業發展', body: '適合文化教育、創意設計、顧問諮詢等領域。', color: '#ffcc00', icon: <Zap size={15} /> },
    { title: '財運建議', body: '財星不顯，宜穩健理財，避免投機過度冒險。', color: '#ff5555', icon: <Download size={15} /> },
    { title: '流年提醒', body: '火勢旺時，注意情緒管理與健康作息。', color: '#6aa7c9', icon: <ShieldAlert size={15} /> }
  ];

  const dayMaster = pillars[2] || pillars[0];
  const summary = report
    ? report.split('\n').filter(Boolean).slice(0, 4).join('\n')
    : `${dayMaster.stem || '日主'}火日主，格局以印星與日主能量為核心。此盤適合先穩住節奏，讓資源、學習與人際支持形成長期累積，再逐步推進事業與財務目標。`;

  const handleExport = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#080500',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const image = canvas.toDataURL('image/jpeg', 0.92);
      const link = document.createElement('a');
      link.href = image;
      link.download = `八字四柱結果_${Date.now()}.jpg`;
      link.click();
    } catch (error) {
      console.error('BaZi export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section ref={exportRef} className="bazi-result-shell" style={shell}>
      <style>{baziCSS}</style>
      <div style={particleLayer}>
        <ChartParticleField systemKey="bazi" />
      </div>
      <div style={leftPane}>
        <button type="button" style={favoriteButton(isFavorite)} onClick={toggleFavorite} title="收藏">
          <Heart size={18} fill={isFavorite ? '#ffcc00' : 'transparent'} />
        </button>
        <div style={titleBlock}>
          <h1 style={mainTitle}>命盤結果</h1>
          <span style={subTitle}>FOUR PILLARS RESULT</span>
        </div>

        <div style={baguaStage}>
          <img src={BAZI_BAGUA_SRC} alt="" style={baguaImage} />
          <span style={{ ...guaLabel, top: '8%', left: '50%', transform: 'translateX(-50%)' }}>火<br />離</span>
          <span style={{ ...guaLabel, top: '38%', left: '8%' }}>木<br />震</span>
          <span style={{ ...guaLabel, top: '38%', right: '8%' }}>土<br />坤</span>
          <span style={{ ...guaLabel, bottom: '11%', left: '28%' }}>坎<br />水</span>
          <span style={{ ...guaLabel, bottom: '11%', right: '28%' }}>兌<br />金</span>
        </div>

        <div style={birthInfoBox}>
          <div>出生：{safeForm.birthDate || '未填'} {safeForm.birthTime || '未填'}（{safeForm.gender || '未填'}）</div>
          <div>地點：{safeForm.birthPlace || '未填'}</div>
          <div style={birthInfoFooter}>生成：{new Date().toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      <div style={rightPane}>
        <section style={moduleBox}>
          <ModuleTitle>四柱命盤</ModuleTitle>
          <div style={pillarRow}>
            {pillars.map((pillar) => (
              <motion.div
                key={pillar.name}
                style={pillarCard}
                whileHover={{ y: -5, borderColor: 'rgba(255,204,0,0.82)', boxShadow: '0 0 24px rgba(255,204,0,0.26)' }}
              >
                <span style={pillarBadge}>{pillar.name}</span>
                <small style={pillarGod}>{pillar.god}</small>
                <span style={stemText}>{pillar.stem}</span>
                <span style={branchText}>{pillar.branch}</span>
                <small style={hiddenText}>{pillar.hidden || pillar.phase}</small>
              </motion.div>
            ))}
          </div>
          <div style={pillarMeta}>
            <span>日主：<b>{dayMaster.stem || '丙'}火</b></span>
            <span>命局：<b>正印格</b></span>
            <span>格局層次：<b>中上</b></span>
          </div>
        </section>

        <section style={moduleBox}>
          <ModuleTitle>命格摘要</ModuleTitle>
          <p style={summaryText}>{summary}</p>
          <div style={fortuneList}>
            {fortuneRows.map((row) => (
              <div key={row.label} style={fortuneRow}>
                <span style={fortuneIcon}>{row.icon}</span>
                <span style={fortuneLabel}>{row.label}</span>
                <div style={fortuneTrack}><span style={{ ...fortuneFill, width: `${row.score}%` }} /></div>
                <span style={fortuneScore}>{row.score}%</span>
              </div>
            ))}
          </div>
        </section>

        <section style={moduleBox}>
          <ModuleTitle>五行分布</ModuleTitle>
          <div style={elementPanel}>
            <div style={elementWheel}>
              <img src={BAZI_BAGUA_SRC} alt="" style={elementWheelImage} />
            </div>
            <div style={elementBarsWrap}>
              {elementBars.map((item) => (
                <div key={item.name} style={elementRow}>
                  <span style={{ ...elementSymbol, color: item.color }}>{item.name}</span>
                  <span style={elementPercent}>{item.percent}%</span>
                  <div style={elementTrack}><span style={{ ...elementFill, width: `${item.percent * 2.4}%`, background: item.color }} /></div>
                  <span style={{ ...elementStatus, color: item.color }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={moduleBox}>
          <ModuleTitle>重點提示</ModuleTitle>
          <div style={tipsWrap}>
            {tips.map((tip) => (
              <div key={tip.title} style={tipRow}>
                <span style={{ ...tipIcon, color: tip.color, borderColor: `${tip.color}66` }}>{tip.icon}</span>
                <b style={{ color: tip.color }}>{tip.title}</b>
                <span>{tip.body}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
      <div style={actionBar}>
        <div style={promptActionWrap}>
          <button type="button" style={actionButton} onClick={() => setShowPromptMenu((open) => !open)}>
            複製 Prompt 給 AI <Copy size={16} />
          </button>
          {showPromptMenu && (
            <div style={promptMenuBox}>
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
        <button type="button" style={{ ...actionButton, ...primaryAction }} onClick={runAiReading} disabled={isAiReading}>
          <Sparkles size={17} /> {isAiReading ? 'AI 解讀中' : 'AI 解讀'}
        </button>
        <button type="button" style={actionButton} onClick={handleExport} disabled={isExporting}>
          {isExporting ? <Loader2 size={16} style={{ animation: 'baziSpin 1.4s linear infinite' }} /> : <Download size={16} />}
          {isExporting ? '匯出中' : '匯出報告'}
        </button>
      </div>
    </section>
  );
}

function ModuleTitle({ children }) {
  return (
    <h3 style={moduleTitle}>
      <span>{children}</span>
      <i />
    </h3>
  );
}

const gold = '#ffcc00';
const font = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';

const shell = {
  position: 'relative',
  width: '100%',
  height: 'calc(100vh - 132px)',
  minHeight: 560,
  display: 'grid',
  gridTemplateColumns: '0.62fr 1.72fr',
  gridTemplateRows: 'minmax(0, 1fr) 48px',
  gap: '12px 16px',
  color: '#f6ead2',
  fontFamily: font,
  overflow: 'hidden',
  padding: '14px 8px 0',
  boxSizing: 'border-box'
};

const particleLayer = {
  position: 'absolute',
  inset: '-90px',
  zIndex: 0,
  opacity: 0.42,
  pointerEvents: 'none',
  mixBlendMode: 'screen'
};

const leftPane = {
  minWidth: 0,
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr) auto',
  alignItems: 'center',
  padding: '10px 8px 6px 22px',
  overflow: 'hidden'
};

const titleBlock = { alignSelf: 'start', marginLeft: 24 };
const mainTitle = {
  margin: 0,
  color: '#f3d18a',
  fontSize: 'clamp(1.45rem, 1.9vw, 2.2rem)',
  fontWeight: 500,
  letterSpacing: '0.18em',
  lineHeight: 1.1,
  textShadow: '0 0 18px rgba(255,204,0,0.24)'
};
const subTitle = {
  display: 'block',
  marginTop: 6,
  color: 'rgba(243,209,138,0.82)',
  fontSize: '0.68rem',
  letterSpacing: '0.28em'
};

const baguaStage = {
  position: 'relative',
  width: 'min(340px, 82%)',
  aspectRatio: '1',
  justifySelf: 'center',
  display: 'grid',
  placeItems: 'center',
  marginTop: '-8px'
};
const baguaImage = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  filter: 'drop-shadow(0 0 22px rgba(255,204,0,0.38))'
};
const guaLabel = {
  position: 'absolute',
  color: '#f3d18a',
  textAlign: 'center',
  fontSize: '0.66rem',
  lineHeight: 1.45,
  letterSpacing: '0.18em',
  textShadow: '0 0 14px rgba(255,204,0,0.42)',
  pointerEvents: 'none'
};
const birthInfoBox = {
  width: 'min(330px, 92%)',
  justifySelf: 'start',
  marginLeft: 24,
  display: 'grid',
  gap: '3px',
  padding: '7px 10px',
  border: '1px solid rgba(255,204,0,0.22)',
  borderRadius: 6,
  background: 'rgba(8,5,1,0.42)',
  color: 'rgba(255,255,255,0.72)',
  fontSize: '0.7rem',
  lineHeight: 1.35,
  letterSpacing: '0.06em'
};
const birthInfoFooter = {
  marginTop: 1,
  paddingTop: 4,
  borderTop: '1px solid rgba(255,204,0,0.12)',
  color: 'rgba(243,209,138,0.68)'
};

const rightPane = {
  minWidth: 0,
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gridTemplateRows: 'minmax(205px, 0.95fr) minmax(178px, 0.82fr)',
  gap: '10px',
  alignContent: 'stretch',
  padding: '8px 22px 0 0',
  boxSizing: 'border-box'
};

const moduleBox = {
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid rgba(255,204,0,0.24)',
  borderRadius: 6,
  background: 'linear-gradient(180deg, rgba(22,14,2,0.48), rgba(3,2,0,0.34))',
  boxShadow: 'inset 0 0 24px rgba(255,204,0,0.045)',
  padding: '11px 14px',
  overflow: 'hidden'
};
const moduleTitle = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  alignItems: 'center',
  gap: 12,
  margin: '0 0 9px',
  color: '#f3d18a',
  fontSize: '0.92rem',
  fontWeight: 500,
  letterSpacing: '0.18em'
};
moduleTitle.i = {};

const pillarRow = {
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(58px, 0.78fr))',
  gap: '10px',
  justifyContent: 'center',
  alignItems: 'stretch'
};
const pillarCard = {
  position: 'relative',
  display: 'grid',
  justifyItems: 'center',
  alignContent: 'space-between',
  minHeight: 0,
  padding: '8px 6px 9px',
  borderRadius: '22px 22px 6px 6px',
  border: '1px solid rgba(255,204,0,0.34)',
  background: 'linear-gradient(180deg, rgba(255,204,0,0.16), rgba(7,5,1,0.78) 42%, rgba(255,204,0,0.05))',
  boxShadow: 'inset 0 0 15px rgba(255,204,0,0.1), 0 8px 18px rgba(0,0,0,0.45)',
  color: '#f6ead2',
  transition: 'border-color 180ms ease, box-shadow 180ms ease'
};
const pillarBadge = {
  marginTop: '-4px',
  padding: '2px 8px',
  border: '1px solid rgba(255,204,0,0.32)',
  borderRadius: 14,
  color: '#f3d18a',
  fontSize: '0.66rem',
  letterSpacing: '0.12em',
  background: 'rgba(8,4,0,0.68)'
};
const pillarGod = { color: 'rgba(255,255,255,0.62)', fontSize: '0.58rem' };
const stemText = { color: '#fff7dc', fontSize: 'clamp(1.28rem, 1.55vw, 1.9rem)', lineHeight: 1, textShadow: '0 0 12px rgba(255,255,255,0.28)' };
const branchText = { color: gold, fontSize: 'clamp(1.28rem, 1.55vw, 1.9rem)', lineHeight: 1, textShadow: '0 0 14px rgba(255,204,0,0.44)' };
const hiddenText = {
  width: '100%',
  paddingTop: 5,
  borderTop: '1px solid rgba(255,204,0,0.16)',
  color: 'rgba(255,255,255,0.52)',
  fontSize: '0.55rem',
  textAlign: 'center'
};
const pillarMeta = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px 12px',
  marginTop: 8,
  padding: '6px 8px',
  border: '1px solid rgba(255,204,0,0.2)',
  borderRadius: 4,
  color: 'rgba(255,255,255,0.68)',
  fontSize: '0.72rem'
};

const summaryText = {
  whiteSpace: 'pre-line',
  margin: 0,
  color: 'rgba(255,255,255,0.72)',
  fontSize: '0.78rem',
  lineHeight: 1.58,
  letterSpacing: '0.04em'
};
const fortuneList = { display: 'grid', gap: 6, marginTop: 'auto', paddingTop: 8 };
const fortuneRow = {
  display: 'grid',
  gridTemplateColumns: '24px 72px minmax(0, 1fr) 42px',
  alignItems: 'center',
  gap: 10,
  minHeight: 25,
  borderRadius: 999,
  background: 'rgba(255,204,0,0.055)',
  padding: '0 10px'
};
const fortuneIcon = { display: 'grid', placeItems: 'center', color: gold };
const fortuneLabel = { color: 'rgba(255,255,255,0.78)', fontSize: '0.8rem' };
const fortuneTrack = { height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' };
const fortuneFill = { display: 'block', height: '100%', borderRadius: 999, background: gold, boxShadow: '0 0 10px rgba(255,204,0,0.38)' };
const fortuneScore = { color: '#f3d18a', fontSize: '0.78rem', textAlign: 'right' };

const elementPanel = {
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: '118px minmax(0, 1fr)',
  gap: 14,
  alignItems: 'center'
};
const elementWheel = {
  width: 118,
  height: 118,
  borderRadius: '50%',
  overflow: 'hidden',
  display: 'grid',
  placeItems: 'center',
  filter: 'drop-shadow(0 0 14px rgba(255,204,0,0.22))'
};
const elementWheelImage = { width: '150%', height: '150%', objectFit: 'contain' };
const elementBarsWrap = { display: 'grid', gap: 7 };
const elementRow = { display: 'grid', gridTemplateColumns: '24px 42px minmax(0, 1fr) 42px', gap: 10, alignItems: 'center' };
const elementSymbol = { fontSize: '1rem', fontWeight: 700, textAlign: 'center' };
const elementPercent = { color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem' };
const elementTrack = { height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' };
const elementFill = { display: 'block', height: '100%', borderRadius: 999 };
const elementStatus = { fontSize: '0.78rem', textAlign: 'right' };

const tipsWrap = { flex: 1, minHeight: 0, display: 'grid', gap: 6, alignContent: 'center' };
const tipRow = {
  display: 'grid',
  gridTemplateColumns: '28px 74px minmax(0, 1fr)',
  alignItems: 'center',
  gap: 10,
  minHeight: 32,
  padding: '0 9px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.035)',
  color: 'rgba(255,255,255,0.68)',
  fontSize: '0.72rem'
};
const tipIcon = { width: 24, height: 24, border: '1px solid', borderRadius: '50%', display: 'grid', placeItems: 'center' };

const actionBar = {
  gridColumn: '1 / -1',
  zIndex: 2,
  display: 'grid',
  gridTemplateColumns: '1fr 1.05fr 1fr',
  gap: 14,
  alignItems: 'center',
  padding: '0 170px 0 205px'
};
const actionButton = {
  width: '100%',
  height: 40,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  borderRadius: 6,
  border: '1px solid rgba(255,204,0,0.28)',
  background: 'linear-gradient(90deg, rgba(255,204,0,0.06), rgba(0,0,0,0.34), rgba(255,204,0,0.06))',
  color: '#f6ead2',
  fontFamily: font,
  fontSize: '0.82rem',
  letterSpacing: '0.12em',
  cursor: 'pointer',
  boxShadow: 'inset 0 0 18px rgba(255,204,0,0.04)'
};
const promptActionWrap = { position: 'relative', minWidth: 0 };
const promptMenuBox = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 'calc(100% + 8px)',
  zIndex: 20,
  display: 'grid',
  gap: 6,
  padding: 8,
  borderRadius: 6,
  border: '1px solid rgba(255,204,0,0.3)',
  background: 'rgba(8,5,1,0.96)',
  boxShadow: '0 18px 32px rgba(0,0,0,0.48), 0 0 18px rgba(255,204,0,0.12)'
};
const favoriteButton = (active) => ({
  position: 'absolute',
  top: 16,
  right: 12,
  zIndex: 5,
  width: 38,
  height: 38,
  display: 'grid',
  placeItems: 'center',
  borderRadius: '50%',
  border: '1px solid rgba(255,204,0,0.38)',
  background: active ? 'rgba(255,204,0,0.16)' : 'rgba(0,0,0,0.26)',
  color: active ? '#ffcc00' : 'rgba(255,204,0,0.78)',
  cursor: 'pointer',
  boxShadow: active ? '0 0 18px rgba(255,204,0,0.34)' : 'none',
  transition: 'filter 160ms ease, transform 160ms ease, background 160ms ease'
});
const primaryAction = {
  borderColor: 'rgba(255,204,0,0.72)',
  background: 'linear-gradient(90deg, rgba(95,57,4,0.9), rgba(21,13,2,0.96), rgba(95,57,4,0.9))',
  boxShadow: '0 0 24px rgba(255,204,0,0.24), inset 0 0 20px rgba(255,204,0,0.08)'
};

const baziCSS = `
  .bazi-result-panel {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .bazi-result-panel::before {
    display: none !important;
  }

  .bazi-result-panel > div:first-child {
    display: none !important;
  }

  .bazi-result-shell h3 i {
    height: 1px;
    background: linear-gradient(90deg, rgba(255,204,0,0.42), transparent);
  }

  .bazi-result-shell button:hover:not(:disabled) {
    filter: brightness(1.16) drop-shadow(0 0 14px rgba(255,204,0,0.22));
  }

  .bazi-result-shell [style*="rgba(8,5,1,0.96)"] button {
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: rgba(255,204,0,0.035);
    color: rgba(255,255,255,0.82);
    cursor: pointer;
    padding: 0 10px;
    font-family: ${font};
    letter-spacing: 0.08em;
  }

  .bazi-result-shell [style*="rgba(8,5,1,0.96)"] button:hover {
    border-color: rgba(255,204,0,0.42);
    background: rgba(255,204,0,0.12);
    color: #f6ead2;
  }

  .bazi-result-shell button:disabled {
    opacity: 0.62;
    cursor: wait;
  }

  @keyframes baziSpin {
    to { transform: rotate(360deg); }
  }
`;
