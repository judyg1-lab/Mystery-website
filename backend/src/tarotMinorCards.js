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
  ['0', 'The Fool', 'Air / Aleph', 'the fool.png', '#f6e27a', 'The first leap into the unknown, innocence, risk, and liberated beginning.'],
  ['I', 'The Magus', 'Mercury / Beth', 'the magus.png', '#c7b7ff', 'Will, language, technique, and the focused act of manifestation.'],
  ['II', 'The Priestess', 'Moon / Gimel', 'the priestess.png', '#d9d6ff', 'Hidden wisdom, silence, intuition, and the veil between worlds.'],
  ['III', 'The Empress', 'Venus / Daleth', 'the empress.png', '#ff9bcf', 'Fertility, beauty, embodied creation, and the living power of attraction.'],
  ['IV', 'The Emperor', 'Aries / Tzaddi', 'the emperor.png', '#ff6b42', 'Structure, authority, protection, and the sovereign force of form.'],
  ['V', 'The Hierophant', 'Taurus / Vav', 'the hierophant.png', '#d5b56b', 'Initiation, teaching, tradition, and the channeling of sacred knowledge.'],
  ['VI', 'The Lovers', 'Gemini / Zain', 'the lovers.png', '#ff83c6', 'Union, choice, polarity, and the alchemy of relationship.'],
  ['VII', 'The Chariot', 'Cancer / Cheth', 'the chariot.png', '#7bbcff', 'Movement, protection, discipline, and the vehicle of the will.'],
  ['VIII', 'Adjustment', 'Libra / Lamed', 'adjustment.png', '#b8a1ff', 'Equilibrium, exact balance, karma, and the intelligence of correction.'],
  ['IX', 'The Hermit', 'Virgo / Yod', 'the hermit.png', '#d8c488', 'Solitude, inner guidance, refinement, and the lantern of hidden truth.'],
  ['X', 'Fortune', 'Jupiter / Kaph', 'fortune.png', '#f0c64b', 'Cycles, turning fate, opportunity, and the wheel of change.'],
  ['XI', 'Lust', 'Leo / Teth', 'lust.png', '#ff4f8f', 'Vital force, courage, desire, and the creative fire of embodiment.'],
  ['XII', 'The Hanged Man', 'Water / Mem', 'the hanged man.png', '#68d7ff', 'Suspension, reversal, surrender, and wisdom through altered perspective.'],
  ['XIII', 'Death', 'Scorpio / Nun', 'death.png', '#77e0bd', 'Transformation, release, ending, and the clearing power of renewal.'],
  ['XIV', 'Art', 'Sagittarius / Samekh', 'art.png', '#ffa95f', 'Fusion, tempering, synthesis, and the sacred craft of integration.'],
  ['XV', 'The Devil', 'Capricorn / Ayin', 'the devil.png', '#9d6bff', 'Material force, instinct, bondage, and the shadow of desire.'],
  ['XVI', 'The Tower', 'Mars / Peh', 'the tower.png', '#ff5f5f', 'Sudden revelation, collapse of false forms, and disruptive liberation.'],
  ['XVII', 'The Star', 'Aquarius / Tzaddi', 'the star.png', '#83d9ff', 'Hope, renewal, spacious vision, and the healing current of the future.'],
  ['XVIII', 'The Moon', 'Pisces / Qoph', 'the moon.png', '#9eb2ff', 'Dream, fear, threshold, and the uncertain path through the unconscious.'],
  ['XIX', 'The Sun', 'Sun / Resh', 'the sun.png', '#ffd36a', 'Radiance, clarity, success, and the generous center of life.'],
  ['XX', 'The Aeon', 'Fire and Spirit / Shin', 'the aeon.png', '#ff8a5c', 'Awakening, judgment, rebirth, and the call of a new age.'],
  ['XXI', 'The Universe', 'Saturn / Tau', 'the universe.png', '#c6b6ff', 'Completion, embodiment, totality, and the dance of all worlds.']
];

const minorArcana = [
  // [rank, title, subtitle, accentColor, meaning]
  ['WANDS', [
    ['ace', 'Ace of Wands', 'Root of Fire', '#ff8a3d', 'A vertical staff of living fire, the first spark of will.'],
    ['two', 'Dominion', 'Two of Wands', '#ff6633', 'A poised force of command, ambition, and directed courage.'],
    ['three', 'Virtue', 'Three of Wands', '#ff9d4d', 'Stable creative fire, confidence, and honorable expansion.'],
    ['four', 'Completion', 'Four of Wands', '#ffc45a', 'A contained flame temple, arrival, harmony, and celebration.'],
    ['five', 'Strife', 'Five of Wands', '#e64040', 'Competing flames, friction, pressure, and creative conflict.'],
    ['six', 'Victory', 'Six of Wands', '#ffd166', 'Radiant fire crowned with triumph and earned recognition.'],
    ['seven', 'Valour', 'Seven of Wands', '#ff5f2e', 'A brave flame standing against resistance and doubt.'],
    ['eight', 'Swiftness', 'Eight of Wands', '#ffb84d', 'Eight streaking rods like meteors, motion and rapid messages.'],
    ['nine', 'Strength', 'Nine of Wands', '#ff7a2f', 'A protected inner flame, resilience, stamina, and recovery.'],
    ['ten', 'Oppression', 'Ten of Wands', '#9e2f2f', 'Heavy crossed rods, pressure, overload, and the cost of force.'],
    ['knight', 'Knight of Wands', 'Court of Fire', '#ff6b2b', 'A charging solar guardian of impulse, heat, and bold action.'],
    ['queen', 'Queen of Wands', 'Court of Fire', '#ff8f57', 'A magnetic flame sovereign, charisma, instinct, and command.'],
    ['prince', 'Prince of Wands', 'Court of Fire', '#ffae42', 'A swift prince in a chariot of sparks, vision and movement.'],
    ['princess', 'Princess of Wands', 'Court of Fire', '#ffc166', 'A young keeper of sacred flame, discovery and brave beginning.']
  ]],
  ['CUPS', [
    ['ace', 'Ace of Cups', 'Root of Water', '#6ee7ff', 'A chalice overflowing with lunar water, blessing and receptivity.'],
    ['two', 'Love', 'Two of Cups', '#ff5fbf', 'Two radiant cups joined by bright rose and blue water, affection and union.'],
    ['three', 'Abundance', 'Three of Cups', '#7fe7c8', 'Three vessels overflowing with generous emotional fullness.'],
    ['four', 'Luxury', 'Four of Cups', '#b983ff', 'Moonlit cups in velvet water, pleasure, softness, and saturation.'],
    ['five', 'Disappointment', 'Five of Cups', '#6070a8', 'Dim cups beneath a falling tide, loss, regret, and emotional drain.'],
    ['six', 'Pleasure', 'Six of Cups', '#6dd6ff', 'Six cups in a flowing mandala, simple joy and sensual ease.'],
    ['seven', 'Debauch', 'Seven of Cups', '#a15cff', 'Seven cups spilling luminous excess, fantasy, indulgence, and fog.'],
    ['eight', 'Indolence', 'Eight of Cups', '#4a72a8', 'Still water and fading cups, stagnation, heaviness, and withdrawal.'],
    ['nine', 'Happiness', 'Nine of Cups', '#71f2d1', 'A fountain of nine cups, emotional satisfaction and blessing.'],
    ['ten', 'Satiety', 'Ten of Cups', '#7cc9ff', 'A full water circuit, completion, peace, and emotional fullness.'],
    ['knight', 'Knight of Cups', 'Court of Water', '#76d9ff', 'A lunar knight carrying a sacred cup through deep water.'],
    ['queen', 'Queen of Cups', 'Court of Water', '#a78bfa', 'A reflective queen veiled in water, intuition, dream, and care.'],
    ['prince', 'Prince of Cups', 'Court of Water', '#5fd4ff', 'A calm prince steering a vessel through the astral sea.'],
    ['princess', 'Princess of Cups', 'Court of Water', '#ff92d0', 'A young oracle with a pearl cup, wonder, tenderness, and vision.']
  ]],
  ['SWORDS', [
    ['ace', 'Ace of Swords', 'Root of Air', '#e6ecff', 'A blade of clear light, truth, focus, and decisive perception.'],
    ['two', 'Peace', 'Two of Swords', '#a9c4ff', 'Two balanced blades under a quiet moon, truce and mental stillness.'],
    ['three', 'Sorrow', 'Three of Swords', '#8c96c8', 'Three blades crossing a violet storm, grief, clarity, and pain.'],
    ['four', 'Truce', 'Four of Swords', '#b5c7ff', 'Four resting blades in a geometric sanctuary, pause and recovery.'],
    ['five', 'Defeat', 'Five of Swords', '#7d88b8', 'Broken angles and cold blades, loss, conflict, and wounded pride.'],
    ['six', 'Science', 'Six of Swords', '#c9d6ff', 'Six blades arranged like instruments, analysis and exact thought.'],
    ['seven', 'Futility', 'Seven of Swords', '#9fa9d8', 'Seven blades in unstable geometry, wasted effort and doubt.'],
    ['eight', 'Interference', 'Eight of Swords', '#858fc4', 'Eight blades forming a cage, obstruction and mental noise.'],
    ['nine', 'Cruelty', 'Nine of Swords', '#6f78a8', 'Nine sharp blades in a dark lattice, anxiety and harsh thought.'],
    ['ten', 'Ruin', 'Ten of Swords', '#545d8c', 'Ten descending blades, collapse, finality, and release of illusion.'],
    ['knight', 'Knight of Swords', 'Court of Air', '#d5deff', 'A windborne knight with a silver blade, speed and precision.'],
    ['queen', 'Queen of Swords', 'Court of Air', '#bcc8ff', 'A clear-eyed queen of air, discernment, independence, and truth.'],
    ['prince', 'Prince of Swords', 'Court of Air', '#aab7ff', 'A calculating prince among glass wings, strategy and intellect.'],
    ['princess', 'Princess of Swords', 'Court of Air', '#e1e7ff', 'A vigilant young blade bearer, curiosity and sharp perception.']
  ]],
  ['DISKS', [
    ['ace', 'Ace of Disks', 'Root of Earth', '#d8b45a', 'A radiant golden disk rooted in stone, manifestation and seed value.'],
    ['two', 'Change', 'Two of Disks', '#6fd18c', 'Two disks in a turning serpent loop, adaptation and exchange.'],
    ['three', 'Works', 'Three of Disks', '#b8a15d', 'Three disks in a craft temple, skill, labor, and structure.'],
    ['four', 'Power', 'Four of Disks', '#c6a24d', 'Four disks as a fortress seal, stability, possession, and control.'],
    ['five', 'Worry', 'Five of Disks', '#7a8755', 'Five dim disks in cracked stone, scarcity, anxiety, and repair.'],
    ['six', 'Success', 'Six of Disks', '#d4af37', 'Six disks in balanced gold, support, prosperity, and visible results.'],
    ['seven', 'Failure', 'Seven of Disks', '#6f6b4a', 'Seven tarnished disks in shadowed earth, delay and discouragement.'],
    ['eight', 'Prudence', 'Eight of Disks', '#8fc16f', 'Eight disks as careful seeds, craft, patience, and cultivation.'],
    ['nine', 'Gain', 'Nine of Disks', '#c9b35b', 'Nine disks blooming like mineral flowers, profit and refinement.'],
    ['ten', 'Wealth', 'Ten of Disks', '#d9bd67', 'Ten disks in a complete earth mandala, inheritance and abundance.'],
    ['knight', 'Knight of Disks', 'Court of Earth', '#bfa45a', 'A steady guardian of fields and stone, endurance and provision.'],
    ['queen', 'Queen of Disks', 'Court of Earth', '#9fbf76', 'A fertile earth queen, protection, patience, and embodied wisdom.'],
    ['prince', 'Prince of Disks', 'Court of Earth', '#c2a85f', 'A prince of harvest machines and stone geometry, method and growth.'],
    ['princess', 'Princess of Disks', 'Court of Earth', '#d6bd78', 'A young earth keeper with a seed disk, potential and care.']
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
