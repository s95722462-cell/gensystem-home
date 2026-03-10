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
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// 1시간마다 갱신될 데이터 캐시
let cachedProducts = null;
let lastFetchTime = 0;

async function getNaverAccessToken() {
    const timestamp = Date.now();
    // HMAC-SHA256 서명 생성 (clientId + "_" + timestamp 를 clientSecret으로 서명)
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

// 주간 베스트 상품을 가져오는 API (캐싱 적용)
app.get('/api/best-products', async (req, res) => {
    try {
        const now = Date.now();
        // 1시간(3600000ms) 이내라면 캐시된 데이터 반환
        if (cachedProducts && (now - lastFetchTime < 3600000)) {
            return res.json(cachedProducts);
        }

        const token = await getNaverAccessToken();
        
        // 네이버 커머스 API 상품 검색은 일반적으로 POST 방식을 사용합니다.
        const productResponse = await axios.post('https://api.commerce.naver.com/external/v1/products/search', {
            page: 1,
            size: 10,
            orderType: 'REGISTRATION_DATE_DESC' // 최신 등록순
        }, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        cachedProducts = productResponse.data;
        lastFetchTime = now;
        
        console.log('Successfully fetched products from Naver:', JSON.stringify(cachedProducts).substring(0, 100) + '...');
        res.json(cachedProducts);
    } catch (error) {
        console.error('Error fetching Naver products:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data));
        } else {
            console.error('Message:', error.message);
        }
        res.status(500).json({ error: 'Failed to fetch products', details: error.message });
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
