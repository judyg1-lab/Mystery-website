import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const ARC_CARD_COUNT = 78;

const text = (value) => decodeURIComponent(value);

const POSITION_LABELS = {
  relationship: [
    text('%E6%88%91%E7%9A%84%E7%8B%80%E6%85%8B'),
    text('%E5%B0%8D%E6%96%B9%E7%9A%84%E7%8B%80%E6%85%8B'),
    text('%E9%97%9C%E4%BF%82%E6%A0%B8%E5%BF%83'),
    text('%E7%95%B6%E5%89%8D%E9%98%BB%E5%8A%9B'),
    text('%E6%9C%AA%E4%BE%86%E8%B5%B0%E5%90%91')
  ],
  three_cards: [
    text('%E9%81%8E%E5%8E%BB'),
    text('%E7%8F%BE%E5%9C%A8'),
    text('%E6%9C%AA%E4%BE%86')
  ],
  open_reading: [
    text('%E7%AC%AC%E4%B8%80%E8%A8%8A%E8%99%9F'),
    text('%E7%AC%AC%E4%BA%8C%E8%A8%8A%E8%99%9F'),
    text('%E7%AC%AC%E4%B8%89%E8%A8%8A%E8%99%9F')
  ],
  advice_spread: [
    text('%E5%95%8F%E9%A1%8C%E6%A0%B8%E5%BF%83'),
    text('%E9%9A%B1%E8%97%8F%E7%9B%B2%E9%BB%9E'),
    text('%E4%B8%8B%E4%B8%80%E6%AD%A5%E5%BB%BA%E8%AD%B0')
  ],
  soul_master: [
    text('%E9%9D%88%E9%AD%82%E4%B8%BB%E7%89%8C')
  ]
};

const SPREAD_LAYOUTS = {
  relationship: [
    { x: -292, y: 55},
    { x: -146, y: 55 },
    { x: 0, y: 55 },
    { x: 146, y: 55 },
    { x: 292, y: 55 }
  ],
  three_cards: [
    { x: -164, y: 55 },
    { x: 0, y: 55 },
    { x: 164, y: 55 }
  ],
  open_reading: [
    { x: -164, y: 55},
    { x: 0, y: 55 },
    { x: 164, y: 55 }
  ],
  advice_spread: [
    { x: -164, y: 55 },
    { x: 0, y: 55 },
    { x: 164, y: 55 }
  ],
  soul_master: [
    { x: 0, y: 55 }
  ]
};

function getAssetUrl(path = '') {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

function getMasterCardImagePath(name = '') {
  const normalized = name
    .toLowerCase()
    .replace('the magician', 'the magus')
    .replace('the high priestess', 'the priestess')
    .trim();
  return normalized ? `/tarot/cards/main/${encodeURIComponent(normalized)}.png` : '';
}

// 根據牌的名稱/slug 生成圖片 URL（備用邏輯）
function generateCardImagePath(cardName = '', cardSlug = '', cardSuit = '') {
  // 如果有 slug，優先使用 slug 生成路徑
  if (cardSlug) {
    const suit = cardSuit?.toLowerCase() || 'main';
    const folder = suit === 'major' ? 'main' : suit === 'wands' ? 'wands' : suit === 'cups' ? 'cups' : suit === 'swords' ? 'swords' : suit === 'disks' ? 'disks' : 'main';
    return `/tarot/cards/${folder}/${encodeURIComponent(cardSlug)}.png`;
  }
  
  // 備用：根據牌名生成路徑
  if (cardName) {
    const normalized = cardName
      .toLowerCase()
      .replace(/the /g, 'the ')
      .replace(/\s+/g, '-')
      .trim();
    return `/tarot/cards/main/${encodeURIComponent(normalized)}.png`;
  }
  
  return '';
}

// 隨機化攤牌位置 - 在固定位置基礎上加入隨機偏移
function randomizeSpreadLayout(baseLayout) {
  const randomRange = 20; // 隨機偏移範圍（像素）
  return baseLayout.map(slot => ({
    ...slot,
    x: slot.x + (Math.random() - 0.5) * randomRange,
    y: slot.y + (Math.random() - 0.5) * randomRange,
    rotate: (Math.random() - 0.5) * 8 // 隨機旋轉 ±4度
  }));
}

function getSpreadSlots(spread, shouldRandomize = false) {
  const key = spread?.key || 'open_reading';
  const layout = SPREAD_LAYOUTS[key] || SPREAD_LAYOUTS.open_reading;
  const labels = POSITION_LABELS[key] || POSITION_LABELS.open_reading;
  const count = spread?.count || layout.length;

  const baseSlots = Array.from({ length: count }, (_, index) => ({
    ...(layout[index] || { x: (index - (count - 1) / 2) * 142, y: 24 }),
    label: labels[index] || `Position ${index + 1}`
  }));

  return shouldRandomize ? randomizeSpreadLayout(baseSlots) : baseSlots;
}

function getArcPosition(index, arcCardCount = ARC_CARD_COUNT) {
  const OUTER_COUNT = arcCardCount <= 22 ? arcCardCount : 43;
  const INNER_COUNT = Math.max(0, arcCardCount - OUTER_COUNT);

  const isOuter = index < OUTER_COUNT;
  const ringIndex = isOuter ? index : index - OUTER_COUNT;
  const ringCount = isOuter ? OUTER_COUNT : INNER_COUNT;
  const t = ringCount <= 1 ? 0 : ringIndex / (ringCount - 1);

  const isMasterArc = arcCardCount <= 22;
  const totalAngle = isMasterArc ? 68 : (isOuter ? 95 : 90);
  const angleDeg = -(totalAngle / 2) + t * totalAngle;
  const angle = angleDeg * (Math.PI / 180);

  const radiusX = isMasterArc ? 530 : (isOuter ? 700 : 592);
  const radiusY = isMasterArc ? 245 : (isOuter ? 307 : 276);
  const baseY = isMasterArc ? 232 : (isOuter ? 242 : 318);

  const x = Math.sin(angle) * radiusX;
  const y = baseY - Math.cos(angle) * radiusY;
  const rotate = angleDeg * 0.72;
  const zIndex = isOuter ? 4 : 8;

  const edgeDistance = Math.min(ringIndex, ringCount - 1 - ringIndex);
  const gatherOrder = (isOuter ? 0 : 1) * 100 + edgeDistance;

  return { x, y, rotate, zIndex, ring: isOuter ? 'outer' : 'inner', gatherOrder };
}

export default function TarotDrawStage({
  cardBackUrl,
  soulMaster,
  spread,
  selectedDraws,
  isCompleting,
  arcCardCount = ARC_CARD_COUNT,
  onDrawCard,
  onRevealComplete
}) {
  const stageRef = useRef(null);
  const headerRef = useRef(null);
  const arcRef = useRef(null);
  const spreadMapRef = useRef(null);
  const gatheredDeckRef = useRef(null);
  const drawFlightRef = useRef(null);
  const flightCardRef = useRef(null);
  const gatherTimelineRef = useRef(null);
  const pickingIndexRef = useRef(null);
  const [stageMode, setStageMode] = useState('choosing');
  const [flippedCards, setFlippedCards] = useState({});
  const [settledReveals, setSettledReveals] = useState({});
  const [guideIndex, setGuideIndex] = useState(0);
  const [hoveredArcIndex, setHoveredArcIndex] = useState(null);
  const slots = useMemo(() => getSpreadSlots(spread, true), [spread]);
  const nextSlot = slots[selectedDraws.length];
  const selectionComplete = selectedDraws.length >= slots.length;
  const isSoulMasterRite = spread?.key === 'soul_master';
  const shouldShowMasterCard = Boolean(soulMaster) && (!isSoulMasterRite || Boolean(settledReveals[0]));

  useEffect(() => {
    setStageMode('choosing');
    setFlippedCards({});
    setSettledReveals({});
    setGuideIndex(0);
    setHoveredArcIndex(null);
    pickingIndexRef.current = null;
  }, [spread?.key]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        stageRef.current,
        { autoAlpha: 0, scale: 0.986, filter: 'blur(9px)' },
        { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.58, ease: 'power3.out' }
      );
      gsap.fromTo(
        headerRef.current,
        { autoAlpha: 0, y: -16 },
        { autoAlpha: 1, y: 0, duration: 0.48, ease: 'power2.out', delay: 0.08 }
      );
      gsap.fromTo(
        arcRef.current?.children || [],
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.36, stagger: 0.006, ease: 'power2.out', delay: 0.16 }
      );
      gsap.fromTo(
        spreadMapRef.current?.children || [],
        { autoAlpha: 0, y: 18, scale: 0.9 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.44, stagger: 0.045, ease: 'back.out(1.45)', delay: 0.24 }
      );
    }, stageRef);

    return () => ctx.revert();
  }, [spread?.key]);

  useEffect(() => () => {
    drawFlightRef.current?.kill();
    gatherTimelineRef.current?.kill();
    flightCardRef.current?.remove();
  }, []);

  useEffect(() => {
    if (!selectedDraws.length) return undefined;

    const slot = spreadMapRef.current?.querySelector(`[data-slot-index="${selectedDraws.length - 1}"]`);
    if (!slot) return undefined;

    gsap.fromTo(
      slot,
      { scale: 0.76, y: 18, filter: 'blur(8px) brightness(1.45)' },
      { scale: 1, y: 0, filter: 'blur(0px) brightness(1)', duration: 0.42, ease: 'back.out(1.7)' }
    );

    return undefined;
  }, [selectedDraws.length]);

  useEffect(() => {
    if (!selectionComplete || stageMode !== 'choosing') return undefined;

    gatherTimelineRef.current?.kill();
    setStageMode('reveal');
    setGuideIndex(0);
    gsap.fromTo(
      spreadMapRef.current,
      { y: 18, scale: 0.96 },
      { y: 0, scale: 1, duration: 0.46, ease: 'power3.out' }
    );
    return undefined;
  }, [selectedDraws, selectionComplete, stageMode]);

  const handlePickCard = useCallback((index, sourceElement) => {
    const picked = selectedDraws.some((card) => card.sourceIndex === index);
    if (picked || isCompleting || selectionComplete || pickingIndexRef.current !== null) return;

    const target = spreadMapRef.current?.querySelector(`[data-slot-card-index="${selectedDraws.length}"]`);
    if (!stageRef.current || !sourceElement || !target) {
      onDrawCard(index);
      return;
    }

    const stageRect = stageRef.current.getBoundingClientRect();
    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const clone = document.createElement('div');

    pickingIndexRef.current = index;
    drawFlightRef.current?.kill();
    flightCardRef.current?.remove();
    flightCardRef.current = clone;

    clone.style.position = 'absolute';
    clone.style.left = `${sourceRect.left - stageRect.left}px`;
    clone.style.top = `${sourceRect.top - stageRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.borderRadius = '8px';
    clone.style.border = '1px solid rgba(235,238,244,0.46)';
    clone.style.backgroundColor = '#08040d';
    clone.style.backgroundImage = `url(${cardBackUrl})`;
    clone.style.backgroundSize = 'cover';
    clone.style.backgroundPosition = 'center';
    clone.style.boxShadow = '0 0 22px rgba(235,238,244,0.34), 0 18px 38px rgba(0,0,0,0.58)';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '90';
    clone.style.transformStyle = 'preserve-3d';
    stageRef.current.appendChild(clone);

    drawFlightRef.current = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        clone.remove();
        flightCardRef.current = null;
        pickingIndexRef.current = null;
        onDrawCard(index);
      }
    });

    drawFlightRef.current
      .to(sourceElement, { autoAlpha: 0.14, scale: 0.86, duration: 0.14, ease: 'power2.out' }, 0)
      .to(
        clone,
        {
          left: targetRect.left - stageRect.left,
          top: targetRect.top - stageRect.top,
          width: targetRect.width,
          height: targetRect.height,
          rotation: 0,
          scale: 1.04,
          filter: 'brightness(1.24)',
          duration: 0.52
        },
        0.02
      )
      .to(
        clone,
        {
          autoAlpha: 0,
          scale: 0.9,
          filter: 'blur(5px) brightness(1.8)',
          duration: 0.16,
          ease: 'power2.out'
        },
        '>-0.02'
      );
  }, [cardBackUrl, isCompleting, onDrawCard, selectedDraws, selectionComplete]);

  const handleRevealCard = useCallback((index) => {
    if (stageMode !== 'reveal' || index !== guideIndex || flippedCards[index]) return;

    setFlippedCards((cards) => ({ ...cards, [index]: true }));
    window.setTimeout(() => {
      setSettledReveals((cards) => ({ ...cards, [index]: true }));
    }, 580);

    if (index >= selectedDraws.length - 1) {
      window.setTimeout(() => {
        onRevealComplete?.();
      }, 820);
      return;
    }

    window.setTimeout(() => {
      setGuideIndex(index + 1);
    }, 420);
  }, [flippedCards, guideIndex, onRevealComplete, selectedDraws.length, stageMode]);

  const handleArcPointerMove = useCallback((event) => {
    if (stageMode !== 'choosing' || isCompleting || selectionComplete) {
      setHoveredArcIndex(null);
      return;
    }

    const buttons = Array.from(arcRef.current?.querySelectorAll('.arc-card-button') || [])
      .filter((button) => !button.disabled);

    let closestIndex = null;
    let closestScore = Infinity;

    buttons.forEach((button) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (event.clientX - centerX) / Math.max(rect.width, 1);
      const dy = (event.clientY - centerY) / Math.max(rect.height, 1);
      const score = dx * dx + dy * dy;

      if (score < closestScore) {
        closestScore = score;
        closestIndex = Number(button.dataset.cardIndex);
      }
    });

    setHoveredArcIndex(closestScore < 0.72 ? closestIndex : null);
  }, [isCompleting, selectionComplete, stageMode]);

  return (
    <motion.div key="draw" ref={stageRef} {...fadeMotion} className="tarot-draw-stage" style={drawStage}>
      <style>{drawStageCSS}</style>

      <div ref={headerRef} style={drawHeader}>
        <div style={goldLabel}>{stageMode === 'reveal' ? 'REVEAL RITE' : `DRAW ${selectedDraws.length} / ${slots.length}`}</div>
        <h2 style={title}>{stageMode === 'reveal' ? 'Open The Cards In Order' : 'Choose From The Arc'}</h2>
        <p style={drawCue}>
          {stageMode === 'reveal'
            ? text('%E8%AB%8B%E4%BE%9D%E5%BA%8F%E7%BF%BB%E9%96%8B%E7%89%8C%E9%99%A3%E4%B8%AD%E7%9A%84%E6%AF%8F%E4%B8%80%E5%BC%B5%E7%89%8C')
            : nextSlot
              ? `${text('%E4%B8%8B%E4%B8%80%E5%BC%B5')} - ${nextSlot.label}`
              : text('%E7%89%8C%E9%99%A3%E5%B7%B2%E5%AE%8C%E6%88%90')}
        </p>
      </div>

      <div style={riteContext}>
        <div style={contextLabel}>CURRENT RITE</div>
        <span>{spread.name}</span>
      </div>

      {shouldShowMasterCard && (
        <motion.div
          className="draw-master-card"
          style={drawMasterCard}
          initial={{ opacity: 0, y: -12, scale: 0.92, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.34, ease: 'easeOut' }}
        >
          <img
            src={getAssetUrl(getMasterCardImagePath(soulMaster))}
            alt={soulMaster}
            style={drawMasterImage}
          />
          <span style={drawMasterLabel}>MASTER CARD</span>
          <strong style={drawMasterName}>{soulMaster}</strong>
        </motion.div>
      )}

      {(stageMode === 'choosing' || stageMode === 'gathering') && (
        <div
          ref={arcRef}
          className="arc-deck"
          style={arcDeck}
          onPointerMove={handleArcPointerMove}
          onPointerLeave={() => setHoveredArcIndex(null)}
        >
          {Array.from({ length: arcCardCount }, (_, index) => {
            const { x, y, rotate, zIndex, ring, gatherOrder } = getArcPosition(index, arcCardCount);
            const picked = selectedDraws.some((card) => card.sourceIndex === index);

            return (
              <div
                key={index}
                className="arc-card-unit"
                style={{
                  ...arcCardUnit,
                  zIndex,
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotate}deg)`
                }}
              >
                <button
                  type="button"
                  aria-label={`Pick card ${index + 1}`}
                  className="arc-card-button"
                  data-card-index={index}
                  data-arc-x={x}
                  data-arc-y={y}
                  data-arc-rotate={rotate}
                  data-arc-ring={ring}
                  data-gather-order={gatherOrder}
                  disabled={picked || isCompleting || stageMode !== 'choosing'}
                  onClick={(event) => handlePickCard(index, event.currentTarget)}
                  style={{
                    ...fanCardBack(cardBackUrl, arcCardCount),
                    opacity: picked ? 0.08 : 1,
                    cursor: picked || stageMode !== 'choosing' ? 'default' : 'pointer',
                    pointerEvents: picked || stageMode !== 'choosing' ? 'none' : 'auto',
                    transform: hoveredArcIndex === index ? 'translateY(-18px) scale(1.045)' : 'translateY(0) scale(1)'
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <div
        ref={spreadMapRef}
        className={`draw-spread-map draw-spread-map-${spread.key}`}
        style={{
          ...spreadMap,
          ...(stageMode === 'reveal' || stageMode === 'gathering' ? spreadMapReveal : spreadMapChoosing)
        }}
      >
        {slots.map((slot, index) => {
          const drawnCard = selectedDraws[index];
          const isNextSlot = index === selectedDraws.length && !drawnCard && !selectionComplete;
          const isGuided = stageMode === 'reveal' && index === guideIndex && !flippedCards[index];
          const isFlipped = Boolean(flippedCards[index]);

          return (
            <div
              key={`${spread.key}-${index}`}
              data-slot-index={index}
              className="draw-spread-slot"
              style={{
                ...spreadSlot,
                transform: `translate(calc(-50% + ${slot.x}px), calc(-50% + ${slot.y}px))`
              }}
            >
              {isNextSlot && <span style={nextSlotRing} />}
              {drawnCard && stageMode === 'reveal' && !flippedCards[index] && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0.45, 1, 0.45], scale: [0.85, 1.3, 0.85] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={drawnGoldStar}
                >
                  ✦
                </motion.span>
              )}
              <div style={slotNumber}>{String(index + 1).padStart(2, '0')}</div>
              <button
                type="button"
                data-slot-card-index={index}
                disabled={!drawnCard || stageMode !== 'reveal' || index !== guideIndex}
                onClick={() => handleRevealCard(index)}
                style={slotCardButton(drawnCard, stageMode, isGuided)}
              >
                {drawnCard ? (
                  <span style={flipCardInner(isFlipped)}>
                    <span style={flipFaceShell()}>
                      <img src={cardBackUrl} alt="" style={flipFaceImage} />
                    </span>
                    <span style={flipFaceShell(true)}>
                      <img
                        src={drawnCard.imageUrl ? getAssetUrl(drawnCard.imageUrl) : (getAssetUrl(generateCardImagePath(drawnCard.name, drawnCard.slug, drawnCard.suit)) || cardBackUrl)}
                        alt={drawnCard.name || slot.label}
                        style={flipFaceImage}
                        onError={(event) => {
                          event.currentTarget.src = cardBackUrl;
                        }}
                      />
                    </span>
                  </span>
                ) : (
                  <span style={slotPlaceholder(cardBackUrl)} />
                )}
              </button>
              <div style={slotCaption}>
                <span>{slot.label}</span>
                {drawnCard && stageMode === 'reveal' && isFlipped && <strong>{drawnCard.name}</strong>}
              </div>
            </div>
          );
        })}
      </div>

      <DrawnTray selectedDraws={selectedDraws} slots={slots} mode={stageMode} />
    </motion.div>
  );
}

function DrawnTray({ selectedDraws, slots, mode }) {
  return (
    <div style={{ ...drawnTray, opacity: mode === 'reveal' ? 0.56 : 1 }}>
      <span>{text('%E5%B7%B2%E6%8A%BD%E5%87%BA')}</span>
      <strong>{selectedDraws.length}</strong>
      <span>/ {slots.length}</span>
    </div>
  );
}

const fadeMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const zhFont = "'Noto Serif TC', 'Microsoft JhengHei', 'PingFang TC', sans-serif";
const goldLabel = { color: '#e8ebf2', fontSize: '0.68rem', letterSpacing: '4px', marginBottom: '8px', textShadow: '0 0 12px rgba(235,238,244,0.28)' };
const contextLabel = { ...goldLabel, marginBottom: '7px', fontSize: '0.58rem', letterSpacing: '3px' };
const title = {
  color: '#fff',
  fontSize: 'clamp(1.35rem, 2.6vw, 2.22rem)',
  letterSpacing: '2px',
  margin: 0,
  lineHeight: 1.08,
  textShadow: '0 0 18px rgba(255,255,255,0.14)'
};
const drawCue = {
  margin: '10px 0 0',
  color: 'rgba(255,255,255,0.66)',
  fontFamily: zhFont,
  fontSize: '0.88rem',
  letterSpacing: '0.1em'
};
const drawCardHover = {
  y: -15,
  scale: 1.05
};

const baseBack = (cardBackUrl) => ({
  border: '1px solid rgba(235,238,244,0.28)',
  borderRadius: '8px',
  backgroundColor: '#08040d',
  backgroundImage: `url(${cardBackUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0 8px 22px rgba(0,0,0,0.38)',
  transition: 'transform 120ms ease, opacity 160ms ease',
  willChange: 'transform',
  transform: 'translateZ(0)'
});

const fanCardBack = (cardBackUrl, arcCardCount = ARC_CARD_COUNT) => ({
  ...baseBack(cardBackUrl),
  width: arcCardCount <= 22 ? '41px' : '30px',
  height: arcCardCount <= 22 ? '71px' : '54px',
  borderColor: 'rgba(235,238,244,0.18)',
  boxShadow: '0 6px 14px rgba(0,0,0,0.42)'
});

const gatheredDeckCard = (cardBackUrl) => ({
  ...baseBack(cardBackUrl),
  position: 'absolute',
  left: 0,
  top: 0,
  width: '76px',
  height: '128px',
  boxShadow: '0 12px 30px rgba(0,0,0,0.48), 0 0 18px rgba(235,238,244,0.14)'
});

const slotPlaceholder = (cardBackUrl) => ({
  ...baseBack(cardBackUrl),
  display: 'block',
  width: '100%',
  height: '100%',
  opacity: 0.16,
  filter: 'brightness(0.8) saturate(0.7)'
});

const slotCardButton = (drawnCard, mode, guided) => ({
  position: 'relative',
  zIndex: 2,
  width: mode === 'reveal' ? '124px' : '80px',
  height: mode === 'reveal' ? '208px' : '134px',
  borderRadius: '8px',
  overflow: 'visible',
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: drawnCard && mode === 'reveal' ? 'pointer' : 'default',
  perspective: '900px',
  filter: guided ? 'drop-shadow(0 0 18px rgba(235,238,244,0.28))' : 'none',
  transition: 'width 260ms ease, height 260ms ease, filter 180ms ease'
});

const flipCardInner = (flipped) => ({
  position: 'relative',
  display: 'block',
  width: '100%',
  height: '100%',
  transformStyle: 'preserve-3d',
  transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  transition: 'transform 560ms cubic-bezier(0.16, 1, 0.3, 1)'
});

const flipFaceShell = (front = false) => ({
  position: 'absolute',
  inset: 0,
  borderRadius: '8px',
  border: '1px solid rgba(235,238,244,0.42)',
  backgroundColor: '#08040d',
  overflow: 'hidden',
  backfaceVisibility: 'hidden',
  transform: front ? 'rotateY(180deg)' : 'rotateY(0deg)',
  boxShadow: front
    ? '0 16px 34px rgba(0,0,0,0.52), 0 0 26px rgba(235,238,244,0.16)'
    : '0 16px 34px rgba(0,0,0,0.52), 0 0 18px rgba(188,19,254,0.16)'
});
const flipFaceImage = {
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'cover',
  objectPosition: 'center',
  pointerEvents: 'none'
};

const drawStage = {
  position: 'relative',
  zIndex: 2,
  width: '100%',
  height: '100%',
  minHeight: '620px',
  fontFamily: "'Cinzel', serif",
  overflow: 'hidden',
  isolation: 'isolate'
};
const drawHeader = {
  position: 'absolute',
  left: 'calc(50% + 90px)',
  top: '22px',
  transform: 'translateX(-50%)',
  width: 'min(680px, 92vw)',
  textAlign: 'center',
  zIndex: 10,
  pointerEvents: 'none'
};
const drawMagicFloor = {
  position: 'absolute',
  left: '50%',
  bottom: '-44px',
  width: 'min(1320px, 116vw)',
  height: '360px',
  maxWidth: 'none',
  transform: 'translateX(-50%)',
  objectFit: 'contain',
  objectPosition: 'center bottom',
  opacity: 0.7,
  filter: 'brightness(0.9) saturate(0.94)',
  pointerEvents: 'none',
  userSelect: 'none',
  zIndex: 0
};
const floorUplight = {
  position: 'absolute',
  left: '50%',
  bottom: '84px',
  width: '380px',
  height: '230px',
  transform: 'translateX(-50%)',
  background: 'radial-gradient(ellipse at center bottom, rgba(188,19,254,0.18), rgba(235,238,244,0.08) 34%, transparent 70%)',
  filter: 'blur(18px)',
  pointerEvents: 'none',
  zIndex: 1
};
const riteContext = {
  position: 'absolute',
  left: '43px',
  top: '280px',
  zIndex: 9,
  display: 'grid',
  justifyItems: 'center',
  gap: '8px',
  width: '126px',
  color: 'rgba(255,255,255,0.74)',
  textAlign: 'center',
  pointerEvents: 'none'
};
const drawMasterCard = {
  position: 'absolute',
  left: '34px',
  top: '24px',
  zIndex: 12,
  display: 'grid',
  justifyItems: 'center',
  gap: '10px',
  width: '148px',
  color: 'rgba(255,255,255,0.78)',
  transform: 'none',
  transformStyle: 'preserve-3d',
  pointerEvents: 'none',
  animation: 'none'
};
const drawMasterImage = {
  width: '112px',
  height: '188px',
  objectFit: 'cover',
  borderRadius: '8px',
  border: '1px solid rgba(235,238,244,0.38)',
  boxShadow: '0 18px 34px rgba(0,0,0,0.55), 0 0 24px rgba(235,238,244,0.16)'
};
const drawMasterLabel = {
  color: 'rgba(255,255,255,0.74)',
  fontSize: '0.86rem',
  letterSpacing: '0.06em',
  lineHeight: 1.1
};
const drawMasterName = {
  color: '#f3d18a',
  fontSize: '0.96rem',
  letterSpacing: '0.04em',
  lineHeight: 1.1
};
const gatheredDeck = {
  position: 'absolute',
  left: 'calc(50% - 486px)',
  top: '36%',
  width: '94px',
  height: '146px',
  zIndex: 8,
  pointerEvents: 'none'
};
const arcDeck = {
  position: 'absolute',
  left: 'calc(50% + 90px)',
  top: '40%',
  width: '1px',
  height: '1px',
  zIndex: 9,
  pointerEvents: 'auto'
};
const arcCardUnit = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transformOrigin: 'center center',
  willChange: 'transform'
};
const spreadMap = {
  position: 'absolute',
  left: 'calc(50% + 90px)',
  width: 'min(800px, 90vw)',
  height: '1000px',
  zIndex: 7,
  pointerEvents: 'auto',
  transition: 'top 520ms cubic-bezier(0.16, 1, 0.3, 1), transform 520ms cubic-bezier(0.16, 1, 0.3, 1)'
};
const spreadMapChoosing = {
  top: '60%',
  transform: 'translate(-50%, -50%) scale(1)'
};
const spreadMapReveal = {
  top: '36%',
  transform: 'translate(-50%, -50%) scale(1)'
};
const spreadSlot = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: '150px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '7px',
  color: '#fff',
  textAlign: 'center'
};
const slotNumber = {
  position: 'relative',
  zIndex: 3,
  minWidth: '20px',
  height: '16px',
  padding: 0,
  borderRadius: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(212,175,55,0.9)',
  background: 'transparent',
  border: 'none',
  fontSize: '0.82rem',
  letterSpacing: '1px',
  boxShadow: 'none',
  marginBottom: '5px'
};
const slotCaption = {
  position: 'relative',
  zIndex: 3,
  width: '140px',
  minHeight: '34px',
  marginTop: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '3px',
  color: 'rgba(255,255,255,0.72)',
  fontFamily: zhFont,
  fontSize: '0.78rem',
  lineHeight: 1.3,
  letterSpacing: '0.04em'
};
const nextSlotRing = {
  position: 'absolute',
  left: '50%',
  top: '90px',
  width: '88px',
  height: '138px',
  transform: 'translate(-50%, -50%)',
  borderRadius: '10px',
  border: '1px solid rgba(235,238,244,0.34)',
  boxShadow: '0 0 16px rgba(235,238,244,0.14), 0 0 26px rgba(188,19,254,0.16), inset 0 0 16px rgba(188,19,254,0.08)',
  pointerEvents: 'none',
  zIndex: 1,
  animation: 'drawSlotBreath 1.7s ease-in-out infinite'
};
const drawnGoldStar = {
  position: 'absolute',
  left: '45.8%',
  top: '-30px',
  transform: 'translateX(-50%)',
  zIndex: 6,
  fontSize: '1rem',
  color: '#f3d18a',
  lineHeight: 1,
  textShadow: '0 0 8px rgba(212,175,55,1), 0 0 22px rgba(212,175,55,0.72)',
  pointerEvents: 'none',
  userSelect: 'none'
};
const drawnTray = {
  position: 'absolute',
  right: '42px',
  bottom: '28px',
  zIndex: 10,
  minWidth: '112px',
  minHeight: '36px',
  borderRadius: '999px',
  border: '1px solid rgba(235,238,244,0.28)',
  background: 'rgba(3,1,8,0.68)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 16px rgba(188,19,254,0.12)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  color: 'rgba(255,255,255,0.62)',
  fontFamily: zhFont,
  fontSize: '0.76rem',
  letterSpacing: '0.08em',
  transition: 'opacity 180ms ease'
};

const drawStageCSS = `
  .tarot-draw-stage::before,
  .tarot-draw-stage::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 39%;
    width: 1320px;
    height: 390px;
    transform: translate(-50%, -50%);
    border-radius: 50% 50% 0 0;
    pointer-events: none;
    z-index: 2;
    opacity: 0.38;
    background:
      radial-gradient(circle at 8% 72%, rgba(245,247,252,0.72) 0 1px, transparent 2px),
      radial-gradient(circle at 20% 30%, rgba(245,247,252,0.52) 0 1px, transparent 2px),
      radial-gradient(circle at 38% 10%, rgba(245,247,252,0.64) 0 1px, transparent 2px),
      radial-gradient(circle at 54% 6%, rgba(245,247,252,0.52) 0 1px, transparent 2px),
      radial-gradient(circle at 72% 22%, rgba(245,247,252,0.58) 0 1px, transparent 2px),
      radial-gradient(circle at 91% 68%, rgba(245,247,252,0.66) 0 1px, transparent 2px);
    filter: drop-shadow(0 0 8px rgba(235,238,244,0.42));
    animation: silverArcRipple 3.2s ease-in-out infinite;
  }

  .tarot-draw-stage::after {
    width: 1040px;
    height: 310px;
    top: 46%;
    opacity: 0.26;
    animation-delay: 0.7s;
  }

  @keyframes drawMasterFloat {
    0%, 100% { transform: none; }
    50% { transform: none; }
  }

  @keyframes silverArcRipple {
    0%, 100% {
      transform: translate(-50%, -50%) scale(0.992);
      filter: drop-shadow(0 0 6px rgba(235,238,244,0.28));
    }
    50% {
      transform: translate(-50%, -50%) scale(1.012);
      filter: drop-shadow(0 0 13px rgba(235,238,244,0.48));
    }
  }

  @keyframes drawSlotBreath {
    0%, 100% {
      opacity: 0.42;
      transform: translate(-50%, -50%) scale(1);
    }

    50% {
      opacity: 0.84;
      transform: translate(-50%, -50%) scale(1.025);
    }
  }

  .draw-spread-slot strong {
    color: #f4f6fa;
    font-family: Cinzel, serif;
    font-size: 0.66rem;
    letter-spacing: 0.06em;
    line-height: 1.25;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .arc-card-button:not(:disabled):hover {
    z-index: 20;
    transform: translateY(-18px) scale(1.045);
  }

  .arc-card-button {
    will-change: transform;
    backface-visibility: hidden;
    contain: layout paint style;
  }

  .arc-card-unit:hover {
    z-index: 120 !important;
  }

  @media (max-width: 860px) {
    .tarot-draw-stage {
      min-height: 640px !important;
      overflow: hidden auto !important;
    }

    .tarot-draw-stage::before {
      width: 980px;
      top: 42%;
    }

    .tarot-draw-stage::after {
      width: 760px;
      top: 50%;
    }

    .draw-spread-map {
      transform-origin: center center;
      left: 50% !important;
      width: 760px !important;
    }

    .arc-deck {
      top: 45% !important;
      left: 50% !important;
      transform: scale(0.66);
      transform-origin: center center;
    }

    .draw-magic-floor {
      width: 150vw !important;
      bottom: -50px !important;
      opacity: 0.58 !important;
    }

    .gathered-deck {
      left: 22px !important;
      top: 46% !important;
      transform: scale(0.82);
      transform-origin: left center;
    }
  }

  @media (max-width: 560px) {
    .arc-deck {
      top: 47% !important;
      transform: scale(0.54);
    }

    .draw-spread-map {
      transform: translate(-50%, -50%) scale(0.72) !important;
    }

    .draw-master-card {
      transform: scale(0.72) !important;
      transform-origin: left top !important;
    }
  }
`;
