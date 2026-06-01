import React, { useState, useEffect, useRef, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History, Sparkles, ScrollText, Download, Heart } from 'lucide-react';
import { useNavigate,useLocation} from 'react-router-dom';
import { Pencil,ChevronLeft } from 'lucide-react';
import ProfileIcon from '../ProfileIcon';
import BackBtn from '../backBtn';
import MysticModal from '../MysticModal';

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


export default function TarotPage() {
  const navigate = useNavigate();
   // we use location to read the state passed from ProfilePage when user clicks on a favorite item, so that we can know which tab to open and which article to highlight when we first load the TarotPage
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('origins');
  const [drawingView, setDrawingView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasDrawnMaster] = useState(false);
  const hasHandledProfileJump = useRef(false);

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [username, setUsername] = useState('AGENT GUEST');

  const [articles, setArticles] = useState([]);      // 存放從資料庫撈出來的真實文章 (起源或秘典)
  //if activeTab is 'drawing', we don't need to fetch articles, just return early. Otherwise, we fetch real articles from the database based on the active tab
  useEffect(() => {
    if (activeTab === 'drawing') return;
    const fetchRealArticles = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/tarot/articles?tabType=${activeTab}`);
        const data = await res.json();
        if (res.ok) {setArticles(data);}
      } catch (err) {
        console.error("調閱檔案庫受阻:", err);
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
        console.error('解析使用者資訊失敗:', err);
      }
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
  }, [location.state]);

  useEffect(() => {
    const targetId = location.state?.targetId;

    if (!targetId || articles.length === 0) return;

    const exists = articles.some(article => article.id === Number(targetId));

    if (exists) {
      setSelectedItemId(Number(targetId));
      setSelectedType('article');
    }
  }, [location.state, articles, activeTab]);

  const [dbFavorites, setDbFavorites] = useState([]);  // 存放使用者目前在資料庫點過愛心的紀錄
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

  const [historyLogs, setHistoryLogs] = useState([]); // 存放使用者過去抽牌的歷史紀錄
  const fetchHistoryLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem('mystic_token');
      const res = await fetch('http://localhost:5000/api/history/tarot',
        {headers: {Authorization: `Bearer ${token}`}}
      );
      const data = await res.json();
      if (res.ok) {setHistoryLogs(data);}
    } catch (err) {
      console.error("讀取歷史失敗:", err);
    }
  }, []);
  useEffect(() => {
    fetchHistoryLogs();
  }, [fetchHistoryLogs]);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false, title: '', message: '', confirmText: '確認', cancelText: '取消', type: 'info', onConfirm: () => {}
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
        const res = await fetch(`http://localhost:5000/api/user/favorites/${targetFav.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setDbFavorites(prev => prev.filter(fav => fav.id !== targetFav.id));
        } else {
          console.error('取消收藏失敗：', res.status);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const res = await fetch("http://localhost:5000/api/user/favorites", {
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
        } else {
          console.error('新增收藏失敗：', data);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const processedHistoryLogs = historyLogs;

  const filteredHistoryLogs = processedHistoryLogs.filter(log =>
    (log.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.content || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedArticle = processedArticles.find(item => item.id === selectedItemId);
  const selectedHistory = processedHistoryLogs.find(log => log.id === selectedItemId);
  const selectedItem = selectedType === 'article'
    ? (selectedArticle ? { ...selectedArticle } : null)
    : (selectedHistory ? { ...selectedHistory } : null);

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
            ...log,
            isFavorite: true,
            favoriteId: data.favorite.id
          } : log));
          await fetchUserFavorites();
        }
      } catch (err) { console.error("歷史占卜收藏失敗:", err); }
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

      {/* 頂部導覽 */}
      <nav style={topNavBar}>
        <div style={{ display:'flex', alignItems:'center',gap:'25px'}}>
            <BackBtn onClick={() => navigate('/maindashboard')} />
            <div style={navBrandStyle} onClick={() => navigate('/maindashboard')}>MYSTIC ARCHIVE</div></div>
        <div style={navTabsContainer}>
          {['origins', 'codex', 'drawing'].map((tab) => (
            <button
              key={tab}
              style={activeTab === tab ? activeTabBtn : tabBtn}
              onClick={() => { setActiveTab(tab); setDrawingView('home'); setSearchQuery(''); setSelectedItemId(null); setSelectedType(null); }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {e.currentTarget.style.color = '#bc13fe';
                                        e.currentTarget.style.textShadow = '0 0 8px rgba(188,19,254,0.6)';
                                        e.currentTarget.style.transform ='translateY(-1px)';}}}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.textShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0px)';}}}
            >
                {tab === 'origins' ? <div><div>ORIGINS</div><div style={subLabel}>塔羅起源</div></div>
                : tab === 'codex' ? <div><div>CODEX</div><div style={subLabel}>塔羅秘典</div></div>
                : <div><div>DRAWING</div><div style={subLabel}>即時占卜</div></div>}
              {activeTab === tab && <motion.div layoutId="navLine" style={activeUnderline} />}
            </button>
          ))}</div>
        <div onClick={() => navigate('/profile')} style={{ width: '200px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center',gap: '12px', cursor: 'pointer'}}>
          <div style={{ textAlign: 'right', lineHeight: '1.2', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '0.85rem', color: '#bc13fe', letterSpacing: '3px', fontFamily: 'Cinzel', fontWeight: 'bold' }}>ONLINE</div>
            <div style={{ fontSize: '0.85rem', color: '#666', letterSpacing: '1px' }}>{username}</div>
          </div>
          <ProfileIcon color={'#bc13fe'} />
        </div>
      </nav>

      {/* 主要內容區域 */}
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
                      onClick={() => {setSelectedItemId(item.id); setSelectedType('article');}} style={selectedItem?.id === item.id ? activeItem : itemStyle}
                      onMouseEnter={(e)=>{
                        if(selectedItem?.id !== item.id){
                          e.currentTarget.style.background ='rgba(188,19,254,0.08)';
                          e.currentTarget.style.border ='1px solid rgba(188,19,254,0.2)';}}}
                      onMouseLeave={(e)=>{
                        if(selectedItem?.id !== item.id){
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.border ='1px solid transparent';}}}>
                    <div style={{ flex: 1, cursor: 'pointer' }}>
                        <div style={itemContent}>
                          <span style={catTag}>{item.category}</span>
                          <div style={itemTitle}>{item.title}</div>
                        </div>
                      </div>
                    <motion.div
                      whileHover={{ scale: 1.15, filter: 'drop-shadow(0 0 8px #bc13fe)' }}
                      whileTap={{ scale: 0.9 }}
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
                  <motion.div key={selectedItem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <h2 style={goldLabel}>{selectedItem.category} — CHRONICLES</h2>
                    <h1 style={mainTitle}>{selectedItem.title}</h1>
                    <div style={divider} />
                    <p style={detailText}>{selectedItem.content}</p>
                    <div style={quoteBox}>
                      <ScrollText size={20} color="#bc13fe" style={{marginBottom: '10px'}} />
                      <p style={quoteText}>{selectedItem.detail}</p>
                    </div>
                  </motion.div>
                ) : <div style={emptyHint}>探索星辰檔案庫中的秘密...</div>}
              </AnimatePresence>
            </section>
          </div>
        )}

        {/* --- 線上抽牌佈局與對齊 --- */}
        {activeTab === 'drawing' && (
          <>
          {drawingView === 'home' ? (
            <div style={gatewayCenterContainer}>
              <div style={thothLogo}>THOTH</div>
              <h1 style={gatewayTitle}>✧ 托特塔羅：命運之門 ✧</h1>
              <div style={btnGroup}>
                <button onClick={() => { setDrawingView('history'); setSelectedItemId(null); setSelectedType(null); }} style={invokeGlassBtn}
                  onMouseEnter={(e) => {e.currentTarget.style.border = '1px solid #bc13fe';
                                        e.currentTarget.style.color = '#bc13fe';
                                        e.currentTarget.style.boxShadow = '0 0 18px rgba(188,19,254,0.25)';
                                        e.currentTarget.style.background = 'rgba(188,19,254,0.06)';}}
                  onMouseLeave={(e) => {e.currentTarget.style.border = '1px solid rgba(255,255,255,0.4)';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.background = 'rgba(0,0,0,0.6)';}}>
                  <History size={18}/>個人歷史</button>
                <button onClick={() => {if (!hasDrawnMaster) {alert("啟動靈魂主牌儀式...");}
                        setDrawingView('active_draw');}} style={invokeGateBtn}
                        onMouseEnter={(e) => {e.currentTarget.style.background = '#bc13fe';
                                              e.currentTarget.style.boxShadow = '0 0 25px rgba(188,19,254,0.45)';
                                              e.currentTarget.style.transform = 'translateY(-2px)';}}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.boxShadow = '0 0 25px rgba(188,19,254,0.15)';
                          e.currentTarget.style.transform = 'translateY(0px)';}}><Sparkles size={18}/>開始抽牌</button>
              </div>
            </div>

          ) : (
            <div style={flexLayout}>

              {/* 左側 Sidebar */}
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
                        onClick={() => { setSelectedItemId(rec.id); setSelectedType('history'); }}
                        style={ selectedItem?.id === rec.id ? activeItem: itemStyle}
                        onMouseEnter={(e)=>{if(selectedItem?.id !== rec.id){
                                        e.currentTarget.style.background ='rgba(188,19,254,0.08)';
                                        e.currentTarget.style.border ='1px solid rgba(188,19,254,0.2)';}}}
                        onMouseLeave={(e)=>{if(selectedItem?.id !== rec.id){
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.border ='1px solid transparent';}}}
                    >
                      <div onClick={() => { setSelectedItemId(rec.id); setSelectedType('history'); }} style={{ flex: 1, cursor: 'pointer' }}>
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

              {/* 右側內容區 */}
              <section style={detailWrapper}>
                <AnimatePresence mode="wait">
                  {selectedItem ? (
                    <motion.div key={selectedItem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <h2 style={goldLabel}>REPORT — {selectedItem.date}</h2>
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
                      請點選紀錄調閱報告
                    </div>
                  )}
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

// ================= Styles =================

const mainLayout = { width: '100%',height:'100vh', background: '#050208', color: '#fff', position: 'relative', overflow: 'hidden', fontFamily: 'Cinzel, serif' };
const canvasStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 };

const topNavBar = {
  boxSizing: 'border-box',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px', padding: '0 40px',
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
  borderRadius: '16px', padding: '20px 80px', border: '1px solid rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(1px)'
};

const searchBox = { display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.05)', padding: '12px 18px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px' };
const searchInput = { background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem', width: '100%' };
const sidebarList = { display: 'flex', flexDirection: 'column', overflowY: 'auto',flex: 1,  minHeight: 0};
const itemTitle = { color: '#888', marginTop: '6px', fontSize: '0.95rem' };
const itemStyle = { display: 'flex',gap: '12px', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderRadius: '4px', cursor: 'pointer', transition: '0.3s', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const itemContent = {flex: 1,display: 'flex',flexDirection: 'column',gap: '6px'};
const activeItem = { ...itemStyle, background: 'rgba(90, 20, 120, 0.18)', border: '1px solid rgba(188,19,254,0.18)', boxShadow: `
    inset 0 0 12px rgba(188,19,254,0.08),0 0 8px rgba(188,19,254,0.08)`,transition: '0.3s' };
const gatewayCenterContainer = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%',height: 'calc(100vh - 120px)',textAlign: 'center'};

const thothLogo = { fontSize: '10rem', color: '#bc13fe', opacity: 0.2, letterSpacing: '35px', fontWeight: '800' };
const gatewayTitle = { fontSize: '2.4rem', letterSpacing: '8px', marginTop: '-80px', marginBottom: '60px', textAlign: 'center', textShadow: '0 0 15px rgba(188, 19, 254, 0.4)' };
const btnGroup = { display: 'flex', gap: '30px', alignItems: 'center' };

const invokeGlassBtn = { padding: '16px 40px', borderRadius: '2px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(255, 255, 255, 0.4)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Cinzel', fontSize: '0.8rem', letterSpacing: '2px', transition: '0.4s' };
const invokeGateBtn = { ...invokeGlassBtn, background: '#fff', color: '#000', border: 'none', fontWeight: 'bold', boxShadow: '0 0 25px rgba(255, 255, 255, 0.15)' };

const catTag = { fontSize: '0.75rem', color: '#bc13fe', letterSpacing: '2px', fontWeight: 'bold' };
const goldLabel = { color: '#d4af37', letterSpacing: '6px', fontSize: '0.7rem', marginBottom: '15px', fontFamily: 'Cinzel' };
const mainTitle = { fontSize: '2.6rem', letterSpacing: '4px', margin: 0 };
const divider = { width: '60px', height: '2px', background: '#bc13fe', margin: '30px 0' };
const detailText = { fontSize: '1.1rem', lineHeight: '1.9', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '40px', fontFamily: 'Inter, sans-serif' };
const quoteBox = { background: 'rgba(255, 255, 255, 0.02)', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #bc13fe' };
const quoteText = { fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.4)' };
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

