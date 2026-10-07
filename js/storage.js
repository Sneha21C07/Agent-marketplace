/**
 * NexusAgent Enterprise - Storage & State Service
 * Thin client for the SQLite-backed REST API (serve_marketplace.py).
 * The UI reads and writes exclusively through this API - no static seed
 * data or browser localStorage fallback is used.
 */

import { UserRoles } from './types.js';

const API_BASE = '/api';

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Storage API request failed (${response.status}): ${errorText || response.statusText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// In-memory cache populated from SQLite on bootstrap(); kept in sync on every write
const cache = {
  agents: [],
  prompts: [],
  auditLogs: [],
  currentRole: UserRoles.DEVELOPER,
  ready: false
};

export const StorageService = {
  /**
   * Loads all data from the SQLite database via the API. Must succeed
   * before the app renders - there is no offline/local fallback.
   */
  async bootstrap() {
    const [agents, prompts, auditLogs, currentRole] = await Promise.all([
      apiRequest('/agents'),
      apiRequest('/prompts'),
      apiRequest('/audit-logs'),
      apiRequest('/current-role')
    ]);

    cache.agents = Array.isArray(agents) ? agents : [];
    cache.prompts = Array.isArray(prompts) ? prompts : [];
    cache.auditLogs = Array.isArray(auditLogs) ? auditLogs : [];
    cache.currentRole = currentRole || UserRoles.DEVELOPER;
    cache.ready = true;
    return true;
  },

  isReady() {
    return cache.ready;
  },

  getAgents() {
    return cache.agents;
  },

  getAgentById(id) {
    return cache.agents.find(a => a.id === id || a.slug === id) || null;
  },

  saveAgents(agents) {
    cache.agents = Array.isArray(agents) ? agents : [];
    const result = apiRequest('/agents', {
      method: 'POST',
      body: JSON.stringify({ agents: cache.agents })
    });
    window.dispatchEvent(new CustomEvent('nexus:agents_changed', { detail: { agents: cache.agents } }));
    return result;
  },

  saveAgent(agentData) {
    const agents = [...cache.agents];
    const existingIndex = agents.findIndex(a => a.id === agentData.id);
    if (existingIndex >= 0) {
      agents[existingIndex] = { ...agents[existingIndex], ...agentData, lastUpdated: new Date().toISOString() };
    } else {
      agents.unshift({
        ...agentData,
        id: agentData.id || `agent-${Date.now()}`,
        lastUpdated: new Date().toISOString(),
        downloads: 0,
        activeDeployments: 0,
        rating: 5.0
      });
    }
    this.saveAgents(agents);
    window.dispatchEvent(new CustomEvent('nexus:agents_changed', { detail: { agents } }));
    return agentData;
  },

  deleteAgent(agentId) {
    if (!agentId) return false;
    const before = cache.agents.length;
    const agents = cache.agents.filter(a => a.id !== agentId);
    if (agents.length === before) return false;
    this.saveAgents(agents);
    window.dispatchEvent(new CustomEvent('nexus:agents_changed', { detail: { agents } }));
    return true;
  },

  addAgentVersion(agentId, newVersionData) {
    const agents = [...cache.agents];
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return null;

    if (!agent.versions) agent.versions = [];
    // Mark previous current as archived
    agent.versions.forEach(v => {
      if (v.status === 'CURRENT_STABLE') v.status = 'PREVIOUS';
    });

    const newVer = {
      version: newVersionData.version,
      releaseDate: new Date().toISOString().split('T')[0],
      status: 'CURRENT_STABLE',
      author: newVersionData.author || 'AI Engineering Team',
      changelog: newVersionData.changelog || 'Routine version update.',
      instructionsDiff: newVersionData.instructionsDiff || '+ Updated Copilot system instructions'
    };

    agent.versions.unshift(newVer);
    agent.version = newVersionData.version;
    agent.lastUpdated = new Date().toISOString();

    this.saveAgents(agents);
    return agent;
  },

  getPromptLibrary() {
    return cache.prompts;
  },

  savePromptLibrary(prompts) {
    cache.prompts = Array.isArray(prompts) ? prompts : [];
    return apiRequest('/prompts', {
      method: 'POST',
      body: JSON.stringify({ prompts: cache.prompts })
    });
  },

  savePrompt(prompt) {
    const prompts = [...cache.prompts];
    const idx = prompts.findIndex(p => p.id === prompt.id);
    if (idx >= 0) {
      prompts[idx] = { ...prompts[idx], ...prompt };
    } else {
      prompts.unshift({
        ...prompt,
        id: prompt.id || `prompt-${Date.now()}`,
        usageCount: 0,
        rating: 5.0,
        version: prompt.version || '1.0.0'
      });
    }
    this.savePromptLibrary(prompts);
    return prompt;
  },

  getAuditLogs() {
    return cache.auditLogs;
  },

  saveAuditLogs(logs) {
    cache.auditLogs = Array.isArray(logs) ? logs.slice(0, 200) : [];
    return apiRequest('/audit-logs', {
      method: 'POST',
      body: JSON.stringify({ logs: cache.auditLogs })
    });
  },

  logActivity(actionType, actorName, role, agentId, agentName, details, metadata = {}) {
    const logs = [...cache.auditLogs];
    const newEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      actor: {
        name: actorName || 'Enterprise Developer',
        role: role || UserRoles.DEVELOPER,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
      },
      actionType,
      agentId,
      agentName,
      details,
      metadata: { ...metadata, ip: '10.142.' + Math.floor(Math.random() * 200) + '.' + Math.floor(Math.random() * 200) }
    };
    logs.unshift(newEntry);
    this.saveAuditLogs(logs);

    // Dispatch custom event for real-time reactivity
    window.dispatchEvent(new CustomEvent('nexus:activity_logged', { detail: newEntry }));
    return newEntry;
  },

  getCurrentRole() {
    return cache.currentRole;
  },

  setCurrentRole(role) {
    cache.currentRole = role;
    apiRequest('/current-role', {
      method: 'POST',
      body: JSON.stringify({ value: role })
    }).catch((error) => console.error('Failed to persist role to SQLite:', error));
    window.dispatchEvent(new CustomEvent('nexus:role_changed', { detail: { role } }));
  },

  async resetDefaults() {
    await apiRequest('/reset-defaults', { method: 'POST' });
    location.reload();
  }
};

