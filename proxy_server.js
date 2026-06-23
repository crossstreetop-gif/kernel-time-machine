/* ============================================================
   Kernel Time Machine — 로컬 프록시 서버
   외부 의존성 없음 (Node 기본 모듈만 사용). npm install 불필요.

   실행:
     1) API 키 발급: https://console.anthropic.com  (크레딧 필요)
     2) 키를 환경변수로 넣고 실행
        macOS / Linux:
           ANTHROPIC_API_KEY=sk-ant-... node proxy_server.js
        Windows (PowerShell):
           $env:ANTHROPIC_API_KEY="sk-ant-..."; node proxy_server.js
     3) 브라우저에서 kernel_time_machine.html 열기 (그냥 더블클릭 OK)

   동작:
     - 정적 파일(HTML) 서빙:  http://localhost:8787/
     - 프록시 엔드포인트:      POST http://localhost:8787/api/analyze
       → 본문을 그대로 Anthropic /v1/messages 로 중계, 키는 서버에서만 첨부
   ============================================================ */

const http  = require("http");
const https = require("https");
const fs    = require("fs");
const path  = require("path");

const PORT    = process.env.PORT || 8787;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const HTML    = "kernel_time_machine.html";

if (!API_KEY) {
  console.error("\n[!] ANTHROPIC_API_KEY 환경변수가 없습니다.");
  console.error("    예) ANTHROPIC_API_KEY=sk-ant-... node proxy_server.js\n");
  process.exit(1);
}

/* Anthropic API로 본문을 그대로 중계 */
function forwardToAnthropic(bodyStr) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(bodyStr)
      }
    }, (r) => {
      let data = "";
      r.on("data", c => data += c);
      r.on("end", () => resolve({ status: r.statusCode, body: data }));
    });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".txt":"text/plain" };

const server = http.createServer(async (req, res) => {
  // CORS (브라우저가 어디서 열리든 허용)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  // --- 프록시 엔드포인트 ---
  if (req.method === "POST" && req.url === "/api/analyze") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", async () => {
      try {
        const { status, body: out } = await forwardToAnthropic(body);
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(out);
      } catch (e) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: "proxy error: " + e.message } }));
      }
    });
    return;
  }

  // --- 정적 파일 서빙 ---
  let file = req.url === "/" ? HTML : decodeURIComponent(req.url.split("?")[0]).replace(/^\//, "");
  const full = path.join(__dirname, file);
  if (!full.startsWith(__dirname)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(full)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Kernel Time Machine 프록시 실행 중`);
  console.log(`  → 브라우저에서 열기:  http://localhost:${PORT}/\n`);
});
