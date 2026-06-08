const CARD_BACK_URL = '/tarot/tarot-card.png';

const suitBases = {
  WANDS: {
    folder: 'wands',
    symbol: 'wands of fire',
    basePalette: 'charcoal black, midnight purple, antique gold linework',
    accent: '#ff7a2f',
    note: 'ember orange and controlled flame accents'
  },
  CUPS: {
    folder: 'cups',
    symbol: 'cups of water',
    basePalette: 'charcoal black, midnight purple, antique gold linework',
    accent: '#5fd4ff',
    note: 'luminous blue, pearl, and emotional color accents'
  },
  SWORDS: {
    folder: 'swords',
    symbol: 'swords of air',
    basePalette: 'charcoal black, midnight purple, antique gold linework',
    accent: '#c9d6ff',
    note: 'silver blue, glass, and sharp moonlit accents'
  },
  DISKS: {
    folder: 'disks',
    symbol: 'disks of earth',
    basePalette: 'charcoal black, midnight purple, antique gold linework',
    accent: '#d4af37',
    note: 'deep green, bronze, mineral, and gold accents'
  }
};

const existingImageUrls = {
  'wands-ace-ace-of-wands': '/tarot/cards/wands/ace%20of%20wands.png',
  'wands-two-dominion': '/tarot/cards/wands/dominion.png',
  'wands-three-virtue': '/tarot/cards/wands/virtue.png',
  'wands-four-completion': '/tarot/cards/wands/completion.png',
  'wands-five-strife': '/tarot/cards/wands/strife.png',
  'wands-six-victory': '/tarot/cards/wands/victory.png',
  'wands-seven-valour': '/tarot/cards/wands/valour.png',
  'wands-eight-swiftness': '/tarot/cards/wands/swiftness.png',
  'wands-nine-strength': '/tarot/cards/wands/stength.png',
  'wands-ten-oppression': '/tarot/cards/wands/oppression.png',
  'wands-knight-knight-of-wands': '/tarot/cards/court/knight%20of%20wands.png',
  'wands-queen-queen-of-wands': '/tarot/cards/court/queen%20of%20wands.png',
  'wands-prince-prince-of-wands': '/tarot/cards/court/prince%20of%20wands.png',
  'wands-princess-princess-of-wands': '/tarot/cards/court/princess%20of%20wands.png',
  'cups-ace-ace-of-cups': '/tarot/cards/cups/ace%20of%20cups.png',
  'cups-two-love': '/tarot/cards/cups/love.png',
  'cups-three-abundance': '/tarot/cards/cups/abundance.png',
  'cups-four-luxury': '/tarot/cards/cups/luxury.png',
  'cups-five-disappointment': '/tarot/cards/cups/disappointment.png',
  'cups-six-pleasure': '/tarot/cards/cups/pleasure.png',
  'cups-seven-debauch': '/tarot/cards/cups/debauch.png',
  'cups-eight-indolence': '/tarot/cards/cups/Indolence.png',
  'cups-nine-happiness': '/tarot/cards/cups/happiness.png',
  'cups-ten-satiety': '/tarot/cards/cups/satiety.png',
  'cups-knight-knight-of-cups': '/tarot/cards/court/knight%20of%20cups.png',
  'cups-queen-queen-of-cups': '/tarot/cards/court/queen%20of%20cups.png',
  'cups-prince-prince-of-cups': '/tarot/cards/court/prince%20of%20cups.png',
  'cups-princess-princess-of-cups': '/tarot/cards/court/princess%20of%20cups.png',
  'swords-ace-ace-of-swords': '/tarot/cards/swords/ace%20of%20swords.png',
  'swords-two-peace': '/tarot/cards/swords/peace.png',
  'swords-three-sorrow': '/tarot/cards/swords/sorrow.png',
  'swords-four-truce': '/tarot/cards/swords/truce.png',
  'swords-five-defeat': '/tarot/cards/swords/defeat.png',
  'swords-six-science': '/tarot/cards/swords/science.png',
  'swords-seven-futility': '/tarot/cards/swords/futility.png',
  'swords-eight-interference': '/tarot/cards/swords/interference.png',
  'swords-nine-cruelty': '/tarot/cards/swords/cruelty.png',
  'swords-ten-ruin': '/tarot/cards/swords/ruin.png',
  'swords-knight-knight-of-swords': '/tarot/cards/court/knight%20of%20swords.png',
  'swords-queen-queen-of-swords': '/tarot/cards/court/queen%20of%20swords.png',
  'swords-prince-prince-of-swords': '/tarot/cards/court/prince%20of%20swords.png',
  'swords-princess-princess-of-swords': '/tarot/cards/court/princess%20of%20swords.png',
  'disks-ace-ace-of-disks': '/tarot/cards/disks/ace%20of%20disks.png',
  'disks-two-change': '/tarot/cards/disks/change.png',
  'disks-three-works': '/tarot/cards/disks/works.png',
  'disks-four-power': '/tarot/cards/disks/power.png',
  'disks-five-worry': '/tarot/cards/disks/worry.png',
  'disks-six-success': '/tarot/cards/disks/success.png',
  'disks-seven-failure': '/tarot/cards/disks/failure.png',
  'disks-eight-prudence': '/tarot/cards/disks/pruduence.png',
  'disks-nine-gain': '/tarot/cards/disks/gain.png',
  'disks-ten-wealth': '/tarot/cards/disks/wealth.png',
  'disks-knight-knight-of-disks': '/tarot/cards/court/knight%20of%20disks.png',
  'disks-queen-queen-of-disks': '/tarot/cards/court/queen%20of%20disks.png',
  'disks-prince-prince-of-disks': '/tarot/cards/court/prince%20of%20disks.png',
  'disks-princess-princess-of-disks': '/tarot/cards/court/princess%20of%20disks.png'
};

const majorArcana = [
  // [rank, title, subtitle, imageFile, accentColor, meaning]
  ['0', 'The Fool', '風元素 / Aleph', 'the fool.png', '#f6e27a', '跳向未知、純真、冒險，以及重新開始的自由。'],
  ['I', 'The Magus', '水星 / Beth', 'the magus.png', '#c7b7ff', '意志、語言、技巧，以及把想法落實成形的專注力量。'],
  ['II', 'The Priestess', '月亮 / Gimel', 'the priestess.png', '#d9d6ff', '隱藏智慧、沉默、直覺，以及通往潛意識的帷幕。'],
  ['III', 'The Empress', '金星 / Daleth', 'the empress.png', '#ff9bcf', '豐饒、美感、創造力，以及吸引與滋養的生命力量。'],
  ['IV', 'The Emperor', '牡羊座 / Tzaddi', 'the emperor.png', '#ff6b42', '結構、權威、保護，以及讓事物成形的主權意志。'],
  ['V', 'The Hierophant', '金牛座 / Vav', 'the hierophant.png', '#d5b56b', '傳承、教導、啟蒙，以及把神聖知識帶入現實的管道。'],
  ['VI', 'The Lovers', '雙子座 / Zain', 'the lovers.png', '#ff83c6', '結合、選擇、關係中的兩極，以及相遇帶來的煉金變化。'],
  ['VII', 'The Chariot', '巨蟹座 / Cheth', 'the chariot.png', '#7bbcff', '推進、保護、紀律，以及承載意志前行的載具。'],
  ['VIII', 'Adjustment', '天秤座 / Lamed', 'adjustment.png', '#b8a1ff', '平衡、校準、因果，以及把失衡重新調整的智慧。'],
  ['IX', 'The Hermit', '處女座 / Yod', 'the hermit.png', '#d8c488', '獨處、內在指引、精煉，以及在暗處照亮真相的燈。'],
  ['X', 'Fortune', '木星 / Kaph', 'fortune.png', '#f0c64b', '循環、命運轉動、機會，以及局勢正在改變的節點。'],
  ['XI', 'Lust', '獅子座 / Teth', 'lust.png', '#ff4f8f', '生命力、勇氣、欲望，以及把本能轉化為創造的火焰。'],
  ['XII', 'The Hanged Man', '水元素 / Mem', 'the hanged man.png', '#68d7ff', '停頓、反轉、臣服，以及從不同視角獲得智慧。'],
  ['XIII', 'Death', '天蠍座 / Nun', 'death.png', '#77e0bd', '轉化、釋放、結束，以及讓舊形態退場的更新力量。'],
  ['XIV', 'Art', '射手座 / Samekh', 'art.png', '#ffa95f', '調和、融合、煉金整合，以及把衝突素材轉成藝術的能力。'],
  ['XV', 'The Devil', '摩羯座 / Ayin', 'the devil.png', '#9d6bff', '物質力量、本能、束縛，以及慾望陰影中的功課。'],
  ['XVI', 'The Tower', '火星 / Peh', 'the tower.png', '#ff5f5f', '突發揭露、虛假結構崩解，以及被迫覺醒後的解放。'],
  ['XVII', 'The Star', '水瓶座 / Tzaddi', 'the star.png', '#83d9ff', '希望、療癒、遠景，以及來自未來的清澈指引。'],
  ['XVIII', 'The Moon', '雙魚座 / Qoph', 'the moon.png', '#9eb2ff', '夢境、恐懼、門檻，以及穿越潛意識迷霧的路。'],
  ['XIX', 'The Sun', '太陽 / Resh', 'the sun.png', '#ffd36a', '清明、成功、喜悅，以及生命中心穩定散發的光。'],
  ['XX', 'The Aeon', '火與靈 / Shin', 'the aeon.png', '#ff8a5c', '覺醒、審判、重生，以及新階段召喚你回應。'],
  ['XXI', 'The Universe', '土星 / Tau', 'the universe.png', '#c6b6ff', '完成、整合、圓滿，以及一個循環抵達總結。']
];

const minorArcana = [
  // [rank, title, subtitle, accentColor, meaning]
  ['WANDS', [
    ['ace', 'Ace of Wands', '火元素根源', '#ff8a3d', '意志的第一道火花，新的行動力與熱情正在升起。'],
    ['two', 'Dominion', 'Two of Wands', '#ff6633', 'A poised force of command, ambition, and directed courage.'],
    ['three', 'Virtue', 'Three of Wands', '#ff9d4d', 'Stable creative fire, confidence, and honorable expansion.'],
    ['four', 'Completion', 'Four of Wands', '#ffc45a', 'A contained flame temple, arrival, harmony, and celebration.'],
    ['five', 'Strife', 'Five of Wands', '#e64040', 'Competing flames, friction, pressure, and creative conflict.'],
    ['six', 'Victory', 'Six of Wands', '#ffd166', 'Radiant fire crowned with triumph and earned recognition.'],
    ['seven', 'Valour', 'Seven of Wands', '#ff5f2e', 'A brave flame standing against resistance and doubt.'],
    ['eight', 'Swiftness', 'Eight of Wands', '#ffb84d', 'Eight streaking rods like meteors, motion and rapid messages.'],
    ['nine', 'Strength', 'Nine of Wands', '#ff7a2f', 'A protected inner flame, resilience, stamina, and recovery.'],
    ['ten', 'Oppression', 'Ten of Wands', '#9e2f2f', 'Heavy crossed rods, pressure, overload, and the cost of force.'],
    ['knight', 'Knight of Wands', '火元素宮廷牌', '#ff6b2b', '強烈的行動、衝勁與果斷，提醒你掌握熱情的方向。'],
    ['queen', 'Queen of Wands', '火元素宮廷牌', '#ff8f57', '魅力、直覺與掌控力，讓創造力成為可被信任的火。'],
    ['prince', 'Prince of Wands', '火元素宮廷牌', '#ffae42', '快速推進的視野與企圖心，適合把靈感帶上路。'],
    ['princess', 'Princess of Wands', '火元素宮廷牌', '#ffc166', '新冒險的火種、勇氣與探索，正召喚你踏出第一步。']
  ]],
  ['CUPS', [
    ['ace', 'Ace of Cups', '水元素根源', '#6ee7ff', '感受、祝福與接納的源頭，內在柔軟處正在重新流動。'],
    ['two', 'Love', 'Two of Cups', '#ff5fbf', 'Two radiant cups joined by bright rose and blue water, affection and union.'],
    ['three', 'Abundance', 'Three of Cups', '#7fe7c8', 'Three vessels overflowing with generous emotional fullness.'],
    ['four', 'Luxury', 'Four of Cups', '#b983ff', 'Moonlit cups in velvet water, pleasure, softness, and saturation.'],
    ['five', 'Disappointment', 'Five of Cups', '#6070a8', 'Dim cups beneath a falling tide, loss, regret, and emotional drain.'],
    ['six', 'Pleasure', 'Six of Cups', '#6dd6ff', 'Six cups in a flowing mandala, simple joy and sensual ease.'],
    ['seven', 'Debauch', 'Seven of Cups', '#a15cff', 'Seven cups spilling luminous excess, fantasy, indulgence, and fog.'],
    ['eight', 'Indolence', 'Eight of Cups', '#4a72a8', 'Still water and fading cups, stagnation, heaviness, and withdrawal.'],
    ['nine', 'Happiness', 'Nine of Cups', '#71f2d1', 'A fountain of nine cups, emotional satisfaction and blessing.'],
    ['ten', 'Satiety', 'Ten of Cups', '#7cc9ff', 'A full water circuit, completion, peace, and emotional fullness.'],
    ['knight', 'Knight of Cups', '水元素宮廷牌', '#76d9ff', '帶著情感前進的溫柔力量，適合誠實面對渴望。'],
    ['queen', 'Queen of Cups', '水元素宮廷牌', '#a78bfa', '深層直覺、照顧與夢境感受，提醒你相信內在波動。'],
    ['prince', 'Prince of Cups', '水元素宮廷牌', '#5fd4ff', '情感想像與浪漫投射，需要在夢與現實之間取得平衡。'],
    ['princess', 'Princess of Cups', '水元素宮廷牌', '#ff92d0', '純真感受、新愛意與靈感，像一封來自心底的訊息。']
  ]],
  ['SWORDS', [
    ['ace', 'Ace of Swords', '風元素根源', '#e6ecff', '清明的念頭、真相與判斷力，讓混亂被一刀切開。'],
    ['two', 'Peace', 'Two of Swords', '#a9c4ff', 'Two balanced blades under a quiet moon, truce and mental stillness.'],
    ['three', 'Sorrow', 'Three of Swords', '#8c96c8', 'Three blades crossing a violet storm, grief, clarity, and pain.'],
    ['four', 'Truce', 'Four of Swords', '#b5c7ff', 'Four resting blades in a geometric sanctuary, pause and recovery.'],
    ['five', 'Defeat', 'Five of Swords', '#7d88b8', 'Broken angles and cold blades, loss, conflict, and wounded pride.'],
    ['six', 'Science', 'Six of Swords', '#c9d6ff', 'Six blades arranged like instruments, analysis and exact thought.'],
    ['seven', 'Futility', 'Seven of Swords', '#9fa9d8', 'Seven blades in unstable geometry, wasted effort and doubt.'],
    ['eight', 'Interference', 'Eight of Swords', '#858fc4', 'Eight blades forming a cage, obstruction and mental noise.'],
    ['nine', 'Cruelty', 'Nine of Swords', '#6f78a8', 'Nine sharp blades in a dark lattice, anxiety and harsh thought.'],
    ['ten', 'Ruin', 'Ten of Swords', '#545d8c', 'Ten descending blades, collapse, finality, and release of illusion.'],
    ['knight', 'Knight of Swords', '風元素宮廷牌', '#d5deff', '速度、精準與直接行動，也提醒你避免過度急切。'],
    ['queen', 'Queen of Swords', '風元素宮廷牌', '#bcc8ff', '冷靜辨識、獨立判斷與真話，讓界線變得清楚。'],
    ['prince', 'Prince of Swords', '風元素宮廷牌', '#aab7ff', '策略、分析與快速推演，適合把思緒整理成計畫。'],
    ['princess', 'Princess of Swords', '風元素宮廷牌', '#e1e7ff', '觀察、提問與警覺，幫助你看見被忽略的細節。']
  ]],
  ['DISKS', [
    ['ace', 'Ace of Disks', '土元素根源', '#d8b45a', '資源、身體感與實際機會正在萌芽，適合把願望落地。'],
    ['two', 'Change', 'Two of Disks', '#6fd18c', 'Two disks in a turning serpent loop, adaptation and exchange.'],
    ['three', 'Works', 'Three of Disks', '#b8a15d', 'Three disks in a craft temple, skill, labor, and structure.'],
    ['four', 'Power', 'Four of Disks', '#c6a24d', 'Four disks as a fortress seal, stability, possession, and control.'],
    ['five', 'Worry', 'Five of Disks', '#7a8755', 'Five dim disks in cracked stone, scarcity, anxiety, and repair.'],
    ['six', 'Success', 'Six of Disks', '#d4af37', 'Six disks in balanced gold, support, prosperity, and visible results.'],
    ['seven', 'Failure', 'Seven of Disks', '#6f6b4a', 'Seven tarnished disks in shadowed earth, delay and discouragement.'],
    ['eight', 'Prudence', 'Eight of Disks', '#8fc16f', 'Eight disks as careful seeds, craft, patience, and cultivation.'],
    ['nine', 'Gain', 'Nine of Disks', '#c9b35b', 'Nine disks blooming like mineral flowers, profit and refinement.'],
    ['ten', 'Wealth', 'Ten of Disks', '#d9bd67', 'Ten disks in a complete earth mandala, inheritance and abundance.'],
    ['knight', 'Knight of Disks', '土元素宮廷牌', '#bfa45a', '穩定、耐力與可靠執行，提醒你一步一步守住成果。'],
    ['queen', 'Queen of Disks', '土元素宮廷牌', '#9fbf76', '照顧身體、土地與生活品質，讓安全感成為可居住的現實。'],
    ['prince', 'Prince of Disks', '土元素宮廷牌', '#c2a85f', '規劃、生產與長期建設，把資源慢慢養成成果。'],
    ['princess', 'Princess of Disks', '土元素宮廷牌', '#d6bd78', '潛力、孕育與新資源，像種子一樣等待合適季節發芽。']
  ]]
];

function toSlug(suit, rank, title) {
  return `${suit}-${rank}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildPrompt(card, suitInfo) {
  return [
    'Create an original occult tarot minor arcana card illustration.',
    `Card: ${card.title}. Rank: ${card.rank}. Suit: ${card.suit}.`,
    `Core symbol: ${suitInfo.symbol}.`,
    `Meaning to express visually: ${card.meaning}`,
    `Style reference: follow the provided Adjustment card direction: solemn vertical tarot composition, dark mystical art deco, charcoal black and midnight purple base, antique gold filigree, thin geometric sacred lines, layered celestial spheres, textured parchment, refined thin borders, elegant ritual symmetry.`,
    `Color direction: keep the base palette consistent, but add ${card.accentColor} as the controlled accent for this specific card; ${card.paletteNote}.`,
    'Composition: vertical tarot card, full card face, ornate border, centered symbolic scene, elegant bottom title area, no cropped edges.',
    'Constraints: original art only, not a copy of any existing tarot deck, no watermark, no logo, no extra readable text except the card title and rank if rendered cleanly.'
  ].join(' ');
}

const tarotMinorCards = minorArcana.flatMap(([suit, cards], suitIndex) => {
  const suitInfo = suitBases[suit];
  return cards.map(([rank, title, subtitle, accentColor, meaning], cardIndex) => {
    const slug = toSlug(suit, rank, title);
    const paletteNote = `${suitInfo.note}; this card accent is ${accentColor}`;
    const card = {
      deck: 'THOTH_INSPIRED_MINOR',
      suit,
      rank,
      orderIndex: suitIndex * 14 + cardIndex + 1,
      title,
      subtitle,
      slug,
      imageUrl: existingImageUrls[slug] || `/tarot/cards/${suitInfo.folder}/${slug}.png`,
      backImageUrl: CARD_BACK_URL,
      accentColor,
      paletteNote,
      meaning
    };
    return { ...card, prompt: buildPrompt(card, suitInfo) };
  });
});

const tarotMajorCards = majorArcana.map(([rank, title, subtitle, imageFile, accentColor, meaning], index) => {
  const slug = toSlug('major', rank, title);
  const card = {
    deck: 'THOTH_INSPIRED_MAJOR',
    suit: 'MAJOR',
    rank,
    orderIndex: index,
    title,
    subtitle,
    slug,
    imageUrl: imageFile ? `/tarot/cards/main/${encodeURIComponent(imageFile)}` : '',
    backImageUrl: CARD_BACK_URL,
    accentColor,
    paletteNote: 'major arcana; charcoal black, midnight purple, antique gold linework, symbolic full-card ritual composition',
    meaning
  };

  return {
    ...card,
    prompt: [
      'Original occult tarot major arcana card metadata.',
      `Card: ${card.title}. Rank: ${card.rank}.`,
      `Meaning: ${card.meaning}`
    ].join(' ')
  };
});

module.exports = {
  tarotMinorCards,
  tarotMajorCards
};
