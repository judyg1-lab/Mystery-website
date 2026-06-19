const { execFileSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function runSeed(scriptName) {
  execFileSync(process.execPath, [path.join(__dirname, scriptName)], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
}

async function seedIfEmpty() {
  const [articleCount, tarotCardCount] = await Promise.all([
    prisma.article.count(),
    prisma.tarotCard.count()
  ]);

  if (articleCount === 0) {
    console.log('[seed-if-empty] Article table is empty. Seeding mystic articles...');
    runSeed('seedMysticArticles.js');
  } else {
    console.log(`[seed-if-empty] Article table has ${articleCount} rows. Skipping article seed.`);
  }

  if (tarotCardCount === 0) {
    console.log('[seed-if-empty] TarotCard table is empty. Seeding tarot cards...');
    runSeed('seedTarotCards.js');
  } else {
    console.log(`[seed-if-empty] TarotCard table has ${tarotCardCount} rows. Skipping tarot card seed.`);
  }
}

seedIfEmpty()
  .catch((error) => {
    console.error('[seed-if-empty] Failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
