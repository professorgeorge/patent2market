import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
for(const path of ['/','/venture.js','/venture.css','/patents.js','/sw.js','/icon-192.png']){const response=await worker.fetch(new Request('https://test.example'+path),{});assert.equal(response.status,200,path);assert.ok((await response.arrayBuffer()).byteLength>0);}
const config=await worker.fetch(new Request('https://test.example/api/config'),{});assert.equal(config.status,200);assert.ok((await config.json()).providers.every(p=>!p.enabled));
const missing=await worker.fetch(new Request('https://test.example/unknown'),{});assert.equal(missing.status,404);
console.log('Worker smoke checks passed: static assets, provider configuration, and missing routes.');

const patentsConfig=await worker.fetch(new Request('https://test.example/api/patents'),{});assert.equal((await patentsConfig.json()).enabled,false);

for(const path of ['/catalog.json','/global-patents.json','/app.js'])assert.equal((await worker.fetch(new Request('https://test.example'+path),{})).status,404);
