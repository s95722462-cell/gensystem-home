const express = require('express');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// 네이버 소유 확인 경로 (최우선 순위 배치)
app.get('/naverb7b93cd74ba876a296f76753c56c8ae2.html', (req, res) => {
    res.send('naver-site-verification: 1314ba48998cec228c8f88edf30ca93aa6f57a3a');
});

app.get('/naver533b26b88c3de2abc8529e97b34e574a.html', (req, res) => {
    res.send('naver-site-verification: 6e9e2420bac3854f6df06ebba63e773f16d66cdf');
});

// 정적 파일 서빙 - 보안을 위해 public 폴더만 노출
app.use(express.static(path.join(__dirname, 'public')));

// 네이버 커머스 API 설정
const NAVER_CLIENT_ID = (process.env.NAVER_CLIENT_ID || '').trim();
const NAVER_CLIENT_SECRET = (process.env.NAVER_CLIENT_SECRET || '').trim();

// 1시간마다 갱신될 데이터 캐시
let cachedProducts = null;
let lastFetchTime = 0;

async function getNaverAccessToken() {
    const timestamp = Date.now();
    console.log(`Attempting token request with Client ID starting with: ${NAVER_CLIENT_ID.substring(0, 5)}...`);
    
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
    
    if (!response.data || !response.data.access_token) {
        throw new Error('Failed to get access token from Naver');
    }
    
    return response.data.access_token;
}

// 주간 베스트 상품을 가져오는 API (캐싱 적용)
app.get('/api/best-products', async (req, res) => {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.error('Missing NAVER API credentials');
            return res.status(500).json({ error: 'Server configuration error' });
        }

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
        console.error('--- Naver API Error Start ---');
        let errorDetail = 'Unknown server error';
        if (error.response) {
            errorDetail = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : String(error.response.data);
        } else {
            errorDetail = error.message;
        }
        console.error('--- Naver API Error End ---');
        res.status(error.response ? error.response.status : 500).json({ 
            error: 'Failed to fetch products', 
            details: errorDetail 
        });
    }
});

// 명시적으로 robots.txt와 sitemap.xml 응답 (경로 문제 해결을 위해 직접 지정)
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /

Sitemap: https://www.gensystem.co.kr/sitemap.xml`);
});

app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'), (err) => {
        if (err) {
            console.error('Sitemap file not found:', err);
            res.status(404).send('Sitemap not found');
        }
    });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log('Server is running on port ' + port);
});
