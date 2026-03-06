const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// 정적 파일 서빙 (robots.txt, sitemap.xml 등을 위해 루트 파일들 허용)
app.use(express.static(__dirname));

// robots.txt 및 sitemap.xml 명시적 허용
app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// 그 외 모든 경로는 index.html로 (Single Page Application 방식)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log('Server is running on port ' + port);
});
