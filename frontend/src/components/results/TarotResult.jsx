import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Copy, ExternalLink, Heart } from 'lucide-react';

const zhFont = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';

function getMasterCardImagePath(name = '') {
  return `/tarot/cards/main/${encodeURIComponent(
    name
      .toLowerCase()
      .replace('the magician', 'the magus')
      .replace('the high priestess', 'the priestess')
      .trim()
  )}.png`;
}

export default function TarotResult({
  cardBackUrl,
  soulMaster,
  spread,
  drawnCards,
  basicReport,
  aiReport,
  isAiLoading,
  savedHistory,
  aiTargets,
  showPromptMenu,
  setShowPromptMenu,
  copyPrompt,
  runAiReading,
  toggleFavorite,
  getAssetUrl,
  buttonTap
}) {
  const masterSrc = soulMaster ? getAssetUrl(getMasterCardImagePath(soulMaster)) : cardBackUrl;

  return (
    <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} style={resultStage}>
      <motion.button
        type="button"
        aria-label="收藏塔羅結果"
        title={savedHistory?.id ? '收藏這次結果' : '儲存後才能收藏'}
        style={resultFavoriteButton(savedHistory?.isFavorite)}
        whileHover={resultFavoriteHover(savedHistory?.isFavorite)}
        whileTap={buttonTap}
        disabled={!savedHistory?.id}
        onClick={toggleFavorite}
      >
        <Heart size={20} fill={savedHistory?.isFavorite ? '#bc13fe' : 'transparent'} />
      </motion.button>

      <div style={resultMasterCard}>
        <img
          src={masterSrc}
          alt={soulMaster || '靈魂主牌'}
          style={resultMasterImage}
          onError={(event) => { event.currentTarget.src = cardBackUrl; }}
        />
        <span style={resultMasterLabel}>靈魂主牌</span>
        <strong style={resultMasterName}>{soulMaster || '未抽取主牌'}</strong>
      </div>

      <div style={resultHeader}>
        <div style={goldLabel}>塔羅解讀結果</div>
        <h2 style={title}>{spread.name}</h2>
        <p style={resultSubcopy}>已抽出 {drawnCards.length} 張</p>
      </div>

      <div style={simpleResultSpread}>
        {drawnCards.map((card) => (
          <ResultCard key={card.id} card={card} cardBackUrl={cardBackUrl} getAssetUrl={getAssetUrl} />
        ))}
      </div>

      {basicReport && <pre style={tarotBasicReportBox}>{basicReport}</pre>}

      <div style={tarotResultActions}>
        <div style={tarotPromptWrap}>
          <motion.button type="button" style={tarotActionButton} whileHover={tarotActionHover} whileTap={buttonTap} onClick={() => setShowPromptMenu((open) => !open)}>
            <Copy size={16} />
            <span>複製 AI 提示詞</span>
          </motion.button>
          {showPromptMenu && (
            <div className="tarot-prompt-menu" style={tarotPromptMenu}>
              {aiTargets.map((target) => (
                <button key={target.label} type="button" style={tarotPromptMenuItem} onClick={() => copyPrompt(target.url)}>
                  <span>{target.label}</span>
                  <ExternalLink size={13} />
                </button>
              ))}
            </div>
          )}
        </div>
        <motion.button type="button" style={tarotActionButton} whileHover={tarotActionHover} whileTap={buttonTap} onClick={runAiReading} disabled={isAiLoading}>
          <Bot size={16} />
          <span>{isAiLoading ? 'AI 解讀中' : 'AI 解讀'}</span>
        </motion.button>
      </div>

      {aiReport && <pre style={tarotAiReportBox}>{aiReport}</pre>}
    </motion.div>
  );
}

function ResultCard({ card, cardBackUrl, getAssetUrl }) {
  const faceUrl = card.imageUrl ? getAssetUrl(card.imageUrl) : cardBackUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: card.position * 0.08 }}
      style={resultCardWrap}
    >
      <div style={resultCardFace(faceUrl)} />
      <div style={resultNumber}>第 {card.position} 張</div>
      <div style={resultName}>{card.name}</div>
      {card.subtitle && <div style={resultSubtitle}>{card.subtitle}</div>}
    </motion.div>
  );
}

const resultStage = {
  position: 'relative',
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: '24px',
  paddingLeft: '180px',
  paddingBottom: '64px',
  boxSizing: 'border-box'
};
const resultHeader = { textAlign: 'center', marginTop: '8px' };
const goldLabel = { color: '#d4af37', fontSize: '0.76rem', letterSpacing: '0.26em', textTransform: 'uppercase', marginBottom: '8px' };
const title = { color: '#f7e8bd', fontSize: 'clamp(1.7rem, 3vw, 2.8rem)', letterSpacing: '0.08em', margin: '0 0 18px' };
const resultSubcopy = { margin: '-8px 0 0', color: 'rgba(255,255,255,0.68)', fontFamily: zhFont, letterSpacing: '0.08em' };
const simpleResultSpread = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '24px',
  flex: '0 0 auto',
  width: '100%',
  marginTop: '20px'
};
const resultFavoriteButton = (active) => ({
  position: 'absolute',
  top: '24px',
  right: '28px',
  zIndex: 20,
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: `1px solid ${active ? 'rgba(188,19,254,0.72)' : 'rgba(212,175,55,0.34)'}`,
  background: active ? 'radial-gradient(circle, rgba(188,19,254,0.26), rgba(7,3,12,0.78))' : 'rgba(5,2,10,0.72)',
  color: active ? '#f3c5ff' : 'rgba(255,255,255,0.72)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  opacity: active ? 1 : 0.86,
  boxShadow: active ? '0 0 18px rgba(188,19,254,0.34), inset 0 0 14px rgba(188,19,254,0.16)' : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px rgba(212,175,55,0.08)'
});
const resultFavoriteHover = (active) => ({
  scale: 1.08,
  opacity: 1,
  borderColor: active ? 'rgba(244,197,255,0.9)' : 'rgba(188,19,254,0.66)',
  filter: 'brightness(1.14) drop-shadow(0 0 14px rgba(188,19,254,0.56))'
});
const resultCardWrap = { width: '182px', textAlign: 'center', color: '#fff' };
const resultCardFace = (cardBackUrl) => ({
  width: '132px',
  height: '220px',
  margin: '0 auto 14px',
  borderRadius: '8px',
  backgroundImage: `url(${cardBackUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 22px 44px rgba(0,0,0,0.48), 0 0 24px rgba(188,19,254,0.16)'
});
const resultNumber = { color: '#d4af37', fontSize: '0.62rem', letterSpacing: '2px', marginBottom: '7px' };
const resultName = { color: '#fff', fontSize: '0.92rem', letterSpacing: '1.5px', lineHeight: 1.35 };
const resultSubtitle = { marginTop: '5px', color: 'rgba(212,175,55,0.72)', fontSize: '0.68rem', letterSpacing: '1px' };
const resultMasterCard = {
  position: 'absolute',
  left: '20px',
  top: '18px',
  zIndex: 12,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  width: '148px',
  color: 'rgba(255,255,255,0.78)',
  pointerEvents: 'none'
};
const resultMasterImage = {
  width: '112px',
  height: '188px',
  objectFit: 'cover',
  borderRadius: '8px',
  border: '1px solid rgba(235,238,244,0.38)',
  boxShadow: '0 18px 34px rgba(0,0,0,0.55), 0 0 24px rgba(235,238,244,0.16)'
};
const resultMasterLabel = { color: 'rgba(255,255,255,0.74)', fontSize: '0.72rem', letterSpacing: '0.08em', lineHeight: 1.1 };
const resultMasterName = { color: '#f3d18a', fontSize: '0.96rem', letterSpacing: '0.04em', lineHeight: 1.1 };
const tarotResultActions = { position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '28px', zIndex: 12 };
const tarotPromptWrap = { position: 'relative' };
const tarotActionButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '9px',
  minWidth: '148px',
  height: '42px',
  padding: '0 18px',
  borderRadius: '6px',
  border: '1px solid rgba(212,175,55,0.34)',
  background: 'linear-gradient(180deg, rgba(42,12,58,0.72), rgba(5,2,10,0.86))',
  color: '#f7e8bd',
  fontFamily: "'Cinzel', serif",
  fontSize: '0.78rem',
  letterSpacing: '0.12em',
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 26px rgba(0,0,0,0.34)'
};
const tarotActionHover = {
  y: -3,
  scale: 1.045,
  borderColor: 'rgba(226,105,255,0.85)',
  background: 'linear-gradient(180deg, rgba(104,31,132,0.92), rgba(33,8,50,0.96))',
  color: '#fff',
  filter: 'brightness(1.22) saturate(1.2) drop-shadow(0 0 18px rgba(188,19,254,0.58))'
};
const tarotPromptMenu = {
  position: 'absolute',
  left: '50%',
  bottom: 'calc(100% + 10px)',
  transform: 'translateX(-50%)',
  zIndex: 20,
  display: 'grid',
  gap: '6px',
  minWidth: '176px',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid rgba(188,19,254,0.28)',
  background: 'rgba(8,3,15,0.96)',
  boxShadow: '0 18px 38px rgba(0,0,0,0.48)'
};
const tarotPromptMenuItem = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  height: '36px',
  padding: '0 12px',
  borderRadius: '4px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.035)',
  color: 'rgba(255,255,255,0.82)',
  fontFamily: "'Cinzel', serif",
  fontSize: '0.74rem',
  letterSpacing: '0.12em',
  cursor: 'pointer'
};
const tarotBasicReportBox = {
  width: 'min(880px, 92vw)',
  margin: '8px auto 0',
  padding: '18px 20px',
  borderRadius: '8px',
  border: '1px solid rgba(212,175,55,0.2)',
  background: 'linear-gradient(180deg, rgba(18,8,26,0.72), rgba(5,2,10,0.82))',
  color: 'rgba(255,255,255,0.82)',
  fontFamily: zhFont,
  fontSize: '0.92rem',
  lineHeight: 1.85,
  whiteSpace: 'pre-wrap',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 36px rgba(0,0,0,0.28)'
};
const tarotAiReportBox = {
  width: 'min(900px, 92vw)',
  margin: '28px auto 0',
  padding: '28px 36px',
  borderRadius: '10px',
  border: '1px solid rgba(188,19,254,0.22)',
  background: 'rgba(5,2,10,0.78)',
  color: 'rgba(255,255,255,0.86)',
  fontFamily: zhFont,
  fontSize: '0.94rem',
  lineHeight: 1.9,
  whiteSpace: 'pre-wrap'
};
