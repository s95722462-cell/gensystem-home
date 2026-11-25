// GEN 부품몰 — 관리자 화면 (구글 로그인, 견적 요청, 상품 편집, 엑셀 올리기)
import { IS_CONFIGURED, ADMIN_EMAILS } from "./config.js";
import { won, esc, slug, loadProducts, toDb, fromDb } from "./common.js";
import { SHEETJS_URL, rowsToProducts, diffProducts, FIELD_KO } from "./excel.js";
import { MAX_PHOTOS, PHOTO_MAX_EDGE, PHOTO_MAX_CHARS, PHOTO_MIN_EDGE, matchPhotos, placePhotos } from "./photos.js";

const $ = id => document.getElementById(id);
const ST = { new: "새 요청", answered: "회신함", closed: "끝남" };
let F = null;            // firebase 묶음
let products = {};       // id → 데이터 (전체, 숨김 포함)
let quotes = [];

const fmtTime = t => { try { const d = t?.toDate ? t.toDate() : new Date(t); return isNaN(d) ? "-" : d.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }); } catch (e) { return "-"; } };
const note = (html, warn = true) => { $("notice").hidden = !html; $("notice").className = "notice" + (warn ? " warn" : ""); $("noticeText").innerHTML = html || ""; };

// ---------- 로그인 ----------
async function start() {
  document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => showTab(b.dataset.tab));
  if (!IS_CONFIGURED) {
    note("<b>설정 전</b> — public/js/config.js 에 Firebase 설정을 붙여 넣어야 로그인·저장이 됩니다. 지금은 견본 데이터로 <b>엑셀 미리보기만</b> 해 볼 수 있습니다.");
    $("loginBtn").hidden = true;
    $("gate").hidden = true; $("app").hidden = false;
    products = Object.fromEntries((await loadProducts()).products.map(p => [p.id, p]));
    $("tab-quotes").innerHTML = '<div class="box"><p class="muted" style="margin:0">설정 전이라 견적 요청이 없습니다.</p></div>';
    renderProducts();
    return;
  }
  const { fb } = await import("./fb.js");
  F = await fb();
  const { auth, authInst } = F;
  $("loginBtn").onclick = () => auth.signInWithPopup(authInst, new auth.GoogleAuthProvider()).catch(e => note("로그인 실패: " + esc(e.code || e.message)));
  $("logoutBtn").onclick = () => auth.signOut(authInst);
  auth.onAuthStateChanged(authInst, async user => {
    $("who").textContent = user ? user.email : "";
    $("loginBtn").hidden = !!user; $("logoutBtn").hidden = !user;
    const ok = user && ADMIN_EMAILS.includes(String(user.email).toLowerCase());
    $("gate").hidden = !!ok; $("app").hidden = !ok;
    if (user && !ok) $("gate").innerHTML = `<p style="margin:0">${esc(user.email)} 은(는) 관리자 계정이 아닙니다. 로그아웃 후 관리자 계정으로 로그인하세요.</p>`;
    if (ok) { note(""); await Promise.all([loadQuotes(), loadAllProducts()]); }
  });
}

function showTab(t) {
  document.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  $("tab-quotes").hidden = t !== "quotes"; $("tab-products").hidden = t !== "products";
}

// ---------- 견적 요청 ----------
async function loadQuotes() {
  const { fs, db } = F;
  const snap = await fs.getDocs(fs.query(fs.collection(db, "quotes"), fs.orderBy("createdAt", "desc"), fs.limit(300)));
  quotes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderQuotes();
}
function renderQuotes(openId) {
  const nNew = quotes.filter(q => q.status === "new").length;
  $("tab-quotes").innerHTML = `<div class="box"><div class="row"><h2>견적 요청 ${quotes.length}건 (새 요청 ${nNew})</h2><button class="btn ghost small" id="reloadQ" type="button">새로 고침</button></div>
    ${quotes.length ? `<div class="tablebox"><table class="list"><thead><tr><th>받은 시각</th><th>회사</th><th class="num">품목</th><th class="num">합계(별도)</th><th>상태</th></tr></thead><tbody>
    ${quotes.map(q => `<tr class="click" data-id="${esc(q.id)}"><td>${fmtTime(q.createdAt)}</td><td>${esc(q.company)}</td><td class="num">${(q.items || []).length}</td><td class="num">${won(q.total)}</td><td><span class="st ${esc(q.status)}">${ST[q.status] || esc(q.status)}</span></td></tr>`).join("")}
    </tbody></table></div>` : '<p class="muted">아직 견적 요청이 없습니다.</p>'}</div><div id="qDetail"></div>`;
  $("reloadQ").onclick = loadQuotes;
  document.querySelectorAll("#tab-quotes tr.click").forEach(tr => tr.onclick = () => openQuote(tr.dataset.id));
  if (openId) openQuote(openId);
}
function openQuote(id) {
  const q = quotes.find(x => x.id === id); if (!q) return;
  $("qDetail").innerHTML = `<div class="box"><h2>${esc(q.company)} — ${fmtTime(q.createdAt)}</h2>
    <p style="margin:0 0 6px"><b>담당자·연락처</b> ${esc(q.contact)}</p>
    <p style="margin:0 0 10px;white-space:pre-wrap"><b>요청 사항</b> ${esc(q.memo || "-")}</p>
    <div class="tablebox"><table class="list"><thead><tr><th>형명</th><th class="num">수량</th><th class="num">단가(별도)</th><th class="num">금액</th><th class="num">지금 재고</th></tr></thead><tbody>
    ${(Array.isArray(q.items) ? q.items : []).map(it => {
      // 보안 규칙은 품목 안 칸까지는 검사하지 않음 → 여기서 글자는 escape, 숫자는 숫자로 바꿔 보여 줌
      it = it && typeof it === "object" ? it : {};
      const qty = Math.trunc(Number(it.qty)) || 0, up = Math.trunc(Number(it.unitPrice)) || 0, pid = String(it.id ?? "");
      const p = Object.prototype.hasOwnProperty.call(products, pid) ? products[pid] : null;
      return `<tr><td>${esc(String(it.model ?? "?").slice(0, 100))}${it.cond ? ` <span class="chip ${it.cond === "신품" ? "new" : "used"}">${esc(String(it.cond).slice(0, 10))}</span>` : ""}</td><td class="num">${qty}</td><td class="num">${won(up)}</td><td class="num">${won(qty * up)}</td><td class="num">${p ? esc(p.stock) : "-"}</td></tr>`;
    }).join("")}
    <tr><td>합계</td><td></td><td></td><td class="num">${won(q.total)}</td><td></td></tr></tbody></table></div>
    <p class="muted">고객 화면에서 계산된 금액입니다. 회신 전에 단가를 꼭 다시 확인하세요.</p>
    <form id="qForm"><div class="formgrid">
      <div><label for="qSt">상태</label><select id="qSt">${Object.entries(ST).map(([k, v]) => `<option value="${k}" ${q.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
      <div class="wide"><label for="qMemo">관리자 메모 (고객에게 안 보임)</label><textarea id="qMemo" rows="2" maxlength="2000">${esc(q.adminMemo || "")}</textarea></div>
    </div><div class="buy"><button class="btn" type="submit">저장</button><span id="qMsg" class="muted"></span></div></form></div>`;
  $("qForm").onsubmit = async e => {
    e.preventDefault();
    const { fs, db } = F;
    const upd = { status: $("qSt").value, adminMemo: $("qMemo").value.slice(0, 2000), statusAt: fs.serverTimestamp() };
    try { await fs.updateDoc(fs.doc(db, "quotes", id), upd); Object.assign(q, upd); renderQuotes(id); $("qMsg").textContent = "저장했습니다."; }
    catch (err) { $("qMsg").textContent = "저장 실패: " + (err.code || err.message); }
  };
  $("qDetail").scrollIntoView({ block: "start" });
}

// ---------- 상품 ----------
async function loadAllProducts() {
  const { fs, db } = F;
  const snap = await fs.getDocs(fs.collection(db, "products"));
  products = Object.fromEntries(snap.docs.map(d => [d.id, fromDb(d.data())]));
  renderProducts();
}
function renderProducts() {
  const list = Object.entries(products).sort((a, b) => String(a[1].category).localeCompare(String(b[1].category), "ko") || a[0].localeCompare(b[0]));
  $("tab-products").innerHTML = `
  <div class="box"><h2>엑셀로 상품 올리기</h2>
    <p class="muted" style="margin:0 0 8px">머리글: 형명, 상품명, 제조사, 분류, 신품/중고, 재고, 판매가 (+ 출고, 비고). 양식은 templates/재고_양식.xlsx. 같은 형명은 같은 상품으로 보고 엑셀 칸만 고칩니다(사진·사양·자료는 그대로).</p>
    <input type="file" id="xls" accept=".xlsx,.xls,.csv">
    <label style="display:inline-flex;gap:6px;align-items:center;margin-left:10px;font-size:13px"><input type="checkbox" id="xlsVisible" checked style="width:auto"> 새 상품은 바로 공개</label>
    <div id="xlsOut"></div></div>
  <div class="box"><h2>사진 한꺼번에 올리기</h2>
    <p class="muted" style="margin:0 0 6px">파일 이름 = <b>형명_순번.jpg</b> (예: Q64AD.jpg, Q64AD_2.jpg). 순번이 없으면 1번(대표 사진), 상품 하나에 ${MAX_PHOTOS}장. 대소문자·띄어쓰기·하이픈은 달라도 됩니다. 같은 순번이 이미 있으면 바꿉니다. 긴 변 ${PHOTO_MAX_EDGE}픽셀로 줄여 저장합니다.</p>
    <p style="margin:0 0 8px;color:var(--err);font-size:13px"><b>명판·시리얼 번호가 보이는 사진은 올리지 마세요.</b> 고객사 이름표·자산 스티커가 찍힌 사진도 빼 주세요.</p>
    <div id="bulkDrop" style="border:2px dashed var(--line);border-radius:8px;padding:16px;text-align:center">사진이나 폴더를 여기에 끌어다 놓거나 <input type="file" id="bulk" accept="image/*" multiple style="width:auto"></div>
    <div id="bulkOut"></div></div>
  <div class="box"><div class="row"><h2>상품 ${list.length}개 (공개 ${list.filter(x => x[1].visible).length})</h2>
    <span><button class="btn ghost small" type="button" id="addOne">상품 하나 추가</button> <button class="btn ghost small" type="button" id="exportJson">상품 JSON 내려받기 (검색용 페이지 만들기)</button></span></div>
    <div id="pEdit"></div>
    <div class="tablebox"><table class="list"><thead><tr><th>형명</th><th>분류</th><th>상태</th><th class="num">재고</th><th class="num">판매가</th><th class="num">사진</th><th>공개</th><th></th></tr></thead><tbody>
    ${list.map(([id, p]) => `<tr><td><b class="model" style="font-size:13px">${esc(p.model)}</b><br><span class="muted">${esc(p.name)}</span></td><td>${esc(p.category)}</td><td>${p.condition === "new" ? "신품" : "중고"}</td><td class="num">${p.stock}</td><td class="num">${won(p.price)}</td><td class="num">${(p.photos || []).length || "-"}</td>
      <td><input type="checkbox" class="vis" data-id="${esc(id)}" ${p.visible ? "checked" : ""} ${F ? "" : "disabled"} aria-label="공개" style="width:auto"></td>
      <td><button class="btn ghost small edit" type="button" data-id="${esc(id)}">편집</button></td></tr>`).join("")}
    </tbody></table></div></div>`;
  $("xls").onchange = e => e.target.files[0] && previewExcel(e.target.files[0]);
  $("bulk").onchange = e => { const fs = [...e.target.files]; e.target.value = ""; fs.length && previewBulk(fs); };
  const dz = $("bulkDrop");
  dz.ondragover = e => { e.preventDefault(); dz.style.background = "var(--tag)"; };
  dz.ondragleave = () => { dz.style.background = ""; };
  dz.ondrop = async e => { e.preventDefault(); dz.style.background = ""; const fs = await droppedFiles(e.dataTransfer); fs.length && previewBulk(fs); };
  $("addOne").onclick = () => editProduct(null);
  $("exportJson").onclick = exportJson;
  document.querySelectorAll(".vis").forEach(c => c.onchange = async () => {
    const id = c.dataset.id;
    try { await F.fs.updateDoc(F.fs.doc(F.db, "products", id), { visible: c.checked, updatedAt: F.fs.serverTimestamp() }); products[id].visible = c.checked; }
    catch (err) { c.checked = !c.checked; alert("바꾸지 못했습니다: " + (err.code || err.message)); }
  });
  document.querySelectorAll(".edit").forEach(b => b.onclick = () => editProduct(b.dataset.id));
}

const lines = s => String(s || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
const pairs = s => lines(s).map(l => { const i = l.indexOf("|"); return i < 0 ? [l, ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; });

function editProduct(id) {
  const p = id ? products[id] : { model: "", name: "", brand: "", category: "", condition: "used", stock: 1, price: 0, leadTime: "당일 출고", visible: false };
  let photos = [...(p.photos || [])];
  const box = $("pEdit");
  box.innerHTML = `<form id="pForm" class="box" style="background:var(--bg)"><h2>${id ? esc(p.model) + " 편집" : "새 상품"}</h2><div class="formgrid">
    <div><label for="f_model">형명</label><input id="f_model" value="${esc(p.model)}" ${id ? "readonly" : ""} required maxlength="100"></div>
    <div><label for="f_name">상품명</label><input id="f_name" value="${esc(p.name)}" maxlength="200"></div>
    <div><label for="f_brand">제조사</label><input id="f_brand" value="${esc(p.brand || "")}" maxlength="60"></div>
    <div><label for="f_cat">분류</label><input id="f_cat" value="${esc(p.category || "")}" maxlength="60" list="catList"><datalist id="catList">${[...new Set(Object.values(products).map(x => x.category))].map(c => `<option value="${esc(c)}">`).join("")}</datalist></div>
    <div><label for="f_cond">신품/중고</label><select id="f_cond"><option value="used" ${p.condition !== "new" ? "selected" : ""}>중고</option><option value="new" ${p.condition === "new" ? "selected" : ""}>신품</option></select></div>
    <div><label for="f_stock">재고</label><input id="f_stock" type="number" min="0" value="${+p.stock || 0}"></div>
    <div><label for="f_price">판매가 (부가세 별도, 원)</label><input id="f_price" type="number" min="0" value="${+p.price || 0}"></div>
    <div><label for="f_lead">출고</label><input id="f_lead" value="${esc(p.leadTime || "")}" maxlength="60"></div>
    <div class="wide"><label for="f_specs">사양 (한 줄에 "항목 | 내용")</label><textarea id="f_specs" rows="4">${esc((p.specs || []).map(([a, b]) => `${a} | ${b}`).join("\n"))}</textarea></div>
    <div class="wide"><label for="f_links">제조사 매뉴얼 링크 (한 줄에 "이름 | https://...")</label><textarea id="f_links" rows="2">${esc((p.manualLinks || []).map(m => `${m.label} | ${m.url}`).join("\n"))}</textarea></div>
    <div class="wide"><label for="f_note">비고</label><input id="f_note" value="${esc(p.note || "")}" maxlength="1000"></div>
    <div class="wide"><label>실물 사진 (최대 ${MAX_PHOTOS}장, 긴 변 ${PHOTO_MAX_EDGE}픽셀로 줄여 저장 — 명판·시리얼 번호는 찍지 않기)</label><div class="photos" id="f_photos"></div><input type="file" id="f_photo" accept="image/*" multiple></div>
    <div class="wide"><label style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="f_vis" ${p.visible ? "checked" : ""} style="width:auto"> 가게에 공개</label></div>
  </div><div class="buy"><button class="btn" type="submit" ${F ? "" : "disabled"}>저장</button><button class="btn ghost" type="button" id="f_cancel">닫기</button><span class="muted" id="f_msg">${F ? "" : "설정 전이라 저장할 수 없습니다."}</span></div></form>`;
  const drawPhotos = () => {
    $("f_photos").innerHTML = photos.map((s, i) => `<button type="button" data-i="${i}" title="눌러서 빼기"><img src="${esc(s)}" alt="사진 ${i + 1}"></button>`).join("") || '<span class="muted">사진 없음</span>';
    document.querySelectorAll("#f_photos button").forEach(b => b.onclick = () => { photos.splice(+b.dataset.i, 1); drawPhotos(); });
  };
  drawPhotos();
  $("f_photo").onchange = async e => {
    for (const f of [...e.target.files]) { if (photos.length >= MAX_PHOTOS) break; try { photos.push((await shrink(f)).src); } catch (err) { alert("사진을 읽지 못했습니다: " + f.name); } }
    e.target.value = ""; drawPhotos();
  };
  $("f_cancel").onclick = () => { box.innerHTML = ""; };
  $("pForm").onsubmit = async e => {
    e.preventDefault();
    const model = $("f_model").value.trim(); if (!model) return;
    const pid = id || slug(model);
    if (!id && products[pid]) return void ($("f_msg").textContent = "같은 형명이 이미 있습니다.");
    const data = {
      model, name: $("f_name").value.trim(), brand: $("f_brand").value.trim(), category: $("f_cat").value.trim() || "기타",
      condition: $("f_cond").value, stock: Math.max(0, parseInt($("f_stock").value) || 0), price: Math.max(0, parseInt($("f_price").value) || 0),
      leadTime: $("f_lead").value.trim(), note: $("f_note").value.trim(),
      specs: pairs($("f_specs").value).slice(0, 60),
      manualLinks: pairs($("f_links").value).filter(([, u]) => /^https?:\/\//i.test(u)).map(([label, url]) => ({ label, url })).slice(0, 20),
      photos, visible: $("f_vis").checked, updatedAt: F.fs.serverTimestamp()
    };
    // Firestore 는 배열 안 배열을 못 넣으므로 specs 는 저장할 때 {k,v} 로 바꿨다가 읽을 때 되돌림 (common.js toDb/fromDb)
    try {
      await F.fs.setDoc(F.fs.doc(F.db, "products", pid), toDb(data));
      products[pid] = { ...data, updatedAt: new Date() };
      renderProducts(); $("f_msg") && ($("f_msg").textContent = "저장했습니다.");
    } catch (err) { $("f_msg").textContent = "저장 실패: " + (err.code || err.message); }
  };
  box.scrollIntoView({ block: "start" });
}

// 사진 줄이기: 긴 변 800px → JPEG, 약 100KB 이하 (일부러 작게: 명판·시리얼 번호가 읽히지 않게). 결과 { src, w, h } — w·h 는 원본 크기
function shrink(file) {
  return new Promise((ok, bad) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height, max = PHOTO_MAX_EDGE, q = 0.8, out = "";
      for (let tries = 0; tries < 8; tries++) {
        const k = Math.min(1, max / Math.max(w, h));
        const c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        out = c.toDataURL("image/jpeg", q);
        if (out.length <= PHOTO_MAX_CHARS) break;
        max = Math.round(max * 0.8); q = Math.max(0.5, q - 0.06);
      }
      URL.revokeObjectURL(img.src);
      out.length <= PHOTO_MAX_CHARS ? ok({ src: out, w, h }) : bad(new Error("too big"));
    };
    img.onerror = bad;
    img.src = URL.createObjectURL(file);
  });
}

// ---------- 사진 한꺼번에 올리기 (이름 규칙은 photos.js) ----------
const isImage = f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(f.name);
async function droppedFiles(dt) {   // 폴더째 끌어다 놓은 것도 풀어서 파일 목록으로
  const out = [], entries = [...(dt.items || [])].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
  if (!entries.length) return [...(dt.files || [])].filter(isImage);
  const walk = async en => {
    if (en.isFile) { const f = await new Promise((ok, bad) => en.file(ok, bad)).catch(() => null); if (f && isImage(f)) out.push(f); return; }
    const rd = en.createReader();
    for (;;) { const part = await new Promise((ok, bad) => rd.readEntries(ok, bad)).catch(() => []); if (!part.length) break; for (const x of part) await walk(x); }
  };
  for (const en of entries) await walk(en);
  return out;
}
const BULK_ST = { ok: "새로 넣음", none: "맞는 형명 없음", ambiguous: "형명 둘 이상에 맞음", over: `순번은 1~${MAX_PHOTOS}`, dup: "같은 순번이 두 번", bad: "이름에서 형명을 못 읽음", unread: "사진을 읽지 못함" };
async function previewBulk(files) {
  const out = $("bulkOut");
  files = files.filter(isImage).sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true })).slice(0, 600);
  out.innerHTML = `<p class="muted">사진 ${files.length}장 읽는 중…</p>`;
  const rows = matchPhotos(files.map(f => f.name), products);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].status !== "ok") continue;
    try { const s = await shrink(files[i]); rows[i].src = s.src; rows[i].small = Math.max(s.w, s.h) < PHOTO_MIN_EDGE; }
    catch (e) { rows[i].status = "unread"; rows[i].heic = /\.hei[cf]$/i.test(files[i].name); }
  }
  const good = rows.filter(r => r.status === "ok");
  const stText = r => r.status === "ok" ? (r.replace ? "바꿈" : "새로 넣음") + (r.small ? ` · 원본이 작음(긴 변 ${PHOTO_MIN_EDGE}픽셀 미만)` : "")
    : BULK_ST[r.status] + (r.heic ? " — 아이폰 HEIC 는 JPG 로 바꿔 주세요" : "") + (r.hints?.length ? ` — 혹시: ${r.hints.map(esc).join(", ")}` : "");
  out.innerHTML = `<p style="margin:10px 0 6px"><b>올릴 사진 ${good.length}장</b> (상품 ${new Set(good.map(r => r.id)).size}개) · <span style="color:var(--err)">못 올림 ${rows.length - good.length}</span></p>
    <div class="tablebox"><table class="list"><thead><tr><th></th><th>파일</th><th>형명</th><th class="num">순번</th><th>상태</th></tr></thead><tbody>
    ${rows.map(r => `<tr class="${r.status === "ok" ? (r.replace ? "diff-changed" : "diff-new") : "diff-bad"}"><td>${r.src ? `<img src="${esc(r.src)}" alt="" style="width:64px;height:48px;object-fit:cover;border-radius:4px;display:block">` : ""}</td><td>${esc(r.name)}</td><td>${esc(r.model || r.stem || "")}</td><td class="num">${r.seq}</td><td>${stText(r)}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="buy"><button class="btn" type="button" id="bulkGo" ${good.length ? "" : "disabled"}>${good.length}장 올리기</button>
    <span class="muted" id="bulkMsg">${F ? "" : "설정 전 — 눌러도 이 화면에만 넣고 저장하지 않습니다."}</span></div>`;
  $("bulkGo").onclick = async () => {
    $("bulkGo").disabled = true;
    const byId = {};
    for (const r of good) (byId[r.id] ||= []).push({ seq: r.seq, src: r.src });
    const ids = Object.keys(byId); let done = 0;
    try {
      for (const id of ids) {
        const photos = placePhotos(products[id].photos, byId[id]);
        if (F) await F.fs.updateDoc(F.fs.doc(F.db, "products", id), { photos, updatedAt: F.fs.serverTimestamp() });
        products[id].photos = photos; done++;
        $("bulkMsg").textContent = `${done} / ${ids.length} 상품`;
      }
      renderProducts();
      $("bulkOut").innerHTML = `<p class="ok-msg" style="margin:10px 0 0">사진 ${good.length}장을 상품 ${ids.length}개에 넣었습니다.${F ? "" : " (설정 전 — 저장하지 않았습니다. 새로 고침하면 사라집니다)"}</p>`;
    } catch (e) { $("bulkMsg").textContent = "올리다 멈춤: " + (e.code || e.message) + ` — ${done}개 상품까지 넣었습니다. 다시 올리면 됩니다.`; $("bulkGo").disabled = false; }
  };
}

// ---------- 엑셀 ----------
async function previewExcel(file) {
  const out = $("xlsOut");
  out.innerHTML = '<p class="muted">읽는 중…</p>';
  let rows;
  try {
    const XLSX = await import(SHEETJS_URL);
    const wb = XLSX.read(await file.arrayBuffer());
    rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  } catch (e) { out.innerHTML = `<p class="err-msg">엑셀을 읽지 못했습니다 (${esc(e.message)}). 인터넷 연결과 파일 형식을 확인하세요.</p>`; return; }
  const { items, errors } = rowsToProducts(rows);
  const d = diffProducts(items, products);
  const chg = it => it.changes.map(c => `<span class="chg">${FIELD_KO[c.field]}: ${esc(c.from)} → ${esc(c.to)}</span>`).join("<br>");
  const toWrite = [...d.added, ...d.changed];
  out.innerHTML = `<p style="margin:10px 0 6px"><b>새 상품 ${d.added.length}</b> · <b>바뀜 ${d.changed.length}</b> · 그대로 ${d.same.length} · <span style="color:var(--err)">못 올림 ${errors.length}</span></p>
    <div class="tablebox"><table class="list"><thead><tr><th>줄</th><th>형명</th><th>구분</th><th>내용</th></tr></thead><tbody>
    ${errors.map(e => `<tr class="diff-bad"><td>${e.line}</td><td>${esc(e.model)}</td><td>못 올림</td><td>${esc(e.msg)}</td></tr>`).join("")}
    ${d.added.map(it => `<tr class="diff-new"><td>${it.line}</td><td>${esc(it.data.model)}</td><td>새 상품</td><td>${esc(it.data.name)} · 재고 ${it.data.stock} · ${won(it.data.price)}</td></tr>`).join("")}
    ${d.changed.map(it => `<tr class="diff-changed"><td>${it.line}</td><td>${esc(it.data.model)}</td><td>바뀜</td><td>${chg(it)}</td></tr>`).join("")}
    </tbody></table></div>
    ${d.same.length ? `<p class="muted">그대로: ${d.same.map(x => esc(x.data.model)).join(", ")}</p>` : ""}
    <div class="buy"><button class="btn" type="button" id="xlsGo" ${toWrite.length && F ? "" : "disabled"}>${toWrite.length}건 올리기</button>
    <span class="muted" id="xlsMsg">${F ? "" : "설정 전 — 미리보기만 됩니다."}</span></div>`;
  $("xlsGo").onclick = async () => {
    const vis = $("xlsVisible").checked;
    const { fs, db } = F;
    $("xlsGo").disabled = true;
    try {
      for (let i = 0; i < toWrite.length; i += 400) {
        const b = fs.writeBatch(db);
        for (const it of toWrite.slice(i, i + 400)) {
          const isNew = !products[it.id];
          const data = { ...it.data, updatedAt: fs.serverTimestamp() };
          if (isNew) data.visible = vis;
          b.set(fs.doc(db, "products", it.id), data, { merge: true });
        }
        await b.commit();
        $("xlsMsg").textContent = `${Math.min(i + 400, toWrite.length)} / ${toWrite.length} 올림`;
      }
      $("xlsMsg").textContent = `${toWrite.length}건 올렸습니다.`;
      await loadAllProducts();
    } catch (e) { $("xlsMsg").textContent = "올리다 멈춤: " + (e.code || e.message) + " — 다시 올리면 남은 것만 올라갑니다."; $("xlsGo").disabled = false; }
  };
}

function exportJson() {
  const list = Object.entries(products).filter(([, p]) => p.visible).map(([id, p]) => {
    const { photos, ...rest } = p;
    return { id, ...rest, updatedAt: p.updatedAt?.toDate ? p.updatedAt.toDate().toISOString().slice(0, 10) : String(p.updatedAt || "").slice(0, 10) };
  });
  const blob = new Blob([JSON.stringify({ sample: !F, products: list }, null, 1)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "products.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

start().catch(e => { console.error(e); note("시작하지 못했습니다: " + esc(e.message)); });
