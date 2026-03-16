const express = require('express');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// 네이버 로봇 및 검색엔진 최적화를 위해 robots.txt와 sitemap.xml 최우선 서빙
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nAllow: /\n\nSitemap: https://www.gensystem.co.kr/sitemap.xml');
});

app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// 정적 파일 서빙 (public 폴더 내의 파일들 자동 서빙)
app.use(express.static(path.join(__dirname, 'public')));

// 네이버 커머스 API 설정
const NAVER_CLIENT_ID = (process.env.NAVER_CLIENT_ID || '').trim();
const NAVER_CLIENT_SECRET = (process.env.NAVER_CLIENT_SECRET || '').trim();

// 1시간마다 갱신될 데이터 캐시
let cachedProducts = null;
let lastFetchTime = 0;

async function getNaverAccessToken() {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        throw new Error('API Credentials missing');
    }
    
    const timestamp = Date.now();
    const signature = crypto.createHmac('sha256', NAVER_CLIENT_SECRET)
        .update(`${NAVER_CLIENT_ID}_${timestamp}`)
        .digest('base64');

    const response = await axios.post('https://api.commerce.naver.com/external/v1/oauth2/token', {
        client_id: NAVER_CLIENT_ID,
        timestamp: timestamp,
        client_secret_sign: signature,
        grant_type: 'client_credentials',
        type: 'SELF'
    });
    
    return response.data.access_token;
}

// 주간 베스트 상품 API
app.get('/api/best-products', async (req, res) => {
    try {
        const now = Date.now();
        if (cachedProducts && (now - lastFetchTime < 3600000)) {
            return res.json(cachedProducts);
        }

        const token = await getNaverAccessToken();
        const productResponse = await axios.post('https://api.commerce.naver.com/external/v1/products/search', {
            page: 1,
            size: 30,
            searchType: 'ALL'
        }, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        let allProducts = (productResponse.data && productResponse.data.contents) ? productResponse.data.contents : [];
        
        if (allProducts.length > 0) {
            for (let i = allProducts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
            }
            cachedProducts = { contents: allProducts.slice(0, 3) };
        } else {
            cachedProducts = { contents: [] };
        }

        lastFetchTime = now;
        res.json(cachedProducts);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(error.response ? error.response.status : 500).json({ 
            error: 'Failed to fetch products'
        });
    }
});

// 나머지 모든 경로는 index.html로 (SPA 방식)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
