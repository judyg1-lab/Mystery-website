import React, { useState, useEffect, useRef, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { Search, History, Sparkles, Download, Heart } from 'lucide-react';
import { useNavigate,useLocation} from 'react-router-dom';
import { Pencil,ChevronLeft } from 'lucide-react';
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
      const titleMatch = rawTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/);
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
      <div style={tarotCardName}>{entry?.name || item?.title || 'ARCANA'}</div>
      <div style={tarotCardMeta}>{entry?.orbit || item?.category || 'MYSTIC CODEX'}</div>
    </div>
  </div>
);

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
    const fetchRealArticles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tarot/articles?tabType=${activeTab}`);
        const data = await res.json();
        if (res.ok) {setArticles(data);}
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
    if (isDrawingRoute && drawingBackHandler?.()) return;
    navigate(-1);
  }, [drawingBackHandler, isDrawingRoute, navigate]);

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
    isOpen: false, title: '', message: '', confirmText: '蝣箄?', cancelText: '??', type: 'info', onConfirm: () => {}
  });

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


  return (
    <div style={mainLayout}>
      <style>{hideScrollbarCSS}</style>
      <UniverseCanvas />
      <MysticModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        type={modalConfig.type}
      />
      <TarotCardDetailOverlay
        entry={selectedTarotEntry}
        onClose={() => setSelectedTarotEntry(null)}
      />

      <nav style={topNavBar}>
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
      <main style={contentArea}>
        {(activeTab === 'origins' || activeTab === 'codex') && (
          <div style={flexLayout}>
            <div style={sidebarWrapper}>
              <div style={searchBox}>
                <Search size={16} color="#bc13fe" />
                <input placeholder="搜尋..." style={searchInput} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div style={sidebarList}>
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
                    <div style={activeTab === 'codex' ? articleHeroTextOnly : articleHeroGrid}>
                      {activeTab !== 'codex' && <TarotCardVisual item={selectedItem} entry={hydratedTarotCardEntries[0]} />}
                      <div style={articleHeaderBlock}>
                        <div style={metaRow}>
                          <span style={categoryPill}>{selectedItem.category}</span>
                          <span style={sectionLabel}>{activeTab.toUpperCase()}</span>
                        </div>
                        <h2 style={goldLabel}>THOTH ARCHIVE</h2>
                        <h1 style={mainTitle}>{selectedItem.title}</h1>
                        <div style={divider} />
                        <p style={detailLead}>{codexIntro || selectedItem.detail}</p>
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
                      <div style={paragraphPanel}>
                        {readableParagraphs.map((paragraph, index) => (
                          <p key={index} style={detailText}>{paragraph}</p>
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
          <TarotDrawingSystem cardBackUrl={TAROT_CARD_BACK_URL} onBackHandlerChange={setDrawingBackHandler} />
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
                      <Pencil size={16} color="#666" style={{ cursor:'pointer', transition:'0.3s'}}
                            onMouseEnter={(e)=>{e.currentTarget.style.fill ='#a2003e';
                                                e.currentTarget.style.stroke ='#a2003e';
                                                e.currentTarget.style.filter='drop-shadow(0 0 10px #a2003e)';}}
                            onMouseLeave={(e)=>{e.currentTarget.style.fill =rec.isFavorite ? '#a2003e' : '#555';
                                                e.currentTarget.style.stroke =rec.isFavorite ? '#a2003e' : '#555';
                                                e.currentTarget.style.filter=rec.isFavorite? 'drop-shadow(0 0 10px #a2003e)': 'none';}}/> {/*drop-shadow(x y blur color)*/}
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
                      <h2 style={goldLabel}>REPORT - {selectedItem.date}</h2>
                      <h1 style={mainTitle}>{selectedItem.title}</h1>
                      <div style={divider} />
                      <p style={detailText}>{selectedItem.content}</p>
                      <button style={invokeGateBtn}>
                        <Download size={16}/>
                        匯出結果
                      </button>
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

const mainLayout = { width: '100%',height:'100vh', background: '#050208', color: '#fff', position: 'relative', overflow: 'hidden', fontFamily: 'Cinzel, serif' };
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

const contentArea = { paddingTop: '80px', height: '100vh', width: '100%', position: 'relative', zIndex: 2 ,overflow: 'visible'};
const flexLayout = { display: 'flex',  height: 'calc(100vh - 80px)', padding: '25px 40px', gap: '25px', alignItems: 'stretch' };

const sidebarWrapper = {
  width: '320px', flexShrink: 0, background: 'rgba(0, 0, 0, 0.4)', borderRadius: '16px',
  padding: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(3px)',
  display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)',overflowY: 'auto',minHeight: 0
};

const detailWrapper = {
  flex: 1, height: 'calc(100vh - 120px)', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.4)',
  borderRadius: '16px', padding: '28px 48px', border: '1px solid rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(1px)'
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
const mainTitle = { fontSize: 'clamp(1.75rem, 3.2vw, 3rem)', letterSpacing: '4px', margin: 0, lineHeight: 1.08 };
const divider = { width: '60px', height: '2px', background: '#bc13fe', margin: '24px 0' };
const detailPanel = { maxWidth: '1120px', margin: '0 auto', paddingBottom: '48px' };
const articleHeroGrid = { display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '42px', alignItems: 'center', marginBottom: '34px' };
const articleHeroTextOnly = { display: 'block', maxWidth: '880px', marginBottom: '34px' };
const articleHeaderBlock = { minWidth: 0 };
const metaRow = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' };
const categoryPill = { color: '#fff', background: 'rgba(188,19,254,0.16)', border: '1px solid rgba(188,19,254,0.35)', borderRadius: '4px', padding: '7px 10px', fontSize: '0.68rem', letterSpacing: '2px' };
const sectionLabel = { color: '#777', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '7px 10px', fontSize: '0.68rem', letterSpacing: '2px' };
const detailLead = { fontSize: '1rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.68)', margin: 0, fontFamily: 'Inter, sans-serif', maxWidth: '720px' };
const tarotCardShell = { width: '100%', maxWidth: '260px' };
const tarotImageFrame = { aspectRatio: '2 / 3', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.35)', boxShadow: '0 0 28px rgba(188,19,254,0.24), inset 0 0 24px rgba(255,255,255,0.08)', background: '#09040d' };
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
  letterSpacing: '0.6px'
};
const paragraphPanel = { display: 'grid', gap: '14px', maxWidth: '820px' };
const detailText = { fontSize: '1rem', lineHeight: '1.9', color: 'rgba(255, 255, 255, 0.78)', margin: 0, fontFamily: 'Inter, sans-serif' };
// eslint-disable-next-line no-unused-vars
const backBtnStyle = { marginTop:'auto', paddingTop: '20px',background: 'none', border: 'none', color: '#bc13fe', cursor: 'pointer', textAlign: 'left', fontFamily: 'Cinzel', fontSize: '0.7rem' };
const sidebarHeader = { padding: '0 10px 20px', fontFamily: 'Cinzel', letterSpacing: '4px', color: '#d4af37', fontSize: '0.8rem' };
const emptyHint = { textAlign: 'center', marginTop: '180px', color: '#333', letterSpacing: '5px' };

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


