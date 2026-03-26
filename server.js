const express = require('express');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// [FINAL SEO FIX] 네이버 로봇을 위한 강력한 robots.txt 서빙
app.all('/robots.txt', (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).end();
    }
    const content = 'User-agent: *\nAllow: /\n\nSitemap: https://gensystem.co.kr/sitemap.xml\nSitemap: https://www.gensystem.co.kr/sitemap.xml\n# Updated: 2026-03-26 21:40 KST (Fixed)';
    res.set({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
    });
    res.status(200).send(content);
});

// sitemap.xml 서빙
app.get('/sitemap.xml', (req, res) => {
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 네이버 커머스 API 설정
const NAVER_CLIENT_ID = (process.env.NAVER_CLIENT_ID || '').trim();
const NAVER_CLIENT_SECRET = (process.env.NAVER_CLIENT_SECRET || '').trim();

let cachedProducts = null;
let lastFetchTime = 0;

async function getNaverAccessToken() {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) throw new Error('API Credentials missing');
    const timestamp = Date.now();
    const signature = crypto.createHmac('sha256', NAVER_CLIENT_SECRET).update(`${NAVER_CLIENT_ID}_${timestamp}`).digest('base64');
    const response = await axios.post('https://api.commerce.naver.com/external/v1/oauth2/token', {
        client_id: NAVER_CLIENT_ID, timestamp, client_secret_sign: signature, grant_type: 'client_credentials', type: 'SELF'
    });
    return response.data.access_token;
}

app.get('/api/best-products', async (req, res) => {
    try {
        const now = Date.now();
        if (cachedProducts && (now - lastFetchTime < 3600000)) return res.json(cachedProducts);
        const token = await getNaverAccessToken();
        const productResponse = await axios.post('https://api.commerce.naver.com/external/v1/products/search', {
            page: 1, size: 30, searchType: 'ALL'
        }, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        let allProducts = (productResponse.data && productResponse.data.contents) ? productResponse.data.contents : [];
        if (allProducts.length > 0) {
            for (let i = allProducts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
            }
            cachedProducts = { contents: allProducts.slice(0, 3) };
        } else { cachedProducts = { contents: [] }; }
        lastFetchTime = now;
        res.json(cachedProducts);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(error.response ? error.response.status : 500).json({ error: 'Failed to fetch products' });
    }
});

// 네이버 소유 확인 파일 서빙 (루트 도메인 및 www 도메인용 모두 대응)
app.get('/naver*.html', (req, res) => {
    res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.sendFile(path.join(__dirname, 'public', req.path));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
