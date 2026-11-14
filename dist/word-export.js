// word-export.js — Microsoft Word (.docx and .doc) and Pitch Deck export engine for Patent2Market
// Zero external runtime dependencies; pure ES module with standard OpenXML and PKZip specification.

import { financials, generateSolutionBlueprint } from './venture-core.js';
import { selectedPatents, costLabel } from './patents.js';

// CRC-32 Lookup Table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[i] = c;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

export function createZip(files) {
  const enc = new TextEncoder();
  const fileEntries = files.map(f => {
    const data = typeof f.content === 'string' ? enc.encode(f.content) : f.content;
    const nameBytes = enc.encode(f.name);
    return { nameBytes, data, crc: crc32(data), size: data.length };
  });

  const parts = [];
  let offset = 0;
  const cdirParts = [];

  for (const f of fileEntries) {
    const lh = new Uint8Array(30 + f.nameBytes.length);
    const view = new DataView(lh.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true); // compression: 0 = stored
    view.setUint16(10, 0x4000, true); // DOS time: 08:00:00
    view.setUint16(12, 0x5821, true); // DOS date: 2024-01-01
    view.setUint32(14, f.crc, true);
    view.setUint32(18, f.size, true);
    view.setUint32(22, f.size, true);
    view.setUint16(26, f.nameBytes.length, true);
    view.setUint16(28, 0, true);
    lh.set(f.nameBytes, 30);
    parts.push(lh, f.data);

    const cdh = new Uint8Array(46 + f.nameBytes.length);
    const cdView = new DataView(cdh.buffer);
    cdView.setUint32(0, 0x02014b50, true);
    cdView.setUint16(4, 20, true);
    cdView.setUint16(6, 20, true);
    cdView.setUint16(8, 0, true); // general purpose bit flag
    cdView.setUint16(10, 0, true); // compression method: 0 = stored (no compression)
    cdView.setUint16(12, 0x4000, true); // DOS time: 08:00:00
    cdView.setUint16(14, 0x5821, true); // DOS date: 2024-01-01
    cdView.setUint32(16, f.crc, true);
    cdView.setUint32(20, f.size, true);
    cdView.setUint32(24, f.size, true);
    cdView.setUint16(28, f.nameBytes.length, true);
    cdView.setUint16(30, 0, true);
    cdView.setUint16(32, 0, true);
    cdView.setUint16(34, 0, true);
    cdView.setUint16(36, 0, true);
    cdView.setUint32(38, 0, true);
    cdView.setUint32(42, offset, true);
    cdh.set(f.nameBytes, 46);
    cdirParts.push(cdh);
    offset += lh.length + f.data.length;
  }

  const cdirOffset = offset;
  let cdirSize = 0;
  for (const c of cdirParts) cdirSize += c.length;

  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054b50, true);
  eView.setUint16(4, 0, true);
  eView.setUint16(6, 0, true);
  eView.setUint16(8, fileEntries.length, true);
  eView.setUint16(10, fileEntries.length, true);
  eView.setUint32(12, cdirSize, true);
  eView.setUint32(16, cdirOffset, true);
  eView.setUint16(20, 0, true);

  const totalLen = offset + cdirSize + 22;
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  for (const c of cdirParts) { out.set(c, pos); pos += c.length; }
  out.set(eocd, pos);
  return out;
}

function escapeXml(str) {
  return String(str || '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Builds an authentic Office OpenXML .docx file (ZIP container)
export function buildDocx(project) {
  const f = financials(project.financial);
  const curr = project.financial.currency || 'USD';
  const money = n => `${curr} ${Math.round(n).toLocaleString('en-US')}`;
  const patents = selectedPatents(project);

  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '</Types>';

  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>';

  const docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';

  const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="1F2937"/></w:rPr></w:rPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="360" w:after="140"/><w:keepNext/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:b/><w:sz w:val="30"/><w:color w:val="163D36"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:spacing w:before="240" w:after="100"/><w:keepNext/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:b/><w:sz w:val="24"/><w:color w:val="21594F"/></w:rPr></w:style>' +
    '</w:styles>';

  let docBody = '';

  // Title Block
  docBody += '<w:p><w:pPr><w:spacing w:before="120" w:after="80"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:b/><w:sz w:val="48"/><w:color w:val="163D36"/></w:rPr><w:t>' + escapeXml(project.name || 'Patent2Market Venture Plan') + '</w:t></w:r></w:p>';
  docBody += '<w:p><w:pPr><w:spacing w:before="0" w:after="200"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="24"/><w:color w:val="4B5563"/></w:rPr><w:t>COMMERCIAL VENTURE PLAN &amp; PATENT INTEGRATION BLUEPRINT</w:t></w:r></w:p>';

  // Attribution
  docBody += '<w:p><w:pPr><w:spacing w:before="0" w:after="240"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="6B7280"/></w:rPr><w:t>Conceptualization and development: Professor Babu George (LinkedIn: https://www.linkedin.com/in/beingbabu/)</w:t></w:r></w:p>';

  // Metadata Paragraph
  docBody += '<w:p><w:pPr><w:spacing w:before="100" w:after="140"/></w:pPr>' +
    '<w:r><w:rPr><w:b/><w:color w:val="163D36"/></w:rPr><w:t>Operating Country: </w:t></w:r><w:r><w:t>' + escapeXml(project.country || 'Not specified') + '   |   </w:t></w:r>' +
    '<w:r><w:rPr><w:b/><w:color w:val="163D36"/></w:rPr><w:t>Target Sector: </w:t></w:r><w:r><w:t>' + escapeXml(project.sector || 'Not specified') + '   |   </w:t></w:r>' +
    '<w:r><w:rPr><w:b/><w:color w:val="163D36"/></w:rPr><w:t>Target Market: </w:t></w:r><w:r><w:t>' + escapeXml(project.geography || 'Not specified') + '</w:t></w:r></w:p>';

  // Core Value Callout
  docBody += '<w:p><w:pPr><w:spacing w:before="80" w:after="80"/><w:pBdr><w:left w:val="single" w:sz="24" w:space="12" w:color="163D36"/></w:pBdr></w:pPr>' +
    '<w:r><w:rPr><w:b/><w:color w:val="163D36"/></w:rPr><w:t>Problem Statement: </w:t></w:r><w:r><w:t>' + escapeXml(project.problem || 'Not specified') + '</w:t></w:r></w:p>';
  docBody += '<w:p><w:pPr><w:spacing w:before="80" w:after="160"/><w:pBdr><w:left w:val="single" w:sz="24" w:space="12" w:color="163D36"/></w:pBdr></w:pPr>' +
    '<w:r><w:rPr><w:b/><w:color w:val="163D36"/></w:rPr><w:t>Customer Solution &amp; Offer: </w:t></w:r><w:r><w:t>' + escapeXml(project.offer || project.concept || 'Not specified') + '</w:t></w:r></w:p>';

  // Multi-Patent Architecture Summary if present
  if (patents.length) {
    const bp = generateSolutionBlueprint(project);
    docBody += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Technology &amp; Comprehensive Solution Blueprint (' + patents.length + ' patented, ' + bp.gaps.length + ' AI gap-fills)</w:t></w:r></w:p>';
    for (let i = 0; i < patents.length; i++) {
      const t = patents[i];
      docBody += '<w:p><w:pPr><w:spacing w:before="60" w:after="40"/></w:pPr>' +
        '<w:r><w:rPr><w:b/><w:color w:val="21594F"/></w:rPr><w:t>[T' + (i + 1) + ' Patented Core] ' + escapeXml(t.title) + ' (' + escapeXml(t.id) + ' · ' + escapeXml(t.jurisdiction || 'US') + ')</w:t></w:r></w:p>';
      docBody += '<w:p><w:pPr><w:spacing w:before="0" w:after="60"/><w:jc w:val="both"/></w:pPr><w:r><w:t>' + escapeXml(t.description) + '</w:t></w:r></w:p>';
      docBody += '<w:p><w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="4B5563"/></w:rPr><w:t>Source: ' + escapeXml(t.url) + ' | Legal/Access Status: ' + escapeXml(t.statusLabel || t.access || 'Requires review') + ' | ' + escapeXml(costLabel(t)) + '</w:t></w:r></w:p>';
    }
    if (bp.gaps.length) {
      docBody += '<w:p><w:pPr><w:spacing w:before="100" w:after="40"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="163D36"/></w:rPr><w:t>AI-Engineered Auxiliary Subsystems (Filling Architectural Gaps with COTS Hardware)</w:t></w:r></w:p>';
      for (const g of bp.gaps) {
        docBody += '<w:p><w:pPr><w:spacing w:before="40" w:after="20"/></w:pPr>' +
          '<w:r><w:rPr><w:b/></w:rPr><w:t>• ' + escapeXml(g.subsystem) + ': </w:t></w:r><w:r><w:t>' + escapeXml(g.role) + '</w:t></w:r></w:p>' +
          '<w:p><w:pPr><w:spacing w:before="0" w:after="60"/><w:ind w:left="360"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="4B5563"/></w:rPr><w:t>COTS BOM: ' + escapeXml(g.cotsComponents) + ' | Interface: ' + escapeXml(g.interface) + '</w:t></w:r></w:p>';
      }
    }
  }

  // Financial Dashboard Summary
  if (project.financial && project.financial.price) {
    docBody += '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Unit Economics &amp; 12-Month Outlook</w:t></w:r></w:p>';
    docBody += '<w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Unit Price: </w:t></w:r><w:r><w:t>' + money(project.financial.price) + '   |   </w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Unit Variable Cost: </w:t></w:r><w:r><w:t>' + money(project.financial.unitCost) + '   |   </w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Gross Margin: </w:t></w:r><w:r><w:t>' + (f.margin !== null ? Math.round(f.margin * 100) + '%' : 'N/A') + '   |   </w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Monthly Break-Even: </w:t></w:r><w:r><w:t>' + (f.breakEven !== null ? f.breakEven + ' units/mo' : 'N/A') + '</w:t></w:r></w:p>';
    docBody += '<w:p><w:pPr><w:spacing w:before="40" w:after="160"/></w:pPr>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Year 1 Revenue: </w:t></w:r><w:r><w:t>' + money(f.revenue) + '   |   </w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Operating Result: </w:t></w:r><w:r><w:t>' + money(f.profit) + '   |   </w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Launch Capital: </w:t></w:r><w:r><w:t>' + money(f.capital) + '   |   </w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Peak Funding Shortfall: </w:t></w:r><w:r><w:t>' + money(f.fundingGap) + '</w:t></w:r></w:p>';
  }

  // 14 Business Plan Sections
  for (const s of (project.sections || [])) {
    if (!s || !s.title) continue;
    docBody += '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t xml:space="preserve">' + escapeXml(s.title) + '</w:t></w:r></w:p>';
    const paras = String(s.text || '').split(/\n\s*\n/);
    for (const p of paras) {
      if (!p.trim()) continue;
      const lines = p.trim().split(/\r?\n/);
      docBody += '<w:p><w:pPr><w:spacing w:before="60" w:after="120"/><w:jc w:val="both"/></w:pPr><w:r>' +
        lines.map(line => '<w:t xml:space="preserve">' + escapeXml(line) + '</w:t>').join('<w:br/>') +
        '</w:r></w:p>';
    }
  }

  // Assembling document.xml
  const documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + docBody + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>';

  const files = [
    { name: '[Content_Types].xml', content: contentTypes },
    { name: '_rels/.rels', content: rels },
    { name: 'word/_rels/document.xml.rels', content: docRels },
    { name: 'word/styles.xml', content: styles },
    { name: 'word/document.xml', content: documentXml }
  ];

  return createZip(files);
}

// Builds an institutional Word HTML .doc format with full CSS styling and table layout
export function generateWordHtml(project) {
  const f = financials(project.financial);
  const curr = project.financial.currency || 'USD';
  const money = n => `${curr} ${Math.round(n).toLocaleString('en-US')}`;
  const patents = selectedPatents(project);

  return `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${escapeHtml(project.name || 'Patent2Market Venture Plan')}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 { size: 8.5in 11.0in; margin: 1.0in 1.0in 1.0in 1.0in; mso-header-margin: .5in; mso-footer-margin: .5in; }
div.Section1 { page: Section1; font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; }
h1.doc-title { font-family: 'Georgia', serif; font-size: 26pt; color: #163d36; margin-bottom: 2pt; text-align: center; }
.doc-subtitle { font-size: 11pt; text-transform: uppercase; letter-spacing: 1.5pt; color: #475569; margin-bottom: 12pt; text-align: center; font-weight: bold; }
.attribution { font-size: 9.5pt; color: #64748b; font-style: italic; text-align: center; margin-bottom: 24pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 12pt; }
h2 { font-family: 'Georgia', serif; font-size: 15pt; color: #163d36; border-bottom: 1.5pt solid #163d36; padding-bottom: 4pt; margin-top: 22pt; margin-bottom: 8pt; page-break-after: avoid; }
h3 { font-size: 12pt; color: #21594f; margin-top: 14pt; margin-bottom: 4pt; }
p { margin-bottom: 8pt; text-align: justify; }
.callout { background-color: #f8fafc; border-left: 4pt solid #163d36; padding: 10pt 14pt; margin: 14pt 0; }
.meta-table, .financial-table, .data-table { border-collapse: collapse; width: 100%; margin: 14pt 0; font-size: 10pt; }
.meta-table td { border: none; padding: 4pt 8pt; }
.financial-table th, .financial-table td, .data-table th, .data-table td { border: 1pt solid #cbd5e1; padding: 6pt 8pt; text-align: left; }
.financial-table th, .data-table th { background-color: #f1f5f9; color: #163d36; font-weight: bold; }
.num { text-align: right; }
.badge { background: #e2e8f0; padding: 2pt 6pt; border-radius: 3pt; font-size: 9pt; }
.source-note { font-size: 9pt; color: #64748b; margin-top: 3pt; }
.footer-credit { margin-top: 36pt; padding-top: 12pt; border-top: 1pt solid #cbd5e1; font-size: 9pt; color: #64748b; text-align: center; }
</style>
</head>
<body>
<div class='Section1'>

<h1 class='doc-title'>${escapeHtml(project.name || 'Patent2Market Venture Plan')}</h1>
<div class='doc-subtitle'>Commercial Venture Plan &amp; Patent Integration Blueprint</div>
<div class='attribution'>Conceptualization and development: Professor Babu George (<a href='https://www.linkedin.com/in/beingbabu/'>LinkedIn Profile</a>) · Built with Patent2Market Venture Studio</div>

<div class='callout'>
  <p style='margin:0 0 6pt 0;'><strong>Target Problem:</strong> ${escapeHtml(project.problem || 'Not specified')}</p>
  <p style='margin:0 0 6pt 0;'><strong>Customer Solution:</strong> ${escapeHtml(project.offer || project.concept || 'Not specified')}</p>
  <p style='margin:0;'><strong>Operating Territory:</strong> ${escapeHtml(project.country || 'Not specified')} (${escapeHtml(project.geography || 'Primary region')}) &nbsp;|&nbsp; <strong>Target Sector:</strong> ${escapeHtml(project.sector || 'Not specified')}</p>
</div>

${patents.length ? `
<h2>Technology &amp; Comprehensive Solution Blueprint (${patents.length} Sourced Leads, ${generateSolutionBlueprint(project).gaps.length} AI Gap-Fills)</h2>
<table class='data-table'>
  <thead>
    <tr>
      <th style='width:18%;'>Patent ID</th>
      <th style='width:32%;'>Title &amp; Subsystem</th>
      <th style='width:25%;'>Jurisdiction &amp; Status</th>
      <th style='width:25%;'>Access Basis &amp; Terms</th>
    </tr>
  </thead>
  <tbody>
    ${patents.map((t, i) => `
      <tr>
        <td><strong>[T${i + 1}] ${escapeHtml(t.id)}</strong><br><small class='source-note'>${escapeHtml(t.source || 'Patent source')}</small></td>
        <td><strong>${escapeHtml(t.title)}</strong><br><small>${escapeHtml(t.category || t.subsystem || 'Core mechanism')}</small></td>
        <td>${escapeHtml(t.jurisdiction || 'US')}<br><span class='badge'>${escapeHtml(t.statusLabel || t.access || 'Requires register review')}</span></td>
        <td>${escapeHtml(costLabel(t))}<br><small><a href='${escapeHtml(t.url)}'>Source link ↗</a></small></td>
      </tr>
    `).join('')}
  </tbody>
</table>

${generateSolutionBlueprint(project).gaps.length ? `
<h3>AI-Engineered Auxiliary Subsystems (Filling Architectural Gaps with COTS Hardware)</h3>
<table class='data-table'>
  <thead>
    <tr>
      <th style='width:25%;'>Subsystem</th>
      <th style='width:35%;'>Engineering Role &amp; Function</th>
      <th style='width:25%;'>Commercial Off-The-Shelf (COTS) BOM</th>
      <th style='width:15%;'>Interface</th>
    </tr>
  </thead>
  <tbody>
    ${generateSolutionBlueprint(project).gaps.map(g => `
      <tr>
        <td><strong>${escapeHtml(g.subsystem)}</strong><br><span class='badge' style='background:#e8f5e9;color:#1b5e20;'>COTS Gap-Fill</span></td>
        <td>${escapeHtml(g.role)}</td>
        <td><small>${escapeHtml(g.cotsComponents)}</small></td>
        <td><small>${escapeHtml(g.interface)}</small></td>
      </tr>
    `).join('')}
  </tbody>
</table>
` : ''}
` : ''}

${project.financial && project.financial.price ? `
<h2>Financial Projections &amp; Unit Economics (${curr})</h2>
<table class='financial-table'>
  <thead>
    <tr>
      <th>Metric</th>
      <th class='num'>Baseline Assumption</th>
      <th>Investor Notes &amp; Rationale</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Unit Selling Price</td><td class='num'><strong>${money(project.financial.price)}</strong></td><td>Direct customer price per unit or service subscription</td></tr>
    <tr><td>Unit Variable Cost (COGS)</td><td class='num'>${money(project.financial.unitCost)}</td><td>Direct material, assembly, logistics &amp; royalty costs</td></tr>
    <tr><td>Unit Contribution Margin</td><td class='num'><strong>${money(project.financial.price - project.financial.unitCost)}</strong> (${f.margin !== null ? Math.round(f.margin * 100) + '%' : 'N/A'})</td><td>Gross operating profit generated per unit sold</td></tr>
    <tr><td>Monthly Fixed Operating Cost</td><td class='num'>${money(project.financial.fixedCost)}</td><td>Salaries, facilities, utilities, software &amp; compliance</td></tr>
    <tr><td>Monthly Break-Even Volume</td><td class='num'><strong>${f.breakEven !== null ? f.breakEven + ' units/mo' : 'N/A'}</strong></td><td>Volume required to achieve zero net operating loss</td></tr>
    <tr><td>Upfront Launch / Startup Capex</td><td class='num'>${money(f.startup)}</td><td>Tooling, certification, prototype &amp; legal fees</td></tr>
    <tr><td>Opening Venture Capital</td><td class='num'>${money(f.capital)}</td><td>Initial equity, grant, or sponsor capital available</td></tr>
    <tr><td>12-Month Total Revenue</td><td class='num'><strong>${money(f.revenue)}</strong></td><td>Cumulative year 1 gross billings</td></tr>
    <tr><td>12-Month Net Operating Result</td><td class='num'><strong>${money(f.profit)}</strong></td><td>Year 1 bottom-line before taxes and financing</td></tr>
    <tr><td>Peak Capital Shortfall (Runway Gap)</td><td class='num'><strong>${money(f.fundingGap)}</strong></td><td>Maximum working capital drawdown before cash positive</td></tr>
  </tbody>
</table>
` : ''}

${project.sections.map(s => `
  <h2>${escapeHtml(s.title)}</h2>
  ${s.text.split(/\n\s*\n/).filter(Boolean).map(p => `<p>${escapeHtml(p.trim())}</p>`).join('')}
`).join('')}

<div class='footer-credit'>
  Commercial Blueprint generated by <strong>Patent2Market</strong><br>
  Conceptualization and development: <a href='https://www.linkedin.com/in/beingbabu/'>Professor Babu George</a> · Published under MIT License
</div>

</div>
</body>
</html>
  `.trim();
}

// 10-Slide Pitch Deck generator for founder presentations
export function pitchDeckSlides(project) {
  const f = financials(project.financial);
  const curr = project.financial.currency || 'USD';
  const money = n => `${curr} ${Math.round(n).toLocaleString('en-US')}`;
  const patents = selectedPatents(project);

  return [
    {
      num: 1,
      title: project.name || 'Patent2Market Venture',
      subtitle: 'Executive Pitch Deck',
      content: `A commercial venture commercializing verified patent technology for ${project.country || 'emerging markets'}.<br><br><strong>Founder Advantage:</strong> ${project.advantage || 'Deep local execution capability and technical integration.'}`
    },
    {
      num: 2,
      title: 'The Problem & Market Pain',
      subtitle: 'Critical Unmet Need',
      content: `<strong>Observed Friction:</strong> ${project.problem || 'Significant unaddressed cost and efficiency loss in the target market.'}<br><br><strong>Target Customer:</strong> ${project.customer || 'Primary customer segment'}<br><strong>Geography:</strong> ${project.geography || project.country || 'Operating region'}`
    },
    {
      num: 3,
      title: 'The Solution & Value Proposition',
      subtitle: 'Engineered for Practical Adoption',
      content: `<strong>Venture Offering:</strong> ${project.offer || project.concept || 'Turnkey solution package'}<br><br><strong>Core Advantage:</strong> Delivers measurable cost savings and performance superior to manual workarounds without requiring heavy capital investment.`
    },
    {
      num: 4,
      title: 'Technology & Solution Blueprint',
      subtitle: 'Patented Core + AI-Engineered Modular Architecture',
      content: patents.length ? (
        patents.map((t, i) => `<strong>[T${i + 1} Patented Core] ${t.title}</strong> (${t.id})<br>Role: ${t.subsystem || t.category || 'Core Subsystem'} · Status: ${t.statusLabel || t.access || 'Active'}`).join('<br>') +
        '<br><br><strong>AI-Engineered Subsystems (COTS Off-The-Shelf):</strong><br>' +
        '• Power & Energy Conditioning (Solar MPPT / LiFePO4 battery buffer)<br>' +
        '• Sensing, Control & Telemetry (Embedded MCU closed-loop controller)<br>' +
        '• Structural Housing & Ingress Protection (Weatherproof IP65 modular chassis)'
      ) : 'Proprietary engineering architecture combined with open industry standards.'
    },
    {
      num: 5,
      title: 'Business Model & Unit Economics',
      subtitle: 'Healthy Unit Margins from Day One',
      content: `<strong>Price per Unit:</strong> ${money(project.financial.price)}<br><strong>Unit COGS:</strong> ${money(project.financial.unitCost)}<br><strong>Gross Margin:</strong> ${f.margin !== null ? Math.round(f.margin * 100) + '%' : 'N/A'}<br><strong>Monthly Break-Even:</strong> ${f.breakEven !== null ? f.breakEven + ' units/month' : 'N/A'}`
    },
    {
      num: 6,
      title: 'Go-to-Market & Distribution',
      subtitle: 'Low-CAC Channel Strategy',
      content: `<strong>Initial Distribution Channel:</strong> ${project.channel || 'Direct partnership with established local distributors and sector associations.'}<br><br><strong>Phase 1 Cohort:</strong> 5 paid pilot customer installations with clear success criteria.`
    },
    {
      num: 7,
      title: 'Operations & Local Assembly',
      subtitle: 'Resilient Supply Chain',
      content: `<strong>Assembly Strategy:</strong> Modular sub-assembly utilizing dual-sourced components and local maintenance partners.<br><br><strong>Operating Constraints:</strong> ${project.constraints || 'Designed for rugged operating environments and easy field repair.'}`
    },
    {
      num: 8,
      title: 'Risks & 7-Day Validation Tests',
      subtitle: 'Falsifying Critical Assumptions',
      content: `<strong>Priority Risk:</strong> Customer willingness to pay and field maintenance reliability.<br><br><strong>First Critical Experiment:</strong> Prototype demonstration benchmarking performance vs. existing competitor under local weather/operating conditions.`
    },
    {
      num: 9,
      title: '90-Day Execution Roadmap',
      subtitle: 'Milestone-Based Launch Sequencing',
      content: `<strong>Month 1:</strong> 15 customer discovery interviews & supplier component quotes.<br><strong>Month 2:</strong> Operational proof-of-concept demonstrator & standard certification review.<br><strong>Month 3:</strong> 3-customer paid field pilot & commercial go/no-go audit.`
    },
    {
      num: 10,
      title: 'Financial Ask & Growth Plan',
      subtitle: 'Capital Requirements & Milestones',
      content: `<strong>Initial Capital:</strong> ${money(f.capital)} (Launch capex: ${money(f.startup)})<br><strong>Year 1 Revenue Target:</strong> ${money(f.revenue)}<br><strong>Year 1 Operating Profit:</strong> ${money(f.profit)}<br><br><small>Conceptualization & Development: Professor Babu George</small>`
    }
  ];
}

export function generateBusinessModelCanvas(project) {
  const p = project || {};
  const f = financials(p.financial || {});
  const curr = p.financial?.currency || 'USD';
  const money = n => `${curr} ${Math.round(n || 0).toLocaleString('en-US')}`;
  const patents = selectedPatents(p);
  const bp = generateSolutionBlueprint(p);

  return {
    name: p.name || 'Patent2Market Venture',
    problem: p.problem || 'Market opportunity',
    country: p.country || 'Target Market',
    date: new Date().toISOString().slice(0, 10),
    blocks: {
      keyPartners: {
        id: 'keyPartners',
        title: 'Key Partners',
        subtitle: 'Who helps us build, supply & deliver?',
        items: [
          patents.length
            ? `Patent Licensors / Assignees for: ${patents.map(t => t.id).join(', ')}`
            : 'Intellectual property licensors and university tech transfer offices',
          bp.gaps?.length
            ? `COTS Component Suppliers for: ${bp.gaps.slice(0, 2).map(g => g.subsystem).join(', ')}`
            : 'COTS industrial component suppliers and fabrication partners',
          p.channel
            ? `Distribution & GTM Partners: ${p.channel.slice(0, 80)}`
            : 'Regional distributors and industry trade associations',
          `Local regulatory, certification & standards bodies in ${p.country || 'operating territory'}`
        ]
      },
      keyActivities: {
        id: 'keyActivities',
        title: 'Key Activities',
        subtitle: 'What core things must the venture do?',
        items: [
          'System integration of patented mechanisms with COTS auxiliary hardware',
          'Rigorous bench testing, QA, and local environmental stress validation',
          `Direct customer acquisition & pilot onboarding in ${p.geography || p.country || 'launch territory'}`,
          'Continuous field telemetry monitoring, maintenance & consumables support'
        ]
      },
      keyResources: {
        id: 'keyResources',
        title: 'Key Resources',
        subtitle: 'What assets are indispensable?',
        items: [
          patents.length
            ? `Patented Technology Stack: ${patents.map(t => `[${t.id}] ${t.title}`).join('; ')}`
            : 'Proprietary engineering know-how & modular solution architecture',
          p.advantage
            ? `Founder Capabilities: ${p.advantage}`
            : 'Technical integration and local operational execution capabilities',
          `Field Evidence Base (${(p.evidence || []).length} recorded proof points & test targets)`,
          p.financial?.capital ? `Initial Launch Capital: ${money(p.financial.capital)}` : 'Dedicated venture seed capital & working credit facilities'
        ]
      },
      valuePropositions: {
        id: 'valuePropositions',
        title: 'Value Propositions',
        subtitle: 'What compelling value is delivered?',
        items: [
          p.offer ? `Commercial Offering: ${p.offer}` : 'Integrated, reliable commercial product/service solution',
          p.concept ? `Technical Advantage: ${p.concept.slice(0, 160)}` : 'Solves core performance bottlenecks via proven mechanical principles',
          `Addresses critical market friction: "${(p.problem || 'High operational costs').slice(0, 140)}"`,
          p.localContext ? `Engineered specifically for: ${p.localContext.slice(0, 120)}` : 'Ruggedized for local operating constraints with minimal maintenance overhead'
        ]
      },
      customerRelationships: {
        id: 'customerRelationships',
        title: 'Customer Relationships',
        subtitle: 'How do we interact with customers?',
        items: [
          'High-touch onboarding, technical operator training & commissioning',
          'Preventative maintenance service level agreements (SLAs)',
          'Direct customer feedback loops and agile performance optimization',
          'Transparent, predictable pricing with no hidden service surcharges'
        ]
      },
      channels: {
        id: 'channels',
        title: 'Channels',
        subtitle: 'How do we reach and distribute to customers?',
        items: [
          p.channel ? `Primary Route: ${p.channel}` : 'Direct B2B founder sales & key account management',
          `Sector distributor networks & agricultural/commercial hubs in ${p.geography || p.country || 'local market'}`,
          'On-site field demonstrations & peer-to-peer customer referral showcases',
          'Digital direct inquiry portal and regional trade expos'
        ]
      },
      customerSegments: {
        id: 'customerSegments',
        title: 'Customer Segments',
        subtitle: 'Who are our most important customers?',
        items: [
          p.customer ? `Target Profile: ${p.customer}` : 'Commercial operators seeking verified performance efficiency',
          `Geographic Scope: ${p.geography ? `${p.geography}, ` : ''}${p.country || 'Target Region'}`,
          p.sector ? `Target Sector: ${p.sector}` : 'Commercial & industrial small/mid-size enterprises',
          'Early Adopter Persona: Cost-conscious operators bearing high losses from existing alternatives'
        ]
      },
      costStructure: {
        id: 'costStructure',
        title: 'Cost Structure',
        subtitle: 'What are the major costs & drivers?',
        items: [
          p.financial?.unitCost ? `Variable Unit COGS: ${money(p.financial.unitCost)} per unit (BOM materials, sub-assembly, packaging)` : 'Variable manufacturing & component procurement costs',
          p.financial?.fixedCost ? `Monthly Fixed Operating Burn: ${money(p.financial.fixedCost)}/mo (personnel, facility, insurance)` : 'Monthly fixed operational overhead',
          p.financial?.startupCost ? `Upfront Launch & Tooling Capex: ${money(p.financial.startupCost)}` : 'Initial engineering tooling & certification capital',
          'IP rights maintenance, licensing royalties & territorial compliance fees'
        ]
      },
      revenueStreams: {
        id: 'revenueStreams',
        title: 'Revenue Streams',
        subtitle: 'How does the business generate cash?',
        items: [
          p.financial?.price ? `Unit Selling Price: ${money(p.financial.price)} per unit of sale` : 'Direct commercial unit sales or service fees',
          p.financial?.monthlyUnits ? `Month 1 Target Volume: ${p.financial.monthlyUnits} units (${p.financial.growth || 0}% monthly growth)` : 'Volume-based sales trajectory',
          f.margin !== null ? `Gross Contribution Margin: ~${Math.round(f.margin * 100)}% per sale` : 'Healthy unit contribution margin',
          'Ancillary recurring revenues: maintenance contracts, consumable kits, software telemetry'
        ]
      }
    }
  };
}

export function generateBusinessModelCanvasHtml(project) {
  const bmc = generateBusinessModelCanvas(project);
  const b = bmc.blocks;
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(bmc.name)} — Business Model Canvas</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --primary: #163d36;
      --primary-light: #21594f;
      --accent: #2e7d32;
      --bg: #f8faf7;
      --card-bg: #ffffff;
      --border: #d2ddcb;
      --ink: #0f2c27;
      --muted: #475569;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--ink);
      padding: 24px;
      line-height: 1.45;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 26px;
      color: var(--primary);
      margin: 2px 0 6px 0;
      letter-spacing: -0.5px;
    }
    .header .meta {
      font-size: 13px;
      color: var(--muted);
    }
    .header .meta strong {
      color: var(--ink);
    }
    .eyebrow {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      color: var(--accent);
    }
    .print-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .print-btn:hover {
      background: var(--primary-light);
    }
    .bmc-grid {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      grid-auto-rows: minmax(170px, auto);
      gap: 12px;
    }
    .bmc-card {
      background: #ffffff;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .bmc-card.highlight {
      background: #fafdf9;
      border-color: #a3cfbb;
    }
    .bmc-partners { grid-column: span 2; grid-row: span 2; }
    .bmc-activities { grid-column: span 2; grid-row: span 1; }
    .bmc-resources { grid-column: span 2; grid-row: span 1; }
    .bmc-propositions { grid-column: span 2; grid-row: span 2; }
    .bmc-relationships { grid-column: span 2; grid-row: span 1; }
    .bmc-channels { grid-column: span 2; grid-row: span 1; }
    .bmc-segments { grid-column: span 2; grid-row: span 2; }
    .bmc-costs { grid-column: span 5; grid-row: span 1; }
    .bmc-revenues { grid-column: span 5; grid-row: span 1; }
    .bmc-head {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 10px;
      border-bottom: 1px solid #edf2e9;
      padding-bottom: 6px;
    }
    .bmc-icon {
      font-size: 18px;
      line-height: 1;
    }
    .bmc-head h4 {
      font-size: 13.5px;
      color: var(--primary);
      margin: 0;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .bmc-head small {
      font-size: 11px;
      color: var(--muted);
      display: block;
    }
    .bmc-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-grow: 1;
    }
    .bmc-list li {
      font-size: 12px;
      color: #2c3e50;
      line-height: 1.45;
      position: relative;
      padding-left: 14px;
    }
    .bmc-list li::before {
      content: "▪";
      position: absolute;
      left: 0;
      color: var(--accent);
      font-size: 11px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 12px;
      color: var(--muted);
    }
    .footer a {
      color: var(--primary);
      text-decoration: underline;
    }
    @media (max-width: 960px) {
      .bmc-grid {
        grid-template-columns: 1fr;
      }
      .bmc-partners, .bmc-activities, .bmc-resources,
      .bmc-propositions, .bmc-relationships, .bmc-channels,
      .bmc-segments, .bmc-costs, .bmc-revenues {
        grid-column: span 1 !important;
        grid-row: auto !important;
      }
    }
    @media print {
      @page {
        size: landscape;
        margin: 6mm;
      }
      body {
        background: white !important;
        padding: 0 !important;
      }
      .container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      .print-btn {
        display: none !important;
      }
      .bmc-grid {
        display: grid !important;
        grid-template-columns: repeat(10, 1fr) !important;
        grid-auto-rows: minmax(135px, auto) !important;
        gap: 6px !important;
      }
      .bmc-card {
        padding: 8px 10px !important;
        border: 1px solid #163d36 !important;
        box-shadow: none !important;
      }
      .bmc-list li {
        font-size: 10px !important;
        line-height: 1.3 !important;
        margin-bottom: 2px !important;
      }
      .bmc-head h4 {
        font-size: 11.5px !important;
      }
      .bmc-head small {
        font-size: 9px !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="eyebrow">PATENT2MARKET · VENTURE MODELING</span>
        <h1>${esc(bmc.name)} — Business Model Canvas</h1>
        <div class="meta">
          <strong>Operating Territory:</strong> ${esc(bmc.country)} &nbsp;|&nbsp; 
          <strong>Date Generated:</strong> ${esc(bmc.date)} &nbsp;|&nbsp; 
          <strong>Framework:</strong> Alexander Osterwalder Standard
        </div>
      </div>
      <div>
        <button class="print-btn" onclick="window.print()">Print / Save as PDF 🖨</button>
      </div>
    </div>

    <div class="bmc-grid">
      <div class="bmc-card bmc-partners">
        <div class="bmc-head">
          <span class="bmc-icon">🤝</span>
          <div>
            <h4>${esc(b.keyPartners.title)}</h4>
            <small>${esc(b.keyPartners.subtitle)}</small>
          </div>
        </div>
        <ul class="bmc-list">
          ${b.keyPartners.items.map(it => `<li>${esc(it)}</li>`).join('')}
        </ul>
      </div>

      <div class="bmc-card bmc-activities">
        <div class="bmc-head">
          <span class="bmc-icon">⚡</span>
          <div>
            <h4>${esc(b.keyActivities.title)}</h4>
            <small>${esc(b.keyActivities.subtitle)}</small>
          </div>
        </div>
        <ul class="bmc-list">
          ${b.keyActivities.items.map(it => `<li>${esc(it)}</li>`).join('')}
        </ul>
      </div>

      <div class="bmc-card bmc-resources">
        <div class="bmc-head">
          <span class="bmc-icon">🏗</span>
          <div>
            <h4>${esc(b.keyResources.title)}</h4>
            <small>${esc(b.keyResources.subtitle)}</small>
          </div>
        </div>
        <ul class="bmc-list">
          ${b.keyResources.items.map(it => `<li>${esc(it)}</li>`).join('')}
        </ul>
      </div>

      <div class="bmc-card bmc-propositions highlight">
        <div class="bmc-head">
          <span class="bmc-icon">🎁</span>
          <div>
            <h4>${esc(b.valuePropositions.title)}</h4>
            <small>${esc(b.valuePropositions.subtitle)}</small>
          </div>
        </div>
        <ul class="bmc-list">
          ${b.valuePropositions.items.map(it => `<li>${esc(it)}</li>`).join('')}
        </ul>
      </div>

      <div class="bmc-card bmc-relationships">
        <div class="bmc-head">
          <span class="bmc-icon">💬</span>
          <div>
            <h4>${esc(b.customerRelationships.title)}</h4>
            <small>${esc(b.customerRelationships.subtitle)}</small>
          </div>
        </div>
        <ul class="bmc-list">
          ${b.customerRelationships.items.map(it => `<li>${esc(it)}</li>`).join('')}
        </ul>
      </div>

      <div class="bmc-card bmc-channels">
        <div class="bmc-head">
          <span class="bmc-icon">🚚</span>
          <div>
            <h4>${esc(b.channels.title)}</h4>
            <small>${esc(b.channels.subtitle)}</small>
          </div>
        </div>
        <ul class="bmc-list">
          ${b.channels.items.map(it => `<li>${esc(it)}</li>`).join('')}
        </ul>
      </div>

      <div class="bmc-card bmc-segments">
        <div class="bmc-head">
          <span class="bmc-icon">👥</span>
          <div>
            <h4>${esc(b.customerSegments.title)}</h4>
            <small>${esc(b.customerSegments.subtitle)}</small>
          </div>
        </div>
        <ul class="bmc-list">
          ${b.customerSegments.items.map(it => `<li>${esc(it)}</li>`).join('')}
        </ul>
      </div>

      <div class="bmc-card bmc-costs">
        <div class="bmc-head">
          <span class="bmc-icon">🏷</span>
          <div>
            <h4>${esc(b.costStructure.title)}</h4>
            <small>${esc(b.costStructure.subtitle)}</small>
          </div>
        </div>
        <ul class="bmc-list">
          ${b.costStructure.items.map(it => `<li>${esc(it)}</li>`).join('')}
        </ul>
      </div>

      <div class="bmc-card bmc-revenues highlight">
        <div class="bmc-head">
          <span class="bmc-icon">💰</span>
          <div>
            <h4>${esc(b.revenueStreams.title)}</h4>
            <small>${esc(b.revenueStreams.subtitle)}</small>
          </div>
        </div>
        <ul class="bmc-list">
          ${b.revenueStreams.items.map(it => `<li>${esc(it)}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="footer">
      <span>Grounded in verified patents, documented market evidence &amp; calibrated unit economics.</span>
      <span>Conceptualization and development: <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a></span>
    </div>
  </div>
</body>
</html>`;
}

// 1. Financial CSV Export Engine
export function generateFinancialCsv(project) {
  const p = project || {};
  const fin = p.financial || {};
  const f = financials(fin);
  const curr = fin.currency || 'USD';
  const sanitize = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [
    ['PATENT2MARKET PRO-FORMA FINANCIAL MODEL & CASH FLOW SCHEDULE'],
    ['Venture Name', sanitize(p.name || 'Patent2Market Venture')],
    ['Operating Territory', sanitize(p.country || 'Target Market')],
    ['Model Currency', curr],
    ['Date Generated', new Date().toISOString().slice(0, 10)],
    ['Attribution', 'Conceptualization & Development: Professor Babu George'],
    [],
    ['KEY UNIT ASSUMPTIONS & METRICS'],
    ['Metric Description', 'Value', 'Units / Formula Note'],
    ['Selling Price per Unit', fin.price || 0, curr],
    ['Variable Cost of Goods Sold (Unit COGS)', fin.unitCost || 0, curr],
    ['Unit Contribution Margin', (Number(fin.price || 0) - Number(fin.unitCost || 0)).toFixed(2), curr + ' per unit sold'],
    ['Gross Contribution Margin (%)', f.margin !== null ? (f.margin * 100).toFixed(1) + '%' : 'N/A', 'Margin % of selling price'],
    ['Month 1 Starting Volume', fin.monthlyUnits || 0, 'units sold in initial month'],
    ['Monthly Growth Rate (%)', (fin.growth || 0) + '%', 'compounding month-over-month volume expansion'],
    ['Monthly Fixed Operating Cost', fin.fixedCost || 0, curr + '/month (personnel, facility, overhead)'],
    ['Upfront Launch Capex', fin.startupCost || 0, curr + ' (tooling, pilot inventory, legal)'],
    ['Initial Starting Capital', fin.capital || 0, curr + ' (available founder / equity capital)'],
    ['Monthly Break-Even Volume', f.breakEven !== null ? f.breakEven : 'N/A', 'units per month required to cover fixed burn'],
    ['Year 1 Gross Billings', f.revenue || 0, curr],
    ['Year 1 Net Operating Profit', f.profit || 0, curr],
    ['Peak Funding Gap', f.fundingGap || 0, curr + ' (maximum cumulative cash trough)'],
    [],
    ['12-MONTH PRO-FORMA CASH FLOW SCHEDULE'],
    ['Month', 'Units Sold', 'Gross Revenue (' + curr + ')', 'Variable Costs (' + curr + ')', 'Fixed Costs (' + curr + ')', 'Net Operating Profit (' + curr + ')', 'Ending Cash Balance (' + curr + ')']
  ];

  for (const m of f.months) {
    lines.push([
      `Month ${m.month}`,
      m.units,
      m.revenue,
      m.variable,
      m.fixed,
      m.profit,
      m.cash
    ]);
  }

  lines.push([]);
  lines.push(['3-YEAR GROWTH HORIZON PROJECTIONS']);
  lines.push(['Horizon', 'Volume Scale Multiplier', 'Projected Revenue (' + curr + ')', 'Projected Operating Result (' + curr + ')', 'Commercial Milestone']);
  lines.push(['Year 1: Launch & Validation', 'Base trajectory', f.revenue, f.profit, `Prove unit economics in primary corridor (${p.geography || p.country || 'local market'})`]);
  lines.push(['Year 2: Regional Expansion', '2.4x volume', Math.round(f.revenue * 2.4), Math.round(f.profit > 0 ? f.profit * 2.8 : f.revenue * 0.18), 'Expand across secondary market clusters & regional aggregators']);
  lines.push(['Year 3: Commercial Maturity', '4.5x volume', Math.round(f.revenue * 4.5), Math.round(f.profit > 0 ? f.profit * 5.2 : f.revenue * 0.35), 'Multi-territory distribution, licensing & fleet maintenance agreements']);

  return lines.map(row => row.map(sanitize).join(',')).join('\r\n');
}

// 2. 1-Page Executive Summary / Investor One-Pager
export function generateOnePager(project) {
  const p = project || {};
  const f = financials(p.financial || {});
  const curr = p.financial?.currency || 'USD';
  const money = n => `${curr} ${Math.round(n || 0).toLocaleString('en-US')}`;
  const patents = selectedPatents(p);
  const bp = generateSolutionBlueprint(p);

  return {
    name: p.name || 'Patent2Market Venture',
    country: p.country || 'Target Market',
    date: new Date().toISOString().slice(0, 10),
    problem: p.problem || 'Significant unaddressed friction and cost loss in target sector.',
    customer: p.customer || 'Commercial operators & regional users',
    geography: p.geography ? `${p.geography}, ` : '' + (p.country || 'Target Region'),
    sector: p.sector || 'Industrial & Commercial',
    solution: p.offer || p.concept || 'Commercial turnkey solution based on verified patent mechanisms.',
    concept: p.concept || 'Integrated modular technical solution architecture.',
    advantage: p.advantage || 'Direct operational execution and local partner network.',
    patents: patents.map(t => ({ id: t.id, title: t.title, subsystem: t.subsystem || 'Core Mechanism', status: t.statusLabel || t.access || 'Active' })),
    cotsGaps: bp.gaps || [],
    channel: p.channel || 'Direct B2B founder sales & key regional distributors',
    metrics: {
      price: money(p.financial?.price),
      unitCost: money(p.financial?.unitCost),
      margin: f.margin !== null ? Math.round(f.margin * 100) + '%' : 'N/A',
      breakEven: f.breakEven !== null ? f.breakEven + ' units/mo' : 'N/A',
      month1Units: p.financial?.monthlyUnits || 0,
      year1Revenue: money(f.revenue),
      year1Profit: money(f.profit),
      fundingGap: money(f.fundingGap),
      capital: money(p.financial?.capital)
    },
    theAsk: {
      capitalNeeded: money(Math.max(f.fundingGap || 0, (p.financial?.startupCost || 0) * 1.5)),
      useOfFunds: 'Initial tooling, COTS sub-assembly inventory, regulatory certification, and pilot deployment in primary corridor.'
    },
    milestones: [
      'Month 1: 15 customer discovery interviews & dual-sourced supplier component quotes.',
      'Month 2: Operational bench prototype integration & local standards certification check.',
      'Month 3: 3-5 unit paid customer pilot deployment & commercial unit economics audit.'
    ]
  };
}

export function generateOnePagerHtml(project) {
  const op = generateOnePager(project);
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(op.name)} — Executive One-Pager</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --primary: #163d36;
      --primary-light: #21594f;
      --accent: #2e7d32;
      --bg: #f8faf7;
      --card-bg: #ffffff;
      --border: #d2ddcb;
      --ink: #0f2c27;
      --muted: #475569;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--ink);
      padding: 24px;
      line-height: 1.4;
    }
    .page-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 14px;
      margin-bottom: 18px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .top-bar h1 {
      font-size: 26px;
      color: var(--primary);
      margin: 2px 0;
      letter-spacing: -0.5px;
    }
    .eyebrow {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      color: var(--accent);
    }
    .print-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 9px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12.5px;
      cursor: pointer;
    }
    .onepager-grid {
      display: grid;
      grid-template-columns: 1.25fr 0.95fr;
      gap: 20px;
    }
    .section-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--primary);
      font-weight: 700;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 14px 0 8px 0;
    }
    .section-title:first-child { margin-top: 0; }
    p, li { font-size: 12px; color: #2c3e50; line-height: 1.5; }
    ul { padding-left: 16px; margin: 4px 0; }
    .metrics-callout-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 8px 0;
    }
    .metric-pill {
      background: #f1f7f4;
      border: 1px solid #cfe3d8;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .metric-pill .lbl { font-size: 10px; text-transform: uppercase; color: #556b2f; font-weight: 600; }
    .metric-pill .val { font-size: 16px; font-weight: 700; color: var(--primary); margin-top: 2px; }
    .metric-pill .sub { font-size: 9.5px; color: var(--muted); }
    .ip-box {
      background: #fafdf9;
      border-left: 3px solid var(--accent);
      padding: 8px 10px;
      border-radius: 0 4px 4px 0;
      margin-top: 8px;
    }
    .footer {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: var(--muted);
      flex-wrap: wrap;
      gap: 8px;
    }
    .footer a { color: var(--primary); text-decoration: underline; }
    @media (max-width: 720px) {
      .onepager-grid { grid-template-columns: 1fr; }
    }
    @media print {
      @page { size: portrait; margin: 8mm; }
      body { background: white !important; padding: 0 !important; }
      .page-container { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
      .print-btn { display: none !important; }
      p, li { font-size: 10.5px !important; line-height: 1.4 !important; }
      .metric-pill .val { font-size: 14px !important; }
      .metric-pill { padding: 6px 8px !important; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="top-bar">
      <div>
        <span class="eyebrow">VENTURE EXECUTIVE TEASER · 1-PAGER</span>
        <h1>${esc(op.name)}</h1>
        <p style="font-size:12px;color:var(--muted);"><strong>Target Market:</strong> ${esc(op.country)} &nbsp;|&nbsp; <strong>Sector:</strong> ${esc(op.sector)} &nbsp;|&nbsp; <strong>Date:</strong> ${esc(op.date)}</p>
      </div>
      <div>
        <button class="print-btn" onclick="window.print()">Print / Save as PDF 🖨</button>
      </div>
    </div>

    <div class="onepager-grid">
      <div>
        <div class="section-title">The Problem &amp; Market Need</div>
        <p><strong>Observed Friction:</strong> ${esc(op.problem)}</p>
        <p style="margin-top:4px;"><strong>Target User &amp; Territory:</strong> ${esc(op.customer)} across ${esc(op.geography)}.</p>

        <div class="section-title">The Commercial Solution</div>
        <p><strong>Venture Offering:</strong> ${esc(op.solution)}</p>
        <p style="margin-top:4px;"><strong>Functional Architecture:</strong> ${esc(op.concept)}</p>

        <div class="section-title">Go-to-Market &amp; Distribution</div>
        <p><strong>Initial Channel:</strong> ${esc(op.channel)}</p>
        <p style="margin-top:4px;"><strong>Customer Acquisition Strategy:</strong> Phased pilot deployment with reference operators to establish local word-of-mouth and distribution leverage.</p>

        <div class="section-title">90-Day Execution Roadmap</div>
        <ul>
          ${op.milestones.map(m => `<li>${esc(m)}</li>`).join('')}
        </ul>
      </div>

      <div>
        <div class="section-title">Unit Economics &amp; Pro-Forma</div>
        <div class="metrics-callout-grid">
          <div class="metric-pill">
            <div class="lbl">Unit Price</div>
            <div class="val">${esc(op.metrics.price)}</div>
            <div class="sub">COGS: ${esc(op.metrics.unitCost)}</div>
          </div>
          <div class="metric-pill">
            <div class="lbl">Gross Margin</div>
            <div class="val">${esc(op.metrics.margin)}</div>
            <div class="sub">Break-even: ${esc(op.metrics.breakEven)}</div>
          </div>
          <div class="metric-pill">
            <div class="lbl">Year 1 Billings</div>
            <div class="val">${esc(op.metrics.year1Revenue)}</div>
            <div class="sub">Net profit: ${esc(op.metrics.year1Profit)}</div>
          </div>
          <div class="metric-pill">
            <div class="lbl">Peak Cash Gap</div>
            <div class="val">${esc(op.metrics.fundingGap)}</div>
            <div class="sub">Starting cap: ${esc(op.metrics.capital)}</div>
          </div>
        </div>

        <div class="section-title">Intellectual Property &amp; Defense</div>
        <div class="ip-box">
          ${op.patents.length ? op.patents.map(t => `<div style="font-size:11px;margin-bottom:4px;"><strong>[${esc(t.id)}]</strong> ${esc(t.title)}<br><small style="color:#64748b;">Role: ${esc(t.subsystem)} · Status: ${esc(t.status)}</small></div>`).join('') : '<p style="font-size:11px;">Proprietary modular architecture leveraging documented open engineering standards.</p>'}
          ${op.cotsGaps.length ? `<div style="font-size:10.5px;color:#1b5e20;margin-top:6px;border-top:1px dashed #d2ddcb;padding-top:4px;"><strong>AI Gap-Fills:</strong> ${op.cotsGaps.slice(0, 2).map(g => esc(g.subsystem)).join(', ')} (COTS off-the-shelf)</div>` : ''}
        </div>

        <div class="section-title">Founder Capability &amp; The Ask</div>
        <p><strong>Founder Advantage:</strong> ${esc(op.advantage)}</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:8px 10px;border-radius:6px;margin-top:6px;">
          <div style="font-size:11px;font-weight:700;color:var(--primary);">Capital Requirement: ${esc(op.theAsk.capitalNeeded)}</div>
          <div style="font-size:10.5px;color:var(--muted);">${esc(op.theAsk.useOfFunds)}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>Grounded in verified patents, documented market evidence &amp; calibrated unit economics.</span>
      <span>Conceptualization and development: <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a></span>
    </div>
  </div>
</body>
</html>`;
}

// 3. "Skeptical Investor" Q&A Simulator / Shark Tank Stress-Test
export function generateInvestorQa(project) {
  const p = project || {};
  const f = financials(p.financial || {});
  const curr = p.financial?.currency || 'USD';
  const money = n => `${curr} ${Math.round(n || 0).toLocaleString('en-US')}`;
  const patents = selectedPatents(p);

  return [
    {
      num: 1,
      topic: 'Customer Inertia & Willingness to Pay',
      question: `Why won't ${p.customer || 'target customers'} in ${p.country || 'your market'} simply stick to cheap informal workarounds or existing manual methods rather than paying ${money(p.financial?.price)} for your solution?`,
      whyInvestorAsks: 'Investors want to know whether your product is an indispensable "painkiller" or merely a "nice-to-have" novelty that customers will delay adopting.',
      suggestedAnswer: `While manual workarounds appear inexpensive upfront, they impose severe hidden costs: ${p.problem || 'high operational waste and product losses'}. At our unit price of ${money(p.financial?.price)}, our solution generates a positive net economic return for the operator within the first quarter of deployment. We test this through structured paid field pilots before scaling.`,
      actionToValidate: 'Conduct 10 price-sensitivity interviews with prospective customers using the Van Westendorp Price Sensitivity Meter.'
    },
    {
      num: 2,
      topic: 'IP Defensibility & Moat',
      question: patents.length
        ? `You cite patent ${patents[0].id} as your core technology. If that patent is licensed, expired, or narrow in scope, what prevents a well-funded regional competitor from cloning your product in 6 months?`
        : 'Without proprietary patents, what prevents a low-cost manufacturer from copying your system architecture immediately?',
      whyInvestorAsks: 'Skeptical investors probe whether you have a true sustainable competitive advantage or just an easily replicable hardware box.',
      suggestedAnswer: `Our defensibility does not rely on a single patent claim in isolation. It relies on our proprietary system synthesis: coupling the core mechanism with off-the-shelf COTS components, custom firmware control loops, localized ruggedization (${p.localContext ? p.localContext.slice(0, 80) : 'local field constraints'}), and direct distribution relationships in ${p.country || 'our launch territory'}. A copycat still lacks the local integration know-how and service infrastructure.`,
      actionToValidate: 'Perform a Freedom-to-Operate (FTO) review and file trade secret documentation for your integration firmware.'
    },
    {
      num: 3,
      topic: 'Unit Margin Erosion & Supply Chain Shocks',
      question: `Your unit cost is modeled at ${money(p.financial?.unitCost)}, yielding a ${f.margin !== null ? Math.round(f.margin * 100) + '%' : 'healthy'} gross margin. What happens to your business if import tariffs, component shortages, or freight spikes increase your COGS by 35%?`,
      whyInvestorAsks: 'Hardware and physical ventures regularly see early margin erosion due to small-batch production and supply chain volatility.',
      suggestedAnswer: `Our modular architecture is specifically engineered to utilize standard COTS (commercial off-the-shelf) components that can be dual-sourced globally or fabricated locally. In our downside sensitivity model (testing a 40% volume reduction and cost inflation), our unit contribution remains positive at ${money(Math.round((p.financial?.price || 0) - (p.financial?.unitCost || 0) * 1.35))}, ensuring the venture covers variable costs even under adverse supply chain shocks.`,
      actionToValidate: 'Obtain binding written quotes from at least two independent suppliers for every major BOM component.'
    },
    {
      num: 4,
      topic: 'Distribution Bandwidth & CAC',
      question: `Reaching customers in ${p.geography || p.country || 'emerging corridors'} requires significant on-the-ground presence. How will you avoid customer acquisition costs (CAC) exceeding your lifetime value (LTV)?`,
      whyInvestorAsks: 'Most hardware and deep-tech startups fail at distribution, not engineering. Direct sales can rapidly exhaust starting capital.',
      suggestedAnswer: `We do not build an expensive standalone direct sales force from scratch. Instead, we leverage ${p.channel || 'established local agricultural cooperatives and distributor hubs'} who already hold trusted weekly customer relationships. By structuring referral incentives and demonstrating units at regional gatherings, our CAC is minimized through existing aggregation channels.`,
      actionToValidate: 'Secure an LOI (Letter of Intent) or memorandum of understanding with at least 1 regional distributor or association.'
    },
    {
      num: 5,
      topic: 'Cash Runway & Peak Funding Deficit',
      question: `You project a peak funding deficit of ${money(f.fundingGap)} before reaching cash flow breakeven (${f.breakEven !== null ? f.breakEven + ' units/month' : 'modeled volume'}). What is your contingency plan if adoption takes twice as long?`,
      whyInvestorAsks: 'Investors want to confirm that you understand your cash burn rate and have survival levers that avoid premature insolvency.',
      suggestedAnswer: `Our monthly fixed overhead is lean at ${money(p.financial?.fixedCost)}/month. Because we utilize modular assembly rather than building our own factory, our Capex is variable and scalable. If adoption delays occur, we can maintain operations on lean founder mode while focusing entirely on converting our 5 initial pilot accounts into paid references.`,
      actionToValidate: 'Maintain at least a 30% capital safety buffer above the modeled peak funding gap before full commercial rollout.'
    }
  ];
}

export function generateInvestorQaHtml(project) {
  const qaList = generateInvestorQa(project);
  const p = project || {};
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(p.name || 'Venture')} — Skeptical Investor Q&A Simulator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --primary: #163d36;
      --accent: #2e7d32;
      --bg: #f8faf7;
      --border: #d2ddcb;
      --ink: #0f2c27;
      --muted: #475569;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--ink); padding: 24px; line-height: 1.45; }
    .container { max-width: 900px; margin: 0 auto; background: #ffffff; border: 1px solid var(--border); border-radius: 10px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { border-bottom: 2px solid var(--primary); padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .header h1 { font-size: 24px; color: var(--primary); margin: 2px 0; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--accent); }
    .print-btn { background: var(--primary); color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; }
    .qa-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 16px; border-left: 4px solid var(--primary); }
    .qa-num { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--accent); letter-spacing: 0.5px; }
    .qa-q { font-size: 15px; font-weight: 700; color: #0f2c27; margin: 6px 0 10px 0; line-height: 1.35; }
    .qa-why { font-size: 11.5px; color: #64748b; background: #f8fafc; padding: 8px 10px; border-radius: 4px; margin-bottom: 10px; font-style: italic; }
    .qa-ans { font-size: 13px; color: #1e293b; line-height: 1.5; margin-bottom: 10px; }
    .qa-test { font-size: 11px; color: #1b5e20; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 10px; border-radius: 4px; }
    .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--muted); flex-wrap: wrap; gap: 8px; }
    .footer a { color: var(--primary); text-decoration: underline; }
    @media print {
      @page { margin: 10mm; }
      body { background: white !important; padding: 0 !important; }
      .container { border: none !important; box-shadow: none !important; padding: 0 !important; }
      .print-btn { display: none !important; }
      .qa-card { page-break-inside: avoid !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="eyebrow">DILIGENCE &amp; DEFENSE PREPARATION</span>
        <h1>Skeptical Investor Q&amp;A Simulator</h1>
        <p style="font-size:12px;color:var(--muted);">Venture: <strong>${esc(p.name || 'Patent2Market Venture')}</strong> &nbsp;|&nbsp; Target Territory: <strong>${esc(p.country || 'Target Market')}</strong></p>
      </div>
      <div>
        <button class="print-btn" onclick="window.print()">Print / Save as PDF 🖨</button>
      </div>
    </div>

    <div style="font-size:12.5px;color:#334155;margin-bottom:18px;">
      Investors and grant panels test your resilience by probing the 5 most fragile assumptions in your venture model. Review these rebuttals and execute the validation experiments before your next pitch.
    </div>

    ${qaList.map(item => `
      <div class="qa-card">
        <div class="qa-num">Question ${item.num} · ${esc(item.topic)}</div>
        <div class="qa-q">"${esc(item.question)}"</div>
        <div class="qa-why"><strong>Why the Investor Probes This:</strong> ${esc(item.whyInvestorAsks)}</div>
        <div class="qa-ans"><strong>Evidence-Based Rebuttal:</strong> ${esc(item.suggestedAnswer)}</div>
        <div class="qa-test"><strong>Validation Experiment:</strong> ${esc(item.actionToValidate)}</div>
      </div>
    `).join('')}

    <div class="footer">
      <span>Calibrated specifically from your venture inputs, patents &amp; financial scenarios.</span>
      <span>Conceptualization and development: <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a></span>
    </div>
  </div>
</body>
</html>`;
}

// 4. University Tech Transfer (TTO) Licensing Term Sheet Guide & Checklist
export function generateTtoTermSheetGuide(project) {
  const p = project || {};
  const patents = selectedPatents(p);
  const curr = p.financial?.currency || 'USD';

  return {
    ventureName: p.name || 'Patent2Market Venture',
    country: p.country || 'Target Territory',
    date: new Date().toISOString().slice(0, 10),
    patents: patents.map(t => ({
      id: t.id,
      title: t.title,
      jurisdiction: t.jurisdiction || 'US',
      access: t.statusLabel || t.access || 'Status unconfirmed',
      terms: t.costTerms || 'Standard academic / non-profit licensing framework'
    })),
    benchmarks: [
      {
        term: 'Upfront Option / Evaluation Fee',
        benchmark: '$1,000 – $5,000 (for a 12–18 month exclusive evaluation period)',
        guidance: 'Do not pay large upfront license fees before achieving commercial validation. Request an "Option Agreement" allowing bench integration without upfront royalties.'
      },
      {
        term: 'Running Royalty on Net Sales',
        benchmark: '2.0% – 3.5% of Net Sales for hardware & mechanical systems',
        guidance: 'Ensure "Net Sales" strictly deducts customer shipping, import duties, bad debt, sales taxes, and returned goods.'
      },
      {
        term: 'Minimum Annual Royalties (MARs)',
        benchmark: '$0 in Years 1–2; ramping to $5,000/yr only after commercial launch',
        guidance: 'Negotiate for MARs to begin only after the first commercial sale in the licensed territory, creditable against that year\'s running royalties.'
      },
      {
        term: 'Milestone Payments',
        benchmark: 'Tied strictly to technical proof-of-concept and commercial revenue targets',
        guidance: 'Avoid calendar-based milestones. Use achievement milestones: e.g. $10,000 upon successful field pilot; $25,000 upon reaching $500,000 in gross revenue.'
      },
      {
        term: 'Patent Prosecution & Maintenance Costs',
        benchmark: 'Capped at $5,000 – $10,000; payable out of 20% of annual operating profits',
        guidance: 'Never agree to open-ended reimbursement of past university patent prosecution legal bills without an absolute dollar cap.'
      },
      {
        term: 'Sublicensing Royalty Split',
        benchmark: '10% – 20% of non-royalty sublicensing revenue',
        guidance: 'Standard university agreements ask for 20-30%. Keep it capped at 15-20% to retain distribution flexibility.'
      }
    ],
    pitfalls: [
      'Trap 1: Accepting uncapped reimbursement of university historic patent legal fees.',
      'Trap 2: Overly narrow Field-of-Use restrictions that prevent horizontal market expansion.',
      'Trap 3: Strict "diligence forfeiture" clauses that revoke rights if product certification is delayed.',
      'Trap 4: Royalty stacking without a minimum floor (ensure royalty reduces if third-party licenses are required).'
    ]
  };
}

export function generateTtoTermSheetGuideHtml(project) {
  const tto = generateTtoTermSheetGuide(project);
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(tto.ventureName)} — University TTO Licensing Guide &amp; Term Sheet</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --primary: #163d36;
      --accent: #2e7d32;
      --bg: #f8faf7;
      --border: #d2ddcb;
      --ink: #0f2c27;
      --muted: #475569;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--ink); padding: 24px; line-height: 1.45; }
    .container { max-width: 900px; margin: 0 auto; background: #ffffff; border: 1px solid var(--border); border-radius: 10px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { border-bottom: 2px solid var(--primary); padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .header h1 { font-size: 24px; color: var(--primary); margin: 2px 0; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--accent); }
    .print-btn { background: var(--primary); color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 18px 0; font-size: 12px; }
    th { background: #f1f7f4; color: var(--primary); font-weight: 700; text-align: left; padding: 8px 10px; border: 1px solid #d2ddcb; }
    td { padding: 8px 10px; border: 1px solid #e2e8f0; color: #2c3e50; vertical-align: top; }
    .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--primary); font-weight: 700; margin: 18px 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .pitfall-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px 14px; border-radius: 0 6px 6px 0; margin-bottom: 14px; font-size: 12px; }
    .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--muted); flex-wrap: wrap; gap: 8px; }
    .footer a { color: var(--primary); text-decoration: underline; }
    @media print {
      @page { margin: 10mm; }
      body { background: white !important; padding: 0 !important; }
      .container { border: none !important; box-shadow: none !important; padding: 0 !important; }
      .print-btn { display: none !important; }
      table { page-break-inside: avoid !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="eyebrow">IP NEGOTIATION PLAYBOOK</span>
        <h1>University TTO Licensing Guide &amp; Term Sheet</h1>
        <p style="font-size:12px;color:var(--muted);">Venture: <strong>${esc(tto.ventureName)}</strong> &nbsp;|&nbsp; Target Jurisdiction: <strong>${esc(tto.country)}</strong> &nbsp;|&nbsp; Date: <strong>${esc(tto.date)}</strong></p>
      </div>
      <div>
        <button class="print-btn" onclick="window.print()">Print / Save as PDF 🖨</button>
      </div>
    </div>

    <div style="font-size:12.5px;color:#334155;margin-bottom:16px;">
      When acquiring commercial rights to university, federal laboratory, or corporate patent technology, use this term sheet guide to establish defensible licensing terms and protect your startup's cash runway.
    </div>

    <div class="section-title">1. Selected Patent Portfolio Status</div>
    <table>
      <thead><tr><th>Patent ID</th><th>Invention Title</th><th>Jurisdiction</th><th>Current Access Basis</th></tr></thead>
      <tbody>
        ${tto.patents.length ? tto.patents.map(t => `<tr><td><strong>${esc(t.id)}</strong></td><td>${esc(t.title)}</td><td>${esc(t.jurisdiction)}</td><td><span style="font-size:11px;background:#e8f5e9;color:#1b5e20;padding:2px 6px;border-radius:4px;">${esc(t.access)}</span></td></tr>`).join('') : '<tr><td colspan="4">No patents selected. Add patents in Step 1 to generate customized licensing assessments.</td></tr>'}
      </tbody>
    </table>

    <div class="section-title">2. Recommended Deep-Tech &amp; Hardware Licensing Benchmarks</div>
    <table>
      <thead><tr><th style="width:28%;">Deal Term</th><th style="width:36%;">Industry Benchmark</th><th>Negotiation Guidance</th></tr></thead>
      <tbody>
        ${tto.benchmarks.map(b => `<tr><td><strong>${esc(b.term)}</strong></td><td>${esc(b.benchmark)}</td><td>${esc(b.guidance)}</td></tr>`).join('')}
      </tbody>
    </table>

    <div class="section-title">3. Critical Negotiation Pitfalls to Avoid</div>
    <div class="pitfall-box">
      <ul style="padding-left:16px;margin:0;">
        ${tto.pitfalls.map(p => `<li style="margin-bottom:4px;">${esc(p)}</li>`).join('')}
      </ul>
    </div>

    <div class="footer">
      <span>Industry-standard benchmarks adapted for physical, deep-tech and resource-constrained ventures.</span>
      <span>Conceptualization and development: <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a></span>
    </div>
  </div>
</body>
</html>`;
}

// 5. Grant & SBIR/STTR "Specific Aims" Concept Note Generator
export function generateGrantConceptNote(project) {
  const p = project || {};
  const f = financials(p.financial || {});
  const patents = selectedPatents(p);
  const bp = generateSolutionBlueprint(p);

  return {
    title: `Commercialization of ${patents.length ? `[${patents[0].id}] ` : ''}Modular Systems for ${p.problem ? p.problem.slice(0, 80) : 'Sustainable Infrastructure'} in ${p.country || 'Target Region'}`,
    agencyTopic: `${p.sector || 'Energy & Agriculture'} · Phase I SBIR/STTR Technical Innovation & Feasibility`,
    significance: p.problem || 'Significant unaddressed efficiency and post-harvest economic losses in target operating regions.',
    innovation: `Synergistic integration of verified patent mechanisms (${patents.map(t => t.id).join(', ') || 'proprietary core mechanics'}) coupled with ${bp.gaps?.length ? bp.gaps.map(g => g.subsystem).join(', ') : 'modular off-the-shelf control and power subsystems'} optimized for local environmental durability (${p.localContext ? p.localContext.slice(0, 100) : 'rugged field conditions'}).`,
    aim1: {
      title: 'Specific Aim 1: System Integration & Bench Proof-of-Concept',
      description: 'Integrate the patented core mechanism with auxiliary power conditioning and closed-loop control units. Validate functional performance, energy efficiency, and operational tolerances on a standardized test bench.',
      successCriteria: 'Demonstrate functional operation meeting 90%+ of modeled efficiency targets across 100 continuous operational test cycles.'
    },
    aim2: {
      title: 'Specific Aim 2: Environmental Stress & Local Robustness Benchmarking',
      description: `Subject the integrated prototype to simulated local operating conditions characteristic of ${p.country || 'the operating territory'} (${p.constraints || 'dust, ambient temperature swings, and intermittent power'}). Benchmark performance against existing baseline equipment.`,
      successCriteria: 'Zero critical subsystem failures under elevated temperature and dust stress; prove at least 25% superior efficiency over baseline alternatives.'
    },
    aim3: {
      title: 'Specific Aim 3: Field Pilot Demonstration & Commercial Feasibility',
      description: `Deploy 3 pilot demonstration units with reference partner operators in ${p.geography || p.country || 'the primary target corridor'}. Gather user feedback, maintenance intervals, and willingness-to-pay validation.`,
      successCriteria: 'At least 80% operator satisfaction; verified daily operational uptime exceeding 95%; signed commercial Letters of Intent (LOIs).'
    },
    phaseExit: 'Successful completion of Aims 1–3 produces a certified commercial prototype, validated unit economics, and customer pilot data necessary for Phase II manufacturing scale-up.'
  };
}

export function generateGrantConceptNoteHtml(project) {
  const g = generateGrantConceptNote(project);
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(g.title)} — Grant Concept Note</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --primary: #163d36;
      --accent: #2e7d32;
      --bg: #f8faf7;
      --border: #d2ddcb;
      --ink: #0f2c27;
      --muted: #475569;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--ink); padding: 24px; line-height: 1.5; }
    .container { max-width: 900px; margin: 0 auto; background: #ffffff; border: 1px solid var(--border); border-radius: 10px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { border-bottom: 2px solid var(--primary); padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .header h1 { font-size: 21px; color: var(--primary); margin: 4px 0 2px 0; line-height: 1.3; }
    .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: var(--accent); }
    .print-btn { background: var(--primary); color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; }
    .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--primary); font-weight: 700; margin: 18px 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .aim-box { background: #fafdf9; border-left: 3px solid var(--accent); padding: 12px 14px; border-radius: 0 6px 6px 0; margin-bottom: 14px; }
    .aim-title { font-size: 13.5px; font-weight: 700; color: var(--primary); margin-bottom: 4px; }
    .aim-desc { font-size: 12px; color: #2c3e50; line-height: 1.45; margin-bottom: 6px; }
    .aim-success { font-size: 11px; color: #166534; background: #dcfce7; padding: 4px 8px; border-radius: 4px; display: inline-block; font-weight: 600; }
    .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--muted); flex-wrap: wrap; gap: 8px; }
    .footer a { color: var(--primary); text-decoration: underline; }
    @media print {
      @page { margin: 10mm; }
      body { background: white !important; padding: 0 !important; }
      .container { border: none !important; box-shadow: none !important; padding: 0 !important; }
      .print-btn { display: none !important; }
      .aim-box { page-break-inside: avoid !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="eyebrow">NON-DILUTIVE CAPITAL · GRANT &amp; SBIR CONCEPT NOTE</span>
        <h1>${esc(g.title)}</h1>
        <p style="font-size:12px;color:var(--muted);">Target Agency / Track: <strong>${esc(g.agencyTopic)}</strong></p>
      </div>
      <div>
        <button class="print-btn" onclick="window.print()">Print / Save as PDF 🖨</button>
      </div>
    </div>

    <div class="section-title">1. Significance &amp; Unmet Need</div>
    <p style="font-size:12.5px;color:#2c3e50;">${esc(g.significance)}</p>

    <div class="section-title">2. Technical Innovation &amp; Modular Solution Architecture</div>
    <p style="font-size:12.5px;color:#2c3e50;">${esc(g.innovation)}</p>

    <div class="section-title">3. Specific Aims (Phase I Workplan)</div>
    <div class="aim-box">
      <div class="aim-title">${esc(g.aim1.title)}</div>
      <div class="aim-desc">${esc(g.aim1.description)}</div>
      <div class="aim-success">Phase I Target: ${esc(g.aim1.successCriteria)}</div>
    </div>

    <div class="aim-box">
      <div class="aim-title">${esc(g.aim2.title)}</div>
      <div class="aim-desc">${esc(g.aim2.description)}</div>
      <div class="aim-success">Phase I Target: ${esc(g.aim2.successCriteria)}</div>
    </div>

    <div class="aim-box">
      <div class="aim-title">${esc(g.aim3.title)}</div>
      <div class="aim-desc">${esc(g.aim3.description)}</div>
      <div class="aim-success">Phase I Target: ${esc(g.aim3.successCriteria)}</div>
    </div>

    <div class="section-title">4. Phase I Exit Criteria &amp; Commercial Transition</div>
    <p style="font-size:12.5px;color:#2c3e50;">${esc(g.phaseExit)}</p>

    <div class="footer">
      <span>Standard Phase I SBIR / STTR concept note format. Ready for federal or foundation submission.</span>
      <span>Conceptualization and development: <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a></span>
    </div>
  </div>
</body>
</html>`;
}
