/**
 * MCP Tool Routes
 * GET  /api/v1/mcp/tools          - List all registered MCP tools
 * GET  /api/v1/mcp/tools/:name    - Get specific tool schema
 * POST /api/v1/mcp/tools/call     - Invoke a tool
 * GET  /api/v1/mcp/stats          - Tool registry stats
 * GET  /api/v1/mcp/call-log       - Recent tool invocations
 */

import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { registry } from '../mcp/registry.js';

const router = Router();

// GET /mcp/tools - list all tools (MCP tools/list equivalent)
router.get('/tools', verifyToken, (req, res) => {
  const tools = registry.listTools();
  res.json({
    tools,
    totalTools: tools.length,
    registryVersion: '1.0.0',
    protocol: 'MCP',
  });
});

// GET /mcp/tools/:name - get specific tool schema
router.get('/tools/:name', verifyToken, (req, res) => {
  const schema = registry.getToolSchema(req.params.name);
  if (!schema) {
    return res.status(404).json({ error: `Tool '${req.params.name}' not found` });
  }
  res.json(schema);
});

// POST /mcp/tools/call - invoke a tool (MCP tools/call equivalent)
router.post('/tools/call', verifyToken, async (req, res) => {
  const { name, params } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Tool name is required' });
  }

  if (!registry.hasTool(name)) {
    return res.status(404).json({ error: `Tool '${name}' not found` });
  }

  try {
    const result = await registry.callTool(name, params || {});
    res.json({
      tool: name,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`Tool invocation error (${name}):`, err);
    res.status(500).json({
      tool: name,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /mcp/stats
router.get('/stats', verifyToken, (req, res) => {
  res.json(registry.getStats());
});

// GET /mcp/call-log
router.get('/call-log', verifyToken, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(registry.getCallLog(limit));
});

export default router;
