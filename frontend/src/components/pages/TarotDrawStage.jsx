import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const FAN_CARD_COUNT = 55;

function getAssetUrl(path = '') {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

export default function TarotDrawStage({
  cardBackUrl,
  soulMaster,
  spread,
  selectedDraws,
  isCompleting,
  onDrawCard
}) {
  return (
    <motion.div key="draw" {...fadeMotion} style={drawStage}>
      <ReadingContext soulMaster={soulMaster} spread={spread} cardBackUrl={cardBackUrl} />
      <div style={drawHeader}>
        <div style={goldLabel}>DRAW {selectedDraws.length} / {spread.count}</div>
        <h2 style={title}>Pull One Card At A Time</h2>
      </div>
      <div style={fanDeck}>
        {Array.from({ length: FAN_CARD_COUNT }, (_, index) => {
          const center = (FAN_CARD_COUNT - 1) / 2;
          const angle = (index - center) * 2.95;
          const arcLift = Math.abs(index - center) * 5.1;
          const picked = selectedDraws.some((card) => card.sourceIndex === index);

          return (
            <div
              key={index}
              style={{
                ...fanSlot,
                transform: `rotate(${angle}deg) translateY(${-285 + arcLift}px)`
              }}
            >
              <motion.button
                type="button"
                aria-label={`Pick card ${index + 1}`}
                drag={!picked && !isCompleting}
                disabled={picked || isCompleting}
                dragConstraints={{ top: -130, bottom: 22, left: -90, right: 90 }}
                dragElastic={0.22}
                whileHover={picked ? undefined : drawCardHover}
                whileDrag={drawCardDrag}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.12 }}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.y) > 44 || Math.abs(info.offset.x) > 54) onDrawCard(index);
                }}
                onClick={() => onDrawCard(index)}
                style={{
                  ...fanCardBack(cardBackUrl),
                  opacity: picked ? 0.12 : 1,
                  cursor: picked ? 'default' : 'grab',
                  pointerEvents: picked ? 'none' : 'auto'
                }}
              />
            </div>
          );
        })}
      </div>
      <DrawnTray selectedDraws={selectedDraws} cardBackUrl={cardBackUrl} />
    </motion.div>
  );
}

function DrawnTray({ selectedDraws, cardBackUrl }) {
  return (
    <div style={drawnTray}>
      {selectedDraws.map((card) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: -24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24 }}
          style={trayCard}
        >
          <div style={trayCardFace(card.imageUrl ? getAssetUrl(card.imageUrl) : cardBackUrl)} />
          <span>POSITION {card.position}</span>
        </motion.div>
      ))}
    </div>
  );
}

function ReadingContext({ soulMaster, spread, cardBackUrl }) {
  return (
    <div style={readingContext}>
      <div style={contextCardFace(cardBackUrl)} />
      <div>
        <div style={goldLabel}>CURRENT RITE</div>
        <div style={contextMaster}>{soulMaster || 'Soul Master'}</div>
        <div style={contextSpread}>{spread.name}</div>
      </div>
    </div>
  );
}

const fadeMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const zhFont = "'Noto Serif TC', 'Microsoft JhengHei', 'PingFang TC', sans-serif";
const goldLabel = { color: '#d4af37', fontSize: '0.72rem', letterSpacing: '4px', marginBottom: '12px' };
const title = { color: '#fff', fontSize: 'clamp(1.7rem, 4vw, 3.6rem)', letterSpacing: '2px', margin: '0 0 20px', lineHeight: 1.08 };
const drawCardHover = { y: -18, scale: 1.015 };
const drawCardDrag = { scale: 1.04, zIndex: 200 };

const baseBack = (cardBackUrl) => ({
  border: '1px solid rgba(212,175,55,0.28)',
  borderRadius: '8px',
  backgroundColor: '#08040d',
  backgroundImage: `url(${cardBackUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 8px 22px rgba(0,0,0,0.38)',
  transition: 'filter 120ms ease, transform 120ms ease, opacity 160ms ease'
});

const fanCardBack = (cardBackUrl) => ({
  ...baseBack(cardBackUrl),
  width: '84px',
  height: '142px'
});

const trayCardFace = (cardBackUrl) => ({
  ...baseBack(cardBackUrl),
  width: '56px',
  height: '94px'
});

const contextCardFace = (cardBackUrl) => ({
  ...baseBack(cardBackUrl),
  width: '54px',
  height: '92px',
  boxShadow: '0 10px 24px rgba(0,0,0,0.45)'
});

const drawStage = {
  position: 'relative',
  zIndex: 2,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingTop: '10px',
  fontFamily: "'Cinzel', serif"
};
const drawHeader = { textAlign: 'center', position: 'relative', zIndex: 3 };
const fanDeck = { position: 'relative', width: 'min(1720px, 99vw)', height: '500px', marginTop: '-4px' };
const fanSlot = { position: 'absolute', left: 'calc(50% - 42px)', bottom: '-118px', transformOrigin: 'bottom center' };
const drawnTray = {
  position: 'absolute',
  left: '50%',
  bottom: '4px',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: '18px',
  minHeight: '124px'
};
const trayCard = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  color: '#d4af37',
  fontSize: '0.62rem',
  letterSpacing: '2px'
};
const readingContext = {
  position: 'absolute',
  left: '42px',
  top: '84px',
  zIndex: 4,
  display: 'grid',
  gridTemplateColumns: '58px minmax(0, 160px)',
  alignItems: 'center',
  gap: '14px',
  color: '#fff',
  pointerEvents: 'none'
};
const contextMaster = { fontSize: '0.95rem', letterSpacing: '1.5px', lineHeight: 1.25 };
const contextSpread = { marginTop: '7px', color: 'rgba(255,255,255,0.64)', fontSize: '0.74rem', letterSpacing: '1px', fontFamily: zhFont };
