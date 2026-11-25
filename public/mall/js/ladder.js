// 머리의 래더 한 줄 — 그림만 움직이는 것이 아니라 작은 래더 해석기가 실제로 스캔해서 그 결과를 보여 준다.
// 방식은 우리 XYZ 래더 시뮬레이터(xyz-claw 의 gantry)와 같다: 명령 리스트를 위에서 아래로 한 줄씩 실행(누산기 acc), 한 바퀴 = 1 스캔.
// 표시는 미쓰비시 래더 모니터 방식 — 선은 그대로, 통하는 접점·켜진 코일의 안쪽만 채움.
//
// 프로그램 = 우리 학습 랙 CC32D 프로그램의 0 스텝 (CC-Link 리모트 I/O 1국 링크 정상 판정, 2026-11-24 실기 확인한 회로):
//   LDI XA0 / AND XAF / AND XA1 / ANI SW80.0 / AND M100 / OUT M1520
//   (AND M100 = 견적함에 담긴 것이 있음 — 부품몰용으로 사용자가 더한 조건. M1520 이 켜지면 견적함 버튼이 녹색)
//   XA0 마스터 모듈 이상, XAF 모듈 준비, XA1 자국 데이터 링크 중, SW80.0 1국 링크 상태(0 = 정상), M1520 링크 정상
// 가짜 입력(8초 주기): 전원 투입 → XAF 준비 → XA1 링크 시작 → (링크 정상) → 1국 이상 1초 → 복귀 → 전원 끔.
// 래더 그림을 누르면 1국 이상(SW80.0)을 1초 낸다.
const IL = `LDI XA0
AND XAF
AND XA1
ANI SW80.0
AND M100
OUT M1520`;
const NOTE = { XA0: "모듈 이상", XAF: "모듈 준비", XA1: "링크 중", "SW80.0": "1국 이상", M100: "견적함 담김", M1520: "링크 정상" };
const SCAN_MS = 100;           // 1 스캔 (실제 PLC 보다 훨씬 느리게 — 눈에 보이라고)

const prog = IL.split("\n").map(l => l.trim().split(/\s+/));
const dev = { XA0: 0, XAF: 0, XA1: 0, "SW80.0": 0, M100: 0, M1520: 0 };
// 화면 쪽에서 넣는 입력 (M100 = 견적함에 담긴 것이 있음)
export function setLadderInput(name, on) { if (name in dev) dev[name] = on ? 1 : 0; }
const bit = d => dev[d] || 0;

function scan() {
  let acc = 0;
  for (const [op, d] of prog) {
    if (op === "LD") acc = bit(d);
    else if (op === "LDI") acc = bit(d) ? 0 : 1;
    else if (op === "AND") acc &= bit(d);
    else if (op === "ANI") acc &= bit(d) ? 0 : 1;
    else if (op === "OR") acc |= bit(d);
    else if (op === "ORI") acc |= bit(d) ? 0 : 1;
    else if (op === "OUT") dev[d] = acc;
  }
}

// 그리기: 프로그램에서 접점·코일을 뽑아 실제 폭에 맞춰 좌표를 계산 (늘려 그리면 글자가 찌그러져서)
const contacts = prog.filter(([op]) => op !== "OUT").map(([op, d]) => ({ d, nc: op.endsWith("I") }));
const coil = prog.find(([op]) => op === "OUT")[1];
function draw(box) {
  const W = Math.max(280, Math.round(box.clientWidth)), y = 26, n = contacts.length, small = W < 520;
  const xc = Math.round(W * 0.9) - 4;
  // 접점 자리: 왼쪽 모선에서 떨어진 곳부터 코일 앞까지 고르게 (좁은 화면에서 첫 접점이 모선에 붙지 않게)
  const x0 = Math.max(Math.round(W * 0.1), 24 + 30), x1 = Math.max(x0 + 40 * (n - 1), xc - Math.max(60, Math.round(W * 0.18)));
  const xs = contacts.map((_, i) => Math.round(x0 + (x1 - x0) * i / (n - 1)));
  const L = 24;   // 왼쪽 모선 자리 (그 왼쪽에 스텝 번호)
  let d = `M${L} 4v52M${W - 2} 4v52M${L} ${y}H${xs[0] - 7}`, fills = "", texts = "";
  contacts.forEach((c, i) => {
    const x = xs[i];
    d += `M${x - 7} ${y - 9}v18M${x + 7} ${y - 9}v18` + (c.nc ? `M${x - 7} ${y + 9}l14-18` : "") + `M${x + 7} ${y}H${(i < n - 1 ? xs[i + 1] - 7 : xc - 22)}`;
    fills += `<rect class="on" data-d="${c.nc ? "!" : ""}${c.d}" x="${x - 6}" y="${y - 8}" width="12" height="16"/>`;
    texts += `<text x="${x}" y="11" text-anchor="middle">${c.d}</text>` + (small ? "" : `<text class="nt" x="${x}" y="${y + 24}" text-anchor="middle">${NOTE[c.d] || ""}</text>`);
  });
  d += `M${xc + 22} ${y}H${W - 2}`;
  // 코일은 안쪽을 채우지 않고 괄호 자체의 색이 바뀜 (켜지면 파랑·굵게)
  const coilPath = `<path class="on coil" data-d="${coil}" d="M${xc - 18} ${y - 11}a13 13 0 0 0 0 22M${xc + 18} ${y - 11}a13 13 0 0 1 0 22"/>`;   // 코일 괄호: 접점 폭의 두 배 넘게 벌림
  
  texts += `<text x="${xc}" y="11" text-anchor="middle">${coil}</text><text class="nt" x="${xc}" y="${y + 24}" text-anchor="middle">${NOTE[coil] || ""}</text>`;
  box.innerHTML = `<svg viewBox="0 0 ${W} 60" width="${W}" height="60" fill="none" stroke-width="2"><text class="st" x="${L - 7}" y="${y + 4}" text-anchor="end">0</text>${fills}<path d="${d}"/>${coilPath}${texts}</svg>`;
}
function show(box) {
  box.querySelectorAll(".on").forEach(e => { const d = e.dataset.d, v = d[0] === "!" ? !bit(d.slice(1)) : !!bit(d); e.classList.toggle("live", v); });
}

export function initLadder(box, onCoil) {   // onCoil(켜짐 여부): 코일 M1520 이 바뀔 때마다 불림 (견적함 표시등을 여기에 물림)
  if (!box) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  draw(box);
  let lastCoil = -1;
  let n = 0, fault = 0;                        // fault = 1국 이상을 낼 남은 스캔 수
  box.onclick = () => { fault = 10; };         // 그림을 누르면 1국 이상 1초
  box.title = "CC-Link 1국 링크 정상 회로 — 눌러 보세요 (1국 이상이 1초 납니다)";
  let lastW = box.clientWidth;
  addEventListener("resize", () => { if (box.clientWidth !== lastW) { lastW = box.clientWidth; draw(box); show(box); } });
  const tick = () => {
    const t = still ? 30 : n++ % 80;           // 8초 주기 (움직임 줄이기 = 링크 정상에서 멈춤)
    if (!still && t === 55) fault = 10;
    dev.XAF = t >= 6 && t < 74 ? 1 : 0;        // 0.6초 뒤 모듈 준비, 7.4초에 전원 끔
    dev.XA1 = t >= 12 && t < 74 ? 1 : 0;       // 1.2초 뒤 데이터 링크 시작
    dev["SW80.0"] = fault > 0 ? 1 : 0; if (fault > 0) fault--;
    scan(); show(box);
    if (onCoil && dev[coil] !== lastCoil) { lastCoil = dev[coil]; onCoil(!!lastCoil); }
  };

  tick();
  setInterval(() => { if (!document.hidden) tick(); }, SCAN_MS);
}
