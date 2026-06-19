import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import BackBtn from './backBtn';
import MysticModal from './MysticModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const COLORS = {
  gold: '#d4af37',
  accentBlue: '#4fb8d6',
  textGray: '#b0b0b0',
  border: 'rgba(255, 255, 255, 0.2)'
};
const navBrandStyle = { color: '#d4af37', letterSpacing: '4px', fontSize: '1rem',minWidth: '250px', cursor: 'pointer',whiteSpace: 'nowrap', flexShrink: 0 };
const TOKEN_TTL_MS = {
  remember: 24 * 60 * 60 * 1000,
  session: 2 * 60 * 60 * 1000
};

const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', '123456789', 'qwerty', 'qwerty123',
  'admin123', 'letmein', 'welcome', 'iloveyou', 'abc123', '111111', '000000', 'mystic123'
]);

function evaluatePassword(password) {
  const lower = password.toLowerCase();
  const checks = [
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ];
  if (COMMON_PASSWORDS.has(lower) || /^\d+$/.test(password) || /^(.)\1+$/.test(password)) {
    return { ok: false, label: '太常見', message: '這組密碼太常見或太容易被猜到，請換一組。' };
  }
  if (/(.)\1{3,}/.test(password)) {
    return { ok: false, label: '重複過多', message: '密碼不可以使用大量重複字元。' };
  }
  if (checks.filter(Boolean).length < 5) {
    return { ok: false, label: '強度不足', message: '密碼至少 12 碼，並包含大小寫英文、數字與符號。' };
  }
  return { ok: true, label: '強度良好', message: '密碼強度良好。' };
}

function generateStrongPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*?';
  const all = upper + lower + numbers + symbols;
  const pick = (source) => source[Math.floor(Math.random() * source.length)];
  return [pick(upper), pick(lower), pick(numbers), pick(symbols), ...Array.from({ length: 12 }, () => pick(all))]
    .sort(() => Math.random() - 0.5)
    .join('');
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [resetMethod, setResetMethod] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '', email: '', phone: '', password: '', confirmPassword: '', rememberMe: false
  });
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '確認',
    cancelText: '',
    type: 'info',
    onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const showModal = (config) => setModalConfig({
    isOpen: true,
    confirmText: '確認',
    cancelText: '',
    type: 'info',
    onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
    ...config
  });

  const handleLogin = async(e) => {
    if(e) e.preventDefault();
    if(!formData.username || !formData.password) {
      showModal({ title: '登入資料不足', message: '請輸入帳號與密碼。', type: 'danger' });
      return;
    }
    try{
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: formData.username, password: formData.password, rememberMe: formData.rememberMe})});
      const data = await response.json();
      if (response.ok) {
        const ttl = formData.rememberMe ? TOKEN_TTL_MS.remember : TOKEN_TTL_MS.session;
        localStorage.setItem('mystic_token', data.token);
        localStorage.setItem('mystic_token_expires_at', String(Date.now() + ttl));
        localStorage.setItem('user_info', JSON.stringify(data.user));
        navigate('/maindashboard');
      } else {
        showModal({ title: '登入失敗', message: data.error || '帳號或密碼不正確。', type: 'danger' });
      }
    } catch (error) {
      console.error('Login Error:', error);
      showModal({ title: '登入失敗', message: '伺服器暫時無法回應，請稍後再試。', type: 'danger' });
    }
  };

  const fillGeneratedPassword = () => {
    const password = generateStrongPassword();
    setFormData(prev => ({ ...prev, password, confirmPassword: password }));
    showModal({ title: '已產生安全密碼', message: '系統已為你填入一組高強度密碼。請妥善保存，之後登入會需要用到。' });
  };

  const handleGoogleRegister = () => {
    showModal({
      title: 'Google 註冊尚未啟用',
      message: '要真的使用 Gmail/Google 註冊，需要先設定 Google OAuth Client ID、Client Secret 與回呼網址，並在資料庫新增 Google 帳號識別欄位。'
    });
  };

  const handleRegister = async() => {
    const { username, email, phone, password, confirmPassword } = formData;
    if (!username || !email || !phone || !password) {
      showModal({ title: '註冊資料不足', message: '請填寫使用者名稱、Email、電話與密碼。', type: 'danger' });
      return;
    }
    if (!/^[\p{L}][\p{L}\s.'-]{1,39}$/u.test(username.trim())) {
      showModal({ title: '使用者名稱格式錯誤', message: '姓名或使用者名稱需以文字為主，不能只用數字或符號帶過。', type: 'danger' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showModal({ title: 'Email 格式錯誤', message: '請輸入有效的 Email。', type: 'danger' });
      return;
    }
    const passwordCheck = evaluatePassword(password);
    if (!passwordCheck.ok) {
      showModal({ title: `密碼${passwordCheck.label}`, message: passwordCheck.message, type: 'danger' });
      return;
    }
    if (password !== confirmPassword) {
      showModal({ title: '密碼不一致', message: '請確認兩次輸入的密碼完全相同。', type: 'danger' });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username,email,phone,password})});

      const data = await response.json();
      if (response.ok) {
        showModal({
          title: '註冊成功',
          message: '帳號已建立，請重新登入。',
          onConfirm: () => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            setFormData(prev => ({ ...prev, password:'', confirmPassword: '' }));
            setMode('login');
          }
        });
      } else {
        showModal({ title: '註冊失敗', message: data.error || '註冊暫時無法完成。', type: 'danger' });
      }
    } catch (error) {
      console.error('Registration Error:', error);
      showModal({ title: '註冊失敗', message: '伺服器暫時無法回應，請稍後再試。', type: 'danger' });
    }
  };

  const handleReset = () => {
    showModal({
      title: '重設通知已送出',
      message: `系統已送出重設資訊到你的 ${resetMethod === 'email' ? 'Email' : '電話'}。`,
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setMode('login');
      }
    });
  };
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, scale: 1.05, filter: "blur(10px)", transition: { duration: 0.3 } }
  };

  return (
    <div style={containerStyle}>
      <style>{`
        input::placeholder {
          color: rgba(255, 255, 255, 0.2) !important;
          font-weight: 300;
          letter-spacing: 3px;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #fff;
          -webkit-box-shadow: 0 0 0px 1000px rgba(0,0,0,0) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
        input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          margin: 0;
          border: 1px solid rgba(212, 175, 55, 0.5);
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.025);
          backdrop-filter: blur(10px);
          box-shadow:
            inset 0 0 10px rgba(255, 255, 255, 0.035),
            0 0 14px rgba(212, 175, 55, 0.08);
          transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
        }
        input[type="checkbox"]::after {
          content: "";
          width: 8px;
          height: 5px;
          border-left: 2px solid #f7df9b;
          border-bottom: 2px solid #f7df9b;
          transform: rotate(-45deg) scale(0);
          transform-origin: center;
          transition: transform 140ms ease;
        }
        input[type="checkbox"]:checked {
          border-color: rgba(212, 175, 55, 0.9);
          background: rgba(212, 175, 55, 0.08);
          box-shadow:
            inset 0 0 12px rgba(212, 175, 55, 0.08),
            0 0 18px rgba(212, 175, 55, 0.18);
        }
        input[type="checkbox"]:checked::after {
          transform: rotate(-45deg) scale(1);
        }
        input[type="checkbox"]:focus-visible {
          outline: 2px solid rgba(212, 175, 55, 0.45);
          outline-offset: 3px;
        }
      `}</style>

      {/* 餈? EnterPage */}
      <div style={topBarStyle}>
        <BackBtn onClick={() => navigate('/')} />
        <div style={navBrandStyle} onClick={() => navigate('/')}>MYSTIC ARCHIVE</div></div>
      <div style={backgroundOverlayStyle} />

      <AnimatePresence mode="wait">
        <MysticModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          cancelText={modalConfig.cancelText}
          type={modalConfig.type}
        />
        {mode === 'login' && (
          <motion.div key="login" variants={cardVariants} initial="hidden" animate="visible" exit="exit" style={glassCardStyle}>
            <h2 style={smallTitleStyle}>ESTABLISH ACCOUNT</h2>
            <h1 style={mainTitleStyle}>ACCESS</h1>

            <div style={formGroupStyle}>
              <div style={inputWrapperStyle}>
                <User size={16} style={iconStyle}/>
                <input name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="USERNAME" style={inputStyle}/>
              </div>
              <div style={inputWrapperStyle}>
                <Lock size={16} style={iconStyle}/>
                <input name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="PASSWORD"
                  style={{...inputStyle, paddingRight: '40px'}}
                />
                <span onClick={() => setShowPassword(!showPassword)} style={eyeIconStyle}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </span>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} id="rememberMe" />
                <label htmlFor="rememberMe" style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', margin: 0 }}>記住我，24 小時內免重新登入</label>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: COLORS.gold, color: '#fff', boxShadow: `0 0 30px ${COLORS.gold}80` }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                style={primaryBtnStyle}
              >INITIATE ACCESS <ArrowRight size={18} />
              </motion.button>
            </div>

            <div style={footerLinkArea}>
              <span onClick={() => setMode('register')} style={linkStyle}>CREATE ACCOUNT</span>
              <span style={{opacity: 0.3}}>|</span>
              <span onClick={() => setMode('forgot')} style={linkStyle}>FORGOT KEY?</span>
            </div>
          </motion.div>
        )}

        {mode === 'register' && (
          <motion.div key="register" variants={cardVariants} initial="hidden" animate="visible" exit="exit" style={registerCardStyle}>
            <h2 style={{...smallTitleStyle, marginBottom: '5px'}}>JOIN THE ARCHIVE</h2>
            <h1 style={{...mainTitleStyle, fontSize: '2rem', marginBottom: '20px'}}>REGISTER</h1>

            <div style={{...formGroupStyle, gap: '10px'}}>
              <div style={inputWrapperStyle}><User size={12} style={iconStyle}/><input name="username" value={formData.username} onChange={handleChange} placeholder="姓名或使用者名稱" style={inputStyle}/></div>
              <div style={inputWrapperStyle}><Mail size={12} style={iconStyle}/><input name="email" value={formData.email} onChange={handleChange} placeholder="電子郵件" style={inputStyle}/></div>
              <div style={inputWrapperStyle}><Phone size={12} style={iconStyle}/><input name="phone" value={formData.phone} onChange={handleChange} placeholder="電話號碼" style={inputStyle}/></div>
              <div style={inputWrapperStyle}><Lock size={12} style={iconStyle}/><input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="至少 12 碼，含大小寫、數字、符號" style={inputStyle}/></div>
              <div style={inputWrapperStyle}>
                <CheckCircle size={12} style={{...iconStyle, color: formData.password && formData.password === formData.confirmPassword ? '#00ffaa' : COLORS.textGray }}/>
                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="再次輸入密碼" style={inputStyle}/>
              </div>
              <button type="button" onClick={fillGeneratedPassword} style={secondaryBtnStyle}>產生安全密碼</button>
              <button type="button" onClick={handleGoogleRegister} style={googleBtnStyle}>
                <Mail size={14} /> 使用 Google / Gmail 註冊
              </button>

              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: COLORS.gold, color: '#000' }}
                onClick={handleRegister}
                style={{...primaryBtnStyle, marginTop: '10px', padding: '14px'}}
              >CONFIRM IDENTITY
              </motion.button>
            </div>

            <div style={{...footerLinkArea, marginTop: '20px'}}>
              <span onClick={() => setMode('login')} style={{...linkStyle, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <ArrowLeft size={16} /> BACK TO LOGIN
              </span>
            </div>
          </motion.div>
        )}

        {mode === 'forgot' && (
          <motion.div key="forgot" variants={cardVariants} initial="hidden" animate="visible" exit="exit" style={glassCardStyle}>
            <h2 style={smallTitleStyle}>RECOVER ACCESS</h2>
            <h1 style={mainTitleStyle}>RESET</h1>

            <div style={methodToggleContainer}>
              <span onClick={() => setResetMethod('email')} style={{...methodTab, color: resetMethod === 'email' ? '#fff' : '#666', borderBottom: resetMethod === 'email' ? `2px solid ${COLORS.gold}` : 'none'}}>EMAIL</span>
              <span onClick={() => setResetMethod('phone')} style={{...methodTab, color: resetMethod === 'phone' ? '#fff' : '#666', borderBottom: resetMethod === 'phone' ? `2px solid ${COLORS.gold}` : 'none'}}>PHONE</span>
            </div>

            <div style={formGroupStyle}>
              {resetMethod === 'email' ? (
                <div style={inputWrapperStyle}><Mail size={16} style={iconStyle}/><input name="email" value={formData.email} onChange={handleChange} placeholder="REGISTERED EMAIL" style={inputStyle}/></div>
              ) : (
                <div style={inputWrapperStyle}><Phone size={16} style={iconStyle}/><input name="phone" value={formData.phone} onChange={handleChange} placeholder="PHONE NUMBER" style={inputStyle}/></div>
              )}

              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: COLORS.gold, color: '#000' }}
                onClick={handleReset}
                style={primaryBtnStyle}
              >
                SEND CODE <RefreshCw size={16} />
              </motion.button>
            </div>

            <div style={footerLinkArea}>
              <span onClick={() => setMode('login')} style={{...linkStyle, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <ArrowLeft size={16} /> BACK TO LOGIN
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
const topBarStyle = {
  position: 'absolute',top: '35px',left: '40px',zIndex: 50,
  display: 'flex',alignItems: 'center',gap: '20px'};

const containerStyle = {
  height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center',
  backgroundColor: '#000',
  backgroundImage: `url('/login.png')`,
  backgroundSize: 'cover', backgroundPosition: 'center',
  position: 'relative', overflow: 'hidden'
};

const backgroundOverlayStyle = {
  position: 'absolute', inset: 0,
  background: 'radial-gradient(circle at center, rgba(10,5,30,0.15) 0%, rgba(0,0,0,0.7) 100%)',
  zIndex: 1
};

const glassCardStyle = {
  zIndex: 10, width: '420px', padding: '50px', textAlign: 'center', position: 'relative',
  background: 'rgba(255, 255, 255, 0.015)',
  backdropFilter: 'blur(16px) saturate(180%) contrast(105%)',
  borderRadius: '32px',
  border: `1px solid ${COLORS.border}`,
  boxShadow: `
    0 40px 100px -20px rgba(0,0,0,0.9),
    inset 0 1px 1px 0 rgba(255,255,255,0.2),
    inset 0 10px 20px -5px rgba(255,255,255,0.05)
  `,
  transform: 'perspective(1000px)'
};

const registerCardStyle = { ...glassCardStyle, width: '380px', padding: '30px 45px' };

const mainTitleStyle = {
  fontFamily: 'Cinzel', color: '#fff', fontSize: '2.8rem', fontWeight: '900',
  letterSpacing: '6px', margin: '0 0 35px 0',
  textShadow: '0 0 15px rgba(255,255,255,0.3)'
};

const smallTitleStyle = { fontFamily: 'Cinzel', color: COLORS.gold, fontSize: '0.7rem', letterSpacing: '8px', marginBottom: '10px', opacity: 0.9 };

const formGroupStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };

const inputWrapperStyle = {
  position: 'relative', display: 'flex', alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '14px', padding: '0 15px',
  border: '1px solid rgba(255,255,255,0.06)',
  transition: 'all 0.3s ease'
};

const iconStyle = { color: COLORS.textGray };

const eyeIconStyle = { position: 'absolute', right: '12px', cursor: 'pointer', color: COLORS.textGray, display: 'flex', alignItems: 'center' };

const inputStyle = {
  width: '100%', padding: '15px 12px', background: 'transparent', border: 'none',
  color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'Cinzel', fontSize: '0.8rem', 
  letterSpacing: '1.5px', outline: 'none'
};

const primaryBtnStyle = {
  marginTop: '10px', padding: '16px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: `1px solid ${COLORS.gold}`,
  color: COLORS.gold,
  fontFamily: 'Cinzel', fontWeight: 'bold', letterSpacing: '4px', fontSize: '0.75rem',
  cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
  gap: '12px', borderRadius: '14px', transition: 'all 0.3s ease'
};

const secondaryBtnStyle = {
  height: '38px',
  borderRadius: '10px',
  border: '1px solid rgba(212,175,55,0.34)',
  background: 'rgba(212,175,55,0.08)',
  color: '#f1d891',
  fontFamily: 'Cinzel',
  fontSize: '0.68rem',
  letterSpacing: '2px',
  cursor: 'pointer'
};

const googleBtnStyle = {
  ...secondaryBtnStyle,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  background: 'rgba(255,255,255,0.045)',
  color: 'rgba(255,255,255,0.84)'
};

const methodToggleContainer = { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' };

const methodTab = { fontSize: '0.65rem', fontFamily: 'Cinzel', letterSpacing: '2px', cursor: 'pointer', padding: '5px 10px', transition: '0.3s' };

const footerLinkArea = {
  marginTop: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center',
  gap: '12px', color: COLORS.textGray, fontSize: '0.65rem', fontFamily: 'Cinzel', letterSpacing: '2px'
};

const linkStyle = { cursor: 'pointer', transition: 'color 0.3s' };

