const { PrismaClient } = require('@prisma/client');
const { tarotMinorCards, tarotMajorCards } = require('./tarotMinorCards');

const prisma = new PrismaClient();

const articleBase = {
  systemType: 'TAROT',
  tabType: 'CODEX',
  category: 'DIVINATION'
};

const suitCodexData = [
  {
    title: '克勞利秘典：22張托特大牌全量解讀',
    detail: '托特大牌描繪靈魂穿越意志、命運、陰影與覺醒的二十二道門。',
    intro: '大牌是托特塔羅的核心神殿。它們不只是事件符號，而是意識變化的階段：從愚者的躍入未知，到宇宙的完成與整合，每一張牌都像一枚通往內在秩序的印記。',
    entries: [
      ['0', 'The Fool', '純粹的開始。它象徵信任、冒險、自由與尚未被世界定義的生命力。'],
      ['I', 'The Magus', '意志開始成形。語言、技巧、專注與創造力被召喚到現實之中。'],
      ['II', 'The Priestess', '直覺與靜默之門。它提醒你聆聽尚未被說出的訊息。'],
      ['III', 'The Empress', '豐饒、感官、愛與創造。生命透過美、關係與身體展開。'],
      ['IV', 'The Emperor', '秩序、主權與界線。力量必須有形，願景才有落地的骨架。'],
      ['V', 'The Hierophant', '傳承、學習與啟蒙。它指向能把混沌整理成道路的智慧。'],
      ['VI', 'The Lovers', '選擇與結合。真正的關係不是失去自己，而是在差異中完成煉金。'],
      ['VII', 'The Chariot', '意志的載具。它象徵行動、保護、方向與穿越阻力的能力。'],
      ['VIII', 'Adjustment', '精準的平衡。每個行動都會回到秤上，要求更清醒的校準。'],
      ['IX', 'The Hermit', '退入內在尋找燈火。孤獨不是隔絕，而是讓真理重新發光。'],
      ['X', 'Fortune', '命運之輪轉動。變化不是懲罰，而是生命推動你換位與更新。'],
      ['XI', 'Lust', '生命力、慾望與勇氣。它教你駕馭本能，而不是否定本能。'],
      ['XII', 'The Hanged Man', '懸置與臣服。當舊方法失效，新的視角會從停頓中誕生。'],
      ['XIII', 'Death', '轉化與釋放。結束不是空無，而是讓下一個形態有空間出現。'],
      ['XIV', 'Art', '融合、調和與煉金。對立元素在更高層次中找到新的比例。'],
      ['XV', 'The Devil', '物質、慾望與束縛。它照見你被什麼吸引，也被什麼困住。'],
      ['XVI', 'The Tower', '突發的揭露。虛假的結構崩塌，真實才有機會站起來。'],
      ['XVII', 'The Star', '療癒、希望與遠景。它讓心重新對未來保持開放。'],
      ['XVIII', 'The Moon', '夢境、恐懼與迷霧。你正在穿越潛意識，別急著定論。'],
      ['XIX', 'The Sun', '清晰、活力與成功。光照進來，事情變得可以被看見。'],
      ['XX', 'The Aeon', '覺醒與重生。舊身份完成審判，新時代開始呼喚。'],
      ['XXI', 'The Universe', '完成與整合。旅程抵達一個圓滿，同時也準備展開下一輪。']
    ]
  },
  {
    title: '權杖秘典：火元素小牌全解',
    detail: '權杖組對應火元素，象徵意志、行動、創造力、衝動與生命熱度。',
    intro: '權杖組談的是生命如何點燃。從火的第一道火花，到力量被壓迫而過載，它呈現一個人如何啟動、擴張、競爭、勝利，並學會管理自己的能量。',
    entries: [
      ['ACE', 'Ace of Wands', '火元素的根源。新的意志正在升起，適合開始、宣告、行動與投入熱情。'],
      ['II', 'Dominion', '力量開始有方向。它象徵掌控、主導、野心與把意志放到世界中的勇氣。'],
      ['III', 'Virtue', '火焰穩定成形。創造力得到支撐，行動開始符合內在的正直與節奏。'],
      ['IV', 'Completion', '火元素抵達第一個完成。慶祝、安定與階段性成果都在這裡顯現。'],
      ['V', 'Strife', '能量彼此摩擦。競爭、壓力與衝突出現，提醒你辨認真正值得燃燒的事。'],
      ['VI', 'Victory', '勝利的火冠。努力被看見，信念獲得回應，也帶來更大的責任。'],
      ['VII', 'Valour', '勇氣被測試。即使局勢不輕鬆，也要守住核心立場與行動火種。'],
      ['VIII', 'Swiftness', '迅速流動的火。消息、推進、旅行與決策加速，事情不再停留。'],
      ['IX', 'Strength', '持久的內在火力。它說的是韌性、防護、恢復與最後一段堅持。'],
      ['X', 'Oppression', '過度的火壓在身上。責任、壓力與疲憊提醒你重新分配能量。']
    ]
  },
  {
    title: '聖杯秘典：水元素小牌全解',
    detail: '聖杯組對應水元素，象徵情感、關係、潛意識、直覺與內在接納。',
    intro: '聖杯組是托特塔羅中最接近情緒與潛意識的一組小牌。它不只說愛情，也說一個人如何承接感受、回應渴望、辨認滿足與過量之間的界線。',
    entries: [
      ['ACE', 'Ace of Cups', '水元素的根源。它像一只溢出月光的杯，象徵情感的開口、祝福、接納與一段新的內在流動。'],
      ['II', 'Love', '兩只聖杯交流，代表吸引、相互理解與情感共鳴。它不只是戀愛，也是願意把自己放入關係之中的勇氣。'],
      ['III', 'Abundance', '感受開始豐盈，杯中的水不再只屬於自己，而是可以分享、慶祝與滋養他人。'],
      ['IV', 'Luxury', '愉悅變得柔軟而海量，但也有沉溺的隱患。享受不是錯，缺乏清醒時滿足會變成鈍化。'],
      ['V', 'Disappointment', '情感期待落空，杯中的水變淡、變冷。它要你看見原本投射的幻想。'],
      ['VI', 'Pleasure', '六聖杯帶來溫柔的愉悅，象徵單純、感官、回憶與被滋養的感覺。'],
      ['VII', 'Debauch', '水開始浸滿而失去輪廓，代表成癮、過量、迷惘與情緒的霧化。'],
      ['VIII', 'Indolence', '情感停滯，流動變得緩慢甚至無力。辨認哪些關係只剩慣性。'],
      ['IX', 'Happiness', '滿足成形，心靈在情感上得到安置。願望被回應，關係有暖度。'],
      ['X', 'Satiety', '情感到達滿溢頂點。它可以是團圓與安心，也可能是過滿之後的飽和。']
    ]
  },
  {
    title: '寶劍秘典：風元素小牌全解',
    detail: '寶劍組對應風元素，象徵思想、判斷、衝突、語言與清醒的切割。',
    intro: '寶劍組談的是思想如何成為力量，也如何傷人。它從清晰的第一道光開始，穿越和平、悲傷、分析、干擾與崩解，最後迫使心智放下過度控制。',
    entries: [
      ['ACE', 'Ace of Swords', '風元素的根源。清楚的洞見像劍光落下，帶來真理、決斷與新的理解。'],
      ['II', 'Peace', '兩把劍達成平衡。它象徵暫時的安寧、停戰與心智的穩定。'],
      ['III', 'Sorrow', '思想刺入情感。悲傷不是失敗，而是看見真相時不可避免的疼痛。'],
      ['IV', 'Truce', '衝突暫停。它給你休息、整理策略與等待更好時機的空間。'],
      ['V', 'Defeat', '心智戰場失衡。爭論、挫敗與自尊受傷，提醒你不要只為了贏而戰。'],
      ['VI', 'Science', '理性與分析的勝利。把複雜拆解成可理解的結構，事情會變清楚。'],
      ['VII', 'Futility', '努力被分散，策略失焦。這張牌問你：現在的方法真的有效嗎？'],
      ['VIII', 'Interference', '思緒被雜訊卡住。太多聲音同時出現，行動因此變慢。'],
      ['IX', 'Cruelty', '思想變得尖銳而殘酷。焦慮、自責與過度推演正在消耗你。'],
      ['X', 'Ruin', '舊思維結構崩解。結束雖痛，但也讓你不必再維持錯誤的故事。']
    ]
  },
  {
    title: '圓盤秘典：土元素小牌全解',
    detail: '圓盤組對應土元素，象徵身體、金錢、工作、資源、穩定與具體成果。',
    intro: '圓盤組說的是靈感如何落地成形。它從一顆種子開始，經過交換、勞作、掌控、焦慮、成功與累積，最終抵達物質世界的完整循環。',
    entries: [
      ['ACE', 'Ace of Disks', '土元素的根源。新的資源、身體感、金錢機會或具體計畫正在萌芽。'],
      ['II', 'Change', '物質世界開始流動。交換、調整與適應，是讓資源保持活性的方式。'],
      ['III', 'Works', '工作成為結構。技能、協作與耐心讓抽象願景逐漸建成。'],
      ['IV', 'Power', '穩定帶來力量，也可能帶來控制。守住資源，但別讓安全感變成封閉。'],
      ['V', 'Worry', '匱乏感浮現。它提醒你照顧現實問題，也照顧因不安而緊縮的身體。'],
      ['VI', 'Success', '資源開始回流。努力有成果，支持與互惠也變得可見。'],
      ['VII', 'Failure', '等待沒有立刻回報。這張牌要求你檢查土壤，而不是只責怪種子。'],
      ['VIII', 'Prudence', '謹慎耕作。規律、細節、長期投入與耐心是此刻最可靠的魔法。'],
      ['IX', 'Gain', '收穫出現。它象徵累積、價值提升與對自身能力的信任。'],
      ['X', 'Wealth', '物質循環完成。財富不只是擁有，也包含傳承、分享與穩定系統。']
    ]
  },
  {
    title: '宮廷牌秘典：十六位元素使者全解',
    detail: '宮廷牌描繪元素在人格、行動模式與關係互動中的具體化身。',
    intro: '宮廷牌像十六位元素使者。它們不只代表人物，也代表你在某個情境中展現出的姿態：騎士推動、皇后承載、王子運作、公主把元素帶入現實。',
    entries: [
      ['WANDS-KNIGHT', 'Knight of Wands', '火的騎士帶來衝刺、熱度與立即行動。他勇敢，但也需要避免被衝動推著走。'],
      ['WANDS-QUEEN', 'Queen of Wands', '火的皇后有魅力、直覺與主導力。她能點燃他人，也要記得留空間給別人燃燒。'],
      ['WANDS-PRINCE', 'Prince of Wands', '火的王子擅長推進願景，充滿速度與企圖心。成熟時是開創者，失衡時容易躁進。'],
      ['WANDS-PRINCESS', 'Princess of Wands', '火的公主象徵新的勇氣與冒險精神。她讓沉睡的熱情重新醒來。'],
      ['CUPS-KNIGHT', 'Knight of Cups', '水的騎士追尋情感理想與浪漫召喚。他溫柔敏銳，也可能沉入幻想。'],
      ['CUPS-QUEEN', 'Queen of Cups', '水的皇后承載直覺、夢境與照護。她懂得感受，但需要清楚的情緒邊界。'],
      ['CUPS-PRINCE', 'Prince of Cups', '水的王子讓情緒有方向。他擅長調和與想像，也要避免逃避現實。'],
      ['CUPS-PRINCESS', 'Princess of Cups', '水的公主帶來純真的感受、新的愛意與靈感。她是內在柔軟處的信使。'],
      ['SWORDS-KNIGHT', 'Knight of Swords', '風的騎士快速、銳利、直接。它帶來決斷，也提醒你語言可以開路也可以傷人。'],
      ['SWORDS-QUEEN', 'Queen of Swords', '風的皇后清明、獨立、擅長辨識真相。她的智慧來自誠實與界線。'],
      ['SWORDS-PRINCE', 'Prince of Swords', '風的王子是策略、分析與辯證。他能拆解問題，也可能困在過度思考。'],
      ['SWORDS-PRINCESS', 'Princess of Swords', '風的公主代表警覺、學習與新觀點。她問問題，直到霧散開。'],
      ['DISKS-KNIGHT', 'Knight of Disks', '土的騎士穩定、務實、可靠。他不急著表演，而是一步步把資源守好。'],
      ['DISKS-QUEEN', 'Queen of Disks', '土的皇后照顧身體、土地與生活品質。她讓安全感變成可居住的現實。'],
      ['DISKS-PRINCE', 'Prince of Disks', '土的王子擅長規劃、生產與長期建設。他讓成果慢慢成熟。'],
      ['DISKS-PRINCESS', 'Princess of Disks', '土的公主象徵潛力、孕育與新資源。她把未來握在手中，等待合適季節。']
    ]
  }
];

function createCodexArticle({ title, detail, intro, entries }) {
  return {
    ...articleBase,
    title,
    detail,
    content: [
      intro,
      '',
      ...entries.flatMap(([no, name, meaning]) => [`No.${no} - ${name}`, meaning])
    ].join('\n')
  };
}

const suitCodexArticles = suitCodexData.map(createCodexArticle);

async function seedTarotCards() {
  for (const card of tarotMajorCards) {
    await prisma.tarotCard.upsert({
      where: { slug: card.slug },
      update: card,
      create: card
    });
  }

  for (const card of tarotMinorCards) {
    await prisma.tarotCard.upsert({
      where: { slug: card.slug },
      update: card,
      create: card
    });
  }

  for (const article of suitCodexArticles) {
    await prisma.article.upsert({
      where: { title: article.title },
      update: article,
      create: article
    });
  }

  console.log(`[tarot-cards] Seeded ${tarotMajorCards.length} major arcana cards.`);
  console.log(`[tarot-cards] Seeded ${tarotMinorCards.length} minor arcana cards.`);
  console.log(`[tarot-cards] Seeded ${suitCodexArticles.length} codex articles.`);
}

seedTarotCards()
  .catch((error) => {
    console.error('[tarot-cards] Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
