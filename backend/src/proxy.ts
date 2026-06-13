import http from 'http';
import https from 'https';

export function startAgentRouterProxy() {
  http.createServer((req, res) => {
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
  }).listen(8318, () => {
    console.log("✅ Built-in AgentRouter Proxy running on http://localhost:8318");
  });
}
