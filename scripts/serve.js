import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "dist");
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".xml": "application/xml",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const filePath = path.join(root, urlPath === "/" ? "index.html" : urlPath);
    const target = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()
      ? path.join(filePath, "index.html")
      : filePath;

    if (!target.startsWith(root) || !fs.existsSync(target)) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "content-type": types[path.extname(target)] || "application/octet-stream" });
    fs.createReadStream(target).pipe(res);
  })
  .listen(port, () => {
    console.log(`Thermal Cycle running at http://localhost:${port}`);
  });
