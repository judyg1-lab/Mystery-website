import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History, Sparkles, ScrollText, Download, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pencil, ChevronLeft, Trash2 } from 'lucide-react';
import ProfileIcon from '../ProfileIcon';
import BackBtn from '../backBtn';
import MysticModal from '../MysticModal';
import MysticChartTool from '../MysticChartTool';


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
    this.color = Math.random() > 0.4 ? '#ffffff' : '#50fa7b';
    this.velocity = 0.2 + Math.random() * 0.4;
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
    for (let i = 0; i < particleCount; i++) particles.push(new StarDust(canvas.width));

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


export default function AstrologyPage() {
  const navigate = useNavigate();
  const location = useLocation(); // 接收來自 ProfilePage 的跨頁金鑰

  const [activeTab, setActiveTab] = useState('origins');
  const [divinationResetKey, setDivinationResetKey] = useState(0);
  const [drawingView, setDrawingView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasDrawnMaster] = useState(false);
  const hasHandledProfileJump = useRef(false); // 跨頁跳轉一次性警衛

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [username, setUsername] = useState('AGENT GUEST');

  const [articles, setArticles] = useState([]);      // 存放從資料庫撈出來的真實文章
  const [dbFavorites, setDbFavorites] = useState([]);  // 存放使用者目前的收藏紀錄
  const [historyLogs, setHistoryLogs] = useState([]); // 存放過去星盤解析的歷史紀錄

  const [renameDraft, setRenameDraft] = useState('');
  const closeMysticModal = useCallback(() => {
    setModalConfig(prev => ({ ...prev, isOpen: false, mode: null }));
  }, []);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false, title: '', message: '', confirmText: '確認', cancelText: '取消', type: 'info', onConfirm: () => {}
  });

  // 取得占星文章資料庫文獻庫（對齊 astrology 路由）
  useEffect(() => {
    if (!['origins', 'codex'].includes(activeTab)) return;
    const fetchRealArticles = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/astrology/articles?tabType=${activeTab}`);
        const data = await res.json();
        if (res.ok) { setArticles(data); }
      } catch (err) {
        console.error("調閱星盤文獻受阻:", err);
      }
    };
    fetchRealArticles();
  }, [activeTab]);

  // 載入本地快取的使用者名稱
  useEffect(() => {
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.username) setUsername(parsed.username);
      } catch (err) {
        console.error('解析使用者資訊失敗:', err);
      }
    }
  }, []);

  // 處理跨頁跳轉的分頁（Tab）切換安全協議
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

  // 處理跨頁跳轉的文章 ID 精準鎖定協議
  useEffect(() => {
    const targetId = location.state?.targetId;
    if (!targetId || articles.length === 0) return;

    const exists = articles.some(article => article.id === Number(targetId));
    if (exists) {
      setSelectedItemId(Number(targetId));
      setSelectedType('article');
    }
  }, [location.state, articles]);

  // 同步收藏紀錄庫（useCallback 優化效能金庫）
  const fetchUserFavorites = useCallback(async () => {
    try {
      const token = localStorage.getItem('mystic_token');
      const res = await fetch("http://localhost:5000/api/user/favorites", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDbFavorites(data);
    } catch (err) {
      console.error("同步收藏失敗:", err);
    }
  }, []);
  useEffect(() => {
    fetchUserFavorites();
  }, [fetchUserFavorites]);

  // 同步過去命盤解析歷史紀錄
  const fetchHistoryLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem('mystic_token');
      const res = await fetch('http://localhost:5000/api/history/astrology', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) { setHistoryLogs(data); }
    } catch (err) {
      console.error("讀取歷史失敗:", err);
    }
  }, []);
  useEffect(() => {
    fetchHistoryLogs();
  }, [fetchHistoryLogs]);

  // 整合處理文章與歷史紀錄的收藏狀態（useMemo 優化效能金庫）
  const processedArticles = useMemo(() => articles.map(item => ({
    ...item, isFavorite: dbFavorites.some(f => f.articleId == item.id)
  })), [articles, dbFavorites]);

  const filteredData = processedArticles.filter(item =>
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.content || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistoryLogs = historyLogs.filter(log =>
    (log.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.content || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 8. 尋獲目前被點開的文獻或歷史報告
  const selectedArticle = processedArticles.find(item => item.id === selectedItemId);
  const selectedHistory = historyLogs.find(log => log.id === selectedItemId);
  const selectedItem = selectedType === 'article'
    ? (selectedArticle ? { ...selectedArticle } : null)
    : (selectedHistory ? { ...selectedHistory } : null);

  // 預設鎖定分頁第一篇文章
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

  // 處理一般占星文章點擊愛心
  const handleHeartClick = async (e, item) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem("mystic_token");
    if (!token) { console.error('handleHeartClick: no mystic_token'); return; }

    if (item.isFavorite) {
      const targetFav = dbFavorites.find(fav => fav.articleId == item.id);
      if (!targetFav) return;
      try {
        const res = await fetch(`http://localhost:5000/api/user/favorites/${targetFav.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setDbFavorites(prev => prev.filter(fav => fav.id !== targetFav.id));
        } else {
          console.error('取消收藏失敗：', res.status);
        }
      } catch (err) { console.error(err); }
    } else {
      try {
        const res = await fetch("http://localhost:5000/api/user/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ articleId: item.id })
        });
        const data = await res.json();
        if (res.ok && data.favorite) {
          const newFavNode = { ...data.favorite, articleId: Number(data.favorite.articleId) };
          setDbFavorites(prev => [...prev, newFavNode]);
        } else {
          console.error('新增收藏失敗：', data);
        }
      } catch (err) { console.error(err); }
    }
  };

  const handleHistoryHeartClick = async (e, rec) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem("mystic_token");

    if (rec.isFavorite) {
      if (!rec.favoriteId) return;
      try {
        const res = await fetch(`http://localhost:5000/api/user/favorites/${rec.favoriteId}`, {
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
        const res = await fetch("http://localhost:5000/api/user/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ historyId: rec.id })
        });
        const data = await res.json();
        if (res.ok && data.favorite) {
          setDbFavorites(prev => [...prev, data.favorite]);
          setHistoryLogs(prev => prev.map(log => log.id === rec.id ? {
            ...log, isFavorite: true, favoriteId: data.favorite.id
          } : log));
          await fetchUserFavorites();
        }
      } catch (err) { console.error("歷史占卜收藏失敗:", err); }
    }
  };
  const executeRenameHistory = async (rec) => {
  const token = localStorage.getItem('mystic_token');
  if (!token) return;
  const nextTitle = renameDraft.trim();
  if (!nextTitle || nextTitle === rec.title) { closeMysticModal(); return; }
  try {
    const res = await fetch(`http://localhost:5000/api/history/astrology/${rec.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: nextTitle.trim() })
    });
    const data = await res.json();
    if (res.ok && data.history) {
      setHistoryLogs(prev => prev.map(log => log.id === rec.id ? data.history : log));
      closeMysticModal();
    }
  } catch (err) { console.error('Rename astrology history failed:', err); }
  };

  const handleRenameHistory = (e, rec) => {
    if (e) e.stopPropagation();
    setRenameDraft(rec.title || '');
    setModalConfig({
      isOpen: true, title: '重新命名命盤紀錄', message: '',
      confirmText: '儲存', cancelText: '取消', type: 'info', mode: 'rename',
      onConfirm: () => executeRenameHistory(rec)
    });
  };

const executeDeleteHistory = async (rec) => {
  const token = localStorage.getItem('mystic_token');
  if (!token) return;
  try {
    const res = await fetch(`http://localhost:5000/api/history/astrology/${rec.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setHistoryLogs(prev => prev.filter(log => log.id !== rec.id));
      if (selectedItemId === rec.id) { setSelectedItemId(null); setSelectedType(null); }
      await fetchUserFavorites();
      closeMysticModal();
    }
  } catch (err) { console.error('Delete astrology history failed:', err); }
};

const handleDeleteHistory = (e, rec) => {
  if (e) e.stopPropagation();
  setModalConfig({
    isOpen: true, title: '刪除命盤紀錄',
    message: `確定要刪除「${rec.title || '未命名紀錄'}」這筆命盤紀錄嗎？`,
    confirmText: '刪除', cancelText: '取消', type: 'danger', mode: null,
    onConfirm: () => executeDeleteHistory(rec)
  });
};
useEffect(() => {
  if (activeTab !== 'history') return;
  const alreadySelected = selectedType === 'history' &&
    filteredHistoryLogs.some(log => log.id === selectedItemId);
  if (!alreadySelected && filteredHistoryLogs.length > 0) {
    setSelectedItemId(filteredHistoryLogs[0].id);
    setSelectedType('history');
  }
}, [activeTab, filteredHistoryLogs]);

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

      {/* 頂部導覽列 */}
      <nav style={topNavBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <BackBtn onClick={() => navigate('/maindashboard')} />
          <div style={navBrandStyle} onClick={() => navigate('/maindashboard')}>MYSTIC ARCHIVE</div>
        </div>
        <div style={navTabsContainer}>
          {[
            { key: 'origins', title: 'ASTROLOGY', sub: '星盤源流' },
            { key: 'codex', title: 'CONSTELLATION', sub: '行星秘典' },
            { key: 'drawing', title: 'DIVINATION', sub: '即時推演' },
            { key: 'history', title: 'HISTORY', sub: '星盤紀錄' }
          ].map((tab) => (
            <button
              key={tab.key}
              style={activeTab === tab.key ? activeTabBtn : tabBtn}
              onClick={() => { setActiveTab(tab.key); setDrawingView('home'); setSearchQuery(''); setSelectedItemId(null); setSelectedType(null); if (tab.key === 'drawing') setDivinationResetKey((key) => key + 1); }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.color = '#50fa7b';
                  e.currentTarget.style.textShadow = '0 0 8px rgba(80,250,123,0.6)';
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
          {false && ['origins', 'codex', 'drawing'].map((tab) => (
            <button
              key={tab}
              style={activeTab === tab ? activeTabBtn : tabBtn}
              onClick={() => { setActiveTab(tab); setDrawingView('home'); setSearchQuery(''); setSelectedItemId(null); setSelectedType(null); }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.color = '#50fa7b';
                  e.currentTarget.style.textShadow = '0 0 8px rgba(80,250,123,0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.textShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }
              }}
            >
              {/* 🎯 對齊妳專案微調的分頁術語與標籤 */}
              {tab === 'origins' ? <div><div>ASTROLOGY</div><div style={subLabel}>星盤檔案</div></div>
                : tab === 'codex' ? <div><div>CONSTELLATION</div><div style={subLabel}>星座研究</div></div>
                : <div><div>CHARTING</div><div style={subLabel}>星盤解析</div></div>}
              {activeTab === tab && <motion.div layoutId="navLine" style={activeUnderline} />}
            </button>
          ))}
        </div>
        <div onClick={() => navigate('/profile')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.filter = 'drop-shadow(0 0 10px rgba(188,19,254,0.5))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'none';
            }}
            style={{ width: '200px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{ textAlign: 'right', lineHeight: '1.2', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '0.75rem', color: '#50fa7b', letterSpacing: '3px', fontFamily: 'Cinzel', fontWeight: 'bold' }}>ONLINE</div>
            <div style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '1px', fontWeight: 'bold' }}>{username}</div>
          </div>
          <ProfileIcon color={'#50fa7b'} />
        </div>
      </nav>

      {/* 主要內容區域 */}
      <main style={contentArea}>
        {(activeTab === 'origins' || activeTab === 'codex') && (
          <div style={flexLayout}>
            {/* 左側 Sidebar 清單 */}
            <div style={sidebarWrapper}>
              <div style={searchBox}>
                <Search size={16} color="#50fa7b" />
                <input placeholder="搜尋..." style={searchInput} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div style={sidebarList}>
                {filteredData.map(item => {
                  const isFavorited = item.isFavorite;
                  return (
                    <div
                      key={`${activeTab}-${item.id}`}
                      onClick={() => { setSelectedItemId(item.id); setSelectedType('article'); }} 
                      style={selectedItemId === item.id && selectedType === 'article' ? activeItem : itemStyle}
                      onMouseEnter={(e) => {
                        if (selectedItemId !== item.id || selectedType !== 'article') {
                          e.currentTarget.style.background = 'rgba(80,250,123,0.06)';
                          e.currentTarget.style.border = '1px solid rgba(80,250,123,0.2)';
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
                        whileHover={{ scale: 1.15, filter: 'drop-shadow(0 0 8px #50fa7b)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleHeartClick(e, item)}
                        style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        <Heart
                          size={18}
                          fill={isFavorited ? '#50fa7b' : 'transparent'}
                          color={isFavorited ? '#50fa7b' : '#555'}
                          style={{ transition: '0.2s' }}
                        />
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 右側 Chronicles 解讀圖書室 */}
            <section style={detailWrapper}>
              <AnimatePresence mode="wait">
                {selectedItem ? (
                  <motion.div key={selectedItem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <h2 style={goldLabel}>{selectedItem.category} — CHRONICLES</h2>
                    <h1 style={mainTitle}>{selectedItem.title}</h1>
                    <div style={divider} />
                    <p style={detailText}>{selectedItem.content}</p>
                    <div style={quoteBox}>
                      <ScrollText size={20} color="#50fa7b" style={{ marginBottom: '10px' }} />
                      <p style={quoteText}>{selectedItem.detail || selectedItem.report}</p>
                    </div>
                  </motion.div>
                ) : <div style={emptyHint}>探索星辰檔案庫中的秘密...</div>}
              </AnimatePresence>
            </section>
          </div>
        )}

        {/* --- 線上即時算卦與歷史紀錄佈局 --- */}
        {(activeTab === 'drawing' || activeTab === 'history') && (
          <MysticChartTool systemKey="astrology" view={activeTab === 'history' ? 'history' : 'drawing'} targetHistoryId={location.state?.targetHistoryId} resetKey={divinationResetKey} />
        )}
        {false && activeTab === 'drawing' && (
          <>
            {drawingView === 'home' ? (
              <div style={gatewayCenterContainer}>
                <div style={thothLogo}>ASTRAL</div>
                <h1 style={gatewayTitle}>✧ 星辰命盤解析系統 ✧</h1>
                <div style={btnGroup}>
                  <button onClick={() => { setDrawingView('history'); setSelectedItemId(null); setSelectedType(null); }} style={invokeGlassBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.border = '1px solid #50fa7b';
                      e.currentTarget.style.color = '#50fa7b';
                      e.currentTarget.style.boxShadow = '0 0 18px rgba(80,250,123,0.25)';
                      e.currentTarget.style.background = 'rgba(80,250,123,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(255,255,255,0.4)';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                    }}
                  >
                    <History size={18} />個人歷史
                  </button>
                  <button onClick={() => {
                    if (!hasDrawnMaster) {
                      setModalConfig({
                        isOpen: true,
                        title: 'SYSTEM ACTIVATED',
                        message: '啟動命盤分析系統...',
                        confirmText: '確認', cancelText: '', type: 'info',
                        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                      });
                    }
                    setDrawingView('active_draw');
                  }} style={invokeGateBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#50fa7b';
                      e.currentTarget.style.boxShadow = '0 0 25px rgba(80,250,123,0.45)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.boxShadow = '0 0 25px rgba(80,250,123,0.15)';
                      e.currentTarget.style.transform = 'translateY(0px)';
                    }}
                  >
                    <Sparkles size={18} />生成星盤
                  </button>
                </div>
              </div>
            ) : (
              <div style={flexLayout}>
                {/* 歷史清單 Sidebar */}
                <div style={sidebarWrapper}>
                  <div style={sidebarHeader}>HISTORY LOG</div>
                  <div style={searchBox}>
                    <Search size={16} color="#50fa7b" />
                    <input placeholder="搜尋..." style={searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div style={sidebarList}>
                    {filteredHistoryLogs.map((rec) => {
                      const isFavorited = dbFavorites.some(f => f.historyId == rec.id);
                      return (
                        <div key={rec.id}
                          onClick={() => { setSelectedItemId(rec.id); setSelectedType('history'); }}
                          style={selectedItemId === rec.id && selectedType === 'history' ? activeItem : itemStyle}
                          onMouseEnter={(e) => {
                            if (selectedItemId !== rec.id || selectedType !== 'history') {
                              e.currentTarget.style.background = 'rgba(80,250,123,0.06)';
                              e.currentTarget.style.border = '1px solid rgba(80,250,123,0.2)';
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
                            whileHover={{ scale: 1.15, filter: 'drop-shadow(0 0 8px #50fa7b)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleHistoryHeartClick(e, { ...rec, isFavorite: isFavorited, favoriteId: dbFavorites.find(f => f.historyId == rec.id)?.id })}
                            style={{ cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                          >
                            <Heart
                              size={18}
                              fill={isFavorited ? '#50fa7b' : 'transparent'}
                              color={isFavorited ? '#50fa7b' : '#555'}
                              style={{ transition: '0.2s' }}
                            />
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 歷史詳細解析報告 */}
                <section style={detailWrapper}>
                  <AnimatePresence mode="wait">
                    {selectedItem ? (
                      <motion.div key={selectedItem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <h2 style={goldLabel}>REPORT — {selectedItem.date}</h2>
                        <h1 style={mainTitle}>{selectedItem.title}</h1>
                        <div style={divider} />
                        <p style={detailText}>{selectedItem.content || selectedItem.report}</p>
                        <button style={invokeGateBtn}>
                          <Download size={16} />匯出結果
                        </button>
                      </motion.div>
                    ) : <div style={emptyHint}>請點選紀錄調閱報告</div>}
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

// ================= Styles 與 CSS (翡翠綠調和矩陣) =================
const mainLayout = { width: '100%', height: '100vh', background: '#020907', color: '#fff', position: 'relative', overflow: 'hidden', overscrollBehavior: 'none', fontFamily: 'Cinzel, serif' };
const canvasStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 };

const topNavBar = {
  boxSizing: 'border-box',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px', padding: '0 40px',
  position: 'fixed', top: 0, width: '100%', zIndex: 1000, pointerEvents: 'auto', borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(1px)'
};
const navBrandStyle = { color: '#d4af37', letterSpacing: '4px', fontSize: '1rem', minWidth: '250px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 };
const navTabsContainer = { display: 'flex', gap: '50px', justifyContent: 'center', flex: 1, alignItems: 'center' };
const tabBtn = { background: 'none', border: 'none', outline: 'none', WebkitTapHighlightColor: 'transparent', color: '#777', cursor: 'pointer', fontFamily: 'Cinzel', fontSize: '1rem', letterSpacing: '3px', position: 'relative', transition: '0.3s' };
const activeTabBtn = { ...tabBtn, color: '#fff' };
const activeUnderline = { position: 'absolute', bottom: -8, left: 0, right: 0, height: '2px', background: '#50fa7b', boxShadow: '0 0 10px rgba(80,250,123,0.6)' };
const subLabel = { fontSize: '0.7rem', color: '#666', letterSpacing: '2px', marginTop: '4px' };

const contentArea = { paddingTop: '80px', height: '100vh', width: '100%', position: 'relative', zIndex: 2, overflow: 'hidden', paddingBottom: 0, boxSizing: 'border-box' };
const flexLayout = { display: 'flex', height: 'calc(100vh - 118px)', padding: '16px 40px 0', gap: '25px', alignItems: 'stretch' };

const sidebarWrapper = {
  width: '320px', flexShrink: 0, background: 'rgba(0, 0, 0, 0.38)', borderRadius: '8px',
  padding: '20px', border: '1px solid rgba(80,250,123,0.14)', backdropFilter: 'blur(3px)',
  display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', minHeight: 0
};

const detailWrapper = {
  flex: 1, height: '100%', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.22)',
  borderRadius: '8px', padding: '40px 80px', border: '1px solid rgba(80,250,123,0.14)',
  backdropFilter: 'blur(1px)', boxShadow: 'inset 0 0 28px rgba(80,250,123,0.08)'
};

const searchBox = { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.05)', padding: '12px 18px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px' };
const searchInput = { background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem', width: '100%' };
const sidebarList = { display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, minHeight: 0 };
const itemTitle = { color: '#888', marginTop: '6px', fontSize: '0.95rem' };
const itemStyle = { display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderRadius: '4px', cursor: 'pointer', transition: '0.3s', border: '1px solid transparent' };
const itemContent = { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' };


const activeItem = {
  ...itemStyle,
  background: 'rgba(80, 250, 123, 0.06)',
  border: '1px solid rgba(80, 250, 123, 0.2)',
  boxShadow: 'inset 0 0 12px rgba(80, 250, 123, 0.08), 0 0 8px rgba(80, 250, 123, 0.08)',
  transition: '0.3s'
};

const gatewayCenterContainer = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: 'calc(100vh - 120px)', textAlign: 'center' };
const thothLogo = { fontSize: '10rem', color: '#50fa7b', opacity: 0.15, letterSpacing: '35px', fontWeight: '800' };
const gatewayTitle = { fontSize: '2.4rem', letterSpacing: '8px', marginTop: '-80px', marginBottom: '60px', textAlign: 'center', textShadow: '0 0 15px rgba(80, 250, 123, 0.4)' };
const btnGroup = { display: 'flex', gap: '30px', alignItems: 'center' };

const invokeGlassBtn = { padding: '16px 40px', borderRadius: '2px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(255, 255, 255, 0.4)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Cinzel', fontSize: '0.8rem', letterSpacing: '2px', transition: '0.4s' };
const invokeGateBtn = { ...invokeGlassBtn, background: '#fff', color: '#000', border: 'none', fontWeight: 'bold', boxShadow: '0 0 25px rgba(80, 250, 123, 0.15)' };

const catTag = { fontSize: '0.75rem', color: '#50fa7b', letterSpacing: '2px', fontWeight: 'bold' };
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
const divider = { width: '60px', height: '2px', background: '#50fa7b', margin: '30px 0' };
const detailText = { fontSize: '1.1rem', lineHeight: '1.9', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '40px', fontFamily: 'Inter, sans-serif' };
const quoteBox = { background: 'rgba(255, 255, 255, 0.02)', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #50fa7b' };
const quoteText = { fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.4)' };
const sidebarHeader = { padding: '0 10px 20px', fontFamily: 'Cinzel', letterSpacing: '4px', color: '#d4af37', fontSize: '0.8rem' };
const emptyHint = { textAlign: 'center', marginTop: '180px', color: '#333', letterSpacing: '5px' };

const hideScrollbarCSS =
  `/* 隱藏滾動條防干涉機制 */
  *::-webkit-scrollbar { display: none; }
  * { -ms-overflow-style: none; scrollbar-width: none; }
`;
