/**
 * NexusAgent Enterprise - Main Application Coordinator with RBAC Enforcement
 */

import { StorageService } from './storage.js';
import { UserRoles, RoleMetadata } from './types.js';
import { Header } from './components/Header.js';
import { MarketplaceCatalog } from './components/MarketplaceCatalog.js';
import { AgentDetailModal } from './components/AgentDetailModal.js';
import { PromptLibrary } from './components/PromptLibrary.js';
import { InteractivePlayground } from './components/InteractivePlayground.js';
import { AgentUploadWizard } from './components/AgentUploadWizard.js';
import { BusinessDashboard } from './components/BusinessDashboard.js';
import { AuditActivityStream } from './components/AuditActivityStream.js';
import { CopilotExporter } from './copilotExporter.js';
import { ActivityActionTypes } from './types.js';

export const NexusApp = {
  currentTab: 'catalog',
  currentRole: UserRoles.DEVELOPER,

  async init() {
    // Attach globals for inline onclick handlers
    window.NexusApp = this;
    window.MarketplaceCatalog = MarketplaceCatalog;
    window.AgentDetailModal = AgentDetailModal;
    window.PromptLibrary = PromptLibrary;
    window.InteractivePlayground = InteractivePlayground;
    window.AgentUploadWizard = AgentUploadWizard;
    window.BusinessDashboard = BusinessDashboard;
    window.AuditActivityStream = AuditActivityStream;

    // Listen for custom events
    window.addEventListener('nexus:role_changed', (e) => {
      this.currentRole = e.detail.role;
      const roleMeta = RoleMetadata[this.currentRole];
      
      // If current tab is not allowed for newly selected role, redirect to first allowed tab
      if (!roleMeta.allowedTabs.includes(this.currentTab)) {
        this.currentTab = roleMeta.allowedTabs[0] || 'catalog';
      }

      this.render();
      this.showToast(`Switched active persona to ${roleMeta.title} (${roleMeta.subtitle})`, 'info');
    });

    window.addEventListener('nexus:activity_logged', () => {
      if (this.currentTab === 'audit') {
        AuditActivityStream.render();
      }
    });

    window.addEventListener('nexus:agents_changed', () => {
      if (this.currentTab === 'catalog') {
        MarketplaceCatalog.render();
      }
    });

    // Close the role dropdown when clicking outside of it, or pressing Escape
    document.addEventListener('click', (e) => {
      const container = document.getElementById('role-switcher-container');
      if (container && !container.contains(e.target)) {
        this.closeRoleMenu();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeRoleMenu();
    });

    try {
      await StorageService.bootstrap();
    } catch (error) {
      console.error('Failed to load data from the SQLite-backed API:', error);
      this.renderDatabaseError(error);
      return;
    }

    this.currentRole = StorageService.getCurrentRole();
    this.render();
  },

  renderDatabaseError(error) {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) headerContainer.innerHTML = '';

    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-12 px-6 glass-panel rounded-3xl border border-rose-500/30 text-center space-y-6 animate-fadeIn shadow-2xl">
        <div class="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40 shadow-lg">
          <i data-lucide="database" class="w-8 h-8"></i>
        </div>
        <div class="space-y-2">
          <span class="badge badge-rose text-xs uppercase tracking-wider font-bold">Database Unavailable</span>
          <h2 class="text-2xl font-extrabold text-white">Cannot Reach the SQLite-Backed API</h2>
          <p class="text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
            This app reads and writes exclusively through the local SQLite database. Make sure
            <code class="text-purple-300">serve_marketplace.py</code> is running, then reload this page.
          </p>
        </div>
        <div class="p-4 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-subtle)] text-xs text-left space-y-2 max-w-md mx-auto font-mono text-rose-300 overflow-x-auto">
          ${(error && error.message) || 'Unknown error'}
        </div>
        <button onclick="location.reload()" class="btn btn-primary btn-sm">Retry</button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  navigate(tab) {
    const roleMeta = RoleMetadata[this.currentRole];
    
    // Check RBAC permission for tab
    if (!roleMeta.allowedTabs.includes(tab)) {
      this.renderAccessDenied(tab);
      return;
    }

    this.currentTab = tab;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setRole(role) {
    StorageService.setCurrentRole(role);
    const roleMeta = RoleMetadata[role];
    this.currentTab = roleMeta.allowedTabs[0] || 'catalog';
    this.render();
  },

  toggleRoleMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('role-switcher-menu');
    if (!menu) return;
    menu.classList.toggle('hidden');
  },

  closeRoleMenu() {
    const menu = document.getElementById('role-switcher-menu');
    if (menu) menu.classList.add('hidden');
  },

  openAgentDetail(agentId, tab = 'demo') {
    AgentDetailModal.open(agentId, tab);
  },

  openUploadWizard(agentId = null) {
    const roleMeta = RoleMetadata[this.currentRole];
    if (!roleMeta.permissions.canPublishAgent) {
      this.showToast('Elevation Required: Only AI Engineers can publish or edit agents.', 'error');
      this.renderAccessDenied('studio', 'AI Engineer');
      return;
    }
    this.currentTab = 'studio';
    this.render();
    AgentUploadWizard.open(agentId);
  },

  editAgent(agentId) {
    this.openUploadWizard(agentId);
  },

  deleteAgent(agentId) {
    const roleMeta = RoleMetadata[this.currentRole];
    if (!roleMeta.permissions.canPublishAgent) {
      this.showToast('Elevation Required: Only AI Engineers can delete agents.', 'error');
      return;
    }

    const agent = StorageService.getAgentById(agentId);
    if (!agent) {
      this.showToast('Agent not found.', 'error');
      return;
    }

    const confirmed = window.confirm(`Delete agent "${agent.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    const deleted = StorageService.deleteAgent(agentId);
    if (!deleted) {
      this.showToast('Failed to delete agent.', 'error');
      return;
    }

    StorageService.logActivity(
      ActivityActionTypes.ARTIFACT_UPDATED,
      'Enterprise AI Engineer',
      UserRoles.AI_ENGINEER,
      agent.id,
      agent.name,
      'Agent deleted from enterprise marketplace.',
      { operation: 'delete_agent' }
    );

    if (this.currentTab === 'catalog') {
      MarketplaceCatalog.render();
    }
    this.showToast(`Deleted agent "${agent.name}".`, 'success');
  },

  openPlaygroundWithAgent(agentId) {
    const roleMeta = RoleMetadata[this.currentRole];
    if (!roleMeta.allowedTabs.includes('playground')) {
      this.showToast('Elevation Required: Switch to Developer or AI Engineer role to run sandbox.', 'error');
      this.renderAccessDenied('playground', 'Developer or AI Engineer');
      return;
    }
    this.currentTab = 'playground';
    this.render();
    InteractivePlayground.selectAgent(agentId);
  },

  async downloadAgent(agentId) {
    const agent = StorageService.getAgentById(agentId);
    if (!agent) return;
    await CopilotExporter.downloadZipPackage(agent, `${RoleMetadata[this.currentRole].title}`);
    this.showToast(`Downloaded VS Code package for "${agent.name}"!`, 'success');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast glass-panel border border-[var(--border-medium)] flex items-center gap-3`;

    let icon = 'info';
    let iconColor = 'text-cyan-400';
    if (type === 'success') {
      icon = 'check-circle';
      iconColor = 'text-emerald-400';
    } else if (type === 'error') {
      icon = 'alert-triangle';
      iconColor = 'text-rose-400';
    }

    toast.innerHTML = `
      <i data-lucide="${icon}" class="w-5 h-5 ${iconColor} shrink-0"></i>
      <div class="text-xs font-semibold text-white flex-1">${message}</div>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  renderAccessDenied(tabName, requiredRoleName = null) {
    const container = document.getElementById('main-content');
    if (!container) return;

    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      headerContainer.innerHTML = Header.render(this.currentTab, this.currentRole);
    }

    const currentRoleMeta = RoleMetadata[this.currentRole];

    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-12 px-6 glass-panel rounded-3xl border border-rose-500/30 text-center space-y-6 animate-fadeIn shadow-2xl">
        <div class="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40 shadow-lg">
          <i data-lucide="shield-alert" class="w-8 h-8"></i>
        </div>

        <div class="space-y-2">
          <span class="badge badge-rose text-xs uppercase tracking-wider font-bold">Enterprise RBAC Policy Enforced</span>
          <h2 class="text-2xl font-extrabold text-white">Access Denied to "${tabName.toUpperCase()}"</h2>
          <p class="text-xs sm:text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
            Your active role <strong class="text-cyan-300">${currentRoleMeta.title}</strong> does not have permission to access the <strong>${tabName}</strong> module.
          </p>
        </div>

        <div class="p-4 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-subtle)] text-xs text-left space-y-2 max-w-md mx-auto">
          <div class="font-bold text-gray-300 uppercase text-[10px] tracking-wider">Role Permissions Matrix</div>
          <div class="flex items-center justify-between text-gray-300">
            <span>Your Current Role:</span>
            <strong class="text-white">${currentRoleMeta.title}</strong>
          </div>
          <div class="flex items-center justify-between text-gray-300">
            <span>Allowed Modules:</span>
            <span class="text-purple-300 font-mono">${currentRoleMeta.allowedTabs.join(', ')}</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button onclick="window.NexusApp.navigate('${currentRoleMeta.allowedTabs[0]}')" class="btn btn-secondary btn-sm">
            Return to Allowed Module (${currentRoleMeta.allowedTabs[0]})
          </button>
          <button onclick="window.NexusApp.setRole('${UserRoles.AI_ENGINEER}')" class="btn btn-primary btn-sm">
            Switch to AI Engineer Role
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  openTestGuideModal() {
    const modalEl = document.getElementById('test-guide-modal-container');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target === this) this.parentElement.innerHTML = ''">
        <div class="modal-content glass-panel p-6 sm:p-8 space-y-6 max-w-3xl">
          
          <div class="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="badge badge-cyan text-xs"><i data-lucide="compass" class="w-3.5 h-3.5"></i> Comprehensive Testing Guide</span>
                <span class="badge badge-purple text-xs">5 Enterprise Use Cases</span>
              </div>
              <h3 class="text-xl font-extrabold text-white mt-1">How to Test All Marketplace Functionalities</h3>
            </div>
            <button onclick="this.closest('#test-guide-modal-container').innerHTML = ''" class="p-1 rounded text-gray-400 hover:text-white">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-4 text-xs max-h-[500px] overflow-y-auto pr-1">
            
            <!-- Use Case 1 -->
            <div class="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                  <i data-lucide="code" class="w-4 h-4"></i>
                  Use Case 1: Developer Experience (Discovery & VS Code Setup)
                </h4>
                <button onclick="window.NexusApp.setRole('developer'); this.closest('#test-guide-modal-container').innerHTML = '';" class="btn btn-cyan btn-sm text-[10px] py-0.5">Switch to Developer</button>
              </div>
              <p class="text-gray-300">1. Click any agent card (e.g. <em>Kubernetes SRE Triager</em>) to open the artifact modal.</p>
              <p class="text-gray-300">2. In the <strong>Demo Walkthrough</strong> tab, click Play or step buttons to watch the simulated execution in VS Code Copilot.</p>
              <p class="text-gray-300">3. Switch to <strong>Input Documents</strong> and <strong>Output Documents</strong> to inspect sample logs and patch diffs.</p>
              <p class="text-gray-300">4. Go to <strong>VS Code Copilot Setup</strong> and click <em>Download Bundle (.zip)</em> or copy <code class="text-purple-300">.github/copilot-instructions.md</code>.</p>
            </div>

            <!-- Use Case 2 -->
            <div class="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                  <i data-lucide="cpu" class="w-4 h-4"></i>
                  Use Case 2: AI Engineer Experience (Publishing & Artifact Maintenance)
                </h4>
                <button onclick="window.NexusApp.setRole('ai_engineer'); window.NexusApp.openUploadWizard(); this.closest('#test-guide-modal-container').innerHTML = '';" class="btn btn-primary btn-sm text-[10px] py-0.5">Launch AI Studio</button>
              </div>
              <p class="text-gray-300">1. Switch role to <strong>AI Engineer</strong>. Notice that <em>AI Studio & Artifacts</em> navigation appears.</p>
              <p class="text-gray-300">2. Fill out Step 1 (Metadata & Model) and Step 2 (Copilot System Instructions).</p>
              <p class="text-gray-300">3. In Step 3, maintain Demo Video timeline steps, add custom input logs and output code diffs.</p>
              <p class="text-gray-300">4. In Step 4, add a Knowledge Base runbook, specify semantic version <code class="text-cyan-300">v1.0.0</code>, and click <em>Publish to Enterprise Store</em>.</p>
            </div>

            <!-- Use Case 3 -->
            <div class="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                  <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
                  Use Case 3: Business Manager (KPIs, ROI Calculator & Adoption)
                </h4>
                <button onclick="window.NexusApp.setRole('business_manager'); window.NexusApp.navigate('dashboard'); this.closest('#test-guide-modal-container').innerHTML = '';" class="btn btn-secondary btn-sm text-[10px] py-0.5">Open Dashboard</button>
              </div>
              <p class="text-gray-300">1. Switch role to <strong>Business Manager</strong>.</p>
              <p class="text-gray-300">2. Inspect executive cards: Developer Hours Saved, Estimated ROI ($214k+/mo), Active Seats, and Certified Fleet.</p>
              <p class="text-gray-300">3. Click <strong>"Inspect KPI Formulas & Methodology"</strong> to see exact mathematical calculations.</p>
              <p class="text-gray-300">4. Adjust the <em>Blended Engineering Hourly Rate slider</em> (e.g. from $95/hr to $130/hr) to watch ROI recalculate live!</p>
            </div>

            <!-- Use Case 4 -->
            <div class="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-sm text-rose-300 flex items-center gap-1.5">
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                  Use Case 4: Governance & Audit Trail (Activity Tracking & Export)
                </h4>
                <button onclick="window.NexusApp.setRole('security_governance'); window.NexusApp.navigate('audit'); this.closest('#test-guide-modal-container').innerHTML = '';" class="btn btn-secondary btn-sm text-[10px] py-0.5">Open Audit Stream</button>
              </div>
              <p class="text-gray-300">1. Switch to <strong>Enterprise Governance</strong> role and navigate to <em>Activity Audit</em>.</p>
              <p class="text-gray-300">2. Perform any action in the UI (download VS Code zip, test in sandbox, or copy prompt).</p>
              <p class="text-gray-300">3. Verify the event appears instantly in the immutable audit stream with actor avatar, timestamp, and IP.</p>
              <p class="text-gray-300">4. Click <em>Inspect Payload</em> to view raw JSON for SIEM/Splunk ingestion, or click <em>Export CSV</em>.</p>
            </div>

            <!-- Use Case 5 -->
            <div class="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-sm text-purple-400 flex items-center gap-1.5">
                  <i data-lucide="sparkles" class="w-4 h-4"></i>
                  Use Case 5: Enterprise Prompt Library & Variable Interpolation
                </h4>
                <button onclick="window.NexusApp.setRole('developer'); window.NexusApp.navigate('prompts'); this.closest('#test-guide-modal-container').innerHTML = '';" class="btn btn-secondary btn-sm text-[10px] py-0.5">Explore Prompts</button>
              </div>
              <p class="text-gray-300">1. Open <strong>Prompt Library</strong>.</p>
              <p class="text-gray-300">2. Select a template (e.g. <em>Automated Unit Test Suite</em>).</p>
              <p class="text-gray-300">3. Edit the dynamic variable fields (<code class="text-cyan-300">{{test_runner}}</code>, <code class="text-cyan-300">{{coverage_target}}</code>) and watch the resolved prompt interpolate in real time.</p>
              <p class="text-gray-300">4. Click <em>Copy to Copilot</em> or download as <code class="text-purple-300">.prompt.md</code>.</p>
            </div>

          </div>

          <div class="pt-3 border-t border-[var(--border-subtle)] flex justify-end">
            <button onclick="this.closest('#test-guide-modal-container').innerHTML = ''" class="btn btn-primary btn-sm">Got it</button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  render() {
    // 1. Render Topbar Header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      headerContainer.innerHTML = Header.render(this.currentTab, this.currentRole);
    }

    const roleMeta = RoleMetadata[this.currentRole];

    // 2. Validate current tab with role permissions
    if (!roleMeta.allowedTabs.includes(this.currentTab)) {
      this.renderAccessDenied(this.currentTab);
      return;
    }

    // 3. Render Active Tab View
    switch (this.currentTab) {
      case 'catalog':
        MarketplaceCatalog.render();
        break;
      case 'prompts':
        PromptLibrary.render();
        break;
      case 'playground':
        InteractivePlayground.render();
        break;
      case 'studio':
        AgentUploadWizard.render();
        break;
      case 'dashboard':
        BusinessDashboard.render();
        break;
      case 'audit':
        AuditActivityStream.render();
        break;
      default:
        MarketplaceCatalog.render();
    }

    if (window.lucide) window.lucide.createIcons();
  }
};

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  NexusApp.init();
});
