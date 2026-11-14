import {runAI} from '../dist/ai-client.js';
const result=await runAI('clarify',{problem:'Small produce distributors lose stock to spoilage during transport without reliable refrigeration.',customer:'Small produce distributors',geography:'One regional market',constraints:'Low power use and simple maintenance'},{provider:'ollama',ollamaURL:'http://localhost:11434',ollamaModel:process.env.OLLAMA_TEST_MODEL||'qwen3.5:4b'},AbortSignal.timeout(180000));
console.log(JSON.stringify(result,null,2));
