// 재고 엑셀 → 상품 데이터 변환과 비교 (브라우저·node 둘 다 동작, 화면 코드 없음)
import { slug } from "./common.js";

export const SHEETJS_URL = "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

// 엑셀 머리글 → 필드 (머리글 앞뒤 공백·괄호 설명은 무시)
const HEAD = { "형명": "model", "상품명": "name", "제조사": "brand", "분류": "category",
  "신품/중고": "condition", "재고": "stock", "판매가": "price", "출고": "leadTime", "비고": "note" };
// 엑셀이 관리하는 필드 (이 필드만 비교·덮어씀. 사진·사양·자료는 관리자 화면에서 따로 편집)
export const EXCEL_FIELDS = ["model", "name", "brand", "category", "condition", "stock", "price", "leadTime", "note"];

const num = v => {
  if (typeof v === "number") return Math.round(v);
  const s = String(v ?? "").replace(/[^0-9.-]/g, "");
  return s ? Math.round(Number(s)) : NaN;
};
const str = (v, max) => String(v ?? "").trim().slice(0, max);

// rows: SheetJS sheet_to_json(ws, {defval:""}) 결과 (머리글을 키로 한 객체 배열)
export function rowsToProducts(rows) {
  const out = [], errors = [], seen = new Map();
  rows.forEach((raw, i) => {
    const r = {};
    for (const [k, v] of Object.entries(raw)) {
      const key = HEAD[String(k).replace(/\(.*?\)/g, "").trim()];
      if (key) r[key] = v;
    }
    const line = i + 2; // 엑셀 줄 번호 (1줄 = 머리글)
    const model = str(r.model, 100);
    if (!model) return; // 빈 줄
    const p = {
      model,
      name: str(r.name, 200),
      brand: str(r.brand, 60),
      category: str(r.category, 60) || "기타",
      condition: /신품|새|new/i.test(String(r.condition ?? "")) ? "new" : "used",
      stock: Math.max(0, num(r.stock) || 0),
      price: num(r.price),
      leadTime: str(r.leadTime, 60) || ((num(r.stock) || 0) > 0 ? "당일 출고" : "입고 문의"),
      note: str(r.note, 1000)
    };
    const id = slug(model);
    if (!(p.price > 0)) { errors.push({ line, id, model, msg: "판매가가 비었거나 숫자가 아님" }); return; }
    if (seen.has(id)) { errors.push({ line, id, model, msg: `${seen.get(id)}줄과 형명이 겹침` }); return; }
    seen.set(id, line);
    out.push({ id, line, data: p });
  });
  return { items: out, errors };
}

// existing: { id: 기존 상품 데이터 } → 새 상품 / 바뀐 상품 / 그대로
export function diffProducts(items, existing) {
  const res = { added: [], changed: [], same: [] };
  for (const it of items) {
    const old = existing[it.id];
    if (!old) { res.added.push(it); continue; }
    const changes = EXCEL_FIELDS.filter(f => String(old[f] ?? "") !== String(it.data[f] ?? ""))
      .map(f => ({ field: f, from: old[f] ?? "", to: it.data[f] }));
    (changes.length ? res.changed : res.same).push({ ...it, changes });
  }
  return res;
}

export const FIELD_KO = { model: "형명", name: "상품명", brand: "제조사", category: "분류", condition: "신품/중고",
  stock: "재고", price: "판매가", leadTime: "출고", note: "비고" };
