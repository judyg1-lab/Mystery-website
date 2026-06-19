import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Canvas,useFrame} from '@react-three/fiber';
import {
  User, ShieldCheck, Trash2, Save, LogOut,
  Heart, Camera, Palette, Sparkles, Search,
  ChevronDown, Calendar, Clock, Info,AlertTriangle
} from 'lucide-react';
import { useNavigate  } from 'react-router-dom';
import BackBtn from './backBtn';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import MysticModal from '../components/MysticModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const TAROT_CARD_BACK_URL = `${API_BASE_URL}/tarot/tarot-card.png`;

const getAssetUrl = (path = '') => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};

const getAvatarSrc = (path = '') => {
  if (!path) return '';
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};

const SYSTEM_COLORS = {
  'All': { color: '#ffffff', bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)' },
  'TAROT': { color: '#bc13fe', bg: 'rgba(188,19,254,0.12)', border: 'rgba(188,19,254,0.3)' },
  'ASTROLOGY': { color: '#50fa7b', bg: 'rgba(80,250,123,0.12)', border: 'rgba(80,250,123,0.3)' },
  'BAZI': { color: '#ffcc00', bg: 'rgba(255,204,0,0.12)', border: 'rgba(255,204,0,0.3)' },
  'ZIWEI': { color: '#00ccff', bg: 'rgba(0,204,255,0.12)', border: 'rgba(0,204,255,0.3)' },
  '塔羅': 'TAROT', '星盤': 'ASTROLOGY', '八字': 'BAZI', '紫微': 'ZIWEI' // 防呆
};

const normalizeTarotName = (value = '') =>
  value
    .toLowerCase()
    .replace(/^no\.?\s*/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const UniverseCanvas = (theme, density) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let particleCount = 900;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class StarDust {
      constructor() { this.reset(); }
      reset() {
        this.x = (Math.random() - 0.5) * canvas.width * 2;
        this.y = (Math.random() - 0.5) * canvas.height * 2;
        this.z = Math.random() * canvas.width;
        this.size = Math.random() * 0.8 + 0.3;

        this.color = Math.random() > 0.4?'#bc13fe' : '#ffcc00';
        this.velocity = 0.2 + Math.random() * 0.4; // 緩慢流動
      }
      update() {
        this.z -= this.velocity;
        if (this.z <= 0) this.reset();
      }
      draw() {
        const k = 128 / this.z;
        const px = this.x * k + canvas.width / 2;
        const py = this.y * k + canvas.height / 2;
        const opacity = (1 - this.z / canvas.width);

        if (px < 0 || px > canvas.width || py < 0 || py > canvas.height) return;

        ctx.beginPath();
        ctx.arc(px, py, this.size, 0, Math.PI * 2); // 移除投影縮放
        ctx.fillStyle = this.color;
        ctx.globalAlpha = opacity * 0.8; // 增強淡出效果
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new StarDust());

    const render = () => {
      ctx.fillStyle = '#050208';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', resize);
    resize();
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, density]);

  return <canvas ref={canvasRef} style={canvasStyle} />
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const fileInputRef = React.useRef(null);
  const avatarUploadSeqRef = useRef(0);
  const [exploreCount, setExploreCount] = useState(1);
  useEffect(() => {
    const savedCount = localStorage.getItem('mystic_explore_count');
    if (savedCount) {

      const newCount = parseInt(savedCount, 10) + 1;
      localStorage.setItem('mystic_explore_count', newCount.toString());
      setExploreCount(newCount);
    } else {
      localStorage.setItem('mystic_explore_count', '1');
      setExploreCount(1);
    }
  }, []);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '確認',
    cancelText: '取消',
    type: 'info',
    onConfirm: () => {}
  });


  // initialize userInfo state with localStorage data or default values
  const [userInfo, setUserInfo] = useState(() => {
    const savedUser = localStorage.getItem('user_info');
    return savedUser ? JSON.parse(savedUser) : {
      username: 'User',
      email: 'usert@mystic.com',
      bio: '探索星辰與命運的記錄者。',
      avatarUrl: '',
      masterCard: ''
    };
  });
      // initialize avatarUrl state based on userInfo
  const [avatarUrl, setAvatarUrl] = useState(userInfo.avatarUrl || '');
  const [tarotCards, setTarotCards] = useState([]);

  const [passwordData, setPasswordData] = useState({currentPassword: '',newPassword: ''});
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const token = localStorage.getItem('mystic_token');
        const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }});
        const data = await res.json();
        if (res.ok) {
          setUserInfo(data);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
          if (data.masterCard) {
            localStorage.setItem('soul_master_card', data.masterCard);
          } else {
            localStorage.removeItem('soul_master_card');
          }
          localStorage.setItem('user_info', JSON.stringify(data));
        }
      } catch (err) {console.error("即時同步星軌失敗:", err);}
    };
    fetchLatestProfile();
  }, []);

  useEffect(() => {
    const fetchTarotCards = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tarot/cards`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) setTarotCards(data);
      } catch (err) {
        console.error('塔羅主牌資料讀取失敗:', err);
      }
    };

    fetchTarotCards();
  }, []);

  const masterCardEntry = useMemo(() => {
    const masterName = userInfo.masterCard || '';
    if (!masterName) return null;
    const normalizedMaster = normalizeTarotName(masterName)
      .replace('the magician', 'the magus')
      .replace('the high priestess', 'the priestess');
    const card = tarotCards.find((item) =>
      normalizeTarotName(item.title) === normalizedMaster ||
      normalizeTarotName(item.slug) === normalizedMaster
    );

    return {
      name: masterName,
      imageUrl: card?.imageUrl ? getAssetUrl(card.imageUrl) : TAROT_CARD_BACK_URL
    };
  }, [tarotCards, userInfo.masterCard]);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadSeq = avatarUploadSeqRef.current + 1;
    avatarUploadSeqRef.current = uploadSeq;

    // 本地即時產生預覽線路，優化視覺體驗
    const previewURL = URL.createObjectURL(file);
    setAvatarUrl(previewURL);
    e.target.value = '';

    // 封裝實體檔案二進位制數據
    const formData = new FormData();
    formData.append("avatar", file); // 對齊後端 upload.single('avatar')

    // 拿出精準的通行證鍵名
    const token = localStorage.getItem("mystic_token");

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/avatar`, {
        method: "POST",
        headers: {Authorization: `Bearer ${token}`},// 不要手動加 Content-Type，瀏覽器會自己加
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.avatarUrl) {
        if (uploadSeq !== avatarUploadSeqRef.current) return;
        setAvatarUrl(data.avatarUrl);
        setUserInfo(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
        const updatedUser = JSON.parse(localStorage.getItem('user_info') || '{}');
        updatedUser.avatarUrl = data.avatarUrl;
        localStorage.setItem('user_info', JSON.stringify(updatedUser));
      } else {
        setModalConfig({
          isOpen: true,
          title: "UPLOAD FAILED",
          message: data.error || "大頭貼檔案寫入失敗",
          confirmText: "重新嘗試",
          cancelText: "",
          type: "danger",
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (error) {
      console.error("上傳通訊異常:", error);}
  };

  const triggerSaveOverview = (e) => {
    if (e) e.preventDefault();
    setModalConfig({
      isOpen: true,
      title: "UPDATE PROFILE",
      message: "確定要將當前的變更同步寫入您的個人基本資料檔案庫嗎？",
      confirmText: "同步資料",
      cancelText: "暫時取消",
      type: "info",
      onConfirm: executeSaveOverview
    });
  };

  const executeSaveOverview = async () => {
    try {
      const token = localStorage.getItem("mystic_token");
      const res = await fetch(`${API_BASE_URL}/api/user/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ username: userInfo.username, bio: userInfo.bio })
      });

      if (res.ok) {
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        setModalConfig({
          isOpen: true,
          title: "SYNCHRONIZED",
          message: "基本資料檔案庫已與宇宙陣列完成同步！",
          confirmText: "確認",
          cancelText: "",
          type: "info",
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (error) {
      // 降級防護：萬一後端路由還沒接好，本地依然幫她存起來
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      setModalConfig({
        isOpen: true,
        title: "LOCAL CACHED",
        message: "連線受阻，變更已暫時快取於瀏覽器本地空間。",
        confirmText: "確認",
        cancelText: "",
        type: "info",
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };
  const triggerChangePassword = (e) => {
    if (e) e.preventDefault();

    // 防空值防呆
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setModalConfig({
        isOpen: true,
        title: "VALIDATION ERROR",
        message: "原始密碼與新密碼為必填的核心金鑰，不允許留空。",
        confirmText: "重新檢查",
        cancelText: "",
        type: "danger",
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setModalConfig({
        isOpen: true,
        title: "ENCRYPTION BLOCK",
        message: "新密碼不得與原始密碼完全相同，請編排全新的能量組合。",
        confirmText: "重新輸入",
        cancelText: "",
        type: "danger",
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    setModalConfig({
      isOpen: true,
      title: "SECURITY ALTERATION",
      message: "此操作將重構您的星辰登入金鑰，確定要更新加密機制嗎？",
      confirmText: "確認重構",
      cancelText: "維持現狀",
      type: "info",
      onConfirm: executeChangePassword
    });
  };

  const executeChangePassword = async () => {
    try {
      const token = localStorage.getItem("mystic_token");
      const res = await fetch(`${API_BASE_URL}/api/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordData({ currentPassword: '', newPassword: '' });
        setModalConfig({
          isOpen: true,
          title: "SUCCESS",
          message: "密碼已成功寫入檔案庫！",
          confirmText: "完美放行",
          cancelText: "",
          type: "info",
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
      } else {
        setModalConfig({
          isOpen: true,
          title: "ACCESS DENIED",
          message: data.error || "密碼更新失敗，身分驗證受阻。",
          confirmText: "重新核對",
          cancelText: "",
          type: "danger",
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (error) {
      console.error("密碼變更異常:", error);
    }
  };

  const triggerDeleteAccount = () => {
    setModalConfig({
      isOpen: true,
      title: "PROTOCOL OBLIVION",
      message: "確定要啟動最終銷毀程序嗎？此儀式將深入機房，徹底抹除您的核心節點以及所有點過愛心的啟示錄檔案。此操作不可逆。",
      confirmText: "確認抹除",
      cancelText: "維持現狀",
      type: "danger",
      onConfirm: executePermanentDelete
    });
  };

  const executePermanentDelete = async () => {
    try {
      const token = localStorage.getItem("mystic_token");
      const res = await fetch(`${API_BASE_URL}/api/user/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }});

      if (res.ok) {
        localStorage.removeItem('mystic_token');
        localStorage.removeItem('user_info');
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        navigate('/', { replace: true });
      } else {
        alert("銷毀程序受阻。");
      }
    } catch (error) {
      console.error("上傳通訊異常:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mystic_token');
    localStorage.removeItem('user_info');
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    navigate('/', { replace: true });
  };

  const triggerLogout = () => {
    setModalConfig({
      isOpen: true,
      title: "TERMINATE SESSION",
      message: "您確定要登出星辰憑證，離開神祕檔案館嗎？",
      confirmText: "徹底登出",
      cancelText: "留在原處",
      type: "info",
      onConfirm: handleLogout
    });
  };

  const [favItems, setFavItems] = useState([]);
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem('mystic_token');
        const res = await fetch(`${API_BASE_URL}/api/user/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setFavItems(data);
      } catch (err) {
        console.error("收藏同步失敗:", err);
      }
    };
    fetchFavorites();
  }, []);

  const removeFavorite = async (id) => {
    try {
        const token = localStorage.getItem('mystic_token');

        const res = await fetch(`${API_BASE_URL}/api/user/favorites/${id}`, {
          method: 'DELETE',
          headers: {Authorization: `Bearer ${token}`}
        });

        if (res.ok) {
          setFavItems(prev => prev.filter(item => item.id !== id));
        } else {
          console.error('取消收藏失敗:', res.status);
        }
      } catch (err) {
        console.error('取消收藏發生錯誤:', err);
      }
    };

  const triggerDeleteMasterCard = () => {
    setModalConfig({
      isOpen: true,
      title: 'RESET MASTER CARD',
      message: '確定要刪除目前的靈魂主牌紀錄嗎？刪除後，下次進入塔羅抽牌系統會重新抽取主牌。',
      confirmText: '刪除主牌',
      cancelText: '取消',
      type: 'danger',
      onConfirm: executeDeleteMasterCard
    });
  };

  const executeDeleteMasterCard = async () => {
    try {
      const token = localStorage.getItem('mystic_token');
      const res = await fetch(`${API_BASE_URL}/api/user/master-card`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        localStorage.removeItem('soul_master_card');
        setUserInfo(prev => ({ ...prev, masterCard: '' }));
        const cachedUser = JSON.parse(localStorage.getItem('user_info') || '{}');
        delete cachedUser.masterCard;
        localStorage.setItem('user_info', JSON.stringify(cachedUser));
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        return;
      }

      const data = await res.json();
      setModalConfig({
        isOpen: true,
        title: 'RESET FAILED',
        message: data.error || '主牌紀錄刪除失敗，請稍後再試。',
        confirmText: '我知道了',
        cancelText: '',
        type: 'danger',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      console.error('主牌刪除失敗:', err);
    }
  };

  // 根據搜尋條件動態過濾收藏清單
  const filteredFav = favItems.filter(item => {
    const matchSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const typeMapping = {'塔羅': 'TAROT','星盤': 'ASTROLOGY','紫微': 'ZIWEI','八字': 'BAZI'};
    const matchType = filterType === 'All' || item.type === typeMapping[filterType];

    let matchDate = true;
    const parsedDate = item.createdAt ? new Date(item.createdAt) : null; // 確保 createdAt 存在且可解析為日期，轉為data object進行比較
    if (startDate && parsedDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchDate = matchDate && parsedDate >= start;
    }
    if (endDate && parsedDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchDate = matchDate && parsedDate <= end;
    }

    return matchSearch && matchType && matchDate;
  });

  const openFavoriteItem = (item) => {
    const routeMap = {
      TAROT: '/tarot',
      ASTROLOGY: '/astrology',
      BAZI: '/bazi',
      ZIWEI: '/ziwei'
    };
    const route = routeMap[item.type];
    if (!route) return;

    if (item.historyId) {
      navigate(route, { state: { targetHistoryId: item.historyId, targetTab: 'history' } });
      return;
    }

    const fallbackTab =
      item.tabType?.toLowerCase() ||
      (item.category === 'DIVINATION' ? 'codex' : ['HISTORY', 'MYTHOLOGY'].includes(item.category) ? 'origins' : 'codex');

    navigate(route, {
      state: {
        targetId: item.articleId,
        targetTitle: item.title,
        targetTab: fallbackTab
      }
    });
  };


  return (
    <div style={styles.mainLayout}>
      <style>{hoverAndScrollCSS}</style>
      <UniverseCanvas/>
      <MysticModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        type={modalConfig.type}/>

      {/* 頂部導覽列 */}
      <nav style={styles.topNavBar}>
        <div style={{ display:'flex', alignItems:'center', gap:'25px'}}>
          <BackBtn onClick={() => navigate(-1)} />
          <div style={styles.navBrandStyle} onClick={() => navigate('/maindashboard')}>MYSTIC ARCHIVE</div>
        </div>
        <div style={styles.navTabsContainer}><div style={styles.pageTitle}>PERSONAL PROFILE</div></div>
        <div style={{ width: '200px' }}>
          <button onClick={triggerLogout} className="logout-btn-styled">
            <LogOut size={14}/> LOGOUT
          </button>
        </div>
      </nav>
      <main style={styles.contentArea}>
        <div style={styles.flexLayout}>

          {/* 左側 Sidebar */}
          <aside style={styles.sidebarWrapper}>
            <div style={styles.profileHeader}>

              <div style={styles.avatarCircle} onClick={handleAvatarClick}>
                {avatarUrl ? (
                  <img src={getAvatarSrc(avatarUrl)} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}/>
                ) : (<User size={50} color="#bc13fe" />)}
                <div style={styles.editAvatar}><Camera size={12} color="#fff" /></div>
              </div>
              <h3 style={styles.userName}>{userInfo.username}</h3>
              <p style={styles.userRole}>INTUITIVE SEEKER</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            </div>

            <div style={styles.sidebarList}>
              <SidebarItem icon={<User size={18}/>} label="個人總覽" active={activeSection === 'overview'} onClick={() => setActiveSection('overview')} />
              <SidebarItem icon={<Heart size={18}/>} label="我的收藏" active={activeSection === 'favorites'} onClick={() => setActiveSection('favorites')} />
              <SidebarItem icon={<Palette size={18}/>} label="數據中心" active={activeSection === 'appearance'} onClick={() => setActiveSection('appearance')} />
              <SidebarItem icon={<ShieldCheck size={18}/>} label="帳號安全" active={activeSection === 'security'} onClick={() => setActiveSection('security')} />
              <SidebarItem icon={<Trash2 size={18}/>} label="帳號管理" active={activeSection === 'danger'} onClick={() => setActiveSection('danger')} />
            </div>
          </aside>

          {/* 右側內容區 */}
          <section style={{ ...styles.detailPanel, position: 'relative', width: '100%' }}>
            <AnimatePresence mode="wait">

              {activeSection === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.1 }} >
                  <div style={styles.overviewHeaderRow}>
                    <div>
                      <h2 style={styles.goldLabel}>IDENTITY — SETTINGS</h2>
                      <h1 style={styles.sectionTitle}>基本資料修改</h1>
                      <div style={styles.divider} />
                    </div>

                    <div style={styles.oracleStickyCard}>
                      <div style={styles.oracleGlow}></div>
                      <div style={styles.oracleHeader}>
                        <Sparkles size={13} color="#d4af37" />
                        <span>DAILY ORACLE</span>
                      </div>
                      <p style={styles.oracleBody}>「今天的妳，適合慢下來傾聽內心。」</p>
                      <div style={styles.oracleFooter}>2026.05.12</div>
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>使用者名稱 (Username)</label>
                    <input
                      style={styles.inputField}
                      value={userInfo.username}
                      onChange={(e) => setUserInfo({ ...userInfo, username: e.target.value })}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>電子郵件 (Email Address)</label>
                    <input style={styles.inputField} value={userInfo.email} readOnly />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>個人簡介 (Bio)</label>
                    <textarea
                      style={{...styles.inputField, height: '35px', resize: 'none'}}
                      value={userInfo.bio || ''}
                      onChange={(e) => setUserInfo({ ...userInfo, bio: e.target.value })}
                    />
                  </div>
                  <button className="mystic-btn-primary" onClick={triggerSaveOverview}><Save size={18}/> 保存變更</button>
                </motion.div>
              )}

              {activeSection === 'favorites' && (
                <SectionWrapper key="favorites" label="ARCHIVE — STARRED" title="收藏啟示錄">
                  <div style={styles.filterBarContainer}>
                    <div style={styles.searchAndDateRow}>
                      <div style={styles.searchBox}>
                        <Search size={15} color="#555 " />
                        <input style={styles.searchInner} placeholder="搜尋標題..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                      </div>
                      <div style={styles.datePickerGroup}>
                        <Calendar size={14} color="#888" />
                        <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} placeholderText="Start Date" className="mystic-date-picker" dateFormat="yyyy / MM / dd"/>
                        <span style={{ color: '#555' }}>→</span>
                        <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} placeholderText="End Date" className="mystic-date-picker" dateFormat="yyyy / MM / dd"/>
                      </div>
                    </div>
                    <div style={styles.categoryRow}>
                      {['All', '塔羅', '星盤', '八字', '紫微'].map(cat => {
                        const engKey = cat === 'All' ? 'All' : SYSTEM_COLORS[cat];
                        const cfg = SYSTEM_COLORS[engKey] || { color: '#fff', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)' };
                        const isActive = filterType === cat;

                        return (
                          <button key={cat} onClick={() => setFilterType(cat)}
                                  style={{
                                    ...styles.catBtn,
                                    ...(isActive ? styles.catBtnActive : {}),
                                    background: isActive ? cfg.bg : 'transparent',
                                    borderColor: isActive ? cfg.color : 'rgba(255,255,255,0.1)',
                                    color: isActive ? '#fff' : '#ccc',
                                    transition: 'all 240ms ease',
                                    boxShadow: isActive ? `inset 0 0 10px ${cfg.color}20, 0 0 16px ${cfg.color}30` : 'none'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.borderColor = cfg.color;
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.boxShadow = `inset 0 0 12px ${cfg.color}20, 0 0 16px ${cfg.color}18`;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0px)';
                                    e.currentTarget.style.borderColor = isActive ? cfg.color : 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.color = isActive ? '#fff' : '#666';
                                    e.currentTarget.style.boxShadow = isActive ? `inset 0 0 10px ${cfg.color}20, 0 0 16px ${cfg.color}30` : 'none';
                                  }}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={styles.favoriteGrid}>
                    {filteredFav.map(item => {
                      const cfg = SYSTEM_COLORS[item.type] || { color: '#fff', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };

                      return (
                        <div key={item.id} className="fav-card"
                          onClick={() => openFavoriteItem(item)}
                          style={{
                            ...styles.favCard,
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', gap: '20px',
                            padding: '20px', minHeight: '120px',
                            border: `1px solid ${cfg.border}`,
                            borderColor: cfg.border,
                            background: 'rgba(255,255,255,0.02)',
                            boxShadow: 'none',
                          }}
                        >
                          <div style={{flex: 1, display: 'flex',flexDirection: 'column', justifyContent: 'space-between',height: '100%', minHeight: '80px'}}>
                            <div>
                              <span style={{
                                color: cfg.color,
                                fontWeight: '700',
                                letterSpacing: '1px',
                                fontSize: '0.85rem'
                              }}>
                                {item.type}
                              </span>
                              <h4 style={{ ...styles.favTitle, margin: '8px 0 12px 0', lineHeight: '1.4' }}>{item.title}</h4>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.8 }}>
                              <Clock size={12} color="#999" />
                              <p style={{ ...styles.favDate, color: '#999', margin: 0, fontSize: '0.85rem' }}>{item.date}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingTop: '2px' }}>
                            <Heart size={18} onClick={(e) => { e.stopPropagation(); removeFavorite(item.id); }}
                              style={{ cursor: 'pointer', transition: '0.1s' }}
                              color={cfg.color} fill={cfg.color}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionWrapper>
              )}

              {activeSection === 'appearance' && (
                <SectionWrapper key="data_vault" label="DATA CENTER — ARCHIVE EXPORT" title="星辰數據金庫">

                  <div style={styles.masterCardVault}>
                    <div style={styles.masterCardVisual}>
                      {masterCardEntry ? (
                        <img
                          src={masterCardEntry.imageUrl}
                          alt={masterCardEntry.name}
                          style={styles.masterCardImage}
                          onError={(event) => {
                            event.currentTarget.src = TAROT_CARD_BACK_URL;
                          }}
                        />
                      ) : (
                        <div style={styles.masterCardEmptyImage}>?</div>
                      )}
                    </div>
                    <div style={styles.masterCardInfo}>
                      <span style={styles.masterCardKicker}>SOUL MASTER CARD</span>
                      <h3 style={styles.masterCardTitle}>{masterCardEntry?.name || '尚未抽取主牌'}</h3>
                      <p style={styles.masterCardText}>
                        {masterCardEntry
                          ? '這張牌會作為塔羅抽牌與 AI 解讀時的核心底色。'
                          : '進入塔羅即時占卜時，系統會引導你先抽取靈魂主牌。'}
                      </p>
                    </div>
                    {masterCardEntry && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.04, borderColor: '#ff4d6d', color: '#fff', boxShadow: '0 0 18px rgba(255,77,109,0.28)' }}
                        whileTap={{ scale: 0.96 }}
                        style={styles.masterCardDeleteBtn}
                        onClick={triggerDeleteMasterCard}
                      >
                        <Trash2 size={15} /> 刪除主牌
                      </motion.button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(188, 19, 254, 0.1)', padding: '20px', borderRadius: '6px', textAlign: 'center' }}>
                      <h5 style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', letterSpacing: '1px', margin: '0 0 10px 0' }}>星軌探索次數</h5>
                      <h2 style={{ color: '#bc13fe', fontSize: '2rem', fontFamily: 'Cinzel, serif', margin: 0, textShadow: '0 0 10px rgba(188,19,254,0.3)' }}>{exploreCount}</h2>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(212, 175, 55, 0.1)', padding: '20px', borderRadius: '6px', textAlign: 'center' }}>
                      <h5 style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', letterSpacing: '1px', margin: '0 0 10px 0' }}>靈魂核心矩陣</h5>
                      <h2 style={{ color: '#d4af37', fontSize: '1.2rem', fontFamily: 'Cinzel, serif', margin: '8px 0 0 0' }}>INTUITIVE SEEKER</h2>
                    </div>
                  </div>

                  {/* 備份導出區塊 */}
                  <div style={{ background: 'rgba(255, 68, 68, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '25px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h4 style={{ color: '#fff', fontSize: '1rem', letterSpacing: '2px', marginBottom: '10px' }}>導出個人星辰記憶結晶</h4>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '20px' }}>
                      依照神祕學安全協議，您可以將儲存在檔案庫中的個人基本資料、解讀報告與愛心收藏，打包下載為通用數據庫備份檔案（.json）。
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: '#bc13fe', color: '#000', boxShadow: '0 0 20px #bc13fe' }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        background: 'none', border: '1px solid #bc13fe', color: '#bc13fe',
                        padding: '12px 24px', borderRadius: '4px', cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px', transition: '0.1s'
                      }}
                      onClick={() => setModalConfig({
                        isOpen: true,
                        title: "ARCHIVE EXPORT SUCCESS",
                        message: "您是否要將個人數據備份並導出?",
                        confirmText: "接收檔案",
                        cancelText: "取消",
                        type: "info",
                        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                      })}
                    >
                      <Sparkles size={14} style={{ marginRight: '8px', display: 'inline' }} /> 執行全量數據備份
                    </motion.button>
                  </div>

                </SectionWrapper>
              )}

              {/* 帳號安全面版 */}
              {activeSection === 'security' && (
                <SectionWrapper key="security" label="SECURITY — ENCRYPTION" title="密碼安全性變更">
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>原始密碼</label>
                    <input type="password" style={styles.inputField} placeholder="••••••••" value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>新密碼</label>
                    <input type="password" style={styles.inputField} placeholder="Enter new secret code" value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
                  </div>
                  <button className="mystic-btn-primary" onClick={triggerChangePassword}>更新加密機制</button>
                </SectionWrapper>
              )}

              {/* 帳號管理面版 */}
              {activeSection === 'danger' && (
                <SectionWrapper key="danger" label="OBLIVION GATE — DATA DELETION" title="帳號數據抹除協議">
                  <div style={styles.dangerZoneCard}>
                    <div style={styles.dangerHeaderRow}>
                      <AlertTriangle size={28} color="#ff4444" />
                      <div style={{ marginLeft: '15px' }}>
                        <h4 style={{ color: '#ff4444', marginBottom: '8px', letterSpacing: '2px' }}>啟動最終銷毀程序</h4>
                        <p style={styles.dangerMainText}>警告：此操作將會啟動「遺忘協議」。一旦執行，您的所有數位痕跡將從星辰檔案庫的陣列中徹底抹除。</p>
                      </div>
                    </div>

                    <div style={styles.dangerInfoGrid}>
                      <div style={styles.dangerInfoItem}>
                        <h5 style={styles.dangerSubTitle}>數據銷毀範圍</h5>
                        <ul style={styles.dangerUl}>
                          <li>所有收藏的星盤、塔羅與啟示錄紀錄。</li>
                          <li>您的個人偏好設置與介面自定義參數。</li>
                          <li>所有加密過的歷史解讀報告。</li>
                        </ul>
                      </div>
                      <div style={styles.dangerInfoItem}>
                        <h5 style={styles.dangerSubTitle}>權限變更說明</h5>
                        <ul style={styles.dangerUl}>
                          <li>立即撤銷「INTUITIVE SEEKER」之認證身份。</li>
                          <li>註銷所有關聯設備的星辰存取金鑰。</li>
                          <li>銷毀所有與第三方服務的同步連結。</li>
                        </ul>
                      </div>
                    </div>

                    <div style={styles.dividerThin} />

                    <div style={styles.dangerFooter}>
                      <p style={styles.dangerNoticeText}>在執行前，我們建議您先前往「數據中心」導出您的個人備份。此程序一旦確認，將無法透過任何方式復原，請確保您的意志堅定。</p>
                      <button className="mystic-danger-btn" onClick={triggerDeleteAccount}>
                        <Trash2 size={18}/> 啟動永久銷毀程序
                      </button>
                    </div>
                  </div>
                </SectionWrapper>
              )}

            </AnimatePresence>
          </section>
        </div>
      </main>
    </div>
  );
}

// ================= 3. 小組件 =================
const SidebarItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className="sidebar-item" style={active ? styles.activeItem : styles.itemStyle}>{icon} {label}</div>
);

const SectionWrapper = ({ children, label, title }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.1 }}>
    <h2 style={styles.goldLabel}>{label}</h2>
    <h1 style={styles.sectionTitle}>{title}</h1>
    <div style={styles.divider} />
    {children}
  </motion.div>
);

const ThemeOption = ({ label, color, active, onClick }) => (
  <div onClick={onClick} style={{...styles.themeOption, borderColor: active ? color : 'rgba(255,255,255,0.1)', background: active ? 'rgba(255,255,255,0.05)' : 'transparent'}}>
    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }} />
    <span style={{ fontSize: '0.8rem', color: active ? '#fff' : '#666' }}>{label}</span>
  </div>
);

// ================= 4. Styles =================
const canvasStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 };
const styles = {
  mainLayout: { width: '100%', height: '100vh', background: '#050208', color: '#fff', position: 'relative', overflow: 'hidden', fontFamily: 'Cinzel, serif' },
  topNavBar: {
    boxSizing: 'border-box', display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '80px', padding: '0 0 0 40px',
    position: 'fixed', top: 0, width: '100%', zIndex: 100, borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(1px)'
  },
  navBrandStyle: { color: '#d4af37', letterSpacing: '4px', fontSize: '1rem', cursor: 'pointer' },
  navTabsContainer: { flex: 1, textAlign: 'center' },
  pageTitle: { letterSpacing: '6px', fontSize: '1.2rem', color: '#fff' },

  contentArea: { paddingTop: '80px', height: '100vh', width: '100%', position: 'relative', zIndex: 2 },
  flexLayout: { display: 'flex', height: 'calc(100vh - 80px)', padding: '25px 40px', gap: '30px', boxSizing: 'border-box' },

  sidebarWrapper: {
    width: '320px', flexShrink: 0, background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '35px 20px',
    border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(3px)', overflowY: 'auto', maxHeight: '100%'
  },
  profileHeader: { textAlign: 'center', marginBottom: '25px' },
  avatarCircle: {
    width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(188, 19, 254, 0.05)',cursor: 'pointer',
    border: '1px solid #bc13fe', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
  },
  editAvatar: { position: 'absolute', bottom: 0, right: 0, background: '#bc13fe', borderRadius: '50%', padding: '5px',width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  userName: { fontSize: '1.3rem', margin: '10px 0 5px', letterSpacing: '1px' },
  userRole: { fontSize: '0.6rem', color: '#bc13fe', letterSpacing: '2px' },

  sidebarList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  itemStyle: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '8px', cursor: 'pointer', color: '#888', transition: '0.1s', fontSize: '0.9rem' },
  activeItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(188, 19, 254, 0.1)', color: '#fff', borderLeft: '4px solid #bc13fe' },

  overviewHeaderRow: {
    display: 'flex',justifyContent: 'flex-start',alignItems: 'flex-start',position: 'relative'},

  detailPanel: {
    boxSizing: 'border-box',
    flex: 1, background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '20px 80px',
    border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(1px)', overflowY: 'auto', maxHeight: '100%', position: 'relative'
  },

  oracleStickyCard: {
    position: 'absolute',top: '30px',right: '-38px',width: '250px',padding: '16px',
    borderRadius: '14px',background: 'rgba(20,20,30,0.75)',border: '1px solid rgba(212,175,55,0.18)',
    backdropFilter: 'blur(12px)',boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 15px rgba(188,19,254,0.08)`,
    zIndex: 10,overflow: 'hidden'},

  oracleGlow: {
    position: 'absolute',top: '-40px',right: '-30px',width: '135px',height: '115px',
    background: 'rgba(188,19,254,0.18)',borderRadius: '50%',filter: 'blur(48px)'},

  oracleHeader: {
    display: 'flex',alignItems: 'center',gap: '8px',fontSize: '0.75rem',letterSpacing: '2px',
    color: '#d4af37',marginBottom: '10px',position: 'relative',zIndex: 2},

  oracleBody: {
    fontSize: '0.85rem',lineHeight: '1.5',color: '#f5f5f5',position: 'relative',zIndex: 2},

  oracleFooter: {
    marginTop: '12px',fontSize: '0.7rem',letterSpacing: '1.2px', color: '#777',textAlign: 'right',position: 'relative',zIndex: 2},

  filterBarContainer: { marginBottom: '30px' },
  searchAndDateRow: { display: 'flex', gap: '15px', marginBottom: '15px' },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' },
  searchInner: { background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.85rem' },
  datePickerGroup: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.01)', padding: '0 15px', border: '1px solid rgba(255,255,255,0.1)',borderRadius: '8px' },

  categoryRow: { display: 'flex', gap: '10px' },
  catBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#666', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer', transition: '0.1s' },
  catBtnActive: { background: 'rgba(188, 19, 254, 0.2)', border: '1px solid #bc13fe', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem' },

  favoriteGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  favCard: { background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  favDetailPanel: { marginTop: '24px', padding: '24px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 0 20px rgba(255,255,255,0.04)' },
  favoriteDetailTitle: { fontSize: '1.4rem', margin: '0 0 10px 0', letterSpacing: '1px' },
  favoriteDetailMeta: { color: '#999', fontSize: '0.85rem', marginBottom: '18px' },
  favoriteDetailContent: { color: 'rgba(255,255,255,0.85)', lineHeight: '1.8', fontSize: '0.95rem' },
  favType: { fontSize: '0.8rem', color: '#bc13fe', letterSpacing: '1px', fontWeight: 'bold' },
  favTitle: { margin: '8px 0', fontSize: '1rem' },
  favDate: { fontSize: '0.85rem', letterSpacing: '1.5px' },
  masterCardVault: {
    display: 'grid',
    gridTemplateColumns: '96px minmax(0, 1fr) auto',
    gap: '22px',
    alignItems: 'center',
    marginBottom: '28px',
    padding: '18px 22px',
    borderRadius: '10px',
    border: '1px solid rgba(212,175,55,0.22)',
    background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(188,19,254,0.05), rgba(0,0,0,0.26))',
    boxShadow: 'inset 0 0 24px rgba(212,175,55,0.045), 0 0 24px rgba(188,19,254,0.08)'
  },
  masterCardVisual: {
    width: '78px',
    height: '130px',
    borderRadius: '7px',
    border: '1px solid rgba(212,175,55,0.35)',
    background: 'rgba(0,0,0,0.35)',
    overflow: 'hidden',
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 0 18px rgba(212,175,55,0.16)'
  },
  masterCardImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  masterCardEmptyImage: { color: '#d4af37', fontSize: '2rem', fontFamily: 'Cinzel, serif' },
  masterCardInfo: { minWidth: 0 },
  masterCardKicker: { color: '#d4af37', letterSpacing: '0.28em', fontSize: '0.68rem' },
  masterCardTitle: { margin: '8px 0', color: '#fff', fontSize: '1.35rem', letterSpacing: '0.08em', fontFamily: 'Cinzel, serif' },
  masterCardText: { margin: 0, color: 'rgba(255,255,255,0.62)', fontSize: '0.86rem', lineHeight: 1.7 },
  masterCardDeleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minWidth: '112px',
    height: '38px',
    borderRadius: '6px',
    border: '1px solid rgba(255,77,109,0.34)',
    background: 'rgba(255,77,109,0.05)',
    color: '#ff8aa0',
    cursor: 'pointer',
    fontSize: '0.78rem',
    letterSpacing: '0.08em'
  },

  // 客製化 Select
  selectWrapper: { position: 'relative', width: '100%' },
  cleanSelect: { width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '14px 18px', borderRadius: '8px', color: '#fff', appearance: 'none', outline: 'none', cursor: 'pointer' },
  selectArrow: { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#666' },

  sectionTitle: { fontSize: '2.2rem', letterSpacing: '2px', margin: 0 },
  goldLabel: { color: '#d4af37', letterSpacing: '4px', fontSize: '0.7rem', marginBottom: '10px' },
  divider: { width: '145px', height: '2px', background: '#bc13fe', margin: '15px 0 40px' },
  inputGroup: { marginBottom: '25px' },
  label: { display: 'block', color: '#666', fontSize: '0.7rem', marginBottom: '10px', letterSpacing: '1px' },
  inputField: { width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '14px 18px', borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '0.9rem' },
  optionRow: { display: 'flex', gap: '15px' },
  themeOption: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', transition: '0.1s' },
  dangerBox: { background: 'rgba(255, 68, 68, 0.05)', border: '1px solid rgba(255, 68, 68, 0.1)', padding: '20px', borderRadius: '12px' },
  dangerDetail: { marginBottom: '25px' },
  dangerText: { color: '#ffaaaa', fontSize: '0.9rem', lineHeight: '1.6' },
  dangerList: { color: '#ffaaaa', fontSize: '0.8rem', paddingLeft: '20px', marginTop: '10px', lineHeight: '1.8' },
  dangerZoneCard: {
    background: 'rgba(255, 68, 68, 0.03)',
    border: '1px solid rgba(255, 68, 68, 0.15)',
    padding: '40px',
    borderRadius: '20px',
    position: 'relative',
    overflow: 'hidden'
  },
  dangerHeaderRow: { display: 'flex', alignItems: 'center', marginBottom: '30px' },
  dangerMainText: { color: '#ffaaaa', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '600px' },
  
  dangerInfoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '10px' },
  dangerInfoItem: { background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px' },
  dangerSubTitle: { color: '#fff', fontSize: '1rem', marginBottom: '15px', letterSpacing: '1px' },
  dangerUl: { color: '#ffaaaa', fontSize: '0.75rem', paddingLeft: '18px', lineHeight: '1.8', margin: 0 },

  dividerThin: { height: '1px', background: 'rgba(255, 68, 68, 0.1)', margin: '30px 0' },
  dangerFooter: { textAlign: 'left' },
  dangerNoticeText: { color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontStyle: 'italic', marginBottom: '25px', lineHeight: '1.5' },

  customThemeBtn: {
    display: 'flex',alignItems: 'center',gap: '12px',padding: '14px 20px',
    border: '1px solid',borderRadius: '6px',cursor: 'pointer',
    fontFamily: 'Cinzel, serif',fontSize: '0.85rem',letterSpacing: '1px',
    transition: '0.1s',flex: 1,minWidth: '200px'}
};

const hoverAndScrollCSS = `
  /* 內部捲動條美化 */
  *::-webkit-scrollbar { width: 4px; }
  *::-webkit-scrollbar-thumb { background: rgba(188, 19, 254, 0.2); borderRadius: 10px; }
  *::-webkit-scrollbar-track { background: transparent; }

  .sidebar-item:hover {
    background: rgba(188, 19, 254, 0.05);
    color: #fff !important;
  }

  .fav-card:hover {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1.5px solid rgba(188, 19, 254, 0.15) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    box-shadow: 0 0 14px rgba(255, 255, 255, 0.1) !important;
    cursor: pointer;
  }
  .cat-btn-hover:hover {
    background: rgba(188,19,254,0.14) !important;
    border-color: rgba(188,19,254,0.45) !important;
    color: #fff !important;

    transform: translateY(-2px);

    box-shadow:0 0 12px rgba(188,19,254,0.25);
  }

  .custom-date-input {
    background: transparent; border: none; color: #fff; font-size: 0.85rem; padding: 10px 0; outline: none; width: 110px;
  }
  .custom-date-input::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
    opacity: 0.5;
  }
  .custom-date-input::-webkit-calendar-picker-indicator:hover { opacity: 1; }

  .mystic-date-picker {
    background: rgba(115, 115, 115, 0.02);
    border: 1px solid rgba(255,255,255,0.1);

    color: #f3ecff;

    padding: 11px 15px;

    outline: none;
    width: 145px;

    font-size: 0.82rem;
    letter-spacing: 1px;

    backdrop-filter: blur(12px);

    transition: all 0.1s ease;

    box-shadow:
      inset 0 0 12px rgba(255,255,255,0.02),
      0 0 20px rgba(188,19,254,0.06);
  }

  .mystic-date-picker:hover {
    border-color: rgba(188,19,254,0.25);

    background: rgba(255,255,255,0.09);
  }

  .mystic-date-picker:focus {
    border-color: rgba(188,19,254,0.45);

    box-shadow:
      0 0 18px rgba(188,19,254,0.18);
  }

  .react-datepicker {
    background:
      linear-gradient(125deg,
        rgba(26, 18, 39, 0.95),rgba(56, 47, 78, 0.95)) !important;

    border:1px solid rgba(255,255,255,0.08) !important;
    border-radius: 18px !important;
    overflow: hidden;
    color: #f5f0ff !important;
    backdrop-filter: blur(12px);
    box-shadow:0 10px 40px rgba(0,0,0,0.5),0 0 30px rgba(188,19,254,0.08);}

  .react-datepicker__header {
    background:rgba(188,19,254,0.05) !important;
    border-bottom:1px solid rgba(255,255,255,0.02) !important;
    padding-top: 12px !important;}

  .react-datepicker__day {transition: 0.25s;border-radius: 50%;}

  .react-datepicker__day:hover {
    background:rgba(188,19,254,0.18) !important;color: white !important;}

  .react-datepicker__day--selected {
    background:
      linear-gradient(
        135deg,
        #bc13fe,
        #8f5cff
      ) !important;

    box-shadow:
      0 0 12px rgba(188,19,254,0.4);
  }
  .react-datepicker__current-month,
  .react-datepicker-time__header,
  .react-datepicker-year-header {
    color: #f8f4ff !important;

    font-size: 0.9rem !important;

    letter-spacing: 1px;
  }
  .mystic-btn-primary {
    padding: 14px 33px; background: #fff; color: #000; border: none; border-radius: 4px;
    font-weight: bold; letterSpacing: 2px; cursor: pointer; display: flex; alignItems: center; gap: 10px;
    marginTop: 20px; transition: all 0.1s ease;
  }
  .mystic-btn-primary:hover {
    background: #bc13fe;color: #fff;box-shadow: 0 0 15px rgba(188, 19, 254, 0.4);}

  .logout-btn-styled {
    background: none; border: 1.5px solid rgba(255,255,255,0.2); color: #fff;
    padding: 10px 16px; borderRadius: 10px; fontSize: 0.7rem; cursor: pointer;
    display: flex; alignItems: center; gap: 10px; transition: 0.1s;
  }
  .logout-btn-styled:hover {
    background: rgba(255,255,255,0.1);
    border-color: rgba(255,255,255,0.5);
  }

  /* 銷毀按鈕 Hover效果 */
  .mystic-danger-btn {
    background: #ff4444; color: #fff; border: none; padding: 12px 25px;
    border-radius: 4px; font-weight: bold; cursor: pointer; display: flex;
    alignItems: center; gap: 8px; transition: 0.1s;
  }
  .mystic-danger-btn:hover {
    background: #cc0000;
    box-shadow: 0 0 15px rgba(255, 68, 68, 0.3);
  }

  /* 修正原生 Select option 樣式 */
  select option { background: #050208; color: #fff; }
`;
