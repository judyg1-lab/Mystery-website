const axios = require('axios'); // send HTTP requests to target website
const cheerio = require('cheerio'); // parse HTML and extract data using CSS selectors
const { PrismaClient } = require('@prisma/client'); // Prisma ORM client to interact with PostgreSQL
const prisma = new PrismaClient(); // build Prisma client

const THOTH_MAJOR_ARCANNA = [
    { no: '0', en: 'The Fool', zh: '愚者', element: '風元素 / Aleph', detail: '代表純粹的潛能、不可預測的冒險與虛無中的第一步。在愛情上代表不期而遇的邂逅與不問未來的狂熱；事業上代表打破常規的跳躍式變革。' },
    { no: 'I', en: 'The Magician', zh: '魔術師', element: '水星 / Beth', detail: '智慧與溝通的傳遞者，掌握四大元素的物質顯化。在事業上代表高超的技術實力、卓越的交涉手腕與開創專案的完美契機。' },
    { no: 'II', en: 'The High Priestess', zh: '女祭司', element: '月亮 / Gimel', detail: '代表潛意識的直覺、內省與冰封的智慧。在學業上代表具有極高的慧根與鑽研學術的潛力；生命探索中警示應保持神秘並傾聽內心。' },
    { no: 'III', en: 'The Empress', zh: '皇后', element: '金星 / Daleth', detail: '大地之母，代表極致的豐盛、生育力與愛。在愛情中代表開花結果的深厚情感與承諾；事業上代表資源充沛、項目進入收割期。' },
    { no: 'IV', Frost: 'The Emperor', zh: '皇帝', element: '牡羊座 / Heh', detail: '代表秩序、世俗權力、防禦控制與開疆闢土的野心。在事業中象徵強大的管理階層、穩固的組織架構與不容質疑的執行力。' },
    { no: 'V', en: 'The Hierophant', zh: '大教皇', element: '金牛座 / Vav', detail: '精神導師、傳統建制與神聖協議的守護者。在學業上代表正統教育體系、尋求權威指引；在生命陣型中代表靈魂內在的覺醒與傳承。' },
    { no: 'VI', en: 'The Lovers', zh: '戀人', element: '雙子座 / Zain', detail: '托特牌中代表「神聖婚禮」，煉金術中的二元對立融合。在愛情中象徵超越肉體的靈魂共鳴；在決定上面臨深刻的價值觀抉擇。' },
    { no: 'VII', en: 'The Chariot', zh: '戰車', element: '巨蟹座 / Chet', detail: '代表意志力的勝利、披荊斬棘的突圍。托特牌中戰車手凝視著聖杯，在事業中代表克服一切內外衝突、精準掌控機器人般的目標推進。' },
    { no: 'VIII', en: 'Adjustment', zh: '調節', element: '天秤座 / Lamed', detail: '✦ 托特專屬：傳統的力量改為調節。代表絕對的平衡、業力法則與客觀修正。在生命抉擇中象徵不帶情感偏見的精準權衡。' },
    { no: 'IX', en: 'The Hermit', zh: '隱者', element: '處女座 / Yod', detail: '孤獨的尋道者，手持隱藏之光的奧祕。在生命陣型中代表慢下來、抽離混亂、進行深度的自我查驗與知識閉環淬鍊。' },
    { no: 'X', en: 'Fortune', zh: '命運之輪', element: '木星 / Kaph', detail: '象徵宇宙大星軌的運轉、命運的起伏。在財務與投資中代表不可控的周期變更；在事業上代表掌握突如其來的上升氣流。' },
    { no: 'XI', en: 'Lust', zh: '慾望', element: '獅子座 / Tet', detail: '✦ 托特專屬：正義改為慾望。代表原始的創造力、狂熱的激情與靈魂深處的獸性覺醒。象徵用強大的內在生命力馴服恐懼。' },
    { no: 'XII', en: 'The Hanged Man', zh: '倒吊人', element: '水元素 / Mem', detail: '代表神聖的犧牲、視角的徹底反轉與等待。在專案停滯時，提示應暫時維持現狀、打破慣性思維，從相反的方向尋求突破。' },
    { no: 'XIII', en: 'Death', zh: '死亡', element: '天蠍座 / Nun', detail: '代表舊秩序的徹底崩解、鳳凰涅槃的蛻變。不可逆的死而復生儀式，清除一切數位痕跡，為全新的生命節點開闢空間。' },
    { no: 'XIV', en: 'Art', zh: '藝術', element: '射手座 / Samekh', detail: '✦ 托特專屬：節制改為藝術。代表煉金術中水與火的完美調和、靈魂資源的鎔鑄。象徵將跨領域的技術轉化為藝術的極致。' },
    { no: 'XV', en: 'The Devil', zh: '惡魔', element: '魔羯座 / Ayin', detail: '代表物質世界的束縛、盲盲目的野心與充滿創造力的幽默感。在生命探索中，警示應注意過度的物質欲望或數位沉迷。' },
    { no: 'XVI', en: 'The Tower', zh: '高塔', element: '火星 / Peh', detail: '代表突如其來的晴天霹靂、虛假防禦的粉碎。雖然震盪強烈，但這是一場清除老舊Bug、重構底層代碼的必要毀滅儀式。' },
    { no: 'XVII', en: 'The Star', zh: '星星', element: '寶瓶座 / Tzaddi', detail: '代表永恆的希望、靈感的傾注與心靈的療癒。在生命的至暗時刻，星辰將引導妳看清道路，重獲純粹的洞察力。' },
    { no: 'XVIII', en: 'The Moon', zh: '月亮', element: '雙魚座 / Qof', detail: '代表潛意識的幻影、未知的恐懼與靈媒般的幻覺。在愛情中代表隱瞞與不安；在神秘學鑽研中則代表極度敏銳的通靈邊界。' },
    { no: 'XIX', en: 'The Sun', zh: '太陽', element: '太陽 / Resh', detail: '代表最終的成功、光明磊落、充沛的能量與真理的彰顯。在愛情、課業與事業上，皆是全方位發光、萬事亨通的最高吉兆。' },
    { no: 'XX', en: 'The Aeon', zh: '新時代', element: '火與精神 / Shin', detail: '✦ 托特專屬：審判改為新時代。代表大週期的更迭、意識的全面覺醒。象徵跳脫過去的因果框架，以全新維度俯瞰生命。' },
    { no: 'XXI', en: 'The Universe', zh: '宇宙', element: '土星 / Tav', detail: '✦ 托特專屬：世界改為宇宙。代表大功告成、完美的閉環、星軌的終點。象徵旅程的最高榮譽，與整片星海達成終極共振。' }
];


async function runTarotSpider(text1, text2) {
    console.log(" 🔮 [TAROT] 正在重構托特塔羅金庫陣列（執行數據凝聚協議）...");

    // write origin articles first (for Origins tab)
    const originArticles = [
        {
            systemType: 'TAROT', tabType: 'ORIGINS', category: 'MYTHOLOGY',
            title: '托特之書：智慧之神的黃金泥版',
            content: '古埃及神話中，智慧之神托特將守護宇宙運行的 22 個核心演化規律，鐫刻於黃金泥版之上。' + text1,
            detail: '克勞利托特牌完美融合了這一系埃及神話的占星學與卡巴拉生命之樹符號共振。'
        },
        {
            systemType: 'TAROT', tabType: 'ORIGINS', category: 'HISTORY',
            title: '維斯康提·斯福爾扎：米蘭貴族的文藝復興慶典',
            content: '15 世紀中期（約 1450 年），義大利米蘭公爵委託宮廷畫家手繪卡牌。' + text2,
            detail: '這是目前考古界公認世上保存最古老、最完整的實體塔羅牌型歷史鐵證。'
        }
    ];

    for (const article of originArticles) {
        await prisma.article.upsert({ where: { title: article.title }, update: article, create: article });
    }

    let masterCodexContent = "本秘典全面收錄由克勞利（Aleister Crowley）鎔鑄的 22 張大阿爾克那核心義理。每一張主牌皆封印了獨特的占星路徑與煉金術規律：\n\n";

    THOTH_MAJOR_ARCANNA.forEach(card => {
        masterCodexContent += `【No.${card.no} — ${card.en} (${card.zh})】\n`;
        masterCodexContent += `✦ 星軌對應：${card.element}\n`;
        masterCodexContent += `✦ 啟示義理：${card.detail}\n`;
        masterCodexContent += `--------------------------------------------------\n\n`;
    });

    const combinedTarotArticle = {
        systemType: 'TAROT',
        tabType: 'CODEX',
        category: 'DIVINATION',
        title: '克勞利秘典：22張托特大牌全量解讀',
        content: masterCodexContent,
        detail: '克勞利托特牌陣解讀核心要素。本檔案已完成全量集中備份，可供全域檢索與調閱。'
    };

    // write combined codex article (for Codex tab) - this is the "data condensation protocol" that merges all 22 individual card articles into one master article for easier management and retrieval
    await prisma.article.upsert({
        where: { title: combinedTarotArticle.title },
        update: combinedTarotArticle,
        create: combinedTarotArticle
    });

    try {
        await prisma.article.deleteMany({
            where: {
                systemType: 'TAROT',
                tabType: 'CODEX',
                title: { startsWith: '大阿爾克那：' }
            }
        });
    } catch (e) { /* 忽略清理異常 */ }

    console.log(`  [TAROT] 數據凝聚協議成功！22張牌已集中為單一項目管理！`);
}

async function runAstrologySpider() {
    console.log("  [ASTROLOGY] 正在注入西洋星盤秘典...");
    const astrologyArticles = [
        {
            systemType: 'ASTROLOGY', tabType: 'ORIGINS', category: 'HISTORY',
            title: '黃道十二宮與個人命盤的起源',
            content: '黃道十二宮源自古巴比倫星象觀測，透過出生時間計算出個人命盤中的星體配置。',
            detail: '每一個星宮都代表一種人生能量，從個性到命運趨勢皆與出生星盤緊密相連。'
        },
        {
            systemType: 'ASTROLOGY', tabType: 'ORIGINS', category: 'MYTHOLOGY',
            title: '古希臘神話與十二星座的神秘連結',
            content: '古希臘神話中的英雄與神祇，成為了十二星座故事的原型，並影響了西方占星學的象徵系統。',
            detail: '這些神話圖像被占星家用來解讀星座性格與命盤事件的象徵意義。'
        },
        {
            systemType: 'ASTROLOGY', tabType: 'CODEX', category: 'DIVINATION',
            title: '行星相位：命盤解讀的核心語言',
            content: '行星之間的相位代表能量流動與關係模式，影響情緒、關係與成長課題。',
            detail: '四分相、三分相與合相各有不同張力，對於人生課題的解讀有決定性影響。'
        },
        {
            systemType: 'ASTROLOGY', tabType: 'CODEX', category: 'SOUL',
            title: '月亮與內在需求：情感本質的星盤密碼',
            content: '月亮在命盤中代表情緒、潛意識需求與安全感來源，是理解內在心靈世界的關鍵。',
            detail: '透過月亮宮位與相位，可以看見一個人最深層的情感模式與療癒目標。'
        }
    ];

    for (const article of astrologyArticles) {
        await prisma.article.upsert({ where: { title: article.title }, update: article, create: article });
    }
    console.log(`  [ASTROLOGY] 西洋星盤與相位解讀密碼寫入完畢！`);
}

async function runBaziSpider(text1) {
    console.log("  [BAZI] 正在熔鑄四柱八字時空矩陣...");
    const baziArticles = [
        {
            systemType: 'BAZI', tabType: 'ORIGINS', category: 'HISTORY',
            title: '生辰八字與干支紀時的歷史演進',
            content: '生辰八字源於中國古代曆法，由西漢時期的干支紀時系統逐步發展。唐代李虛中首創以年、月、日三柱推命，到了宋代徐子平加入「時柱」，正式奠定了四柱八字預測學的完全體骨幹。' + text1,
            detail: '子平八字體系以日干為核心（日主），透過生克制化推演人生軌跡，是東方最具代表性的時空算術。'
        },
        {
            systemType: 'BAZI', tabType: 'ORIGINS', category: 'MYTHOLOGY',
            title: '河圖洛書與五行生克的哲學源流',
            content: '古代中國神秘的「河圖洛書」被視為東方術數的源頭。伏羲氏與大禹藉此推演天地萬物的五行運作模式（金、木、水、火、土），並與天干地支相結合，成為八字命理學最底層的宇宙代碼結構。',
            detail: '宇宙萬物皆為五行流轉。陰陽生克非唯定數，而是動態流動的能量制衡。'
        },
        {
            systemType: 'BAZI', tabType: 'CODEX', category: 'DIVINATION',
            title: '十神心法：人際關係與世世運籌的數位陣列',
            content: '十神是八字日主與其他干支生克衍生的十種關係代碼。它精準模擬了世俗生活中的父母、伴侶、官職、財富與敵友模式。',
            detail: '天透地藏，格局各異。食傷洩秀代表才華外顯；官印相生則是正統建制與權力傳承的最高吉兆。'
        },
        {
            systemType: 'BAZI', tabType: 'CODEX', category: 'SOUL',
            title: '日主天干：靈魂核心的五行本質鑑定',
            content: '八字命盤中的「日柱天干」代表 SEEKER 本身的內在性格與基本靈魂矩陣。甲木參天、乙木柔順、丙火烈烈、丁火夜燭、戊土厚重、己土蓄藏、庚金剛銳、辛金珠玉、壬水通河、癸水潤物。',
            detail: '探尋日主旺衰，是重構個人生命能量屏障、進行自我命理查驗的第一步。'
        },
        {
            systemType: 'BAZI', tabType: 'CODEX', category: 'DIVINATION',
            title: '地支藏干：隱藏在潛意識深處的命理Bug',
            content: '地支藏干代表表面秩序之下隱藏的暗流，往往在歲運流年進駐、引發刑衝破害時爆發。',
            detail: '地支衝合，局勢震盪。藏干的顯露代表潛意識中的隱藏課題被命運推向世世顯化。'
        },
        {
            systemType: 'BAZI', tabType: 'CODEX', category: 'HISTORY',
            title: '歲運流年：星軌交錯的時間重構儀式',
            content: '大運代表十年一變的時空大環境環境，流年則代表當前年份的動態衝擊。當流年干支與妳靈魂核心的八字陣列產生刑衝合化時，就會引發現實運勢波動。',
            detail: '大運定基調，流年定吉凶。理解歲運交錯，才能在至暗時刻採取最佳的防禦控制與重構。'
        }
    ];

    for (const article of baziArticles) {
        await prisma.article.upsert({ where: { title: article.title }, update: article, create: article });
    }
    console.log(`  [BAZI] 八字歷史流變與干支生克心法完全同步！`);
}

async function runZiweiSpider() {
    console.log("  [ZIWEI] 正在架構紫微斗數十四主星盤...");
    const ziweiArticles = [
        {
            systemType: 'ZIWEI', tabType: 'ORIGINS', category: 'HISTORY',
            title: '紫微斗數之源：希夷先生的星塵幾何學',
            content: '紫微斗數相傳為宋代隱士陳希夷所創。它以虛星觀測為基礎，將出生時空轉化為十二宮位，並以「紫微星」為諸星之首，用來精準推演封閉陣列般的命運藍圖。',
            detail: '對齊前端 ASTRAL ROOT（紫薇起源）。這是東方最精密、兼具統計學與占星美感的皇家神祕學。'
        },
        {
            systemType: 'ZIWEI', tabType: 'ORIGINS', category: 'MYTHOLOGY',
            title: '封神榜英雄與十四主星的靈魂封印',
            content: '紫微斗數中的十四顆核心主星（如伯邑考化為紫微星、諸葛亮化為天機星、紂王化為破軍星），將神話人物性格完美封印於十二宮位陣型中。',
            detail: '理解這些神話人物的執念與才華，就能參透命盤中各主星的深層能量 Bug 與防禦機制。'
        },
        {
            systemType: 'ZIWEI', tabType: 'CODEX', category: 'DIVINATION',
            title: '諸星落宮研究：十二宮位的時空記憶晶片',
            content: '命宮、兄弟、夫妻、子女、財帛、疾厄、遷移、交友、官祿、田宅、福德、父母。十二宮位就像十二個儲存槽，代表 SEEKER 世俗生活的全量矩陣。',
            detail: '對齊前端 CONSTELLIA（紫薇典藏）。主星落入不同宮位，將會動態顯化不同的因果課題。'
        },
        {
            systemType: 'ZIWEI', tabType: 'CODEX', category: 'DIVINATION',
            title: '四化飛星：命盤能量的動態重構引導',
            content: '化祿（資源）、化權（掌控）、化科（名聲）、化忌（執念與束縛）。四化星是紫微斗數命盤動態流轉的靈魂。隨著大限流年更迭，四化星會在各宮位間發動「飛星協議」。',
            detail: '祿為因，忌為果。找出化忌星所在的落點，就是鎖定妳這輩子核心底層代碼中需要被修復的 Bug 盲區。'
        },
        {
            systemType: 'ZIWEI', tabType: 'CODEX', category: 'SOUL',
            title: '身宮定位：尋獲人生後半場的第二防禦屏障',
            content: '身宮代表一個人的後天發展、執念所在以及後半生的行為依歸。身宮不會單獨存在，它一定會與命宮、夫妻、財帛、遷移、官祿或福德宮同宮。',
            detail: '命宮是天生骨幹，身宮則是後天演化。理解身宮落點，才能在人生三十歲後的運勢震盪中完成靈魂突圍。'
        }
    ];

    for (const article of ziweiArticles) {
        await prisma.article.upsert({ where: { title: article.title }, update: article, create: article });
    }
    console.log(`  [ZIWEI] 紫微斗數十四主星與四化飛星密典灌入完畢！`);
}

async function runAllMysticSpiders() {
    console.log("  [星辰全自動爬蟲協議] 正在發動跨界網路連線，準備調閱神秘學文獻庫...");

    try {
        const targetUrl = 'https://zh.wikipedia.org/zh-tw/%E5%A1%94%E7%BE%85%E7%89%8C';
        const { data } = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const $ = cheerio.load(data);
        console.log(" 網頁 HTML 解析成功！動態提取文獻文本完畢，準備啟動分散式金庫同步...");

        const scrapedHistoryText1 = $('#mw-content-text .mw-parser-output p').eq(2).text().trim() ||
            '塔羅牌起源於 15 世紀義大利，最初作為貴族間流行的「凱旋」牌卡遊戲，後於 18 世紀與古埃及神話對接。';

        const scrapedHistoryText2 = $('#mw-content-text .mw-parser-output p').eq(3).text().trim() ||
            '到了 19 世紀，神祕學家將 22 張大牌與卡巴拉生命之樹的 22 個路徑完美融合，塔羅正式演化為西方神祕學體系的核心秘術。';

        await runTarotSpider(scrapedHistoryText1, scrapedHistoryText2);
        await runAstrologySpider();
        await runBaziSpider(scrapedHistoryText1);
        await runZiweiSpider();

        console.log("\n  [ALL SYSTEMS ONLINE] 四大神秘學派（塔羅、占星、八字、紫微）文獻已全量灌入 PostgreSQL 金庫！");

    } catch (error) {
        console.error("  爬蟲腳本執行過程中發生機房斷軌異常:", error);
    } finally {
        await prisma.$disconnect();
        console.log(" 資料庫連線安全中斷，協議關閉。");
    }
}

runAllMysticSpiders();