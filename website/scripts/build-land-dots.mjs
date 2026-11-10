// Builds src/data/land-dots.json: evenly spaced points on the globe that fall
// on land (Natural Earth 1:110m via world-atlas). Run once; the output is
// committed so the website never downloads map data at runtime.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve("world-atlas/land-110m.json"), "utf8"));
const land = feature(topo, topo.objects.land);

// Fibonacci sphere: N evenly distributed points.
const N = 16000;
const golden = Math.PI * (3 - Math.sqrt(5));
const dots = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = ((((i * golden * 180) / Math.PI) % 360) + 540) % 360 - 180;
  if (lat < -60) continue; // skip Antarctica: it adds dots but no meaning
  if (geoContains(land, [lon, lat])) dots.push([+lat.toFixed(2), +lon.toFixed(2)]);
}

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "land-dots.json");
writeFileSync(out, JSON.stringify(dots));
console.log(`wrote ${dots.length} land dots to src/data/land-dots.json`);
