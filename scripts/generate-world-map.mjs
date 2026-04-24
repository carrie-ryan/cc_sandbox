import { writeFileSync } from 'fs';
import { createWriteStream } from 'fs';

const W = 1000;
const H = 500;

function toX(lon) { return ((lon + 180) / 360) * W; }
function toY(lat) { return ((90 - lat) / 180) * H; }

function ringToPath(coords) {
  return coords.map(([lon, lat], i) => `${i === 0 ? 'M' : 'L'}${toX(lon).toFixed(2)},${toY(lat).toFixed(2)}`).join(' ') + ' Z';
}

function geometryToPaths(geometry) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ringToPath).join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap(poly => poly.map(ringToPath)).join(' ');
  }
  return '';
}

const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson';
const res = await fetch(url);
const geojson = await res.json();

const d = geojson.features.map(f => geometryToPaths(f.geometry)).join(' ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="world-map">
  <path d="${d}" fill="currentColor" stroke="none"/>
</svg>`;

writeFileSync('/Users/carrieryan/customer-connect/src/assets/world-map.svg', svg);
console.log('world-map.svg written');
