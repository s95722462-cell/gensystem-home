// GEN 부품몰 설정 파일
// Firebase 프로젝트 = gensystemhomepage (회사 홈페이지와 같은 프로젝트, 2026-11-25 설정).
// apiKey 가 "PASTE_" 로 시작하면 "설정 전" 상태로 보고, 견본 데이터(data/products.sample.json)로만 동작합니다.

export const firebaseConfig = {
  apiKey: "AIzaSyBYVd_Q4tjVnTzdCN8si9wpEReSh9Tzl7k",
  authDomain: "gensystemhomepage.firebaseapp.com",
  projectId: "gensystemhomepage",
  storageBucket: "gensystemhomepage.firebasestorage.app",
  messagingSenderId: "382869173979",
  appId: "1:382869173979:web:986d8126fa0a53cbf73efe"
};

// 설정이 끝났는지 자동 판단 (직접 true/false 로 바꿔도 됨)
// 이 PC 에서 미리 볼 때(127.0.0.1·localhost·집 와이파이 192.168.x)와 자동 시험에서는 "설정 전"(견본 데이터)으로 동작합니다.
// → 연습하다가 실제 견적·상품을 건드리지 않게. 이 PC 에서 실제 자료로 보려면 주소 끝에 ?live=1
const LOCAL_PREVIEW = typeof location === "undefined"
  || (/^(127\.0\.0\.1|localhost|192\.168\.)/.test(location.hostname) && !/[?&]live=1/.test(location.search));
export const IS_CONFIGURED = !String(firebaseConfig.apiKey).startsWith("PASTE_") && !LOCAL_PREVIEW;

// 관리자 구글 계정 (firestore.rules 의 isAdmin() 과 같은 값이어야 함)
export const ADMIN_EMAILS = ["s95722462@gmail.com"];

// 견적 요청 휴대폰 알림 (ntfy 앱에서 이 이름을 구독)
export const NTFY_TOPIC = "genshop-quote-k7r2xw9mqa";

// 카카오톡 채널 1:1 채팅 주소. 예: "https://pf.kakao.com/_abcdE/chat"  (채널 관리자센터 → 채널 홍보 → 채팅 URL)
// 비워 두면 [카톡으로 문의] 버튼이 가게에 나오지 않습니다 (설정 전 견본 상태에서는 모양만 보임).
export const KAKAO_CHAT_URL = "https://pf.kakao.com/_HxlxoNn";   // 겐시스템 채널 홈 (2026-11-25: /chat 은 "채팅이 불가능한 프로필" 이라 채널 홈으로. 관리자센터에서 1:1 채팅을 켜면 끝에 /chat 을 붙이면 바로 채팅창)

// Firebase JS SDK 버전 고정 (gstatic CDN)
export const FIREBASE_SDK = "10.14.1";

// 회사 정보(대표자·사업자번호·통신판매업 신고번호·주소)는 index.html 아래쪽 <footer> 와
// tools/build_seo.py 의 FOOTER 에 적혀 있습니다. "(입력 필요)" 를 찾아 바꾸세요.
