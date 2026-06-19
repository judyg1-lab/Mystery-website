const { seedMysticArticles } = require('./seedMysticArticles');

seedMysticArticles()
  .catch((error) => {
    console.error('[spider] Article seed failed:', error);
    process.exit(1);
  });
