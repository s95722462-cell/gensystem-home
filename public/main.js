/* GEN SYSTEM homepage — vanilla JS (i18n KO/EN, mobile menu, scroll reveal, smart-store block) */
(function () {
    'use strict';

    // Korean text lives in the HTML. English strings below; Korean is captured from the DOM on load.
    var EN = {
        'skip': 'Skip to content',
        'nav-business': 'Business', 'nav-cases': 'Showcase', 'nav-battery': 'Manufacturing', 'nav-parts': 'Parts & Store', 'nav-contact': 'Contact',
        'nav-cta': 'Contact us',
        'hero-eyebrow': 'Automation parts · Control engineering · Equipment software',
        'hero-title': 'From parts sourcing<br>to control programs.<br><span class="hl">One automation partner.</span>',
        'hero-sub': 'We supply Mitsubishi PLCs, servos, inverters and HMIs with overseas sourcing, and we develop PLC ladder logic, GOT screens, servo tuning and equipment software. Built on hands-on maintenance experience, we prepare what your line needs — quickly and accurately.',
        'cta-consult': 'Request a consultation', 'cta-store': 'Smart Store',
        'fact1': 'PLC ladder development (GX Works2)', 'fact2': 'GOT screens in 3 switchable languages',
        'fact3': 'Drawings generated from BOM', 'fact4-k': '≈ 0.4 s', 'fact4': 'Vision detection → servo stop (test rig)',
        'biz-eyebrow': 'What we do',
        'biz-title': 'Three jobs, one team, no hand-offs',
        'biz-lead': 'When the person choosing the parts also writes the program, compatibility, wiring and setup issues are caught early.',
        'p1-title': 'Automation parts trade & sourcing', 'p1-lead': 'The right part, when you need it.',
        'p1-list': '<li>Mitsubishi PLC, servo, inverter, GOT (HMI) and sensors</li><li>Overseas sourcing and import agency; export of Korean parts</li><li>Replacement proposals for discontinued parts, with compatibility checks</li><li>Always-on sales through our Naver Smart Store</li>',
        'p2-title': 'Control engineering', 'p2-lead': 'PLC, screens, servo and communication.',
        'p2-list': '<li>PLC ladder programs (GX Works2, MELSEC Q series)</li><li>GOT HMI screens — multi-language, alarm and status pages</li><li>Servo MR-J4 / MR-J3 setup and tuning</li><li>Ethernet (MC protocol) data links</li><li>Serial communication — temperature controllers and more</li><li>On-site commissioning and debugging</li>',
        'p3-title': 'Equipment software', 'p3-lead': 'In-house tools built for the shop floor.',
        'p3-list': '<li>Automatic wiring drawings and wire lists</li><li>Phone equipment monitor and remote control</li><li>Camera vision guard (auxiliary function)</li><li>Servo tuning assistant</li><li>Branch-office ERP (desktop app)</li>',
        'about-title': 'Trade that knows the field, engineering that knows trade',
        'about-p': 'GEN SYSTEM grew out of hands-on automation maintenance and global sourcing / import-export experience at a trading company. We don\'t just sell parts — we propose the right part for the machine and the program that runs it.',
        'cases-eyebrow': 'Showcase',
        'cases-title': 'Built in-house, verified on our test rig',
        'cases-lead': 'Each case reads problem → what we built → result. All screens and drawings come from our own test rig and a virtual machine.',
        'lbl-problem': 'Problem', 'lbl-built': 'Built', 'lbl-result': 'Result',
        'alt-wiring': 'Servo amplifier wiring drawing of a virtual machine, showing main power, CN3 input table, motor and encoder cables, all generated automatically',
        'c1-title': 'Automatic wiring drawings',
        'c1-p': 'Every supplier sends a different BOM format, so drawings and wire lists had to be redrawn by hand each time.',
        'c1-b': 'Any supplier BOM is normalised into a standard BOM, then rules generate main-circuit, system-configuration, servo and I/O (32-point table) drawings, a wire list and a marking CSV, exported as DXF and PDF.',
        'c1-r': 'Being rule-based, it works the same way when the machine changes. Tested with data from different machines; a full 26-sheet drawing set for one virtual machine is produced in one run.',
        'alt-phone': 'Remote-control screen of the phone equipment monitor, showing commands rejected because the remote-permit switch was off or the command arrived late',
        'alt-phone-video': 'Screen recording of the phone equipment monitor: live camera view and servo position updating while it is operated with the stop and run buttons',
        'c2-title': 'Phone equipment monitor · remote control',
        'c2-p': 'Checking equipment status meant walking to the line, and remote buttons raised safety concerns.',
        'c2-b': 'Live PLC data on the phone (Firebase). Remote buttons are wrapped in several safety layers.',
        'c2-list': '<li><strong>On-site permit</strong> Works only while the “remote permit” switch on the HMI is on</li><li><strong>3 s watchdog</strong> PLC ladder monitors a heartbeat and blocks remote commands if it stops</li><li><strong>Stale rejection</strong> Late or unknown commands are not executed</li><li><strong>Account lock</strong> Only one approved Google account can sign in</li>',
        'c2-r': 'If any condition fails, the PLC does not execute and the reason for rejection is shown on screen.',
        'alt-vision': 'Diagram: a camera watches a zone; when an intrusion is detected the PLC stops the servo',
        'c3-title': 'Camera vision guard',
        'c3-p': 'We wanted an auxiliary way to stop the servo quickly when a hand or object enters the work zone.',
        'c3-b': 'A USB camera detects intrusion into a watched zone and stops the servo through the PLC.',
        'c3-r': 'Measured on our test rig: about 0.4 s from detection to stop (at a feed of 9000 mm/min).',
        'c3-note': '<strong>This is an auxiliary function, not a safety device (not safety-certified).</strong> It does not replace certified safety equipment such as light curtains or safety relays.',
        'c4-title': 'Servo tuning assistant',
        'c4-b': 'Drives MR Configurator2 automatically: one-touch tuning, parameter backup for rollback, and an A4 report in one go. Runs on offline field laptops.',
        'alt-got': 'GOT servo reciprocating-operation screen with Korean, English and Vietnamese language buttons',
        'c5-title': 'Multi-language GOT screens',
        'c5-b': 'Korean, English and Tiếng Việt switch with one button. Run, JOG, step run and alarm pages share one structure.',
        'c6-title': 'Temperature controller comms',
        'c6-b': 'An E5CC temperature controller connected through a PLC serial communication module: read/write present and set values, with sensor and comms faults shown on screen.',
        'c7-title': 'Branch-office ERP',
        'c7-b': 'A desktop ERP program for managing branch-office work, kept light to suit office PCs.',
        'bat-eyebrow': 'Battery & manufacturing lines',
        'bat-title': 'Data, documents and parts — ready at the pace your lines grow',
        'bat-lead': 'Battery and other high-mix manufacturing sites repeat the same work — checking equipment data, organising drawings, sourcing parts. We handle it at the speed of a small team.',
        'b1-title': 'Equipment data & remote monitoring',
        'b1-p': 'Collect PLC data over Ethernet (MC protocol) and check status, alarms and trends on PC and phone.',
        'b2-title': 'Documentation & drawing standards',
        'b2-p': 'Normalise different supplier BOMs into one format, and produce drawings, wire lists, marking data and multi-language HMIs under the same rules.',
        'b3-title': 'Fast sourcing & obsolescence',
        'b3-p': 'Find Mitsubishi-family parts quickly at home and abroad; for discontinued items we check replacement models down to wiring and parameter compatibility.',
        'b4-title': 'Security principles',
        'b4-list': '<li>Equipment data stays on-site by default</li><li>Customer documents are never uploaded to outside services</li><li>Any external connection is agreed in scope and method first</li><li>Approved accounts only; remote control only with on-site permission</li>',
        'proc-title': 'How we work',
        's1': 'Requirements', 's1-d': 'Equipment, process, problem',
        's2': 'Design & quote', 's2-d': 'Configuration, parts, schedule',
        's3': 'Build & simulate', 's3-d': 'Verified on simulators first',
        's4': 'Commissioning', 's4-d': 'Connect and adjust on site',
        's5': 'Docs & training', 's5-d': 'Drawings, manuals, operator training',
        'parts-eyebrow': 'Brands & parts', 'parts-title': 'Automation parts we supply',
        'brand1': 'Mitsubishi PLC', 'brand2': 'Servo Motor · Amplifier', 'brand3': 'Inverter', 'brand4': 'Sensor', 'brand5': 'Pneumatics', 'brand6': 'GOT · HMI', 'brand7': 'Industrial PC', 'brand8': 'Cable · Connector',
        'best-title': 'Smart Store best sellers', 'store-more': 'See all products →', 'loading-products': 'Loading products...',
        'shop-banner': 'Visit the GEN SYSTEM Naver Smart Store →',
        'contact-eyebrow': 'Contact',
        'contact-title': 'From a single part to a line project — just ask',
        'contact-p': 'Send us the model and quantity, or describe your equipment, and we will get back to you.',
        'btn-kakao': 'KakaoTalk chat',
        'label-email': 'Email', 'label-phone': 'Phone', 'label-address': 'Address', 'label-store': 'Store',
        'val-address': 'Rm 217, Bldg 8, Tool Plaza, 302-7 3gongdan 1-ro, Gumi-si, Gyeongbuk, Korea',
        'footer-addr': 'Rm 217, Bldg 8, Tool Plaza, 302-7 3gongdan 1-ro, Gumi-si, Gyeongbuk, Korea · +82-54-475-9600 · gen0910@hotmail.com',
        'btn-contact': 'Inquiry', 'btn-shop': 'Naver Shop', 'btn-kakao-s': 'KakaoTalk'
    };
    var META = {
        ko: { title: document.title, desc: (document.querySelector('meta[name="description"]') || {}).content },
        en: {
            title: 'GEN SYSTEM | Automation parts & control engineering',
            desc: 'GEN SYSTEM supplies factory automation parts (Mitsubishi PLC, servo, inverter, HMI), handles import/export, and develops PLC, HMI, servo and equipment software.'
        }
    };

    var KO = {};          // captured Korean strings
    var KO_ALT = {}, KO_ARIA = {};
    var current = 'ko';

    function store(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* storage blocked */ } }
    function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

    function captureKorean(root) {
        (root || document).querySelectorAll('[data-i18n]').forEach(function (el) {
            var k = el.getAttribute('data-i18n');
            if (!(k in KO)) KO[k] = el.innerHTML;
        });
        (root || document).querySelectorAll('[data-i18n-alt]').forEach(function (el) {
            var k = el.getAttribute('data-i18n-alt');
            if (!(k in KO_ALT)) KO_ALT[k] = el.getAttribute('alt');
        });
        (root || document).querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            var k = el.getAttribute('data-i18n-aria');
            if (!(k in KO_ARIA)) KO_ARIA[k] = el.getAttribute('aria-label');
        });
    }

    function setLanguage(lang) {
        if (lang !== 'en') lang = 'ko';
        current = lang;
        var dict = lang === 'en' ? EN : KO;
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var k = el.getAttribute('data-i18n');
            if (dict[k] != null) el.innerHTML = dict[k];
        });
        document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
            var k = el.getAttribute('data-i18n-alt');
            var v = lang === 'en' ? EN[k] : KO_ALT[k];
            if (v) el.setAttribute('alt', v);
        });
        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            var k = el.getAttribute('data-i18n-aria');
            var v = lang === 'en' ? EN[k] : KO_ARIA[k];
            if (v) el.setAttribute('aria-label', v);
        });
        document.documentElement.lang = lang;
        document.title = META[lang].title;
        var d = document.querySelector('meta[name="description"]');
        if (d && META[lang].desc) d.setAttribute('content', META[lang].desc);

        var btn = document.getElementById('lang-btn');
        if (btn) {
            btn.textContent = lang === 'en' ? 'KO' : 'EN';
            btn.setAttribute('aria-label', lang === 'en' ? '한국어로 보기' : 'Switch to English');
            btn.setAttribute('lang', lang === 'en' ? 'ko' : 'en');
        }
        var mt = document.getElementById('menu-toggle');
        if (mt) mt.setAttribute('aria-label', lang === 'en' ? 'Open menu' : '메뉴 열기');
        store('preferred-lang', lang);
    }

    // Smart-store best products block (same approach as before: static capture linking to the store)
    function loadBestProducts() {
        var list = document.getElementById('product-list');
        if (!list) return;
        list.innerHTML =
            '<a href="https://smartstore.naver.com/gensystem" target="_blank" rel="noopener">' +
                '<picture>' +
                    '<source srcset="img/smartstore-products.webp" type="image/webp">' +
                    '<img src="스마트스토어판매상품.png" width="1693" height="640" loading="lazy" decoding="async" ' +
                         'alt="GEN SYSTEM 네이버 스마트스토어 베스트 상품: 변환기, 인버터, 커넥터, 서보모터, GOT 옵션" class="responsive-product-img">' +
                '</picture>' +
                '<span class="shop-banner-link" data-i18n="shop-banner">GEN SYSTEM 네이버 스마트스토어 방문하기 →</span>' +
            '</a>';
        captureKorean(list);
        if (current === 'en') setLanguage('en');
    }

    function initMenu() {
        var toggle = document.getElementById('menu-toggle');
        var links = document.getElementById('nav-links');
        if (!toggle || !links) return;
        function close() { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
        toggle.addEventListener('click', function () {
            var open = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        links.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }

    function initReveal() {
        var els = document.querySelectorAll('.reveal');
        if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        els.forEach(function (el) { io.observe(el); });
    }

    document.addEventListener('DOMContentLoaded', function () {
        captureKorean();
        var q = new URLSearchParams(location.search).get('lang');
        var initial = q || load('preferred-lang') || 'ko';
        setLanguage(initial);
        loadBestProducts();
        initMenu();
        initReveal();
        var btn = document.getElementById('lang-btn');
        if (btn) btn.addEventListener('click', function () { setLanguage(current === 'en' ? 'ko' : 'en'); });
    });
})();

/* 휴대폰 화면 녹화: 화면 가까이 오면 그때 내려받고, 보일 때만 재생 (움직임 줄이기 설정이면 자동 재생 안 함) */
(function () {
    var vids = document.querySelectorAll('video[data-src]');
    if (!vids.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function load(v) { if (!v.src) { v.src = v.getAttribute('data-src'); if (reduce) v.controls = true; } }
    if (!('IntersectionObserver' in window)) { vids.forEach(function (v) { load(v); v.controls = true; }); return; }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            var v = e.target;
            if (e.isIntersecting) { load(v); if (!reduce) { var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; }); } }
            else if (!v.paused) { v.pause(); }
        });
    }, { rootMargin: '200px 0px', threshold: 0.25 });
    vids.forEach(function (v) { io.observe(v); });
})();
