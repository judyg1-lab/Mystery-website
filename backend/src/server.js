const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/tarot', express.static(path.join(__dirname, '../public/tarot')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');

        if (!fs.existsSync(uploadDir)) {fs.mkdirSync(uploadDir, { recursive: true });}
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Add a timestamp suffix to avoid filename collisions.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const COMMON_PASSWORDS = new Set([
    'password', 'password123', '123456', '12345678', '123456789', 'qwerty', 'qwerty123',
    'admin123', 'letmein', 'welcome', 'iloveyou', 'abc123', '111111', '000000', 'mystic123'
]);
const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{2,39}$/;

function validatePasswordStrength(password = '') {
    const lower = password.toLowerCase();
    const checks = [
        password.length >= 12,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
        /[^A-Za-z0-9]/.test(password)
    ];
    if (COMMON_PASSWORDS.has(lower) || /^\d+$/.test(password) || /^(.)\1+$/.test(password)) {
        return '密碼太常見或太容易被猜到';
    }
    if (/(.)\1{3,}/.test(password)) {
        return '密碼不可以使用大量重複字元';
    }
    if (checks.filter(Boolean).length < 5) {
        return '密碼至少 12 碼，並包含大小寫英文、數字與符號';
    }
    return '';
}

// Verify JWT tokens from protected frontend requests.
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: '未提供授權憑證' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: '授權憑證無效或已過期' });
        req.user = user;
        next();
    });
};
app.post('/api/auth/register', async (req, res) => {
    const { username, email, phone, password } = req.body;
    try {
        const normalizedUsername = String(username || '').trim();
        if (!USERNAME_PATTERN.test(normalizedUsername)) {
            return res.status(400).json({ error: '帳號需以英文字母開頭，僅可使用英文字母、數字、底線或短橫，長度 3-40 字。' });
        }
        const passwordError = validatePasswordStrength(password || '');
        if (passwordError) return res.status(400).json({ error: passwordError });
        const existingUser = await prisma.user.findFirst({where: { OR: [{ email }, { username: normalizedUsername }, { phone }] }});
        if (existingUser) return res.status(400).json({ error: '帳號、Email 或電話已被註冊' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({data: { username: normalizedUsername, email, phone, password: hashedPassword }});
        res.status(201).json({ message: '註冊成功，請重新登入。', userId: newUser.id });
    } catch (error) {
        res.status(500).json({ error: '註冊失敗' });
    }
    });

app.post('/api/auth/login', async (req, res) => {
    const { username, password, rememberMe } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        // return 404 if user not found, to prevent attackers from knowing which usernames are valid
        if (!user) {return res.status(404).json({ error: 'Authentication failed: User not found.' });}

        //return 401 if password is incorrect, to prevent attackers from knowing which usernames are valid
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {return res.status(401).json({ error: 'Authentication failed: Incorrect password.' });}

        const tokenExpiry = rememberMe ? '24h' : '2h';
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: tokenExpiry });
        res.json({ message: '登入成功', token, user });
    } catch (error) {res.status(500).json({ error: '登入失敗，請稍後再試' });}
    });

app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, username: true, email: true, phone: true, bio: true, avatarUrl: true, masterCard: true }
    });
    res.json(user);
    } catch (error) {res.status(500).json({ error: '讀取使用者資料失敗' });}});

app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Please choose an image file to upload' });

  // Store a browser-readable URL for the uploaded avatar.
    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    try {
        await prisma.user.update({
            where: { id: req.user.userId },
            data: { avatarUrl }});
        res.json({ message: '頭像上傳成功', avatarUrl });
    } catch (error) {res.status(500).json({ error: '頭像上傳失敗' });}});

app.put('/api/user/profile/update', authenticateToken, async (req, res) => {
    const { username, bio} = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { username, bio }});
        res.json({ message: '個人資料已更新', user: updatedUser });
    } catch (error) {res.status(500).json({ error: '個人資料更新失敗' });}});

app.put('/api/user/master-card', authenticateToken, async (req, res) => {
    const { masterCard } = req.body;
    if (!masterCard || typeof masterCard !== 'string') {
        return res.status(400).json({ error: '請提供有效的主牌名稱' });
    }

    try {
        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: { masterCard },
            select: { id: true, masterCard: true }
        });
        res.json({ message: '靈魂主牌已儲存', masterCard: user.masterCard });
    } catch (error) {
        res.status(500).json({ error: '靈魂主牌儲存失敗' });
    }
});

app.delete('/api/user/master-card', authenticateToken, async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user.userId },
            data: { masterCard: null }
        });
        res.json({ message: '靈魂主牌已重置' });
    } catch (error) {
        res.status(500).json({ error: '靈魂主牌重置失敗' });
    }
});

// put means update
app.put('/api/user/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ error: '目前密碼輸入錯誤' });
        }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword }
    });
    res.json({ message: '密碼已成功更新' });
    } catch (error) {
    res.status(500).json({ error: '密碼更新失敗' });}});

app.delete('/api/user/delete', authenticateToken, async (req, res) => { //HTTP method
    try {
        await prisma.user.delete({ where: { id: req.user.userId } });
        res.json({ message: '帳號已刪除，相關資料已清除' });
    } catch (error) {
    res.status(500).json({ error: '刪除帳號失敗' });}});

app.get('/api/user/favorites', authenticateToken, async (req, res) => {
    try {
        const favorites = await prisma.favorite.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
            include: { article: true, history: true }
        });

        const normalized = favorites.map(fav => {
            const source = fav.article || fav.history || {};
            return {
                id: fav.id,
                userId: fav.userId,
                articleId: fav.articleId,
                historyId: fav.historyId,
                tabType: fav.article ? fav.article.tabType : null,
                type: source.systemType || null,
                category: fav.article ? fav.article.category : (fav.history ? 'DRAWING_REPORT' : null),
                title: source.title || null,
                date: fav.createdAt.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                content: source.content || null,
                createdAt: fav.createdAt
            };
        });

        res.json(normalized);
    } catch (error) {
        res.status(500).json({ error: '無法取得收藏清單' });
    }
});

app.post('/api/user/favorites', authenticateToken, async (req, res) => {
    const { articleId, historyId, history } = req.body;
    if (!articleId && !historyId && !history) {
        return res.status(400).json({ error: '請提供 articleId、historyId 或 history 資料' });
    }
    if ((articleId ? 1 : 0) + (historyId ? 1 : 0) + (history ? 1 : 0) > 1) {
        return res.status(400).json({ error: '一次只能收藏一種資料類型' });
    }

    try {
        let favoriteData = { userId: req.user.userId }; //Js can dynamically add properties to this object based on which ID is provided
        if (articleId) {favoriteData.articleId = articleId;}
        if (historyId) {favoriteData.historyId = historyId;}
        if (history) {
            const newHistory = await prisma.history.create({
                data: {
                    userId: req.user.userId,
                    systemType: history.systemType || 'TAROT',
                    title: history.title,
                    content: history.content
                }
            });
            favoriteData.historyId = newHistory.id;
        }
        const newFavorite = await prisma.favorite.create({
            data: favoriteData,
            include: { article: true, history: true }
        });

        const source = newFavorite.article || newFavorite.history || {};
        const normalized = {
            id: newFavorite.id,
            userId: newFavorite.userId,
            articleId: newFavorite.articleId,
            historyId: newFavorite.historyId,
            type: source.systemType || null,
            category: newFavorite.article ? newFavorite.article.category : (newFavorite.history ? 'DRAWING_REPORT' : null),
            title: source.title || null,
            date: newFavorite.createdAt.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            content: source.content || null,
            createdAt: newFavorite.createdAt
        };

        res.status(201).json({ message: '收藏成功', favorite: normalized });
    } catch (error) {
        console.error('favorite failed', error);
        res.status(500).json({ error: '收藏失敗' });
    }
});

app.delete('/api/user/favorites/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const favorite = await prisma.favorite.findUnique({ where: { id: parseInt(id) } });
        // security check: only allow deletion if the favorite belongs to the current user
        if (!favorite || favorite.userId !== req.user.userId) {
            return res.status(403).json({ error: '沒有權限刪除此收藏' });
        }
        await prisma.favorite.delete({ where: { id: parseInt(id) } });
        res.json({ message: '收藏已移除' });
    } catch (error) {res.status(500).json({ error: '移除收藏失敗' });}});

app.get('/api/tarot/articles', async (req, res) => {
    const { tabType } = req.query;

    try {
        const articles = await prisma.article.findMany({
            where: {systemType: 'TAROT',tabType:tabType.toUpperCase()
},
            orderBy: {id: 'asc'}
        });

    res.json(articles);
} catch (error) {
    console.error('Failed to load tarot articles:', error);
    res.status(500).json({ error: '無法載入塔羅文章' });
}
});

app.get('/api/tarot/cards', async (req, res) => {
    const { suit } = req.query;
    const where = {};
    if (suit) where.suit = suit.toUpperCase();

    try {
        const suitOrder = { MAJOR: 0, WANDS: 1, CUPS: 2, SWORDS: 3, DISKS: 4 };
        const cards = await prisma.tarotCard.findMany({ where });
        cards.sort((a, b) =>
            (suitOrder[a.suit] ?? 99) - (suitOrder[b.suit] ?? 99) ||
            a.orderIndex - b.orderIndex
        );
        res.json(cards.map(localizeTarotCard));
    } catch (error) {
        console.error('Failed to load tarot cards:', error);
        res.status(500).json({ error: '塔羅牌清單載入失敗' });
    }
});

app.get('/api/tarot/cards/:slug', async (req, res) => {
    try {
        const card = await prisma.tarotCard.findUnique({
            where: { slug: req.params.slug }
        });

        if (!card) return res.status(404).json({ error: '找不到這張塔羅牌' });
        res.json(localizeTarotCard(card));
    } catch (error) {
        console.error('Failed to load tarot card:', error);
        res.status(500).json({ error: '塔羅牌載入失敗' });
    }
});

app.get('/api/astrology/articles', async (req, res) => {
    const { tabType } = req.query;
    try {
        const articles = await prisma.article.findMany({
            where: { systemType: 'ASTROLOGY', tabType: tabType.toUpperCase() },
            orderBy: { id: 'asc' }
        });
        res.json(articles);
    } catch (error) {
        console.error('Failed to load astrology articles:', error);
        res.status(500).json({ error: '無法載入星盤文章' });
    }
});

app.get('/api/ziwei/articles', async (req, res) => {
    const { tabType } = req.query;
    try {
        const articles = await prisma.article.findMany({
            where: { systemType: 'ZIWEI', tabType: tabType.toUpperCase() },
            orderBy: { id: 'asc' }
        });
        res.json(articles);
    } catch (error) {
        console.error('Failed to load ziwei articles:', error);
        res.status(500).json({ error: '無法載入紫微文章' });
    }
});

app.get('/api/bazi/articles', async (req, res) => {
    const { tabType } = req.query;
    try {
        const articles = await prisma.article.findMany({
            where: { systemType: 'BAZI', tabType: tabType.toUpperCase() },
            orderBy: { id: 'asc' }
        });
        res.json(articles);
    } catch (error) {
        console.error('Failed to load bazi articles:', error);
        res.status(500).json({ error: '無法載入八字文章' });
    }
});

app.get('/api/history/tarot', authenticateToken, async (req, res) => {
        try {
            const history = await prisma.history.findMany({
                where: {
                    userId: req.user.userId,
                    systemType: 'TAROT'},
                include: { favorites: true },
                orderBy: { createdAt: 'desc' }
            });
            const normalized = history.map(log => ({
                id: log.id,
                title: log.title,
                content: log.content,
                date: log.createdAt.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                isFavorite: log.favorites.length > 0,
                favoriteId: log.favorites[0]?.id || null
            }));
            res.json(normalized);
        } catch (error) {
            res.status(500).json({ error: '讀取歷史紀錄失敗' });
        }
});

app.get('/api/history/astrology', authenticateToken, async (req, res) => {
    try {
        const history = await prisma.history.findMany({
            where: {
                userId: req.user.userId,
                systemType: 'ASTROLOGY'
            },
            include: { favorites: true },
            orderBy: { createdAt: 'desc' }
        });
        const normalized = history.map(log => ({
            id: log.id,
            title: log.title,
            content: log.content,
            date: log.createdAt.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            isFavorite: log.favorites.length > 0,
            favoriteId: log.favorites[0]?.id || null
        }));
        res.json(normalized);
    } catch (error) {
        res.status(500).json({ error: '讀取歷史紀錄失敗' });
    }
});
app.get('/api/history/bazi', authenticateToken, async (req, res) => {
    try {
        const history = await prisma.history.findMany({
            where: {
                userId: req.user.userId,
                systemType: 'BAZI'
            },
            include: { favorites: true },
            orderBy: { createdAt: 'desc' }
        });
        const normalized = history.map(log => ({
            id: log.id,
            title: log.title,
            content: log.content,
            date: log.createdAt.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            isFavorite: log.favorites.length > 0,
            favoriteId: log.favorites[0]?.id || null
        }));
        res.json(normalized);
    } catch (error) {
        res.status(500).json({ error: '讀取歷史紀錄失敗' });
    }
});
app.get('/api/history/ziwei', authenticateToken, async (req, res) => {
    try {
        const history = await prisma.history.findMany({
            where: {
                userId: req.user.userId,
                systemType: 'ZIWEI'
            },
            include: { favorites: true },
            orderBy: { createdAt: 'desc' }
        });
        const normalized = history.map(log => ({
            id: log.id,
            title: log.title,
            content: log.content,
            date: log.createdAt.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            isFavorite: log.favorites.length > 0,
            favoriteId: log.favorites[0]?.id || null
        }));
        res.json(normalized);
    } catch (error) {
        res.status(500).json({ error: '讀取歷史紀錄失敗' });
    }
});
const HISTORY_SYSTEMS = {
    tarot: 'TAROT',
    astrology: 'ASTROLOGY',
    bazi: 'BAZI',
    ziwei: 'ZIWEI'
};

const TAROT_SUBTITLE_ZH = {
    'Air / Aleph': '風元素 / Aleph',
    'Mercury / Beth': '水星 / Beth',
    'Moon / Gimel': '月亮 / Gimel',
    'Venus / Daleth': '金星 / Daleth',
    'Aries / Tzaddi': '牡羊座 / Tzaddi',
    'Taurus / Vav': '金牛座 / Vav',
    'Gemini / Zain': '雙子座 / Zain',
    'Cancer / Cheth': '巨蟹座 / Cheth',
    'Libra / Lamed': '天秤座 / Lamed',
    'Virgo / Yod': '處女座 / Yod',
    'Jupiter / Kaph': '木星 / Kaph',
    'Leo / Teth': '獅子座 / Teth',
    'Water / Mem': '水元素 / Mem',
    'Scorpio / Nun': '天蠍座 / Nun',
    'Sagittarius / Samekh': '射手座 / Samekh',
    'Capricorn / Ayin': '摩羯座 / Ayin',
    'Mars / Peh': '火星 / Peh',
    'Aquarius / Tzaddi': '水瓶座 / Tzaddi',
    'Pisces / Qoph': '雙魚座 / Qoph',
    'Sun / Resh': '太陽 / Resh',
    'Fire and Spirit / Shin': '火與靈 / Shin',
    'Saturn / Tau': '土星 / Tau',
    'Root of Fire': '火元素根源',
    'Root of Water': '水元素根源',
    'Root of Air': '風元素根源',
    'Root of Earth': '土元素根源',
    'Court of Fire': '火元素宮廷牌',
    'Court of Water': '水元素宮廷牌',
    'Court of Air': '風元素宮廷牌',
    'Court of Earth': '土元素宮廷牌'
};

const TAROT_MEANING_ZH = {
    Art: '調和、融合、煉金整合，以及把衝突素材轉成藝術的能力。',
    'Princess of Disks': '潛力、孕育與新資源，像種子一樣等待合適季節發芽。',
    'Knight of Disks': '穩定、耐力與可靠執行，提醒你一步一步守住成果。',
    'Queen of Disks': '照顧身體、土地與生活品質，讓安全感成為可居住的現實。',
    'Prince of Disks': '規劃、生產與長期建設，把資源慢慢養成成果。'
};

function localizeTarotCard(card) {
    return {
        ...card,
        subtitle: TAROT_SUBTITLE_ZH[card.subtitle] || card.subtitle,
        meaning: TAROT_MEANING_ZH[card.title] || card.meaning
    };
}

const AI_SYSTEM_LABELS = {
    tarot: '塔羅牌',
    astrology: '西洋星盤',
    bazi: '八字命盤',
    ziwei: '紫微斗數'
};

const AI_PROMPT_MAX_CHARS = Number(process.env.AI_PROMPT_MAX_CHARS || 4200);
const AI_RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX || 12);
const AI_MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS || 1200);
const aiUsageBuckets = new Map();

function checkAiUsageLimit(userId, system) {
    const now = Date.now();
    const key = `${userId}:${system}`;
    const bucket = aiUsageBuckets.get(key) || [];
    const recentCalls = bucket.filter((timestamp) => now - timestamp < AI_RATE_LIMIT_WINDOW_MS);

    if (recentCalls.length >= AI_RATE_LIMIT_MAX) {
        return false;
    }

    recentCalls.push(now);
    aiUsageBuckets.set(key, recentCalls);
    return true;
}
async function generateGeminiReading(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const error = new Error('Gemini API key is not configured');
        error.statusCode = 500;
        throw error;
    }

    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            temperature: 0.72,
            topP: 0.92,
            maxOutputTokens: AI_MAX_OUTPUT_TOKENS
        }
    }, { timeout: 30000 });

    const report = response.data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('\n')
        .trim();

    if (!report) {
        const error = new Error('Gemini returned an empty response');
        error.statusCode = 502;
        throw error;
    }

    return report;
}

app.post('/api/ai/reading', authenticateToken, async (req, res) => {
    const system = String(req.body?.system || '').toLowerCase();
    const prompt = String(req.body?.prompt || '').trim();

    if (!AI_SYSTEM_LABELS[system]) {
        return res.status(400).json({ error: '不支援的 AI 解讀類型' });
    }

    if (!prompt) {
        return res.status(400).json({ error: '缺少 AI 解讀 prompt' });
    }

    if (prompt.length > AI_PROMPT_MAX_CHARS) {
        return res.status(413).json({ error: `AI 提示詞過長，上限為 ${AI_PROMPT_MAX_CHARS} 字元。` });
    }

    if (!checkAiUsageLimit(req.user.userId, system)) {
        return res.status(429).json({ error: 'AI 解讀次數已達本時段上限，請稍後再試。' });
    }

    try {
        const report = await generateGeminiReading(prompt);
        res.json({ system, label: AI_SYSTEM_LABELS[system], report });
    } catch (error) {
        console.error('Gemini reading failed:', error.response?.data || error.message);
        res.status(error.statusCode || 500).json({ error: 'AI 解讀暫時無法完成，請稍後再試。' });
    }
});

app.post('/api/history/:system', authenticateToken, async (req, res) => {
    const systemType = HISTORY_SYSTEMS[String(req.params.system || '').toLowerCase()];
    const { title, content } = req.body || {};

    if (!systemType) {
        return res.status(400).json({ error: 'Unsupported history system' });
    }

    if (!title || !content) {
        return res.status(400).json({ error: 'title and content are required' });
    }

    try {
        const history = await prisma.history.create({
            data: {
                userId: req.user.userId,
                systemType,
                title,
                content
            }
        });

        res.status(201).json({
            history: {
                id: history.id,
                title: history.title,
                content: history.content,
                date: history.createdAt.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }),
                isFavorite: false,
                favoriteId: null
            }
        });
    } catch (error) {
        console.error('Create history failed:', error);
        res.status(500).json({ error: 'Failed to create history' });
    }
});

app.put('/api/history/:system/:id', authenticateToken, async (req, res) => {
    const systemType = HISTORY_SYSTEMS[String(req.params.system || '').toLowerCase()];
    const historyId = Number(req.params.id);
    const { title } = req.body || {};

    if (!systemType || !Number.isInteger(historyId)) {
        return res.status(400).json({ error: 'Invalid history request' });
    }

    if (!String(title || '').trim()) {
        return res.status(400).json({ error: 'title is required' });
    }

    try {
        const current = await prisma.history.findFirst({
            where: { id: historyId, userId: req.user.userId, systemType }
        });

        if (!current) {
            return res.status(404).json({ error: 'History not found' });
        }

        const history = await prisma.history.update({
            where: { id: historyId },
            data: { title: String(title).trim() },
            include: { favorites: true }
        });

        res.json({
            history: {
                id: history.id,
                title: history.title,
                content: history.content,
                date: history.createdAt.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }),
                isFavorite: history.favorites.length > 0,
                favoriteId: history.favorites[0]?.id || null
            }
        });
    } catch (error) {
        console.error('Update history failed:', error);
        res.status(500).json({ error: 'Failed to update history' });
    }
});

app.delete('/api/history/:system/:id', authenticateToken, async (req, res) => {
    const systemType = HISTORY_SYSTEMS[String(req.params.system || '').toLowerCase()];
    const historyId = Number(req.params.id);

    if (!systemType || !Number.isInteger(historyId)) {
        return res.status(400).json({ error: 'Invalid history request' });
    }

    try {
        const current = await prisma.history.findFirst({
            where: { id: historyId, userId: req.user.userId, systemType }
        });

        if (!current) {
            return res.status(404).json({ error: 'History not found' });
        }

        await prisma.favorite.deleteMany({
            where: { historyId, userId: req.user.userId }
        });
        await prisma.history.delete({ where: { id: historyId } });

        res.json({ ok: true });
    } catch (error) {
        console.error('Delete history failed:', error);
        res.status(500).json({ error: 'Failed to delete history' });
    }
});

app.listen(PORT, () => {
    console.log(`Mystic Master API listening on port ${PORT}`);
});



