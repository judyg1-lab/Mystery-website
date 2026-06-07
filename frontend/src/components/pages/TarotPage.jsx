import React, { useState, useEffect, useRef, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { Search, History, Sparkles, Download, Heart } from 'lucide-react';
import { useNavigate,useLocation} from 'react-router-dom';
import { Pencil, ChevronLeft, Trash2 } from 'lucide-react';
import ProfileIcon from '../ProfileIcon';
import BackBtn from '../backBtn';
import MysticModal from '../MysticModal';
import TarotDrawingSystem, { TarotPortalParticles } from './TarotDrawingSystem';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const TAROT_CARD_BACK_URL = `${API_BASE_URL}/tarot/tarot-card.png`;

const getAssetUrl = (path = '') => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};

const TAROT_NAME_ALIASES = {
  magician: 'the magus',
  'the magician': 'the magus',
  'high priestess': 'the priestess',
  'the high priestess': 'the priestess'
};

const normalizeTarotName = (value = '') => {
  const normalized = value
    .toLowerCase()
    .replace(/^no\.?\s*/i, '')
    .replace(/^[ivx0-9ace]+(?:\s*[-–—]\s*)/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return TAROT_NAME_ALIASES[normalized] || normalized;
};

const COLORS = {
  gold: '#d4af37',
  accentBlue: '#4fb8d6',
  textGray: '#b0b0b0',
  border: 'rgba(255, 255, 255, 0.2)'
};

const renameModalLabel = {
  display: 'grid',
  gap: '10px',
  color: 'rgba(255,255,255,0.72)',
  fontSize: '0.86rem',
  letterSpacing: '0.12em'
};

const renameModalInput = {
  width: '100%',
  boxSizing: 'border-box',
  height: 42,
  borderRadius: 6,
  border: '1px solid rgba(188,19,254,0.42)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  padding: '0 12px',
  outline: 'none',
  fontFamily: "'Noto Serif TC', serif",
  letterSpacing: '0.06em'
};

class StarDust {
  constructor(canvasWidth) {
    this.canvasWidth = canvasWidth;
    this.reset();
  }
  reset() {
    this.x = (Math.random() - 0.5) * this.canvasWidth * 2;
    this.y = (Math.random() - 0.5) * this.canvasWidth * 2;
    this.z = Math.random() * this.canvasWidth;
    this.size = Math.random() * 0.8 + 0.3;
    this.color = Math.random() > 0.4 ? '#ffffff' : '#bc13fe';
    this.velocity = 0.15 + Math.random() * 0.35; //random speed for each star to create depth effect
  }
  update() {
    this.z -= this.velocity;
    if (this.z <= 0) this.reset();
  }
  draw(ctx, canvas) {
    const k = 128 / this.z;
    const px = this.x * k + canvas.width / 2;
    const py = this.y * k + canvas.height / 2;
    const opacity = (1 - this.z / canvas.width);

    if (px < 0 || px > canvas.width || py < 0 || py > canvas.height) return;

    ctx.beginPath();
    ctx.arc(px, py, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = opacity * 0.8;
    ctx.fill();
  }
}

const UniverseCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const particleCount = 1000;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    for (let i = 0; i < particleCount; i++) particles.push(new StarDust(canvas.width));  //add particles to the end of the array to prevent initial burst of stars in the center

    const render = () => {
      ctx.fillStyle = '#050208';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(ctx, canvas); });
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', resize);
    resize();
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={canvasStyle} />;
};

const cleanTarotText = (text = '') => text.replace(/-{5,}/g, '').replace(/[【】]/g, '').trim();

const formatTarotMeaningLines = (text = '') => {
  const cleaned = cleanTarotText(text)
    .replace(/\s*✦\s*/g, '\n✦ ')
    .trim();
  return cleaned
    .split(/\n+/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
};

const getCodexIntro = (content = '') => {
  const firstCardIndex = content.indexOf('No.');
  if (firstCardIndex === -1) return '';
  return cleanTarotText(content.slice(0, firstCardIndex));
};

const parseTarotCardEntries = (content = '') => {
  const firstCardIndex = content.indexOf('No.');
  if (firstCardIndex === -1) return [];

  return content
    .slice(firstCardIndex)
    .split('No.')
    .filter(Boolean)
    .map(chunk => cleanTarotText(chunk))
    .filter(Boolean)
    .map((chunk, index) => {
      const titleEnd = chunk.search(/[。.\n]/);
      const rawTitle = titleEnd > -1 ? chunk.slice(0, titleEnd).trim() : chunk.slice(0, 48).trim();
      const titleMatch = rawTitle.match(/^(.+?)\s+[-–—]\s+(.+)$/);
      const title = titleMatch ? titleMatch[2].trim() : rawTitle;
      const meaning = titleEnd > -1 ? chunk.slice(titleEnd + 1).trim() : chunk;
      return {
        no: titleMatch ? titleMatch[1].trim() : String(index + 1),
        name: title || `Card ${index + 1}`,
        lookupName: normalizeTarotName(title),
        orbit: 'THOTH ARCANA',
        meaning: cleanTarotText(meaning)
      };
    })
};

const splitReadableText = (content = '') =>
  content
    .replace(/-{5,}/g, '\n')
    .split(/\n+|(?<=。)\s+/)
    .map(text => text.trim())
    .filter(Boolean);

const parseTarotHistoryContent = (content = '') => {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.type === 'tarot_reading' && Array.isArray(parsed.cards)) return parsed;
  } catch {
    return null;
  }
  return null;
};

const formatArchiveTitle = (title = '') => title.replace(/([:：])\s*/, '$1\n');

const TarotCardVisual = ({ item, entry }) => (
  <div style={tarotCardShell}>
    <div style={tarotImageFrame}>
      <img
        src={entry?.card?.imageUrl ? getAssetUrl(entry.card.imageUrl) : TAROT_CARD_BACK_URL}
        alt={entry?.card?.title || entry?.name || ''}
        style={tarotCardImage}
        onError={(event) => {
          event.currentTarget.src = TAROT_CARD_BACK_URL;
        }}
      />
    </div>
    <div style={tarotCardCaption}>
      <div style={tarotCardTop}>THOTH</div>
      <div style={tarotCardMeta}>{entry?.orbit || item?.category || 'MYSTIC CODEX'}</div>
    </div>
  </div>
);

const TarotHistoryReport = ({ record, reading, cards, onCardOpen }) => {
  const spreadName = reading?.spread?.name || record?.title || 'Tarot Reading';
  const dateText = record?.date || '';
  const soulMaster = reading?.soulMaster || '未記錄主牌';
  const question = reading?.question || record?.title || '未填寫';
  const displayedCards = cards.length ? cards : [];

  return (
    <article style={tarotHistoryReport}>
      <div style={tarotHistoryFrameGlow} />
      <header style={tarotHistoryHeader}>
        <div>
          <div style={tarotHistoryKicker}>REPORT - {dateText}</div>
          <h1 style={tarotHistoryTitle}>{spreadName}</h1>
          <div style={tarotHistoryMetaRow}>
            <span>主牌：{soulMaster}</span>
            <span>問題：{question}</span>
          </div>
        </div>
        <Heart size={26} color="#d4af37" style={tarotHistoryHeart} />
      </header>

      <div style={tarotHistoryGrid}>
        <section style={tarotHistorySpreadPanel}>
          <div style={tarotHistorySectionTitle}><span />THE SPREAD<span /></div>
          <div style={tarotHistoryCardRow}>
            {displayedCards.map((card, index) => {
              const imageUrl = card.imageUrl || card.card?.imageUrl || '';
              return (
                <button
                  key={`${card.position}-${card.name}-${index}`}
                  type="button"
                  style={tarotHistoryCardButton}
                  onClick={() => onCardOpen?.({
                    name: card.name,
                    card: card.card,
                    meaning: card.meaning,
                    orbit: card.subtitle || `POSITION ${card.position}`
                  })}
                >
                  <span style={tarotHistoryPositionBadge}>{card.position || index + 1}</span>
                  <img
                    src={imageUrl ? getAssetUrl(imageUrl) : TAROT_CARD_BACK_URL}
                    alt={card.name}
                    style={tarotHistoryCardImage}
                    onError={(event) => {
                      event.currentTarget.src = TAROT_CARD_BACK_URL;
                    }}
                  />
                  <strong>{card.name}</strong>
                  <small>{card.subtitle || `Position ${card.position || index + 1}`}</small>
                </button>
              );
            })}
          </div>
          <div style={tarotHistoryOracle}>
            <b>FINAL ORACLE</b>
            <p>{question}</p>
          </div>
        </section>

        <section style={tarotHistoryAnalysisPanel}>
          <div style={tarotHistorySectionTitle}><span />CARD ANALYSIS<span /></div>
          {displayedCards.map((card, index) => (
            <div key={`${card.name}-analysis-${index}`} style={tarotHistoryAnalysisItem}>
              <img
                src={(card.imageUrl || card.card?.imageUrl) ? getAssetUrl(card.imageUrl || card.card?.imageUrl) : TAROT_CARD_BACK_URL}
                alt={card.name}
                style={tarotHistoryAnalysisImage}
                onError={(event) => {
                  event.currentTarget.src = TAROT_CARD_BACK_URL;
                }}
              />
              <div>
                <div style={tarotHistoryAnalysisTitle}>
                  <span>{card.position || index + 1}</span>
                  <h3>{card.name}</h3>
                </div>
                {card.subtitle && <b style={tarotHistoryAnalysisSubtitle}>{card.subtitle}</b>}
                <p>{card.meaning || '這張牌保留直覺解讀空間，請依照當下問題與主牌脈絡延伸。'}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </article>
  );
};

const TarotCardDetailOverlay = ({ entry, onClose }) => {
  const title = entry?.card?.title || entry?.name || 'THOTH ARCANA';
  const imageUrl = entry?.card?.imageUrl ? getAssetUrl(entry.card.imageUrl) : TAROT_CARD_BACK_URL;
  const meaningLines = formatTarotMeaningLines(entry?.meaning);

  return (
    <AnimatePresence>
      {entry && <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={tarotDetailOverlay}
        onClick={onClose}
      >
        <motion.article
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={tarotDetailPanel}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            style={tarotDetailClose}
            onClick={onClose}
            aria-label="Close tarot card detail"
          >
            ×
          </button>
          <div style={tarotDetailImageStage}>
            <img
              src={imageUrl}
              alt={title}
              style={tarotDetailImage}
              onError={(event) => {
                event.currentTarget.src = TAROT_CARD_BACK_URL;
              }}
            />
          </div>
          <div style={tarotDetailMeaningScroll}>
            {meaningLines.length > 0 ? meaningLines.map((line, index) => (
              <p key={index} style={tarotDetailMeaningLine}>{line}</p>
            )) : (
              <p style={tarotDetailMeaningLine}>這張牌的秘典說明尚未載入。</p>
            )}
          </div>
        </motion.article>
      </motion.div>}
    </AnimatePresence>
  );
};


export default function TarotPage() {
  const navigate = useNavigate();
   // we use location to read the state passed from ProfilePage when user clicks on a favorite item, so that we can know which tab to open and which article to highlight when we first load the TarotPage
  const location = useLocation();
  const isDrawingRoute = location.pathname === '/tarot/drawing';
  const [activeTab, setActiveTab] = useState('origins');
  const [drawingView, setDrawingView] = useState('home');
  const [drawingBackHandler, setDrawingBackHandler] = useState(null);
  const [isShuffleImmersive, setIsShuffleImmersive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasHandledProfileJump = useRef(false);

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedTarotEntry, setSelectedTarotEntry] = useState(null);
  const [username, setUsername] = useState('AGENT GUEST');

  const [articles, setArticles] = useState([]);      // 摮敺??澈?靘??祕?? (韏瑟?????
  const [tarotCards, setTarotCards] = useState([]);
  //if activeTab is 'drawing', we don't need to fetch articles, just return early. Otherwise, we fetch real articles from the database based on the active tab
  useEffect(() => {
    if (activeTab !== 'origins' && activeTab !== 'codex') return;
    setArticles([]);
    const fetchRealArticles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tarot/articles?tabType=${activeTab}`);
        const data = await res.json();
        if (res.ok) {setArticles(Array.isArray(data) ? data : []);}
      } catch (err) {
        console.error("隤輸瑼?摨怠???", err);
      }
    };
    fetchRealArticles(); //first define the function to fetch articles, then call it immediately
  }, [activeTab]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.username) setUsername(parsed.username);
      } catch (err) {
        console.error('閫??雿輻??閮仃??', err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchTarotCards = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tarot/cards`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) setTarotCards(data);
      } catch (err) {
        console.error('Failed to load tarot card images:', err);
      }
    };

    fetchTarotCards();
  }, []);

  useEffect(() => {
    if (isDrawingRoute) {
      setActiveTab('drawing');
      setDrawingView('active_draw');
      setSearchQuery('');
      setSelectedItemId(null);
      setSelectedType(null);
      setSelectedTarotEntry(null);
      return;
    }

    setDrawingView((view) => view === 'active_draw' ? 'home' : view);
  }, [isDrawingRoute]);

  const handleTopBack = useCallback(() => {
    if ((isDrawingRoute || activeTab === 'drawing') && drawingBackHandler?.()) return;
    navigate(-1);
  }, [activeTab, drawingBackHandler, isDrawingRoute, navigate]);

  useEffect(() => {
    if (hasHandledProfileJump.current) return;

    const targetTab = location.state?.targetTab;
    const targetHistoryId = location.state?.targetHistoryId;

    if (targetTab || targetHistoryId) {
      hasHandledProfileJump.current = true;
      const nextTab = targetHistoryId ? 'history' : targetTab;

      if (nextTab !== activeTab) {
        setActiveTab(nextTab);
        setDrawingView('home');
        setSearchQuery('');
        setSelectedItemId(null);
        setSelectedType(null);
        setSelectedTarotEntry(null);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const targetId = location.state?.targetId;
    const targetTitle = location.state?.targetTitle;

    if ((!targetId && !targetTitle) || articles.length === 0) return;

    const matched = articles.find(article =>
      article.id === Number(targetId) ||
      (targetTitle && article.title === targetTitle)
    );

    if (matched) {
      setSelectedItemId(matched.id);
      setSelectedType('article');
      setSelectedTarotEntry(null);
    }
  }, [location.state, articles, activeTab]);

  const [dbFavorites, setDbFavorites] = useState([]);  // 摮雿輻??鞈?摨恍???敹?蝝??
  const fetchUserFavorites = useCallback(async () => {
    try {
      const token = localStorage.getItem('mystic_token');
      const res = await fetch(`${API_BASE_URL}/api/user/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDbFavorites(data);
    } catch (err) {
      console.error("?郊?嗉?憭望?:", err);
    }
  }, []);
  useEffect(() => {
    fetchUserFavorites();
  }, [fetchUserFavorites]);

  const [historyLogs, setHistoryLogs] = useState([]); // 摮雿輻???餅??甇瑕蝝??
  const fetchHistoryLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem('mystic_token');
      const res = await fetch(`${API_BASE_URL}/api/history/tarot`,
        {headers: {Authorization: `Bearer ${token}`}}
      );
      const data = await res.json();
      if (res.ok) {setHistoryLogs(data);}
    } catch (err) {
      console.error("霈?風?脣仃??", err);
    }
  }, []);
  useEffect(() => {
    fetchHistoryLogs();
  }, [fetchHistoryLogs]);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false, title: '', message: '', confirmText: '確認', cancelText: '取消', type: 'info', mode: null, onConfirm: () => {}
  });
  const [renameDraft, setRenameDraft] = useState('');

  const closeMysticModal = useCallback(() => {
    setModalConfig(prev => ({ ...prev, isOpen: false, mode: null }));
  }, []);

  // we take the real articles from the database, and for each article we check if its ID exists in the user's favorites (dbFavorites) to determine if it should be marked as isFavorite: true or false.
  // This way, when we render the list of articles, we can show which ones are already favorited by the user.
  const processedArticles = articles.map(item => ({
    ...item,isFavorite: dbFavorites.some(f => f.articleId == item.id)
    // we use == here to allow comparison between string and number IDs, since sometimes the articleId in favorites might be a string while item.id is a number (depending on how the backend returns it)
  }));

  // according to the search query, we filter the processedArticles to only include items whose title or content includes the search query (case-insensitive)
  const filteredData = processedArticles.filter(item =>
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.content || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleHeartClick = async (e, item) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem("mystic_token");
    if (!token) { console.error('handleHeartClick: no mystic_token'); return; }

    if (item.isFavorite) {
      const targetFav = dbFavorites.find(fav => fav.articleId == item.id);
      if (!targetFav) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/favorites/${targetFav.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setDbFavorites(prev => prev.filter(fav => fav.id !== targetFav.id));
          await fetchUserFavorites();
        } else {
          console.error('Failed to delete favorite:', res.status);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({articleId: item.id})
        });
        const data = await res.json();
        if (res.ok && data.favorite) {
          const newFavNode = {
            ...data.favorite,
            articleId: Number(data.favorite.articleId)
          };
          setDbFavorites(prev => [...prev, newFavNode]);
          await fetchUserFavorites();
        } else {
          console.error('Failed to create favorite:', data);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const processedHistoryLogs = historyLogs.filter((log) => {
    const title = log.title || '';
    const content = log.content || '';
    const looksLikeCodexArticle =
      /秘典|克勞利|托特之書|THOTH ARCHIVE|No\.\d|The Fool|The Magus/.test(title) ||
      /本秘典|每一張主牌|星軌對應|啟示義理|No\.\d/.test(content);
    return !looksLikeCodexArticle;
  });

  const filteredHistoryLogs = processedHistoryLogs.filter(log =>
    (log.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.content || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedArticle = processedArticles.find(item => item.id === selectedItemId);
  const selectedHistory = processedHistoryLogs.find(log => log.id === selectedItemId);
  const selectedItem = selectedType === 'article'
    ? (selectedArticle ? { ...selectedArticle } : null)
    : (selectedHistory ? { ...selectedHistory } : null);
  const tarotCardEntries = selectedItem ? parseTarotCardEntries(selectedItem.content) : [];
  const tarotCardByName = useMemo(() => {
    const map = new Map();
    tarotCards.forEach((card) => {
      map.set(normalizeTarotName(card.title), card);
      map.set(normalizeTarotName(card.slug), card);
    });
    return map;
  }, [tarotCards]);
  const hydratedTarotCardEntries = useMemo(
    () => tarotCardEntries.map((entry) => ({
      ...entry,
      card: tarotCardByName.get(entry.lookupName) || tarotCardByName.get(normalizeTarotName(entry.name)) || null
    })),
    [tarotCardEntries, tarotCardByName]
  );
  const selectedTarotHistory = useMemo(
    () => selectedType === 'history' ? parseTarotHistoryContent(selectedHistory?.content) : null,
    [selectedHistory?.content, selectedType]
  );
  const selectedTarotHistoryCards = useMemo(
    () => (selectedTarotHistory?.cards || []).map((card) => ({
      ...card,
      card: tarotCardByName.get(normalizeTarotName(card.slug)) || tarotCardByName.get(normalizeTarotName(card.name)) || null
    })),
    [selectedTarotHistory, tarotCardByName]
  );
  const showArchiveHeroCard = activeTab === 'origins';
  const readableParagraphs = selectedItem ? splitReadableText(selectedItem.content) : [];
  const codexIntro = selectedItem ? getCodexIntro(selectedItem.content) : '';

  useEffect(() => {
    if (activeTab === 'drawing') {
      setSelectedItemId(null);
      setSelectedType(null);
      setSelectedTarotEntry(null);
      return;
    }

    if (activeTab === 'history') {
      const targetHistoryId = Number(location.state?.targetHistoryId);
      const targetHistory = processedHistoryLogs.find(log => log.id === targetHistoryId);
      if (targetHistory && selectedItemId !== targetHistory.id) {
        setSelectedItemId(targetHistory.id);
        setSelectedType('history');
        setSelectedTarotEntry(null);
        return;
      }

      const selectedExistsInHistory =
        selectedType === 'history' &&
        processedHistoryLogs.some(log => log.id === selectedItemId);

      if (!selectedExistsInHistory && processedHistoryLogs.length > 0) {
        setSelectedItemId(processedHistoryLogs[0].id);
        setSelectedType('history');
        setSelectedTarotEntry(null);
      }
      return;
    }
    const selectedExistsInCurrentTab =
      selectedType === 'article' &&
      processedArticles.some(item => item.id === selectedItemId);

    if (!selectedExistsInCurrentTab && processedArticles.length > 0) {
      setSelectedItemId(processedArticles[0].id);
      setSelectedType('article');
      setSelectedTarotEntry(null);
    }
  }, [activeTab, processedArticles, processedHistoryLogs, selectedItemId, selectedType, location.state]);

  const handleHistoryHeartClick = async (e, rec) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem("mystic_token");

    if (rec.isFavorite) {
      if (!rec.favoriteId) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/favorites/${rec.favoriteId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setHistoryLogs(prev => prev.map(log => log.id === rec.id ? { ...log, isFavorite: false, favoriteId: null } : log));
          await fetchUserFavorites();
        }
      } catch (err) { console.error(err); }
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ historyId: rec.id })
        });
        const data = await res.json();
        if (res.ok && data.favorite) {
          setDbFavorites(prev => [...prev, data.favorite]);
          setHistoryLogs(prev => prev.map(log => log.id === rec.id ? {
            ...log,
            isFavorite: true,
            favoriteId: data.favorite.id
          } : log));
          await fetchUserFavorites();
        }
      } catch (err) { console.error("甇瑕???嗉?憭望?:", err); }
    }
  };

  const executeRenameHistory = async (rec) => {
    const token = localStorage.getItem("mystic_token");
    if (!token) return;

    const nextTitle = renameDraft.trim();
    if (!nextTitle || nextTitle === rec.title) {
      closeMysticModal();
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/history/tarot/${rec.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: nextTitle.trim() })
      });
      const data = await res.json();
      if (res.ok && data.history) {
        setHistoryLogs(prev => prev.map(log => log.id === rec.id ? data.history : log));
        closeMysticModal();
      } else {
        setModalConfig({
          isOpen: true,
          title: '重新命名失敗',
          message: data.error || '目前無法更新這筆塔羅紀錄名稱。',
          confirmText: '我知道了',
          cancelText: '',
          type: 'error',
          mode: null,
          onConfirm: closeMysticModal
        });
      }
    } catch (err) {
      console.error('Rename tarot history failed:', err);
    }
  };

  const handleRenameHistory = (e, rec) => {
    if (e) e.stopPropagation();
    setRenameDraft(rec.title || '');
    setModalConfig({
      isOpen: true,
      title: '重新命名塔羅紀錄',
      message: '',
      confirmText: '儲存',
      cancelText: '取消',
      type: 'info',
      mode: 'rename',
      onConfirm: () => executeRenameHistory(rec)
    });
  };

  const executeDeleteHistory = async (rec) => {
    const token = localStorage.getItem("mystic_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/history/tarot/${rec.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHistoryLogs(prev => prev.filter(log => log.id !== rec.id));
        if (selectedItemId === rec.id) {
          setSelectedItemId(null);
          setSelectedType(null);
        }
        await fetchUserFavorites();
        closeMysticModal();
      } else {
        const data = await res.json();
        setModalConfig({
          isOpen: true,
          title: '刪除失敗',
          message: data.error || '目前無法刪除這筆塔羅紀錄。',
          confirmText: '我知道了',
          cancelText: '',
          type: 'error',
          mode: null,
          onConfirm: closeMysticModal
        });
      }
    } catch (err) {
      console.error('Delete tarot history failed:', err);
    }
  };

  const handleDeleteHistory = (e, rec) => {
    if (e) e.stopPropagation();
    setModalConfig({
      isOpen: true,
      title: '刪除塔羅紀錄',
      message: `確定要刪除「${rec.title || '未命名紀錄'}」這筆塔羅紀錄嗎？`,
      confirmText: '刪除',
      cancelText: '取消',
      type: 'danger',
      mode: null,
      onConfirm: () => executeDeleteHistory(rec)
    });
  };


  return (
    <div style={mainLayout}>
      <style>{hideScrollbarCSS}</style>
      <UniverseCanvas />
      <MysticModal
        isOpen={modalConfig.isOpen}
        onClose={closeMysticModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        type={modalConfig.type}
      >
        {modalConfig.mode === 'rename' && (
          <label style={renameModalLabel}>
            <span>新的紀錄名稱</span>
            <input
              value={renameDraft}
              onChange={(event) => setRenameDraft(event.target.value)}
              style={renameModalInput}
              autoFocus
            />
          </label>
        )}
      </MysticModal>
      <TarotCardDetailOverlay
        entry={selectedTarotEntry}
        onClose={() => setSelectedTarotEntry(null)}
      />

      <nav style={{ ...topNavBar, display: isShuffleImmersive ? 'none' : 'flex' }}>
        <div style={{ display:'flex', alignItems:'center',gap:'25px'}}>
            <BackBtn onClick={handleTopBack} />
            <div style={navBrandStyle} onClick={() => navigate('/maindashboard')}>MYSTIC ARCHIVE</div></div>
        <div style={navTabsContainer}>
          {['origins', 'codex', 'drawing', 'history'].map((tab) => (
            <button
              key={tab}
              style={activeTab === tab ? activeTabBtn : tabBtn}
              onClick={() => { 
                                if (isDrawingRoute) navigate('/tarot');
                                setActiveTab(tab);
                                setDrawingView('home');
                                setSearchQuery('');
                                setSelectedItemId(null);
                                setSelectedType(null);
                                setSelectedTarotEntry(null);
                                setIsShuffleImmersive(false);
                      }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {e.currentTarget.style.color = '#bc13fe';
                                        e.currentTarget.style.textShadow = '0 0 8px rgba(188,19,254,0.6)';
                                        e.currentTarget.style.transform ='translateY(-1px)';}}}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {e.currentTarget.style.color = '#777';
                                        e.currentTarget.style.textShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0px)';}}}
            >
                {tab === 'origins' ? <div><div>ORIGINS</div><div style={subLabel}>塔羅起源</div></div>
                : tab === 'codex' ? <div><div>CODEX</div><div style={subLabel}>塔羅秘典</div></div>
                : tab === 'drawing' ? <div><div>DRAWING</div><div style={subLabel}>即時占卜</div></div>
                : <div><div>HISTORY</div><div style={subLabel}>塔羅歷史</div></div>}
              {activeTab === tab && <motion.div layoutId="navLine" style={activeUnderline} />}
            </button>
          ))}</div>
        <div
          onClick={() => navigate('/profile')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.filter = 'drop-shadow(0 0 10px rgba(188,19,254,0.5))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'none';
          }}
          style={{
            width: '200px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transform: 'scale(1)',
            transformOrigin: 'right center',
            transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1), filter 260ms ease',
            filter: 'none'
          }}
        >
          <div style={{ textAlign: 'right', lineHeight: '1.2', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '0.75rem', color: '#bc13fe', letterSpacing: '3px', fontFamily: 'Cinzel', fontWeight: 'bold' }}>ONLINE</div>
            <div style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '1px' }}>{username}</div>
          </div>
          <ProfileIcon color={'#bc13fe'} />
        </div>
      </nav>

      {/* 銝餉??批捆???*/}
      <main style={isShuffleImmersive ? immersiveContentArea : contentArea}>
        {(activeTab === 'origins' || activeTab === 'codex') && (
          <div style={flexLayout}>
            <div style={sidebarWrapper}>
              <div style={searchBox}>
                <Search size={16} color="#bc13fe" />
                <input placeholder="搜尋..." style={searchInput} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div style={sidebarList}>
                {filteredData.length === 0 && (
                  <div style={emptyHint}>尚無可顯示的塔羅檔案</div>
                )}
                {filteredData.map(item => (
                  <div
                      key={`${activeTab}-${item.id}`}
                      onClick={() => { setSelectedItemId(item.id); setSelectedType('article'); setSelectedTarotEntry(null); }} style={selectedItem?.id === item.id ? activeItem : itemStyle}
                      onMouseEnter={(e)=>{
                        if(selectedItem?.id !== item.id){
                          e.currentTarget.style.background ='rgba(188,19,254,0.08)';
                          e.currentTarget.style.border ='1px solid rgba(188,19,254,0.2)';
                          e.currentTarget.style.boxShadow = '0 0 8px rgba(188,19,254,0.08)';}
                        }}
                      onMouseLeave={(e)=>{
                        if(selectedItem?.id !== item.id){
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.border ='1px solid transparent';
                          e.currentTarget.style.boxShadow = 'none';}
                        }}
                  >
                    <div style={{ flex: 1, cursor: 'pointer' }}>
                        <div style={itemContent}>
                          <span style={catTag}>{item.category}</span>
                          <div style={itemTitle}>{item.title}</div>
                        </div>
                      </div>
                    <motion.div
                      whileHover={{ scale: 1.15, filter: 'drop-shadow(0 0 8px #bc13fe)' }}
                      whileTap={{ scale: 0.9 }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleHeartClick(e, item)}
                      style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <Heart
                        size={18}
                        fill={item.isFavorite ? '#bc13fe' : 'transparent'}
                        color={item.isFavorite ? '#bc13fe' : '#666'}
                        style={{ transition: '0.2s' }}
                      />
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>

            <section style={detailWrapper}>
              <AnimatePresence mode="wait">
                {selectedItem ? (
                  <motion.div key={selectedItem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={detailPanel}>
                    <div style={showArchiveHeroCard ? archiveHeroLayout : archiveHeroTextOnly}>
                      {showArchiveHeroCard && (
                        <div style={archiveCardColumn}>
                          <img src="/assets/tarot/spread-frame.png" alt="" style={archiveSpreadFrameImage} />
                          <TarotCardVisual item={selectedItem} entry={hydratedTarotCardEntries[0]} />
                          <div style={archiveCardInfo}>
                            <div style={archiveCardCategory}>{selectedItem.category}</div>
                          </div>
                        </div>
                      )}

                      <div style={showArchiveHeroCard ? archiveHeaderBlock : archiveHeaderBlockTextOnly}>
                        <div style={metaRow}>
                          <span style={categoryPill}>{selectedItem.category}</span>
                          <span style={sectionLabel}>{activeTab.toUpperCase()}</span>
                        </div>

                        <h2 style={goldLabel}>THOTH ARCHIVE</h2>
                        <h1 style={archiveTitle}>{formatArchiveTitle(selectedItem.title)}</h1>

                        <div style={ornamentDivider}>
                          <span style={ornamentLine} />
                          <i style={ornamentStar}>✦</i>
                          <span style={ornamentLine} />
                        </div>

                        <p style={archiveLead}>{codexIntro || selectedItem.detail}</p>
                      </div>
                    </div>

                    {hydratedTarotCardEntries.length > 0 ? (
                      <>
                        <div style={cardCodexGrid}>
                          {hydratedTarotCardEntries.map((card, index) => (
                            <div
                              key={`${card.no}-${index}`}
                              onClick={() => setSelectedTarotEntry(card)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(188,19,254,0.12)';
                                e.currentTarget.style.borderColor = 'rgba(188,19,254,0.45)';
                                e.currentTarget.style.boxShadow = '0 0 18px rgba(188,19,254,0.18)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
                                e.currentTarget.style.borderColor = 'rgba(188,19,254,0.16)';
                                e.currentTarget.style.boxShadow = 'inset 0 0 18px rgba(188,19,254,0.035)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                              style={tarotEntryCard}
                            >
                              <div style={entryImageFrame}>
                                <img
                                  src={card.card?.imageUrl ? getAssetUrl(card.card.imageUrl) : TAROT_CARD_BACK_URL}
                                  alt={card.card?.title || card.name}
                                  style={entryImage}
                                  onError={(event) => {
                                    event.currentTarget.src = TAROT_CARD_BACK_URL;
                                  }}
                                />
                              </div>
                              <div style={entryNumber}>No.{card.no}</div>
                              <h3 style={entryTitle}>{card.card?.title || card.name}</h3>
                              <div style={entryOrbit}>{card.orbit}</div>
                              <div style={entryMeaning}>
                                {formatTarotMeaningLines(card.meaning).map((line, lineIndex) => (
                                  <span key={lineIndex} style={entryMeaningLine}>{line}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={archiveBodyPanel}>
                        {readableParagraphs.map((paragraph, index) => (
                          <p key={index} style={index === 0 ? archiveFirstParagraph : archiveParagraph}>
                            {index === 0 ? (
                              <>
                                <span style={dropCap}>{paragraph.charAt(0)}</span>
                                {paragraph.slice(1)}
                              </>
                            ) : (
                              paragraph
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : <div style={emptyHint}>請選擇一篇塔羅文獻</div>}
              </AnimatePresence>
            </section>
          </div>
        )}

        {/* --- 蝺??賜?雿???朣?--- */}
        {activeTab === 'drawing' && (
          <TarotDrawingSystem
            cardBackUrl={TAROT_CARD_BACK_URL}
            onBackHandlerChange={setDrawingBackHandler}
            onImmersiveChange={setIsShuffleImmersive}
            onHistoryCreated={(history) => {
              if (history) {
                setHistoryLogs(prev => [history, ...prev.filter(log => log.id !== history.id)]);
              }
              fetchHistoryLogs();
            }}
          />
)}

        {activeTab === 'history' && (
            <div style={flexLayout}>

              {/* 撌血 Sidebar */}
              <div style={sidebarWrapper}>
                <div style={sidebarHeader}>HISTORY LOG</div>
                <div style={searchBox}>
                  <Search size={16} color="#bc13fe" />
                  <input
                    placeholder="搜尋..."
                    style={searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div style={sidebarList}>
                  {filteredHistoryLogs.map((rec) => (
                    <div key={rec.id || rec.title}
                        onClick={() => { setSelectedItemId(rec.id); setSelectedType('history'); setSelectedTarotEntry(null); }}
                        style={ selectedItem?.id === rec.id ? activeItem: itemStyle}
                        onMouseEnter={(e)=>{if(selectedItem?.id !== rec.id){
                                        e.currentTarget.style.background ='rgba(188,19,254,0.08)';
                                        e.currentTarget.style.border ='1px solid rgba(188,19,254,0.2)';}}}
                        onMouseLeave={(e)=>{if(selectedItem?.id !== rec.id){
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.border ='1px solid transparent';}}}
                    >
                      <div onClick={() => { setSelectedItemId(rec.id); setSelectedType('history'); setSelectedTarotEntry(null); }} style={{ flex: 1, cursor: 'pointer' }}>
                        <div style={itemContent}>
                          <span style={catTag}>{rec.date}</span>
                          <div style={itemTitle}>{rec.title}</div>
                        </div>
                      </div>
                      <Pencil
                            size={16}
                            color="#666"
                            style={{ cursor:'pointer', transition:'0.3s', fill: 'none', stroke: '#666'}}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => handleRenameHistory(e, rec)}
                            onMouseEnter={(e)=>{e.currentTarget.style.fill ='#a2003e';
                                                e.currentTarget.style.stroke ='#a2003e';
                                                e.currentTarget.style.filter='drop-shadow(0 0 10px #a2003e)';}}
                            onMouseLeave={(e)=>{e.currentTarget.style.fill ='none';
                                                e.currentTarget.style.stroke ='#666';
                                                e.currentTarget.style.filter='none';}}/> {/*drop-shadow(x y blur color)*/}
                      <motion.div
                        whileHover={{ scale: 1.15, filter: 'drop-shadow(0 0 8px #ff4d6d)' }}
                        whileTap={{ scale: 0.9 }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => handleDeleteHistory(e, rec)}
                        style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={17} color="#666" style={{ transition: '0.2s' }} />
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.15, filter: 'drop-shadow(0 0 8px #bc13fe)' }}
                        whileTap={{ scale: 0.9 }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => handleHistoryHeartClick(e, rec)}
                        style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                      <Heart
                        size={18}
                        fill={rec.isFavorite ? '#bc13fe' : 'transparent'}
                        color={rec.isFavorite ? '#bc13fe' : '#666'}
                        style={{ transition: '0.2s' }}
                      />
        </motion.div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ?喳?批捆? */}
              <section style={detailWrapper}>
                <AnimatePresence mode="wait">
                  {selectedItem ? (
                    <motion.div key={selectedItem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {selectedType === 'history' && selectedTarotHistory ? (
                        <TarotHistoryReport
                          record={selectedItem}
                          reading={selectedTarotHistory}
                          cards={selectedTarotHistoryCards}
                          onCardOpen={setSelectedTarotEntry}
                        />
                      ) : (
                        <>
                          <h2 style={goldLabel}>REPORT - {selectedItem.date}</h2>
                          <h1 style={mainTitle}>{selectedItem.title}</h1>
                          <div style={divider} />
                          <p style={detailText}>{selectedItem.content}</p>
                          <button style={invokeGateBtn}>
                            <Download size={16}/>
                            匯出結果
                          </button>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <div style={emptyHint}>
                      請點選一筆塔羅歷史紀錄
                    </div>
                  )}
                </AnimatePresence>
              </section>
            </div>
        )}
      </main>
    </div>
  );
}

// ================= Styles =================

const mainLayout = { width: '100%',height:'100vh', background: '#050208', color: '#fff', position: 'relative', overflow: 'hidden', overscrollBehavior: 'none', fontFamily: 'Cinzel, serif' };
const canvasStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 };

const topNavBar = {
  boxSizing: 'border-box',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px', padding: '0 38px',
  position: 'fixed', top: 0, width: '100%', zIndex: 100, borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(1px)'
};
const navBrandStyle = { color: '#d4af37', letterSpacing: '4px', fontSize: '1rem',minWidth: '250px', cursor: 'pointer',whiteSpace: 'nowrap', flexShrink: 0 };
const navTabsContainer = { display: 'flex', gap: '50px', justifyContent: 'center', flex: 1, alignItems: 'center' };
const tabBtn = { background: 'none', border: 'none', outline: 'none',WebkitTapHighlightColor: 'transparent',color: '#777', cursor: 'pointer', fontFamily: 'Cinzel', fontSize: '1rem', letterSpacing: '3px', position: 'relative',transition:'0.3s' };
const activeTabBtn = { ...tabBtn, color: '#fff' };
const activeUnderline = { position: 'absolute', bottom: -8, left: 0, right: 0, height: '2px', background: '#bc13fe', boxShadow: '0 0 10px #bc13fe' };
const subLabel = {fontSize: '0.7rem',color: '#666',letterSpacing: '2px',marginTop: '4px'};

const contentArea = { paddingTop: '80px', height: '100vh', width: '100%', position: 'relative', zIndex: 2, overflow: 'hidden', boxSizing: 'border-box' };
const immersiveContentArea = { height: '100vh', width: '100%', position: 'relative', zIndex: 2, overflow: 'hidden', boxSizing: 'border-box' };
const flexLayout = { display: 'flex',  height: 'calc(100vh - 118px)', padding: '16px 40px 0', gap: '25px', alignItems: 'stretch' };

const sidebarWrapper = {
  width: '320px', flexShrink: 0, background: 'rgba(0, 0, 0, 0.38)', borderRadius: '8px',
  padding: '20px', border: '1px solid rgba(188,19,254,0.14)', backdropFilter: 'blur(3px)',
  display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', minHeight: 0
};

const detailWrapper = {
  flex: 1, height: '100%', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.22)',
  borderRadius: '8px', padding: '0px 50px', border: '1px solid rgba(188,19,254,0.14)',
  backdropFilter: 'blur(1px)', boxShadow: 'inset 0 0 28px rgba(188,19,254,0.08)'
};
const tarotHistoryReport = {
  position: 'relative',
  minHeight: 'calc(100vh - 170px)',
  padding: '30px 34px',
  border: '1px solid rgba(212,175,55,0.24)',
  borderRadius: '8px',
  background: [
    'radial-gradient(circle at 28% 42%, rgba(188,19,254,0.12), transparent 34%)',
    'radial-gradient(circle at 78% 24%, rgba(212,175,55,0.1), transparent 28%)',
    'rgba(4,1,8,0.58)'
  ].join(', '),
  boxShadow: 'inset 0 0 44px rgba(212,175,55,0.05), 0 0 30px rgba(188,19,254,0.12)',
  overflow: 'hidden'
};
const tarotHistoryFrameGlow = {
  position: 'absolute',
  inset: '14px',
  border: '1px solid rgba(212,175,55,0.12)',
  borderRadius: '6px',
  pointerEvents: 'none',
  boxShadow: 'inset 0 0 30px rgba(188,19,254,0.08)'
};
const tarotHistoryHeader = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  justifyContent: 'space-between',
  gap: '28px',
  alignItems: 'flex-start',
  padding: '0 8px 24px',
  borderBottom: '1px solid rgba(212,175,55,0.16)'
};
const tarotHistoryKicker = {
  color: '#d4af37',
  letterSpacing: '0.42em',
  fontSize: '0.72rem',
  marginBottom: '12px'
};
const tarotHistoryTitle = {
  margin: 0,
  color: '#f5ead8',
  fontFamily: 'Cinzel, serif',
  fontSize: 'clamp(2rem, 3.2vw, 3.8rem)',
  letterSpacing: '0.12em',
  lineHeight: 1
};
const tarotHistoryMetaRow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '14px 28px',
  marginTop: '18px',
  color: 'rgba(255,255,255,0.72)',
  fontFamily: "'Noto Serif TC', serif",
  fontSize: '0.94rem',
  letterSpacing: '0.06em'
};
const tarotHistoryHeart = {
  flex: '0 0 auto',
  padding: '10px',
  border: '1px solid rgba(212,175,55,0.34)',
  borderRadius: '50%',
  filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.34))'
};
const tarotHistoryGrid = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.05fr) minmax(360px, 0.9fr)',
  gap: '30px',
  paddingTop: '28px'
};
const tarotHistorySpreadPanel = {
  minWidth: 0,
  display: 'grid',
  alignContent: 'start',
  gap: '24px',
  paddingRight: '4px'
};
const tarotHistorySectionTitle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: '12px',
  color: '#d4af37',
  letterSpacing: '0.32em',
  fontSize: '0.78rem',
  textAlign: 'center'
};
const tarotHistoryCardRow = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '24px'
};
const tarotHistoryCardButton = {
  position: 'relative',
  width: '146px',
  display: 'grid',
  justifyItems: 'center',
  gap: '7px',
  padding: 0,
  border: 0,
  background: 'transparent',
  color: '#d4af37',
  cursor: 'pointer',
  fontFamily: 'Cinzel, serif',
  textAlign: 'center'
};
const tarotHistoryPositionBadge = {
  position: 'absolute',
  top: '-12px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '30px',
  height: '30px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: '50%',
  border: '1px solid rgba(212,175,55,0.5)',
  background: 'rgba(7,3,10,0.94)',
  color: '#d4af37',
  zIndex: 2
};
const tarotHistoryCardImage = {
  width: '136px',
  height: '228px',
  objectFit: 'cover',
  borderRadius: '7px',
  border: '1px solid rgba(212,175,55,0.46)',
  boxShadow: '0 0 22px rgba(212,175,55,0.16), 0 0 30px rgba(188,19,254,0.14)'
};
const tarotHistoryOracle = {
  margin: '8px auto 0',
  width: 'min(640px, 100%)',
  padding: '18px 24px',
  border: '1px solid rgba(212,175,55,0.24)',
  borderRadius: '8px',
  background: 'rgba(0,0,0,0.24)',
  color: '#f5d889',
  textAlign: 'center',
  fontFamily: "'Noto Serif TC', serif",
  letterSpacing: '0.08em',
  lineHeight: 1.8
};
const tarotHistoryAnalysisPanel = {
  minWidth: 0,
  display: 'grid',
  alignContent: 'start',
  gap: '18px',
  paddingLeft: '26px',
  borderLeft: '1px solid rgba(212,175,55,0.16)'
};
const tarotHistoryAnalysisItem = {
  display: 'grid',
  gridTemplateColumns: '76px minmax(0, 1fr)',
  gap: '16px',
  alignItems: 'start',
  paddingBottom: '16px',
  borderBottom: '1px solid rgba(212,175,55,0.13)',
  color: 'rgba(255,255,255,0.78)',
  fontFamily: "'Noto Serif TC', serif",
  lineHeight: 1.75
};
const tarotHistoryAnalysisImage = {
  width: '74px',
  height: '124px',
  objectFit: 'cover',
  borderRadius: '5px',
  border: '1px solid rgba(212,175,55,0.36)'
};
const tarotHistoryAnalysisTitle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: '#f5ead8',
  letterSpacing: '0.12em'
};
const tarotHistoryAnalysisSubtitle = {
  display: 'block',
  color: '#bc13fe',
  margin: '6px 0 4px',
  letterSpacing: '0.08em'
};

const searchBox = { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.05)', padding: '12px 18px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px' };
const searchInput = { background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem', width: '100%' };
const sidebarList = { display: 'flex', flexDirection: 'column', overflowY: 'auto',flex: 1,  minHeight: 0};
const itemTitle = { color: '#888', marginTop: '6px', fontSize: '0.95rem' };
const itemStyle = { display: 'flex',gap: '12px', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',border: '1px solid transparent',background: 'transparent',boxShadow: 'none' };
const itemContent = {flex: 1,display: 'flex',flexDirection: 'column',gap: '6px'};
const activeItem = { ...itemStyle, background: 'rgba(90, 20, 120, 0.18)', border: '1px solid rgba(188,19,254,0.18)', boxShadow: `
    inset 0 0 12px rgba(188,19,254,0.08),0 0 8px rgba(188,19,254,0.08)`,transition: '0.3s' };
const gatewayCenterContainer = { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%',height: 'calc(100vh - 120px)',textAlign: 'center', overflow: 'hidden'};
const gatewayPortal = { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', opacity: 0.9 };
const gatewayDisc = { position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.13), rgba(188,19,254,0.05) 48%, transparent 70%)', boxShadow: '0 0 60px rgba(212,175,55,0.12)' };
const gatewayRing = { position: 'absolute', borderRadius: '50%', border: '1px solid rgba(212,175,55,0.22)', boxShadow: 'inset 0 0 24px rgba(212,175,55,0.04)' };
const gatewayStar = { position: 'absolute', width: '3px', height: '3px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px rgba(255,255,255,0.7)', opacity: 0.72 };

const thothLogo = { position: 'relative', zIndex: 1, fontSize: '10rem', color: '#bc13fe', opacity: 0.2, letterSpacing: '35px', fontWeight: '800' };
const gatewayTitle = { position: 'relative', zIndex: 1, fontSize: '2.4rem', letterSpacing: '8px', marginTop: '-80px', marginBottom: '60px', textAlign: 'center', textShadow: '0 0 15px rgba(188, 19, 254, 0.4)' };
const btnGroup = { position: 'relative', zIndex: 1, display: 'flex', gap: '30px', alignItems: 'center' };

const invokeGlassBtn = { padding: '16px 40px', borderRadius: '2px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(255, 255, 255, 0.4)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Cinzel', fontSize: '0.8rem', letterSpacing: '2px', transition: 'filter 160ms ease, transform 160ms ease, box-shadow 160ms ease' };
const invokeGateBtn = { ...invokeGlassBtn, background: '#fff', color: '#000', border: 'none', fontWeight: 'bold', boxShadow: '0 0 25px rgba(255, 255, 255, 0.15)' };

const catTag = { fontSize: '0.75rem', color: '#bc13fe', letterSpacing: '2px', fontWeight: 'bold' };
const goldLabel = { color: '#d4af37', letterSpacing: '6px', fontSize: '0.7rem', marginBottom: '15px', fontFamily: 'Cinzel' };
const mainTitle = {
  fontFamily: '"Noto Serif TC", "Songti TC", "PMingLiU", "Cinzel", serif',
  fontSize: 'clamp(1.5rem, 3vw, 3.5rem)',
  fontWeight: 400,
  letterSpacing: '2px',
  margin: 0,
  lineHeight: 1.18,
  color: 'rgba(245,238,222,0.92)'
};
const divider = { width: '60px', height: '2px', background: '#bc13fe', margin: '24px 0' };
const detailPanel = { maxWidth: '1120px', margin: '0 auto', paddingBottom: '48px' };
const articleHeroGrid = { display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '42px', alignItems: 'center', marginBottom: '34px' };
const articleHeroTextOnly = { display: 'block', maxWidth: '880px', marginBottom: '34px' };
const articleHeaderBlock = { minWidth: 0 };
const metaRow = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' };
const categoryPill = { color: '#fff', background: 'rgba(188,19,254,0.16)', border: '1px solid rgba(188,19,254,0.35)', borderRadius: '4px', padding: '7px 10px', fontSize: '0.68rem', letterSpacing: '2px' };
const sectionLabel = { color: '#777', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '7px 10px', fontSize: '0.68rem', letterSpacing: '2px' };
const detailLead = { fontSize: '1rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.68)', margin: 0, fontFamily: 'Inter, sans-serif', maxWidth: '720px' };
const tarotCardShell = { width: '100%', maxWidth: '150px', position: 'relative', zIndex: 2 };
const tarotImageFrame = { aspectRatio: '2 / 3', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.28)', boxShadow: '0 0 28px rgba(188,19,254,0.24), inset 0 0 24px rgba(255,255,255,0.08)', background: '#09040d' };
const tarotCardImage = { width: '100%', height: '100%', display: 'block', objectFit: 'cover' };
const tarotCardCaption = { paddingTop: '14px', textAlign: 'center' };
const tarotCardTop = { color: '#d4af37', fontSize: '0.68rem', letterSpacing: '5px', marginBottom: '8px' };
const tarotCardName = { color: '#fff', fontSize: '0.88rem', letterSpacing: '2px', lineHeight: 1.4 };
const tarotCardMeta = { color: 'rgba(255,255,255,0.42)', fontSize: '0.68rem', letterSpacing: '1px', lineHeight: 1.5, marginTop: '6px' };
const cardCodexGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' };
const tarotEntryCard = { background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(188,19,254,0.16)', borderRadius: '8px', padding: '16px', boxShadow: 'inset 0 0 18px rgba(188,19,254,0.035)', cursor: 'pointer', transition: 'background 220ms ease, border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease' };
const entryImageFrame = { width: '100%', aspectRatio: '2 / 3', maxHeight: '220px', marginBottom: '14px', borderRadius: '7px', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)', background: '#08040d', boxShadow: '0 12px 28px rgba(0,0,0,0.38), inset 0 0 18px rgba(188,19,254,0.08)' };
const entryImage = { width: '100%', height: '100%', display: 'block', objectFit: 'contain', objectPosition: 'center' };
const entryNumber = { color: '#bc13fe', fontSize: '0.72rem', letterSpacing: '2px', marginBottom: '8px', fontWeight: 'bold' };
const entryTitle = { color: '#fff', fontSize: '1.05rem', letterSpacing: '1.5px', margin: '0 0 8px 0', lineHeight: 1.35 };
const entryOrbit = { color: '#d4af37', fontSize: '0.76rem', letterSpacing: '1px', marginBottom: '12px', lineHeight: 1.5 };
const entryMeaning = { color: 'rgba(255,255,255,0.72)', fontFamily: 'Inter, sans-serif', fontSize: '0.92rem', lineHeight: 1.75, margin: 0, display: 'grid', gap: '6px' };
const entryMeaningLine = { display: 'block' };
const tarotDetailOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  display: 'grid',
  placeItems: 'center',
  padding: '24px',
  background: 'radial-gradient(circle at 50% 44%, rgba(188,19,254,0.16), rgba(5,2,8,0.82) 42%, rgba(5,2,8,0.94))',
  backdropFilter: 'blur(10px)'
};
const tarotDetailPanel = {
  position: 'relative',
  width: 'min(720px, 92vw)',
  maxHeight: 'min(900px, 92vh)',
  overflow: 'visible',
  borderRadius: 0,
  padding: '10px 0 0',
  border: 'none',
  background: 'transparent',
  boxShadow: 'none'
};
const tarotDetailClose = {
  position: 'absolute',
  right: 'clamp(4px, 5vw, 64px)',
  top: '2px',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: '1px solid rgba(212,175,55,0.34)',
  background: 'rgba(24,8,32,0.86)',
  color: '#f4d27c',
  cursor: 'pointer',
  fontSize: '1.35rem',
  lineHeight: 1,
  boxShadow: '0 0 20px rgba(188,19,254,0.18)'
};
const tarotDetailImageStage = {
  display: 'grid',
  placeItems: 'center',
  margin: '0 auto 18px',
  padding: 0,
  background: 'transparent'
};
const tarotDetailImage = {
  width: 'clamp(300px, 30vw, 430px)',
  height: 'auto',
  maxHeight: 'min(620px, 66vh)',
  objectFit: 'contain',
  display: 'block',
  border: 'none',
  background: 'transparent',
  boxShadow: 'none',
  filter: 'drop-shadow(0 24px 46px rgba(0,0,0,0.58))'
};
const tarotDetailMeaningScroll = {
  width: 'min(680px, 90vw)',
  maxHeight: 'min(240px, 26vh)',
  overflowY: 'auto',
  margin: '0 auto',
  padding: '18px 22px',
  border: 'none',
  borderRadius: '8px',
  background: 'linear-gradient(180deg, rgba(5,2,8,0.62), rgba(5,2,8,0.42))',
  boxShadow: '0 18px 42px rgba(0,0,0,0.34), inset 0 0 22px rgba(188,19,254,0.055)'
};
const tarotDetailMeaningLine = {
  margin: '0 0 12px',
  color: 'rgba(255,255,255,0.78)',
  fontFamily: 'Inter, sans-serif',
  fontSize: '1rem',
  lineHeight: 1.9,
  letterSpacing: '0.6px',
  textAlign: 'center'
};
const paragraphPanel = { display: 'grid', gap: '14px', maxWidth: '820px' };
const detailText = { fontSize: '1rem', lineHeight: '1.9', color: 'rgba(255, 255, 255, 0.78)', margin: 0, fontFamily: 'Inter, sans-serif' };
// eslint-disable-next-line no-unused-vars
const backBtnStyle = { marginTop:'auto', paddingTop: '20px',background: 'none', border: 'none', color: '#bc13fe', cursor: 'pointer', textAlign: 'left', fontFamily: 'Cinzel', fontSize: '0.7rem' };
const sidebarHeader = { padding: '0 10px 20px', fontFamily: 'Cinzel', letterSpacing: '4px', color: '#d4af37', fontSize: '0.8rem' };
const emptyHint = { textAlign: 'center', marginTop: '180px', color: '#333', letterSpacing: '5px' };

const archiveHeroLayout = {
  display: 'grid',
  gridTemplateColumns: '250px minmax(0, 1fr)',
  gap: '50px',
  alignItems: 'center',
  marginBottom: '25px',
  padding: '16px 6px 0px',
  borderBottom: '1px solid rgba(212,175,55,0.16)'
};

const archiveHeroTextOnly = {
  display: 'flex',
  alignItems: 'center',
  minHeight: '310px',
  maxWidth: '980px',
  margin: '0 auto 34px',
  padding: '50px 20px 40px',
  borderBottom: '1px solid rgba(212,175,55,0.16)',
  boxSizing: 'border-box'
};

const archiveCardColumn = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  padding: '18px 22px 30px',
  border: 'none',
  background: 'transparent',
  boxShadow: 'none',
  overflow: 'visible'
};

const archiveSpreadFrameImage = {
  position: 'absolute',
  inset: '-22px -34px -24px',
  width: 'calc(100% + 68px)',
  height: 'calc(100% + 46px)',
  objectFit: 'fill',
  pointerEvents: 'none',
  opacity: 0.62,
  zIndex: 0,
  filter: 'drop-shadow(0 0 18px rgba(188,19,254,0.22)) drop-shadow(0 0 10px rgba(212,175,55,0.18))'
};

const archiveCardInfo = {
  marginTop: '14px',
  textAlign: 'center',
  letterSpacing: '3px',
  lineHeight: 1.5,
  position: 'relative',
  zIndex: 2
};

const archiveCardKicker = {
  color: 'rgba(212,175,55,0.72)',
  fontSize: '0.68rem',
  letterSpacing: '5px',
  marginBottom: '4px'
};

const archiveCardCategory = {
  color: '#bc13fe',
  fontSize: '0.78rem',
  letterSpacing: '3px',
  marginBottom: '18px'
};

const archiveCardArchive = {
  color: 'rgba(212,175,55,0.75)',
  fontSize: '0.68rem',
  letterSpacing: '5px'
};

const archiveCardArchiveName = {
  color: '#d4af37',
  fontSize: '0.72rem',
  letterSpacing: '4px',
  marginTop: '4px'
};

const archiveHeaderBlock = {
  minWidth: 0,
  maxWidth: '760px',
  alignSelf: 'center'
};

const archiveHeaderBlockTextOnly = {
  ...archiveHeaderBlock,
  maxWidth: '900px',
  width: '100%',
  padding: '0 4px'
};

const archiveTitle = {
  fontFamily: '"Noto Serif TC", "Songti TC", "PMingLiU", "Cinzel", serif',
  fontSize: 'clamp(1.85rem, 2.85vw, 2.95rem)',
  fontWeight: 400,
  lineHeight: 1.18,
  letterSpacing: '2px',
  margin: '14px 0 0',
  maxWidth: '920px',
  color: 'rgba(245,238,222,0.92)',
  textShadow: '0 0 18px rgba(188,19,254,0.10)',
  whiteSpace: 'pre-line'
};

const ornamentDivider = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  maxWidth: '520px',
  margin: '22px 0 20px',
  color: '#bc13fe'
};

ornamentDivider.span = {};

const archiveLead = {
  fontFamily: '"Noto Serif TC", "Microsoft JhengHei", serif',
  fontSize: '1rem',
  lineHeight: 1.9,
  letterSpacing: '0.8px',
  color: 'rgba(255,255,255,0.72)',
  maxWidth: '760px',
  margin: 0
};

const archiveBodyPanel = {
  marginTop: '32px',
  padding: '28px 34px',
  borderTop: '1px solid rgba(212,175,55,0.18)',
  borderBottom: '1px solid rgba(212,175,55,0.12)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(188,19,254,0.025))',
  boxShadow: 'inset 0 0 28px rgba(188,19,254,0.035)'
};

const archiveParagraph = {
  fontFamily: '"Noto Serif TC", "Microsoft JhengHei", serif',
  fontSize: '1.05rem',
  lineHeight: 2.05,
  letterSpacing: '0.8px',
  color: 'rgba(255,255,255,0.76)',
  margin: '0 0 18px'
};

const archiveFirstParagraph = {
  ...archiveParagraph,
  fontSize: '1.08rem',
  color: 'rgba(255,255,255,0.82)'
};

const dropCap = {
  float: 'left',
  fontFamily: '"Noto Serif TC", "Cinzel", serif',
  fontSize: '3.2rem',
  lineHeight: '0.9',
  padding: '8px 14px 4px 0',
  color: '#d4af37',
  textShadow: '0 0 16px rgba(188,19,254,0.35)'
};

const ornamentLine = {
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(188,19,254,0.8), rgba(212,175,55,0.35))'
};

const ornamentStar = {
  fontStyle: 'normal',
  color: '#bc13fe',
  textShadow: '0 0 12px rgba(188,19,254,0.75)',
  fontSize: '0.9rem'
};

const hideScrollbarCSS =
  `/* WebKit browsers (Chrome, Edge, Safari) */
  *::-webkit-scrollbar { width: 6px; height: 6px; }
  *::-webkit-scrollbar-track { background: rgba(5, 2, 8, 0.5); }
  *::-webkit-scrollbar-thumb { background: rgba(188, 19, 254, 0.3); border-radius: 4px; }
  *::-webkit-scrollbar-thumb:hover { background: rgba(188, 19, 254, 0.6); box-shadow: 0 0 10px #bc13fe; }

  /* Firefox */
  * { scrollbar-width: thin; scrollbar-color: rgba(188, 19, 254, 0.3) rgba(5, 2, 8, 0.5); }

  /* Keep MS/IE from forcing hidden scrollbars (only when needed) */
  html, body { -ms-overflow-style: auto; }
`;
