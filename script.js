document.addEventListener('DOMContentLoaded', function() {
    // 내부 페이지 이동(#) 전용 스크롤 스크립트
    const scrollLinks = document.querySelectorAll('.nav-links a, .hero a[href^="#"]');

    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // 링크가 #으로 시작하는 내부 섹션 아이디인 경우에만 스크롤 실행
            if (href && href.startsWith('#')) {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    window.scrollTo({
                        top: targetElement.offsetTop - 70, // 헤더 고정 높이 조절
                        behavior: 'smooth'
                    });
                }
            }
            // 외부 링크(스마트스토어 주소 등)는 이 스크립트가 건드리지 않음
        });
    });
});
