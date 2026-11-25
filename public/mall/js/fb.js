// Firebase 연결 (설정이 끝났을 때만 CDN 에서 불러옴 → 설정 전에는 인터넷 없이도 견본으로 동작)
import { firebaseConfig, IS_CONFIGURED, FIREBASE_SDK } from "./config.js";

const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK}`;
let cache = null;

export async function fb() {
  if (!IS_CONFIGURED) throw new Error("설정 전");
  if (cache) return cache;
  const [appMod, fs, auth] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-firestore.js`),
    import(`${base}/firebase-auth.js`)
  ]);
  const app = appMod.initializeApp(firebaseConfig);
  cache = { app, fs, auth, db: fs.getFirestore(app), authInst: auth.getAuth(app) };
  return cache;
}
