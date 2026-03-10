const express = require('express');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// 정적 파일 서빙
app.use(express.static(__dirname));

// 네이버 커머스 API 설정
const NAVER_CLIENT_ID = (process.env.NAVER_CLIENT_ID || '').trim();
const NAVER_CLIENT_SECRET = (process.env.NAVER_CLIENT_SECRET || '').trim();

// 1시간마다 갱신될 데이터 캐시
let cachedProducts = null;
let lastFetchTime = 0;

async function getNaverAccessToken() {
    const timestamp = Date.now();
    // HMAC-SHA256 서명 생성 (clientId + "_" + timestamp 를 clientSecret으로 서명)
    const signature = crypto.createHmac('sha256', NAVER_CLIENT_SECRET)
        .update(`${NAVER_CLIENT_ID}_${timestamp}`)
        .digest('base64');

    // 토큰 요청 본문을 명확하게 구성
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
        
        // 네이버 커머스 API 상품 검색 
        // 400 에러 방지를 위해 규격에 맞는 필드 구성 (전체 상품 검색용)
        const productResponse = await axios.post('https://api.commerce.naver.com/external/v1/products/search', {
            page: 1,
            size: 30,
            searchType: 'ALL' // 전체 검색 타입 명시
        }, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        let allProducts = (productResponse.data && productResponse.data.contents) ? productResponse.data.contents : [];
        
        if (allProducts.length > 0) {
            // 랜덤하게 섞기
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
        let errorDetail = error.message;
        if (error.response) {
            // 상세 에러가 있는 경우 이를 텍스트로 변환하여 전달
            errorDetail = JSON.stringify(error.response.data);
            console.error('Naver API Detailed Error:', errorDetail);
        }
        
        res.status(error.response ? error.response.status : 500).json({ 
            error: 'Failed to fetch products', 
            details: errorDetail 
        });
    }
});

app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log('Server is running on port ' + port);
});
