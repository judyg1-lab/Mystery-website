import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Copy, ExternalLink, Heart, Sparkles } from 'lucide-react';
import TarotDrawStage from './TarotDrawStage';
import MysticModal from '../MysticModal';

const text = (value) => decodeURIComponent(value);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DECK_SIZE = 78;
const TAROT_AI_TARGETS = [
  { label: 'ChatGPT', url: 'https://chatgpt.com/' },
  { label: 'Claude', url: 'https://claude.ai/new' },
  { label: 'Gemini', url: 'https://gemini.google.com/app' }
];

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
  guideNote: text('%E8%AB%8B%E5%9C%A8%E5%BF%83%E8%A3%A1%E9%87%8D%E8%A4%87%E5%BF%B5%E4%B8%89%E9%81%8D%EF%BC%8C%E5%86%8D%E9%97%94%E4%B8%8A%E9%80%99%E6%9C%AC%E6%9B%B8%E9%96%8B%E5%A7%8B%E8%BC%B8%E5%85%A5%E5%95%8F%E9%A1%8C%E3%80%82'),
  guideInstruction: text('%E5%9C%A8%E9%80%B2%E8%A1%8C%E5%8D%A0%E5%8D%9C%E5%89%8D%EF%BC%8C%E8%AB%8B%E5%85%88%E9%9D%9C%E4%B8%8B%E5%BF%83%E4%BE%86%EF%BC%8C%E5%B0%88%E6%B3%A8%E6%96%BC%E4%BD%A0%E7%9A%84%E5%95%8F%E9%A1%8C%EF%BC%8C%E4%B8%A6%E4%BB%A5%E7%9C%9F%E8%AA%A0%E8%88%87%E5%B0%8A%E9%87%8D%E7%9A%84%E5%BF%83%E5%90%91%E5%A1%94%E7%BE%85%E7%89%8C%E6%8F%90%E5%87%BA%E4%BD%A0%E7%9A%84%E8%AB%8B%E6%B1%82%E3%80%82%E8%AE%93%E8%83%BD%E9%87%8F%E8%88%87%E6%84%8F%E5%9C%96%E6%B8%85%E6%99%B0%EF%BC%8C%E6%8C%87%E5%BC%95%E5%B0%87%E6%9B%B4%E5%8A%A0%E6%BA%96%E7%A2%BA%E3%80%82'),
  openRite: text('%E9%96%8B%E5%95%9F%E5%8D%A0%E5%8D%9C%E5%84%80%E5%BC%8F'),
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
    },
    {
    key: 'advice_spread',
    name: 'Advice Spread',
    zhName: text('%E5%91%BD%E9%81%8B%E6%8C%87%E5%BC%95'),
    icon: '/assets/tarot/spread-advice.png',
    desc: text('%E4%B8%89%E5%BC%B5%E7%89%8C%EF%BC%8C%E7%9C%8B%E8%A6%8B%E5%95%8F%E9%A1%8C%E6%A0%B8%E5%BF%83%E3%80%81%E9%9A%B1%E8%97%8F%E7%9B%B2%E9%BB%9E%E8%88%87%E4%B8%8B%E4%B8%80%E6%AD%A5%E5%BB%BA%E8%AD%B0%E3%80%82'),
    detail: text('%E9%81%A9%E5%90%88%E7%95%B6%E4%BD%A0%E9%9C%80%E8%A6%81%E6%96%B9%E5%90%91%E3%80%81%E6%8F%90%E7%A4%BA%E6%88%96%E5%91%BD%E9%81%8B%E6%8C%87%E5%BC%95%E6%99%82%E4%BD%BF%E7%94%A8%E3%80%82'),
    count: 3
  }
];

const SOUL_MASTER_SPREAD = {
  key: 'soul_master',
  name: 'Soul Master Draw',
  zhName: text('%E9%9D%88%E9%AD%82%E4%B8%BB%E7%89%8C%E6%8A%BD%E5%8F%96'),
  count: 1
};

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

const getToken = () => localStorage.getItem('mystic_token') || localStorage.getItem('token') || '';

function runSmoothViewTransition(update) {
  if (typeof document !== 'undefined' && document.startViewTransition) {
    document.startViewTransition(() => flushSync(update));
    return;
  }

  update();
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
  const back = Math.abs(offset) >= 2;

  return {
    x: back ? offset * 104 : offset * 318,
    y: active ? 0 : back ? 38 : 18,
    z: active ? 90 : back ? -250 : -92,
    scale: active ? 1 : back ? 0.58 : 0.74,
    opacity: active ? 1 : back ? 0.2 : 0.44,
    rotateY: back ? offset * -54 : offset * -58,
    zIndex: active ? 7 : back ? 1 : 4,
    filter: active
      ? 'brightness(1.04) drop-shadow(0 0 18px rgba(212,175,55,0.26))'
      : back
        ? 'brightness(0.34) saturate(0.55) blur(1px)'
        : 'brightness(0.48) saturate(0.72)'
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

export default function TarotDrawingSystem({ cardBackUrl, onBackHandlerChange, onImmersiveChange, onHistoryCreated }) {
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
  const [showQuestionRequiredModal, setShowQuestionRequiredModal] = useState(false);
  const [showTarotPromptMenu, setShowTarotPromptMenu] = useState(false);
  const [tarotAiReport, setTarotAiReport] = useState('');
  const [isTarotAiLoading, setIsTarotAiLoading] = useState(false);
  const [savedHistory, setSavedHistory] = useState(null);
  const [isQuestionFocused, setIsQuestionFocused] = useState(false);
  const [activeSpreadIndex, setActiveSpreadIndex] = useState(1);
  const [isRiteTransitioning, setIsRiteTransitioning] = useState(false);
  const [ritualPhase, setRitualPhase] = useState('idle');
  const [shuffleMode, setShuffleMode] = useState('riffle');
  const transitionTimelineRef = useRef(null);
  const spreadPanelRef = useRef(null);
  const spreadStageRef = useRef(null);
  const shuffleLayout = useMemo(() => createShuffleLayout(), []);
  const drawableCards = useMemo(() => tarotCards, [tarotCards]);
  const majorArcanaCards = useMemo(() => {
    const majors = tarotCards
      .filter((card) => String(card.suit || '').toUpperCase() === 'MAJOR')
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    return majors.length ? majors : MAJOR_MASTERS.map((name, index) => ({
      id: `major-${index}`,
      title: name,
      subtitle: '',
      imageUrl: `/tarot/cards/main/${encodeURIComponent(
        name.toLowerCase()
          .replace('the magician', 'the magus')
          .replace('the high priestess', 'the priestess')
      )}.png`,
      meaning: '',
      orderIndex: index
    }));
  }, [tarotCards]);

  useEffect(() => {
    let alive = true;

    const enterSoulMasterDraw = () => {
      setSpread(SOUL_MASTER_SPREAD);
      setSelectedDraws([]);
      setDrawnCards([]);
      setTarotAiReport('');
      setIsCompleting(false);
      setStep('draw_master');
    };

    const loadSoulMaster = async () => {
      const token = getToken();
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (!alive) return;
          if (res.ok && data.masterCard) {
            localStorage.setItem('soul_master_card', data.masterCard);
            setSoulMaster(data.masterCard);
            setStep('select_spread');
            return;
          }
        } catch (error) {
          console.warn('Failed to load soul master from profile:', error);
        }

        if (!alive) return;
        localStorage.removeItem('soul_master_card');
        enterSoulMasterDraw();
        return;
      }

      const savedMaster = localStorage.getItem('soul_master_card');
      if (savedMaster) {
        setSoulMaster(savedMaster);
        setStep('select_spread');
        return;
      }

      enterSoulMasterDraw();
    };

    loadSoulMaster();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (step !== 'shuffle') return undefined;

    setShuffleMode('riffle');
    const scatterTimeoutId = window.setTimeout(() => {
      setShuffleMode('scatter');
    }, 2850);
    const intervalId = window.setInterval(() => {
      setShuffleTick((tick) => tick + 1);
    }, 760);

    return () => {
      window.clearTimeout(scatterTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [step]);

  useEffect(() => {
    onImmersiveChange?.(step === 'shuffle');
    return () => onImmersiveChange?.(false);
  }, [onImmersiveChange, step]);

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
    setSpread(SOUL_MASTER_SPREAD);
    setSelectedDraws([]);
    setDrawnCards([]);
    setSavedHistory(null);
    setTarotAiReport('');
    setIsTarotAiLoading(false);
    setStep('draw_master');
  };

  const killRiteTransition = useCallback(() => {
    transitionTimelineRef.current?.kill();
    transitionTimelineRef.current = null;
  }, []);

  useEffect(() => () => killRiteTransition(), [killRiteTransition]);

  const startShuffle = () => {
    if (isRiteTransitioning) return;
    if (!soulMaster) {
      setSpread(SOUL_MASTER_SPREAD);
      setSelectedDraws([]);
      setStep('draw_master');
      return;
    }
    if (!question.trim()) {
      setShowQuestionGuide(false);
      setShowQuestionRequiredModal(true);
      return;
    }

    setIsRiteTransitioning(true);
    setIsQuestionFocused(false);
    setShowQuestionGuide(false);
    killRiteTransition();
    setRitualPhase('summoning');

    runSmoothViewTransition(() => {
      setSelectedDraws([]);
      setDrawnCards([]);
      setSavedHistory(null);
      setTarotAiReport('');
      setIsTarotAiLoading(false);
      setShowTarotPromptMenu(false);
      setIsCompleting(false);
      setShuffleTick(0);
      setShuffleMode('riffle');
      setStep('shuffle');
      setRitualPhase('shuffling');
      setIsRiteTransitioning(false);
    });
  };

  const stopShuffle = () => {
    if (isRiteTransitioning) return;

    setIsRiteTransitioning(true);
    setRitualPhase('stopping');
    killRiteTransition();

    runSmoothViewTransition(() => {
      setStep('draw_cards');
      setRitualPhase('spread');
      setIsRiteTransitioning(false);
    });
  };

  const selectSpreadWithRite = useCallback((item) => {
    if (isRiteTransitioning) return;
    if (!soulMaster) {
      setSpread(SOUL_MASTER_SPREAD);
      setSelectedDraws([]);
      setDrawnCards([]);
      setSavedHistory(null);
      setTarotAiReport('');
      setIsTarotAiLoading(false);
      setStep('draw_master');
      return;
    }

    setIsRiteTransitioning(true);
    setRitualPhase('idle');
    killRiteTransition();

    runSmoothViewTransition(() => {
      setSpread(item);
      setSelectedDraws([]);
      setDrawnCards([]);
      setSavedHistory(null);
      setTarotAiReport('');
      setIsTarotAiLoading(false);
      setShowTarotPromptMenu(false);
      setIsCompleting(false);
      setShuffleTick(0);
      setShuffleMode('riffle');
      setStep('question');
      setRitualPhase('idle');
      setIsRiteTransitioning(false);
    });
  }, [isRiteTransitioning, killRiteTransition, soulMaster]);

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
      setRitualPhase('waitingReveal');
    }
  };

  const drawSoulMasterFromArc = (sourceIndex) => {
    if (isCompleting) return;
    if (selectedDraws.length >= SOUL_MASTER_SPREAD.count) return;

    const tarotCard = majorArcanaCards[sourceIndex % majorArcanaCards.length];
    const card = {
      id: `${Date.now()}-${sourceIndex}`,
      sourceIndex,
      tarotId: tarotCard?.id || null,
      slug: tarotCard?.slug || null,
      name: tarotCard?.title || MAJOR_MASTERS[sourceIndex % MAJOR_MASTERS.length],
      subtitle: tarotCard?.subtitle || '',
      imageUrl: tarotCard?.imageUrl || '',
      meaning: tarotCard?.meaning || '',
      position: 1
    };

    setSelectedDraws([card]);
    setSavedHistory(null);
    setIsCompleting(true);
    setRitualPhase('waitingReveal');
  };

  const persistTarotHistory = useCallback(async (cards) => {
    const token = getToken();
    if (!token || !cards.length || !soulMaster || !question.trim()) return;

    const trimmedQuestion = question.trim();
    const content = JSON.stringify({
      type: 'tarot_reading',
      spread: {
        key: spread.key,
        name: spread.name,
        zhName: spread.zhName,
        count: spread.count
      },
      soulMaster,
      question: trimmedQuestion,
      cards: cards.map((card) => ({
        position: card.position,
        name: card.name,
        subtitle: card.subtitle,
        meaning: card.meaning,
        imageUrl: card.imageUrl,
        slug: card.slug,
        tarotId: card.tarotId
      })),
      summary: [
        `牌陣：${spread.name}`,
        `主牌：${soulMaster}`,
        `問題：${trimmedQuestion}`,
        '',
        '抽到的牌：',
        ...cards.map((card) => `${card.position}. ${card.name}${card.subtitle ? ` - ${card.subtitle}` : ''}${card.meaning ? `｜${card.meaning}` : ''}`)
      ].join('\n')
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/history/tarot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: trimmedQuestion,
          content
        })
      });
      const data = await res.json();
      if (res.ok && data.history) {
        setSavedHistory(data.history);
        onHistoryCreated?.(data.history);
      }
    } catch (error) {
      console.error('Failed to save tarot history:', error);
    }
  }, [onHistoryCreated, question, soulMaster, spread.count, spread.key, spread.name, spread.zhName]);

  const completeSoulMasterDraw = useCallback(() => {
    const masterCard = selectedDraws[0];
    if (!masterCard?.name) return;

    const masterName = masterCard.name;
    localStorage.setItem('soul_master_card', masterName);
    const token = getToken();
    if (token) {
      fetch(`${API_BASE_URL}/api/user/master-card`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ masterCard: masterName })
      }).catch((error) => {
        console.error('Failed to save soul master:', error);
      });
    }

    runSmoothViewTransition(() => {
      setSoulMaster(masterName);
      setSpread(SPREADS[0]);
      setSelectedDraws([]);
      setDrawnCards([]);
      setSavedHistory(null);
      setTarotAiReport('');
      setIsTarotAiLoading(false);
      setIsCompleting(false);
      setRitualPhase('idle');
      setStep('select_spread');
    });
  }, [selectedDraws]);

  const completeDrawReading = useCallback(() => {
    if (!selectedDraws.length) return;
    if (!soulMaster) {
      setSpread(SOUL_MASTER_SPREAD);
      setSelectedDraws([]);
      setIsCompleting(false);
      setStep('draw_master');
      return;
    }
    if (!question.trim()) {
      setShowQuestionRequiredModal(true);
      setIsCompleting(false);
      setStep('question');
      return;
    }

    persistTarotHistory(selectedDraws);

    runSmoothViewTransition(() => {
      setDrawnCards(selectedDraws);
      setStep('result');
      setRitualPhase('reading');
      setIsCompleting(false);
    });
  }, [persistTarotHistory, question, selectedDraws, soulMaster]);

  const tarotPrompt = useMemo(() => {
    if (!drawnCards.length || !soulMaster) return '';
    return [
      '你是一位熟悉托特塔羅、卡巴拉生命之樹、占星對應與心理占卜倫理的專業解牌師。請用繁體中文回覆，語氣清晰、溫柔、具體，不做恐嚇式斷言。',
      `牌陣：${spread.name}`,
      `靈魂主牌：${soulMaster}`,
      `核心要求：請以靈魂主牌「${soulMaster}」作為本次問題分析與解牌的核心底色，說明它如何影響整體牌陣、當事人的盲點與可行行動。`,
      `提問：${question.trim()}`,
      '',
      '抽到的牌：',
      ...drawnCards.map((card) => `${card.position}. ${card.name}${card.subtitle ? ` - ${card.subtitle}` : ''}${card.meaning ? `｜${card.meaning}` : ''}`),
      '',
      '請分成：1. 牌陣總覽與靈魂主牌底色；2. 每張牌的位置解讀；3. 牌與牌之間的關係與流動；4. 當下最重要的提醒；5. 三個具體行動建議。'
    ].join('\n');
  }, [drawnCards, question, soulMaster, spread.name]);

  const copyTarotPrompt = async (url) => {
    if (!tarotPrompt) return;
    await navigator.clipboard.writeText(tarotPrompt);
    setShowTarotPromptMenu(false);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleResultFavorite = async () => {
    const token = getToken();
    if (!token || !savedHistory?.id) return;

    try {
      if (savedHistory.isFavorite && savedHistory.favoriteId) {
        const res = await fetch(`${API_BASE_URL}/api/user/favorites/${savedHistory.favoriteId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const nextHistory = { ...savedHistory, isFavorite: false, favoriteId: null };
        setSavedHistory(nextHistory);
        onHistoryCreated?.(nextHistory);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/user/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ historyId: savedHistory.id })
      });
      const data = await res.json();
      if (res.ok && data.favorite) {
        const nextHistory = { ...savedHistory, isFavorite: true, favoriteId: data.favorite.id };
        setSavedHistory(nextHistory);
        onHistoryCreated?.(nextHistory);
      }
    } catch (error) {
      console.error('Failed to toggle tarot result favorite:', error);
    }
  };

  const generateTarotAiReport = async () => {
    if (!drawnCards.length || !tarotPrompt) return;
    setShowTarotPromptMenu(false);
    setIsTarotAiLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/ai/reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ system: 'tarot', prompt: tarotPrompt })
      });
      const data = await res.json();
      setTarotAiReport(res.ok && data.report ? data.report : (data.error || 'AI 解讀暫時無法完成，請稍後再試。'));
    } catch (error) {
      console.error('Tarot AI reading failed:', error);
      setTarotAiReport('AI 解讀暫時無法完成，請稍後再試。');
    } finally {
      setIsTarotAiLoading(false);
    }
  };

  const handlePrevSpread = () => {
    setActiveSpreadIndex((index) => (index - 1 + SPREADS.length) % SPREADS.length);
  };

  const handleNextSpread = () => {
    setActiveSpreadIndex((index) => (index + 1) % SPREADS.length);
  };

  const handleDrawingBack = useCallback(() => {
    if (showQuestionGuide) {
      setShowQuestionGuide(false);
      return true;
    }

    if (step === 'draw_master' && !soulMaster) return true;

    if (['shuffle', 'draw_cards', 'result'].includes(step)) {
      setIsQuestionFocused(false);
      setShowQuestionGuide(false);
      setStep(soulMaster ? 'select_spread' : 'draw_master');
      return true;
    }

    if (step === 'question') {
      setIsQuestionFocused(false);
      setShowQuestionGuide(false);
      setStep(soulMaster ? 'select_spread' : 'draw_master');
      return true;
    }

    return false;
  }, [showQuestionGuide, soulMaster, step]);

  useEffect(() => {
    if (!onBackHandlerChange) return undefined;
    onBackHandlerChange(() => handleDrawingBack);

    return () => onBackHandlerChange(null);
  }, [handleDrawingBack, onBackHandlerChange]);

  return (
    <section style={{ ...systemShell, ...(step === 'shuffle' ? immersiveSystemShell : null), ...(step === 'result' ? { overflowY: 'auto', alignItems: 'flex-start' } : null) }}>
      <style>{drawSystemCSS}</style>
      {false && step === 'shuffle' && <TarotPortalParticles active />}

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
          <motion.div key="spread" ref={spreadPanelRef} {...fadeMotion} style={spreadPanel} data-rite-phase={ritualPhase}>
            <div style={spreadHeader}>
              <div style={goldLabel}>MASTER CARD: {soulMaster}</div>
              <h2 style={{ ...title, ...spreadTitle }}>Choose A Spread</h2>
              <div style={spreadSubtitle}>
                <span style={spreadSubtitleLine} />
                <span>{text('%E9%81%B8%E6%93%87%E4%B8%80%E7%A8%AE%E7%89%8C%E9%99%A3%EF%BC%8C%E9%96%8B%E5%95%9F%E4%BD%A0%E7%9A%84%E5%A1%94%E7%BE%85%E6%8C%87%E5%BC%95')}</span>
                <span style={spreadSubtitleLine} />
              </div>
            </div>
            <div ref={spreadStageRef} className="spread-selection-stage" style={spreadCarouselStage}>
              <img className="spread-magic-floor" src="/assets/tarot/magic-circle-floor.png" alt="" style={spreadMagicCircleFloor} />
              <motion.button
                type="button"
                aria-label="Previous spread"
                style={{ ...carouselArrow, left: 'calc(50% - 218px)' }}
                whileHover={carouselArrowHover}
                whileTap={carouselArrowTap}
                onClick={handlePrevSpread}
              >
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
                    if (isRiteTransitioning) return;
                    if (!isActiveSpread) {
                      setActiveSpreadIndex(itemIndex);
                      return;
                    }
                    selectSpreadWithRite(item);
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
                    <img
                      src={item.icon}
                      alt=""
                      style={spreadImage}
                      onError={(event) => {
                        event.currentTarget.src = '/assets/tarot/guide-book-icon.png';
                      }}
                    />
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
              <motion.button
                type="button"
                aria-label="Next spread"
                style={{ ...carouselArrow, right: 'calc(50% - 218px)' }}
                whileHover={carouselArrowHover}
                whileTap={carouselArrowTap}
                onClick={handleNextSpread}
              >
                {'>'}
              </motion.button>
            </div>
            <AnimatePresence>
              {showQuestionGuide && <QuestionGuideBookModal onClose={() => setShowQuestionGuide(false)} />}
            </AnimatePresence>
          </motion.div>
        )}

        {step === 'question' && (
          <motion.div key="question" {...questionRiteMotion} className="question-rite-layout" style={questionLayout} data-rite-phase={ritualPhase}>
            <AnimatePresence>
              {showQuestionGuide && (
                <QuestionGuideBookModal onClose={() => setShowQuestionGuide(false)} onStart={startShuffle} />
              )}
            </AnimatePresence>
            <div className="question-balance-column" style={questionBalanceColumn} aria-hidden="true" />
            <div className="question-master-card" style={questionMasterCard}>
              <img
                src={soulMaster ? getAssetUrl(`/tarot/cards/main/${encodeURIComponent(
                  soulMaster
                    .toLowerCase()
                    .replace('the magician', 'the magus')
                    .replace('the high priestess', 'the priestess')
                    .trim()
                )}.png`) : cardBackUrl}
                alt={soulMaster || 'Master Card'}
                style={questionMasterImage}
                onError={(event) => {
                  event.currentTarget.src = cardBackUrl;
                }}
              />
              <span style={questionMasterLabel}>MASTER CARD</span>
              <strong style={questionMasterName}>{soulMaster || '未抽取主牌'}</strong>
            </div>
            <div
              className={`question-rite-panel ${isQuestionFocused ? 'focused' : ''}`}
              style={{ ...questionPanel, ...(isQuestionFocused ? questionPanelFocused : null) }}
              onFocus={() => setIsQuestionFocused(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setIsQuestionFocused(false);
              }}
            >
              <span style={{ ...questionPanelTopLine, ...(isQuestionFocused ? questionPanelLineFocused : null) }} />
              <span style={{ ...questionPanelLeftLine, ...(isQuestionFocused ? questionPanelLineFocused : null) }} />
              <span style={{ ...questionPanelRightLine, ...(isQuestionFocused ? questionPanelLineFocused : null) }} />
              <div style={goldLabel}>{spread.name}</div>
              <h2 style={title}>Enter Your Question</h2>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onFocus={() => setIsQuestionFocused(true)}
                placeholder={COPY.questionPlaceholder}
                style={{ ...questionInput, ...(isQuestionFocused ? questionInputFocused : null) }}
                disabled={showQuestionGuide}
              />
              <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={startShuffle} disabled={isRiteTransitioning} style={primaryButton}>
                <Sparkles size={17} />
                START SHUFFLE
              </motion.button>
            </div>
            <div className="question-deck-column" style={questionDeckColumn}>
              <DeckStack cardBackUrl={cardBackUrl} />
              <FloatingGuideBook onClick={() => setShowQuestionGuide(true)} style={questionGuideBookButton} />
            </div>
            <div className={`question-stage ${isQuestionFocused ? 'active' : ''}`}>
              <img
                src="/assets/tarot/magic-circle-floor.png"
                alt=""
                style={questionMagicCircleFloor}
              />
              <span className="stage-back-arc" />
              <span className="stage-front-arc" />
              <span className="stage-beam stage-beam-left" />
              <span className="stage-beam stage-beam-right" />
              <svg className="stage-tethers" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path className="stage-tether stage-tether-left" d="M 50 84 C 43 72, 33 62, 20 39" />
                <path className="stage-tether stage-tether-center" d="M 50 84 C 50 70, 50 55, 50 34" />
                <path className="stage-tether stage-tether-right" d="M 50 84 C 57 72, 67 62, 80 39" />
              </svg>
              <span className="stage-fog" />
            </div>
          </motion.div>
        )}

        {step === 'shuffle' && (
          <motion.div key="shuffle" {...fadeMotion} style={shuffleStage} data-rite-phase={ritualPhase}>
            <div style={shuffleSurface}>
              {shuffleLayout.map((card) => {
                const seed = (shuffleTick + 1) * (card.id + 3);
                const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
                const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 820;
                const randomX = Math.sin(seed * 12.9898) * 0.5 + 0.5;
                const randomY = Math.sin(seed * 78.233) * 0.5 + 0.5;
                const randomRotate = Math.sin(seed * 37.719);
                const randomScale = Math.sin(seed * 19.137) * 0.5 + 0.5;
                const randomDepth = Math.sin(seed * 5.781) * 0.5 + 0.5;
                const randomRotateY = Math.sin(seed * 23.456);
                const randomRotateX = Math.sin(seed * 41.234);
                const driftX = Math.sin(shuffleTick * 0.7 + card.id) * 34;
                const driftY = Math.cos(shuffleTick * 0.62 + card.id * 0.45) * 26;

                return (
                  <motion.div
                    key={card.id}
                    animate={{
                      x: (randomX - 0.5) * (viewportWidth + 220) + driftX,
                      y: (randomY - 0.5) * (viewportHeight + 180) + driftY,
                      rotate: randomRotate * 6,       // 22 → 6，幾乎不側轉
                      rotateY: randomRotateY * 28,    // 68 → 28，牌大致面向觀眾
                      rotateX: randomRotateX * 8,     // 22 → 8，只有輕微前後傾斜
                      scale: 0.52 + randomScale * 0.44,
                      opacity: 0.58 + randomDepth * 0.38,
                      zIndex: Math.round(randomDepth * 50)
                    }}
                    transition={{
                      duration: 0.9 + randomDepth * 0.42,
                      delay: card.delay * 0.45,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    style={{
                      ...tableCardBack(cardBackUrl),
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      marginLeft: '-52px',
                      marginTop: '-87px',
                      transformStyle: 'preserve-3d'
                    }}
                  />
                );
              })}
            </div>
            <div style={shuffleControl}>
              <p style={shuffleHint}>牌面正在隨機洗牌，感覺完成後停止。</p>
              <motion.button whileHover={buttonHover} whileTap={buttonTap} onClick={stopShuffle} disabled={isRiteTransitioning} style={primaryButton}>
                <Sparkles size={17} />
                {COPY.stopShuffle}
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'draw_cards' && (
          <TarotDrawStage
            key="draw"
            cardBackUrl={cardBackUrl}
            soulMaster={soulMaster}
            spread={spread}
            selectedDraws={selectedDraws}
            isCompleting={isCompleting}
            onDrawCard={drawOneCard}
            onRevealComplete={completeDrawReading}
          />
        )}

        {step === 'draw_master' && (
          <TarotDrawStage
            key="draw-master"
            cardBackUrl={cardBackUrl}
            soulMaster={selectedDraws[0]?.name || ''}
            spread={SOUL_MASTER_SPREAD}
            selectedDraws={selectedDraws}
            isCompleting={isCompleting}
            arcCardCount={22}
            onDrawCard={drawSoulMasterFromArc}
            onRevealComplete={completeSoulMasterDraw}
          />
        )}

        {step === 'result' && (
          <motion.div key="result" {...fadeMotion} style={resultStage}>
            <motion.button
              type="button"
              aria-label="Favorite tarot result"
              title={savedHistory?.id ? '收藏這次占卜' : '歷史紀錄保存後可收藏'}
              style={resultFavoriteButton(savedHistory?.isFavorite)}
              whileHover={resultFavoriteHover(savedHistory?.isFavorite)}
              whileTap={buttonTap}
              disabled={!savedHistory?.id}
              onClick={toggleResultFavorite}
            >
              <Heart size={20} fill={savedHistory?.isFavorite ? '#bc13fe' : 'transparent'} />
            </motion.button>
            <div style={resultMasterCard}>
              <img
                src={soulMaster ? getAssetUrl(`/tarot/cards/main/${encodeURIComponent(
                  soulMaster
                    .toLowerCase()
                    .replace('the magician', 'the magus')
                    .replace('the high priestess', 'the priestess')
                    .trim()
                )}.png`) : cardBackUrl}
                alt={soulMaster || 'Master Card'}
                style={resultMasterImage}
                onError={(e) => { e.currentTarget.src = cardBackUrl; }}
              />
              <span style={resultMasterLabel}>MASTER CARD</span>
              <strong style={resultMasterName}>{soulMaster || '未抽取主牌'}</strong>
            </div>
            <div style={resultHeader}>
              <div style={goldLabel}>READING RESULT</div>
              <h2 style={title}>{spread.name}</h2>
              <p style={resultSubcopy}>{COPY.selectedPrefix} {drawnCards.length} {COPY.cardUnit}</p>
            </div>
            <ResultSpread cards={drawnCards} spread={spread} cardBackUrl={cardBackUrl} />
            <div style={tarotResultActions}>
              <div style={tarotPromptWrap}>
                <motion.button type="button" style={tarotActionButton} whileHover={tarotActionHover} whileTap={buttonTap} onClick={() => setShowTarotPromptMenu((open) => !open)}>
                  <Copy size={16} />
                  <span>複製 Prompt</span>
                </motion.button>
                {showTarotPromptMenu && (
                  <div className="tarot-prompt-menu" style={tarotPromptMenu}>
                    {TAROT_AI_TARGETS.map((target) => (
                      <button key={target.label} type="button" style={tarotPromptMenuItem} onClick={() => copyTarotPrompt(target.url)}>
                        <span>{target.label}</span>
                        <ExternalLink size={13} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <motion.button type="button" style={tarotActionButton} whileHover={tarotActionHover} whileTap={buttonTap} onClick={generateTarotAiReport} disabled={isTarotAiLoading}>
                <Bot size={16} />
                <span>{isTarotAiLoading ? 'AI 解讀中' : 'AI 解讀'}</span>
              </motion.button>
            </div>
            {tarotAiReport && <pre style={tarotAiReportBox}>{tarotAiReport}</pre>}
          </motion.div>
        )}
      </AnimatePresence>
      <MysticModal
        isOpen={showQuestionRequiredModal}
        onClose={() => setShowQuestionRequiredModal(false)}
        onConfirm={() => setShowQuestionRequiredModal(false)}
        title="QUESTION REQUIRED"
        message={text('%E8%AB%8B%E5%85%88%E8%BC%B8%E5%85%A5%E4%BD%A0%E6%83%B3%E8%A9%A2%E5%95%8F%E7%9A%84%E5%95%8F%E9%A1%8C%EF%BC%8C%E5%86%8D%E9%96%8B%E5%A7%8B%E5%8D%A0%E5%8D%9C%E5%84%80%E5%BC%8F%E3%80%82')}
        confirmText={text('%E6%88%91%E7%9F%A5%E9%81%93%E4%BA%86')}
        cancelText=""
        type="info"
      />
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

function QuestionGuideBookModal({ onClose, onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={bookOverlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ rotateX: -10, scale: 0.94, y: 20 }}
        animate={{ rotateX: 0, scale: 1, y: 0 }}
        exit={{ rotateX: 8, scale: 0.96, y: 12 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        style={openBook}
        onClick={(event) => event.stopPropagation()}
      >
        <motion.button
          type="button"
          aria-label="Close guide"
          onClick={onClose}
          style={bookCloseX}
          whileHover={{ scale: 1.08, filter: 'brightness(1.15) drop-shadow(0 0 10px rgba(188,19,254,0.45))' }}
          whileTap={{ scale: 0.94 }}
        >
          &times;
        </motion.button>

        <section style={bookLeftContent}>
          <div style={bookEyebrow}>QUESTION RITE</div>
          <h3 style={bookTitle}>{text('%E5%84%80%E5%BC%8F%E7%A5%88%E8%AB%8B')}</h3>
          <div style={bookSubtitle}>INVOCATION</div>
          <p style={bookInvocation}>{COPY.guideBody}</p>
          <div style={bookDivider} />
          <p style={bookInstruction}>{COPY.guideInstruction}</p>
        </section>

        <section style={bookRightContent}>
          <p style={bookNote}>{COPY.guideNote}</p>
          <motion.button type="button" onClick={onStart || onClose} style={bookCloseButton} whileHover={bookButtonHover} whileTap={{ scale: 0.97 }}>
            <span>{COPY.openRite}</span>
            <small>PROCEED TO DIVINATION</small>
          </motion.button>
        </section>
      </motion.div>
    </motion.div>
  );
}


function FloatingGuideBook({ onClick, style }) {
  return (
    <motion.button
      type="button"
      aria-label="Open question guide"
      style={{ ...floatingGuideBook, ...style }}
      whileHover={{ y: -4, scale: 1.05, filter: 'drop-shadow(0 0 18px rgba(188,19,254,0.55)) brightness(1.12)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <img src="/assets/tarot/guide-book-icon.png" alt="" style={guideBookImage} />
    </motion.button>
  );
}

function ResultSpread({ cards, spread, cardBackUrl }) {
  return (
    <div style={simpleResultSpread}>
      {cards.map((card) => (
        <ResultCard key={card.id} card={card} cardBackUrl={cardBackUrl} />
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
  top:'-14%',
  width: '130%',
  height: '130%',
  objectFit: 'fill',
  pointerEvents: 'none',
  opacity: 0.5,
  zIndex: 4
};

const fadeMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};
const questionRiteMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const zhFont = "'Noto Serif TC', 'Microsoft JhengHei', 'PingFang TC', sans-serif";
const buttonHover = {
  filter: 'brightness(1.16) saturate(1.15) drop-shadow(0 0 16px rgba(188,19,254,0.46))',
  background: 'linear-gradient(180deg, rgba(52,24,70,0.92), rgba(18,8,28,0.92))',
  color: '#ffffff'
};
const buttonTap = {
  scale: 0.97,
  filter: 'brightness(0.9) saturate(1.25)',
  background: 'linear-gradient(180deg, rgba(20,8,30,0.95), rgba(68,24,92,0.88))'
};
const carouselArrowHover = {
  color: '#ffffff',
  borderColor: 'rgba(241,216,143,0.58)',
  background: 'linear-gradient(180deg, rgba(30,15,42,0.72), rgba(7,3,12,0.86))',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -8px 16px rgba(0,0,0,0.32), 0 0 16px rgba(212,175,55,0.24), 0 0 22px rgba(188,19,254,0.18)',
  filter: 'brightness(1.12)'
};
const carouselArrowTap = {
  scale: 0.9,
  background: 'linear-gradient(180deg, rgba(7,3,12,0.9), rgba(28,12,40,0.72))',
  boxShadow: 'inset 0 6px 14px rgba(0,0,0,0.52), 0 0 8px rgba(212,175,55,0.16)',
  filter: 'brightness(0.96)'
};
const spreadHover = {
  y: -4,
  filter: 'brightness(1.12) drop-shadow(0 0 20px rgba(188,19,254,0.3))',
  boxShadow: '0 0 0 1px rgba(212,175,55,0.36), 0 0 22px rgba(188,19,254,0.26)'
};
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

const resultCardFace = (cardBackUrl) => ({
  ...baseBack(cardBackUrl),
  width: '158px',
  height: '266px',
  margin: '0 auto 14px'
});

const systemShell = {
  position: 'relative',
  width: '100%',
  height: 'calc(100vh - 80px)',
  minHeight: '620px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  fontFamily: "'Cinzel', serif"
};
const immersiveSystemShell = {
  height: '100vh',
  minHeight: '100vh',
  alignItems: 'stretch',
  justifyContent: 'stretch'
};
const portalCanvas = { position: 'absolute', inset: '50% auto auto 50%', transform: 'translate(-50%, -50%)', opacity: 0.86, pointerEvents: 'none' };
const panel = {
  position: 'relative',
  zIndex: 2,
  width: 'min(620px, 92vw)',
  background: 'rgba(8,4,13,0.4)',
  border: '1px solid rgba(212,175,55,0.005)',
  backdropFilter: 'blur(0.5px)',
  borderRadius: '8px',
  padding: '20px 34px',
  boxShadow: '0 0 38px rgba(0,0,0,0.45)'
};
const spreadHeader = {
  position: 'relative',
  zIndex: 6,
  textAlign: 'center',
  marginTop: '-35px',
  marginBottom: '7px',
};
const spreadTitle = {
  marginBottom: '6px',
  fontSize: 'clamp(1.48rem, 2.35vw, 2.45rem)',
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
  fontSize: '0.82rem',
  lineHeight: 1.32,
  letterSpacing: '0.08em',
  marginBottom: '16px'
};
const spreadSubtitleLine = {
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.58), transparent)'
};
const spreadPanel = {
  position: 'relative',
  zIndex: 2,
  width: 'min(1180px, 96vw)',
  minHeight: '100px',
  overflow: 'visible',
  textAlign: 'center',
  isolation: 'isolate',
};
const questionLayout = {
  position: 'relative',
  zIndex: 2,
  display: 'grid',
  gridTemplateColumns: 'clamp(150px, 15vw, 205px) minmax(0, 680px) clamp(150px, 15vw, 205px)',
  gridTemplateAreas: '"balance panel deck"',
  alignItems: 'center',
  justifyContent: 'center',
  justifyItems: 'center',
  gap: 'clamp(8px, 1.8vw, 26px)',
  width: 'min(1180px, 96vw)',
  transform: 'translateY(20px)',
  perspective: '1400px',
  transformStyle: 'preserve-3d',
  isolation: 'isolate'
};
const questionPanel = {
  ...panel,
  gridArea: 'panel',
  position: 'relative',
  width: '100%',
  minWidth: 0,
  padding: '32px 38px 36px',
  marginTop: '-126px',
  boxSizing: 'border-box',
  overflow: 'visible',
  isolation: 'isolate',
  border: 'none',
  borderRadius: '8px 8px 18px 18px / 8px 8px 42px 42px',
  background: 'radial-gradient(130% 150% at 50% 18%, rgba(38,10,54,0.24), rgba(8,4,13,0.19) 44%, rgba(3,1,7,0.42) 100%)',
  boxShadow: 'inset 38px 0 70px rgba(188,19,254,0.055), inset -38px 0 70px rgba(188,19,254,0.055), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -32px 62px rgba(0,0,0,0.36), 0 24px 66px rgba(0,0,0,0.5)',
  transform: 'translateZ(-100px)',
  transformOrigin: 'center bottom',
  transformStyle: 'preserve-3d',
  zIndex: 10,
  transition: 'border-color 220ms ease, box-shadow 220ms ease, filter 220ms ease, transform 260ms ease',
  backdropFilter: 'blur(4px)'
};
const questionPanelFocused = {
  transform: 'translateZ(-250px)',
  borderBottom: '1px solid rgba(232,156,255,0.92)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -10px 18px rgba(255,255,255,0.06), inset 0 -24px 52px rgba(188,19,254,0.32), inset 0 -54px 86px rgba(0,0,0,0.36), 0 0 24px rgba(188,19,254,0.2), 0 24px 62px rgba(0,0,0,0.62)',
  filter: 'brightness(1.08)'
};
const questionPanelLineBase = {
  position: 'absolute',
  pointerEvents: 'none',
  background: 'linear-gradient(90deg, rgba(212,175,55,0.12), rgba(255,255,255,0.08), rgba(212,175,55,0.12))',
  boxShadow: '0 0 12px rgba(212,175,55,0.06)',
  transition: 'background 180ms ease, box-shadow 180ms ease'
};
const questionPanelTopLine = {
  ...questionPanelLineBase,
  left: 0,
  right: 0,
  top: 0,
  height: '1px'
};
const questionPanelLeftLine = {
  ...questionPanelLineBase,
  left: 0,
  top: 0,
  bottom: '32px',
  width: '1px',
  background: 'linear-gradient(180deg, rgba(212,175,55,0.12), rgba(255,255,255,0.07), transparent)'
};
const questionPanelRightLine = {
  ...questionPanelLeftLine,
  left: 'auto',
  right: 0
};
const questionPanelLineFocused = {
  background: 'linear-gradient(180deg, rgba(188,19,254,0.42), rgba(212,175,55,0.16), transparent)',
  boxShadow: '0 0 14px rgba(188,19,254,0.24)'
};
const questionMasterCard = {
  position: 'absolute',
  left: 'clamp(18px, 7vw, 72px)',
  top: 'clamp(-98px, -7vw, -62px)',
  width: '178px',
  display: 'grid',
  justifyItems: 'center',
  gap: '4px',
  color: 'rgba(255,255,255,0.7)',
  fontSize: '0.72rem',
  letterSpacing: '2.2px',
  pointerEvents: 'none',
  zIndex: 12,
  transform: 'rotateY(34deg) rotateX(4deg)',
  transformOrigin: 'center center',
  transformStyle: 'preserve-3d',
  animation: 'questionMasterFloat 5.8s ease-in-out infinite',
  filter: 'drop-shadow(0 26px 34px rgba(0,0,0,0.52)) drop-shadow(0 0 20px rgba(188,19,254,0.18))'
};
const questionMasterImage = {
  width: '130px',
  height: '218px',
  objectFit: 'cover',
  borderRadius: '7px',
  border: '1px solid rgba(212,175,55,0.52)',
  boxShadow: 'inset 0 0 0 1px rgba(255,233,172,0.1), 0 18px 32px rgba(0,0,0,0.5), 0 0 24px rgba(188,19,254,0.24), 0 0 12px rgba(212,175,55,0.12)'
};
const questionMasterLabel = {
  marginTop: '8px',
  color: 'rgba(212,175,55,0.78)',
  fontSize: '0.82rem',
  letterSpacing: '0.28em',
  textShadow: '0 0 10px rgba(212,175,55,0.18)'
};
const questionMasterName = {
  position: 'relative',
  color: '#f6db9d',
  fontSize: '1.28rem',
  lineHeight: 1.1,
  letterSpacing: '0.2em',
  textShadow: '0 0 14px rgba(188,19,254,0.22)'
};
const questionBalanceColumn = {
  position: 'relative',
  gridArea: 'balance',
  zIndex: 3,
  width: '100%',
  minWidth: 0
};
const questionDeckColumn = {
  position: 'relative',
  gridArea: 'deck',
  zIndex: 12,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '18px',
  marginTop: '-79px',
  marginLeft: '-118px',
  width: '100%',
  minWidth: 0,
  transform: 'rotateY(-34deg) rotateX(4deg)',
  transformOrigin: 'center center',
  transformStyle: 'preserve-3d',
  animation: 'questionDeckFloat 6.2s ease-in-out infinite',
  filter: 'drop-shadow(0 26px 34px rgba(0,0,0,0.52)) drop-shadow(0 0 20px rgba(188,19,254,0.16))'
};
const questionGuideBookButton = {
  position: 'relative',
  right: 'auto',
  bottom: 'auto',
  width: '92px',
  height: '92px',
  filter: 'drop-shadow(0 0 20px rgba(188,19,254,0.46))'
};
const questionMagicCircleFloor = {
  position: 'absolute',
  left: '50%',
  bottom: '-200px',
  width: 'min(1320px, 116vw)',
  height: '336px',
  maxWidth: 'none',
  transform: 'translateX(-50%)',
  objectFit: 'contain',
  objectPosition: 'center bottom',
  opacity: 0.52, 
  filter: 'brightness(0.8) saturate(0.94)',
  pointerEvents: 'none',
  userSelect: 'none',
  zIndex: 0
};
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
  position: 'relative',
  zIndex: 14,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  minWidth: '190px',
  border: '1px solid rgba(212,175,55,0.45)',
  background: 'linear-gradient(180deg, rgba(18,10,28,0.86), rgba(8,4,13,0.9))',
  color: '#fff',
  padding: '13px 18px',
  borderRadius: '4px',
  cursor: 'pointer',
  letterSpacing: '2px',
  fontFamily: "'Cinzel', serif",
  transition: 'filter 160ms ease, transform 160ms ease, background 160ms ease, color 160ms ease'
};
const spreadCarouselStage = {
  position: 'relative',
  height: '435px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  perspective: '1500px',
  marginTop: '5px',
  overflow: 'visible'
};
const spreadMagicCircleFloor = {
  position: 'absolute',
  left: '50%',
  bottom: '-60px',
  width: 'min(1536px, 120vw)',
  height: '300px',
  maxWidth: 'none',
  transform: 'translateX(-50%)',
  objectFit: 'contain',
  objectPosition: 'center bottom',
  opacity: 0.85,
  filter: 'brightness(0.85) saturate(0.96)',
  pointerEvents: 'none',
  userSelect: 'none',
  zIndex: 0
};
const spreadCarousel = {
  position: 'relative',
  width: '248px',
  height: '386px',
  transformStyle: 'preserve-3d',
  transform: 'translateZ(0)',
  cursor: 'grab',
  zIndex: 3
};
const spreadCarouselCard = {
  position: 'absolute',
  top: '-4%',
  left:'-0.55%',
  display: 'grid',
  gridTemplateRows: 'auto minmax(116px, 1fr) auto auto',
  justifyItems: 'center',
  rowGap: '6px',
  alignItems: 'center',
  background: 'transparent',
  border: 'none',
  borderRadius: 22,
  color: '#fff',
  minHeight: '350px',
  padding: 0,
  textAlign: 'center',
  fontFamily: zhFont,
  boxShadow: 'none',
  overflow: 'visible',
  transformStyle: 'preserve-3d',
  boxSizing: 'border-box',
  cursor: 'pointer',
  backdropFilter: 'blur(2.2px)',
  transformOrigin: 'center center',
  zIndex:2
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
  bottom: '-20px',
  width: '70%',
  height: '140px',
  transform: 'translateX(-50%)',
  background: 'linear-gradient(to top, rgba(188,19,254,0.28), rgba(212,175,55,0.12) 42%, transparent 80%)',
  filter: 'blur(15px)',
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
  width: '100px',
  height: '100px',
  transform: 'translate(-50%, -50%)',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,255,255,0.18), rgba(212,175,55,0.16) 18%, rgba(188,19,254,0.18) 42%, transparent 68%)',
  filter: 'blur(8px)',
  pointerEvents: 'none',
  zIndex: 0
};
const carouselArrow = {
  position: 'absolute',
  top: 'calc(45% - 30px)',
  zIndex: 8,
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  border: '1px solid rgba(212,175,55,0.28)',
  background: 'linear-gradient(180deg, rgba(15,7,22,0.64), rgba(3,1,8,0.78))',
  color: 'rgba(212,175,55,0.82)',
  fontSize: '1.65rem',
  lineHeight: 1,
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  outline: 'none',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  textShadow: '0 0 10px rgba(212,175,55,0.24)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -7px 14px rgba(0,0,0,0.28), 0 0 10px rgba(212,175,55,0.1)',
  transition: 'color 160ms ease, filter 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease'
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
  marginTop: '25px',
  minHeight: '52px',
  zIndex: 5
};
const spreadNameText = {
  color: '#ffffff',
  fontFamily: "'Cinzel', serif",
  fontSize: '1rem',
  lineHeight: 1.3,
  letterSpacing: 0,
  whiteSpace: 'nowrap',
  textShadow: '0 0 12px rgba(255,255,255,0.2)'
};
const spreadZhText = {
  color: '#d4af37',
  fontFamily: zhFont,
  fontSize: '0.9rem',
  lineHeight: 1.25,
  fontStyle: 'normal',
  letterSpacing: '0.15em'
};
const spreadDescBlock = {
  width: '72%',
  minHeight: '66px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255,255,255,0.82)',
  fontSize: '0.85rem',
  lineHeight: 1.65,
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
  gap: '2px',
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
  justifyContent: 'center',
  gap: '7px',
  paddingTop: '4px',
  marginBottom: '12px',
  borderTop: '1px solid rgba(212,175,55,0.16)',
  color: 'rgba(255,255,255,0.64)',
  fontSize: '0.76rem',
  lineHeight: 1.5,
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
  position: 'relative',
  zIndex: 14,
  width: '100%',
  minHeight: '180px',
  boxSizing: 'border-box',
  resize: 'vertical',
  marginBottom: '22px',
  background: 'rgba(0,0,0,0.42)',
  color: '#fff',
  border: '1px solid rgba(212,175,55,0.075)',
  borderRadius: '6px',
  padding: '14px',
  outline: 'none',
  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.14)',
  fontSize: '1rem',
  fontFamily: zhFont,
  letterSpacing: '0.03em',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, background 180ms ease'
};
const questionInputFocused = {
  borderColor: 'rgba(188,19,254,0.28)',
  background: 'rgba(7,2,12,0.58)',
  boxShadow: 'inset 0 0 18px rgba(188,19,254,0.1), 0 0 14px rgba(188,19,254,0.12)'
};
const deckStack = { position: 'relative', width: '148px', height: '200px' };
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
const shuffleStage = {
  position: 'relative',
  zIndex: 2,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  background: 'radial-gradient(circle at 50% 50%, rgba(44,10,58,0.26), rgba(0,0,0,0.96) 54%, #000 100%)'
};
const shuffleMagicFloor = {
  position: 'absolute',
  left: '50%',
  bottom: '-72px',
  width: 'min(1320px, 116vw)',
  height: '342px',
  maxWidth: 'none',
  transform: 'translateX(-50%)',
  objectFit: 'contain',
  objectPosition: 'center bottom',
  opacity: 0.72,
  filter: 'brightness(0.92) saturate(0.96)',
  pointerEvents: 'none',
  userSelect: 'none',
  zIndex: 0
};
const shuffleSacredGlow = {
  position: 'absolute',
  left: '50%',
  bottom: '70px',
  width: '520px',
  height: '240px',
  transform: 'translateX(-50%)',
  borderRadius: '50%',
  background: 'radial-gradient(ellipse at center bottom, rgba(255,255,255,0.12), rgba(188,19,254,0.22) 24%, rgba(212,175,55,0.08) 44%, transparent 72%)',
  filter: 'blur(24px)',
  pointerEvents: 'none',
  zIndex: 1
};
const shuffleSurface = {
  position: 'absolute',
  inset: '-8% -8% -8%',
  perspective: '4000px',
  perspectiveOrigin: '50% 50%',
  transformStyle: 'preserve-3d',
  zIndex: 3,
  overflow: 'hidden'
};
const shuffleControl = {
  position: 'absolute',
  left: '50%',
  bottom: '28px',
  transform: 'translateX(-50%)',
  zIndex: 80,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  width: 'min(520px, 88vw)',
  padding: '15px 18px 18px',
  borderTop: '1px solid rgba(212,175,55,0.22)',
  background: 'linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.62))',
  backdropFilter: 'blur(2px)'
};
const portalText = { color: '#d4af37', letterSpacing: '5px', fontSize: '0.78rem' };
const shuffleHint = { maxWidth: '520px', margin: 0, color: 'rgba(255,255,255,0.72)', textAlign: 'center', fontFamily: zhFont, lineHeight: 1.6, fontSize: '0.9rem', letterSpacing: '0.08em' };
const resultStage = {
  position: 'relative',
  zIndex: 2,
  width: 'min(1280px, 96vw)',
  minHeight: '100%',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: '24px',
  paddingLeft: '180px',
  paddingBottom: '64px',
  boxSizing: 'border-box'
};
const resultHeader = { textAlign: 'center', marginTop: '8px' };
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
  background: active
    ? 'radial-gradient(circle, rgba(188,19,254,0.26), rgba(7,3,12,0.78))'
    : 'rgba(5,2,10,0.72)',
  color: active ? '#f3c5ff' : 'rgba(255,255,255,0.72)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  opacity: active ? 1 : 0.86,
  boxShadow: active
    ? '0 0 18px rgba(188,19,254,0.34), inset 0 0 14px rgba(188,19,254,0.16)'
    : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px rgba(212,175,55,0.08)',
  transition: 'filter 160ms ease, opacity 160ms ease, border-color 160ms ease, box-shadow 160ms ease'
});
const resultFavoriteHover = (active) => ({
  scale: 1.08,
  opacity: 1,
  borderColor: active ? 'rgba(244,197,255,0.9)' : 'rgba(188,19,254,0.66)',
  filter: 'brightness(1.14) drop-shadow(0 0 14px rgba(188,19,254,0.56))',
  boxShadow: active
    ? '0 0 24px rgba(188,19,254,0.48), inset 0 0 18px rgba(188,19,254,0.22)'
    : '0 0 20px rgba(188,19,254,0.3), inset 0 0 14px rgba(188,19,254,0.12)'
});
const relationshipSpread = { position: 'relative', flex: 1, width: 'min(760px, 92vw)', minHeight: '460px' };
const resultCardWrap = { width: '182px', textAlign: 'center', color: '#fff' };
const resultNumber = { color: '#d4af37', fontSize: '0.62rem', letterSpacing: '2px', marginBottom: '7px' };
const resultName = { color: '#fff', fontSize: '0.92rem', letterSpacing: '1.5px', lineHeight: 1.35 };
const resultSubtitle = { marginTop: '5px', color: 'rgba(212,175,55,0.72)', fontSize: '0.68rem', letterSpacing: '1px' };
const tarotResultActions = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '12px',
  marginTop: '28px',
  zIndex: 12
};
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

const resultMasterLabel = {
  color: 'rgba(255,255,255,0.74)',
  fontSize: '0.72rem',
  letterSpacing: '0.08em',
  lineHeight: 1.1
};

const resultMasterName = {
  color: '#f3d18a',
  fontSize: '0.96rem',
  letterSpacing: '0.04em',
  lineHeight: 1.1
};

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
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 26px rgba(0,0,0,0.34)',
  transition: 'filter 180ms ease, border-color 180ms ease, transform 180ms ease, background 180ms ease, color 180ms ease, box-shadow 180ms ease'
};
const tarotActionHover = {
  y: -3,
  scale: 1.045,
  borderColor: 'rgba(226,105,255,0.85)',
  background: 'linear-gradient(180deg, rgba(104,31,132,0.92), rgba(33,8,50,0.96))',
  color: '#fff',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -14px 28px rgba(188,19,254,0.22), 0 0 24px rgba(188,19,254,0.38), 0 0 0 1px rgba(212,175,55,0.24)',
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
  cursor: 'pointer',
  transition: 'background 160ms ease, color 160ms ease, transform 160ms ease'
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
  lineHeight: 2.1,
  whiteSpace: 'pre-wrap',
  backdropFilter: 'blur(6px)'
};
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
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(2,1,6,0.36)',
  backdropFilter: 'blur(8px) brightness(0.66)',
  WebkitBackdropFilter: 'blur(8px) brightness(0.66)',
};
const openBook = {
  position: 'relative',
  width: 'min(800px, 92vw)',
  maxHeight: '85vh',
  aspectRatio: '16 / 9.25',
  backgroundImage: 'url(/assets/tarot/mystery-content.png)',
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
  top: '8.4%',
  right: '10.2%',
  zIndex: 6,
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  border: '1px solid rgba(248,226,180,0.48)',
  background: 'rgba(39,21,45,0.72)',
  color: '#f7ddb8',
  fontSize: '1.2rem',
  lineHeight: 1,
  cursor: 'pointer',
  padding: 0,
  display: 'grid',
  placeItems: 'center',
  fontFamily: "'Cinzel', serif"
};
const bookLeftContent = {
  position: 'absolute',
  left: '14.8%',
  top: '14.4%',
  width: '33.8%',
  height: '69%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center'
};
const bookRightContent = {
  position: 'absolute',
  right: '13.2%',
  top: '16.2%',
  width: '32.6%',
  height: '68%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center'
};
const bookEyebrow = { marginTop: '2%', color: 'rgba(86,58,37,0.68)', fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.46rem, 0.7vw, 0.64rem)', letterSpacing: '0.44em', fontWeight: 500 };
const bookTitle = { margin: '4.2% 0 0', fontSize: 'clamp(1.25rem, 2.45vw, 2.18rem)', letterSpacing: '0.18em', color: '#2b2140', fontWeight: 700 };
const bookSubtitle = { marginTop: '0.6%', color: 'rgba(86,58,37,0.7)', fontFamily: "'Cinzel', serif", fontSize: 'clamp(0.5rem, 0.78vw, 0.72rem)', letterSpacing: '0.34em' };
const bookInvocation = {
  margin: '7% 0 0',
  color: '#2b2140',
  fontSize: 'clamp(0.66rem, 1.04vw, 0.9rem)',
  lineHeight: 1.82,
  fontWeight: 600,
  whiteSpace: 'pre-line'
};
const bookDivider = { width: '70%', height: '1px', margin: '4.8% 0 3.8%', background: 'linear-gradient(90deg, transparent, rgba(92,56,26,0.52), transparent)' };
const bookInstruction = {
  width: '78%',
  margin: 0,
  color: 'rgba(43,33,64,0.82)',
  fontSize: 'clamp(0.52rem, 0.76vw, 0.68rem)',
  lineHeight: 1.76,
  fontWeight: 600
};
const bookNote = {
  width: '70%',
  margin: '4.8% 0 0',
  color: 'rgba(43,33,64,0.86)',
  fontSize: 'clamp(0.6rem, 0.86vw, 0.76rem)',
  lineHeight: 1.72,
  fontWeight: 600
};
const bookSeal = {
  width: '44%',
  aspectRatio: '1',
  marginTop: '5.8%',
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  border: '1px solid rgba(92,56,26,0.28)',
  background: 'radial-gradient(circle, rgba(92,56,26,0.12), transparent 62%)',
  boxShadow: 'inset 0 0 22px rgba(92,56,26,0.12)'
};
const bookSealEye = {
  display: 'block',
  width: '58%',
  height: '32%',
  borderRadius: '50%',
  border: '2px solid rgba(92,56,26,0.34)',
  background: 'radial-gradient(circle at center, rgba(92,56,26,0.34) 0 12%, transparent 13% 100%)',
  fontSize: 0,
  transform: 'rotate(8deg)'
};
const bookCloseButton = {
  display: 'inline-flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '2px',
  minWidth: '162px',
  marginTop: 'auto',
  marginBottom: '10%',
  padding: '8px 13px 7px',
  borderRadius: '6px',
  border: '1px solid rgba(212,175,55,0.68)',
  background: 'linear-gradient(180deg, rgba(74,38,96,0.96), rgba(31,14,45,0.98))',
  color: '#f9e8c8',
  cursor: 'pointer',
  fontFamily: zhFont,
  fontSize: '0.68rem',
  letterSpacing: '0.14em',
  boxShadow: '0 10px 18px rgba(32,16,42,0.34), 0 0 0 1px rgba(36,20,12,0.38), inset 0 1px 0 rgba(255,239,188,0.16), inset 0 -9px 18px rgba(0,0,0,0.24)',
  transition: 'filter 140ms ease, transform 140ms ease'
};
const bookButtonHover = {
  filter: 'brightness(1.1) drop-shadow(0 0 16px rgba(212,175,55,0.26))',
  y: -2
};

const spreadImageWrap = {
  width: '250px',
  height: '140px',
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
  filter: 'drop-shadow(0 0 25px rgba(188,19,254,0.5))',
  pointerEvents: 'none'
};

const drawSystemCSS = `
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 420ms;
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  }

  ::view-transition-new(root) {
    mix-blend-mode: normal;
  }

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

  @keyframes questionMasterFloat {
    0%, 100% {
      transform: rotateY(34deg) rotateX(4deg) translateY(0);
    }

    50% {
      transform: rotateY(34deg) rotateX(4deg) translateY(-8px);
    }
  }

  @keyframes questionDeckFloat {
    0%, 100% {
      transform: rotateY(-34deg) rotateX(4deg) translateY(0);
    }

    50% {
      transform: rotateY(-34deg) rotateX(4deg) translateY(-7px);
    }
  }

  .tarot-drawing-copy strong {
    font-family: 'Cinzel', serif;
  }

  .tarot-prompt-menu button:hover {
    background: rgba(188,19,254,0.16) !important;
    color: #fff !important;
    transform: translateY(-1px);
  }

  .question-guide-button-caption {
    font-size: 0.58rem;
    letter-spacing: 0.18em;
  }

  .question-rite-panel:not(.focused):hover {
    transform: translateZ(-250px) !important;
  }

  .question-rite-panel > * {
    transform: translateZ(18px);
  }

  .question-rite-panel::before,
  .question-rite-panel::after {
    content: '';
    position: absolute;
    bottom: -386px;
    width: 2.5px;
    height: 410px;
    border: 0;
    border-radius: 999px;
    background:
      linear-gradient(
        to bottom,
        rgba(255,255,255,0.95) 0%,
        rgba(219,154,255,0.92) 9%,
        rgba(188,19,254,0.84) 42%,
        rgba(96,18,168,0.62) 72%,
        transparent 100%
      );
    display: none;
    opacity: 0;
    filter:
      drop-shadow(0 0 8px rgba(255,255,255,0.48))
      drop-shadow(0 0 20px rgba(188,19,254,0.86))
      drop-shadow(0 0 42px rgba(188,19,254,0.55));
    pointer-events: none;
    transform-origin: top center;
    transition:
      opacity 120ms ease,
      filter 180ms ease,
      transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
    z-index: -1;
  }

  .question-rite-panel::before {
    left: 3.8%;
    transform: rotateZ(9deg) rotateX(0deg) translateZ(-8px);
  }

  .question-rite-panel::after {
    right: 3.8%;
    transform: rotateZ(-9deg) rotateX(0deg) translateZ(-8px);
  }

  .question-rite-panel.focused::before,
  .question-rite-panel.focused::after {
    opacity: 0;
    filter:
      drop-shadow(0 0 10px rgba(255,255,255,0.72))
      drop-shadow(0 0 24px rgba(188,19,254,0.95))
      drop-shadow(0 0 56px rgba(188,19,254,0.72));
  }

  .question-rite-panel.focused::before {
    transform: rotateZ(9deg) rotateX(-4deg) translateZ(4px);
  }

  .question-rite-panel.focused::after {
    transform: rotateZ(-9deg) rotateX(-4deg) translateZ(4px);
  }

  .question-stage {
    position: absolute;
    left: 50%;
    bottom: -260px;
    width: min(1180px, 108vw);
    height: 540px;
    transform: translateX(-50%) rotateX(58deg);
    transform-origin: center bottom;
    transform-style: preserve-3d;
    pointer-events: none;
    user-select: none;
    z-index: 1;
    opacity: 0.78;
    filter: brightness(0.92) saturate(0.96);
    transition:
      opacity 260ms ease,
      transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
      filter 260ms ease;
  }

  .question-stage.active {
    opacity: 1;
    transform: translateX(-50%) rotateX(58deg);
    filter: drop-shadow(0 0 16px rgba(188,19,254,0.22));
  }

  .question-stage.active img {
    opacity: 0.96 !important;
    filter: brightness(1.08) saturate(1.02) !important;
  }

  .question-stage img {
    position: absolute !important;
    left: 50% !important;
    bottom: 34px !important;
    width: 100% !important;
    height: auto !important;
    max-width: none !important;
    transform: translateX(-50%) !important;
    object-fit: contain !important;
    opacity: 0.82 !important;
    filter: brightness(0.92) saturate(0.96) !important;
    z-index: 1 !important;
  }

  .question-stage::before {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 226px;
    width: 14%;
    height: 470px;
    transform: translateX(-50%) rotateX(-58deg) scaleY(0.82);
    transform-origin: center bottom;
    background:
      radial-gradient(ellipse at center bottom,
        rgba(255,255,255,0.48) 0%,
        rgba(188,19,254,0.42) 14%,
        rgba(188,19,254,0.16) 44%,
        transparent 78%);
    filter: blur(16px);
    opacity: 0;
    mix-blend-mode: screen;
    pointer-events: none;
    transition: opacity 220ms ease, transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 2;
  }

  .question-stage.active::before {
    opacity: 0.86;
    transform: translateX(-50%) rotateX(-58deg) translateY(-28px) scaleY(1.2);
  }

  .stage-back-arc,
  .stage-front-arc {
    position: absolute;
    left: 50%;
    width: 74%;
    height: 118px;
    transform: translateX(-50%);
    border-radius: 50%;
    border: 1px solid rgba(188,19,254,0.34);
    box-shadow:
      0 0 12px rgba(188,19,254,0.28),
      inset 0 0 18px rgba(212,175,55,0.08);
    pointer-events: none;
    z-index: 2;
  }

  .stage-back-arc {
    bottom: 258px;
    opacity: 0.16;
  }

  .stage-front-arc {
    bottom: 156px;
    opacity: 0.2;
    border-color: rgba(212,175,55,0.22);
  }

  .question-stage.active .stage-back-arc {
    opacity: 0.52;
  }

  .question-stage.active .stage-front-arc {
    opacity: 0.78;
  }

  .stage-fog {
    position: absolute;
    left: 50%;
    bottom: 112px;
    width: 86%;
    height: 190px;
    transform: translateX(-50%);
    border-radius: 50%;
    background:
      radial-gradient(ellipse at center,
        rgba(255,255,255,0.08) 0%,
        rgba(188,19,254,0.28) 24%,
        rgba(212,175,55,0.11) 44%,
        transparent 74%);
    filter: blur(28px);
    opacity: 0.42;
    mix-blend-mode: screen;
    pointer-events: none;
    z-index: 2;
  }

  .question-stage.active .stage-fog {
    opacity: 0.58;
    animation: stageFogBreath 3.2s ease-in-out infinite;
  }

  .stage-tethers {
    position: absolute;
    left: 50%;
    bottom: 198px;
    width: 64%;
    height: 390px;
    transform: translateX(-50%) rotateX(-58deg);
    transform-origin: center bottom;
    opacity: 0;
    pointer-events: none;
    overflow: visible;
    z-index: 4;
    transition: opacity 180ms ease, transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .stage-tether {
    fill: none;
    stroke: rgba(214,117,255,0.78);
    stroke-width: 0.42;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 3px rgba(188,19,254,0.78)) drop-shadow(0 0 8px rgba(188,19,254,0.42));
  }

  .stage-tether-center {
    stroke: rgba(255,236,255,0.84);
    stroke-width: 0.34;
  }

  .question-stage.active .stage-tethers {
    opacity: 0.92;
    transform: translateX(-50%) rotateX(-58deg) translateY(-16px);
  }

  .stage-beam {
    position: absolute;
    bottom: 250px;
    width: 150px;
    height: 800px;
    transform-origin: bottom center;
    display: none;
    opacity: 0;
    pointer-events: none;
    z-index: 3;
    background:
      linear-gradient(
        to top,
        transparent 0%,
        rgba(188,19,254,0.34) 16%,
        rgba(255,255,255,0.18) 48%,
        rgba(188,19,254,0.08) 72%,
        transparent 100%
      );
    filter: blur(13px) drop-shadow(0 0 18px rgba(188,19,254,0.42));
    transition:
      opacity 260ms ease,
      transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .stage-beam::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -18px;
    right: -18px;
    background: inherit;
    filter: blur(16px);
    opacity: 0.42;
  }

  .stage-beam::after {
    content: none;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    transform: translateX(-50%);
    background: linear-gradient(
      to top,
      transparent,
      rgba(255,255,255,0.72) 34%,
      rgba(255,226,160,0.62) 62%,
      transparent
    );
    box-shadow:
      0 0 8px rgba(255,255,255,0.38),
      0 0 18px rgba(188,19,254,0.42);
  }

  .stage-beam-left {
    left: 49.2%;
    transform: translateX(-50%) rotate(-30deg) rotateX(-58deg) scaleY(0.86);
  }

  .stage-beam-right {
    right: auto;
    left: 50.8%;
    transform: translateX(-50%) rotate(30deg) rotateX(-58deg) scaleY(0.86);
  }

  .question-stage.active .stage-beam {
    opacity: 0.52;
  }

  .question-stage.active .stage-beam-left {
    transform: translateX(-50%) rotate(-30deg) rotateX(-58deg) translateY(-16px) scaleY(1.16);
  }

  .question-stage.active .stage-beam-right {
    transform: translateX(-50%) rotate(30deg) rotateX(-58deg) translateY(-16px) scaleY(1.16);
  }

  @keyframes stageFogBreath {
    0%, 100% {
      filter: blur(14px) saturate(1.08) brightness(0.95);
    }

    50% {
      filter: blur(16px) saturate(1.22) brightness(1.14);
    }
  }

  @keyframes panelCornerPulse {
    0%, 100% {
      transform: translateY(5px) scale(0.92);
      filter: blur(7px) brightness(0.94);
    }

    50% {
      transform: translateY(0) scale(1.05);
      filter: blur(6px) brightness(1.18);
    }
  }

  @media (max-width: 780px) {
    .question-rite-layout {
      grid-template-columns: minmax(0, 1fr) !important;
      grid-template-areas:
        "panel"
        "deck" !important;
      width: 94vw !important;
      gap: 14px !important;
      transform: translateY(0) !important;
    }

    .question-rite-panel {
      grid-area: panel !important;
      transform: rotateX(4deg) translateZ(0) !important;
    }

    .question-rite-panel:not(.focused):hover {
      transform: translateZ(-250px) !important;
    }

    .question-rite-panel::before,
    .question-rite-panel::after {
      height: 320px !important;
      bottom: -304px !important;
    }

    .question-balance-column {
      display: none !important;
    }

    .question-master-card {
      left: 0 !important;
      top: -150px !important;
      width: 128px !important;
      transform: rotateY(18deg) rotateX(4deg) scale(0.72) !important;
      transform-origin: left top !important;
    }

    .question-deck-column {
      grid-area: deck !important;
      justify-self: center !important;
      transform: scale(0.74);
      transform-origin: center top;
    }

    .question-stage {
      width: 132vw !important;
      bottom: -284px !important;
      height: 420px !important;
      transform: translateX(-50%) rotateX(76deg) translateZ(-50px) !important;
    }

    .stage-beam {
      display: none !important;
    }

    .spread-selection-stage {
      height: 398px !important;
      max-width: 100vw !important;
    }

    .spread-magic-floor {
      width: 150vw !important;
      height: 290px !important;
      bottom: -52px !important;
      opacity: 0.42 !important;
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
 
