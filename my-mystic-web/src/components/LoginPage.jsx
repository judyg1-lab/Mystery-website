import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import BackBtn from './backBtn';
import MysticModal from './MysticModal';

const COLORS = {
  gold: '#d4af37',
  accentBlue: '#4fb8d6',
  textGray: '#b0b0b0',
  border: 'rgba(255, 255, 255, 0.2)'
};
const navBrandStyle = { color: '#d4af37', letterSpacing: '4px', fontSize: '1rem',minWidth: '250px', cursor: 'pointer',whiteSpace: 'nowrap', flexShrink: 0 };

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [resetMethod, setResetMethod] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '', email: '', phone: '', password: '', confirmPassword: ''
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async(e) => {
    if(e) e.preventDefault();
    if(!formData.username || !formData.password) {
      setModalConfig({
        isOpen: true,
        title: 'LOGIN ERROR',
        message: '請填寫使用者名稱與密碼',
        confirmText: '確認',
        cancelText: '',
        type: 'danger',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    try{
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: formData.username, password: formData.password})});
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('mystic_token', data.token); //key: mystic_token, value: the JWT token returned from the server upon successful login. This token will be used for authenticating subsequent API requests to protected routes.
        localStorage.setItem('user_info', JSON.stringify(data.user));
        navigate('/maindashboard');
      } else {
        setModalConfig({
          isOpen: true,
          title: 'LOGIN FAILED',
          message: '帳號或密碼錯誤',
          confirmText: '確認',
          cancelText: '',
          type: 'danger',
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (error) {
      console.error("Login Error:", error);
      setModalConfig({
        isOpen: true,
        title: 'LOGIN ERROR',
        message: '登入過程發生錯誤，請稍後再試',
        confirmText: '確認',
        cancelText: '',
        type: 'danger',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleRegister = async() => {
    const { username, email, phone, password, confirmPassword } = formData;
    if (!username || !email || !phone || !password) {
      setModalConfig({
        isOpen: true,
        title: 'REGISTRATION ERROR',
        message: '請填寫所有欄位以建立帳號',
        confirmText: '確認',
        cancelText: '',
        type: 'danger',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (password !== confirmPassword) {
      setModalConfig({
        isOpen: true,
        title: 'PASSWORD MISMATCH',
        message: '密碼與確認密碼不相符',
        confirmText: '確認',
        cancelText: '',
        type: 'danger',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username,email,phone,password})});

      const data = await response.json();
      if (response.ok) {
        setModalConfig({
          isOpen: true,
          title: 'REGISTRATION SUCCESS',
          message: '註冊成功，請使用新帳號登入',
          confirmText: '確認',
          cancelText: '',
          type: 'info',
          onConfirm: () => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            setFormData(prev => ({ ...prev, password:'', confirmPassword: '' }));
            setMode('login');
          }
        });
      } else {
        setModalConfig({
          isOpen: true,
          title: 'REGISTER FAILED',
          message: data.error || '註冊失敗',
          confirmText: '確認',
          cancelText: '',
          type: 'danger',
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (error) {
      console.error("Registration Error:", error);
      setModalConfig({
        isOpen: true,
        title: 'REGISTRATION ERROR',
        message: '建立帳號時發生錯誤，請稍後再試',
        confirmText: '確認',
        cancelText: '',
        type: 'danger',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleReset = () => {
    setModalConfig({
      isOpen: true,
      title: 'RESET LINK SENT',
      message: `已發送重置連結到註冊 ${resetMethod.toUpperCase()}`,
      confirmText: '確認',
      cancelText: '',
      type: 'info',
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
      `}</style>

      {/* 返回 EnterPage */}
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
              <div style={inputWrapperStyle}><User size={12} style={iconStyle}/><input name="username" value={formData.username} onChange={handleChange} placeholder="USERNAME" style={inputStyle}/></div>
              <div style={inputWrapperStyle}><Mail size={12} style={iconStyle}/><input name="email" value={formData.email} onChange={handleChange} placeholder="EMAIL" style={inputStyle}/></div>
              <div style={inputWrapperStyle}><Phone size={12} style={iconStyle}/><input name="phone" value={formData.phone} onChange={handleChange} placeholder="PHONE" style={inputStyle}/></div>
              <div style={inputWrapperStyle}><Lock size={12} style={iconStyle}/><input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="PASSWORD" style={inputStyle}/></div>
              <div style={inputWrapperStyle}>
                <CheckCircle size={12} style={{...iconStyle, color: formData.password && formData.password === formData.confirmPassword ? '#00ffaa' : COLORS.textGray }}/>
                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="CONFIRM" style={inputStyle}/>
              </div>

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

const methodToggleContainer = { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' };

const methodTab = { fontSize: '0.65rem', fontFamily: 'Cinzel', letterSpacing: '2px', cursor: 'pointer', padding: '5px 10px', transition: '0.3s' };

const footerLinkArea = {
  marginTop: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center',
  gap: '12px', color: COLORS.textGray, fontSize: '0.65rem', fontFamily: 'Cinzel', letterSpacing: '2px'
};

const linkStyle = { cursor: 'pointer', transition: 'color 0.3s' };
