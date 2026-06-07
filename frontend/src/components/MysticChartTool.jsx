import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, CalendarDays, Check, ChevronDown, Clock, Compass, Copy, ExternalLink, Heart, MapPin, Sparkles, User, VenusAndMars } from 'lucide-react';
import MysticModal from './MysticModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const t = (value) => decodeURIComponent(value);
const ASTRO_FRAME_SRC = '/assets/astrology/astroFrame-transparent.png';

const SYSTEMS = {
  ziwei: { api: 'ziwei', title: t('%E7%B4%AB%E5%BE%AE%E5%91%BD%E7%9B%A4'), subtitle: 'ZI WEI DOUSHU MATRIX', accent: '#00ccff', accentSoft: 'rgba(0,204,255,0.14)', accentGlow: 'rgba(0,204,255,0.34)' },
  bazi: { api: 'bazi', title: t('%E5%85%AB%E5%AD%97%E5%9B%9B%E6%9F%B1'), subtitle: 'FOUR PILLARS ENGINE', accent: '#ffcc00', accentSoft: 'rgba(255,204,0,0.14)', accentGlow: 'rgba(255,204,0,0.34)' },
  astrology: { api: 'astrology', title: t('%E8%A5%BF%E6%B4%8B%E6%98%9F%E7%9B%A4'), subtitle: 'ASTRAL CHART ENGINE', accent: '#50fa7b', accentSoft: 'rgba(80,250,123,0.14)', accentGlow: 'rgba(80,250,123,0.34)' }
};

const PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '交友', '官祿', '田宅', '福德', '父母'];
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZIWEI_STARS = ['紫微', '天府', '武曲', '天相', '太陽', '太陰', '廉貞', '破軍', '七殺', '貪狼', '巨門', '天機'];
const PLANETS = ['太陽', '月亮', '水星', '金星', '火星', '木星', '土星', '天王星', '海王星', '冥王星'];
const SIGNS = ['牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];
const AI_TARGETS = [
  { label: 'ChatGPT', url: 'https://chatgpt.com/' },
  { label: 'Claude', url: 'https://claude.ai/new' },
  { label: 'Gemini', url: 'https://gemini.google.com/app' }
];
const CELESTIAL_SYSTEMS = new Set(['astrology', 'ziwei', 'bazi']);
const ENGINE_LEADS = {
  astrology: '輸入你的出生資料，啟動一張專屬星盤。系統會以十二宮、行星相位與流年方向，推演你的當下命題。',
  ziwei: '紫微斗數，源於天象、理法精微。輸入你的出生資料，啟動命盤矩陣，系統將以星曜佈局推演命運脈絡，洞見先機，趨吉避凶。',
  bazi: '輸入出生資料，啟動干支四柱命盤，生成推演結果。'
};

function engineLead(systemKey) {
  return ENGINE_LEADS[systemKey] || ENGINE_LEADS.astrology;
}

function enginePlateSrc(systemKey) {
  if (systemKey === 'ziwei') return '/assets/ziwei/ziweiPlate-transparent.png';
  if (systemKey === 'bazi') return '/bazi/baziPlate-transparent.png';
  return '/assets/astrology/starPlate-transparent.png';
}

const getToken = () => localStorage.getItem('mystic_token') || localStorage.getItem('token') || '';

function hashSeed(value) {
  return Array.from(value || 'mystic').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function formatDateTime(date = new Date()) {
  return date.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function parseContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    return { report: content };
  }
}

function createPrompt(system, form, result) {
  return [
    `你是一位資深${system.title}諮詢師，熟悉傳統命理語彙，也能用現代心理與行動建議轉譯。請用繁體中文回覆，語氣清楚、溫柔、具體，不做恐嚇式斷言。`,
    `請根據以下資料做完整判讀，若生日、時間或出生地不足，請明確說明哪些部分只能作為概略參考。`,
    `姓名：${form.name}`,
    `性別：${form.gender}`,
    `生日：${form.birthDate || '未填'}`,
    `時間：${form.birthTime || '未填'}`,
    `出生地：${form.birthPlace || '未填'}`,
    `提問：${form.question || '請分析整體命運走向'}`,
    '',
    `命盤資料：${JSON.stringify(result.data, null, 2)}`,
    '請分成：1. 核心性格與命盤主軸；2. 感情與人際；3. 事業與財務；4. 近期年度提醒；5. 盲點與風險；6. 三個具體行動建議。'
  ].join('\n');
}

function createReport(system, form, result) {
  const focus = result.data.focus || result.data.pillars?.map((pillar) => pillar.branch).join('、') || result.data.planets?.[0]?.sign;
  return `${form.name} 的${system.title}判讀已完成。\n\n核心訊號：${focus}\n\n目前盤面顯示你正處在整理能量、重排目標、讓選擇重新對齊的階段。適合先收斂干擾，再把關鍵問題拆成可以行動的步驟。\n\n建議：\n1. 先確認最想改變的一件事，不要同時處理太多方向。\n2. 近期對人際與合作保持清楚邊界。\n3. 把直覺寫下來，三天後回看，通常會看到真正的答案。`;
}

function buildResult(systemKey, form) {
  const seed = hashSeed(`${systemKey}-${form.name}-${form.birthDate}-${form.birthTime}-${form.birthPlace}`);
  const title = `${form.name || '未命名'} ${formatDateTime()}`;

  if (systemKey === 'ziwei') {
    return {
      id: null,
      title,
      form,
      data: {
        focus: `${ZIWEI_STARS[seed % ZIWEI_STARS.length]}坐命`,
        palaces: PALACES.map((palace, index) => ({
          palace,
          stem: STEMS[(seed + index) % STEMS.length],
          branch: BRANCHES[(seed + index * 2) % BRANCHES.length],
          main: ZIWEI_STARS[(seed + index * 3) % ZIWEI_STARS.length],
          aux: ZIWEI_STARS[(seed + index * 5 + 2) % ZIWEI_STARS.length],
          decade: `${2 + index * 10}-${11 + index * 10}歲`
        }))
      }
    };
  }

  if (systemKey === 'bazi') {
    const pillars = ['年柱', '月柱', '日柱', '時柱'].map((name, index) => ({
      name,
      god: ['正官', '正財', '日主', '偏印'][index],
      stem: STEMS[(seed + index * 2) % STEMS.length],
      branch: BRANCHES[(seed + index * 3) % BRANCHES.length],
      hidden: `${STEMS[(seed + index + 3) % STEMS.length]}、${STEMS[(seed + index + 5) % STEMS.length]}`,
      phase: ['長生', '沐浴', '帝旺', '墓'][index]
    }));
    return {
      id: null,
      title,
      form,
      data: {
        pillars,
        info: [['日主', pillars[2].stem], ['格局', '食神生財'], ['喜用', `${pillars[1].stem}${pillars[0].branch}`], ['大運起點', `${36 + (seed % 18)}歲後轉運`]],
        luck: Array.from({ length: 8 }, (_, index) => ({
          age: `${index * 10 + 1}-${index * 10 + 10}`,
          stem: STEMS[(seed + index) % STEMS.length],
          branch: BRANCHES[(seed + index + 4) % BRANCHES.length],
          note: ['偏財', '正官', '七殺', '正印'][index % 4]
        }))
      }
    };
  }

  return {
    id: null,
    title,
    form,
    data: {
      planets: PLANETS.map((planet, index) => ({
        planet,
        sign: SIGNS[(seed + index * 2) % SIGNS.length],
        degree: `${(seed + index * 13) % 30}°${(seed + index * 7) % 60}'`,
        house: `第${((seed + index) % 12) + 1}宮`,
        aspect: ['合相', '拱相', '刑相', '對分'][index % 4]
      }))
    }
  };
}

export default function MysticChartTool({ systemKey, view = 'drawing', targetHistoryId = null }) {
  const system = SYSTEMS[systemKey] || SYSTEMS.ziwei;
  const [mode, setMode] = useState('form');
  const [form, setForm] = useState({ name: '', gender: '女', birthDate: '', birthTime: '', birthPlace: '', question: '' });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showPromptMenu, setShowPromptMenu] = useState(false);
  const [isAiReading, setIsAiReading] = useState(false);
  const [modal, setModal] = useState(null);

  const activeForm = result?.form || form;
  const prompt = useMemo(() => (result ? createPrompt(system, activeForm, result) : ''), [activeForm, result, system]);
  const filteredHistory = history.filter((item) =>
    `${item.title || ''} ${item.content || ''}`.toLowerCase().includes(historySearch.toLowerCase())
  );
  const selectedHistory = filteredHistory.find((item) => item.id === selectedHistoryId) || filteredHistory[0];

  useEffect(() => {
    loadHistory();
    loadFavorites();
  }, [system.api]);

  useEffect(() => {
    if (view === 'history') {
      setMode('history');
      if (targetHistoryId) setSelectedHistoryId(Number(targetHistoryId));
      return;
    }
    if (mode === 'history') setMode(result ? 'result' : 'form');
  }, [view, mode, result, targetHistoryId]);

  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

  function requireToken() {
    if (getToken()) return true;
    setModal({ title: '尚未登入', message: '請先登入，系統才能保存歷史紀錄與同步個人收藏。' });
    return false;
  }

  async function loadHistory() {
    if (!getToken()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${system.api}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
        if (!selectedHistoryId && data[0]) setSelectedHistoryId(data[0].id);
      }
    } catch (error) {
      console.warn('history unavailable', error);
    }
  }

  async function loadFavorites() {
    if (!getToken()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/favorites`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (response.ok) setFavorites(await response.json());
    } catch (error) {
      console.warn('favorites unavailable', error);
    }
  }

  async function persistHistory(nextResult) {
    if (!requireToken()) return nextResult;
    const response = await fetch(`${API_BASE_URL}/api/history/${system.api}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title: nextResult.title, content: JSON.stringify(nextResult) })
    });
    if (!response.ok) {
      setModal({ title: '保存失敗', message: '這次推演已完成，但歷史紀錄沒有寫入。請確認登入狀態後再試一次。' });
      return nextResult;
    }
    const payload = await response.json();
    const saved = { ...nextResult, id: payload.history.id };
    setSelectedHistoryId(saved.id);
    await loadHistory();
    return saved;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitChart(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.birthDate.trim()) {
      setModal({ title: '資料尚未完整', message: '請先填寫姓名與出生日期，再開始推演。' });
      return;
    }
    if (!requireToken()) return;
    setMode('loading');
    window.setTimeout(async () => {
      const generated = buildResult(systemKey, form);
      const saved = await persistHistory(generated);
      setResult(saved);
      setMode('result');
    }, 1700);
  }

  async function copyPrompt(openUrl) {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setShowPromptMenu(false);
    if (openUrl) window.open(openUrl, '_blank', 'noopener,noreferrer');
  }

  async function runAiReading() {
    if (!result) return;
    setShowPromptMenu(false);
    setIsAiReading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/reading`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ system: system.api, prompt })
      });
      const data = await response.json();
      setResult((current) => ({ ...current, report: response.ok && data.report ? data.report : (data.error || createReport(system, activeForm, current)) }));
    } catch (error) {
      console.error('AI chart reading failed:', error);
      setResult((current) => ({ ...current, report: createReport(system, activeForm, current) }));
    } finally {
      setIsAiReading(false);
    }
  }

  async function toggleFavorite(targetResult = result) {
    if (!targetResult?.id || !requireToken()) return;
    const favorite = favorites.find((item) => item.historyId === targetResult.id);
    const response = favorite
      ? await fetch(`${API_BASE_URL}/api/user/favorites/${favorite.id}`, { method: 'DELETE', headers: authHeaders() })
      : await fetch(`${API_BASE_URL}/api/user/favorites`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ historyId: targetResult.id }) });

    if (!response.ok) {
      setModal({ title: '收藏失敗', message: '收藏沒有同步成功，請確認登入狀態後再試一次。' });
      return;
    }
    await loadFavorites();
    await loadHistory();
  }

  function openHistory(item) {
    const parsed = parseContent(item.content);
    setSelectedHistoryId(item.id);
    setResult({ ...parsed, id: item.id, title: item.title });
    setMode('result');
  }

  function renderResult(currentResult = result) {
    if (!currentResult) return <div style={emptyState}>選擇左側紀錄後，右側會展開完整命盤。</div>;
    return (
      <ResultView
        systemKey={systemKey}
        system={system}
        result={currentResult}
        favorites={favorites}
        showPromptMenu={showPromptMenu}
        setShowPromptMenu={setShowPromptMenu}
        toggleFavorite={() => toggleFavorite(currentResult)}
        copyPrompt={copyPrompt}
        runAiReading={runAiReading}
        isAiReading={isAiReading}
      />
    );
  }

  return (
    <section className="mystic-chart-tool" style={{ '--accent': system.accent }}>
      <div style={shell(system, view, systemKey)}>
        <AnimatePresence mode="wait">
          {mode === 'form' && (
            CELESTIAL_SYSTEMS.has(systemKey) ? (
              systemKey === 'astrology' ? (
                <AstrologyRiteForm system={system} form={form} updateField={updateField} submitChart={submitChart} />
              ) : systemKey === 'ziwei' ? (
                <ZiweiRiteForm system={system} form={form} updateField={updateField} submitChart={submitChart} />
              ) : systemKey === 'bazi' ? (
                <BaziRiteForm system={system} form={form} updateField={updateField} submitChart={submitChart} />
              ): (
              <motion.form
                key={`${systemKey}-form`}
                className={`mystic-celestial-form ${systemKey}-celestial-form`}
                style={celestialFormStage(system, systemKey)}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                onSubmit={submitChart}
              >
                <div style={astroLeftPane(systemKey)}>
                  <span style={eyebrow(system)}>{system.subtitle}</span>
                  <h1 style={astroTitle(systemKey)}>{system.title}</h1>
                  <p style={astroLead(systemKey)}>{engineLead(systemKey)}</p>
                  <div style={astroDivider(systemKey)} />
                  <img
                    src={enginePlateSrc(systemKey)}
                    alt=""
                    style={starPlateImage(system, systemKey)}
                  />
                </div>
                <div style={astroRightPane(systemKey)}>
                  <Input label="姓名" value={form.name} onChange={(value) => updateField('name', value)} placeholder="輸入姓名" />
                  <label style={fieldLabel}>性別<select style={inputStyle} value={form.gender} onChange={(event) => updateField('gender', event.target.value)}><option>女</option><option>男</option><option>其他</option></select></label>
                  <Input label="出生日期" value={form.birthDate} onChange={(value) => updateField('birthDate', value)} placeholder="年/月/日" />
                  <Input label="出生時間（選填）" value={form.birthTime} onChange={(value) => updateField('birthTime', value)} placeholder="HH : MM" />
                  <label style={{ ...fieldLabel, gridColumn: '1 / -1' }}>出生地（選填）<input style={inputStyle} value={form.birthPlace} onChange={(event) => updateField('birthPlace', event.target.value)} placeholder="輸入城市或國家" /></label>
                  <label style={{ ...fieldLabel, gridColumn: '1 / -1' }}>想問的方向<textarea style={{ ...inputStyle, minHeight: 92, resize: 'none' }} maxLength={120} value={form.question} onChange={(event) => updateField('question', event.target.value)} placeholder="感情、事業、流年、人生方向..." /></label>
                  <motion.button style={astroSubmitButton} whileHover={{ y: -2, filter: 'brightness(1.08)', boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 34px ${system.accentGlow}` }} whileTap={{ scale: 0.98 }}>
                    <Sparkles size={18} /> 開始推演
                  </motion.button>
                </div>
              </motion.form>
              )
            ) : (
              <motion.form key="form" style={formPanel(system)} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} onSubmit={submitChart}>
                <div style={headline}>
                  <span style={eyebrow(system)}>{system.subtitle}</span>
                  <h1 style={titleStyle}>{system.title}</h1>
                  <p style={lead}>輸入出生資料，啟動一張專屬命盤。系統會先以光流掃描盤面，再生成可收藏、可複製 prompt 的結果。</p>
                </div>
                <div style={fieldGrid}>
                  <Input label="姓名" value={form.name} onChange={(value) => updateField('name', value)} placeholder="輸入姓名" />
                  <label style={fieldLabel}>性別<select style={inputStyle} value={form.gender} onChange={(event) => updateField('gender', event.target.value)}><option>女</option><option>男</option><option>其他</option></select></label>
                  <Input label="出生日期" value={form.birthDate} onChange={(value) => updateField('birthDate', value)} placeholder="年/月/日" />
                  <Input label="出生時間（選填）" value={form.birthTime} onChange={(value) => updateField('birthTime', value)} placeholder="HH : MM" />
                  <Input label="出生地（選填）" value={form.birthPlace} onChange={(value) => updateField('birthPlace', value)} placeholder="城市或國家" />
                  <label style={{ ...fieldLabel, gridColumn: '1 / -1' }}>想問的方向<textarea style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }} value={form.question} onChange={(event) => updateField('question', event.target.value)} placeholder="感情、事業、流年、人生方向..." /></label>
                </div>
                <motion.button style={primaryButton(system)} whileHover={{ y: -2, boxShadow: `0 0 28px ${system.accentGlow}` }} whileTap={{ scale: 0.98 }}>
                  <Sparkles size={18} /> 開始推演
                </motion.button>
              </motion.form>
            )
          )}

          {mode === 'loading' && (
            <motion.div key="loading" style={loadingPanel(system)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={scanAura(system)} />
              {systemKey === 'astrology' ? <AstroLoading /> : <GridLoading systemKey={systemKey} />}
              <p style={loadingText}>命盤資料正在對位，星曜與流年正在校準...</p>
            </motion.div>
          )}

          {mode === 'result' && result && (
            <motion.div key="result" className={`mystic-result-panel ${systemKey}-result-panel`} style={resultPanel(system)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              {renderResult(result)}
            </motion.div>
          )}

          {mode === 'history' && (
            <motion.div key="history" style={historyLayout} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <aside style={historySidebar(system)}>
                <div style={sidebarTitle(system)}>HISTORY LOG</div>
                <input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="搜尋..."
                  style={historySearchInput(system)}
                />
                {filteredHistory.length === 0 ? <div style={emptyState}>尚未留下紀錄。完成一次推演後，這裡會自動保存。</div> : filteredHistory.map((item) => (
                  <button key={item.id} style={historyItem(system, selectedHistory?.id === item.id)} onClick={() => openHistory(item)}>
                    <span><b>{item.title}</b><small>{item.date}</small></span>
                    {item.isFavorite && <Heart size={16} fill={system.accent} color={system.accent} />}
                  </button>
                ))}
              </aside>
              <main style={historyContent(system)}>
                {selectedHistory ? renderResult({ ...parseContent(selectedHistory.content), id: selectedHistory.id, title: selectedHistory.title }) : <div style={historyEmptyCenter}>請點選一筆紀錄</div>}
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{toolCSS(system)}</style>
      {modal && <MysticModal isOpen={Boolean(modal)} title={modal.title} message={modal.message} confirmText="我知道了" cancelText={null} onClose={() => setModal(null)} onConfirm={() => setModal(null)} />}
    </section>
  );
}

function ResultView({ systemKey, system, result, favorites, showPromptMenu, setShowPromptMenu, toggleFavorite, copyPrompt, runAiReading, isAiReading }) {
  return (
    <>
      <div style={resultHeader}>
        <div><span style={eyebrow(system)}>{result.title}</span><h2 style={resultTitle}>{system.title}結果</h2></div>
        <div style={actionRow}>
          <button style={iconButton(system)} onClick={toggleFavorite} title="收藏"><Heart size={18} fill={favorites.some((item) => item.historyId === result.id) ? system.accent : 'none'} /></button>
          <button style={iconButton(system)} onClick={() => setShowPromptMenu((open) => !open)} title="複製 prompt"><Copy size={18} /></button>
          {showPromptMenu && (
            <div style={promptMenu(system)}>
              {AI_TARGETS.map((target) => <button key={target.label} onClick={() => copyPrompt(target.url)}>{target.label}<ExternalLink size={13} /></button>)}
              <button onClick={runAiReading} disabled={isAiReading}><Bot size={14} /> {isAiReading ? 'AI 判讀中' : 'AI 判讀'}</button>
            </div>
          )}
        </div>
      </div>
      {systemKey === 'ziwei' && <ZiWeiResult data={result.data} system={system} />}
      {systemKey === 'bazi' && <BaZiResult data={result.data} system={system} />}
      {systemKey === 'astrology' && <AstrologyResult data={result.data} system={system} />}
      {result.report && <pre style={reportBox(system)}>{result.report}</pre>}
    </>
  );
}

function ChartParticleField({ systemKey }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frameId;
    let particles = [];
    let tick = 0;
    const colors = {
      astrology: ['#ffffff', '#50fa7b', '#d4af37'],
      ziwei: ['#ffffff', '#00ccff', '#7fd4f7'],
      bazi: ['#ffffff', '#ffcc00', '#f3d18a']
    }[systemKey] || ['#ffffff', '#d4af37'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(window.innerHeight, 720);
      particles = Array.from({ length: 520 }, () => ({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * canvas.width,
        speed: 0.16 + Math.random() * 0.34,
        size: 0.45 + Math.random() * 1.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.18 + Math.random() * 0.62
      }));
    };

    const render = () => {
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.46;
      tick += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const aura = ctx.createRadialGradient(cx, cy, 10, cx, cy, canvas.width * 0.52);
      aura.addColorStop(0, systemKey === 'ziwei' ? 'rgba(0,204,255,0.18)' : systemKey === 'bazi' ? 'rgba(255,204,0,0.17)' : 'rgba(80,250,123,0.18)');
      aura.addColorStop(0.4, 'rgba(255,255,255,0.035)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.z -= particle.speed;
        if (particle.z <= 0) {
          particle.x = (Math.random() - 0.5) * canvas.width * 2;
          particle.y = (Math.random() - 0.5) * canvas.height * 2;
          particle.z = canvas.width;
        }

        const depth = 150 / particle.z;
        const x = particle.x * depth + cx + Math.sin(tick + particle.y * 0.004) * 8;
        const y = particle.y * depth + cy;
        if (x < -20 || x > canvas.width + 20 || y < -20 || y > canvas.height + 20) return;

        ctx.globalAlpha = particle.alpha * Math.max(0.12, 1 - particle.z / canvas.width);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(x, y, particle.size * (0.7 + depth * 1.4), 0, Math.PI * 2);
        ctx.fill();
      });

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
  }, [systemKey]);

  return <canvas ref={canvasRef} style={chartParticleCanvas} />;
}

function AstrologyRiteForm({ system, form, updateField, submitChart }) {
  return (
    <motion.form
      key="astrology-rite-form"
      className="astrology-rite-form"
      style={astrologyRiteStage}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      onSubmit={submitChart}
    >
      <ChartParticleField systemKey="astrology" />
      <div style={astrologyRiteIntro}>
        推演十二宮，洞悉你的人生藍圖
      </div>

      <div style={astrologyPlateStage}>
        <img
          src={enginePlateSrc('astrology')}
          alt=""
          style={astrologyPlateImage}
        />
        <span style={astrologyPlateGlow} />
      </div>

      <div style={{ ...astrologyFieldSlot, left: '16%', top: '15%' }}>
        <AstrologyRiteInput icon={<User size={25} />} label="姓名" value={form.name} onChange={(value) => updateField('name', value)} placeholder="輸入姓名" />
      </div>
      <div style={{ ...astrologyFieldSlot, right: '16%', top: '15%' }}>
        <AstrologyRiteInput icon={<MapPin size={24} />} label="出生地（選填）" value={form.birthPlace} onChange={(value) => updateField('birthPlace', value)} placeholder="輸入出生地..." />
      </div>
      <div style={{ ...astrologyFieldSlot, left: '12%', top: '35.5%' }}>
        <AstrologyRiteInput icon={<CalendarDays size={24} />} label="出生日期" value={form.birthDate} onChange={(value) => updateField('birthDate', value)} placeholder="年/月/日" />
      </div>
      <div style={{ ...astrologyFieldSlot, right: '12%', top: '35.5%' }}>
        <AstrologyRiteInput icon={<Clock size={24} />} label="出生時間（選填）" value={form.birthTime} onChange={(value) => updateField('birthTime', value)} placeholder="HH : MM" />
      </div>
      <div style={{ ...astrologyFieldSlot, left: '15.5%', top: '55%' }}>
        <AstrologyRiteSelect icon={<VenusAndMars size={25} />} label="性別" value={form.gender} onChange={(value) => updateField('gender', value)} />
      </div>
      <div style={{ ...astrologyFieldSlot, right: '15.5%', top: '55%' }}>
        <AstrologyRiteInput icon={<Compass size={24} />} label="想問的方向（選填）" value={form.question} onChange={(value) => updateField('question', value)} placeholder="感情、事業、決策、人生方向..." maxLength={120} />
      </div>

      <motion.button
        type="submit"
        className="astrology-rite-button"
        style={astrologyRiteButton}
        whileHover={{ y: -2, filter: 'brightness(1.1)', boxShadow: `0 0 34px ${system.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.16)` }}
        whileTap={{ scale: 0.95 }}
      >
        ✦ 開始推演 ✦
      </motion.button>
    </motion.form>
  );
}
function ZiweiRiteForm({ system, form, updateField, submitChart }) {
  return (
    <motion.form
      key="ziwei-rite-form"
      className="astrology-rite-form ziwei-rite-form"
      style={astrologyRiteStage}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      onSubmit={submitChart}
    >
      <ChartParticleField systemKey="ziwei" />
      <div style={ziweiRiteIntro}>
        星斗佈局，盡覽十二宮奧秘
      </div>

      <div style={ziweiPlateStage}>
        <img src={enginePlateSrc('ziwei')} alt="" style={ziweiPlateImage} />
        <span style={ziweiPlateGlow} />
      </div>

      <div style={{ ...ziweiFieldSlot, left: '14%', top: '16%' }}>
        <AstrologyRiteInput icon={<User size={25} />} label="姓名" value={form.name} onChange={(v) => updateField('name', v)} placeholder="輸入姓名" />
      </div>
      <div style={{ ...ziweiFieldSlot, right: '14%', top: '16%' }}>
        <AstrologyRiteInput icon={<MapPin size={24} />} label="出生地（選填）" value={form.birthPlace} onChange={(v) => updateField('birthPlace', v)} placeholder="輸入城市或國家" />
      </div>
      <div style={{ ...ziweiFieldSlot, left: '9.5%', top: '36.8%' }}>
        <AstrologyRiteInput icon={<CalendarDays size={24} />} label="出生日期" value={form.birthDate} onChange={(v) => updateField('birthDate', v)} placeholder="年/月/日" />
      </div>
      <div style={{ ...ziweiFieldSlot, right: '9.5%', top: '36.8%' }}>
        <AstrologyRiteInput icon={<Clock size={24} />} label="出生時間（選填）" value={form.birthTime} onChange={(v) => updateField('birthTime', v)} placeholder="HH : MM" />
      </div>
      <div style={{ ...ziweiFieldSlot, left: '14%', top: '58.7%' }}>
        <AstrologyRiteSelect icon={<VenusAndMars size={25} />} label="性別" value={form.gender} onChange={(v) => updateField('gender', v)} />
      </div>
      <div style={{ ...ziweiFieldSlot, right: '14%', top: '58.7%' }}>
        <AstrologyRiteInput icon={<Compass size={24} />} label="想問的方向（選填）" value={form.question} onChange={(v) => updateField('question', v)} placeholder="感情、事業、流年、人生方向..." maxLength={120} />
      </div>

      <motion.button
        type="submit"
        style={ziweiRiteButton}
        whileHover={{ y: -2, filter: 'brightness(1.1)', boxShadow: '0 0 34px rgba(0,204,255,0.42), inset 0 1px 0 rgba(255,255,255,0.16)' }}
        whileTap={{ scale: 0.98 }}
      >
        ✦ 開始推演 ✦
      </motion.button>
    </motion.form>
  );
}
function BaziRiteForm({ system, form, updateField, submitChart }) {
  return (
    <motion.form
      key="bazi-rite-form"
      className="astrology-rite-form bazi-rite-form"
      style={astrologyRiteStage}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      onSubmit={submitChart}
    >
      <ChartParticleField systemKey="bazi" />
      <div style={baziRiteIntro}>
        八字定命局，大運論起伏
      </div>

      <div style={baziPlateStage}>
        <img src={enginePlateSrc('bazi')} alt="" style={baziPlateImage} />
        <span style={baziPlateGlow} />
      </div>

      <div style={{ ...baziFieldSlot, left: '13%', top: '20%' }}>
        <AstrologyRiteInput icon={<User size={28} />} label="姓名" value={form.name} onChange={(v) => updateField('name', v)} placeholder="輸入姓名" />
      </div>

      <div style={{ ...baziFieldSlot, right: '12.2%', top: '20%' }}>
        <AstrologyRiteInput icon={<MapPin size={24} />} label="出生地（選填）" value={form.birthPlace} onChange={(v) => updateField('birthPlace', v)} placeholder="輸入城市或國家" />
      </div>

      <div style={{ ...baziFieldSlot, left: '13%', top: '34.5%' }}>
        <AstrologyRiteInput icon={<CalendarDays size={24} />} label="出生日期" value={form.birthDate} onChange={(v) => updateField('birthDate', v)} placeholder="年/月/日" />
      </div>

      <div style={{ ...baziFieldSlot, right: '12.2%', top: '34.5%' }}>
        <AstrologyRiteInput icon={<Clock size={24} />} label="出生時間（選填）" value={form.birthTime} onChange={(v) => updateField('birthTime', v)} placeholder="HH : MM" />
      </div>

      <div style={{ ...baziFieldSlot, left: '7%', top: '50%' }}>
        <AstrologyRiteSelect icon={<VenusAndMars size={25} />} label="性別" value={form.gender} onChange={(v) => updateField('gender', v)} />
      </div>

      <div style={{ ...baziFieldSlot, right: '6%', top: '50%' }}>
        <AstrologyRiteInput icon={<Compass size={24} />} label="想問的方向（選填）" value={form.question} onChange={(v) => updateField('question', v)} placeholder="感情、事業、流年、人生方向..." maxLength={120} />
      </div>

      <motion.button
        type="submit"
        style={baziRiteButton}
        whileHover={{
          y: -2,
          filter: 'brightness(1.2)',
          boxShadow: '0 0 38px rgba(255,204,0,0.46), inset 0 1px 0 rgba(255,255,255,0.16)'
        }}
        whileTap={{ scale: 0.9 }}
      >
        ✦ 開始推演 ✦
      </motion.button>
    </motion.form>
  );
}


function AstrologyRiteInput({ icon, label, value, onChange, placeholder, type = 'text', maxLength }) {
  const inputRef = useRef(null);

  const handleIconClick = () => {
    if (type === 'date' || type === 'time') {
      inputRef.current?.showPicker?.();
    }
  };

  return (
    <label style={astrologyInputLabel}>
      <span>{label}</span>
      <span className="astrology-rite-control" style={astrologyInputShell}>
        <img src={ASTRO_FRAME_SRC} alt="" style={astrologyFrameImage} />
        <span
          style={{
            ...astrologyInputIcon,
            cursor: (type === 'date' || type === 'time') ? 'pointer' : 'default'
          }}
          onClick={handleIconClick}
        >
          {icon}
        </span>
        <input
          ref={inputRef}
          type={type}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          style={astrologyInput}
          autoComplete="off"
        />
        {maxLength && <small style={astrologyInputCount}>{String(value || '').length} / {maxLength}</small>}
      </span>
    </label>
  );
}

function AstrologyRiteSelect({ icon, label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const options = [
    { value: 'female', label: '女性' },
    { value: 'male', label: '男性' },
    { value: 'other', label: '其他' }
  ];
  const selected = options.find((option) => option.value === value);

  return (
    <label style={astrologyInputLabel}>
      <span>{label}</span>
      <span className="astrology-rite-control astrology-rite-select-control" style={astrologyInputShell}>
        <img src={ASTRO_FRAME_SRC} alt="" style={astrologyFrameImage} />
        <span style={astrologyInputIcon}>{icon}</span>
        <button
          type="button"
          className="astrology-rite-select-trigger"
          style={astrologySelectTrigger}
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{selected?.label || '選擇性別'}</span>
          <ChevronDown size={18} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 180ms ease' }} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              role="listbox"
              style={astrologySelectMenu}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  className={value === option.value ? 'selected' : ''}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  {value === option.value && <Check size={15} />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </span>
    </label>
  );
}

function Input({ label, type = 'text', value, onChange, placeholder }) {
  return <label style={fieldLabel}>{label}<input style={inputStyle} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function GridLoading({ systemKey }) {
  const count = systemKey === 'ziwei' ? 12 : 16;
  return <div className={`chart-loading ${systemKey}-loading`}>{Array.from({ length: count }, (_, index) => <span key={index} style={{ '--delay': `${index * 0.05}s` }} />)}</div>;
}

function AstroLoading() {
  return <div className="astro-wheel-loading">{SIGNS.map((sign, index) => <span key={sign} style={{ '--i': index }}>{sign}</span>)}</div>;
}

function ZiWeiResult({ data, system }) {
  const [flow, setFlow] = useState('流年');
  return <div><div style={segmented(system)}>{['流年', '流月', '流日'].map((item) => <button key={item} className={flow === item ? 'active' : ''} onClick={() => setFlow(item)}>{item}</button>)}</div><div style={ziweiGrid}>{data.palaces.map((palace) => <div key={palace.palace} style={palaceCell(system)}><b>{palace.palace}</b><span>{palace.main}</span><small>{palace.aux} · {palace.stem}{palace.branch}</small><em>{flow} {palace.decade}</em></div>)}</div></div>;
}

function BaZiResult({ data, system }) {
  return <div style={{ display: 'grid', gap: 18 }}><div style={infoGrid}>{data.info.map(([label, value]) => <div key={label} style={infoCell(system)}><small>{label}</small><b>{value}</b></div>)}</div><table style={tableStyle}><thead><tr><th>乾造</th>{data.pillars.map((pillar) => <th key={pillar.name}>{pillar.name}</th>)}</tr></thead><tbody><tr><th>主星</th>{data.pillars.map((pillar) => <td key={pillar.name}>{pillar.god}</td>)}</tr><tr><th>天干</th>{data.pillars.map((pillar) => <td key={pillar.name}><b>{pillar.stem}</b></td>)}</tr><tr><th>地支</th>{data.pillars.map((pillar) => <td key={pillar.name}><b>{pillar.branch}</b></td>)}</tr><tr><th>藏干</th>{data.pillars.map((pillar) => <td key={pillar.name}>{pillar.hidden}</td>)}</tr><tr><th>地勢</th>{data.pillars.map((pillar) => <td key={pillar.name}>{pillar.phase}</td>)}</tr></tbody></table><div style={luckGrid}>{data.luck.map((luck) => <div key={luck.age} style={infoCell(system)}><small>{luck.age}歲</small><b>{luck.stem}{luck.branch}</b><span>{luck.note}</span></div>)}</div></div>;
}

function AstrologyResult({ data }) {
  return <div style={astroWrap}><div className="astro-result-wheel">{SIGNS.map((sign, index) => <span key={sign} style={{ '--i': index }}>{sign}</span>)}</div><table style={tableStyle}><thead><tr><th>行星</th><th>星座</th><th>度數</th><th>宮位</th><th>相位</th></tr></thead><tbody>{data.planets.map((planet) => <tr key={planet.planet}><td>{planet.planet}</td><td>{planet.sign}</td><td>{planet.degree}</td><td>{planet.house}</td><td>{planet.aspect}</td></tr>)}</tbody></table></div>;
}

const shell = (system, view, systemKey) => ({
  width: view === 'history' ? 'calc(100vw - 80px)' : (CELESTIAL_SYSTEMS.has(systemKey) ? '100%' : 'min(1260px, 94vw)'),
  margin: view === 'history' ? '16px 40px 0' : '0 auto',
  height: view === 'history' ? 'calc(100vh - 118px)' : (CELESTIAL_SYSTEMS.has(systemKey) ? 'calc(100vh - 80px)' : 'calc(100vh - 92px)'),
  minHeight: 0,
  position: 'relative',
  padding: view === 'history' || CELESTIAL_SYSTEMS.has(systemKey) ? '0' : '18px 0',
  border: 'none',
  borderRadius: 0,
  background: 'transparent',
  boxShadow: 'none',
  overflow: 'hidden'
});
const astrologyRiteStage = {
  position: 'relative',
  width: 'min(1520px, calc(100vw - 60px))',
  height: 'calc(100vh - 80px)',
  minHeight: 650,
  margin: '0 auto',
  overflow: 'hidden',
  isolation: 'isolate',
  fontFamily: "'Noto Serif TC', 'Microsoft JhengHei', serif"
};
const chartParticleCanvas = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  pointerEvents: 'none',
  opacity: 0.88,
  mixBlendMode: 'screen'
};
const astrologyRiteIntro = {
  position: 'absolute',
  left: '50%',
  top: '42px',
  transform: 'translateX(-50%)',
  zIndex: 4,
  color: '#f3d18a',
  fontSize: '1rem',
  letterSpacing: '0.2em',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  textShadow: '0 0 18px rgba(212,175,55,0.28)'
};
const astrologyPlateStage = {
  position: 'absolute',
  left: '50%',
  top: '45%',
  width: 'min(425px, 225vw)',
  aspectRatio: '1',
  transform: 'translate(-50%, -50%)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 1,
  pointerEvents: 'none'
};
const astrologyPlateImage = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  mixBlendMode: 'screen',
  filter: 'brightness(0.82) saturate(1.12) sepia(0.12) drop-shadow(0 0 28px rgba(80,250,123,0.25)) drop-shadow(0 22px 50px rgba(0,0,0,0.36))',
  opacity: 0.92
};
const astrologyPlateGlow = {
  position: 'absolute',
  inset: '20%',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,246,196,0.38), rgba(80,250,123,0.16) 28%, transparent 68%)',
  filter: 'blur(18px)',
  mixBlendMode: 'screen',
  zIndex: -1
};
const astrologyFieldSlot = {
  position: 'absolute',
  zIndex: 5,
  width: 'min(360px, 26vw)'
};
const ziweiFieldSlot = {
  position: 'absolute',
  zIndex: 5,
  width: 'min(360px, 26vw)'
};
const baziFieldSlot = {
  position: 'absolute',
  zIndex: 5,
  width: 'min(360px, 26vw)'
};
const astrologyInputLabel = {
  display: 'grid',
  gap: '10px',
  color: '#f3d18a',
  fontSize: '0.92rem',
  letterSpacing: '0.12em',
  textAlign: 'left'
};
const astrologyInputShell = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  height: 60,
  borderRadius: 999,
  border: 'none',
  background: 'rgba(0, 10, 8, 0.45)',
  overflow: 'visible',
  transition: 'background 200ms ease'
};
const astrologyFrameImage = {
  position: 'absolute',
  inset: '-20px -34px',
  width: 'calc(100% + 68px)',
  height: 'calc(100% + 40px)',
  objectFit: 'fill',
  pointerEvents: 'none',
  opacity: 0.82,
  filter: 'drop-shadow(0 0 10px rgba(80,250,123,0.2))',
  zIndex: 0
};
const astrologyInputIcon = {
  position: 'relative',
  zIndex: 1,
  flex: '0 0 50px',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#f3d18a',
  borderRight: '1px solid rgba(212,175,55,0.32)'
};
const astrologyInput = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  minWidth: 0,
  height: '100%',
  border: 0,
  outline: 'none',
  background: 'transparent',
  color: 'rgba(255,255,255,0.9)',
  fontSize: '0.9rem',
  letterSpacing: '0.08em',
  padding: '0 18px',
  fontFamily: "'Noto Serif TC', 'Microsoft JhengHei', serif",
  appearance: 'none'
};
const astrologyInputCount = {
  position: 'absolute',
  right: '14px',
  bottom: '8px',
  color: 'rgba(255,255,255,0.52)',
  fontSize: '0.68rem',
  letterSpacing: '0.08em'
};
const astrologyRiteButton = {
  position: 'absolute',
  left: '50%',
  bottom: '80px',
  transform: 'translateX(-50%)',
  zIndex: 6,
  width: 'min(330px, 25vw)',
  height: 45,
  borderRadius: 6,
  border: '1px solid rgba(212,175,55,0.7)',
  background: 'linear-gradient(90deg, rgba(6,40,24,0.92), rgba(2,18,12,0.96), rgba(6,40,24,0.92))',
  color: '#f6ead2',
  fontSize: '1.05rem',
  letterSpacing: '0.18em',
  fontFamily: "'Noto Serif TC', 'Microsoft JhengHei', serif",
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 18,
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -20px 38px rgba(0,0,0,0.26), 0 0 26px rgba(80,250,123,0.18)',
  overflow: 'hidden'
};
const astrologyButtonFrame = {
  position: 'absolute',
  inset: '-22px -42px',
  width: 'calc(100% + 84px)',
  height: 'calc(100% + 44px)',
  objectFit: 'fill',
  pointerEvents: 'none',
  opacity: 0.92,
  zIndex: -1,
  filter: 'drop-shadow(0 0 12px rgba(80,250,123,0.24))'
};
const astrologySelectTrigger = {
  position: 'relative',
  zIndex: 2,
  width: '100%',
  height: '100%',
  border: 0,
  outline: 'none',
  background: 'transparent',
  color: 'rgba(255,255,255,0.9)',
  fontSize: '0.93rem',
  letterSpacing: '0.08em',
  padding: '0 18px',
  fontFamily: "'Noto Serif TC', 'Microsoft JhengHei', serif",
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  textAlign: 'left'
};
const astrologySelectMenu = {
  position: 'absolute',
  top: 'calc(100% + 10px)',
  left: 58,
  right: 14,
  zIndex: 20,
  display: 'grid',
  padding: 8,
  borderRadius: 10,
  border: '1px solid rgba(80,250,123,0.55)',
  background: 'linear-gradient(180deg, rgba(2,29,21,0.98), rgba(0,9,8,0.98))',
  boxShadow: '0 18px 36px rgba(0,0,0,0.52), inset 0 0 20px rgba(80,250,123,0.08)'
};
const formPanel = (system) => ({ maxWidth: 780, margin: '0 auto', padding: 34, borderRadius: 8, border: `1px solid ${system.accentSoft}`, background: 'rgba(4,2,10,0.74)', boxShadow: `0 0 42px ${system.accentSoft}` });
const celestialFormStage = (system, systemKey) => {
  const isZiwei = systemKey === 'ziwei';
  const isBazi = systemKey === 'bazi';
  return {
    position: 'relative',
    height: 'calc(100vh - 80px)',
    width: 'min(1510px, calc(100vw - 72px))',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: isBazi
      ? 'minmax(610px, 1.03fr) minmax(560px, 0.92fr)'
      : isZiwei
        ? 'minmax(560px, 0.95fr) minmax(620px, 1fr)'
        : 'minmax(650px, 1fr) minmax(560px, 0.92fr)',
    alignItems: 'start',
    gap: isBazi ? 'clamp(36px, 4.4vw, 74px)' : 'clamp(42px, 5vw, 82px)',
    padding: isBazi ? '36px 0 34px' : isZiwei ? '30px 0 34px' : '34px 0 34px',
    boxSizing: 'border-box',
    overflowX: 'hidden',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    background: 'transparent'
  };
};
const astroLeftPane = (systemKey) => {
  const isZiwei = systemKey === 'ziwei';
  const isBazi = systemKey === 'bazi';
  return {
    position: 'relative',
    minHeight: 'calc(100vh - 128px)',
    display: 'grid',
    alignContent: isBazi ? 'center' : 'start',
    justifyItems: isBazi ? 'center' : 'center',
    textAlign: isBazi ? 'left' : 'center',
    paddingTop: isBazi ? 0 : isZiwei ? 20 : 28,
    zIndex: 1
  };
};
const astroRightPane = (systemKey) => {
  const isZiwei = systemKey === 'ziwei';
  const isBazi = systemKey === 'bazi';
  return {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: isBazi ? '16px 24px' : '17px 26px',
    alignItems: 'start',
    alignSelf: 'start',
    marginTop: isBazi ? 82 : isZiwei ? 32 : 74,
    maxHeight: 'calc(100vh - 132px)',
    overflowY: 'auto',
    padding: isBazi ? '26px 30px 28px' : '28px 34px 30px',
    border: '1px solid color-mix(in srgb, var(--accent) 44%, transparent)',
    borderRadius: 2,
    background: [
      'linear-gradient(135deg, color-mix(in srgb, var(--accent) 9%, transparent), rgba(0,0,0,0.42) 38%, rgba(0,0,0,0.18))',
      'radial-gradient(circle at 14% 0%, rgba(255,255,255,0.10), transparent 30%)',
      'radial-gradient(circle at 88% 24%, color-mix(in srgb, var(--accent) 17%, transparent), transparent 34%)'
    ].join(', '),
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.10)',
      'inset 0 -24px 56px rgba(0,0,0,0.34)',
      '0 0 30px color-mix(in srgb, var(--accent) 11%, transparent)'
    ].join(', '),
    backdropFilter: 'blur(7px) saturate(1.18)'
  };
};
const astroTitle = (systemKey) => ({
  margin: '10px 0 12px',
  color: '#f4ead4',
  fontSize: systemKey === 'bazi'
    ? 'clamp(3rem, 4.6vw, 5rem)'
    : systemKey === 'ziwei'
      ? 'clamp(2.2rem, 3vw, 3.35rem)'
      : 'clamp(2.6rem, 3.8vw, 4.1rem)',
  lineHeight: 1,
  letterSpacing: systemKey === 'bazi' ? '0.14em' : '0.16em',
  fontFamily: "'Noto Serif TC', serif",
  textShadow: '0 0 18px rgba(255,255,255,0.18), 0 0 30px color-mix(in srgb, var(--accent) 16%, transparent)'
});
const astroLead = (systemKey) => ({
  margin: 0,
  maxWidth: systemKey === 'bazi' ? 560 : 620,
  color: 'rgba(255,255,255,0.76)',
  fontFamily: "'Noto Serif TC', sans-serif",
  letterSpacing: '0.06em',
  lineHeight: 1.72,
  fontSize: systemKey === 'bazi' ? '0.96rem' : '0.93rem'
});
const astroDivider = (systemKey) => ({
  width: systemKey === 'bazi' ? 360 : 430,
  maxWidth: '72%',
  height: 1,
  margin: systemKey === 'bazi' ? '22px 0 16px' : '22px 0 10px',
  background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.82), var(--accent), rgba(212,175,55,0.72), transparent)'
});
const starPlateImage = (system, systemKey) => ({
  width: systemKey === 'bazi'
    ? 'min(700px, 40vw)'
    : systemKey === 'ziwei'
      ? 'min(610px, 39vw)'
      : 'min(720px, 43vw)',
  maxHeight: systemKey === 'bazi' ? '60vh' : systemKey === 'ziwei' ? '54vh' : '58vh',
  marginTop: systemKey === 'bazi' ? 2 : systemKey === 'ziwei' ? 6 : 8,
  objectFit: 'contain',
  filter: `drop-shadow(0 0 30px ${system.accentGlow}) drop-shadow(0 18px 48px rgba(0,0,0,0.34))`,
  mixBlendMode: systemKey === 'bazi' ? 'normal' : 'screen',
  transform: systemKey === 'bazi' ? 'translateX(-20px)' : 'none'
});
const astroSubmitButton = { gridColumn: '1 / -1', marginTop: 8, height: 58, borderRadius: 5, border: '1px solid color-mix(in srgb, var(--accent) 68%, rgba(212,175,55,0.48))', background: 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 16%, transparent), rgba(0,0,0,0.2), color-mix(in srgb, var(--accent) 16%, transparent))', color: '#f4ead4', fontFamily: "'Cinzel', serif", fontSize: '1rem', letterSpacing: '0.22em', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -18px 36px rgba(0,0,0,0.32), 0 0 24px color-mix(in srgb, var(--accent) 15%, transparent)', transition: 'transform 180ms ease, background 180ms ease, box-shadow 180ms ease, border-color 180ms ease, filter 180ms ease' };
const headline = { marginBottom: 26 };
const eyebrow = (system) => ({ color: system.accent, letterSpacing: '0.28em', fontSize: '0.72rem', textTransform: 'uppercase' });
const titleStyle = { margin: '8px 0 10px', color: '#fff', fontFamily: 'Cinzel, serif', fontSize: 'clamp(2rem, 5vw, 4.3rem)', letterSpacing: '0.08em' };
const lead = { color: 'rgba(255,255,255,0.66)', lineHeight: 1.8, maxWidth: 640 };
const fieldGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 };
const fieldLabel = { display: 'grid', gap: 7, color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', letterSpacing: '0.08em', fontFamily: "'Noto Serif TC', sans-serif" };
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: 9,
  border: '1px solid color-mix(in srgb, var(--accent) 24%, rgba(255,255,255,0.12))',
  background: 'linear-gradient(180deg, rgba(0,0,0,0.52), rgba(0,0,0,0.34))',
  color: '#fff',
  padding: '12px 14px',
  outline: 'none',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -14px 24px rgba(0,0,0,0.18)',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, background 180ms ease'
};
const primaryButton = (system) => ({ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 10, border: `1px solid ${system.accent}`, background: `linear-gradient(180deg, ${system.accentSoft}, rgba(0,0,0,0.52))`, color: '#fff', borderRadius: 6, padding: '13px 24px', cursor: 'pointer', letterSpacing: '0.14em' });
const loadingPanel = (system) => ({ minHeight: 520, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 24, position: 'relative' });
const scanAura = (system) => ({ position: 'absolute', width: 520, aspectRatio: 1, borderRadius: '50%', background: `radial-gradient(circle, ${system.accentGlow}, transparent 62%)`, filter: 'blur(12px)', opacity: 0.8 });
const loadingText = { color: 'rgba(255,255,255,0.74)', letterSpacing: '0.16em' };
const resultPanel = (system) => ({
  padding: '34px 32px',
  borderRadius: 8,
  border: `1px solid color-mix(in srgb, ${system.accent} 38%, rgba(212,175,55,0.34))`,
  background: `linear-gradient(135deg, color-mix(in srgb, ${system.accent} 9%, transparent), rgba(0,0,0,0.48) 42%, rgba(0,0,0,0.28))`,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: `inset 0 0 28px ${system.accentSoft}, 0 0 28px color-mix(in srgb, ${system.accent} 12%, transparent)`
});

const ziweiRiteIntro = {
  position: 'absolute',
  left: '50%',
  top: '42px',
  transform: 'translateX(-50%)',
  zIndex: 4,
  color: '#7fd4f7',
  fontSize: '1rem',
  letterSpacing: '0.2em',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  textShadow: '0 0 18px rgba(0,204,255,0.38)'
};

const ziweiPlateStage = {
  position: 'absolute',
  left: '50%',
  top: '46.5%',
  width: 'min(420px, 30vw)',
  aspectRatio: '1',
  transform: 'translate(-50%, -50%)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 1,
  pointerEvents: 'none'
};

const ziweiPlateImage = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  mixBlendMode: 'screen',
  filter: 'brightness(0.9) saturate(1.1) drop-shadow(0 0 28px rgba(0,204,255,0.3)) drop-shadow(0 22px 50px rgba(0,0,0,0.36))',
  opacity: 0.95
};

const ziweiPlateGlow = {
  position: 'absolute',
  inset: '20%',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(100,200,255,0.28), rgba(0,204,255,0.14) 28%, transparent 68%)',
  filter: 'blur(18px)',
  mixBlendMode: 'screen',
  zIndex: -1
};

const ziweiRiteButton = {
  position: 'absolute',
  left: '39%',
  bottom: '58px',
  transform: 'translateX(-50%)',
  zIndex: 6,
  width: 'min(320px, 25vw)',
  height: 50,
  borderRadius: 6,
  border: '1px solid rgba(0,180,255,0.7)',
  background: 'linear-gradient(90deg, rgba(0,30,60,0.92), rgba(0,12,28,0.96), rgba(0,30,60,0.92))',
  color: '#d4f0ff',
  fontSize: '1.05rem',
  letterSpacing: '0.18em',
  fontFamily: "'Noto Serif TC', 'Microsoft JhengHei', serif",
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 18,
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 0 26px rgba(0,204,255,0.18)',
  overflow: 'hidden',
};

const baziRiteIntro = {
  ...ziweiRiteIntro,
  color: '#f3d18a',
  textShadow: '0 0 18px rgba(255,204,0,0.42)'
};

const baziPlateStage = {
  ...ziweiPlateStage,
  width: 'min(520px, 34vw)'
};

const baziPlateImage = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  mixBlendMode: 'screen',
  filter: 'brightness(1.05) saturate(1.15) drop-shadow(0 0 30px rgba(255,204,0,0.36)) drop-shadow(0 22px 50px rgba(0,0,0,0.36))',
  opacity: 0.96
};

const baziPlateGlow = {
  position: 'absolute',
  inset: '18%',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,226,140,0.34), rgba(255,204,0,0.16) 30%, transparent 70%)',
  filter: 'blur(20px)',
  mixBlendMode: 'screen',
  zIndex: -1
};

const baziRiteButton = {
  position: 'absolute',
  left: '39%',
  bottom: '70px',
  transform: 'translateX(-50%)',
  zIndex: 6,
  width: 'min(320px, 25vw)',
  height: 50,
  borderRadius: 6,
  fontSize: '1.05rem',
  letterSpacing: '0.18em',
  fontFamily: "'Noto Serif TC', 'Microsoft JhengHei', serif",
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 18,
  cursor: 'pointer',
  overflow: 'hidden',
  border: '1px solid rgba(255,204,0,0.76)',
  background: 'linear-gradient(90deg, rgba(72,45,5,0.92), rgba(18,12,4,0.96), rgba(72,45,5,0.92))',
  color: '#fff2c8',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 0 28px rgba(255,204,0,0.24)'
};
const resultHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginBottom: 22 };
const resultTitle = { margin: '6px 0 0', color: '#fff', fontSize: '2rem', fontFamily: 'Cinzel, serif' };
const actionRow = { position: 'relative', display: 'flex', gap: 8 };
const iconButton = (system) => ({ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 6, border: `1px solid ${system.accentSoft}`, background: 'rgba(0,0,0,0.34)', color: system.accent, cursor: 'pointer' });
const promptMenu = (system) => ({ position: 'absolute', right: 0, top: 46, zIndex: 10, display: 'grid', minWidth: 170, padding: 8, borderRadius: 6, border: `1px solid ${system.accentSoft}`, background: 'rgba(5,3,12,0.94)', boxShadow: `0 16px 36px rgba(0,0,0,0.45)` });
const segmented = (system) => ({ display: 'inline-flex', gap: 4, padding: 4, marginBottom: 16, border: `1px solid ${system.accentSoft}`, borderRadius: 999, background: 'rgba(0,0,0,0.28)' });
const ziweiGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 };
const palaceCell = (system) => ({ minHeight: 124, display: 'grid', alignContent: 'space-between', padding: 12, borderRadius: 6, border: `1px solid ${system.accentSoft}`, background: `linear-gradient(145deg, ${system.accentSoft}, rgba(0,0,0,0.3))`, color: '#fff' });
const infoGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 };
const infoCell = (system) => ({ display: 'grid', gap: 4, padding: 14, borderRadius: 6, border: `1px solid ${system.accentSoft}`, background: 'rgba(255,255,255,0.035)', color: '#fff' });
const tableStyle = { width: '100%', borderCollapse: 'collapse', color: 'rgba(255,255,255,0.82)' };
const luckGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 };
const astroWrap = { display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: 22, alignItems: 'start' };
const historyLayout = { display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 25, alignItems: 'stretch', width: '100%', height: 'calc(100vh - 118px)' };
const historySidebar = (system) => ({ minHeight: 0, padding: 20, borderRadius: 8, border: `1px solid ${system.accentSoft}`, background: 'rgba(4,2,9,0.38)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.035)', display: 'flex', flexDirection: 'column', gap: 12 });
const historyContent = (system) => ({ minHeight: 0, padding: 40, borderRadius: 8, border: `1px solid ${system.accentSoft}`, background: 'rgba(3,1,8,0.22)', boxShadow: `inset 0 0 28px ${system.accentSoft}`, overflow: 'auto' });
const sidebarTitle = (system) => ({ color: system.accent, letterSpacing: '0.32em', fontSize: '0.78rem', padding: '2px 4px 12px', textTransform: 'uppercase' });
const historySearchInput = (system) => ({ width: '100%', boxSizing: 'border-box', height: 44, borderRadius: 6, border: `1px solid ${system.accentSoft}`, background: 'rgba(255,255,255,0.045)', color: '#fff', padding: '0 14px', outline: 'none', letterSpacing: '0.08em' });
const historyItem = (system, active) => ({ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '14px 16px', borderRadius: 6, border: `1px solid ${active ? system.accent : system.accentSoft}`, background: active ? system.accentSoft : 'rgba(0,0,0,0.24)', color: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'background 180ms ease, border-color 180ms ease, transform 180ms ease' });
const historyEmptyCenter = { minHeight: 560, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.36)', letterSpacing: '0.22em' };
const emptyState = { padding: '80px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.58)' };
const reportBox = (system) => ({ whiteSpace: 'pre-wrap', marginTop: 18, padding: 16, borderRadius: 6, border: `1px solid ${system.accentSoft}`, background: 'rgba(0,0,0,0.32)', color: 'rgba(255,255,255,0.82)', lineHeight: 1.8 });

const toolCSS = (system) => `
  .mystic-chart-tool button { font-family: inherit; }
  .mystic-chart-tool select, .mystic-chart-tool input, .mystic-chart-tool textarea { font-family: inherit; }
  .mystic-chart-tool button:hover { filter: brightness(1.18); }
  .astrology-rite-form .astrology-rite-control:focus-within,
  .astrology-rite-form .astrology-rite-control:hover {
    background: rgba(0, 10, 8, 0.48) !important;
  }
  .astrology-rite-form .astrology-rite-control:focus-within > img{
    filter: drop-shadow(0 0 20px rgba(80,250,123,0.88))
          drop-shadow(0 0 44px rgba(80,250,123,0.55))
          drop-shadow(0 0 10px rgba(212,175,55,0.46))
          brightness(1.2) !important;
    opacity: 1 !important;
  }
  .astrology-rite-form .astrology-rite-control:hover > img {
    filter: drop-shadow(0 0 14px rgba(80,250,123,0.62))
            drop-shadow(0 0 30px rgba(80,250,123,0.34))
            brightness(1.12) !important;
    opacity: 1 !important;
  }
  .astrology-rite-form .astrology-rite-button:focus-visible,
  .astrology-rite-form .astrology-rite-select-trigger:focus-visible {
    outline: none;
    border-color: rgba(80,250,123,0.95);
    box-shadow:
      0 0 0 1px rgba(80,250,123,0.82),
      0 0 28px rgba(80,250,123,0.42),
      inset 0 0 22px rgba(80,250,123,0.18);
  }
  .astrology-rite-form input[type="date"]::-webkit-calendar-picker-indicator,
  .astrology-rite-form input[type="time"]::-webkit-calendar-picker-indicator {
    display: none !important;
    opacity: 0 !important;
    width: 0 !important;
    height: 0 !important;
  }
  .astrology-rite-form input[type="date"],
  .astrology-rite-form input[type="time"] {
    color-scheme: dark;
    font-family: 'Noto Serif TC', 'Microsoft JhengHei', serif !important;
    font-size: 0.9rem !important;
    letter-spacing: 0.08em !important;
  }
  .astrology-rite-form input::placeholder {
    color: rgba(255,255,255,0.52);
    line-height: normal;
  }
  .astrology-rite-select-control button {
    border-radius: 0 !important;
  }
  .astrology-rite-select-control [role="listbox"] button {
    width: 100%;
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid transparent;
    border-radius: 7px;
    padding: 8px 11px;
    background: transparent;
    color: rgba(255,255,255,0.82);
    cursor: pointer;
    letter-spacing: 0.08em;
    text-align: left;
  }
  .astrology-rite-select-control [role="listbox"] button:hover,
  .astrology-rite-select-control [role="listbox"] button.selected {
    border-color: rgba(212,175,55,0.42);
    background: rgba(80,250,123,0.14);
    color: #f6ead2;
    box-shadow: inset 0 0 16px rgba(80,250,123,0.08);
  }
  .ziwei-rite-form .astrology-rite-control:focus-within > img {
    filter: drop-shadow(0 0 20px rgba(0,204,255,0.88))
            drop-shadow(0 0 44px rgba(0,204,255,0.55))
            brightness(1.2) !important;
    opacity: 1 !important;
  }
  .ziwei-rite-form .astrology-rite-control:hover > img {
    filter: drop-shadow(0 0 14px rgba(0,204,255,0.62))
            drop-shadow(0 0 30px rgba(0,204,255,0.34))
            brightness(1.12) !important;
    opacity: 1 !important;
  }
  .ziwei-rite-form input[type="date"]::-webkit-calendar-picker-indicator,
  .ziwei-rite-form input[type="time"]::-webkit-calendar-picker-indicator {
    display: none !important;
  }
  .ziwei-rite-form .astrology-rite-select-control [role="listbox"] {
    border: 1px solid rgba(0,204,255,0.55) !important;
    background: linear-gradient(180deg, rgba(2,18,29,0.98), rgba(0,8,14,0.98)) !important;
  }
  .ziwei-rite-form .astrology-rite-select-control [role="listbox"] button:hover,
  .ziwei-rite-form .astrology-rite-select-control [role="listbox"] button.selected {
    border-color: rgba(0,204,255,0.42) !important;
    background: rgba(0,204,255,0.14) !important;
    color: #d4f0ff !important;
  }

  .bazi-rite-form .astrology-rite-control:focus-within > img {
    filter: drop-shadow(0 0 20px rgba(255,204,0,0.9))
            drop-shadow(0 0 46px rgba(255,204,0,0.55))
            drop-shadow(0 0 12px rgba(243,209,138,0.48))
            brightness(1.24) !important;
    opacity: 1 !important;
  }

  .bazi-rite-form .astrology-rite-control:hover > img {
    filter: drop-shadow(0 0 16px rgba(255,204,0,0.68))
            drop-shadow(0 0 34px rgba(255,204,0,0.38))
            brightness(1.14) !important;
    opacity: 1 !important;
  }

  .bazi-rite-form .astrology-rite-select-trigger:focus-visible,
  .bazi-rite-form button:focus-visible {
    outline: none;
    border-color: rgba(255,204,0,0.95);
    box-shadow:
      0 0 0 1px rgba(255,204,0,0.82),
      0 0 30px rgba(255,204,0,0.42),
      inset 0 0 22px rgba(255,204,0,0.18);
  }
  .mystic-result-panel::before {
    content: '';
    position: absolute;
    left: 18px;
    right: 18px;
    top: 10px;
    height: 74px;
    pointer-events: none;
    background: url("${ASTRO_FRAME_SRC}") center / 100% 100% no-repeat;
    opacity: 0.34;
    filter: drop-shadow(0 0 12px ${system.accentGlow});
  }
  .mystic-result-panel > * {
    position: relative;
    z-index: 1;
  }
  .mystic-result-panel table th,
  .mystic-result-panel table td {
    border-bottom: 1px solid color-mix(in srgb, var(--accent) 18%, rgba(255,255,255,0.08));
    padding: 10px 9px;
  }
  .mystic-result-panel table th {
    color: #f3d18a;
    letter-spacing: 0.12em;
    font-weight: 600;
  }
  .mystic-celestial-form::before {
    content: '';
    position: absolute;
    inset: -12%;
    pointer-events: none;
    opacity: 0.16;
    mix-blend-mode: screen;
    filter: blur(9px);
    background:
      radial-gradient(ellipse at 28% 42%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 34%),
      radial-gradient(ellipse at 68% 56%, rgba(255,255,255,0.055), transparent 30%),
      linear-gradient(110deg, transparent 0 18%, rgba(255,255,255,0.025) 38%, transparent 58%),
      linear-gradient(74deg, transparent 0 34%, color-mix(in srgb, var(--accent) 5%, transparent) 49%, transparent 66%);
    animation: celestialDustFloat 18s ease-in-out infinite alternate;
  }
  .ziwei-celestial-form::before { opacity: 0.18; }
  .astrology-celestial-form::before { opacity: 0.16; }
  .bazi-celestial-form::before { opacity: 0.15; }
  .mystic-celestial-form::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.1;
    filter: blur(10px);
    background:
      radial-gradient(circle at 18% 72%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 28%),
      radial-gradient(circle at 78% 30%, rgba(255,255,255,0.05), transparent 24%);
  }
  .mystic-celestial-form input:focus,
  .mystic-celestial-form textarea:focus,
  .mystic-celestial-form select:focus {
    border-color: color-mix(in srgb, var(--accent) 62%, white);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.09), 0 0 22px color-mix(in srgb, var(--accent) 22%, transparent);
    background: linear-gradient(180deg, rgba(0,0,0,0.58), rgba(0,0,0,0.38));
  }
  @keyframes celestialDustFloat {
    from { transform: translate3d(-1.8%, 0.8%, 0) scale(1.01); }
    to { transform: translate3d(1.6%, -1.2%, 0) scale(1.04); }
  }
  .mystic-chart-tool div[style*="border-radius: 999"] button {
    border: 0; border-radius: 999px; padding: 8px 16px; background: transparent; color: rgba(255,255,255,0.64); cursor: pointer;
  }
  .mystic-chart-tool div[style*="border-radius: 999"] button.active {
    color: #fff; background: ${system.accentSoft}; box-shadow: 0 0 18px ${system.accentSoft};
  }
  .chart-loading { display: grid; gap: 4px; width: min(520px, 82vw); position: relative; z-index: 1; }
  .ziwei-loading { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .bazi-loading { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .chart-loading span { min-height: 84px; border: 1px solid ${system.accentSoft}; background: rgba(0,0,0,0.35); animation: chartScan 1.2s ease-in-out infinite; animation-delay: var(--delay); }
  .astro-wheel-loading, .astro-result-wheel {
    position: relative; width: 330px; aspect-ratio: 1; border: 1px solid ${system.accent}; border-radius: 50%; margin: 0 auto;
    background: repeating-conic-gradient(from 0deg, rgba(255,255,255,0.11) 0deg 1deg, transparent 1deg 30deg), radial-gradient(circle, ${system.accentSoft}, transparent 58%);
    box-shadow: inset 0 0 30px ${system.accentSoft}, 0 0 26px ${system.accentSoft}; animation: slowSpin 18s linear infinite;
  }
  .astro-wheel-loading span, .astro-result-wheel span {
    position: absolute; left: 50%; top: 50%; transform: rotate(calc(var(--i) * 30deg)) translate(142px) rotate(calc(var(--i) * -30deg)); font-size: 0.72rem; color: rgba(255,255,255,0.76);
  }
  .astrology-rite-form input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(84%) sepia(52%) saturate(439%) hue-rotate(349deg) brightness(101%);
    opacity: 0.9;
    display: block !important;   /* 讓它顯示出來 */
  }
  .mystic-chart-tool table th, .mystic-chart-tool table td { border: 1px solid rgba(255,255,255,0.12); padding: 11px; text-align: center; background: rgba(255,255,255,0.025); }
  .mystic-chart-tool table th { color: var(--accent); background: rgba(255,255,255,0.055); }
  .mystic-chart-tool table b { color: var(--accent); font-size: 1.45rem; }
  @keyframes chartScan {
    0%, 100% { background: rgba(0,0,0,0.35); box-shadow: none; transform: translateZ(0); }
    50% { background: ${system.accentSoft}; box-shadow: 0 0 18px ${system.accent}; transform: translateY(-2px); }
  }
  @keyframes slowSpin { from { rotate: 0deg; } to { rotate: 360deg; } }
  @media (max-width: 900px) {
    .mystic-chart-tool [style*="310px"] { grid-template-columns: 1fr !important; }
    .ziwei-loading, .bazi-loading, .mystic-chart-tool [style*="repeat(4"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .mystic-chart-tool [style*="360px"] { grid-template-columns: 1fr !important; }
  }
`;
