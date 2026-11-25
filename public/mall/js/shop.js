// GEN 부품몰 — 가게 화면
import { IS_CONFIGURED, NTFY_TOPIC, KAKAO_CHAT_URL } from "./config.js";
import { initLadder, setLadderInput } from "./ladder.js";
import { won, esc, tiersOf, unitPrice, lampOf, condChip, thumbHtml, loadProductsFast, loadPhotos, store, hanToEng, hasHangul } from "./common.js";

const $ = id => document.getElementById(id);
const CART_KEY = "genshop-cart";
let P = [], isSample = false;
let cat = "all", query = "";
let cart = store.get(CART_KEY, []);
if (!Array.isArray(cart)) cart = [];

const cats = () => {
  const seen = new Map();
  for (const p of P) { const c = p.category || "기타"; seen.set(c, (seen.get(c) || 0) + 1); }
  return [["all", "전체", P.length], ...[...seen].map(([k, n]) => [k, k, n])];
};
const save = () => {
  store.set(CART_KEY, cart);
  $("cartCount").textContent = cart.reduce((a, b) => a + b.q, 0);
  $("cartBtn").classList.toggle("has", cart.length > 0); setLadderInput("M100", cart.length > 0);   // 담긴 것이 있고(has) 래더의 M1520 이 켜져 있으면(lit) 녹색
};
const byId = id => P.find(x => x.id === id);

// 분류 아이콘: 어느 회사 것도 아닌 부품 모양 선 그림 (분류 이름에 든 낱말로 고름)
const IC = d => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = [
  [/^전체$/, '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>'],
  [/통신|네트워크|링크/, '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 7v5M12 12l-6 4.5M12 12l6 4.5"/>'],
  [/아날로그|온도/, '<path d="M3 12c2-7 4-7 6 0s4 7 6 0 4-7 6 0"/>'],
  [/위치|모션/, '<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>'],
  [/앰프|인버터|드라이브/, '<rect x="7" y="3" width="10" height="18" rx="1.5"/><path d="M10 7h4M10 10h4M10 13h4M10 17h4"/>'],
  [/모터/, '<rect x="4" y="7" width="12" height="10" rx="1.5"/><path d="M16 12h5M8 7v10M12 7v10"/>'],
  [/터치|패널|화면|HMI|GOT/i, '<rect x="3" y="5" width="18" height="13" rx="1.5"/><path d="M7 9h6M7 12h3"/><circle cx="16.5" cy="12.5" r="1.5"/>'],
  [/센서/, '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>'],
  [/./, '<rect x="6" y="3" width="12" height="18" rx="1.5"/><path d="M9 7h6"/><circle cx="9.5" cy="11" r=".9" fill="currentColor"/><circle cx="12.5" cy="11" r=".9" fill="currentColor"/><path d="M9 15h6v3H9z"/>']
];
const catIcon = label => IC(ICONS.find(([re]) => re.test(label))[1]);

function renderCats() {
  const box = $("cats");
  box.innerHTML = "<h2>분야 표시등:</h2>" + cats().map(([k, l, n]) =>
    `<button type="button" data-k="${esc(k)}" aria-pressed="${cat === k}">${catIcon(l)}${esc(l)}<small>${n}</small></button>`).join("");
  box.querySelectorAll("button").forEach(b => b.onclick = () => {
    cat = b.dataset.k; renderCats();
    if (location.hash) location.hash = ""; else renderList();
  });
}

function renderList() {
  const q = query.trim().toLowerCase().replace(/\s+/g, "");
  // 한글 자판으로 친 형명("ㅡㄱ-ㅓ4")은 영문 글쇠("mr-j4")로 되돌려서도 찾는다 (입력기를 영문으로 강제할 방법이 없어서)
  const q2 = hasHangul(query) ? hanToEng(query).trim().toLowerCase().replace(/\s+/g, "") : "";
  const hay = p => (p.model + " " + p.name).toLowerCase().replace(/\s+/g, "");
  const inCat = p => cat === "all" || (p.category || "기타") === cat;
  let items = P.filter(p => inCat(p) && (!q || hay(p).includes(q))), eng = "";
  if (q2 && !items.length) { const alt = P.filter(p => inCat(p) && hay(p).includes(q2)); if (alt.length) { items = alt; eng = hanToEng(query).trim().toUpperCase(); } }
  const title = eng ? `"${esc(eng)}" 검색 결과 <small class="engnote">한글 자판으로 치신 "${esc(query)}" 을(를) 영문으로 바꿔 찾았습니다</small>` : q ? `"${esc(query)}" 검색 결과` : esc((cats().find(c => c[0] === cat) || [, "전체"])[1]);
  $("view").innerHTML = `<div class="listhead"><h1>${title}</h1><p>${items.length}개 · 가격은 부가세 별도</p></div>` +
    (items.length ? `<div class="grid">${items.map(p => { const [l, t] = lampOf(p), sold = (+p.stock || 0) <= 0, hasPhoto = Array.isArray(p.photos) && p.photos[0]; return `<button class="card${sold ? " sold" : l === "low" ? " low" : ""}" type="button" data-id="${esc(p.id)}">
     <span class="addr"><span class="model">${esc(p.model)}</span><small>${esc(p.category || "기타")}</small></span>
     <span class="ct">${hasPhoto ? `<span class="thumb">${thumbHtml(p)}</span>` : ""}<span style="min-width:0"><span class="name">${esc(p.name)}</span><span class="meta">${condChip(p)}<span class="lamp ${l}">${esc(t)}</span></span></span></span>
     <span class="coil"><span class="cv"><span class="price">${sold ? "품절" : won(p.price)}</span></span><small>${sold ? "입고 문의" : "부가세 별도"}</small></span></button>`; }).join("")}</div><div class="ladder-end">END</div>`
      : `<p class="empty">찾는 형명이 없습니다. 견적함에서 <b>재고 문의</b>를 남겨 주시면 찾아 드립니다.</p>`);
  document.querySelectorAll(".card").forEach(c => c.onclick = () => { location.hash = "p-" + c.dataset.id; });
  document.title = "겐시스템 자동화 부품 판매";
}

// 화면 밝기: 밝게 = 시안 A, 어둡게 = 시안 C. 고르기 전에는 기기 설정을 따름
function initTheme() {
  const b = $("themeBtn"); if (!b) return;
  const isDark = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
  const draw = () => { b.textContent = isDark() ? "밝게" : "어둡게"; };
  b.onclick = () => { const next = isDark() ? "light" : "dark"; document.documentElement.dataset.theme = next; store.set("genshop-theme", next); draw(); };
  draw();
}

const safeUrl = u => /^https?:\/\//i.test(String(u || "")) ? u : null;

function renderDetail(p) {
  const [l, t] = lampOf(p);
  const photos = (p.photos || []).filter(Boolean);
  const links = (p.manualLinks || []).filter(m => m && safeUrl(m.url));
  $("view").innerHTML = `<button class="back" type="button" id="back">← 목록으로</button>
  <article class="detail">
    <div>
      <div class="thumb" id="bigThumb">${thumbHtml(p)}</div>
      ${photos.length > 1 ? `<div class="photos">${photos.map((s, i) => `<button type="button" data-i="${i}" aria-label="사진 ${i + 1}"><img src="${esc(s)}" alt=""></button>`).join("")}</div>` : ""}
      <p style="font-size:12px;color:var(--muted);margin:8px 0 0">${photos.length ? "보유 재고 실물 사진입니다." : isSample ? "사진은 견본 그림입니다. 실제 판매 때는 보유 재고 실물 사진을 올립니다." : "실물 사진은 견적 요청 때 보내 드립니다."}</p>
    </div>
    <div style="min-width:0">
      <div class="row" style="justify-content:flex-start;gap:10px">${condChip(p)}<span class="lamp ${l}">${esc(t)}</span><span class="lead" style="font-size:13px;color:var(--muted)">출고: ${esc(p.leadTime || "문의")}</span>${p.brand ? `<span class="chip">제조사 ${esc(p.brand)}</span>` : ""}</div>
      <h1>${esc(p.model)}</h1><p class="sub">${esc(p.name)}</p>
      <div class="tablebox"><table><thead><tr><th class="num">판매가 (부가세 별도)</th><th class="num">부가세 포함</th></tr></thead><tbody>
        <tr><td class="num price" style="font-size:18px">${won(p.price)}</td><td class="num">${won(Math.round(p.price * 1.1))}</td></tr>
      </tbody></table></div>
      <div class="buy">
        <div class="qty"><button type="button" id="minus" aria-label="수량 줄이기">−</button><input id="qty" value="1" inputmode="numeric" aria-label="수량"><button type="button" id="plus" aria-label="수량 늘리기">+</button></div>
        <button class="btn" type="button" id="add">${(+p.stock || 0) <= 0 ? "입고 문의 담기" : "견적함에 담기"}</button>
        ${KAKAO_CHAT_URL || !IS_CONFIGURED ? `<button class="btn" type="button" id="kakao" style="background:#FEE500;color:#191919;border-color:#FEE500">카톡으로 문의</button>` : ""}
        <span id="kakaoMsg" style="font-size:13px;flex-basis:100%" hidden></span>
        <span id="qtyNote" style="font-size:13px;color:var(--err);flex-basis:100%" hidden></span>
      </div>
      ${(p.specs || []).length ? `<div class="sect"><h2>사양</h2><div class="tablebox"><table><tbody>${p.specs.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
      ${p.note ? `<div class="sect"><h2>비고</h2><p style="margin:0">${esc(p.note)}</p></div>` : ""}
      <div class="sect"><h2>제조사 매뉴얼</h2><div class="dl">${links.length
        ? links.map(m => `<a href="${esc(m.url)}" target="_blank" rel="noopener nofollow">${esc(m.label || "매뉴얼")} ↗</a>`).join("")
        : "<span>제조사 사이트에서 형명으로 찾으실 수 있습니다</span>"}</div></div>
    </div>
  </article>`;
  document.title = `${p.model} 재고 | 겐시스템 자동화 부품 판매`;
  const qi = $("qty");
  $("back").onclick = () => { location.hash = ""; };
  // 재고보다 많이 고르면 알려 줌 (담기는 됨 — 나머지는 입고 문의로)
  const stock = Math.max(0, +p.stock || 0);
  const qtyNote = () => { const q = parseInt(qi.value) || 1, n = $("qtyNote"); n.hidden = !(stock > 0 && q > stock); n.textContent = `지금 재고는 ${stock}개입니다. 나머지 ${q - stock}개는 입고 문의로 함께 접수됩니다.`; };
  qi.oninput = qtyNote;
  $("minus").onclick = () => { qi.value = Math.max(1, (+qi.value || 1) - 1); qtyNote(); };
  $("plus").onclick = () => { qi.value = Math.min(9999, (+qi.value || 1) + 1); qtyNote(); };
  // 카톡 문의: 형명·수량을 복사해 두고 채널 채팅을 엶 (채팅창에 글자를 미리 넣어 줄 수는 없어서 붙여넣기만 하면 되게)
  if ($("kakao")) $("kakao").onclick = async () => {
    const q = Math.min(9999, Math.max(1, parseInt(qi.value) || 1));
    const text = `[겐시스템 부품 문의] ${p.model} ${q}개 (${p.condition === "new" ? "신품" : "중고"}) 재고·견적 문의드립니다.`;
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch (e) { /* 권한 없음 → 아래 글을 직접 복사 */ }
    const m = $("kakaoMsg"); m.hidden = false;
    m.innerHTML = (copied ? "문의 글을 복사했습니다. 카톡 채팅창에 <b>붙여 넣기</b> 하세요: " : "아래 글을 복사해 카톡 채팅창에 보내 주세요: ") + `<b>${esc(text)}</b>` + (KAKAO_CHAT_URL ? "" : '<br><span class="muted">설정 전 — config.js 에 채널 채팅 주소를 넣으면 여기서 카톡이 열립니다.</span>');
    if (KAKAO_CHAT_URL) window.open(KAKAO_CHAT_URL, "_blank", "noopener");
  };
  $("add").onclick = () => {
    const q = Math.min(9999, Math.max(1, parseInt(qi.value) || 1));
    const e = cart.find(x => x.id === p.id); e ? e.q = Math.min(9999, e.q + q) : cart.push({ id: p.id, q });
    save(); openCart();
  };
  document.querySelectorAll(".photos button").forEach(b => b.onclick = () => {
    $("bigThumb").innerHTML = `<img src="${esc(photos[+b.dataset.i])}" alt="${esc(p.model)} 실물 사진">`;
  });
}

function cartLines() {
  return cart.map(c => { const p = byId(c.id); return p ? { p, q: c.q, u: unitPrice(p, c.q) } : null; }).filter(Boolean);
}

function openCart(msg) {
  const d = $("drawer"); d.hidden = false;
  const lines = cartLines();
  const sum = lines.reduce((a, b) => a + b.u * b.q, 0);
  const keep = { co: $("co")?.value || "", who: $("who")?.value || "", memo: $("memo")?.value || "" };
  d.innerHTML = `<div class="row"><h2>견적함</h2><button class="btn ghost" type="button" id="close">닫기</button></div>
   ${lines.length ? `<div class="tablebox"><table class="quote"><thead><tr><th class="num">No.</th><th>품명</th><th>규격</th><th>구분</th><th class="num">수량</th><th class="num">단가</th><th class="num">금액</th><th></th></tr></thead><tbody>
    ${lines.map((x, i) => `<tr class="line"><td class="num">${i + 1}</td><td>${esc(x.p.name)}${(+x.p.stock || 0) <= 0 ? '<small>입고 문의</small>' : x.q > +x.p.stock ? `<small>재고 ${+x.p.stock}개, 나머지 입고 문의</small>` : ""}</td><td><b>${esc(x.p.model)}</b></td><td><span class="chip ${x.p.condition === "new" ? "new" : "used"}">${x.p.condition === "new" ? "신품" : "중고"}</span></td><td class="num"><span class="qty mini"><button type="button" class="qm" data-id="${esc(x.p.id)}" data-d="-1" aria-label="${esc(x.p.model)} 수량 줄이기">−</button><input class="qi" data-id="${esc(x.p.id)}" value="${x.q}" inputmode="numeric" aria-label="${esc(x.p.model)} 수량"><button type="button" class="qm" data-id="${esc(x.p.id)}" data-d="1" aria-label="${esc(x.p.model)} 수량 늘리기">+</button></span></td><td class="num">${won(x.u)}</td><td class="num">${won(x.u * x.q)}</td><td><button class="rm" type="button" data-id="${esc(x.p.id)}" aria-label="${esc(x.p.model)} 삭제">삭제</button></td></tr>`).join("")}
    </tbody><tfoot>
    <tr class="line"><td colspan="6">공급가액</td><td class="num">${won(sum)}</td><td></td></tr>
    <tr class="line"><td colspan="6">부가세 (10%)</td><td class="num">${won(Math.round(sum * 0.1))}</td><td></td></tr>
    <tr class="line total"><td colspan="6">합계 (부가세 포함)</td><td class="num">${won(sum + Math.round(sum * 0.1))}</td><td></td></tr>
    </tfoot></table></div>`
    : '<p class="empty">담은 상품이 없습니다. 찾는 형명을 요청 사항에 적어 재고 문의만 보내셔도 됩니다.</p>'}
   <p class="stocknote">재고는 예고 없이 변경됩니다. 주문 전 연락 주세요.</p>
   <form id="quote" novalidate>
     <label for="co">회사명</label><input id="co" required maxlength="100" autocomplete="organization">
     <label for="who">담당자 · 연락처</label><input id="who" required maxlength="100" autocomplete="tel">
     <label for="memo">요청 사항 (납기, 세금계산서, 찾는 형명 등)</label><textarea id="memo" rows="3" maxlength="2000"></textarea>
     <input id="hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">
     <p style="font-size:12px;color:var(--muted);margin:10px 0 0">적어 주신 회사명·연락처는 견적 회신에만 씁니다. <a href="privacy.html" target="_blank" rel="noopener" style="color:inherit">개인정보처리방침</a></p>
      <div class="buy"><button class="btn" type="submit" id="send">견적 요청 보내기</button>${lines.length ? '<button class="btn ghost" type="button" id="clear">비우기</button>' : ""}</div>
     <p class="muted" style="margin:0">결제는 견적 확인 후 진행합니다.</p>
   </form>${msg || ""}`;
  $("co").value = keep.co; $("who").value = keep.who; $("memo").value = keep.memo;
  $("close").onclick = () => { d.hidden = true; };
  const cl = $("clear"); if (cl) cl.onclick = () => { cart = []; save(); openCart(); };
  // 견적함 안에서 수량 바꾸기: − / + 또는 직접 입력 (1~9999, 0 이하로는 안 내려감 — 빼려면 [삭제])
  const setQty = (id, q) => { const c = cart.find(x => x.id === id); if (!c) return; c.q = Math.min(9999, Math.max(1, Math.trunc(q) || 1)); save(); openCart(); };
  d.querySelectorAll(".qm").forEach(b => b.onclick = () => { const c = cart.find(x => x.id === b.dataset.id); if (c) setQty(c.id, c.q + (+b.dataset.d)); });
  d.querySelectorAll(".qi").forEach(i => i.onchange = () => setQty(i.dataset.id, parseInt(i.value)));
  d.querySelectorAll(".rm").forEach(b => b.onclick = () => { cart = cart.filter(c => c.id !== b.dataset.id); save(); openCart(); });
  $("quote").onsubmit = e => { e.preventDefault(); sendQuote(); };
}

async function sendQuote() {
  const company = $("co").value.trim(), contact = $("who").value.trim(), memo = $("memo").value.trim();
  const lines = cartLines().slice(0, 50);
  const fail = t => openCart(`<div class="err-msg">${t}</div>`);
  if (!company || !contact) return fail("회사명과 담당자·연락처를 적어 주세요.");
  if (!lines.length && !memo) return fail("상품을 담거나, 요청 사항에 찾는 형명을 적어 주세요.");
  if ($("hp").value) return; // 자동 스팸
  const items = lines.map(x => ({ id: x.p.id, model: String(x.p.model).slice(0, 100), cond: x.p.condition === "new" ? "신품" : "중고", qty: x.q, unitPrice: x.u }));
  const total = items.reduce((a, b) => a + b.qty * b.unitPrice, 0);

  if (!IS_CONFIGURED) {
    return openCart(`<div class="ok-msg"><b>설정 전 — 실제로 보내지 않음.</b><br>Firebase 설정(config.js)을 마치면 이 요청이 관리자 화면과 사장님 휴대폰 알림으로 들어갑니다.<br><span class="muted">보낼 내용: ${esc(company)} · ${items.length}개 품목 · ${won(total)}</span></div>`);
  }
  $("send").disabled = true; $("send").textContent = "보내는 중…";
  try {
    const { fb } = await import("./fb.js");
    const { fs, db } = await fb();
    await fs.addDoc(fs.collection(db, "quotes"), {
      company: company.slice(0, 100), contact: contact.slice(0, 100), memo: memo.slice(0, 2000),
      items, total, createdAt: fs.serverTimestamp(), status: "new"
    });
  } catch (e) {
    console.error(e);
    return fail("보내지 못했습니다. 잠시 뒤 다시 시도하시거나 054-475-9600 으로 전화 주세요.");
  }
  // 휴대폰 알림 (실패해도 견적은 이미 저장됨). 한글은 본문 JSON 에만 — 헤더에 넣으면 fetch 가 깨짐.
  try {
    await fetch("https://ntfy.sh/", {
      method: "POST",
      body: JSON.stringify({ topic: NTFY_TOPIC, title: "겐시스템 부품 견적 요청", message: `${company} · ${items.length}개 품목 · ${won(total)} (부가세 별도)`, tags: ["package"] })
    });
  } catch (e) { console.warn("ntfy 실패", e); }
  cart = []; save();
  openCart(`<div class="ok-msg"><b>견적 요청을 보냈습니다.</b><br>확인 후 적어 주신 연락처로 회신드립니다. 급하시면 054-475-9600 으로 전화 주세요.</div>`);
}

// 사진은 목록이 뜬 뒤에 뒤따라 받는다: 지금 보고 있는 상품 먼저, 나머지는 4개씩.
// 사진이 도착하면 그 상품이 화면에 있을 때만 다시 그린다(목록은 0.3초 모아서 한 번).
async function fillPhotos() {
  let timer = 0;
  const showing = () => { const h = decodeURIComponent(location.hash.replace("#", "")); return h.startsWith("p-") ? h.slice(2) : ""; };
  const got = (p, photos) => {
    p.photos = photos;
    if (!photos.length) return;
    if (showing() === p.id) { if (!$("qty") || $("qty").value === "1") renderDetail(p); else if ($("bigThumb")) $("bigThumb").innerHTML = thumbHtml(p); }
    else if (!showing()) { clearTimeout(timer); timer = setTimeout(() => { if (!showing()) renderList(); }, 300); }
  };
  const first = byId(showing());
  if (first) got(first, await loadPhotos(first.id));
  const queue = P.filter(p => p !== first);
  await Promise.all(Array.from({ length: 4 }, async () => { for (let p; (p = queue.shift());) got(p, await loadPhotos(p.id)); }));
}

function route() {
  const h = decodeURIComponent(location.hash.replace("#", ""));
  const p = h.startsWith("p-") && byId(h.slice(2));
  if (p) { renderDetail(p); scrollTo(0, 0); } else renderList();
  // 사진이 아직 안 온 상품을 열면 그 상품 사진부터 받는다 (줄 서 있는 차례를 기다리지 않음)
  if (p && IS_CONFIGURED && p.photos === undefined) loadPhotos(p.id).then(ph => { if (p.photos !== undefined) return; p.photos = ph; if (ph.length && $("bigThumb") && decodeURIComponent(location.hash) === "#p-" + p.id) $("bigThumb").innerHTML = thumbHtml(p); });
}

$("searchForm").onsubmit = e => e.preventDefault();
$("q").oninput = e => { query = e.target.value; cat = "all"; renderCats(); if (location.hash) location.hash = ""; else renderList(); };
$("cartBtn").onclick = () => openCart();
addEventListener("hashchange", route);
save();

(async () => {
  try {
    const r = await loadProductsFast();
    P = r.products; isSample = r.sample;
    if (isSample) {
      $("notice").hidden = false;
      $("noticeText").innerHTML = "<b>설정 전 견본 데이터</b>입니다. 상품·가격·재고는 모두 예시이며 실제 판매가 아닙니다.";
    }
    cart = cart.filter(c => c && byId(c.id) && c.q > 0); save();
    if (KAKAO_CHAT_URL && $("kakaoTop")) { $("kakaoTop").href = KAKAO_CHAT_URL; $("kakaoTop").hidden = false; }   // 머리의 카톡 문의 (어느 화면에서나)
  { const inStock = P.filter(p => (+p.stock || 0) > 0).length; if ($("spec")) $("spec").innerHTML = `상품 <b>${P.length}종</b><br>재고 있음 <b>${inStock}종</b><br>견적 회신 <b>당일</b><br>가격 <b>부가세 별도</b>`; }   // 명판의 사양 칸
    // 래더의 코일 M1520 이 켜지면 견적함 표시등이 녹색 (래더 조건에 "견적함 담김 M100"이 들어 있음)
    initTheme(); initLadder($("rung"), on => $("cartBtn").classList.toggle("lit", on)); renderCats(); route();
    if (r.photosPending) fillPhotos();
  } catch (e) {
    console.error(e);
    $("view").innerHTML = '<p class="empty">상품 목록을 불러오지 못했습니다. 새로 고침하거나 054-475-9600 으로 전화 주세요.</p>';
  }
})();
