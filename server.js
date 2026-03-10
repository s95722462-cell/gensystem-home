const express = require('express');
const path = require('path');
const axios = require('axios');
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
    const response = await axios.post('https://api.commerce.naver.com/external/v1/oauth2/token', {
        client_id: NAVER_CLIENT_ID,
        client_secret: NAVER_CLIENT_SECRET,
        grant_type: 'client_credentials'
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
        
        // 실제 상품 조회 API 호출 (네이버 커머스 API 문서에 따라 상세 엔드포인트는 조정될 수 있습니다.)
        // 여기서는 예시로 전체 상품 목록 중 상위 10개를 가져오는 로직을 작성합니다.
        const productResponse = await axios.get('https://api.commerce.naver.com/external/v1/products/search', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: {
                page: 1,
                size: 10,
                sortType: 'REVIEW_COUNT' // 리뷰 많은 순(베스트 대용)
            }
        });

        cachedProducts = productResponse.data;
        lastFetchTime = now;
        
        res.json(cachedProducts);
    } catch (error) {
        console.error('Error fetching Naver products:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch products' });
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
