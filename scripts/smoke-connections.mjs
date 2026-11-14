import assert from 'node:assert/strict';
import {detectOllama} from '../dist/ai-client.js';
import {handlePatents} from '../server/patents.mjs';
const ollama=await detectOllama();assert.ok(ollama.models.length>0);console.log('Live Ollama discovery: '+ollama.models.length+' installed models detected.');
const response=await handlePatents(new Request('https://test.example/api/patents',{method:'POST',headers:{Origin:'https://test.example'},body:JSON.stringify({source:'nasa',query:'water'})}),{});
const body=await response.json();assert.equal(response.status,200,body.error);assert.ok(body.records.length>0);assert.ok(body.records.every(r=>r.source.includes('live API')&&r.retrievedAt&&!r.fullTextAvailable));console.log('Live source search: '+body.records.length+' NASA records returned; no records saved.');
