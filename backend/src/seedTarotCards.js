const { PrismaClient } = require('@prisma/client');
const { tarotMinorCards, tarotMajorCards } = require('./tarotMinorCards');

const prisma = new PrismaClient();
const t = (value) => decodeURIComponent(value);

const cupsCodexArticle = {
  systemType: 'TAROT',
  tabType: 'CODEX',
  category: 'DIVINATION',
  title: t('%E8%81%96%E6%9D%AF%E7%A7%98%E5%85%B8%EF%BC%9A%E6%B0%B4%E5%85%83%E7%B4%A0%E5%B0%8F%E7%89%8C%E5%85%A8%E8%A7%A3'),
  detail: t('%E8%81%96%E6%9D%AF%E7%B5%84%E5%B0%8D%E6%87%89%E6%B0%B4%E5%85%83%E7%B4%A0%EF%BC%8C%E8%B1%A1%E5%BE%B5%E6%83%85%E6%84%9F%E3%80%81%E9%97%9C%E4%BF%82%E3%80%81%E6%BD%9B%E6%84%8F%E8%AD%98%E3%80%81%E7%9B%B4%E8%A6%BA%E8%88%87%E5%85%A7%E5%9C%A8%E6%8E%A5%E7%B4%8D%E3%80%82'),
  content: [
    t('%E8%81%96%E6%9D%AF%E7%B5%84%E6%98%AF%E6%89%98%E7%89%B9%E5%A1%94%E7%BE%85%E4%B8%AD%E6%9C%80%E6%8E%A5%E8%BF%91%E6%83%85%E7%B7%92%E8%88%87%E6%BD%9B%E6%84%8F%E8%AD%98%E7%9A%84%E4%B8%80%E7%B5%84%E5%B0%8F%E7%89%8C%E3%80%82%E5%AE%83%E4%B8%8D%E5%8F%AA%E8%AA%AA%E6%84%9B%E6%83%85%EF%BC%8C%E4%B9%9F%E8%AA%AA%E4%B8%80%E5%80%8B%E4%BA%BA%E5%A6%82%E4%BD%95%E6%89%BF%E6%8E%A5%E6%84%9F%E5%8F%97%E3%80%81%E5%9B%9E%E6%87%89%E6%B8%B4%E6%9C%9B%E3%80%81%E8%BE%A8%E8%AA%8D%E6%BB%BF%E8%B6%B3%E8%88%87%E9%81%8E%E9%87%8F%E4%B9%8B%E9%96%93%E7%9A%84%E7%95%8C%E7%B7%9A%E3%80%82'),
    '',
    'No.ACE - Ace of Cups',
    t('%E6%B0%B4%E5%85%83%E7%B4%A0%E7%9A%84%E6%A0%B9%E6%BA%90%E3%80%82%E5%AE%83%E5%83%8F%E4%B8%80%E5%8F%AA%E6%BA%A2%E5%87%BA%E6%9C%88%E5%85%89%E7%9A%84%E6%9D%AF%EF%BC%8C%E8%B1%A1%E5%BE%B5%E6%83%85%E6%84%9F%E7%9A%84%E9%96%8B%E5%8F%A3%E3%80%81%E7%A5%9D%E7%A6%8F%E3%80%81%E6%8E%A5%E7%B4%8D%E8%88%87%E4%B8%80%E6%AE%B5%E6%96%B0%E7%9A%84%E5%85%A7%E5%9C%A8%E6%B5%81%E5%8B%95%E3%80%82'),
    'No.II - Love',
    t('%E5%85%A9%E5%8F%AA%E8%81%96%E6%9D%AF%E4%BA%A4%E6%B5%81%EF%BC%8C%E4%BB%A3%E8%A1%A8%E5%90%B8%E5%BC%95%E3%80%81%E7%9B%B8%E4%BA%92%E7%90%86%E8%A7%A3%E8%88%87%E6%83%85%E6%84%9F%E5%85%B1%E9%B3%B4%E3%80%82%E5%AE%83%E4%B8%8D%E5%8F%AA%E6%98%AF%E6%88%80%E6%84%9B%EF%BC%8C%E4%B9%9F%E6%98%AF%E9%A1%98%E6%84%8F%E6%8A%8A%E8%87%AA%E5%B7%B1%E6%94%BE%E5%85%A5%E9%97%9C%E4%BF%82%E4%B9%8B%E4%B8%AD%E7%9A%84%E5%8B%87%E6%B0%A3%E3%80%82'),
    'No.III - Abundance',
    t('%E6%84%9F%E5%8F%97%E9%96%8B%E5%A7%8B%E8%B1%90%E7%9B%88%EF%BC%8C%E6%9D%AF%E4%B8%AD%E7%9A%84%E6%B0%B4%E4%B8%8D%E5%86%8D%E5%8F%AA%E5%B1%AC%E6%96%BC%E8%87%AA%E5%B7%B1%EF%BC%8C%E8%80%8C%E6%98%AF%E5%8F%AF%E4%BB%A5%E5%88%86%E4%BA%AB%E3%80%81%E6%85%B6%E7%A5%9D%E8%88%87%E6%BB%8B%E9%A4%8A%E4%BB%96%E4%BA%BA%E3%80%82'),
    'No.IV - Luxury',
    t('%E6%84%89%E6%82%85%E8%AE%8A%E5%BE%97%E6%9F%94%E8%BB%9F%E8%80%8C%E6%B5%B7%E9%87%8F%EF%BC%8C%E4%BD%86%E4%B9%9F%E6%9C%89%E6%B2%89%E6%BA%BA%E7%9A%84%E9%9A%B1%E6%82%A3%E3%80%82%E5%AE%83%E6%8F%90%E9%86%92%E4%BA%AB%E5%8F%97%E4%B8%8D%E6%98%AF%E9%8C%AF%EF%BC%8C%E4%BD%86%E8%8B%A5%E7%BC%BA%E4%B9%8F%E6%B8%85%E9%86%92%EF%BC%8C%E6%BB%BF%E8%B6%B3%E6%9C%83%E8%AE%8A%E6%88%90%E9%88%8D%E5%8C%96%E3%80%82'),
    'No.V - Disappointment',
    t('%E6%83%85%E6%84%9F%E6%9C%9F%E5%BE%85%E8%90%BD%E7%A9%BA%EF%BC%8C%E6%9D%AF%E4%B8%AD%E7%9A%84%E6%B0%B4%E8%AE%8A%E6%B7%A1%E3%80%81%E8%AE%8A%E5%86%B7%E3%80%82%E9%80%99%E5%BC%B5%E7%89%8C%E4%B8%8D%E6%98%AF%E5%96%AE%E7%B4%94%E8%AA%AA%E5%A4%B1%E6%95%97%EF%BC%8C%E8%80%8C%E6%98%AF%E8%A6%81%E4%BD%A0%E7%9C%8B%E8%A6%8B%E5%8E%9F%E6%9C%AC%E6%8A%95%E5%B0%84%E7%9A%84%E5%B9%BB%E6%83%B3%E3%80%82'),
    'No.VI - Pleasure',
    t('%E5%85%AD%E8%81%96%E6%9D%AF%E5%B8%B6%E4%BE%86%E6%BA%AB%E6%9F%94%E7%9A%84%E6%84%89%E6%82%85%EF%BC%8C%E8%B1%A1%E5%BE%B5%E5%96%AE%E7%B4%94%E3%80%81%E6%84%9F%E5%AE%98%E3%80%81%E5%9B%9E%E6%86%B6%E8%88%87%E8%A2%AB%E6%BB%8B%E9%A4%8A%E7%9A%84%E6%84%9F%E8%A6%BA%E3%80%82%E5%AE%83%E6%98%AF%E4%B8%80%E7%A8%AE%E4%B8%8D%E9%9C%80%E8%A6%81%E8%AD%89%E6%98%8E%E7%9A%84%E5%96%9C%E6%82%85%E3%80%82'),
    'No.VII - Debauch',
    t('%E6%B0%B4%E9%96%8B%E5%A7%8B%E6%B5%B8%E6%BB%BF%E8%80%8C%E5%A4%B1%E5%8E%BB%E8%BC%AA%E5%BB%93%EF%BC%8C%E4%BB%A3%E8%A1%A8%E6%88%90%E7%99%AE%E3%80%81%E9%81%8E%E9%87%8F%E3%80%81%E8%BF%B7%E6%83%98%E8%88%87%E6%83%85%E7%B7%92%E7%9A%84%E9%9C%A7%E5%8C%96%E3%80%82%E5%AE%83%E5%95%8F%E7%9A%84%E6%98%AF%EF%BC%9A%E4%BD%A0%E7%9C%9F%E7%9A%84%E5%9C%A8%E6%BB%BF%E8%B6%B3%EF%BC%8C%E9%82%84%E6%98%AF%E5%8F%AA%E5%9C%A8%E9%80%83%E9%81%BF%EF%BC%9F'),
    'No.VIII - Indolence',
    t('%E6%83%85%E6%84%9F%E5%81%9C%E6%BB%AF%EF%BC%8C%E6%B5%81%E5%8B%95%E8%AE%8A%E5%BE%97%E7%B7%A9%E6%85%A2%E7%94%9A%E8%87%B3%E7%84%A1%E5%8A%9B%E3%80%82%E9%80%99%E5%BC%B5%E7%89%8C%E6%8F%90%E9%86%92%E4%BD%A0%E8%BE%A8%E8%AA%8D%E5%93%AA%E4%BA%9B%E6%84%9F%E5%8F%97%E5%B7%B2%E7%B6%93%E5%A4%B1%E5%8E%BB%E7%94%9F%E5%91%BD%E5%8A%9B%EF%BC%8C%E5%93%AA%E4%BA%9B%E9%97%9C%E4%BF%82%E5%8F%AA%E5%89%A9%E6%85%A3%E6%80%A7%E3%80%82'),
    'No.IX - Happiness',
    t('%E6%BB%BF%E8%B6%B3%E6%88%90%E5%BD%A2%EF%BC%8C%E5%BF%83%E9%9D%88%E5%9C%A8%E6%83%85%E6%84%9F%E4%B8%8A%E5%BE%97%E5%88%B0%E5%AE%89%E7%BD%AE%E3%80%82%E9%80%99%E6%98%AF%E9%A1%98%E6%9C%9B%E8%A2%AB%E5%9B%9E%E6%87%89%E3%80%81%E9%97%9C%E4%BF%82%E6%9C%89%E6%9A%96%E5%BA%A6%E3%80%81%E5%85%A7%E5%9C%A8%E6%84%9F%E5%88%B0%E8%B1%90%E8%B6%B3%E7%9A%84%E7%89%8C%E3%80%82'),
    'No.X - Satiety',
    t('%E6%83%85%E6%84%9F%E5%88%B0%E9%81%94%E6%BB%BF%E6%BA%A2%E7%9A%84%E9%A0%82%E9%BB%9E%E3%80%82%E5%AE%83%E5%8F%AF%E4%BB%A5%E6%98%AF%E5%AE%8C%E6%88%90%E3%80%81%E5%9C%98%E5%9C%93%E8%88%87%E5%AE%89%E5%BF%83%EF%BC%8C%E4%B9%9F%E5%8F%AF%E8%83%BD%E6%98%AF%E9%81%8E%E6%BB%BF%E4%B9%8B%E5%BE%8C%E7%9A%84%E9%A3%BD%E5%92%8C%EF%BC%9B%E6%BB%BF%E8%B6%B3%E4%B9%8B%E5%BE%8C%EF%BC%8C%E4%B8%8B%E4%B8%80%E6%AD%A5%E6%98%AF%E5%86%8D%E6%AC%A1%E6%B5%81%E5%8B%95%E3%80%82')
  ].join('\n')
};

const suitCodexArticles = [
  cupsCodexArticle,
  {
    systemType: 'TAROT',
    tabType: 'CODEX',
    category: 'DIVINATION',
    title: '權杖秘典：火元素小牌全解',
    detail: '權杖組對應火元素，象徵意志、行動、衝動、創造力與生命力的推進。',
    content: [
      '權杖是火的路徑。它描述一個人如何啟動、爭取、燃燒，也描述意志過度時如何變成壓力。',
      '',
      'Ace of Wands：火元素根源，新的行動衝動與創造火花。',
      'Dominion：意志開始掌握方向，適合建立主導權。',
      'Virtue：穩定且有品格的創造力，火焰找到正當形式。',
      'Completion：階段抵達完成，慶祝、安置與小型勝利。',
      'Strife：競爭與摩擦，提醒你分辨真正的目標與無謂消耗。',
      'Victory：被看見的成果，努力獲得外界回應。',
      'Valour：在阻力中堅持，勇氣比勝算更重要。',
      'Swiftness：訊息、速度、快速推進，事情會突然加速。',
      'Strength：續航力、復原力，火焰被穩定守住。',
      'Oppression：壓力過載，意志變成負擔，需要重新分配重量。'
    ].join('\n')
  },
  {
    systemType: 'TAROT',
    tabType: 'CODEX',
    category: 'DIVINATION',
    title: '寶劍秘典：風元素小牌全解',
    detail: '寶劍組對應風元素，象徵思考、語言、判斷、衝突、清醒與切割。',
    content: [
      '寶劍是風與理性的刀刃。它帶來清楚，也帶來疼痛；帶來真相，也要求你承受真相。',
      '',
      'Ace of Swords：真理之刃，清楚、決斷與新的理解。',
      'Peace：短暫平衡，衝突暫停，心智回到安靜。',
      'Sorrow：痛苦讓真相浮現，悲傷不是失敗而是揭露。',
      'Truce：需要休息與協議，不宜繼續硬碰硬。',
      'Defeat：立場受挫，提醒你不要用自尊替代判斷。',
      'Science：分析、精準、方法論，適合拆解問題。',
      'Futility：努力方向可能錯置，越用力越消耗。',
      'Interference：雜訊干擾，外界意見過多。',
      'Cruelty：焦慮與自我攻擊，思考變成傷害。',
      'Ruin：舊結構崩解，停止撐住已經結束的事。'
    ].join('\n')
  },
  {
    systemType: 'TAROT',
    tabType: 'CODEX',
    category: 'DIVINATION',
    title: '圓盤秘典：土元素小牌全解',
    detail: '圓盤組對應土元素，象徵金錢、身體、工作、資源、成果與現實穩定。',
    content: [
      '圓盤是土的容器。它說的是現實如何成形：你投入什麼、維持什麼，以及什麼正在累積。',
      '',
      'Ace of Disks：物質種子，新的資源與可落地機會。',
      'Change：交換與調整，穩定來自彈性。',
      'Works：技術、合作與工程，成果需要結構。',
      'Power：資源被掌握，也可能過度控制。',
      'Worry：匱乏焦慮，提醒你檢查真正缺的是資源還是安全感。',
      'Success：現實成果可見，付出得到回報。',
      'Failure：延遲與挫敗，不代表終局，但需要修正方法。',
      'Prudence：耐心耕耘，小心管理長期會見效。',
      'Gain：收益與精緻化，努力轉成可用價值。',
      'Wealth：累積完成，資源形成系統與傳承。'
    ].join('\n')
  }
];

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
  console.log(`[tarot-cards] Seeded ${suitCodexArticles.length} suit codex articles.`);
}

seedTarotCards()
  .catch((error) => {
    console.error('[tarot-cards] Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
