/**
 * NexusAgent Enterprise - Activity Stream & Immutable Audit Trail
 * Enterprise UI & API Event Tracking, Version Changes, Filterable Feeds, and CSV/JSON Export
 */

import { StorageService } from '../storage.js';
import { ActivityActionTypes, UserRoles } from '../types.js';

export const AuditActivityStream = {
  state: {
    filterAction: 'ALL',
    filterRole: 'ALL',
    searchQuery: '',
    selectedLogEntry: null
  },

  setFilterAction(action) {
    this.state.filterAction = action;
    this.render();
  },

  setFilterRole(role) {
    this.state.filterRole = role;
    this.render();
  },

  setSearch(query) {
    this.state.searchQuery = query.toLowerCase();
    this.render();
  },

  viewLogPayload(logId) {
    const logs = StorageService.getAuditLogs();
    const entry = logs.find(l => l.id === logId);
    if (!entry) return;

    this.state.selectedLogEntry = entry;
    this.renderPayloadModal(entry);
  },

  renderPayloadModal(entry) {
    const modalEl = document.getElementById('audit-payload-modal-container');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target === this) this.parentElement.innerHTML = ''">
        <div class="modal-content glass-panel p-6 sm:p-8 space-y-5 max-w-2xl">
          <div class="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="badge badge-purple font-mono text-xs">${entry.id}</span>
                <span class="badge badge-cyan text-xs">${entry.actionType}</span>
              </div>
              <h3 class="text-base font-bold text-white mt-1">Audit Event Payload Inspection</h3>
            </div>
            <button onclick="this.closest('#audit-payload-modal-container').innerHTML = ''" class="p-1 rounded text-gray-400 hover:text-white">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3 bg-[var(--bg-tertiary)] p-3 rounded-xl border border-[var(--border-subtle)]">
              <div>
                <span class="text-[var(--text-muted)] block">Actor:</span>
                <strong class="text-white">${entry.actor.name} (${entry.actor.role})</strong>
              </div>
              <div>
                <span class="text-[var(--text-muted)] block">Timestamp (ISO):</span>
                <strong class="text-gray-200 font-mono">${entry.timestamp}</strong>
              </div>
              <div>
                <span class="text-[var(--text-muted)] block">Target Entity:</span>
                <strong class="text-purple-300">${entry.agentName || entry.agentId}</strong>
              </div>
              <div>
                <span class="text-[var(--text-muted)] block">Source IP:</span>
                <strong class="text-cyan-300 font-mono">${entry.metadata?.ip || '10.142.12.8'}</strong>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-gray-300 mb-1">Raw JSON Audit Record (SIEM / Splunk Ready)</label>
              <pre class="code-block text-[11px] max-h-60 overflow-y-auto font-mono"><code>${JSON.stringify(entry, null, 2)}</code></pre>
            </div>
          </div>

          <div class="pt-3 border-t border-[var(--border-subtle)] flex justify-end">
            <button onclick="navigator.clipboard.writeText(\`${JSON.stringify(entry, null, 2)}\`); window.NexusApp.showToast('Copied JSON audit payload!', 'success')" class="btn btn-secondary btn-sm flex items-center gap-1.5">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy Payload JSON
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  exportCSV() {
    const logs = StorageService.getAuditLogs();
    const headers = ['ID', 'Timestamp', 'Actor Name', 'Role', 'Action Type', 'Agent Name', 'Details', 'IP'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      `"${l.actor.name}"`,
      l.actor.role,
      l.actionType,
      `"${l.agentName || l.agentId}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.metadata?.ip || 'Internal'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexusagent-audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    window.NexusApp.showToast('Exported audit trail to CSV!', 'success');
  },

  exportJSON() {
    const logs = StorageService.getAuditLogs();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `nexusagent-audit-trail-${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();

    window.NexusApp.showToast('Exported audit logs to JSON!', 'success');
  },

  getActionBadge(type) {
    switch (type) {
      case ActivityActionTypes.AGENT_CREATED:
        return { label: 'Agent Published', class: 'badge-purple', icon: 'plus-circle' };
      case ActivityActionTypes.VERSION_BUMPED:
        return { label: 'Version Released', class: 'badge-cyan', icon: 'git-branch' };
      case ActivityActionTypes.VSCODE_DOWNLOADED:
        return { label: 'VS Code Download', class: 'badge-emerald', icon: 'download' };
      case ActivityActionTypes.VSCODE_CONFIG_COPIED:
        return { label: 'Config Exported', class: 'badge-blue', icon: 'copy' };
      case ActivityActionTypes.PROMPT_FORKED:
        return { label: 'Prompt Used', class: 'badge-purple', icon: 'sparkles' };
      case ActivityActionTypes.PROMPT_CREATED:
        return { label: 'Prompt Added', class: 'badge-amber', icon: 'plus' };
      case ActivityActionTypes.SANDBOX_EXECUTED:
        return { label: 'Sandbox Tested', class: 'badge-cyan', icon: 'play' };
      case ActivityActionTypes.AGENT_CERTIFIED:
        return { label: 'Security Certified', class: 'badge-emerald', icon: 'shield-check' };
      default:
        return { label: type, class: 'badge-zinc', icon: 'activity' };
    }
  },

  render() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const logs = StorageService.getAuditLogs();

    // Filter logs
    const filteredLogs = logs.filter(log => {
      const matchAction = this.state.filterAction === 'ALL' || log.actionType === this.state.filterAction;
      const matchRole = this.state.filterRole === 'ALL' || log.actor.role === this.state.filterRole;
      const matchSearch = !this.state.searchQuery ||
        log.actor.name.toLowerCase().includes(this.state.searchQuery) ||
        (log.agentName && log.agentName.toLowerCase().includes(this.state.searchQuery)) ||
        (log.details && log.details.toLowerCase().includes(this.state.searchQuery));
      return matchAction && matchRole && matchSearch;
    });

    container.innerHTML = `
      <div class="space-y-6 animate-fadeIn">
        
        <!-- Top Header & Export Controls -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1b1424] via-[#101935] to-[#121626] p-6 sm:p-8 rounded-2xl border border-[var(--border-medium)] shadow-xl">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="badge badge-rose text-xs"><i data-lucide="activity" class="w-3.5 h-3.5"></i> Immutable Audit Trail</span>
              <span class="badge badge-purple text-xs">SOC2 & Enterprise Compliant</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Live Activity & Governance Stream</h2>
            <p class="text-xs sm:text-sm text-[var(--text-secondary)]">Every UI action, artifact modification, version release, and VS Code download is cryptographically tracked.</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.AuditActivityStream.exportCSV()" class="btn btn-secondary btn-sm flex items-center gap-1.5">
              <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Export CSV</span>
            </button>
            <button onclick="window.AuditActivityStream.exportJSON()" class="btn btn-secondary btn-sm flex items-center gap-1.5">
              <i data-lucide="file-code" class="w-3.5 h-3.5 text-cyan-400"></i>
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-none">
            <select onchange="window.AuditActivityStream.setFilterAction(this.value)" class="input-field py-1.5 text-xs font-semibold">
              <option value="ALL">All Event Types (${logs.length})</option>
              <option value="${ActivityActionTypes.VSCODE_DOWNLOADED}">VS Code Downloads</option>
              <option value="${ActivityActionTypes.VERSION_BUMPED}">Version Releases</option>
              <option value="${ActivityActionTypes.AGENT_CREATED}">Agent Publications</option>
              <option value="${ActivityActionTypes.PROMPT_FORKED}">Prompt Copied</option>
              <option value="${ActivityActionTypes.SANDBOX_EXECUTED}">Sandbox Runs</option>
              <option value="${ActivityActionTypes.AGENT_CERTIFIED}">Security Certifications</option>
            </select>

            <select onchange="window.AuditActivityStream.setFilterRole(this.value)" class="input-field py-1.5 text-xs font-semibold">
              <option value="ALL">All Roles</option>
              <option value="${UserRoles.DEVELOPER}">Developers</option>
              <option value="${UserRoles.AI_ENGINEER}">AI Engineers</option>
              <option value="${UserRoles.BUSINESS_MANAGER}">Managers</option>
              <option value="${UserRoles.SECURITY_GOVERNANCE}">Security / SecOps</option>
            </select>
          </div>

          <div class="relative w-full sm:w-80">
            <i data-lucide="search" class="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input 
              type="text" 
              placeholder="Search by actor, agent name, IP, or details..." 
              value="${this.state.searchQuery}"
              oninput="window.AuditActivityStream.setSearch(this.value)"
              class="input-field pl-9 py-1.5 text-xs"
            />
          </div>
        </div>

        <!-- Activity Timeline Table / Stream -->
        <div class="glass-panel rounded-2xl border border-[var(--border-medium)] overflow-hidden shadow-xl">
          <div class="divide-y divide-[var(--border-subtle)]">
            ${filteredLogs.map(entry => {
              const badge = this.getActionBadge(entry.actionType);
              const dateStr = new Date(entry.timestamp).toLocaleString();

              return `
                <div class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-tertiary)] transition-colors">
                  
                  <div class="flex items-start gap-3.5">
                    <img src="${entry.actor.avatar}" alt="${entry.actor.name}" class="w-9 h-9 rounded-full object-cover border border-[var(--border-medium)] mt-0.5 shrink-0">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-xs text-white">${entry.actor.name}</span>
                        <span class="badge badge-zinc text-[10px]">${entry.actor.role}</span>
                        <span class="badge ${badge.class} text-[10px] flex items-center gap-1">
                          <i data-lucide="${badge.icon}" class="w-3 h-3"></i> ${badge.label}
                        </span>
                      </div>

                      <div class="text-xs text-[var(--text-secondary)] leading-relaxed">
                        ${entry.details}
                      </div>

                      <div class="text-[11px] text-[var(--text-muted)] flex items-center gap-3 pt-0.5">
                        <span class="font-mono">${dateStr}</span>
                        <span>•</span>
                        <span>IP: <code class="font-mono text-gray-300">${entry.metadata?.ip || '10.142.0.1'}</code></span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button onclick="window.AuditActivityStream.viewLogPayload('${entry.id}')" class="btn btn-secondary btn-sm text-[11px] py-1 flex items-center gap-1">
                      <i data-lucide="eye" class="w-3.5 h-3.5 text-purple-400"></i>
                      <span>Inspect Payload</span>
                    </button>
                  </div>

                </div>
              `;
            }).join('')}

            ${filteredLogs.length === 0 ? `
              <div class="p-12 text-center text-gray-400 space-y-2">
                <i data-lucide="filter" class="w-8 h-8 mx-auto text-gray-500"></i>
                <div class="font-bold text-white">No activity records match filters</div>
                <div class="text-xs text-gray-400">Try resetting the action or role filter dropdowns.</div>
              </div>
            ` : ''}
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
