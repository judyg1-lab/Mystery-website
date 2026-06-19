const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const articles = [
  {
    systemType: 'TAROT',
    tabType: 'ORIGINS',
    category: 'HISTORY',
    title: '塔羅牌的歷史源流',
    content: '塔羅牌最早可追溯到十五世紀歐洲的紙牌文化，起初多作為遊戲與圖像敘事工具。十八至十九世紀後，神祕學傳統逐漸把塔羅與占卜、卡巴拉、占星、鍊金術等系統連結，形成今日常見的象徵解讀方式。',
    detail: '說明塔羅的起源、演變與文化脈絡，讓使用者理解塔羅是一套累積多層象徵的圖像語言。'
  },
  {
    systemType: 'TAROT',
    tabType: 'ORIGINS',
    category: 'MYTHOLOGY',
    title: '大阿爾克那的神話旅程',
    content: '大阿爾克那二十二張牌常被視為愚者之旅：從未知、啟程、學習、欲望、失落，到整合與完成。每張牌像是一個人生關卡，也像是一段心靈原型的顯影。',
    detail: '提供塔羅神話與心理象徵入口，讓牌義不只停留在吉凶，而能回到人生階段、選擇與自我認識。'
  },
  {
    systemType: 'TAROT',
    tabType: 'CODEX',
    category: 'DIVINATION',
    title: '塔羅牌義資料庫：四元素與牌陣解讀',
    content: '塔羅解讀可從元素、數字、宮廷角色與圖像細節切入。權杖偏向行動與意志，聖杯關乎情感與關係，寶劍呈現思考與衝突，圓盤對應資源、身體與現實結構。牌陣則把單張牌放進時間、關係或選擇的位置中閱讀。',
    detail: '承載可查詢、可延伸的知識庫內容，適合放牌義、元素、牌陣與解讀方法。'
  },
  {
    systemType: 'ASTROLOGY',
    tabType: 'ORIGINS',
    category: 'HISTORY',
    title: '占星術的古典源流',
    content: '占星術源於古代人類對天象週期的觀察。巴比倫、希臘、埃及與後來的阿拉伯世界都對占星系統有重要貢獻。它把行星、黃道十二宮、宮位與相位組成一張出生星盤，用來描述生命節奏與心理傾向。',
    detail: '說明占星的歷史背景，讓使用者理解星盤是時間與天空位置的象徵模型。'
  },
  {
    systemType: 'ASTROLOGY',
    tabType: 'ORIGINS',
    category: 'MYTHOLOGY',
    title: '行星神話與十二星座原型',
    content: '占星中的行星常與神話原型相連：太陽象徵核心意志，月亮象徵情緒與安全感，水星關於語言與理解，金星關於愛與價值，火星關於行動與欲望。十二星座則提供不同的表達風格。',
    detail: '神話原型能讓星盤解讀更有畫面，也讓抽象行星能量轉化為具體的人格語彙。'
  },
  {
    systemType: 'ASTROLOGY',
    tabType: 'CODEX',
    category: 'DIVINATION',
    title: '星盤資料庫：行星、宮位與相位',
    content: '星盤解讀通常從行星代表的心理功能、星座代表的表達方式、宮位代表的生活場域，以及相位代表的互動張力開始。合相強化主題，四分相帶來摩擦，三分相顯示壓力與成長，三分相與六合則提示較順暢的資源。',
    detail: '整理星盤核心規則，作為 AI 解讀與使用者查詢的穩定資料來源。'
  },
  {
    systemType: 'BAZI',
    tabType: 'ORIGINS',
    category: 'HISTORY',
    title: '四柱八字的形成與發展',
    content: '八字以出生年、月、日、時組成四柱，每柱由天干與地支構成，因此共有八個字。它源於中國干支曆法與陰陽五行思想，後來逐漸發展出日主、十神、格局、大運與流年的推演方法。',
    detail: '讓使用者先理解八字是時間結構的分析系統，而不是單純的命定論。'
  },
  {
    systemType: 'BAZI',
    tabType: 'ORIGINS',
    category: 'MYTHOLOGY',
    title: '天干地支與五行神話',
    content: '天干地支把時間轉化為木、火、土、金、水的循環。木象徵生長，火象徵顯發，土象徵承載，金象徵收斂，水象徵流動。八字透過五行的旺衰、生剋與平衡，觀察一個人的節奏與傾向。',
    detail: '提供五行象徵入口，讓使用者能用更直覺的方式理解四柱結構。'
  },
  {
    systemType: 'BAZI',
    tabType: 'CODEX',
    category: 'DIVINATION',
    title: '八字資料庫：日主、十神與大運',
    content: '八字分析以日主為核心，觀察其他干支對日主形成的生扶、消耗、剋制與轉化。十神描述資源、表達、財務、規範與同輩力量；大運與流年則用來觀察不同階段的外部節奏。',
    detail: '整理八字推演規則，提供前端文章頁和 AI 解讀共同使用。'
  },
  {
    systemType: 'ZIWEI',
    tabType: 'ORIGINS',
    category: 'HISTORY',
    title: '紫微斗數的命盤系統',
    content: '紫微斗數以出生時間排出十二宮命盤，透過主星、輔星、四化與宮位互動來觀察人生主題。它重視命宮、身宮，以及財帛、事業、夫妻、遷移等宮位之間的連動。',
    detail: '說明紫微斗數的結構，讓使用者理解它是以宮位與星曜互動為核心的系統。'
  },
  {
    systemType: 'ZIWEI',
    tabType: 'ORIGINS',
    category: 'MYTHOLOGY',
    title: '十四主星與人格原型',
    content: '紫微斗數中的十四主星可視為不同的人格原型。紫微象徵統御與中心，天機象徵思考與變動，太陽象徵照耀與承擔，武曲象徵資源與執行，破軍象徵破舊立新。',
    detail: '神話式的主星理解能降低入門門檻，也讓命盤閱讀更容易連結到具體性格。'
  },
  {
    systemType: 'ZIWEI',
    tabType: 'CODEX',
    category: 'DIVINATION',
    title: '紫微資料庫：十二宮、主星與四化',
    content: '紫微斗數解讀會觀察命宮主星、三方四正、宮位互動與四化飛星。化祿提示資源與吸引，化權提示掌控與推動，化科提示名聲與修飾，化忌提示執著、壓力或需要面對的課題。',
    detail: '整理紫微斗數的查詢資料，支援文章頁與結果頁的延伸閱讀。'
  }
];

async function seedMysticArticles() {
  for (const article of articles) {
    await prisma.article.upsert({
      where: { title: article.title },
      update: article,
      create: article
    });
  }

  console.log(`[mystic-articles] Seeded ${articles.length} articles.`);
}

if (require.main === module) {
  seedMysticArticles()
    .catch((error) => {
      console.error('[mystic-articles] Seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedMysticArticles, articles };
