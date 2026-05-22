const fs = require('fs');
const path = require('path');

// Auto-load .env
var envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  var lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i].trim();
    if (!l || l.startsWith('#')) continue;
    var eq = l.indexOf('=');
    if (eq < 0) continue;
    var k = l.slice(0, eq).trim();
    var v = l.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

var Coordinator = require('./coordinator.js');
var RoleRouter = require('./role-router.js');

async function main() {
  var args = process.argv.slice(2);

  // --stats: Show system stats from all layers
  if (args.includes('--stats') || args.includes('-s')) {
    var coord = new Coordinator();
    var stats = await coord.getStats();
    console.log('=== BaiLongma Orchestrator v3.0 — System Stats ===\n');
    console.log('-- Sessions --');
    console.log('  Total:', stats.sessions.total_sessions || 0);
    console.log('  Completed:', stats.sessions.completed || 0);
    console.log('  Failed:', stats.sessions.failed || 0);
    console.log('  Total Tokens:', stats.sessions.total_tokens || 0);
    console.log('  Compressed:', stats.sessions.compressed || 0);
    console.log('');
    console.log('-- Memories --');
    console.log('  Total:', stats.memories.total || 0);
    console.log('  Types:', JSON.stringify(stats.memories.byType || {}));
    console.log('  File:', stats.memories.file || 'N/A');
    console.log('');
    console.log('-- Reviews --');
    console.log('  Total reviews:', stats.reviews.total || 0);
    console.log('  Style signals:', stats.reviews.styleSignals || 0);
    console.log('  Skill signals:', stats.reviews.skillSignals || 0);
    await coord.close();
    process.exit(0);
  }

  // --curator: Run curator for skill/memory maintenance
  if (args.includes('--curator') || args.includes('-c')) {
    var coord = new Coordinator();
    var report = await coord.runCurator();
    console.log('\n=== Curator Report ===');
    console.log('Timestamp:', report.timestamp);
    console.log('Stale skills (' + report.staleSkills.length + '):');
    for (var i = 0; i < report.staleSkills.length; i++) {
      console.log('  - ' + report.staleSkills[i].name + ' (' + report.staleSkills[i].ageDays + ' days old)');
    }
    if (report.memoryAnalysis) {
      console.log('\nMemory Analysis:');
      console.log('  Total:', report.memoryAnalysis.totalMemories);
      console.log('  Suggestions:', report.memoryAnalysis.suggestions.join(', ') || 'none');
    }
    await coord.close();
    process.exit(0);
  }

  // --search <query>: Cross-layer search
  var searchIdx = args.indexOf('--search');
  if (searchIdx >= 0 && searchIdx + 1 < args.length) {
    var query = args[searchIdx + 1];
    var coord = new Coordinator();
    var results = await coord.search(query, 10);
    console.log('=== Search Results for "' + query + '" ===\n');
    console.log('-- Sessions (' + results.sessions.length + ') --');
    for (var i = 0; i < results.sessions.length; i++) {
      var s = results.sessions[i];
      console.log('  [' + s.status + '] ' + s.id + ': ' + (s.task || '').slice(0, 80));
    }
    console.log('\n-- Messages (' + results.messages.length + ') --');
    for (var i = 0; i < results.messages.length; i++) {
      var m = results.messages[i];
      console.log('  [' + m.role + '] ' + (m.content || '').slice(0, 100));
    }
    if (results.memories && results.memories.length) {
      console.log('\n-- Memories (' + results.memories.length + ') --');
      for (var i = 0; i < results.memories.length; i++) {
        var mem = results.memories[i];
        console.log('  [' + mem.type + '] ' + (mem.title || '') + ': ' + (mem.content || '').slice(0, 80));
      }
    }
    await coord.close();
    process.exit(0);
  }

  // --sessions: List recent sessions
  if (args.includes('--sessions') || args.includes('-l')) {
    var coord = new Coordinator();
    await coord.init();
    var sessions = coord.listSessions(20);
    console.log('=== Recent Sessions (' + sessions.length + ') ===\n');
    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i];
      console.log('  [' + s.status + '] ' + s.id);
      console.log('    Task: ' + (s.task || '').slice(0, 60));
      console.log('    Tokens: ' + (s.token_count || 0) + ' | Compressed: ' + (s.is_compressed ? 'yes' : 'no'));
      console.log('    Created: ' + s.created_at);
      console.log('');
    }
    await coord.close();
    process.exit(0);
  }

  // --chain <sessionId>: Show session compression chain
  var chainIdx = args.indexOf('--chain');
  if (chainIdx >= 0 && chainIdx + 1 < args.length) {
    var sessionId = args[chainIdx + 1];
    var coord = new Coordinator();
    await coord.init();
    var chain = coord.getSessionChain(sessionId);
    console.log('=== Session Chain for ' + sessionId + ' (' + chain.length + ' hops) ===\n');
    for (var i = 0; i < chain.length; i++) {
      var s = chain[i];
      console.log('  [' + (i + 1) + '] ' + s.id + ' [' + s.status + ']' + (s.is_compressed ? ' [COMPRESSED]' : ''));
      console.log('      Task: ' + (s.task || '').slice(0, 60));
      if (s.summary) console.log('      Summary: ' + s.summary.slice(0, 100));
      console.log('');
    }
    await coord.close();
    process.exit(0);
  }

  // --list-roles: List all role templates
  if (args.includes('--list-roles')) {
    var router = new RoleRouter();
    await router.init();
    var cats = router.getTemplates().getCategories();
    console.log('=== BaiLongma Role Templates (' + router.getTemplates().getRoleCount() + ' roles) ===\n');
    for (var i = 0; i < cats.length; i++) {
      console.log(cats[i].category + ' (' + cats[i].count + '):');
      for (var j = 0; j < cats[i].roles.length; j++) {
        console.log('  ' + cats[i].roles[j].emoji + ' ' + cats[i].roles[j].name);
      }
      console.log('');
    }
    process.exit(0);
  }

  // --search-roles <query>: Search roles
  var sri = args.indexOf('--search-roles');
  if (sri >= 0 && sri + 1 < args.length) {
    var query = args[sri + 1];
    var router = new RoleRouter();
    await router.init();
    var results = router.getTemplates().searchRoles(query);
    console.log('=== Search results for "' + query + '" (' + results.length + ' matches) ===\n');
    for (var i = 0; i < results.length; i++) {
      console.log(results[i].emoji + ' ' + results[i].name);
      console.log('   ID: ' + results[i].id + ' | Category: ' + results[i].category);
      console.log('   ' + results[i].description.slice(0, 100));
      console.log('');
    }
    process.exit(0);
  }

  // --search-msgs <query>: Search messages (for backward compatibility)
  var smi = args.indexOf('--search-msgs');
  if (smi >= 0 && smi + 1 < args.length) {
    var query = args[smi + 1];
    var coord = new Coordinator();
    var results = await coord.search(query);
    console.log('=== Message search results for "' + query + '" (' + results.messages.length + ') ===\n');
    for (var i = 0; i < results.messages.length; i++) {
      var m = results.messages[i];
      console.log('  [' + m.role + '] ' + (m.content || '').slice(0, 120));
      console.log('  Session: ' + m.session_id + '\n');
    }
    await coord.close();
    process.exit(0);
  }

  
  // --debate <question>: Run 8-step structured debate
  var debateIdx = args.indexOf('--debate');
  if (debateIdx >= 0) {
    var question = args.slice(debateIdx + 1).join(' ');
    if (!question) { console.error('Usage: node run-v2.js --debate <your question>'); process.exit(1); }
    
    console.log('=== BaiLongma 8-Step Structured Debate ===');
    console.log('Question:', question);
    console.log('');

    const { runDebate } = require('./debate/coordinator.js');
    const { saveReport } = require('./debate/report.js');
    const { DEFAULT_PERSONAS } = require('./debate/personas.js');
    
    var result = await runDebate(question, {
      personas: DEFAULT_PERSONAS,
      model: process.env.MODEL || 'deepseek-chat',
      maxTokens: 2048
    });
    
    var reportPath = path.join(__dirname, 'debate-report.md');
    saveReport(question, result.state, result.stepLog, reportPath);
    
    console.log('');
    console.log('=== Debate Complete ===');
    console.log('Report saved:', reportPath);
    console.log('');
    console.log('--- Summary ---');
    console.log(result.state.summary ? result.state.summary.slice(0, 500) : '(no summary)');
    console.log('');
    console.log('--- Action Items ---');
    console.log(result.state.harvest ? result.state.harvest.slice(0, 500) : '(no action items)');
    console.log('');
    process.exit(0);
  }

// Normal task execution
  var task = args.join(' ') || 'Run default analysis task';

  console.log('=== BaiLongma Orchestrator v3.0 (5-Layer Persistence) ===');
  console.log('Task:', task);
  console.log('');

  var coord = new Coordinator();
  var result = await coord.run(task, { source: 'cli', timestamp: new Date().toISOString() });

  console.log('');
  console.log('=== Results ===');
  for (var i = 0; i < result.aggregated.summaries.length; i++) {
    var s = result.aggregated.summaries[i];
    console.log('  ' + s.summary);
    if (s.output) {
      console.log(s.output);
    }
  }
  console.log('');
  console.log('Session ID:', result.sessionId);
  console.log('Sub-tasks:', result.subTasks.length);
  console.log('Completed:', result.aggregated.completed);
  if (result.aggregated.failed > 0) {
    console.log('Failed:', result.aggregated.failed);
  }

  await coord.close();
  process.exit(0);
}

main().catch(function(err) {
  console.error('Fatal:', err.message);
  process.exit(1);
});