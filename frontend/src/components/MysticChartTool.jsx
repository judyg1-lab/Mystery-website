import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Copy, ExternalLink, Heart, Sparkles } from 'lucide-react';
import MysticModal from './MysticModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const t = (value) => decodeURIComponent(value);

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
    `請以${system.title}專家的角度，根據以下資料做完整命理分析。`,
    `姓名：${form.name}`,
    `性別：${form.gender}`,
    `生日：${form.birthDate}`,
    `時間：${form.birthTime}`,
    `出生地：${form.birthPlace || '未填'}`,
    `提問：${form.question || '請分析整體命運走向'}`,
    '',
    `命盤資料：${JSON.stringify(result.data, null, 2)}`,
    '請分成：核心性格、感情、人際、事業、財務、年度提醒、三個行動建議。'
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

export default function MysticChartTool({ systemKey, view = 'drawing' }) {
  const system = SYSTEMS[systemKey] || SYSTEMS.ziwei;
  const [mode, setMode] = useState('form');
  const [form, setForm] = useState({ name: '', gender: '女', birthDate: '', birthTime: '', birthPlace: '', question: '' });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showPromptMenu, setShowPromptMenu] = useState(false);
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
      return;
    }
    if (mode === 'history') setMode(result ? 'result' : 'form');
  }, [view, mode, result]);

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
    if (!form.name.trim() || !form.birthDate || !form.birthTime) {
      setModal({ title: '資料尚未完整', message: '請先填寫姓名、生日與出生時間，再開始推演。' });
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

  function runAiReading() {
    if (!result) return;
    setResult((current) => ({ ...current, report: createReport(system, activeForm, current) }));
    setShowPromptMenu(false);
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
      />
    );
  }

  return (
    <section className="mystic-chart-tool" style={{ '--accent': system.accent }}>
      <div style={shell(system, view)}>
        <AnimatePresence mode="wait">
          {mode === 'form' && (
            systemKey === 'astrology' ? (
              <motion.form key="astro-form" style={astrologyFormStage} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} onSubmit={submitChart}>
                <div style={astroLeftPane}>
                  <span style={eyebrow(system)}>{system.subtitle}</span>
                  <h1 style={astroTitle}>西洋星盤</h1>
                  <p style={astroLead}>輸入你的出生資料，啟動一張專屬命盤。</p>
                  <div style={astroDivider} />
                  <img src="/assets/astrology/starPlate.png" alt="" style={starPlateImage} />
                </div>
                <div style={astroRightPane}>
                  <Input label="姓名" value={form.name} onChange={(value) => updateField('name', value)} placeholder="輸入姓名" />
                  <label style={fieldLabel}>性別<select style={inputStyle} value={form.gender} onChange={(event) => updateField('gender', event.target.value)}><option>女</option><option>男</option><option>其他</option></select></label>
                  <Input label="出生日期" type="date" value={form.birthDate} onChange={(value) => updateField('birthDate', value)} />
                  <Input label="出生時間" type="time" value={form.birthTime} onChange={(value) => updateField('birthTime', value)} />
                  <label style={{ ...fieldLabel, gridColumn: '1 / -1' }}>出生地<input style={inputStyle} value={form.birthPlace} onChange={(event) => updateField('birthPlace', event.target.value)} placeholder="輸入城市或國家" /></label>
                  <label style={{ ...fieldLabel, gridColumn: '1 / -1' }}>想問的方向<textarea style={{ ...inputStyle, minHeight: 92, resize: 'none' }} maxLength={120} value={form.question} onChange={(event) => updateField('question', event.target.value)} placeholder="感情、事業、流年、人生方向..." /></label>
                  <motion.button style={astroSubmitButton} whileHover={{ y: -2, filter: 'brightness(1.08)' }} whileTap={{ scale: 0.98 }}>
                    <Sparkles size={18} /> 開始推演
                  </motion.button>
                </div>
              </motion.form>
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
                  <Input label="出生日期" type="date" value={form.birthDate} onChange={(value) => updateField('birthDate', value)} />
                  <Input label="出生時間" type="time" value={form.birthTime} onChange={(value) => updateField('birthTime', value)} />
                  <Input label="出生地" value={form.birthPlace} onChange={(value) => updateField('birthPlace', value)} placeholder="城市或國家" />
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
            <motion.div key="result" style={resultPanel(system)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
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

function ResultView({ systemKey, system, result, favorites, showPromptMenu, setShowPromptMenu, toggleFavorite, copyPrompt, runAiReading }) {
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
              <button onClick={runAiReading}><Bot size={14} /> AI 判讀</button>
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

const shell = (system, view) => ({
  width: 'min(1260px, 94vw)',
  margin: view === 'history' ? '16px auto 0' : '0 auto',
  minHeight: view === 'history' ? 'calc(100vh - 116px)' : 'calc(100vh - 92px)',
  position: 'relative',
  padding: view === 'history' ? '0' : '18px 0',
  border: 'none',
  borderRadius: 0,
  background: 'transparent',
  boxShadow: 'none',
  overflow: 'hidden'
});
const formPanel = (system) => ({ maxWidth: 780, margin: '0 auto', padding: 34, borderRadius: 8, border: `1px solid ${system.accentSoft}`, background: 'rgba(4,2,10,0.74)', boxShadow: `0 0 42px ${system.accentSoft}` });
const astrologyFormStage = {
  position: 'relative',
  height: 'calc(100vh - 126px)',
  display: 'grid',
  gridTemplateColumns: 'minmax(420px, 0.95fr) minmax(520px, 1fr)',
  alignItems: 'center',
  gap: 'clamp(34px, 5vw, 88px)',
  padding: '22px 28px',
  boxSizing: 'border-box',
  overflow: 'hidden',
  background: 'radial-gradient(circle at 18% 72%, rgba(19,190,126,0.2), transparent 28%), radial-gradient(circle at 86% 38%, rgba(19,190,126,0.18), transparent 30%)'
};
const astroLeftPane = { position: 'relative', minHeight: 560, display: 'grid', alignContent: 'center', justifyItems: 'start' };
const astroRightPane = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 28px', alignItems: 'start' };
const astroTitle = { margin: '10px 0 12px', color: '#f4ead4', fontSize: 'clamp(3rem, 5.2vw, 5.3rem)', lineHeight: 1, letterSpacing: '0.18em', fontFamily: "'Noto Serif TC', serif" };
const astroLead = { margin: 0, color: 'rgba(255,255,255,0.74)', fontFamily: "'Noto Serif TC', sans-serif", letterSpacing: '0.06em' };
const astroDivider = { width: 260, height: 1, margin: '26px 0 12px', background: 'linear-gradient(90deg, rgba(212,175,55,0.76), transparent)' };
const starPlateImage = { width: 'min(560px, 42vw)', maxHeight: '56vh', objectFit: 'contain', filter: 'drop-shadow(0 0 28px rgba(80,250,123,0.22))' };
const astroSubmitButton = { gridColumn: '1 / -1', marginTop: 10, height: 64, borderRadius: 6, border: '1px solid rgba(212,175,55,0.58)', background: 'linear-gradient(90deg, rgba(9,70,45,0.58), rgba(4,18,14,0.92), rgba(9,70,45,0.58))', color: '#f4ead4', fontFamily: "'Cinzel', serif", fontSize: '1.05rem', letterSpacing: '0.22em', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 28px rgba(80,250,123,0.16)' };
const headline = { marginBottom: 26 };
const eyebrow = (system) => ({ color: system.accent, letterSpacing: '0.28em', fontSize: '0.72rem', textTransform: 'uppercase' });
const titleStyle = { margin: '8px 0 10px', color: '#fff', fontFamily: 'Cinzel, serif', fontSize: 'clamp(2rem, 5vw, 4.3rem)', letterSpacing: '0.08em' };
const lead = { color: 'rgba(255,255,255,0.66)', lineHeight: 1.8, maxWidth: 640 };
const fieldGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 };
const fieldLabel = { display: 'grid', gap: 8, color: 'rgba(255,255,255,0.72)', fontSize: '0.86rem', letterSpacing: '0.08em' };
const inputStyle = { width: '100%', boxSizing: 'border-box', borderRadius: 6, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(0,0,0,0.42)', color: '#fff', padding: '13px 14px', outline: 'none' };
const primaryButton = (system) => ({ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 10, border: `1px solid ${system.accent}`, background: `linear-gradient(180deg, ${system.accentSoft}, rgba(0,0,0,0.52))`, color: '#fff', borderRadius: 6, padding: '13px 24px', cursor: 'pointer', letterSpacing: '0.14em' });
const loadingPanel = (system) => ({ minHeight: 520, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 24, position: 'relative' });
const scanAura = (system) => ({ position: 'absolute', width: 520, aspectRatio: 1, borderRadius: '50%', background: `radial-gradient(circle, ${system.accentGlow}, transparent 62%)`, filter: 'blur(12px)', opacity: 0.8 });
const loadingText = { color: 'rgba(255,255,255,0.74)', letterSpacing: '0.16em' };
const resultPanel = (system) => ({ padding: 24, borderRadius: 8, border: `1px solid ${system.accentSoft}`, background: 'rgba(0,0,0,0.42)', position: 'relative' });
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
const historyLayout = { display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 24, alignItems: 'stretch', width: '100%' };
const historySidebar = (system) => ({ minHeight: 620, padding: 20, borderRadius: 8, border: `1px solid ${system.accentSoft}`, background: 'rgba(4,2,9,0.54)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 12 });
const historyContent = (system) => ({ minHeight: 620, padding: 28, borderRadius: 8, border: `1px solid ${system.accentSoft}`, background: 'rgba(3,1,8,0.42)', boxShadow: `inset 0 0 38px ${system.accentSoft}`, overflow: 'auto' });
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
