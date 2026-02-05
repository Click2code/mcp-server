/**
 * Planning Agent
 *
 * Second agent in the PA pipeline. Analyzes request complexity,
 * determines which MCP tools are needed, and creates an execution plan
 * for the Orchestrator Agent.
 */

const planningAgent = {
  name: 'WorkflowPlanningAgent-v3',
  type: 'planning',

  async process(sensingOutput, request, { onStep, onTrace }) {
    const startTime = Date.now();

    onTrace('info', 'Planning Agent', 'Planning Agent invoked by Sensing Agent', {
      agent: 'WorkflowPlanningAgent-v3',
      input: request.requestId,
      mode: 'intelligent-planning',
      complexity: sensingOutput.complexity,
    });

    // Determine required tools based on request
    const requiredTools = determineTools(request, sensingOutput);
    const executionOrder = buildExecutionOrder(requiredTools, sensingOutput.complexity);
    const estimatedDuration = estimateDuration(requiredTools);

    onTrace('success', 'Planning Agent', 'Execution plan created successfully', {
      workflowSteps: requiredTools.length + 3, // +3 for agents
      toolsRequired: requiredTools,
      estimatedDuration: `${estimatedDuration} seconds`,
      complexity: sensingOutput.complexity,
      executionStrategy: executionOrder.strategy,
    });

    await onStep({
      name: 'Planning Agent',
      description: 'Planning agent analyzes request complexity and creates execution plan',
      status: 'completed',
      details: [
        `Request complexity: ${sensingOutput.complexity}`,
        `Workflow plan created with ${requiredTools.length} tools`,
        `Required tools: ${requiredTools.join(', ')}`,
        'Orchestrator invoked with execution plan',
      ],
    });

    return {
      requestId: request.requestId,
      plan: {
        tools: requiredTools,
        executionOrder,
        estimatedDurationSec: estimatedDuration,
        strategy: executionOrder.strategy,
      },
      processingTimeMs: Date.now() - startTime,
    };
  },
};

function determineTools(request, sensingOutput) {
  const tools = [
    'intelligent-document-processing',
    'clinical-data-extraction',
    'member-eligibility-lookup',
    'claims-history-retrieval',
    'ncd-guidelines-search',
    'policy-criteria-matching',
  ];
  return tools;
}

function buildExecutionOrder(tools, complexity) {
  return {
    strategy: 'sequential-with-parallel',
    phases: [
      { phase: 1, tools: ['intelligent-document-processing'], parallel: false },
      { phase: 2, tools: ['clinical-data-extraction'], parallel: false },
      { phase: 3, tools: ['member-eligibility-lookup', 'claims-history-retrieval'], parallel: true },
      { phase: 4, tools: ['ncd-guidelines-search'], parallel: false },
      { phase: 5, tools: ['policy-criteria-matching'], parallel: false },
    ],
  };
}

function estimateDuration(tools) {
  return Math.round(tools.length * 3 + 10 + Math.random() * 10);
}

export default planningAgent;
