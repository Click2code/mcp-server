/**
 * Prior Authorization System - Express Server
 *
 * Initializes Express, registers MCP tools, mounts routes,
 * and optionally generates PDF documents on first run.
 */

import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { registry } from './mcp/registry.js';
import authRoutes from './routes/auth.js';
import priorAuthRoutes from './routes/prior-auth.js';
import mcpRoutes from './routes/mcp.js';

// MCP Tools
import idpTool from './mcp/tools/intelligent-document-processing.js';
import clinicalExtractionTool from './mcp/tools/clinical-data-extraction.js';
import memberEligibilityTool from './mcp/tools/member-eligibility-lookup.js';
import claimsHistoryTool from './mcp/tools/claims-history-retrieval.js';
import ncdSearchTool from './mcp/tools/ncd-guidelines-search.js';
import policyCriteriaTool from './mcp/tools/policy-criteria-matching.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Serve generated PDF documents
app.use('/documents', express.static(join(__dirname, 'documents')));

// Register MCP Tools
console.log('\nRegistering MCP Tools...');
const tools = [idpTool, clinicalExtractionTool, memberEligibilityTool, claimsHistoryTool, ncdSearchTool, policyCriteriaTool];
for (const tool of tools) {
  registry.registerTool(tool);
}
console.log(`${registry.listTools().length} MCP tools registered.\n`);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', priorAuthRoutes);
app.use('/api/v1/mcp', mcpRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    mcpTools: registry.listTools().length,
    timestamp: new Date().toISOString(),
  });
});

// Generate PDFs if not already present
async function generatePdfsIfNeeded() {
  const docsDir = join(__dirname, 'documents');
  const samplePdf = join(docsDir, 'PA-2026-0412.pdf');

  if (!existsSync(samplePdf)) {
    console.log('Generating clinical PDF documents...');
    try {
      const { generateAllPdfs } = await import('./documents/generate-pdfs.js');
      await generateAllPdfs();
      console.log('PDF documents generated successfully.\n');
    } catch (err) {
      console.warn('PDF generation skipped:', err.message);
    }
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`${'='.repeat(60)}`);
  console.log(`  Prior Authorization Server running on port ${PORT}`);
  console.log(`  API Base: http://localhost:${PORT}/api/v1`);
  console.log(`  MCP Tools: http://localhost:${PORT}/api/v1/mcp/tools`);
  console.log(`  Health: http://localhost:${PORT}/api/v1/health`);
  console.log(`${'='.repeat(60)}\n`);

  await generatePdfsIfNeeded();
});

export default app;
