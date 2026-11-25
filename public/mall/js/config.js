// GEN 부품몰 설정 파일
// 사장님이 Firebase 콘솔에서 "웹 앱 추가" 후 받은 값을 아래 firebaseConfig 에 붙여 넣습니다.
// apiKey 가 "PASTE_" 로 시작하면 "설정 전" 상태로 보고, 견본 데이터(data/products.sample.json)로만 동작합니다.

export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "gen-shop-TBD.firebaseapp.com",
  projectId: "gen-shop-TBD",
  storageBucket: "gen-shop-TBD.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

// 설정이 끝났는지 자동 판단 (직접 true/false 로 바꿔도 됨)
export const IS_CONFIGURED = !String(firebaseConfig.apiKey).startsWith("PASTE_");

// 관리자 구글 계정 (firestore.rules 의 isAdmin() 과 같은 값이어야 함)
export const ADMIN_EMAILS = ["s95722462@gmail.com"];

// 견적 요청 휴대폰 알림 (ntfy 앱에서 이 이름을 구독)
export const NTFY_TOPIC = "genshop-quote-k7r2xw9mqa";

// 카카오톡 채널 1:1 채팅 주소. 예: "https://pf.kakao.com/_abcdE/chat"  (채널 관리자센터 → 채널 홍보 → 채팅 URL)
// 비워 두면 [카톡으로 문의] 버튼이 가게에 나오지 않습니다 (설정 전 견본 상태에서는 모양만 보임).
export const KAKAO_CHAT_URL = "https://pf.kakao.com/_HxlxoNn/chat";   // 겐시스템 채널 (2026-11-24 사용자 제공: pf.kakao.com/_HxlxoNn)

// Firebase JS SDK 버전 고정 (gstatic CDN)
export const FIREBASE_SDK = "10.14.1";

// 회사 정보(대표자·사업자번호·통신판매업 신고번호·주소)는 index.html 아래쪽 <footer> 와
// tools/build_seo.py 의 FOOTER 에 적혀 있습니다. "(입력 필요)" 를 찾아 바꾸세요.
