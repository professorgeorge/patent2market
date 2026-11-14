import test from 'node:test';
import assert from 'node:assert/strict';
import { createZip, buildDocx, generateWordHtml, pitchDeckSlides } from '../dist/word-export.js';
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
