import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History, Sparkles, ScrollText, Download, Heart, Pencil } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileIcon from '../ProfileIcon';
import BackBtn from '../backBtn';
import MysticModal from '../MysticModal';
import MysticChartTool from '../MysticChartTool';

const ACCENT = '#00ccff';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const hoverGold = 'rgba(0,204,255,0.08)';
const borderGold = '1px solid rgba(0,204,255,0.2)';

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
      particles = Array.from({ length: particleCount }, () => ({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * canvas.width,
        size: Math.random() * 0.8 + 0.3,
        color: Math.random() > 0.4 ? '#ffffff' : ACCENT,
        velocity: 0.2 + Math.random() * 0.4
      }));
    };

    const render = () => {
      ctx.fillStyle = '#050208';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.z -= p.velocity;
        if (p.z <= 0) p.z = canvas.width;

        const k = 128 / p.z;
        const px = p.x * k + canvas.width / 2;
        const py = p.y * k + canvas.height / 2;
        if (px < 0 || px > canvas.width || py < 0 || py > canvas.height) return;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = (1 - p.z / canvas.width) * 0.8;
        ctx.fill();
      });
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

export default function ZiWeiPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasHandledProfileJump = useRef(false);

  const [activeTab, setActiveTab] = useState('origins');
  const [divinationResetKey, setDivinationResetKey] = useState(0);
  const [drawingView, setDrawingView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasDrawnMaster] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [username, setUsername] = useState('AGENT GUEST');
  const [articles, setArticles] = useState([]);
  const [dbFavorites, setDbFavorites] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '蝣箄?',
    cancelText: '',
    type: 'info',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (!['origins', 'codex'].includes(activeTab)) return;

    const fetchArticles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ziwei/articles?tabType=${activeTab}`);
        const data = await res.json();
        if (res.ok) setArticles(data);
      } catch (err) {
        console.error('霈?摮?蝡仃??', err);
      }
    };

    fetchArticles();
  }, [activeTab]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_info');
    if (!savedUser) return;

    try {
      const parsed = JSON.parse(savedUser);
      if (parsed.username) setUsername(parsed.username);
    } catch (err) {
      console.error('霈?蝙?刻??仃??', err);
    }
  }, []);

  useEffect(() => {
    if (hasHandledProfileJump.current) return;
    const targetTab = location.state?.targetTab;

    if (targetTab) {
      hasHandledProfileJump.current = true;
      if (targetTab !== activeTab) {
        setActiveTab(targetTab);
        setDrawingView('home');
        setSearchQuery('');
        setSelectedItemId(null);
        setSelectedType(null);
      }
    }
  }, [location.state, activeTab]);

  useEffect(() => {
    const targetId = location.state?.targetId;
    if (!targetId || !['origins', 'codex'].includes(activeTab) || articles.length === 0) return;

    const exists = articles.some(article => article.id === Number(targetId));
    if (exists) {
      setSelectedItemId(Number(targetId));
      setSelectedType('article');
    }
  }, [location.state, articles, activeTab]);

  const fetchUserFavorites = useCallback(async () => {
    try {
      const token = localStorage.getItem('mystic_token');
      const res = await fetch(`${API_BASE_URL}/api/user/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDbFavorites(data);
    } catch (err) {
      console.error('霈??仃??', err);
    }
  }, []);

  useEffect(() => {
    fetchUserFavorites();
  }, [fetchUserFavorites]);

  const fetchHistoryLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem('mystic_token');
      const res = await fetch(`${API_BASE_URL}/api/history/ziwei`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setHistoryLogs(data);
    } catch (err) {
      console.error('霈?摮風?脣仃??', err);
    }
  }, []);

  useEffect(() => {
    fetchHistoryLogs();
  }, [fetchHistoryLogs]);

  const processedArticles = useMemo(() => articles.map(item => ({
    ...item,
    isFavorite: dbFavorites.some(fav => fav.articleId == item.id)
  })), [articles, dbFavorites]);

  const filteredData = processedArticles.filter(item =>
    (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistoryLogs = historyLogs.filter(log =>
    (log.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedArticle = processedArticles.find(item => item.id === selectedItemId);
  const selectedHistory = historyLogs.find(log => log.id === selectedItemId);
  const selectedHistoryFavorite = selectedHistory
    ? dbFavorites.find(fav => fav.historyId == selectedHistory.id)
    : null;
  const selectedItem = selectedType === 'article'
    ? (selectedArticle ? { ...selectedArticle } : null)
    : (selectedHistory ? {
        ...selectedHistory,
        isFavorite: Boolean(selectedHistoryFavorite),
        favoriteId: selectedHistoryFavorite?.id || selectedHistory.favoriteId || null
      } : null);

  useEffect(() => {
    if (!['origins', 'codex'].includes(activeTab)) {
      setSelectedItemId(null);
      setSelectedType(null);
      return;
    }

    const selectedExistsInCurrentTab =
      selectedType === 'article' &&
      processedArticles.some(item => item.id === selectedItemId);

    if (!selectedExistsInCurrentTab && processedArticles.length > 0) {
      setSelectedItemId(processedArticles[0].id);
      setSelectedType('article');
    }
  }, [activeTab, processedArticles, selectedItemId, selectedType]);

  const handleHeartClick = async (e, item) => {
    e.stopPropagation();
    const token = localStorage.getItem('mystic_token');
    if (!token) return;

    if (item.isFavorite) {
      const targetFav = dbFavorites.find(fav => fav.articleId == item.id);
      if (!targetFav) return;

      const res = await fetch(`${API_BASE_URL}/api/user/favorites/${targetFav.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDbFavorites(prev => prev.filter(fav => fav.id !== targetFav.id));
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/user/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ articleId: item.id })
    });
    const data = await res.json();
    if (res.ok && data.favorite) {
      setDbFavorites(prev => [...prev, { ...data.favorite, articleId: Number(data.favorite.articleId) }]);
    }
  };

  const handleHistoryHeartClick = async (e, rec) => {
    e.stopPropagation();
    const token = localStorage.getItem('mystic_token');
    if (!token) return;

    if (rec.isFavorite) {
      if (!rec.favoriteId) return;

      const res = await fetch(`${API_BASE_URL}/api/user/favorites/${rec.favoriteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHistoryLogs(prev => prev.map(log => log.id === rec.id ? { ...log, isFavorite: false, favoriteId: null } : log));
        await fetchUserFavorites();
      }
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/user/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    }
  };

  const resetSelection = () => {
    setDrawingView('home');
    setSearchQuery('');
    setSelectedItemId(null);
    setSelectedType(null);
  };

  return (
    <div style={{ ...mainLayout, ...(activeTab === 'drawing' ? ziweiDrawingBackdrop : null) }}>
      <style>{hideScrollbarCSS}</style>
      {activeTab !== 'drawing' && <UniverseCanvas />}
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

      <nav style={topNavBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <BackBtn onClick={() => navigate('/maindashboard')} />
          <div style={navBrandStyle} onClick={() => navigate('/maindashboard')}>MYSTIC ARCHIVE</div>
        </div>
        <div style={navTabsContainer}>
          {[
            { key: 'origins', title: 'ASTRAL ROOT', sub: '紫微源流' },
            { key: 'codex', title: 'CONSTELLIA', sub: '星曜秘典' },
            { key: 'drawing', title: 'DIVINATION', sub: '即時推演' },
            { key: 'history', title: 'HISTORY', sub: '命盤紀錄' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); resetSelection(); if (tab.key === 'drawing') setDivinationResetKey((key) => key + 1); }}
              style={activeTab === tab.key ? activeTabBtn : tabBtn}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.color = ACCENT;
                  e.currentTarget.style.textShadow = '0 0 8px rgba(0,204,255,0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.textShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }
              }}
            >
              <div><div>{tab.title}</div><div style={subLabel}>{tab.sub}</div></div>
              {activeTab === tab.key && <motion.div layoutId="navLine" style={activeUnderline} />}
            </button>
          ))}
        </div>
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
          style={{ width: '200px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'transform 160ms ease, filter 160ms ease' }}
        >
          <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
            <div style={{ fontSize: '0.75rem', color: ACCENT, letterSpacing: '3px', fontFamily: 'Cinzel', fontWeight: 'bold' }}>ONLINE</div>
            <div style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '1px', fontWeight: 'bold' }}>{username}</div>
          </div>
          <ProfileIcon color={ACCENT} />
        </div>
      </nav>

      <main style={contentArea}>
        {(activeTab === 'origins' || activeTab === 'codex') && (
          <div style={flexLayout}>
            <div style={sidebarWrapper}>
              <div style={searchBox}>
                <Search size={16} color={ACCENT} />
                <input placeholder="搜尋..." style={searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div style={sidebarList}>
                {filteredData.map(item => (
                  <div
                    key={`${activeTab}-${item.id}`}
                    onClick={() => { setSelectedItemId(item.id); setSelectedType('article'); }}
                    style={selectedItemId === item.id && selectedType === 'article' ? activeItem : itemStyle}
                    onMouseEnter={(e) => {
                      if (selectedItemId !== item.id || selectedType !== 'article') {
                        e.currentTarget.style.background = hoverGold;
                        e.currentTarget.style.border = borderGold;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedItemId !== item.id || selectedType !== 'article') {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.border = '1px solid transparent';
                      }
                    }}
                  >
                    <div style={{ flex: 1, cursor: 'pointer' }}>
                      <div style={itemContent}>
                        <span style={catTag}>{item.category}</span>
                        <div style={itemTitle}>{item.title}</div>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.15, filter: `drop-shadow(0 0 8px ${ACCENT})` }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleHeartClick(e, item)}
                      style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <Heart size={18} fill={item.isFavorite ? ACCENT : 'transparent'} color={item.isFavorite ? ACCENT : '#555'} style={{ transition: '0.2s' }} />
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>

            <section style={detailWrapper}>
              <AnimatePresence mode="wait">
                {selectedItem ? (
                  <motion.div key={selectedItem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <h2 style={goldLabel}>{selectedItem.category} CHRONICLES</h2>
                    <h1 style={mainTitle}>{selectedItem.title}</h1>
                    <div style={divider} />
                    <p style={detailText}>{selectedItem.content}</p>
                    <div style={quoteBox}>
                      <ScrollText size={20} color={ACCENT} style={{ marginBottom: '10px' }} />
                      <p style={quoteText}>{selectedItem.detail}</p>
                    </div>
                  </motion.div>
                ) : <div style={emptyHint}>請選擇一篇紫微文獻</div>}
              </AnimatePresence>
            </section>
          </div>
        )}

        {(activeTab === 'drawing' || activeTab === 'history') && (
          <MysticChartTool systemKey="ziwei" view={activeTab === 'history' ? 'history' : 'drawing'} targetHistoryId={location.state?.targetHistoryId} resetKey={divinationResetKey} />
        )}
        {false && activeTab === 'drawing' && (
          <>
            {drawingView === 'home' ? (
              <div style={gatewayCenterContainer}>
                <div style={thothLogo}>ZIWEI</div>
                <h1 style={gatewayTitle}>紫微命盤推演</h1>
                <div style={btnGroup}>
                  <button onClick={() => { setDrawingView('history'); setSelectedItemId(null); setSelectedType(null); }} style={invokeGlassBtn}>
                    <History size={18} />歷史紀錄
                  </button>
                  <button
                    onClick={() => {
                      if (!hasDrawnMaster) {
                        setModalConfig({
                          isOpen: true,
                          title: 'SYSTEM ACTIVATED',
                          message: '紫微命盤推演功能尚未接入，先顯示系統提示。',
                          confirmText: '確認',
                          cancelText: '',
                          type: 'info',
                          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                        });
                      }
                      
                      setDrawingView('active_draw');
                    }}
                    style={invokeGateBtn}
                  >
                    <Sparkles size={18} />開始推演
                  </button>
                </div>
              </div>
            ) : (
              <div style={flexLayout}>
                <div style={sidebarWrapper}>
                  <div style={sidebarHeader}>HISTORY LOG</div>
                  <div style={searchBox}>
                    <Search size={16} color={ACCENT} />
                    <input placeholder="搜尋..." style={searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div style={sidebarList}>
                    {filteredHistoryLogs.map((rec) => {
                      const isFavorited = dbFavorites.some(fav => fav.historyId == rec.id);
                      const favoriteId = dbFavorites.find(fav => fav.historyId == rec.id)?.id || rec.favoriteId;

                      return (
                        <div
                          key={rec.id}
                          onClick={() => { setSelectedItemId(rec.id); setSelectedType('history'); }}
                          style={selectedItemId === rec.id && selectedType === 'history' ? activeItem : itemStyle}
                          onMouseEnter={(e) => {
                            if (selectedItemId !== rec.id || selectedType !== 'history') {
                              e.currentTarget.style.background = hoverGold;
                              e.currentTarget.style.border = borderGold;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedItemId !== rec.id || selectedType !== 'history') {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.border = '1px solid transparent';
                            }
                          }}
                        >
                          <div style={{ flex: 1, cursor: 'pointer' }}>
                            <div style={itemContent}>
                              <span style={catTag}>{rec.date}</span>
                              <div style={itemTitle}>{rec.title}</div>
                            </div>
                          </div>
                          <Pencil size={16} color="#666" style={{ marginRight: '10px' }} />
                          <motion.div
                            whileHover={{ scale: 1.15, filter: `drop-shadow(0 0 8px ${ACCENT})` }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleHistoryHeartClick(e, { ...rec, isFavorite: isFavorited, favoriteId })}
                            style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                          >
                            <Heart size={18} fill={isFavorited ? ACCENT : 'transparent'} color={isFavorited ? ACCENT : '#555'} style={{ transition: '0.2s' }} />
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <section style={detailWrapper}>
                  <AnimatePresence mode="wait">
                    {selectedItem ? (
                      <motion.div key={selectedItem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div style={historyReportHeader}>
                          <div>
                            <h2 style={goldLabel}>REPORT {selectedItem.date}</h2>
                            <h1 style={mainTitle}>{selectedItem.title}</h1>
                          </div>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.12, filter: `drop-shadow(0 0 10px ${ACCENT})` }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleHistoryHeartClick(e, selectedItem)}
                            style={historyDetailHeartBtn}
                          >
                            <Heart
                              size={19}
                              fill={selectedItem.isFavorite ? ACCENT : 'transparent'}
                              color={selectedItem.isFavorite ? ACCENT : '#555'}
                              style={{ transition: '0.2s' }}
                            />
                          </motion.button>
                        </div>
                        <div style={divider} />
                        <p style={detailText}>{selectedItem.content || selectedItem.report}</p>
                        <button style={invokeGateBtn}>
                          <Download size={16} />下載報告
                        </button>
                      </motion.div>
                    ) : <div style={emptyHint}>請選擇一筆命盤紀錄</div>}
                  </AnimatePresence>
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const mainLayout = {
  width: '100%',
  height: '100vh',
  background: '#050208',
  color: '#fff',
  position: 'relative',
  overflow: 'hidden',
  overscrollBehavior: 'none',
  fontFamily: 'Cinzel, serif'
};
const ziweiDrawingBackdrop = {
  background:
    'linear-gradient(90deg, rgba(1,4,10,0.78), rgba(1,7,14,0.18) 46%, rgba(1,4,10,0.72)), url("/assets/ziwei/ziweiBackground.png") center / cover no-repeat'
};
const canvasStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 };
const topNavBar = {
  boxSizing: 'border-box',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px', padding: '0 40px',
  position: 'fixed', top: 0, width: '100%', zIndex: 1000, pointerEvents: 'auto', borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(1px)'
};
const navBrandStyle = { color: '#d4af37', letterSpacing: '4px', fontSize: '1rem', minWidth: '250px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 };
const navTabsContainer = { display: 'flex', gap: '50px', justifyContent: 'center', flex: 1, alignItems: 'center' };
const tabBtn = { background: 'none', border: 'none', outline: 'none', WebkitTapHighlightColor: 'transparent', color: '#777', cursor: 'pointer', fontFamily: 'Cinzel', fontSize: '1rem', letterSpacing: '3px', position: 'relative', transition: '0.2s' };
const activeTabBtn = { ...tabBtn, color: '#fff' };
const activeUnderline = { position: 'absolute', bottom: -8, left: 0, right: 0, height: '2px', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` };
const subLabel = { fontSize: '0.7rem', color: '#666', letterSpacing: '2px', marginTop: '4px' };
const contentArea = { paddingTop: '80px', height: '100vh', width: '100%', position: 'relative', zIndex: 2, overflow: 'hidden', paddingBottom: 0, boxSizing: 'border-box' };
const flexLayout = { display: 'flex', height: 'calc(100vh - 118px)', padding: '16px 40px 0', gap: '25px', alignItems: 'stretch' };
const sidebarWrapper = {
  width: '320px', flexShrink: 0, background: 'rgba(0, 0, 0, 0.38)', borderRadius: '8px',
  padding: '20px', border: '1px solid rgba(0,204,255,0.14)', backdropFilter: 'blur(5px)',
  display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0
};
const detailWrapper = {
  flex: 1, height: '100%', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.22)',
  borderRadius: '8px', padding: '40px 80px', border: '1px solid rgba(0,204,255,0.14)',
  backdropFilter: 'blur(1.5px)', boxShadow: 'inset 0 0 28px rgba(0,204,255,0.08)'
};
const historyReportHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px' };
const historyDetailHeartBtn = { width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(0,204,255,0.35)', background: 'rgba(0,204,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 18px rgba(0,204,255,0.16)', flexShrink: 0 };
const searchBox = { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.05)', padding: '12px 18px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px' };
const searchInput = { background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem', width: '100%' };
const sidebarList = { display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, minHeight: 0 };
const itemTitle = { color: '#888', marginTop: '6px', fontSize: '0.95rem' };
const itemStyle = { display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderRadius: '4px', cursor: 'pointer', transition: '0.18s linear', border: '1px solid transparent', borderBottom: '1px solid transparent' };
const itemContent = { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' };
const activeItem = {
  ...itemStyle,
  background: hoverGold,
  border: '1px solid rgba(0,204,255,0.18)',
  boxShadow: 'inset 0 0 18px rgba(0,204,255,0.06), 0 0 14px rgba(0,204,255,0.08)'
};
const gatewayCenterContainer = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: 'calc(100vh - 120px)', textAlign: 'center' };
const thothLogo = { fontSize: '10rem', color: ACCENT, opacity: 0.2, letterSpacing: '35px', fontWeight: '800' };
const gatewayTitle = { fontSize: '2.4rem', letterSpacing: '8px', marginTop: '-80px', marginBottom: '60px', textAlign: 'center', textShadow: '0 0 15px rgba(0, 204, 255, 0.4)' };
const btnGroup = { display: 'flex', gap: '30px', alignItems: 'center' };
const invokeGlassBtn = { padding: '16px 40px', borderRadius: '2px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(255, 255, 255, 0.4)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Cinzel', fontSize: '0.8rem', letterSpacing: '2px', transition: '0.2s' };
const invokeGateBtn = { ...invokeGlassBtn, background: '#fff', color: '#000', border: 'none', fontWeight: 'bold', boxShadow: '0 0 25px rgba(255, 255, 255, 0.15)' };
const catTag = { fontSize: '0.75rem', color: ACCENT, letterSpacing: '2px', fontWeight: 'bold' };
const goldLabel = { color: ACCENT, letterSpacing: '6px', fontSize: '0.7rem', marginBottom: '15px', fontFamily: 'Cinzel' };
const mainTitle = {
  fontFamily: '"Noto Serif TC", "Songti TC", "PMingLiU", "Cinzel", serif',
  fontSize: 'clamp(1.5rem, 3vw, 3.5rem)',
  fontWeight: 400,
  letterSpacing: '2px',
  margin: 0,
  lineHeight: 1.18,
  color: 'rgba(245,238,222,0.92)'
};
const divider = { width: '60px', height: '2px', background: ACCENT, margin: '30px 0' };
const detailText = { fontSize: '1.1rem', lineHeight: '1.9', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '40px', fontFamily: 'Inter, sans-serif' };
const quoteBox = { background: 'rgba(255, 255, 255, 0.02)', padding: '25px', borderRadius: '8px', borderLeft: `4px solid ${ACCENT}` };
const quoteText = { fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.4)' };
const sidebarHeader = { padding: '0 10px 20px', fontFamily: 'Cinzel', letterSpacing: '4px', color: ACCENT, fontSize: '0.8rem' };
const emptyHint = { textAlign: 'center', marginTop: '180px', color: '#555', letterSpacing: '5px' };
const hideScrollbarCSS = `
  html, body, #root { height: 100%; overflow: hidden; overscroll-behavior: none; }
  *::-webkit-scrollbar { display: none; }
  * { -ms-overflow-style: none; scrollbar-width: none; }
`;

