/**
 * MCP Tool Registry
 *
 * Follows the Model Context Protocol (MCP) specification for tool management.
 * Provides a centralized registry where tools register with name, description,
 * JSON Schema for inputs/outputs, and an async execute handler.
 *
 * Usage:
 *   import { registry } from './mcp/registry.js';
 *   registry.registerTool(myTool);
 *   const result = await registry.callTool('tool-name', { param: 'value' });
 *   const tools = registry.listTools();
 */

class MCPToolRegistry {
  constructor() {
    this.tools = new Map();
    this.callLog = [];
  }

  /**
   * Register a tool with the registry.
   * @param {Object} toolDefinition
   * @param {string} toolDefinition.name - Unique tool identifier
   * @param {string} toolDefinition.description - Human-readable description
   * @param {Object} toolDefinition.inputSchema - JSON Schema for input parameters
   * @param {Object} [toolDefinition.outputSchema] - JSON Schema for output
   * @param {Function} toolDefinition.execute - Async handler: (params) => result
   */
  registerTool(toolDefinition) {
    const { name, description, inputSchema, execute } = toolDefinition;

    if (!name || !description || !inputSchema || !execute) {
      throw new Error(
        `Tool registration failed: missing required fields (name, description, inputSchema, execute). Got: ${JSON.stringify({ name, description, hasSchema: !!inputSchema, hasExecute: !!execute })}`
      );
    }

    if (this.tools.has(name)) {
      throw new Error(`Tool "${name}" is already registered`);
    }

    if (typeof execute !== 'function') {
      throw new Error(`Tool "${name}" execute must be a function`);
    }

    this.tools.set(name, {
      name,
      description,
      inputSchema,
      outputSchema: toolDefinition.outputSchema || {},
      execute,
      registeredAt: new Date().toISOString(),
    });

    console.log(`[MCP Registry] Tool registered: ${name}`);
  }

  /**
   * Invoke a registered tool by name.
   * Validates input against schema (basic validation), executes handler,
   * logs the invocation, and returns the result.
   *
   * @param {string} name - Tool name
   * @param {Object} params - Input parameters
   * @returns {Promise<Object>} Tool execution result
   */
  async callTool(name, params = {}) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found in registry. Available: ${[...this.tools.keys()].join(', ')}`);
    }

    // Basic input validation against required fields in schema
    const required = tool.inputSchema.required || [];
    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        throw new Error(`Tool "${name}" missing required parameter: ${field}`);
      }
    }

    const startTime = Date.now();
    let result;
    let error = null;

    try {
      result = await tool.execute(params);
    } catch (err) {
      error = err.message;
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const logEntry = {
        toolName: name,
        params: this._sanitizeParams(params),
        duration,
        success: !error,
        error,
        timestamp: new Date().toISOString(),
      };
      this.callLog.push(logEntry);

      // Keep log bounded
      if (this.callLog.length > 1000) {
        this.callLog = this.callLog.slice(-500);
      }
    }

    return result;
  }

  /**
   * List all registered tools (MCP tools/list equivalent).
   * Returns tool metadata without the execute handler.
   *
   * @returns {Array<Object>} Array of tool definitions
   */
  listTools() {
    return [...this.tools.values()].map(({ name, description, inputSchema, outputSchema, registeredAt }) => ({
      name,
      description,
      inputSchema,
      outputSchema,
      registeredAt,
    }));
  }

  /**
   * Get schema for a specific tool.
   * @param {string} name - Tool name
   * @returns {Object|null} Tool schema or null if not found
   */
  getToolSchema(name) {
    const tool = this.tools.get(name);
    if (!tool) return null;
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
    };
  }

  /**
   * Check if a tool is registered.
   * @param {string} name
   * @returns {boolean}
   */
  hasTool(name) {
    return this.tools.has(name);
  }

  /**
   * Unregister a tool.
   * @param {string} name
   */
  unregisterTool(name) {
    if (this.tools.delete(name)) {
      console.log(`[MCP Registry] Tool unregistered: ${name}`);
    }
  }

  /**
   * Get recent tool call log.
   * @param {number} limit
   * @returns {Array<Object>}
   */
  getCallLog(limit = 50) {
    return this.callLog.slice(-limit);
  }

  /**
   * Get registry stats.
   */
  getStats() {
    const totalCalls = this.callLog.length;
    const successCalls = this.callLog.filter(l => l.success).length;
    const toolCallCounts = {};
    for (const entry of this.callLog) {
      toolCallCounts[entry.toolName] = (toolCallCounts[entry.toolName] || 0) + 1;
    }
    return {
      registeredTools: this.tools.size,
      totalCalls,
      successRate: totalCalls ? (successCalls / totalCalls * 100).toFixed(1) + '%' : 'N/A',
      callsByTool: toolCallCounts,
    };
  }

  /**
   * Sanitize params for logging (remove large data).
   */
  _sanitizeParams(params) {
    const sanitized = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.length > 200) {
        sanitized[key] = value.substring(0, 200) + '...[truncated]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}

// Singleton registry instance
export const registry = new MCPToolRegistry();
export default registry;
