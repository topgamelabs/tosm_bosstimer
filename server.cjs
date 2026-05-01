const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST = "/app/dist";
const BASE = "/boss";  // strip prefix from requests, serve from root

const server = http.createServer((req, res) => {
  let urlPath = req.url.split("?")[0];
  
  // Strip /boss prefix so /boss/assets/x.js → /assets/x.js
  let filePath;
  if (urlPath.startsWith(BASE)) {
    const stripped = urlPath.slice(BASE.length) || "/";
    filePath = path.join(DIST, stripped);
  } else {
    filePath = path.join(DIST, urlPath);
  }
  
  // SPA fallback
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, "index.html");
  }
  
  const ext = path.extname(filePath);
  const mimeTypes = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".html": "text/html",
    ".json": "application/json",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf"
  };
  
  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000");
  
  fs.createReadStream(filePath).on("error", () => {
    res.writeHead(404);
    res.end("Not found: " + urlPath);
  }).pipe(res);
});

server.listen(5173, "0.0.0.0", () => {
  console.log("Static server on 0.0.0.0:5173 (base=" + BASE + ")");
});
