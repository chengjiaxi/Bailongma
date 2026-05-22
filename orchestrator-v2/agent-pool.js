const AgentWorker = require('./agent-worker.js');

class AgentPool {
  constructor(sessionStore, maxWorkers = 4) {
    this.store = sessionStore;
    this.maxWorkers = maxWorkers;
    this.workers = new Map();
    this.queue = [];
    this.results = new Map();
  }

  async submitTask(task, context) {
    if (this.workers.size >= this.maxWorkers) {
      // Queue it
      return new Promise((resolve) => {
        this.queue.push({ task, context, resolve });
      });
    }
    return this._executeTask(task, context);
  }

  async _executeTask(task, context) {
    const id = task.id || ('task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));
    this.store.createSession(id, task.name, JSON.stringify({ task, context }));
    const worker = new AgentWorker(id, task, context, this.store);
    this.workers.set(id, worker);
    const result = await worker.run();
    this.results.set(id, result);
    this.workers.delete(id);

    // Process queue
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next.resolve(this._executeTask(next.task, next.context));
    }

    return { id, result, status: worker.getStatus() };
  }

  async submitAll(tasks, context) {
    const promises = tasks.map(t => this.submitTask(t, context));
    return Promise.all(promises);
  }

  getResults() {
    return Object.fromEntries(this.results);
  }

  getPendingCount() {
    return this.queue.length;
  }

  getActiveCount() {
    return this.workers.size;
  }
}

module.exports = AgentPool;
