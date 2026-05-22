const AgentPool = require('./agent-pool.js');
const SessionStore = require('./session-store.js');
const RoleRouter = require('./role-router.js');
const { BuiltInMemoryProvider } = require('./memory-provider.js');
const BackgroundReview = require('./background-review.js');
const Curator = require('./curator.js');
const ContextCompressor = require('./context-compressor.js');
const path = require('path');

class Coordinator {
  constructor(config) {
    this.config = config || {};
    this.dbDir = this.config.dbDir || path.join(__dirname, 'db');
    this.store = null;
    this.pool = null;
    this.router = new RoleRouter();
    this.memoryProvider = null;
    this.reviewer = null;
    this.curator = null;
    this.compressor = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // Layer 1: SQLite Session Store
    this.store = new SessionStore(this.dbDir);
    await this.store.init();

    // Layer 2: Memory Provider
    this.memoryProvider = new BuiltInMemoryProvider(this.config.memory || {});
    await this.memoryProvider.initialize();

    // Layer 3: Background Review
    this.reviewer = new BackgroundReview(this.config.review || {});

    // Layer 4: Curator
    this.curator = new Curator(this.config.curator || {});

    // Layer 5: Context Compressor
    this.compressor = new ContextCompressor(this.config.compressor || {});

    // Agent Pool (uses SessionStore)
    this.pool = new AgentPool(this.store, this.config.maxWorkers || 4);

    // Role Router
    await this.router.init();

    this.initialized = true;
    console.log('[Coordinator v3.0] Initialized with all 5 persistence layers');
    console.log('[Coordinator] Role templates:', this.router.getTemplates().getRoleCount());
  }

  decomposeTask(mainTask) {
    return this.router.decomposeWithRoles(mainTask);
  }

  async run(mainTask, context) {
    if (!this.initialized) await this.init();
    if (!context) context = {};

    var sessionId = 'session_' + Date.now();
    this.store.createSession(sessionId, mainTask.slice(0, 200), context);
    this.store.updateStatus(sessionId, 'running');
    console.log('[Coordinator] Session:', sessionId);

    // Layer 2: Pre-fetch relevant memories
    var memoryContext = '';
    try {
      memoryContext = await this.memoryProvider.getContextBlock(mainTask);
      if (memoryContext) {
        console.log('[Coordinator] Injected', this.memoryProvider.memories.length, 'memory entries');
      }
    } catch (e) {
      console.log('[Coordinator] Memory prefetch error:', e.message);
    }

    // Decompose task with role matching
    console.log('[Coordinator] Decomposing task with role matching...');
    var subTasks = await this.decomposeTask(mainTask);

    // Inject memory context into each sub-task
    var enrichedContext = { ...context, memoryContext: memoryContext, roleEngine: true };

    // Phase 1: Parallel execution
    console.log('[Coordinator] Executing', subTasks.length, 'sub-tasks in parallel...');
    var results = await this.pool.submitAll(subTasks, enrichedContext);

    // Phase 2: Aggregate results
    console.log('[Coordinator] Aggregating results...');
    var aggregated = this._aggregate(results);

    this.store.updateStatus(sessionId, 'completed', aggregated);

    // Layer 2: Sync memories from results
    try {
      for (var i = 0; i < results.length; i++) {
        var r = results[i];
        if (r && r.result) {
          await this.memoryProvider.syncTurn(r.task || subTasks[i], r.result);
        }
      }
      if (aggregated) {
        await this.memoryProvider.syncTurn(mainTask, aggregated);
      }
    } catch (e) {
      console.log('[Coordinator] Memory sync error:', e.message);
    }

    // Layer 3: Background review
    try {
      var reviewResult = await this.reviewer.review(sessionId, mainTask, aggregated, this.memoryProvider);
      if (reviewResult && (reviewResult.styleSignals > 0 || reviewResult.skillSignals > 0)) {
        console.log('[Coordinator] Background review:', reviewResult.styleSignals + ' style signals, ' + reviewResult.skillSignals + ' skill signals');
      }
    } catch (e) {
      console.log('[Coordinator] Review error:', e.message);
    }

    // Layer 5: Check if compression needed
    try {
      if (this.compressor.shouldCompress(this.store, sessionId)) {
        console.log('[Coordinator] Session exceeds compression threshold, compressing...');
        var compressed = await this.compressor.compress(this.store, sessionId);
        if (compressed) {
          console.log('[Coordinator] Compression complete:', compressed.summary);
        }
      }
    } catch (e) {
      console.log('[Coordinator] Compression error:', e.message);
    }

    return { sessionId, subTasks: results, aggregated };
  }

  _aggregate(results) {
    var summaries = results.map(function(r) {
      return {
        id: r.id || r.task || '',
        status: r.status || (r.result ? 'completed' : 'failed'),
        summary: r.result ? (r.result.summary || '') : 'no result',
        output: r.result ? (r.result.output || '') : ''
      };
    });

    return {
      totalTasks: results.length,
      completed: results.filter(function(r) { return r.status === 'completed' || (r.result && r.result.status !== 'failed'); }).length,
      failed: results.filter(function(r) { return r.status === 'failed' || (r.result && r.result.status === 'failed'); }).length,
      summaries: summaries
    };
  }

  // Layer 4: Run curator
  async runCurator() {
    if (!this.initialized) await this.init();
    console.log('[Coordinator] Running curator...');
    var report = await this.curator.run(this.memoryProvider);
    console.log('[Coordinator] Curator report: ' + report.staleSkills.length + ' stale, ' + report.archivedSkills.length + ' archive candidates');
    if (report.memoryAnalysis && report.memoryAnalysis.suggestions.length) {
      console.log('[Coordinator] Memory suggestions:', report.memoryAnalysis.suggestions.join('; '));
    }
    return report;
  }

  // Search across all persistence layers
  async search(query, limit) {
    if (!this.initialized) await this.init();
    if (limit === undefined) limit = 10;
    var results = {
      sessions: this.store.searchSessions(query, limit),
      messages: this.store.searchMessages(query, limit * 2),
      memories: []
    };
    try {
      results.memories = await this.memoryProvider.search(query, limit);
    } catch (e) {}
    return results;
  }

  // Get system stats
  async getStats() {
    if (!this.initialized) await this.init();
    return {
      sessions: this.store.getStats(),
      memories: this.memoryProvider.getStats(),
      reviews: this.reviewer.getReviewStats()
    };
  }

  // List recent sessions
  listSessions(limit) {
    if (!this.store) return [];
    return this.store.listSessions(limit || 10);
  }

  // Get compressed session chain
  getSessionChain(sessionId) {
    if (!this.store) return [];
    return this.store.getSessionChain(sessionId);
  }

  async close() {
    if (this.memoryProvider) await this.memoryProvider.shutdown();
    if (this.store) this.store.close();
  }
}

module.exports = Coordinator;
