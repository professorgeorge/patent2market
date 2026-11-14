import test from 'node:test';
import assert from 'node:assert/strict';
import { createZip, buildDocx, generateWordHtml, pitchDeckSlides, generateBusinessModelCanvas, generateBusinessModelCanvasHtml } from '../dist/word-export.js';
import { classifySubsystem } from '../dist/patents.js';
import { newProject, draftPlan, heuristicFinancials, heuristicEvidence } from '../dist/venture-core.js';
import { googleRecord } from '../server/patents.mjs';

test('classifySubsystem categorizes patents into functional subsystems', () => {
  assert.equal(classifySubsystem({ title: 'Evaporative cooling unit', description: 'Thermal regulation' }), 'Thermal & Cooling');
  assert.equal(classifySubsystem({ title: 'Photovoltaic power array', description: 'Solar energy generator' }), 'Power & Energy');
  assert.equal(classifySubsystem({ title: 'Optical detection sensor', description: 'Gas and humidity monitoring' }), 'Sensing & Control');
  assert.equal(classifySubsystem({ title: 'Reverse osmosis membrane', description: 'Water purification filter' }), 'Fluid & Purification');
  assert.equal(classifySubsystem({ title: 'Composite barrier container', description: 'Biodegradable polymer packaging material' }), 'Materials & Packaging');
  assert.equal(classifySubsystem({ title: 'General mechanical linkage', description: 'Lever mechanism' }), 'Core Mechanism');
});

test('createZip generates standard PKZip buffer with valid magic signature', () => {
  const zip = createZip([
    { name: 'test.txt', content: 'Hello World' },
    { name: 'data.xml', content: '<root>test</root>' }
  ]);
  assert.ok(zip instanceof Uint8Array);
  assert.ok(zip.length > 50);
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  assert.equal(view.getUint32(0, true), 0x04034b50); // PK zip local file header signature
});

test('buildDocx creates authentic Office OpenXML .docx with all required parts', () => {
  const p = newProject();
  p.name = 'FreshVault Kenya';
  p.problem = 'Reduce post-harvest tomato spoilage in rural Kenya';
  p.country = 'Kenya';
  p.financial = heuristicFinancials(p);
  p.evidence = heuristicEvidence(p);
  p.technologies = [
    googleRecord({
      publication_number: 'US10987654B2',
      title: 'Solar Cooling Apparatus',
      snippet: 'A refrigeration unit driven by solar thermal collector',
      family_metadata: { aggregated: { country_status: [{ country_code: 'US', best_patent_stage: { state: 'ACTIVE' } }] } }
    })
  ];
  p.sections = draftPlan(p);

  const docx = buildDocx(p);
  assert.ok(docx instanceof Uint8Array);
  assert.ok(docx.length > 1000);

  const view = new DataView(docx.buffer, docx.byteOffset, docx.byteLength);
  assert.equal(view.getUint32(0, true), 0x04034b50);

  // Convert buffer to string to check embedded text
  const rawText = new TextDecoder('utf-8', { fatal: false }).decode(docx);
  assert.match(rawText, /word\/document\.xml/);
  assert.match(rawText, /word\/styles\.xml/);
  assert.match(rawText, /\[Content_Types\]\.xml/);
  assert.match(rawText, /FreshVault Kenya/);
  assert.match(rawText, /Professor Babu George/);

  // Validate XML tag balance inside the document container
  const openT = (rawText.match(/<w:t(?:\s[^>]*)?>/g) || []).length;
  const closeT = (rawText.match(/<\/w:t>/g) || []).length;
  assert.equal(openT, closeT, `Mismatched <w:t> tags: ${openT} opened vs ${closeT} closed`);

  const openR = (rawText.match(/<w:r(?:\s[^>]*)?>/g) || []).length;
  const closeR = (rawText.match(/<\/w:r>/g) || []).length;
  assert.equal(openR, closeR, `Mismatched <w:r> tags: ${openR} opened vs ${closeR} closed`);

  const openP = (rawText.match(/<w:p(?:\s[^>]*)?>/g) || []).length;
  const closeP = (rawText.match(/<\/w:p>/g) || []).length;
  assert.equal(openP, closeP, `Mismatched <w:p> tags: ${openP} opened vs ${closeP} closed`);
});

test('generateWordHtml outputs rich MSO HTML with styled tables and attribution', () => {
  const p = newProject();
  p.name = 'JalShakti CleanWater';
  p.problem = 'Pathogen contamination in rural village wells';
  p.country = 'India';
  p.sector = 'Water & Sanitation';
  p.financial = heuristicFinancials(p);
  p.sections = draftPlan(p);

  const html = generateWordHtml(p);
  assert.match(html, /<html xmlns:o='urn:schemas-microsoft-com:office:office'/);
  assert.match(html, /JalShakti CleanWater/);
  assert.match(html, /India/);
  assert.match(html, /Unit Selling Price/);
  assert.match(html, /Professor Babu George/);
  assert.match(html, /https:\/\/www\.linkedin\.com\/in\/beingbabu\//);
});

test('pitchDeckSlides produces 10 structured slides for investor presentation', () => {
  const p = newProject();
  p.name = 'SolFresh Africa';
  p.problem = 'Cold chain breakdown for fruit growers';
  p.country = 'Kenya';
  p.financial = heuristicFinancials(p);
  p.offer = 'Pay-as-you-store cooling containers';

  const slides = pitchDeckSlides(p);
  assert.equal(slides.length, 10);
  assert.equal(slides[0].num, 1);
  assert.equal(slides[9].num, 10);
  assert.match(slides[0].title, /SolFresh Africa/);
  assert.match(slides[1].title, /Problem/);
  assert.match(slides[2].title, /Solution/);
  assert.match(slides[3].title, /Technology/);
  assert.match(slides[4].title, /Business Model/);
  assert.match(slides[8].title, /Roadmap/);
});

test('generateBusinessModelCanvas produces all 9 Osterwalder building blocks', () => {
  const p = newProject();
  p.name = 'AquaPure Solar';
  p.problem = 'Arsenic and fluoride contamination in drinking water';
  p.customer = 'Rural village panchayats and water cooperatives';
  p.country = 'India';
  p.financial = heuristicFinancials(p);
  p.evidence = heuristicEvidence(p);
  p.channel = 'Regional rural water development agencies';
  p.advantage = '15 years field hydrogeology and community water engineering';
  p.technologies = [
    googleRecord({
      publication_number: 'US9876543B2',
      title: 'Solar Distillation Apparatus with Integrated Membrane',
      snippet: 'Water purification system using solar collector and membrane filter',
      family_metadata: { aggregated: { country_status: [{ country_code: 'US', best_patent_stage: { state: 'ACTIVE' } }] } }
    })
  ];

  const bmc = generateBusinessModelCanvas(p);
  assert.equal(bmc.name, 'AquaPure Solar');
  assert.equal(bmc.country, 'India');
  assert.ok(bmc.blocks);

  const blockKeys = [
    'keyPartners', 'keyActivities', 'keyResources',
    'valuePropositions', 'customerRelationships', 'channels',
    'customerSegments', 'costStructure', 'revenueStreams'
  ];
  for (const k of blockKeys) {
    assert.ok(bmc.blocks[k], `Missing BMC block: ${k}`);
    assert.ok(bmc.blocks[k].title, `Missing title in BMC block: ${k}`);
    assert.ok(Array.isArray(bmc.blocks[k].items), `Items not an array in BMC block: ${k}`);
    assert.ok(bmc.blocks[k].items.length >= 3, `Expected at least 3 items in BMC block: ${k}`);
  }

  // Key Resources should include patent
  const kr = bmc.blocks.keyResources.items.join(' ');
  assert.match(kr, /US9876543B2/);
  assert.match(kr, /AquaPure Solar|hydrogeology/);

  // Cost Structure and Revenue Streams should include financial figures
  const costs = bmc.blocks.costStructure.items.join(' ');
  const revs = bmc.blocks.revenueStreams.items.join(' ');
  assert.match(costs, /COGS|Unit/);
  assert.match(revs, /Price|Selling/);
});

test('generateBusinessModelCanvasHtml produces valid standalone HTML with embedded print styles', () => {
  const p = newProject();
  p.name = 'FreshCold Logistics';
  p.country = 'Kenya';
  p.financial = heuristicFinancials(p);

  const html = generateBusinessModelCanvasHtml(p);
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /FreshCold Logistics — Business Model Canvas/);
  assert.match(html, /Alexander Osterwalder/);
  assert.match(html, /Key Partners/);
  assert.match(html, /Value Propositions/);
  assert.match(html, /Customer Segments/);
  assert.match(html, /Cost Structure/);
  assert.match(html, /Revenue Streams/);
  assert.match(html, /@media print/);
  assert.match(html, /Professor Babu George/);
  assert.match(html, /https:\/\/www\.linkedin\.com\/in\/beingbabu\//);
});
