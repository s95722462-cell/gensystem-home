document.addEventListener('DOMContentLoaded', function() {
    // 모든 네비게이션 링크와 버튼에 대해 부드러운 스크롤 설정
    const navLinks = document.querySelectorAll('.nav-links a, .hero a.btn, .store-banner');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // 만약 링크가 '#'으로 시작한다면 (내부 이동)
            if (href && href.startsWith('#')) {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    window.scrollTo({
                        top: targetElement.offsetTop - 70, // 헤더 높이만큼 뺌
                        behavior: 'smooth'
                    });
                }
            } 
            // 그 외의 경우 (외부 링크, http로 시작하는 등)는 브라우저가 이동하게 둠 (e.preventDefault() 하지 않음)
        });
    });
});
