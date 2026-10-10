// Generator token desain -- SATU-SATUNYA tempat packages/design_tokens/
// tokens.json diterjemahkan ke kode. JANGAN edit casa_tokens.dart manual,
// edit tokens.json lalu jalankan ulang script ini (`npm run generate:tokens`).
//
// SENGAJA GAGAL KERAS (exit != 0) kalau ada kategori top-level di
// tokens.json yang gak menghasilkan output sama sekali -- lihat Review
// Focus di plan M0/M1 lama: "generator diam-diam ngedrop 1 kategori token".
"use strict";

const fs = require("fs");
const path = require("path");

const TOKENS_PATH = path.join(__dirname, "..", "packages", "design_tokens", "tokens.json");
const DART_OUT = path.join(__dirname, "..", "apps", "mobile", "lib", "core", "theme", "casa_tokens.dart");

const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));

function toCamel(path) {
    return path
        .map((seg, i) => (i === 0 ? seg : seg.charAt(0).toUpperCase() + seg.slice(1)))
        .join("")
        .replace(/[^a-zA-Z0-9]/g, (m) => "");
}

function parsePx(value) {
    const n = parseFloat(String(value).replace("px", ""));
    if (!Number.isFinite(n)) throw new Error(`Nilai dimensi gak valid: ${value}`);
    return n;
}

function hexToDartColor(hex) {
    const clean = hex.replace("#", "").toUpperCase();
    if (!/^[0-9A-F]{6}$/.test(clean)) throw new Error(`Warna hex gak valid: ${hex}`);
    return `Color(0xFF${clean})`;
}

// "0 6px 24px rgba(11, 53, 104, 0.08)" -> BoxShadow(...)
function parseShadow(value) {
    const m = value.match(/^(-?\d+(?:\.\d+)?)px?\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/)
        ?? value.match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
    if (!m) throw new Error(`Format shadow gak dikenali, update parseShadow() di script ini: ${value}`);
    const [, offsetX, offsetY, blur, r, g, b, a] = m;
    const alphaHex = Math.round(parseFloat(a) * 255).toString(16).padStart(2, "0").toUpperCase();
    const colorHex = [r, g, b].map((v) => parseInt(v, 10).toString(16).padStart(2, "0").toUpperCase()).join("");
    return `BoxShadow(color: Color(0x${alphaHex}${colorHex}), offset: Offset(${parseFloat(offsetX)}, ${parseFloat(offsetY)}), blurRadius: ${parseFloat(blur)})`;
}

function parseDuration(value) {
    const n = parseInt(String(value).replace("ms", ""), 10);
    if (!Number.isFinite(n)) throw new Error(`Durasi gak valid: ${value}`);
    return `Duration(milliseconds: ${n})`;
}

const seenTopLevel = new Set();
const lines = [];

function walk(node, pathSegs) {
    if (node && typeof node === "object" && "$value" in node) {
        seenTopLevel.add(pathSegs[0]);
        const name = toCamel(pathSegs);
        const type = node.$type;
        const value = node.$value;
        if (type === "color") lines.push(`  static const Color ${name} = ${hexToDartColor(value)};`);
        else if (type === "dimension") lines.push(`  static const double ${name} = ${parsePx(value)};`);
        else if (type === "number") lines.push(`  static const int ${name} = ${value};`);
        else if (type === "fontFamily") lines.push(`  static const String ${name} = '${String(value).replace(/'/g, "\\'")}';`);
        else if (type === "shadow") lines.push(`  static const BoxShadow ${name} = ${parseShadow(value)};`);
        else if (type === "duration") lines.push(`  static const Duration ${name} = ${parseDuration(value)};`);
        else throw new Error(`Tipe token belum didukung generator ($type=${type}) buat ${pathSegs.join(".")} -- tambahkan case baru di generate-design-tokens.js, JANGAN skip diam-diam.`);
        return;
    }
    if (node && typeof node === "object") {
        for (const key of Object.keys(node)) {
            if (key.startsWith("$")) continue;
            walk(node[key], [...pathSegs, key]);
        }
    }
}

for (const topKey of Object.keys(tokens)) {
    if (topKey === "$schema" || topKey === "meta") continue;
    walk(tokens[topKey], [topKey]);
}

const expectedTopLevel = Object.keys(tokens).filter((k) => k !== "$schema" && k !== "meta");
const missing = expectedTopLevel.filter((k) => !seenTopLevel.has(k));
if (missing.length > 0) {
    console.error(`GAGAL -- kategori token ini TIDAK menghasilkan output apa pun: ${missing.join(", ")}`);
    process.exit(1);
}

const dart = `// GENERATED -- JANGAN diedit manual. Sumber: packages/design_tokens/tokens.json
// Regenerate: npm run generate:tokens
import 'package:flutter/material.dart';

class CasaTokens {
  CasaTokens._();

${lines.join("\n")}
}
`;

fs.mkdirSync(path.dirname(DART_OUT), { recursive: true });
fs.writeFileSync(DART_OUT, dart);
console.log(`Ditulis ${DART_OUT} (${lines.length} token, ${expectedTopLevel.length} kategori: ${expectedTopLevel.join(", ")})`);
