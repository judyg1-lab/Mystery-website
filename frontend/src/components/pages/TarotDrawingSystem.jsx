import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, Sparkles } from 'lucide-react';

const text = (value) => decodeURIComponent(value);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DECK_SIZE = 78;
const FAN_CARD_COUNT = 55;

const COPY = {
  checkingMaster: text('%E6%AD%A3%E5%9C%A8%E7%A2%BA%E8%AA%8D%E4%BD%A0%E7%9A%84%E9%9D%88%E9%AD%82%E4%B8%BB%E7%89%8C%E7%B4%80%E9%8C%84%E3%80%82'),
  masterIntro: text('%E9%80%B2%E5%85%A5%E6%8A%BD%E7%89%8C%E6%B5%81%E7%A8%8B%E5%BE%8C%EF%BC%8C%E7%B3%BB%E7%B5%B1%E6%89%8D%E6%9C%83%E5%88%A4%E6%96%B7%E4%BD%A0%E7%9A%84%E9%9D%88%E9%AD%82%E4%B8%BB%E7%89%8C%EF%BC%9B%E9%80%99%E5%BC%B5%E7%89%8C%E6%9C%83%E4%BD%9C%E7%82%BA%E6%9C%AC%E6%AC%A1%E5%8D%A0%E5%8D%9C%E7%9A%84%E6%A0%B8%E5%BF%83%E5%BA%95%E8%89%B2%E3%80%82'),
  questionPlaceholder: text('%E8%AB%8B%E8%BC%B8%E5%85%A5%E4%BD%A0%E6%83%B3%E8%A9%A2%E5%95%8F%E7%9A%84%E5%95%8F%E9%A1%8C...'),
  shuffleHint: text('%E7%89%8C%E7%BE%A4%E6%AD%A3%E5%9C%A8%E4%BA%A4%E9%8C%AF%E6%B4%97%E7%89%8C%EF%BC%8C%E7%95%B6%E4%BD%A0%E6%84%9F%E8%A6%BA%E5%88%B0%E7%89%8C%E9%9D%A2%E5%B7%B2%E7%B6%93%E6%B2%89%E9%9D%9C%EF%BC%8C%E5%B0%B1%E5%81%9C%E4%B8%8B%E4%BE%86%E6%94%A4%E9%96%8B%E7%89%8C%E9%99%A3%E3%80%82'),
  stopShuffle: text('%E5%81%9C%E6%AD%A2%E6%B4%97%E7%89%8C'),
  selectedPrefix: text('%E5%B7%B2%E6%8A%BD%E5%87%BA'),
  cardUnit: text('%E5%BC%B5'),
  guideTitle: text('%E6%8A%BD%E7%89%8C%E5%89%8D%E7%9A%84%E8%AA%A6%E5%BF%B5'),
  guideBody: text('%E3%80%8C%E8%A6%AA%E6%84%9B%E7%9A%84%E5%A1%94%E7%BE%85%E7%89%8C%E5%A4%A7%E4%BA%BA%E4%BD%A0%E5%A5%BD%EF%BC%8C%E6%88%91%E6%98%AFXXX%EF%BC%8C%E8%A5%BF%E5%85%83X%E5%B9%B4X%E6%9C%88X%E6%97%A5%E7%94%9F%EF%BC%8C%E6%88%91%E6%83%B3%E5%95%8F%E7%9A%84%E5%95%8F%E9%A1%8C%E6%98%AF.....%EF%BC%8C%E8%AC%9D%E8%AC%9D%E3%80%82%E3%80%8D'),
  guideNote: text('%E8%AB%8B%E5%9C%A8%E5%BF%83%E8%A3%A1%E9%87%8D%E8%A4%87%E5%BF%B5%E4%B8%89%E9%81%8D%EF%BC%8C%E5%86%8D%E9%97%9C%E4%B8%8A%E9%80%99%E6%9C%AC%E6%9B%B8%E9%96%8B%E5%A7%8B%E8%BC%B8%E5%85%A5%E5%95%8F%E9%A1%8C%E3%80%82'),
  closeBook: text('%E9%97%9C%E4%B8%8A%E6%9B%B8%E9%A0%81')
};

const MAJOR_MASTERS = [
    'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
    'The Hierophant', 'The Lovers', 'The Chariot', 'Adjustment', 'The Hermit',
    'Fortune', 'Lust', 'The Hanged Man', 'Death', 'Art', 'The Devil',
    'The Tower', 'The Star', 'The Moon', 'The Sun', 'The Aeon', 'The Universe'
];

const SPREADS = [
    {
    key: 'relationship',
    name: 'Relationship Spread',
    zhName: text('%E9%97%9C%E4%BF%82%E7%89%8C%E9%99%A3'),
    icon: '/assets/tarot/spread-relationship.png',
    desc: text('%E4%BA%94%E5%BC%B5%E7%89%8C%EF%BC%8C%E8%A7%80%E7%9C%8B%E9%97%9C%E4%BF%82%E4%B8%AD%E7%9A%84%E8%87%AA%E5%B7%B1%E3%80%81%E5%B0%8D%E6%96%B9%E3%80%81%E6%A0%B8%E5%BF%83%E7%8B%80%E6%85%8B%E3%80%81%E9%98%BB%E5%8A%9B%E8%88%87%E8%B5%B0%E5%90%91%E3%80%82'),
    detail: text('%E9%81%A9%E5%90%88%E5%95%8F%E6%84%9F%E6%83%85%E3%80%81%E5%90%88%E4%BD%9C%E3%80%81%E4%BA%BA%E9%9A%9B%E4%B9%8B%E9%96%93%E7%9A%84%E6%B5%81%E5%8B%95%E3%80%82'),
    count: 5
    },
    {
    key: 'three_cards',
    name: 'Three Card Spread',
    zhName: text('%E4%B8%89%E7%89%8C%E6%B5%81%E5%90%91'),
    icon: '/assets/tarot/spread-three-cards.png',
    desc: text('%E4%B8%89%E5%BC%B5%E7%89%8C%EF%BC%8C%E5%B0%8D%E6%87%89%E9%81%8E%E5%8E%BB%E3%80%81%E7%8F%BE%E5%9C%A8%E8%88%87%E6%9C%AA%E4%BE%86%E7%9A%84%E8%A8%8A%E8%99%9F%E3%80%82'),
    detail: text('%E9%81%A9%E5%90%88%E5%BF%AB%E9%80%9F%E7%90%86%E6%B8%85%E4%B8%80%E5%80%8B%E5%95%8F%E9%A1%8C%E7%9A%84%E6%99%82%E9%96%93%E8%84%88%E7%B5%A1%E3%80%82'),
    count: 3
    },
    {
    key: 'open_reading',
    name: 'Open Reading',
    zhName: text('%E7%9B%B4%E8%A6%BA%E9%96%8B%E7%89%8C'),
    icon: '/assets/tarot/spread-open-reading.png',
    desc: text('%E4%B8%89%E5%BC%B5%E7%89%8C%EF%BC%8C%E4%B8%8D%E9%99%90%E5%AE%9A%E5%95%8F%E9%A1%8C%E9%A1%9E%E5%9E%8B%EF%BC%8C%E4%BF%9D%E7%95%99%E7%9B%B4%E8%A6%BA%E8%A7%A3%E8%AE%80%E7%A9%BA%E9%96%93%E3%80%82'),
    detail: text('%E9%81%A9%E5%90%88%E4%BD%A0%E5%8F%AA%E6%83%B3%E8%AE%93%E7%89%8C%E5%85%88%E8%AA%AA%E8%A9%B1%EF%BC%8C%E5%86%8D%E6%95%B4%E7%90%86%E7%95%B6%E4%B8%8B%E7%8B%80%E6%85%8B%E3%80%82'),
    count: 3
    }
];

const SAMPLE_RESULTS = [
    'Ace of Cups', 'Love', 'Science', 'Victory', 'Wealth',
    'Princess of Disks', 'The Star', 'Art', 'Fortune'
];

function createShuffleLayout(count = DECK_SIZE) {
    return Array.from({ length: count }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const lane = Math.floor(index / 13);
    const stack = index % 13;

    return {
      id: index,
      side,
      stack,
      x: side * (110 + stack * 10) + Math.sin(index * 0.9) * 36,
      y: (lane - 2.5) * 54 + Math.cos(index * 1.3) * 32,
      rotate: side * (8 + (stack % 5) * 4),
      delay: (index % 13) * 0.018
    };
  });
}

function getAssetUrl(path = '') {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

function getCarouselOffset(index, activeIndex) {
  const total = SPREADS.length;
  let offset = index - activeIndex;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

function spreadCarouselCardMotion(offset) {
  const active = offset === 0;

  return {
    x: offset * 292,
    y: active ? 0 : 16,
    scale: active ? 1 : 0.78,
    opacity: active ? 1 : 0.46,
    rotateY: offset * -18,
    zIndex: active ? 5 : 2,
    filter: active
      ? 'brightness(1.04) drop-shadow(0 0 18px rgba(212,175,55,0.26))'
      : 'brightness(0.54) saturate(0.72)'
  };
}

export function TarotPortalParticles({ active = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frameId;
    let spin = 0;
    const particles = Array.from({ length: 280 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 54 + Math.random() * 300,
      speed: 0.0008 + Math.random() * 0.0028,
      size: 0.45 + Math.random() * 1.9,
      alpha: 0.16 + Math.random() * 0.62,
      color: Math.random() > 0.22 ? '#d4af37' : '#ffffff'
    }));

    const resize = () => {
      const size = Math.min(900, Math.max(520, window.innerWidth * 0.64));
      canvas.width = size;
      canvas.height = size;
    };

    const drawStar = (x, y, radius, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - radius, y);
      ctx.lineTo(x + radius, y);
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x, y + radius);
      ctx.stroke();
      ctx.restore();
    };

    const render = () => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const pulse = active ? 0.85 + Math.sin(spin * 5) * 0.36 : 0.32;
      spin += active ? 0.008 : 0.004;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, canvas.width * 0.48);
      glow.addColorStop(0, `rgba(255,255,255,${active ? 0.26 * pulse : 0.05})`);
      glow.addColorStop(0.24, `rgba(255,255,255,${active ? 0.14 * pulse : 0.02})`);
      glow.addColorStop(0.48, `rgba(212,175,55,${0.08 * pulse})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, canvas.width * 0.48, 0, Math.PI * 2);
      ctx.fill();

      particles.forEach((particle, index) => {
        particle.angle += particle.speed * (active ? 1.8 : 1);
        const wave = Math.sin(spin * 2 + particle.radius * 0.03) * 7;
        const x = cx + Math.cos(particle.angle + spin) * (particle.radius + wave);
        const y = cy + Math.sin(particle.angle + spin) * (particle.radius + wave);
        ctx.globalAlpha = particle.alpha * (active ? 1 : 0.72);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        if (index % 22 === 0) drawStar(x, y, 4 + (index % 3), 0.24 + pulse * 0.28);
      });

      ctx.globalAlpha = active ? 0.46 + pulse * 0.34 : 0.22 + pulse * 0.28;
      ctx.strokeStyle = active ? '#ffffff' : '#d4af37';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i += 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, 84 + i * 48 + Math.sin(spin + i) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = active ? 0.56 + pulse * 0.28 : 0.34 + pulse * 0.22;
      ctx.strokeStyle = '#ffffff';
      for (let i = 0; i < 8; i += 1) {
        const angle = spin * 0.45 + i * (Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 78, cy + Math.sin(angle) * 78);
        ctx.lineTo(cx + Math.cos(angle) * 310, cy + Math.sin(angle) * 310);
        ctx.stroke();
      }

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
  }, [active]);

  return <canvas ref={canvasRef} style={portalCanvas} />;
}

export default function TarotDrawingSystem({ cardBackUrl }) {
  const [step, setStep] = useState('checking_master');
  const [soulMaster, setSoulMaster] = useState('');
  const [spread, setSpread] = useState(SPREADS[0]);
  const [question, setQuestion] = useState('');
  const [selectedDraws, setSelectedDraws] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [shuffleTick, setShuffleTick] = useState(0);
  const [tarotCards, setTarotCards] = useState([]);
  const [showQuestionGuide, setShowQuestionGuide] = useState(false);
  const [activeSpreadIndex, setActiveSpreadIndex] = useState(1);
  const shuffleLayout = useMemo(() => createShuffleLayout(), []);
  const drawableCards = useMemo(() => {
    const cardsWithKnownImages = tarotCards.filter((card) => {
      const cupsWithImages = card.suit === 'CUPS' && ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'].includes(card.rank);
      const generatedSamples = ['wands-six-victory', 'swords-six-science', 'disks-ten-wealth'].includes(card.slug);
      return cupsWithImages || generatedSamples;
    });

    return cardsWithKnownImages.length ? cardsWithKnownImages : tarotCards;
  }, [tarotCards]);

  useEffect(() => {
    const savedMaster = localStorage.getItem('soul_master_card');
    if (savedMaster) {
      setSoulMaster(savedMaster);
      setStep('select_spread');
      return;
    }

    setStep('master_gate');
  }, []);

  useEffect(() => {
    if (step !== 'shuffle') return undefined;

    const intervalId = window.setInterval(() => {
      setShuffleTick((tick) => tick + 1);
    }, 760);

    return () => window.clearInterval(intervalId);
  }, [step]);

  useEffect(() => {
    const loadTarotCards = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tarot/cards`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) setTarotCards(data);
      } catch (error) {
        console.error('Failed to load tarot cards:', error);
      }
    };

    loadTarotCards();
  }, []);

  const drawSoulMaster = () => {
    const master = MAJOR_MASTERS[Math.floor(Math.random() * MAJOR_MASTERS.length)];
    localStorage.setItem('soul_master_card', master);
    setSoulMaster(master);
    setStep('select_spread');
  };

  const startShuffle = () => {
    setSelectedDraws([]);
    setDrawnCards([]);
    setIsCompleting(false);
    setShuffleTick(0);
    setStep('shuffle');
  };

  const stopShuffle = () => {
    setStep('draw_cards');
  };

  const drawOneCard = (sourceIndex) => {
    if (isCompleting) return;
    if (selectedDraws.length >= spread.count) return;
    if (selectedDraws.some((card) => card.sourceIndex === sourceIndex)) return;

    const position = selectedDraws.length + 1;
    const pool = drawableCards.length ? drawableCards : [];
    const tarotCard = pool.length ? pool[(sourceIndex + position * 3) % pool.length] : null;
    const card = {
      id: `${Date.now()}-${sourceIndex}`,
      sourceIndex,
      tarotId: tarotCard?.id || null,
      slug: tarotCard?.slug || null,
      name: tarotCard?.title || SAMPLE_RESULTS[(sourceIndex + position) % SAMPLE_RESULTS.length],
      subtitle: tarotCard?.subtitle || '',
      imageUrl: tarotCard?.imageUrl || '',
      meaning: tarotCard?.meaning || '',
      position
    };
    const nextDraws = [...selectedDraws, card];
    setSelectedDraws(nextDraws);

    if (nextDraws.length === spread.count) {
      setIsCompleting(true);
      window.setTimeout(() => {
        setDrawnCards(nextDraws);
        setStep('result');
        setIsCompleting(false);
      }, 850);
    }
  };

  const handlePrevSpread = () => {
    setActiveSpreadIndex((index) => (index - 1 + SPREADS.length) % SPREADS.length);
  };

  const handleNextSpread = () => {
    setActiveSpreadIndex((index) => (index + 1) % SPREADS.length);
  };

  return (
    <section style={systemShell}>
      <style>{drawSystemCSS}</style>
      {step === 'shuffle' && <TarotPortalParticles active />}

      <AnimatePresence mode="wait">
        {step === 'checking_master' && (
          <motion.div key="checking" {...fadeMotion} style={panel}>
            <div style={goldLabel}>THOTH PORTAL</div>
            <h2 style={title}>Checking Soul Master</h2>
            <p style={bodyText}>{COPY.checkingMaster}</p>
          </motion.div>
        )}

        {step === 'master_gate' && (
          <motion.div key="master" {...fadeMotion} style={panel}>
            <div style={goldLabel}>FIRST GATE</div>
            <h2 style={title}>Draw Your Soul Master</h2>
            <p style={bodyText}>{COPY.masterIntro}</p>
            <motion.button whileHover={buttonHover} whileTap={{ scale: 0.97 }} onClick={drawSoulMaster} style={primaryButton}>
              <Sparkles size={17} />
              DRAW MASTER
            </motion.button>
          </motion.div>
        )}

        {step === 'select_spread' && (
          <motion.div key="spread" {...fadeMotion} style={spreadPanel}>
            <div style={spreadHeader}>
              <div style={goldLabel}>MASTER CARD: {soulMaster}</div>
              <h2 style={{ ...title, ...spreadTitle }}>Choose A Spread</h2>
              <div style={spreadSubtitle}>
                <span style={spreadSubtitleLine} />
                <span>{text('%E9%81%B8%E6%93%87%E4%B8%80%E7%A8%AE%E7%89%8C%E9%99%A3%EF%BC%8C%E9%96%8B%E5%95%9F%E4%BD%A0%E7%9A%84%E5%A1%94%E7%BE%85%E6%8C%87%E5%BC%95')}</span>
                <span style={spreadSubtitleLine} />
              </div>
            </div>
            <div className="spread-selection-stage" style={spreadCarouselStage}>
              <img className="spread-magic-floor" src="/assets/tarot/magic-circle-floor.png" alt="" style={spreadMagicCircleFloor} />
              <motion.button type="button" style={{ ...carouselArrow, left: 'calc(50% - 218px)' }} whileHover={buttonHover} whileTap={{ scale: 0.94 }} onClick={handlePrevSpread}>
                {'<'}
              </motion.button>
              <motion.div
                className="spread-selection-grid"
                style={spreadCarousel}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.16}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -42) handleNextSpread();
                  if (info.offset.x > 42) handlePrevSpread();
                }}
              >
              {SPREADS.map((item) => {
                const itemIndex = SPREADS.indexOf(item);
                const isActiveSpread = itemIndex === activeSpreadIndex;

                return (
                <motion.div
                  className="spread-selection-card"
                  key={item.key}
                  animate={spreadCarouselCardMotion(getCarouselOffset(itemIndex, activeSpreadIndex))}
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  whileHover={spreadHover}
                  onClick={() => {
                    if (!isActiveSpread) {
                      setActiveSpreadIndex(itemIndex);
                      return;
                    }
                    setSpread(item);
                    setStep('question');
                  }}
                  style={{
                    ...spreadCarouselCard,
                    ...(isActiveSpread ? activeSpreadDisplayCard : inactiveSpreadDisplayCard)
                  }}
                >
                  {isActiveSpread && <span style={spreadActiveUplight} />}
                  <span style={spreadCardBackdrop} />
                  <img src="/assets/tarot/spread-frame.png" alt="" style={spreadFrameImage} />
                  <span style={spreadTextBlock}>
                    <strong style={spreadNameText}>{item.name}</strong>
                    <em style={spreadZhText}>{item.zhName}</em>
                  </span>
                  <div style={spreadImageWrap}>
                    {isActiveSpread && <span style={spreadIconCenterGlow} />}
                    <img src={item.icon} alt="" style={spreadImage} />
                  </div>
                  <span style={spreadDescBlock}>
                    <span>{item.desc}</span>
                  </span>
                  <span style={spreadAside}>
                    <strong style={spreadCountPill}>{item.count}<small>{COPY.cardUnit}</small></strong>
                  </span>
                </motion.div>
                );
              })}
              </motion.div>
              <motion.button type="button" style={{ ...carouselArrow, right: 'calc(50% - 218px)' }} whileHover={buttonHover} whileTap={{ scale: 0.94 }} onClick={handleNextSpread}>
                {'>'}
              </motion.button>
            </div>
            <FloatingGuideBook onClick={() => setShowQuestionGuide(true)} />
            <AnimatePresence>
              {showQuestionGuide && <QuestionGuideBook onClose={() => setShowQuestionGuide(false)} />}
            </AnimatePresence>
          </motion.div>
        )}

        {step === 'question' && (
          <motion.div key="question" {...fadeMotion} style={questionLayout}>
            <AnimatePresence>
              {showQuestionGuide && (
                <QuestionGuideBook onClose={() => setShowQuestionGuide(false)} />
              )}
            </AnimatePresence>
            <div style={questionPanel}>
              <div style={goldLabel}>{spread.name}</div>
              <h2 style={title}>Enter Your Question</h2>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={COPY.questionPlaceholder}
                style={questionInput}
                disabled={showQuestionGuide}
              />
              <motion.button whileHover={buttonHover} whileTap={{ scale: 0.97 }} onClick={startShuffle} style={primaryButton}>
                <Sparkles size={17} />
                START SHUFFLE
              </motion.button>
            </div>
            <DeckStack cardBackUrl={cardBackUrl} />
            <div style={questionPortalStage} />
            <FloatingGuideBook onClick={() => setShowQuestionGuide(true)} />
          </motion.div>
        )}

        {step === 'shuffle' && (
          <motion.div key="shuffle" {...fadeMotion} style={shuffleStage}>
            <div style={shuffleSurface}>
              {shuffleLayout.map((card) => {
                const seed = (shuffleTick + 1) * (card.id + 3);
                const randomX = Math.sin(seed * 12.9898) * 0.5 + 0.5;
                const randomY = Math.sin(seed * 78.233) * 0.5 + 0.5;
                const randomRotate = Math.sin(seed * 37.719);

                return (
                  <motion.div
                    key={card.id}
                    animate={{
                      x: (randomX - 0.5) * 920,
                      y: (randomY - 0.5) * 430,
                      rotate: randomRotate * 92,
                      scale: 0.5,
                      opacity: card.id < 70 ? 0.92 : 0.55
                    }}
                    transition={{
                      duration: 0.72,
                      delay: card.delay,
                      ease: 'easeInOut'
                    }}
                    style={{ ...tableCardBack(cardBackUrl), position: 'absolute', left: '50%', top: '50%', marginLeft: '-52px', marginTop: '-87px' }}
                  />
                );
              })}
            </div>
            <div style={shuffleControl}>
              <div style={portalText}>TABLE SHUFFLE</div>
              <p style={shuffleHint}>{COPY.shuffleHint}</p>
              <motion.button whileHover={buttonHover} whileTap={{ scale: 0.97 }} onClick={stopShuffle} style={primaryButton}>
                <Sparkles size={17} />
                {COPY.stopShuffle}
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'draw_cards' && (
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
                        if (Math.abs(info.offset.y) > 44 || Math.abs(info.offset.x) > 54) drawOneCard(index);
                      }}
                      onClick={() => drawOneCard(index)}
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
        )}

        {step === 'result' && (
          <motion.div key="result" {...fadeMotion} style={resultStage}>
            <div style={resultHeader}>
              <div style={goldLabel}>READING RESULT</div>
              <h2 style={title}>{spread.name}</h2>
              <p style={resultSubcopy}>{COPY.selectedPrefix} {drawnCards.length} {COPY.cardUnit}</p>
            </div>
            <ResultSpread cards={drawnCards} spread={spread} cardBackUrl={cardBackUrl} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function DeckStack({ cardBackUrl }) {
  return (
    <div style={deckStack}>
      <div style={deckShadow} />
      {Array.from({ length: 30 }, (_, index) => (
        <div
          key={index}
          style={{
            ...stackCardBack(cardBackUrl),
            position: 'absolute',
            transform: `translate(${index * 0.38}px, ${-index * 0.72}px)`,
            filter: `brightness(${1 - index * 0.005})`
          }}
        />
      ))}
      <div style={stackLabel}>78</div>
    </div>
  );
}

function QuestionGuideBook({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={bookOverlay}
    >
      <motion.div
        initial={{ rotateX: -10, scale: 0.94, y: 20 }}
        animate={{ rotateX: 0, scale: 1, y: 0 }}
        exit={{ rotateX: 8, scale: 0.96, y: 12 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        style={openBook}
      >
        <motion.button
          type="button"
          aria-label="Close guide"
          onClick={onClose}
          style={bookCloseX}
          whileHover={{ scale: 1.08, filter: 'drop-shadow(0 0 10px rgba(188,19,254,0.55))' }}
          whileTap={{ scale: 0.94 }}
        >
          ×
        </motion.button>

        <section style={bookLeftContent}>
          <div style={bookEyebrow}>QUESTION RITE</div>
          <h3 style={bookTitle}>儀式祈請</h3>
          <div style={bookSubtitle}>INVOCATION</div>
          <p style={bookInvocation}>{COPY.guideBody}</p>
          <div style={bookDivider} />
          <p style={bookInstruction}>
            在進行占卜前，請先靜下心來，專注於你的問題，並以真誠與尊重的心向塔羅牌提出你的請求。讓能量與意圖清晰，指引將更加準確。
          </p>
        </section>

        <section style={bookRightContent}>
          <p style={bookNote}>{COPY.guideNote}</p>
          <div style={bookSeal} aria-hidden="true">
            <div style={bookSealEye}>◉</div>
          </div>
          <motion.button type="button" onClick={onClose} style={bookCloseButton} whileHover={buttonHover} whileTap={{ scale: 0.97 }}>
            <span>✦ 開啟占卜儀式 ✦</span>
            <small>PROCEED TO DIVINATION</small>
          </motion.button>
        </section>
      </motion.div>
    </motion.div>
  );
}

function FloatingGuideBook({ onClick }) {
  return (
    <motion.button
      type="button"
      aria-label="Open question guide"
      style={floatingGuideBook}
      whileHover={{ y: -4, scale: 1.05, filter: 'drop-shadow(0 0 18px rgba(188,19,254,0.55)) brightness(1.12)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <img src="/assets/tarot/guide-book-icon.png" alt="" style={guideBookImage} />
    </motion.button>
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

function ResultSpread({ cards, spread, cardBackUrl }) {
  if (spread.key !== 'relationship') {
    return (
      <div style={simpleResultSpread}>
        {cards.map((card) => (
          <ResultCard key={card.id} card={card} cardBackUrl={cardBackUrl} />
        ))}
      </div>
    );
  }

  const slots = [
    { left: '34%', top: '72%' },
    { left: '66%', top: '72%' },
    { left: '50%', top: '56%' },
    { left: '50%', top: '30%' },
    { left: '50%', top: '84%' }
  ];

  return (
    <div style={relationshipSpread}>
      {cards.map((card, index) => (
        <ResultCard
          key={card.id}
          card={card}
          cardBackUrl={cardBackUrl}
          style={{
            position: 'absolute',
            left: slots[index]?.left || '50%',
            top: slots[index]?.top || '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </div>
  );
}

function ResultCard({ card, cardBackUrl, style }) {
  const faceUrl = card.imageUrl ? getAssetUrl(card.imageUrl) : cardBackUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: card.position * 0.08 }}
      style={{ ...resultCardWrap, ...style }}
    >
      <div style={resultCardFace(faceUrl)} />
      <div style={resultNumber}>POSITION {card.position}</div>
      <div style={resultName}>{card.name}</div>
      {card.subtitle && <div style={resultSubtitle}>{card.subtitle}</div>}
    </motion.div>
  );
}

const spreadFrameImage = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'fill',
  pointerEvents: 'none',
  opacity: 0.68,
  zIndex: 4
};

const fadeMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const zhFont = "'Noto Serif TC', 'Microsoft JhengHei', 'PingFang TC', sans-serif";
const buttonHover = { filter: 'brightness(1.12) drop-shadow(0 0 16px rgba(188,19,254,0.46))', color: '#ffffff' };
const spreadHover = {
  y: -4,
  filter: 'brightness(1.08) drop-shadow(0 0 12px rgba(188,19,254,0.24))',
  boxShadow: '0 0 0 1px rgba(212,175,55,0.36), 0 0 22px rgba(188,19,254,0.26)'
};
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

const stackCardBack = (cardBackUrl) => ({
  ...baseBack(cardBackUrl),
  width: '118px',
  height: '198px'
});

const tableCardBack = (cardBackUrl) => ({
  ...baseBack(cardBackUrl),
  width: '104px',
  height: '174px'
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

const resultCardFace = (cardBackUrl) => ({
  ...baseBack(cardBackUrl),
  width: '92px',
  height: '156px',
  margin: '0 auto 12px'
});

const systemShell = {
  position: 'relative',
  width: '100%',
  height: 'calc(100vh - 120px)',
  minHeight: '620px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  fontFamily: "'Cinzel', serif"
};
const portalCanvas = { position: 'absolute', inset: '50% auto auto 50%', transform: 'translate(-50%, -50%)', opacity: 0.86, pointerEvents: 'none' };
const panel = {
  position: 'relative',
  zIndex: 2,
  width: 'min(620px, 92vw)',
  background: 'rgba(8,4,13,0.68)',
  border: '1px solid rgba(212,175,55,0.2)',
  backdropFilter: 'blur(0.5px)',
  borderRadius: '8px',
  padding: '34px',
  boxShadow: '0 0 38px rgba(0,0,0,0.45)'
};
const spreadHeader = {
  position: 'relative',
  zIndex: 6,
  textAlign: 'center',
  marginTop: 0
};
const spreadTitle = {
  marginBottom: '8px',
  fontSize: 'clamp(1.65rem, 2.65vw, 2.8rem)',
  lineHeight: 1,
  letterSpacing: '0.12em',
  textShadow: '0 0 18px rgba(255,255,255,0.16)'
};
const spreadSubtitle = {
  display: 'inline-grid',
  gridTemplateColumns: '96px auto 96px',
  alignItems: 'center',
  gap: '16px',
  color: 'rgba(255,255,255,0.62)',
  fontFamily: zhFont,
  fontSize: '0.9rem',
  lineHeight: 1.4,
  letterSpacing: '0.08em',
  marginTop: '2px'
};
const spreadSubtitleLine = {
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.58), transparent)'
};
const spreadPanel = {
  position: 'relative',
  zIndex: 2,
  width: 'min(1180px, 96vw)',
  minHeight: '560px',
  padding: '42px 20px 34px',
  overflow: 'visible',
  textAlign: 'center',
  isolation: 'isolate'
};
const questionLayout = {
    position: 'relative',
    zIndex: 2,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 640px) 150px',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '44px',
    width: 'min(920px, 92vw)'
};
const questionPanel = { ...panel, width: '100%', boxSizing: 'border-box' };
const questionPortalStage = {
  position: 'absolute',
  left: '50%',
  bottom: '-72px',
  width: '620px',
  height: '180px',
  transform: 'translateX(-50%) rotateX(68deg)',
  borderRadius: '50%',
  border: '1px solid rgba(212,175,55,0.34)',
  background: 'radial-gradient(circle, rgba(255,255,255,0.12), rgba(188,19,254,0.14) 32%, transparent 68%)',
  boxShadow: '0 0 42px rgba(188,19,254,0.24), inset 0 0 34px rgba(212,175,55,0.12)',
  animation: 'spreadPortalSpin 12s linear infinite',
  pointerEvents: 'none',
  zIndex: -1
};
const goldLabel = { color: '#d4af37', fontSize: '0.72rem', letterSpacing: '4px', marginBottom: '12px' };
const title = { margin: '0 0 18px', color: '#fff', fontSize: 'clamp(1.45rem, 2.35vw, 2.18rem)', letterSpacing: '3px' };
const bodyText = { color: 'rgba(255,255,255,0.76)', lineHeight: 1.9, fontFamily: zhFont, marginBottom: '24px', letterSpacing: '0.04em', fontSize: '1rem' };
const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  minWidth: '190px',
  border: '1px solid rgba(212,175,55,0.45)',
  background: 'rgba(14,10,18,0.86)',
  color: '#fff',
  padding: '13px 18px',
  borderRadius: '4px',
  cursor: 'pointer',
  letterSpacing: '2px',
  fontFamily: "'Cinzel', serif",
  transition: 'filter 140ms ease, transform 140ms ease'
};
const spreadCarouselStage = {
  position: 'relative',
  height: '430px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  perspective: '1200px',
  marginTop: '14px',
  overflow: 'visible'
};
const spreadMagicCircleFloor = {
  position: 'absolute',
  left: '50%',
  bottom: '-132px',
  width: 'min(1536px, 120vw)',
  height: '320px',
  maxWidth: 'none',
  transform: 'translateX(-50%)',
  objectFit: 'contain',
  objectPosition: 'center bottom',
  opacity: 0.68,
  filter: 'brightness(1.05) saturate(0.96)',
  pointerEvents: 'none',
  userSelect: 'none',
  zIndex: 0
};
const spreadCarousel = {
  position: 'relative',
  width: '248px',
  height: '386px',
  transformStyle: 'preserve-3d',
  cursor: 'grab',
  zIndex: 3
};
const spreadCarouselCard = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  gridTemplateRows: 'auto minmax(116px, 1fr) auto auto',
  justifyItems: 'center',
  rowGap: '6px',
  alignItems: 'center',
  background: 'transparent',
  border: 'none',
  borderRadius: 0,
  color: '#fff',
  minHeight: '386px',
  padding: 0,
  textAlign: 'center',
  fontFamily: zhFont,
  boxShadow: 'none',
  overflow: 'visible',
  transformStyle: 'preserve-3d',
  boxSizing: 'border-box',
  cursor: 'pointer'
};
const activeSpreadDisplayCard = {
  boxShadow: '0 0 0 1px rgba(212,175,55,0.36), 0 0 24px rgba(188,19,254,0.24)'
};
const inactiveSpreadDisplayCard = {
  boxShadow: 'none'
};
const spreadActiveUplight = {
  position: 'absolute',
  left: '50%',
  bottom: '-26px',
  width: '68%',
  height: '116px',
  transform: 'translateX(-50%)',
  background: 'linear-gradient(to top, rgba(188,19,254,0.28), rgba(212,175,55,0.12) 42%, transparent 80%)',
  filter: 'blur(14px)',
  pointerEvents: 'none',
  zIndex: 0
};
const spreadCardBackdrop = {
  position: 'absolute',
  inset: 0,
  borderRadius: '8px',
  background: 'transparent',
  backdropFilter: 'blur(5px)',
  WebkitBackdropFilter: 'blur(5px)',
  boxShadow: 'none',
  pointerEvents: 'none',
  zIndex: 1
};
const spreadIconCenterGlow = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: '94px',
  height: '94px',
  transform: 'translate(-50%, -50%)',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,255,255,0.18), rgba(212,175,55,0.16) 18%, rgba(188,19,254,0.18) 42%, transparent 68%)',
  filter: 'blur(8px)',
  pointerEvents: 'none',
  zIndex: 0
};
const carouselArrow = {
  position: 'absolute',
  top: '50%',
  zIndex: 8,
  width: '40px',
  height: '40px',
  transform: 'translateY(-50%)',
  borderRadius: '50%',
  border: '1px solid rgba(212,175,55,0.36)',
  background: 'rgba(8,4,13,0.72)',
  color: '#d4af37',
  fontSize: '1.7rem',
  lineHeight: 1,
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center'
};
const spreadActiveAura = {
  display: 'none'
};
const spreadSpotlight = {
  display: 'none'
};
const verticalSpreadList = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', alignItems: 'stretch' };
const spreadCard = {
  minHeight: '176px',
  display: 'grid',
  gridTemplateColumns: '36px minmax(0, 1fr) minmax(108px, 0.78fr)',
  gap: '12px',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.032)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  padding: '18px',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: zhFont,
  transition: 'filter 140ms ease, transform 140ms ease, background 140ms ease'
};
const activeSpreadCard = { ...spreadCard, borderColor: 'rgba(212,175,55,0.46)', background: 'rgba(212,175,55,0.048)' };
const spreadIconWrap = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  color: '#d4af37',
  border: '1px solid rgba(212,175,55,0.42)',
  boxShadow: 'inset 0 0 18px rgba(188,19,254,0.16), 0 0 16px rgba(188,19,254,0.18)',
  marginBottom: '4px'
};
const spreadTextBlock = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  alignItems: 'center',
  justifyContent: 'center',
  width: '74%',
  marginTop: '48px',
  minHeight: '52px',
  zIndex: 5
};
const spreadNameText = {
  color: '#ffffff',
  fontFamily: "'Cinzel', serif",
  fontSize: '0.86rem',
  lineHeight: 1.2,
  letterSpacing: 0,
  whiteSpace: 'nowrap',
  textShadow: '0 0 12px rgba(255,255,255,0.2)'
};
const spreadZhText = {
  color: '#d4af37',
  fontFamily: zhFont,
  fontSize: '0.88rem',
  lineHeight: 1.25,
  fontStyle: 'normal',
  letterSpacing: '0.08em'
};
const spreadDescBlock = {
  width: '72%',
  minHeight: '66px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255,255,255,0.82)',
  fontSize: '0.78rem',
  lineHeight: 1.62,
  letterSpacing: '0.03em',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
  zIndex: 5
};
const spreadCountPill = {
  minWidth: '68px',
  height: '26px',
  padding: '0 14px',
  border: '1px solid rgba(212,175,55,0.46)',
  borderRadius: '999px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  color: '#f1d88f',
  background: 'rgba(3,1,8,0.76)',
  fontWeight: 500,
  letterSpacing: '0.08em'
};
const spreadAside = {
  gridColumn: '1 / -1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '7px',
  paddingTop: '2px',
  borderTop: '1px solid rgba(212,175,55,0.16)',
  color: 'rgba(255,255,255,0.64)',
  fontSize: '0.76rem',
  lineHeight: 1.55,
  zIndex: 5
};
const selectSpreadButton = {
  position: 'absolute',
  left: '50%',
  bottom: '-54px',
  transform: 'translateX(-50%)',
  minWidth: '180px',
  padding: '12px 18px',
  borderRadius: '4px',
  border: '1px solid rgba(188,19,254,0.6)',
  background: 'linear-gradient(180deg, rgba(188,19,254,0.28), rgba(70,24,92,0.74))',
  color: '#fff',
  cursor: 'pointer',
  fontFamily: "'Cinzel', serif",
  letterSpacing: '2px',
  fontSize: '0.72rem',
  zIndex: 8
};
const questionInput = {
  width: '100%',
  minHeight: '132px',
  boxSizing: 'border-box',
  resize: 'vertical',
  marginBottom: '22px',
  background: 'rgba(0,0,0,0.42)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '6px',
  padding: '14px',
  outline: 'none',
  fontSize: '1rem',
  fontFamily: zhFont,
  letterSpacing: '0.03em'
};
const deckStack = { position: 'relative', width: '148px', height: '226px' };
const deckShadow = {
  position: 'absolute',
  left: '20px',
  bottom: '10px',
  width: '120px',
  height: '34px',
  borderRadius: '50%',
  background: 'rgba(188,19,254,0.22)',
  filter: 'blur(14px)',
  transform: 'rotate(-8deg)'
};
const stackLabel = {
  position: 'absolute',
  right: '-2px',
  bottom: '2px',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(8,4,13,0.84)',
  border: '1px solid rgba(212,175,55,0.45)',
  color: '#d4af37',
  fontSize: '0.72rem',
  letterSpacing: '1px'
};
const shuffleStage = { position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const shuffleSurface = { position: 'absolute', inset: '4% 4% 18%', transform: 'perspective(1200px) rotateX(10deg)' };
const shuffleControl = { position: 'absolute', left: '50%', bottom: '22px', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' };
const portalText = { color: '#d4af37', letterSpacing: '5px', fontSize: '0.78rem' };
const shuffleHint = { maxWidth: '560px', margin: 0, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontFamily: zhFont, lineHeight: 1.7, fontSize: '0.92rem' };
const drawStage = {
  position: 'relative',
  zIndex: 2,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingTop: '10px'
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
const trayCard = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#d4af37', fontSize: '0.62rem', letterSpacing: '2px' };
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
const contextCardFace = (cardBackUrl) => ({
  ...baseBack(cardBackUrl),
  width: '54px',
  height: '92px',
  boxShadow: '0 10px 24px rgba(0,0,0,0.45)'
});
const contextMaster = { fontSize: '0.95rem', letterSpacing: '1.5px', lineHeight: 1.25 };
const contextSpread = { marginTop: '7px', color: 'rgba(255,255,255,0.64)', fontSize: '0.74rem', letterSpacing: '1px' };
const resultStage = {
  position: 'relative',
  zIndex: 2,
  width: 'min(1080px, 96vw)',
  height: '590px',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};
const resultHeader = { textAlign: 'center', marginTop: '8px' };
const resultSubcopy = { margin: '-8px 0 0', color: 'rgba(255,255,255,0.68)', fontFamily: zhFont, letterSpacing: '0.08em' };
const simpleResultSpread = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '34px', flex: 1, width: '100%' };
const relationshipSpread = { position: 'relative', flex: 1, width: 'min(760px, 92vw)', minHeight: '460px' };
const resultCardWrap = { width: '142px', textAlign: 'center', color: '#fff' };
const resultNumber = { color: '#d4af37', fontSize: '0.62rem', letterSpacing: '2px', marginBottom: '7px' };
const resultName = { color: '#fff', fontSize: '0.92rem', letterSpacing: '1.5px', lineHeight: 1.35 };
const resultSubtitle = { marginTop: '5px', color: 'rgba(212,175,55,0.72)', fontSize: '0.68rem', letterSpacing: '1px' };
const floatingGuideBook = {
  position: 'absolute',
  right: '22px',
  bottom: '18px',
  zIndex: 7,
  width: '58px',
  height: '58px',
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer'
};
const guideBookImage = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  pointerEvents: 'none'
};
const bookOverlay = {
  position: 'absolute',
  inset: '-80px',
  zIndex: 8,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(2,1,6,0.74)',
  backdropFilter: 'blur(4px)'
};
const openBook = {
  position: 'relative',
  width: 'min(820px, 82vw)',
  aspectRatio: '16 / 9.5',
  backgroundImage: 'url(/mystery-content.png)',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  filter: 'drop-shadow(0 30px 80px rgba(0,0,0,0.72))',
  transformStyle: 'preserve-3d',
  fontFamily: zhFont,
  color: '#2b2132'
};
const bookCloseX = {
  position: 'absolute',
  top: '7.2%',
  right: '7.4%',
  zIndex: 3,
  width: '34px',
  height: '34px',
  borderRadius: '50%',
  border: '1px solid rgba(74,45,24,0.28)',
  background: 'rgba(34,20,30,0.72)',
  color: '#f8e6c6',
  fontSize: '1.35rem',
  lineHeight: 1,
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center'
};
const bookLeftContent = {
  position: 'absolute',
  left: '13.2%',
  top: '15.6%',
  width: '34%',
  height: '69%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center'
};
const bookRightContent = {
  position: 'absolute',
  right: '13.5%',
  top: '16.6%',
  width: '33%',
  height: '68%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center'
};
const bookEyebrow = { marginTop: '5%', color: 'rgba(86,58,37,0.72)', fontFamily: "'Cinzel', serif", fontSize: '0.78rem', letterSpacing: '0.46em' };
const bookTitle = { margin: '8% 0 0', fontSize: 'clamp(1.55rem, 3vw, 2.8rem)', letterSpacing: '0.2em', color: '#2b2140', fontWeight: 700 };
const bookSubtitle = { marginTop: '1%', color: 'rgba(86,58,37,0.72)', fontFamily: "'Cinzel', serif", fontSize: '0.9rem', letterSpacing: '0.36em' };
const bookInvocation = {
  margin: '9% 0 0',
  color: '#2b2140',
  fontSize: 'clamp(0.95rem, 1.55vw, 1.35rem)',
  lineHeight: 2.05,
  fontWeight: 600,
  whiteSpace: 'pre-line'
};
const bookDivider = { width: '72%', height: '1px', margin: '7% 0 5%', background: 'linear-gradient(90deg, transparent, rgba(92,56,26,0.58), transparent)' };
const bookInstruction = {
  width: '76%',
  margin: 0,
  color: 'rgba(43,33,64,0.82)',
  fontSize: 'clamp(0.75rem, 1.05vw, 1rem)',
  lineHeight: 2,
  fontWeight: 600
};
const bookNote = {
  width: '72%',
  margin: '7% 0 0',
  color: 'rgba(43,33,64,0.86)',
  fontSize: 'clamp(0.82rem, 1.15vw, 1.05rem)',
  lineHeight: 1.9,
  fontWeight: 600
};
const bookSeal = {
  width: '48%',
  aspectRatio: '1',
  marginTop: '7%',
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  border: '1px solid rgba(92,56,26,0.28)',
  background: 'radial-gradient(circle, rgba(92,56,26,0.12), transparent 62%)',
  boxShadow: 'inset 0 0 22px rgba(92,56,26,0.12)'
};
const bookSealEye = { color: 'rgba(92,56,26,0.58)', fontSize: '2.4rem', transform: 'rotate(8deg)' };
const bookCloseButton = {
  display: 'inline-flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '3px',
  minWidth: '260px',
  marginTop: 'auto',
  marginBottom: '9%',
  padding: '15px 24px',
  borderRadius: '4px',
  border: '1px solid rgba(212,175,55,0.58)',
  background: 'linear-gradient(180deg, rgba(58,30,76,0.94), rgba(25,12,36,0.96))',
  color: '#f9e8c8',
  cursor: 'pointer',
  fontFamily: zhFont,
  fontSize: '1.08rem',
  letterSpacing: '0.18em',
  boxShadow: '0 10px 24px rgba(0,0,0,0.32), inset 0 0 18px rgba(212,175,55,0.12)',
  transition: 'filter 140ms ease, transform 140ms ease'
};

const spreadImageWrap = {
  width: '138px',
  height: '112px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0',
  position: 'relative',
  zIndex: 5
};

const spreadImage = {
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  filter: 'drop-shadow(0 0 18px rgba(188,19,254,0.45))',
  pointerEvents: 'none'
};

const drawSystemCSS = `
  @keyframes spreadPortalSpin {
    from {
      rotate: 0deg;
    }

    to {
      rotate: 360deg;
    }
  }

  @keyframes spreadPortalBreath {
    0%, 100% {
      opacity: 0.62;
      scale: 0.98;
      filter: brightness(0.94);
    }

    50% {
      opacity: 1;
      scale: 1.035;
      filter: brightness(1.35);
    }
  }

  @keyframes activeAuraBreath {
    0%, 100% {
      opacity: 0.38;
      scale: 0.92;
    }

    50% {
      opacity: 0.9;
      scale: 1.08;
    }
  }

  .tarot-drawing-copy strong {
    font-family: 'Cinzel', serif;
  }

  @media (max-width: 780px) {
    .spread-selection-stage {
      height: 398px !important;
      max-width: 100vw !important;
    }

    .spread-magic-floor {
      width: 150vw !important;
      height: 260px !important;
      bottom: -86px !important;
      opacity: 0.26 !important;
    }

    .spread-selection-grid {
      width: 254px !important;
      height: 334px !important;
    }

    .spread-selection-card {
      min-height: 334px !important;
      padding: 0 !important;
    }

    .tarot-drawing-card {
      width: 66px !important;
      height: 112px !important;
    }
  }
`;
