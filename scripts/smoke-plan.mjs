import {runAI} from '../dist/ai-client.js';
import {newProject,context} from '../dist/venture-core.js';
const p=newProject();p.name='Sample produce service';p.problem='Small produce distributors lose stock to spoilage during transport without reliable refrigeration.';p.customer='Small produce distributors';p.geography='One regional market';p.constraints='Low power use and simple maintenance';p.concept='Investigate insulated reusable crates with temperature monitoring, comparing a simple passive design first.';p.offer='A crate rental and maintenance service';
const result=await runAI('plan',context(p),{provider:'ollama',ollamaURL:'http://localhost:11434',ollamaModel:process.env.OLLAMA_TEST_MODEL||'qwen3.5:4b'},AbortSignal.timeout(330000));
console.log(JSON.stringify({provider:result.provider,model:result.model,at:result.at,sections:result.result.sections.map(s=>({title:s.title,characters:s.text.length}))},null,2));
