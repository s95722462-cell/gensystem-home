// 가게 화면과 관리자 화면이 같이 쓰는 작은 도구들
import { IS_CONFIGURED } from "./config.js";

export const won = n => (Number(n) || 0).toLocaleString("ko-KR") + "원";
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// 형명 → 상품 id (예: "MR-J3-10B" → "mr-j3-10b")
export function slug(model) {
  const s = String(model || "").trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (s) return s.slice(0, 80);
  // 영문·숫자가 하나도 없는 형명: 글자 코드로 대신
  let h = 0; for (const ch of String(model)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return "x-" + h.toString(36);
}

// 가격은 1개 가격 하나만 (수량 할인 없음, 2026-11-24 결정). 옛 자료의 tiers 는 무시
export function tiersOf(p) { return [{ minQty: 1, price: p.price }]; }
export function unitPrice(p, q) { return p.price; }

export const lampOf = p => {
  const s = Number(p.stock) || 0;
  if (s <= 0) return ["out", "품절 · " + (p.leadTime || "입고 문의")];
  return [s <= 1 ? "low" : "ok", "재고 " + s + "개"];
};
export const condChip = p => p.condition === "new"
  ? '<span class="chip new">신품</span>'
  : '<span class="chip used">중고 · 동작 확인</span>';

// 사진이 없을 때 쓰는 단순 그림 (제조사 로고 아님)
export const ICON = {
  plc: '<svg viewBox="0 0 60 60" fill="none" aria-hidden="true"><rect x="14" y="6" width="32" height="48" rx="3" fill="var(--panel)" stroke="var(--muted)" stroke-width="2"/><rect x="19" y="11" width="22" height="9" rx="1.5" fill="var(--line)"/><circle cx="22" cy="27" r="2.2" fill="var(--run)"/><circle cx="29" cy="27" r="2.2" fill="var(--line)"/><circle cx="36" cy="27" r="2.2" fill="var(--line)"/><rect x="19" y="34" width="22" height="15" rx="1.5" fill="var(--line)"/></svg>',
  amp: '<svg viewBox="0 0 60 60" fill="none" aria-hidden="true"><rect x="16" y="5" width="28" height="50" rx="3" fill="var(--panel)" stroke="var(--muted)" stroke-width="2"/><rect x="21" y="10" width="18" height="8" rx="1" fill="var(--ink)"/><text x="30" y="16.5" font-size="6" text-anchor="middle" fill="var(--run)" font-family="monospace">d01</text><rect x="21" y="24" width="18" height="26" rx="1.5" fill="var(--line)"/></svg>',
  motor: '<svg viewBox="0 0 60 60" fill="none" aria-hidden="true"><rect x="10" y="18" width="30" height="24" rx="3" fill="var(--panel)" stroke="var(--muted)" stroke-width="2"/><rect x="40" y="25" width="12" height="10" fill="var(--line)"/><rect x="6" y="22" width="4" height="16" fill="var(--muted)"/><circle cx="25" cy="30" r="5" fill="var(--line)"/></svg>',
  hmi: '<svg viewBox="0 0 60 60" fill="none" aria-hidden="true"><rect x="6" y="12" width="48" height="36" rx="3" fill="var(--panel)" stroke="var(--muted)" stroke-width="2"/><rect x="11" y="17" width="38" height="26" rx="1" fill="var(--accent-soft)"/><rect x="15" y="21" width="12" height="7" rx="1" fill="var(--accent)"/><rect x="31" y="21" width="14" height="3" fill="var(--muted)"/><rect x="31" y="27" width="10" height="3" fill="var(--muted)"/></svg>'
};
export function iconOf(p) {
  const s = (p.category + " " + p.name + " " + p.model).toLowerCase();
  if (/모터|motor/.test(s)) return ICON.motor;
  if (/앰프|amp|서보|servo|인버터/.test(s)) return ICON.amp;
  if (/got|터치|hmi|패널/.test(s)) return ICON.hmi;
  return ICON.plc;
}
export const thumbHtml = p => (Array.isArray(p.photos) && p.photos[0])
  ? `<img src="${esc(p.photos[0])}" alt="${esc(p.model)} 실물 사진" loading="lazy">`
  : iconOf(p);

// 상품 불러오기: 설정 전 → 견본 JSON, 설정 후 → Firestore (visible==true 만)
export async function loadProducts() {
  if (!IS_CONFIGURED) {
    const r = await fetch("data/products.sample.json", { cache: "no-cache" });
    const j = await r.json();
    return { sample: true, products: j.products || [] };
  }
  const { fb } = await import("./fb.js");
  const { fs, db } = await fb();
  const snap = await fs.getDocs(fs.query(fs.collection(db, "products"), fs.where("visible", "==", true)));
  const products = snap.docs.map(d => ({ id: d.id, ...fromDb(d.data()) }));
  products.sort((a, b) => String(a.category).localeCompare(String(b.category), "ko") || String(a.model).localeCompare(String(b.model)));
  return { sample: false, products };
}

// 사양(specs): 화면·JSON 에서는 [[항목, 내용]] 이지만 Firestore 는 배열 안 배열을 못 넣음 → [{k, v}] 로 저장
export function toDb(p) { return { ...p, specs: (p.specs || []).map(s => Array.isArray(s) ? { k: String(s[0]), v: String(s[1] ?? "") } : s) }; }
export function fromDb(p) { return { ...p, specs: (p.specs || []).map(s => Array.isArray(s) ? s : [s.k, s.v]) }; }

export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 개인 창 등 */ } }
};

// 한글 자판 상태로 친 글자를 같은 자리의 영문 글쇠로 되돌림 (두벌식).  "ㅡㄱ-ㅓ4" → "mr-j4",  "ㅂ64ㅁㅇ" → "q64ad"
// 브라우저에서 입력기를 영문으로 강제로 바꿀 방법이 없어서, 형명 검색은 이렇게 바꾼 글자로도 같이 찾는다.
const HE_CHO = ["r", "R", "s", "e", "E", "f", "a", "q", "Q", "t", "T", "d", "w", "W", "c", "z", "x", "v", "g"];
const HE_JUNG = ["k", "o", "i", "O", "j", "p", "u", "P", "h", "hk", "ho", "hl", "y", "n", "nj", "np", "nl", "b", "m", "ml", "l"];
const HE_JONG = ["", "r", "R", "rt", "s", "sw", "sg", "e", "f", "fr", "fa", "fq", "ft", "fx", "fv", "fg", "a", "q", "qt", "t", "T", "d", "w", "c", "z", "x", "v", "g"];
const HE_JAMO = ["r", "R", "rt", "s", "sw", "sg", "e", "E", "f", "fr", "fa", "fq", "ft", "fx", "fv", "fg", "a", "q", "Q", "qt", "t", "T", "d", "w", "W", "c", "z", "x", "v", "g", ...HE_JUNG];
export function hanToEng(s) {
  let out = "";
  for (const ch of String(s || "")) {
    const c = ch.charCodeAt(0);
    if (c >= 0xAC00 && c <= 0xD7A3) { const n = c - 0xAC00; out += HE_CHO[Math.floor(n / 588)] + HE_JUNG[Math.floor(n % 588 / 28)] + HE_JONG[n % 28]; }
    else if (c >= 0x3131 && c <= 0x3163) out += HE_JAMO[c - 0x3131];
    else out += ch;
  }
  return out;
}
export const hasHangul = s => /[\u3131-\u3163\uAC00-\uD7A3]/.test(String(s || ""));
