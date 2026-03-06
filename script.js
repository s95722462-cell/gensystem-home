document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for internal navigation links only
    const navLinks = document.querySelectorAll('.nav-links a, .hero a.btn');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // '#'으로 시작하는 내부 링크일 때만 부드러운 스크롤 실행
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(href);

                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 70, // Adjust for sticky header
                        behavior: 'smooth'
                    });
                }
            }
            // '#'이 아닌 외부 링크(스마트스토어 등)는 브라우저의 기본 이동 동작을 따름
        });
    });
});
