import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = process.cwd();
const contentTypes = new Map([
    [".html", "text/html; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".css", "text/css; charset=utf-8"],
    [".json", "application/json; charset=utf-8"]
]);

const server = http.createServer((request, response) => {
    const rawPath = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const relative = rawPath === "/" ? "index-v2.html" : rawPath.replace(/^\/+/, "");
    const resolved = path.resolve(root, relative);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
    }
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        response.writeHead(404).end("Not found");
        return;
    }
    response.writeHead(200, {
        "Content-Type": contentTypes.get(path.extname(resolved)) || "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
    });
    fs.createReadStream(resolved).pipe(response);
});

await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
});

try {
    const address = server.address();
    const baseURL = `http://127.0.0.1:${address.port}`;
    const response = await fetch(`${baseURL}/index-v2.html`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /^text\/html/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    const html = await response.text();

    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
    for (const breakpoint of [
        /@media \(min-width: 1101px\)/,
        /@media \(max-width: 900px\)/,
        /@media \(max-width: 600px\)/
    ]) assert.match(html, breakpoint);
    assert.match(html, /overflow-x:\s*auto/);
    assert.match(html, /min-height:\s*44px/);

    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    assert.ok(ids.length >= 340, "Expected the complete Admin and Teacher shell");
    assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");

    const localScripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
        .map(match => match[1])
        .filter(source => !/^https?:/i.test(source));
    assert.ok(localScripts.length >= 30, "Expected the modular runtime dependency list");
    let eagerBytes = Buffer.byteLength(html);
    for (const source of localScripts) {
        const asset = await fetch(`${baseURL}/${source}`);
        assert.equal(asset.status, 200, `Live Server asset must load: ${source}`);
        assert.match(asset.headers.get("content-type") || "", /javascript/);
        const body = await asset.arrayBuffer();
        assert.ok(body.byteLength > 0, `Live Server asset must not be empty: ${source}`);
        eagerBytes += body.byteLength;
    }
    assert.ok(eagerBytes < 2_500_000, `Eager raw HTML/JS payload exceeds 2.5 MB: ${eagerBytes}`);

    for (const source of [
        "modules/admin/adminDistributionView.js",
        "modules/admin/adminSystemView.js",
        "modules/media/documentImageOptimizer.js",
        "modules/media/documentPdfOptimizer.js"
    ]) {
        const asset = await fetch(`${baseURL}/${source}`);
        assert.equal(asset.status, 200, `Lazy runtime asset must load: ${source}`);
    }
} finally {
    await new Promise(resolve => server.close(resolve));
}

console.log("Sprint 6.3 Live HTTP assets, responsive contracts, payload budget, and unique-ID checks passed.");
