// ===== FitOn 서버 (server.js) =====
// 네이버 쇼핑 API를 프록시로 연결해주는 Express 서버

const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');

try { require('dotenv').config(); } catch (e) {}

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_SORTS = new Set(['sim', 'date', 'asc', 'dsc']);

const CLIENT_ID     = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const HEADER_VALUE_RE = /^[\x20-\x7E]+$/;
const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/300x300?text=No+Image';
const IMAGE_PROXY_TIMEOUT = 10000;

function isValidImageUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch (e) {
    return false;
  }
}

function getHttpClient(url) {
  return url.protocol === 'https:' ? https : http;
}

function parseIntegerParam(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function hasValidNaverCredentials() {
  return Boolean(
    CLIENT_ID &&
    CLIENT_SECRET &&
    HEADER_VALUE_RE.test(CLIENT_ID) &&
    HEADER_VALUE_RE.test(CLIENT_SECRET)
  );
}

// ── 정적 파일 서빙 (HTML/CSS/JS) ──
app.use(express.static(path.join(__dirname, 'public')));

// ── 네이버 쇼핑 API 프록시 ──
app.get('/api/search', (req, res) => {
  const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
  const sort = ALLOWED_SORTS.has(req.query.sort) ? req.query.sort : 'sim';
  const display = parseIntegerParam(req.query.display, 12, 1, 100);
  const start = parseIntegerParam(req.query.start, 1, 1, 1000);

  // API 키 미설정 시 안내
  if (!hasValidNaverCredentials()) {
    return res.status(500).json({
      message: '네이버 API 키가 설정되지 않았어요. README를 확인해주세요.',
      hint: '.env 파일에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 추가해주세요.'
    });
  }

  if (!query.trim()) {
    return res.status(400).json({ message: '검색어를 입력해주세요.' });
  }

  const encodedQuery = encodeURIComponent(query);
  const apiPath = `/v1/search/shop.json?query=${encodedQuery}&sort=${sort}&display=${display}&start=${start}`;

  const options = {
    hostname: 'openapi.naver.com',
    path: apiPath,
    method: 'GET',
    headers: {
      'X-Naver-Client-Id': CLIENT_ID,
      'X-Naver-Client-Secret': CLIENT_SECRET,
    }
  };

  let apiReq;
  try {
    apiReq = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (apiRes.statusCode !== 200) {
          return res.status(apiRes.statusCode).json({
            message: parsed.errorMessage || 'API 오류가 발생했어요.',
            code: parsed.errorCode
          });
        }
        res.json({
          total: parsed.total,
          items: parsed.items
        });
      } catch(e) {
        res.status(500).json({ message: 'API 응답 파싱 실패' });
      }
    });
  });
  } catch (e) {
    return res.status(500).json({ message: 'Naver API request failed: ' + e.message });
  }

  apiReq.on('error', (e) => {
    res.status(500).json({ message: '네이버 API 연결 실패: ' + e.message });
  });

  apiReq.setTimeout(5000, () => {
    apiReq.destroy(new Error('요청 시간이 초과되었어요.'));
  });

  apiReq.end();
});

// ── 네이버 상품 이미지 프록시 ──
app.get('/api/image-proxy', (req, res) => {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  console.log('[image-proxy] request', { ip: req.ip || req.connection.remoteAddress, url: rawUrl });

  if (!isValidImageUrl(rawUrl)) {
    console.warn('[image-proxy] invalid url, redirect to fallback', { url: rawUrl });
    return res.redirect(FALLBACK_IMAGE_URL);
  }

  let imageUrl;
  try {
    imageUrl = new URL(rawUrl);
  } catch (e) {
    return res.redirect(FALLBACK_IMAGE_URL);
  }
  // Follow up to a few redirects manually to avoid TLS/handshake disconnects
  const MAX_REDIRECTS = 3;

  function doProxy(targetUrl, redirectCount) {
    if (redirectCount > MAX_REDIRECTS) {
      console.warn('[image-proxy] too many redirects', { url: targetUrl });
      return res.redirect(FALLBACK_IMAGE_URL);
    }

    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (e) {
      console.warn('[image-proxy] invalid redirect url', { url: targetUrl });
      return res.redirect(FALLBACK_IMAGE_URL);
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const options = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method: 'GET',
      headers: {
        'User-Agent': 'FitOn Image Proxy',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      timeout: IMAGE_PROXY_TIMEOUT,
    };

    const proxyReq = client.request(options, (proxyRes) => {
      console.log('[image-proxy] response', { url: parsed.href, status: proxyRes.statusCode, type: proxyRes.headers['content-type'] });

      // Handle redirects
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        const loc = proxyRes.headers.location;
        proxyRes.resume();
        let next = new URL(loc, parsed).toString();
        if (next.startsWith('https:')) {
          next = next.replace(/^https:/, 'http:');
        }
        return doProxy(next, redirectCount + 1);
      }

      if (proxyRes.statusCode !== 200) {
        console.warn('[image-proxy] non-200 response, redirect to fallback', { url: parsed.href, status: proxyRes.statusCode });
        proxyRes.resume();
        return res.redirect(FALLBACK_IMAGE_URL);
      }

      res.setHeader('content-type', proxyRes.headers['content-type'] || 'application/octet-stream');
      if (proxyRes.headers['content-length']) {
        res.setHeader('content-length', proxyRes.headers['content-length']);
      }
      res.setHeader('cache-control', 'public, max-age=86400');

      proxyRes.pipe(res).on('finish', () => {
        console.log('[image-proxy] proxied finished', { url: parsed.href });
      });
    });

    proxyReq.on('socket', (socket) => {
      socket.setTimeout(IMAGE_PROXY_TIMEOUT);
      socket.on('timeout', () => {
        proxyReq.destroy(new Error('socket timeout'));
      });
    });

    proxyReq.on('error', (err) => {
      console.error('[image-proxy] request error', { url: parsed.href, message: err && err.message });
      // If TLS handshake failed, attempt a non-TLS fallback once
      const msg = err && err.message ? String(err.message).toLowerCase() : '';
      if (parsed.protocol === 'https:' && (msg.includes('tls') || msg.includes('secure') || msg.includes('socket disconnected') || msg.includes('handshake'))) {
        try {
          const httpFallback = parsed.href.replace(/^https:/, 'http:');
          console.warn('[image-proxy] tls error, retrying with http fallback', { from: parsed.href, to: httpFallback });
          return doProxy(httpFallback, redirectCount + 1);
        } catch (e) {}
      }

      try { res.redirect(FALLBACK_IMAGE_URL); } catch (e) {}
    });

    proxyReq.end();
  }

  const nonTlsUrl = imageUrl.protocol === 'https:'
    ? imageUrl.href.replace(/^https:/, 'http:')
    : imageUrl.href;

  doProxy(nonTlsUrl, 0);
});

// ── 모든 라우트는 index.html (SPA) ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── 서버 시작 ──
app.listen(PORT, () => {
  console.log('');
  console.log('  🎽 FitOn 서버 실행 중!');
  console.log(`  👉 http://localhost:${PORT} 에서 확인하세요`);
  console.log('');
  if (!CLIENT_ID) {
    console.log('  ⚠️  경고: 네이버 API 키가 없어요.');
    console.log('  📋 .env 파일에 키를 추가해야 실제 상품이 보여요.');
    console.log('     NAVER_CLIENT_ID=여기에_클라이언트ID');
    console.log('     NAVER_CLIENT_SECRET=여기에_시크릿키');
    console.log('');
  }
});
