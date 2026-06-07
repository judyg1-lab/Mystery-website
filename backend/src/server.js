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

app.use(cors()); // 允許跨網域連線（讓妳 localhost:3000 的 React 能存取 5000 的後端）
app.use(express.json()); // 解析 JSON 格式的請求體，讓我們可以在 req.body 看到前端傳來的資料
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // 讓 /uploads 路徑對應到 uploads 資料夾，提供靜態檔案服務（讓上傳的大頭貼可以被瀏覽器讀取）
app.use('/tarot', express.static(path.join(__dirname, '../public/tarot')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');

        if (!fs.existsSync(uploadDir)) {fs.mkdirSync(uploadDir, { recursive: true });}
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 重新命名檔案，加上時間戳記防止使用者上傳相同檔名導致覆蓋
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 【中間件】驗證前端傳來的 JWT 通行證
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 取得 Bearer TOKEN

    if (!token) return res.status(401).json({ error: '未提供授權憑證' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: '憑證過期或無效' });
    req.user = user; //將解密後的使用者資訊附加到 req 物件上，讓後續的 API 處理函式可以使用 req.user 來識別當前使用者
    next();
    });
};

app.post('/api/auth/register', async (req, res) => {
    const { username, email, phone, password } = req.body;
    try {
        const existingUser = await prisma.user.findFirst({where: { OR: [{ email }, { username }, { phone }] }});
        if (existingUser) return res.status(400).json({ error: '該用戶名、電子郵件或手機號碼已被佔用' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({data: { username, email, phone, password: hashedPassword }});
        res.status(201).json({ message: '星辰檔案館主人，歡迎妳的加入！', userId: newUser.id });
    } catch (error) {
        res.status(500).json({ error: '註冊失敗' });
    }
    });

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        // return 404 if user not found, to prevent attackers from knowing which usernames are valid
        if (!user) {return res.status(404).json({ error: 'Authentication failed: User not found.' });}

        //return 401 if password is incorrect, to prevent attackers from knowing which usernames are valid
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {return res.status(401).json({ error: 'Authentication failed: Incorrect password.' });}

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: '認證成功，歡迎回到神祕檔案館', token, user });
    } catch (error) {res.status(500).json({ error: '登入失敗' });}
    });

app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, username: true, email: true, phone: true, bio: true, avatarUrl: true, masterCard: true }
    });
    res.json(user);
    } catch (error) {res.status(500).json({ error: '檔案讀取失敗' });}});

app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Please choose an image file to upload' });

  // 生成可供瀏覽器直接讀取的靜態 URL 網址
    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    try {
        await prisma.user.update({
            where: { id: req.user.userId },
            data: { avatarUrl }});
        res.json({ message: '大頭貼檔案上傳成功', avatarUrl });
    } catch (error) {res.status(500).json({ error: '大頭貼路徑寫入資料庫失敗' });}});

app.put('/api/user/profile/update', authenticateToken, async (req, res) => {
    const { username, bio} = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { username, bio }});
        res.json({ message: '個人檔案更新完成', user: updatedUser });
    } catch (error) {res.status(500).json({ error: '設定更新失敗' });}});

app.put('/api/user/master-card', authenticateToken, async (req, res) => {
    const { masterCard } = req.body;
    if (!masterCard || typeof masterCard !== 'string') {
        return res.status(400).json({ error: '請提供主牌名稱' });
    }

    try {
        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: { masterCard },
            select: { id: true, masterCard: true }
        });
        res.json({ message: '靈魂主牌已同步', masterCard: user.masterCard });
    } catch (error) {
        res.status(500).json({ error: '主牌同步失敗' });
    }
});

app.delete('/api/user/master-card', authenticateToken, async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user.userId },
            data: { masterCard: null }
        });
        res.json({ message: '靈魂主牌已清除' });
    } catch (error) {
        res.status(500).json({ error: '主牌清除失敗' });
    }
});

// put means update
app.put('/api/user/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ error: '原始密碼輸入錯誤' });
        }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword }
    });
    res.json({ message: '加密機制更新成功' });
    } catch (error) {
    res.status(500).json({ error: '密碼變更失敗' });}});

app.delete('/api/user/delete', authenticateToken, async (req, res) => { //HTTP method
    try {
        await prisma.user.delete({ where: { id: req.user.userId } });
        res.json({ message: '遺忘協議已啟動，帳號抹除完畢' });
    } catch (error) {
    res.status(500).json({ error: '銷毀程序執行失敗' });}});

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
        return res.status(400).json({ error: '一次只能收藏一種資料' });
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

        res.status(201).json({ message: '已寫入收藏', favorite: normalized });
    } catch (error) {
        console.error('收藏失敗', error);
        res.status(500).json({ error: '收藏失敗' });
    }
});

app.delete('/api/user/favorites/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const favorite = await prisma.favorite.findUnique({ where: { id: parseInt(id) } }); //parseInt 因為 URL 參數預設是字串，但資料庫中的 ID 是整數，所以要轉換一下
        // security check: only allow deletion if the favorite belongs to the current user
        if (!favorite || favorite.userId !== req.user.userId) {
            return res.status(403).json({ error: '無權刪除此收藏' });
        }
        await prisma.favorite.delete({ where: { id: parseInt(id) } });
        res.json({ message: '已自收藏清單中抹除' });
    } catch (error) {res.status(500).json({ error: '取消收藏失敗' });}});

app.get('/api/tarot/articles', async (req, res) => {
    const { tabType } = req.query; // 接收前端傳過來的 ?tabType=origins 或 ?tabType=reports

    try {
        const articles = await prisma.article.findMany({
            where: {systemType: 'TAROT',tabType:tabType.toUpperCase()
},
            orderBy: {id: 'asc'}
        });

    res.json(articles); // 透過 JSON 格式回傳給 React 前端
    } catch (error) {
    console.error(" 撈取資料庫秘典失敗:", error);
    res.status(500).json({ error: '無法調閱星辰機房文獻' });
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
        res.json(cards);
    } catch (error) {
        console.error('Failed to load tarot cards:', error);
        res.status(500).json({ error: 'Failed to load tarot cards' });
    }
});

app.get('/api/tarot/cards/:slug', async (req, res) => {
    try {
        const card = await prisma.tarotCard.findUnique({
            where: { slug: req.params.slug }
        });

        if (!card) return res.status(404).json({ error: 'Tarot card not found' });
        res.json(card);
    } catch (error) {
        console.error('Failed to load tarot card:', error);
        res.status(500).json({ error: 'Failed to load tarot card' });
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
        console.error(" 撈取星盤文獻失敗:", error);
        res.status(500).json({ error: '無法調閱星盤文獻' });
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
        console.error(" 撈取紫微文獻失敗:", error);
        res.status(500).json({ error: '無法調閱紫微文獻' });
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
        console.error(" 撈取八字文獻失敗:", error);
        res.status(500).json({ error: '無法調閱八字文獻' });
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
            res.status(500).json({ error: '歷史紀錄調閱失敗' });
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
        res.status(500).json({ error: '歷史紀錄調閱失敗' });
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
        res.status(500).json({ error: '讀取八字歷史紀錄失敗' });
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
        res.status(500).json({ error: '讀取紫微歷史紀錄失敗' });
    }
});
const HISTORY_SYSTEMS = {
    tarot: 'TAROT',
    astrology: 'ASTROLOGY',
    bazi: 'BAZI',
    ziwei: 'ZIWEI'
};

const AI_SYSTEM_LABELS = {
    tarot: '托特塔羅',
    astrology: '西洋星盤',
    bazi: '八字四柱',
    ziwei: '紫微斗數'
};

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
            maxOutputTokens: 2200
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
        return res.status(400).json({ error: '不支援的 AI 判讀類型' });
    }

    if (!prompt) {
        return res.status(400).json({ error: '缺少 AI 判讀 prompt' });
    }

    try {
        const report = await generateGeminiReading(prompt);
        res.json({ system, label: AI_SYSTEM_LABELS[system], report });
    } catch (error) {
        console.error('Gemini reading failed:', error.response?.data || error.message);
        res.status(error.statusCode || 500).json({ error: 'AI 判讀暫時無法完成，請稍後再試。' });
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

app.listen(PORT, () => { //啟動 Express 伺服器，監聽指定的 PORT 埠號。監聽完，執行後續函式
    console.log(`Mystic Master API 正在埠號 ${PORT} `);});
