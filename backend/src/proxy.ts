import http from 'http';
import https from 'https';

export function startAgentRouterProxy() {
  const server = http.createServer((req, res) => {
    const options = {
      hostname: 'agentrouter.org',
      port: 443,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: 'agentrouter.org',
        Originator: 'codex_cli_rs',
        'User-Agent': 'codex_cli_rs/0.101.0 (Mac OS 26.0.1; arm64) Apple_Terminal',
        Version: '0.101.0'
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    req.pipe(proxyReq, { end: true });

    proxyReq.on('error', (err) => {
      console.error('[proxy] Error:', err.message);
      res.writeHead(500);
      res.end('Proxy Error');
    });
  });

  // Graceful error handling — don't crash if port is already in use
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn('⚠️  Proxy port 8318 already in use — skipping proxy startup (another instance may be running)');
    } else {
      console.error('[proxy] Server error:', err.message);
    }
  });

  server.listen(8318, () => {
    console.log("✅ Built-in AgentRouter Proxy running on http://localhost:8318");
  });
}
