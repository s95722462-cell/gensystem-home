// GEN 부품몰 — 사진 이름 규칙 (형명_순번.jpg) 과 짝 맞추기. 화면 없이도 돌아가는 계산만 둔다 (tests/excel.test.mjs 에서 시험)
// 규칙 (2026-11-24 결정): 파일 이름 = 형명_순번.jpg, 순번 없으면 1번(대표), 상품당 3장.
//   대소문자·띄어쓰기·하이픈 같은 기호는 달라도 같은 형명. 중고도 형명마다 대표 사진만(물건별 사진 없음).
//   저장 크기는 긴 변 800px·약 100KB — 일부러 작게 (명판·시리얼 번호가 읽히지 않게).
export const MAX_PHOTOS = 3;
export const PHOTO_MAX_EDGE = 800;      // 저장할 때 긴 변
export const PHOTO_MAX_CHARS = 140000;  // data URL 글자 수 ≈ 100KB
export const PHOTO_MIN_EDGE = 600;      // 원본이 이보다 작으면 "작음" 알림

export const normKey = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// "폴더/MR-J4-10B_2.JPG" → { stem: "MR-J4-10B", key: "MRJ410B", seq: 2 }.  "Q64AD (2).jpg" 도 2번
export function parsePhotoName(name) {
  const base = String(name || "").replace(/^.*[\\/]/, "").replace(/\.[A-Za-z0-9]{2,5}$/, "").trim();
  const m = base.match(/^(.*?)(?:_(\d{1,2})|\s*\((\d{1,2})\))$/);
  const stem = (m ? m[1] : base).trim();
  return { stem, key: normKey(stem), seq: m ? parseInt(m[2] || m[3], 10) : 1 };
}

const commonPrefix = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };
// 글자 몇 개를 고치면 같아지는지 (오타 찾기용, 3 넘으면 그만 셈)
function editDist(a, b) {
  if (Math.abs(a.length - b.length) > 3) return 9;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
// 비슷한 정도 (클수록 비슷): 한쪽이 다른 쪽을 품음 > 오타 한두 글자 > 앞 4글자 이상 같음
const likeness = (k, key) => k.includes(key) || key.includes(k) ? 99 : editDist(k, key) <= 2 ? 50 - editDist(k, key) : commonPrefix(k, key) >= 4 ? commonPrefix(k, key) : 0;

// names: 파일 이름 배열, products: { id: { model, photos } }
// 결과 한 줄: { name, stem, seq, status, id?, model?, replace?, hints? }
//   status: ok | none(맞는 형명 없음) | ambiguous(형명 둘 이상) | over(순번 4 이상) | dup(같은 자리 두 번) | bad(이름에서 형명을 못 읽음)
export function matchPhotos(names, products) {
  const index = {};
  for (const [id, p] of Object.entries(products || {})) { const k = normKey(p.model); if (k) (index[k] ||= []).push(id); }
  const keys = Object.keys(index), seen = new Set();
  return names.map(name => {
    const { stem, key, seq } = parsePhotoName(name);
    const row = { name, stem, seq };
    if (!key) return { ...row, status: "bad" };
    const ids = index[key];
    if (!ids) {
      const hints = keys.map(k => ({ k, s: likeness(k, key) }))
        .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map(x => products[index[x.k][0]].model);
      return { ...row, status: "none", hints };
    }
    if (ids.length > 1) return { ...row, status: "ambiguous", hints: ids.map(i => products[i].model) };
    const id = ids[0], model = products[id].model;
    if (seq < 1 || seq > MAX_PHOTOS) return { ...row, status: "over", id, model };
    const slot = id + "#" + seq;
    if (seen.has(slot)) return { ...row, status: "dup", id, model };
    seen.add(slot);
    return { ...row, status: "ok", id, model, replace: !!(products[id].photos || [])[seq - 1] };
  });
}

// 순번 자리에 넣기: 같은 순번이 있으면 바꾸고, 빈 자리는 당겨서 채움
export function placePhotos(existing, adds) {
  const arr = [...(existing || [])].slice(0, MAX_PHOTOS);
  for (const { seq, src } of adds) arr[seq - 1] = src;
  return Array.from(arr).filter(Boolean).slice(0, MAX_PHOTOS);
}
