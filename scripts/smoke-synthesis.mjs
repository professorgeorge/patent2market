import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runAI} from '../dist/ai-client.js';
import {validateSynthesis} from '../dist/patents.js';
const {records:candidates}=JSON.parse(await readFile(new URL('../dist/global-patents.json',import.meta.url),'utf8'));
const result=await runAI('synthesis',{problem:'Small farms need affordable ways to reduce harvested produce losses with variable sunlight.',customer:'Small farmer cooperatives',geography:'India',candidates,searchScope:'Two reference examples, not an exhaustive search'}, {provider:'ollama',ollamaURL:'http://localhost:11434',ollamaModel:process.env.OLLAMA_MODEL||'qwen3.5:4b'},AbortSignal.timeout(180000));
validateSynthesis(result.result,candidates);assert.ok(!result.result.components.some(c=>c.patentId==='JP3731093B2'),'Water treatment should not be selected for this produce-drying scenario');
console.log(JSON.stringify({provider:result.provider,model:result.model,selectedIDs:result.result.components.map(c=>c.patentId),solution:result.result.solution,firstExperiment:result.result.firstExperiment}));
