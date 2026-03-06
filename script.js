document.addEventListener('DOMContentLoaded', function() {
    // 모든 네비게이션 링크와 버튼 선택
    const navLinks = document.querySelectorAll('.nav-links a, .hero a.btn, .store-banner');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // 1. 링크가 없거나 '#' 하나만 있는 경우 무시
            if (!href || href === '#') return;

            // 2. '#'으로 시작하는 내부 링크인 경우에만 부드러운 스크롤 실행
            if (href.startsWith('#')) {
                try {
                    const targetElement = document.querySelector(href);
                    if (targetElement) {
                        e.preventDefault();
                        window.scrollTo({
                            top: targetElement.offsetTop - 70,
                            behavior: 'smooth'
                        });
                    }
                } catch (err) {
                    // 잘못된 셀렉터 에러 방지
                    console.error('스크롤 이동 중 오류 발생:', err);
                }
            }
            // 3. 그 외 외부 링크(http 등)는 브라우저가 정상적으로 이동하게 둠 (e.preventDefault 안 함)
        });
    });
});
