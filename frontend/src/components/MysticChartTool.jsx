import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, CalendarDays, Check, ChevronDown, Clock, Compass, Copy, ExternalLink, Heart, MapPin, Pencil, Sparkles, Trash2, User, VenusAndMars,Search } from 'lucide-react';
import MysticModal from './MysticModal';
import ZiWeiResult from './results/ZiWeiResult';
import BaZiResult from './results/BaZiResult';
import AstrologyResult from './results/AstrologyResult';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const t = (value) => decodeURIComponent(value);
const ASTRO_FRAME_SRC = '/assets/astrology/astroFrame-transparent.png';

const SYSTEMS = {
  ziwei: { api: 'ziwei', title: t('%E7%B4%AB%E5%BE%AE%E5%91%BD%E7%9B%A4'), subtitle: 'ZI WEI DOUSHU MATRIX', accent: '#00ccff', accentSoft: 'rgba(0,204,255,0.14)', accentGlow: 'rgba(0,204,255,0.34)' },
  bazi: { api: 'bazi', title: t('%E5%85%AB%E5%AD%97%E5%9B%9B%E6%9F%B1'), subtitle: 'FOUR PILLARS ENGINE', accent: '#ffcc00', accentSoft: 'rgba(255,204,0,0.14)', accentGlow: 'rgba(255,204,0,0.34)' },
  astrology: { api: 'astrology', title: t('%E8%A5%BF%E6%B4%8B%E6%98%9F%E7%9B%A4'), subtitle: 'ASTRAL CHART ENGINE', accent: '#50fa7b', accentSoft: 'rgba(80,250,123,0.14)', accentGlow: 'rgba(80,250,123,0.34)' }
};

const PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母'];
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZIWEI_STARS = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁'];
const PLANETS = ['太陽', '月亮', '水星', '金星', '火星', '木星', '土星', '天王星', '海王星', '冥王星'];
const SIGNS = ['牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];const AI_TARGETS = [
  { label: 'ChatGPT', url: 'https://chatgpt.com/' },
  { label: 'Claude', url: 'https://claude.ai/new' },
  { label: 'Gemini', url: 'https://gemini.google.com/app' }
];
const CELESTIAL_SYSTEMS = new Set(['astrology', 'ziwei', 'bazi']);
const ENGINE_LEADS = {
  astrology: '輸入出生資料，啟動一張專屬星盤。系統會以行星、星座與宮位輪廓，整理你的當下命題。',
  ziwei: '輸入出生資料，啟動紫微命盤矩陣。系統會以宮位與星曜配置，推演命運脈絡與近期重點。',
  bazi: '輸入出生資料，啟動四柱八字命盤。系統會以天干地支、五行節奏與大運方向，生成推演結果。'
};

function engineLead(systemKey) {
  return ENGINE_LEADS[systemKey] || ENGINE_LEADS.astrology;
}

function enginePlateSrc(systemKey) {
  if (systemKey === 'ziwei') return '/assets/ziwei/ziweiPlate-transparent.png';
  if (systemKey === 'bazi') return '/bazi/baziPlate-transparent.png';
  return '/assets/astrology/starPlate-transparent.png';
}

const getToken = () => {
  const expiresAt = Number(localStorage.getItem('mystic_token_expires_at') || 0);
  if (expiresAt > 0 && Date.now() >= expiresAt) {
    localStorage.removeItem('mystic_token');
    localStorage.removeItem('mystic_token_expires_at');
    localStorage.removeItem('user_info');
    return '';
  }
  return localStorage.getItem('mystic_token') || localStorage.getItem('token') || '';
};

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

function serializeChartData(result) {
  return JSON.stringify(result?.data || {}, null, 2).slice(0, 2400);
}

function systemReadingName(system) {
  if (system.api === 'bazi') return '八字四柱';
  if (system.api === 'ziwei') return '紫微斗數';
  return '西洋星盤';
}

function createPrompt(system, form, result) {
  const name = systemReadingName(system);
  const sections = system.api === 'bazi'
    ? '日主與五行氣勢、十神互動、用神取向、大運節奏、感情/事業/財務/健康提醒'
    : system.api === 'ziwei'
      ? '命宮主調、三方四正、主要星曜互動、事業/關係/財帛/遷移趨勢、近期行動建議'
      : '太陽月亮上升、行星落座與宮位、主要相位、關係/事業/內在課題、近期行動建議';

  return [
    `你是一位熟悉${name}的專業命理分析師。請根據下方出生資料與系統產生的命盤資料，做「深入且客製化」解讀。`,
    '請使用繁體中文，語氣溫暖、清楚、具體，不要恐嚇、不要絕對化斷言，也不要假裝知道資料中沒有提供的精確天文或曆法細節。',
    '請把命理視為自我理解與決策參考，而不是不可改變的命定。',
    '',
    `姓名：${form.name || '未填'}`,
    `性別：${form.gender || '未填'}`,
    `出生日期：${form.birthDate || '未填'}`,
    `出生時間：${form.birthTime || '未填'}`,
    `出生地：${form.birthPlace || '未填'}`,
    `提問：${form.question || '請針對整體人生狀態解讀'}`,
    '',
    `命盤資料：${serializeChartData(result)}`,
    '',
    `請依序輸出：1. 核心總論 2. ${sections} 3. 目前最值得留意的盲點 4. 三個可執行建議 5. 一句總結。`,
    '請避免空泛形容，每一段都要回扣使用者資料或命盤資料。'
  ].join('\n');
}

function createInitialPrompt(system, form, result) {
  const name = systemReadingName(system);
  return [
    `你是一位${name}入門解讀師。請根據下方資料產生「開始推演後要填入 result 的基本結果」。`,
    '請使用繁體中文，保持精簡、清楚、可信。這一步只做基礎摘要，不要展開過度細節；深入分析會由 Result 頁面的「AI 解讀」處理。',
    '限制：總長約 450-650 字；不要列太多術語；不要恐嚇或做絕對預言。',
    '',
    `姓名：${form.name || '未填'}`,
    `性別：${form.gender || '未填'}`,
    `出生日期：${form.birthDate || '未填'}`,
    `出生時間：${form.birthTime || '未填'}`,
    `出生地：${form.birthPlace || '未填'}`,
    `提問：${form.question || '整體運勢與自我理解'}`,
    '',
    `命盤資料：${serializeChartData(result)}`,
    '',
    '請輸出四段：核心氣質、當前主題、需要留意的地方、下一步建議。'
  ].join('\n');
}

function createTimingPrompt(system, form, result, timing) {
  const name = systemReadingName(system);
  const timingLabel = timing === 'year' ? '流年' : timing === 'month' ? '流月' : '流日';
  const timingFocus = timing === 'year'
    ? '請聚焦今年到未來一年內的大方向、事業/關係/財務/身心節奏，以及最適合把握的月份型態。'
    : timing === 'month'
      ? '請聚焦未來一個月內的事件節奏、情緒波動、工作與關係互動，以及每週行動提醒。'
      : '請聚焦今日到未來三天的狀態、適合做與不適合做的事、溝通提醒與一個具體行動。';

  return [
    `你是一位熟悉${name}的專業命理分析師。請根據下方資料做「${timingLabel}」解讀。`,
    '請使用繁體中文，語氣清楚、溫暖、具體。不要恐嚇、不要絕對化預言，也不要假裝知道資料中沒有提供的精確天文或曆法細節。',
    timingFocus,
    '',
    `姓名：${form.name || '未填'}`,
    `性別：${form.gender || '未填'}`,
    `出生日期：${form.birthDate || '未填'}`,
    `出生時間：${form.birthTime || '未填'}`,
    `出生地：${form.birthPlace || '未填'}`,
    `提問：${form.question || '整體狀態'}`,
    '',
    `命盤資料：${serializeChartData(result)}`,
    '',
    `請輸出：1. ${timingLabel}總覽 2. 重要機會 3. 需要留意的壓力點 4. 感情/事業/財務/身心提醒 5. 三個可執行建議。`
  ].join('\n');
}

function createReport(system, form, result) {
  const focus = result.data.focus || result.data.pillars?.map((pillar) => pillar.branch).join('、') || result.data.planets?.[0]?.sign || '整體命盤節奏';
  return `${form.name || '使用者'} 的${systemReadingName(system)}基礎推演已完成。\n\n核心焦點：${focus}\n\n這份結果先提供命盤的基本輪廓：你目前適合從自身慣性、關係互動與行動節奏三個方向觀察。若想取得更細緻的客製化說明，可以在結果頁按下「AI 解讀」，系統會依照出生資料、命盤資料與你的提問做深入分析。`;
}
function buildResult(systemKey, form) {
  const seed = hashSeed(`${systemKey}-${form.name}-${form.birthDate}-${form.birthTime}-${form.birthPlace}`);
  const title = form.question?.trim() || '命盤推演';

  if (systemKey === 'ziwei') {
    return {
      id: null,
      title,
      form,
      data: {
        focus: `${ZIWEI_STARS[seed % ZIWEI_STARS.length]}入命`,
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
    const gods = ['比肩', '食神', '正財', '正官'];
    const phases = ['長生', '沐浴', '冠帶', '臨官'];
    const pillars = ['年柱', '月柱', '日柱', '時柱'].map((name, index) => ({
      name,
      god: gods[index],
      stem: STEMS[(seed + index * 2) % STEMS.length],
      branch: BRANCHES[(seed + index * 3) % BRANCHES.length],
      hidden: `${STEMS[(seed + index + 3) % STEMS.length]}、${STEMS[(seed + index + 5) % STEMS.length]}`,
      phase: phases[index]
    }));

    return {
      id: null,
      title,
      form,
      data: {
        focus: `${pillars[2].stem}${pillars[2].branch}日主`,
        pillars,
        info: [['日主', pillars[2].stem], ['五行傾向', '木火偏旺'], ['月令', `${pillars[1].stem}${pillars[1].branch}`], ['起運提示', `${36 + (seed % 18)}歲後節奏轉強`]],
        luck: Array.from({ length: 8 }, (_, index) => ({
          age: `${index * 10 + 1}-${index * 10 + 10}`,
          stem: STEMS[(seed + index) % STEMS.length],
          branch: BRANCHES[(seed + index + 4) % BRANCHES.length],
          note: ['蓄勢', '開展', '整理', '突破'][index % 4]
        }))
      }
    };
  }

  return {
    id: null,
    title,
    form,
    data: {
      focus: `${SIGNS[seed % SIGNS.length]}能量`,
      planets: PLANETS.map((planet, index) => ({
        planet,
        sign: SIGNS[(seed + index * 2) % SIGNS.length],
        degree: `${(seed + index * 13) % 30}度${(seed + index * 7) % 60}分`,
        house: `第 ${((seed + index) % 12) + 1} 宮`,
        aspect: ['合相', '六合', '四分', '三分'][index % 4]
      }))
    }
  };
}
export default function MysticChartTool({ systemKey, view = 'drawing', targetHistoryId = null, resetKey = 0 }) {
  const system = SYSTEMS[systemKey] || SYSTEMS.ziwei;
  const [mode, setMode] = useState('form');
  const [form, setForm] = useState({ name: '', gender: 'female', birthDate: '', birthTime: '', birthPlace: '', question: '' });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isAiReading, setIsAiReading] = useState(false);
  const [modal, setModal] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');

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
    if (mode === 'history') setMode('form');
  }, [view, mode, result, targetHistoryId]);

  useEffect(() => {
    if (view === 'history') return;
    setMode('form');
    setResult(null);
  }, [resetKey, view, system.api]);

  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

  function requireToken() {
    if (getToken()) return true;
    setModal({ title: '尚未登入', message: '請先登入後再開始推演或儲存結果。' });
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
      setModal({ title: '儲存失敗', message: '這次推演結果暫時無法儲存，請稍後再試。' });
      return nextResult;
    }
    const payload = await response.json();
    const saved = { ...nextResult, id: payload.history.id };
    setSelectedHistoryId(saved.id);
    await loadHistory();
    return saved;
  }

  function updateField(field, value) {
    let nextValue = value;
    if (field === 'name' || field === 'birthPlace') {
      nextValue = value.replace(/[0-9~`!@#$%^&*_=+[\]{}\\|;:"<>/?]/g, '').slice(0, 40);
    }
    if (field === 'birthDate') {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      nextValue = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join('-');
    }
    if (field === 'birthTime') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      nextValue = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    }
    setForm((current) => ({ ...current, [field]: nextValue }));
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
      const report = await generateInitialReport(generated);
      const saved = await persistHistory({ ...generated, report });
      setResult(saved);
      setMode('result');
    }, 1700);
  }

  async function generateInitialReport(generated) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/reading`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          system: system.api,
          prompt: createInitialPrompt(system, generated.form, generated)
        })
      });
      const data = await response.json();
      return response.ok && data.report ? data.report : createReport(system, generated.form, generated);
    } catch (error) {
      console.error('Initial chart reading failed:', error);
      return createReport(system, generated.form, generated);
    }
  }

  async function copyPrompt(openUrl) {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    if (openUrl) window.open(openUrl, '_blank', 'noopener,noreferrer');
  }

  async function runAiReading(timing) {
    if (!result) return;
    setIsAiReading(true);
    const requestPrompt = timing ? createTimingPrompt(system, activeForm, result, timing) : prompt;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/reading`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ system: system.api, prompt: requestPrompt })
      });
      const data = await response.json();
      setResult((current) => ({
        ...current,
        report: response.ok && data.report
          ? data.report
          : (data.error || createReport(system, activeForm, current)),
        timingReportType: timing || current?.timingReportType || null
      }));
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
      setModal({ title: '收藏失敗', message: '收藏狀態暫時無法更新，請稍後再試。' });
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

  function closeModal() {
    setModal(null);
    setRenameDraft('');
  }

  function requestRenameHistory(event, item) {
    event.stopPropagation();
    setRenameDraft(item.title || '');
    setModal({ kind: 'rename', item, title: '重新命名紀錄', confirmText: '儲存', cancelText: '取消' });
  }

  async function renameHistory(item) {
    const nextTitle = renameDraft.trim();
    if (!nextTitle) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${system.api}/${item.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title: nextTitle })
      });
      const data = await response.json();
      if (!response.ok) {
        setModal({ title: '重新命名失敗', message: data.error || '這筆紀錄暫時無法重新命名。' });
        return;
      }
      setHistory((current) => current.map((entry) => entry.id === item.id ? data.history : entry));
      if (selectedHistoryId === item.id) setResult((current) => current ? { ...current, title: data.history.title } : current);
      closeModal();
    } catch (error) {
      console.error('rename history failed', error);
      setModal({ title: '重新命名失敗', message: '這筆紀錄暫時無法重新命名。' });
    }
  }

  function requestDeleteHistory(event, item) {
    event.stopPropagation();
    setModal({
      kind: 'delete',
      item,
      title: '刪除紀錄',
      message: `確定要刪除「${item.title || '未命名紀錄'}」嗎？`,
      confirmText: '刪除',
      cancelText: '取消',
      type: 'danger'
    });
  }

  async function deleteHistory(item) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${system.api}/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!response.ok) {
        const data = await response.json();
        setModal({ title: '刪除失敗', message: data.error || '這筆紀錄暫時無法刪除。' });
        return;
      }
      setHistory((current) => current.filter((entry) => entry.id !== item.id));
      if (selectedHistoryId === item.id) {
        setSelectedHistoryId(null);
        setResult(null);
      }
      await loadFavorites();
      closeModal();
    } catch (error) {
      console.error('delete history failed', error);
      setModal({ title: '刪除失敗', message: '這筆紀錄暫時無法刪除。' });
    }
  }
  function renderResult(currentResult = result) {
    if (!currentResult) return <div style={emptyState}>尚未選擇任何紀錄，請先開始推演。</div>;
    return (
      <ResultView
        systemKey={systemKey}
        system={system}
        result={currentResult}
        favorites={favorites}
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
                  <Input label="姓名" value={form.name} onChange={(value) => updateField('name', value)} placeholder="請輸入姓名" />
                  <label style={fieldLabel}>性別<select style={inputStyle} value={form.gender} onChange={(event) => updateField('gender', event.target.value)}><option value="female">女</option><option value="male">男</option><option value="other">其他</option></select></label>
                  <Input label="出生日期" value={form.birthDate} onChange={(value) => updateField('birthDate', value)} placeholder="西元生日，例如 1990-08-15" />
                  <Input label="出生時間" value={form.birthTime} onChange={(value) => updateField('birthTime', value)} placeholder="出生時間，例如 14:30" />
                  <label style={{ ...fieldLabel, gridColumn: '1 / -1' }}>出生地<input style={inputStyle} value={form.birthPlace} onChange={(event) => updateField('birthPlace', event.target.value)} placeholder="城市或地區" /></label>
                  <label style={{ ...fieldLabel, gridColumn: '1 / -1' }}>想詢問的主題<textarea style={{ ...inputStyle, minHeight: 92, resize: 'none' }} maxLength={120} value={form.question} onChange={(event) => updateField('question', event.target.value)} placeholder="感情、事業、方向或近期狀態..." /></label>
                  <motion.button style={astroSubmitButton} whileHover={{ y: -2, filter: 'brightness(1.08)', boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 34px ${system.accentGlow}` }} whileTap={{ scale: 0.98 }}>
                    <Sparkles size={18} /> 開始推演
                  </motion.button>
                </div>              </motion.form>
              )
            ) : (
              <motion.form key="form" style={formPanel(system)} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} onSubmit={submitChart}>
                <div style={headline}>
                  <span style={eyebrow(system)}>{system.subtitle}</span>
                  <h1 style={titleStyle}>{system.title}</h1>
                  <p style={lead}>輸入出生資料與想詢問的主題，系統會先產生基本推演；結果頁可再使用 AI 解讀取得更完整的分析。</p>
                </div>
                <div style={fieldGrid}>
                  <Input label="姓名" value={form.name} onChange={(value) => updateField('name', value)} placeholder="請輸入姓名" />
                  <label style={fieldLabel}>性別<select style={inputStyle} value={form.gender} onChange={(event) => updateField('gender', event.target.value)}><option value="female">女</option><option value="male">男</option><option value="other">其他</option></select></label>
                  <Input label="出生日期" value={form.birthDate} onChange={(value) => updateField('birthDate', value)} placeholder="西元生日，例如 1990-08-15" />
                  <Input label="出生時間" value={form.birthTime} onChange={(value) => updateField('birthTime', value)} placeholder="出生時間，例如 14:30" />
                  <Input label="出生地" value={form.birthPlace} onChange={(value) => updateField('birthPlace', value)} placeholder="城市或地區" />
                  <label style={{ ...fieldLabel, gridColumn: '1 / -1' }}>想詢問的主題<textarea style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }} value={form.question} onChange={(event) => updateField('question', event.target.value)} placeholder="感情、事業、方向或近期狀態..." /></label>
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
              <p style={loadingText}>正在整理命盤資料，請稍候...</p>
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
                <div style={historySearchBox(system)}>
                <Search size={16} color={system.accent} />
                <input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="搜尋紀錄..."
                  style={historySearchInput(system)}
                />
                </div>
                {filteredHistory.length === 0 ? <div style={emptyState}>目前沒有任何推演紀錄。</div> : (
                  <div style={historyList}>
                    {filteredHistory.map((item) => {
                      const isSelected = selectedHistory?.id === item.id;
                      const isFavorited = favorites.some((fav) => fav.historyId === item.id);
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          style={historyItem(system, isSelected)}
                          onClick={() => openHistory(item)}
                          whileHover={{
                            y: -2,
                            backgroundColor: 'rgba(188,19,254,0.08)',
                            borderColor: 'rgba(212,175,55,0.46)',
                            boxShadow: `inset 0 0 18px ${system.accentSoft}, 0 0 18px rgba(188,19,254,0.18)`
                          }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <span style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}>
                            <div style={historyItemContent}>
                              <span style={historyCatTag(system)}>{item.date}</span>
                              <div style={historyItemTitle}>{item.title}</div>
                            </div>
                          </span>
                          <div style={historyActionGroup}>
                            <button
                              type="button"
                              style={historyIconButton(system)}
                              title="改名"
                              onClick={(e) => requestRenameHistory(e, item)}
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              style={historyIconButton(system)}
                              title="刪除"
                              onClick={(e) => requestDeleteHistory(e, item)}
                            >
                              <Trash2 size={15} />
                            </button>

                            <button
                              type="button"
                              style={historyIconButton(system)}
                              title="收藏"
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                            >
                              <Heart
                                size={16}
                                fill={isFavorited ? system.accent : 'transparent'}
                                color={isFavorited ? system.accent : 'rgba(255,255,255,0.46)'}
                              />
                            </button>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </aside>
              <main style={historyContent(system)}>
                {selectedHistory ? renderResult({ ...parseContent(selectedHistory.content), id: selectedHistory.id, title: selectedHistory.title }) : <div style={historyEmptyCenter}>請選擇一筆紀錄</div>}
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{toolCSS(system)}</style>
      {modal && (
        <MysticModal
          isOpen={Boolean(modal)}
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText || '確認'}
          cancelText={modal.cancelText ?? null}
          type={modal.type || 'info'}
          onClose={closeModal}
          onConfirm={() => {
            if (modal.kind === 'rename') return renameHistory(modal.item);
            if (modal.kind === 'delete') return deleteHistory(modal.item);
            return closeModal();
          }}
        >
          {modal.kind === 'rename' && (
            <label style={renameModalLabel}>
              <span>紀錄名稱</span>
              <input
                value={renameDraft}
                onChange={(event) => setRenameDraft(event.target.value)}
                style={renameModalInput(system)}
                autoFocus
              />
            </label>
          )}
        </MysticModal>
      )}
    </section>
  );
}

function ResultView({ systemKey, system, result, favorites, toggleFavorite, copyPrompt, runAiReading, isAiReading }) {
  return (
    <>
      <div style={resultHeader}>
        <div><span style={eyebrow(system)}>{result.title}</span><h2 style={resultTitle}>{system.title}推演結果</h2></div>
      </div>
      {systemKey === 'ziwei' && (
        <ZiWeiResult
          data={result.data}
          system={system}
          form={result.form}
          report={result.report}
          copyPrompt={copyPrompt}
          runAiReading={runAiReading}
          isAiReading={isAiReading}
          isFavorite={favorites.some((item) => item.historyId === result.id)}
          toggleFavorite={toggleFavorite}
          aiTargets={AI_TARGETS}
        />
      )}
      {systemKey === 'bazi' && (
        <BaZiResult
          data={result.data}
          system={system}
          form={result.form}
          report={result.report}
          copyPrompt={copyPrompt}
          runAiReading={runAiReading}
          isAiReading={isAiReading}
          isFavorite={favorites.some((item) => item.historyId === result.id)}
          toggleFavorite={toggleFavorite}
          aiTargets={AI_TARGETS}
        />
      )}
      {systemKey === 'astrology' && (
        <AstrologyResult
          data={result.data}
          system={system}
          form={result.form}
          report={result.report}
          copyPrompt={copyPrompt}
          runAiReading={runAiReading}
          isAiReading={isAiReading}
          isFavorite={favorites.some((item) => item.historyId === result.id)}
          toggleFavorite={toggleFavorite}
          aiTargets={AI_TARGETS}
        />
      )}
  
      {result.report && !['ziwei', 'bazi', 'astrology'].includes(systemKey) && <pre style={reportBox(system)}>{result.report}</pre>}
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
      <img src="/assets/astrology/astrologyBackground.png" alt="" style={astrologyBgImage} />
      <div style={astrologyRiteIntro}>輸入出生資料，啟動你的專屬星盤推演。</div>

      <div style={astrologyPlateStage}>
        <img src={enginePlateSrc('astrology')} alt="" style={astrologyPlateImage} />
        <span style={astrologyPlateGlow} />
      </div>

      <ChartRiteFields system={system} form={form} updateField={updateField} slotStyle={astrologyFieldSlot} layout="astrology" />

      <motion.button
        type="submit"
        className="astrology-rite-button"
        style={astrologyRiteButton}
        whileHover={{ y: -2, filter: 'brightness(1.1)', boxShadow: `0 0 34px ${system.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.16)` }}
        whileTap={{ scale: 0.95 }}
      >
        開始推演
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
      <div style={ziweiRiteIntro}>輸入出生資料，啟動紫微命盤矩陣。</div>

      <div style={ziweiPlateStage}>
        <img src={enginePlateSrc('ziwei')} alt="" style={ziweiPlateImage} />
        <span style={ziweiPlateGlow} />
      </div>

      <ChartRiteFields system={system} form={form} updateField={updateField} slotStyle={ziweiFieldSlot} layout="ziwei" />

      <motion.button
        type="submit"
        style={ziweiRiteButton}
        whileHover={{ y: -2, filter: 'brightness(1.1)', boxShadow: '0 0 34px rgba(0,204,255,0.42), inset 0 1px 0 rgba(255,255,255,0.16)' }}
        whileTap={{ scale: 0.98 }}
      >
        開始推演
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
      <div style={baziRiteIntro}>輸入出生資料，啟動四柱八字推演。</div>

      <div style={baziPlateStage}>
        <img src={enginePlateSrc('bazi')} alt="" style={baziPlateImage} />
        <span style={baziPlateGlow} />
      </div>

      <ChartRiteFields system={system} form={form} updateField={updateField} slotStyle={baziFieldSlot} layout="bazi" />

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
        開始推演
      </motion.button>
    </motion.form>
  );
}

function ChartRiteFields({ form, updateField, slotStyle, layout }) {
  const positions = {
    astrology: [['16%', null, '15%'], [null, '16%', '15%'], ['12%', null, '35.5%'], [null, '12%', '35.5%'], ['15.5%', null, '55%'], [null, '15.5%', '55%']],
    ziwei: [['14%', null, '16%'], [null, '14%', '16%'], ['9.5%', null, '36.8%'], [null, '9.5%', '36.8%'], ['14%', null, '58.7%'], [null, '14%', '58.7%']],
    bazi: [['13%', null, '20%'], [null, '12.2%', '20%'], ['13%', null, '34.5%'], [null, '12.2%', '34.5%'], ['7%', null, '50%'], [null, '6%', '50%']]
  }[layout];
  const place = (index) => ({ ...slotStyle, ...(positions[index][0] ? { left: positions[index][0] } : { right: positions[index][1] }), top: positions[index][2] });

  return (
    <>
      <div style={place(0)}>
        <AstrologyRiteInput icon={<User size={25} />} label="姓名" value={form.name} onChange={(value) => updateField('name', value)} placeholder="請輸入中文或英文姓名" />
      </div>
      <div style={place(1)}>
        <AstrologyRiteInput icon={<MapPin size={24} />} label="出生地" value={form.birthPlace} onChange={(value) => updateField('birthPlace', value)} placeholder="城市或地區" />
      </div>
      <div style={place(2)}>
        <AstrologyRiteInput icon={<CalendarDays size={24} />} label="出生日期（西元）" value={form.birthDate} onChange={(value) => updateField('birthDate', value)} placeholder="西元生日，例如 1990-08-15" inputMode="numeric" pickerType="date" />
      </div>
      <div style={place(3)}>
        <AstrologyRiteInput icon={<Clock size={24} />} label="出生時間" value={form.birthTime} onChange={(value) => updateField('birthTime', value)} placeholder="出生時間，例如 14:30" inputMode="numeric" pickerType="time" />
      </div>
      <div style={place(4)}>
        <AstrologyRiteSelect icon={<VenusAndMars size={25} />} label="性別" value={form.gender} onChange={(value) => updateField('gender', value)} />
      </div>
      <div style={place(5)}>
        <AstrologyRiteInput icon={<Compass size={24} />} label="想詢問的主題" value={form.question} onChange={(value) => updateField('question', value)} placeholder="感情、事業、方向..." maxLength={120} />
      </div>
    </>
  );
}
function AstrologyRiteInput({ icon, label, value, onChange, placeholder, type = 'text', inputMode, pickerType, maxLength }) {
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

  const handleIconClick = () => {
    if (pickerType) {
      if (typeof pickerRef.current?.showPicker === 'function') {
        pickerRef.current.showPicker();
      } else {
        pickerRef.current?.click();
      }
    } else {
      inputRef.current?.focus();
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
            cursor: pickerType ? 'pointer' : 'default'
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
          inputMode={inputMode}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          style={astrologyInput}
          autoComplete="off"
        />
        {pickerType && (
          <input
            ref={pickerRef}
            type={pickerType}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-hidden="true"
            tabIndex={-1}
            style={hiddenPickerInput}
          />
        )}
        {maxLength && <small style={astrologyInputCount}>{String(value || '').length} / {maxLength}</small>}
      </span>
    </label>
  );
}

function AstrologyRiteSelect({ icon, label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const options = [
    { value: 'female', label: '女' },
    { value: 'male', label: '男' },
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
          <span>{selected?.label || '?豢??批'}</span>
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
const historySearchBox = (system) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '12px 18px',
  borderRadius: '4px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: '20px'
});
const historyItemContent = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  minWidth: 0
};

const historyCatTag = (system) => ({
  fontSize: '0.75rem',
  color: system.accent,
  letterSpacing: '2px',
  fontWeight: 'bold',
  fontFamily: 'Cinzel, serif'
});

const historyItemTitle = {
  color: '#888',
  marginTop: '6px',
  fontSize: '0.95rem',
  fontFamily: "'Noto Serif TC', serif",
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};
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
  zIndex: 1,
  pointerEvents: 'none',
  opacity: 0.72,
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
const astrologyBgImage = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
  zIndex: 0,
  pointerEvents: 'none',
  opacity: 0.72,
  mixBlendMode: 'screen',
  filter: 'saturate(1.18) brightness(1.02) contrast(1.06)'
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
  height: 52,
  borderRadius: 999,
  border: 'none',
  background: 'rgba(0, 10, 8, 0.45)',
  overflow: 'visible',
  transition: 'background 200ms ease'
};
const astrologyFrameImage = {
  position: 'absolute',
  inset: '-15px -30px',
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
  left: '39%',
  bottom: '80px',
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
const hiddenPickerInput = {
  position: 'absolute',
  width: 1,
  height: 1,
  opacity: 0,
  pointerEvents: 'none',
  left: 54,
  bottom: 8
};
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
  bottom: '65px',
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
  left: '39.5%',
  bottom: '70px',
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
const historyLayout = {
  display: 'grid',
  gridTemplateColumns: '360px minmax(0, 1fr)',
  gap: '25px',
  alignItems: 'stretch',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  minWidth: 0
};
const historySidebar = (system) => ({
  width: '360px',
  minWidth: '360px',
  maxWidth: '360px',
  flexShrink: 0,
  background: 'rgba(0, 0, 0, 0.38)',
  borderRadius: '8px',
  padding: '20px',
  border: `1px solid ${system.accentSoft}`,
  backdropFilter: 'blur(3px)',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflowY: 'auto',
  minHeight: 0,
  boxSizing: 'border-box'
});
const historyList = { minHeight: 0, overflowY: 'auto', display: 'grid', gap: 12, paddingRight: 4, paddingBottom: 4 };
const historyContent = (system) => ({
  flex: 1,
  minWidth: 0,
  height: '100%',
  overflowY: 'auto',
  background: 'rgba(0, 0, 0, 0.22)',
  borderRadius: '8px',
  padding: '0',
  border: `1px solid ${system.accentSoft}`,
  backdropFilter: 'blur(1px)',
  boxShadow: `inset 0 0 28px ${system.accentSoft}`,
  boxSizing: 'border-box'
});
const sidebarTitle = (system) => ({ color: system.accent, letterSpacing: '0.3em', fontSize: '0.78rem', padding: '2px 4px 10px', textTransform: 'uppercase' });
const historySearchInput = (system) => ({
  background: 'none',
  border: 'none',
  color: '#fff',
  outline: 'none',
  fontSize: '0.85rem',
  width: '100%'
});
const historyItem = (system, active) => ({
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '15px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
  border: active ? '1px solid rgba(212,175,55,0.46)' : '1px solid rgba(212,175,55,0.08)',
  background: active
    ? `linear-gradient(90deg, rgba(188,19,254,0.12), ${system.accentSoft})`
    : 'rgba(255,255,255,0.018)',
  boxShadow: active ? `inset 0 0 18px ${system.accentSoft}, 0 0 18px rgba(188,19,254,0.16)` : 'none',
  color: '#fff',
  textAlign: 'left'
});
const historyActionGroup = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexShrink: 0
};
const historyIconButton = (system) => ({
  border: 'none',
  background: 'transparent',
  color: '#666',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: '0.2s'
});
const historyEmptyCenter = { minHeight: 560, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.36)', letterSpacing: '0.22em' };
const emptyState = { padding: '80px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.58)' };
const reportBox = (system) => ({ whiteSpace: 'pre-wrap', marginTop: 18, padding: 16, borderRadius: 6, border: `1px solid ${system.accentSoft}`, background: 'rgba(0,0,0,0.32)', color: 'rgba(255,255,255,0.82)', lineHeight: 1.8 });
const renameModalLabel = { display: 'grid', gap: 10, color: 'rgba(255,255,255,0.7)', fontSize: '0.86rem', letterSpacing: '0.08em' };
const renameModalInput = (system) => ({
  width: '100%',
  boxSizing: 'border-box',
  height: 42,
  borderRadius: 5,
  border: `1px solid ${system.accentSoft}`,
  background: 'rgba(255,255,255,0.045)',
  color: '#fff',
  padding: '0 12px',
  outline: 'none'
});

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
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid transparent;
    border-radius: 7px;
    padding: 5px 10px;
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
  .bazi-rite-form .astrology-rite-select-control [role="listbox"] {
  border: 1px solid rgba(255,204,0,0.62) !important;
  background: linear-gradient(180deg, rgba(30,20,4,0.98), rgba(10,8,2,0.98)) !important;
  box-shadow: 0 18px 36px rgba(0,0,0,0.52), inset 0 0 20px rgba(255,204,0,0.07) !important;
}
  .bazi-rite-form .astrology-rite-select-control [role="listbox"] button:hover,
  .bazi-rite-form .astrology-rite-select-control [role="listbox"] button.selected {
    border-color: rgba(255,204,0,0.48) !important;
    background: rgba(255,204,0,0.14) !important;
    color: #fff2c8 !important;
    box-shadow: inset 0 0 16px rgba(255,204,0,0.09) !important;
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
    display: block !important;
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
    .mystic-chart-tool {
      min-height: 100dvh;
      overflow: auto;
    }
    .astrology-rite-form {
      min-width: 980px;
      min-height: 680px;
      transform: scale(min(1, calc((100vw - 20px) / 980)));
      transform-origin: top center;
      margin: 0 auto;
    }
    .mystic-result-panel {
      width: 100% !important;
      max-width: 100vw !important;
      min-height: calc(100dvh - 96px) !important;
      overflow: auto !important;
    }
    .mystic-result-panel section,
    .mystic-result-panel .ziwei-fullscreen-wrapper {
      width: 100% !important;
      max-width: 100vw !important;
      overflow: auto !important;
    }
    .mystic-chart-tool [style*="310px"] { grid-template-columns: 1fr !important; }
    .ziwei-loading, .bazi-loading, .mystic-chart-tool [style*="repeat(4"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .mystic-chart-tool [style*="360px"] { grid-template-columns: 1fr !important; }
  }

  @media (max-width: 620px) {
    .astrology-rite-form {
      min-width: 900px;
      transform: scale(min(1, calc((100vw - 12px) / 900)));
    }
    .mystic-result-panel {
      padding: 10px !important;
    }
    .mystic-chart-tool table {
      font-size: 0.78rem;
    }
    .mystic-chart-tool table th,
    .mystic-chart-tool table td {
      padding: 7px 5px;
    }
  }
`;







