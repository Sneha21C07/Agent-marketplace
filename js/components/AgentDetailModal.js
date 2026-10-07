/**
 * NexusAgent Enterprise - Agent Detail & Artifact Inspector Modal
 * Complete tabbed inspector for Demo Videos, Input/Output Docs, Knowledge Base, VS Code Copilot Setup, and Version Diffs
 */

import { StorageService } from '../storage.js';
import { CopilotExporter } from '../copilotExporter.js';
import { ActivityActionTypes, UserRoles } from '../types.js';

export const AgentDetailModal = {
  activeAgent: null,
  activeTab: 'demo', // 'demo' | 'inputs' | 'outputs' | 'kb' | 'architecture' | 'vscode' | 'versions'
  activeDocIndex: 0,
  activeKbIndex: 0,
  isPlayingVideo: false,
  videoStep: 0,
  videoInterval: null,
  isEditingName: false,
  editedName: '',
  showingArchitectureDiagram: false,

  open(agentId, initialTab = 'demo') {
    const agent = StorageService.getAgentById(agentId);
    if (!agent) return;

    this.activeAgent = agent;
    this.activeTab = initialTab;
    this.activeDocIndex = 0;
    this.activeKbIndex = 0;
    this.isPlayingVideo = false;
    this.videoStep = 0;
    if (this.videoInterval) clearInterval(this.videoInterval);
    this.isEditingName = false;
    this.editedName = '';

    this.render();
  },

  editName() {
    this.isEditingName = true;
    this.editedName = this.activeAgent?.name || '';
    this.render();
  },

  cancelEditName() {
    this.isEditingName = false;
    this.editedName = '';
    this.render();
  },

  saveEditedName() {
    if (!this.activeAgent) return;
    const currentRole = StorageService.getCurrentRole();
    if (currentRole !== UserRoles.AI_ENGINEER) {
      window.NexusApp.showToast('Permission denied: only AI Engineers can rename agents.', 'error');
      this.isEditingName = false;
      this.editedName = '';
      this.render();
      return;
    }
    const newName = String(this.editedName || '').trim();
    if (!newName) {
      window.NexusApp.showToast('Agent name cannot be empty.', 'error');
      return;
    }

    const updated = { ...this.activeAgent, name: newName };
    try {
      StorageService.saveAgent(updated);
      StorageService.logActivity(
        ActivityActionTypes.ARTIFACT_UPDATED,
        'Enterprise AI Engineer',
        'ai_engineer',
        updated.id,
        updated.name,
        `Renamed agent to "${newName}"`,
        { field: 'name' }
      );
      this.activeAgent = StorageService.getAgentById(updated.id) || updated;
      this.isEditingName = false;
      this.editedName = '';
      window.NexusApp.showToast(`Agent renamed to "${newName}"`, 'success');
      this.render();
    } catch (err) {
      console.error('Failed to rename agent:', err);
      window.NexusApp.showToast('Failed to rename agent.', 'error');
    }
  },

  close() {
    if (this.videoInterval) clearInterval(this.videoInterval);
    const modalEl = document.getElementById('agent-detail-modal-container');
    if (modalEl) modalEl.innerHTML = '';
  },

  setTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  selectDoc(index) {
    this.activeDocIndex = index;
    this.render();
  },

  selectKb(index) {
    this.activeKbIndex = index;
    this.render();
  },

  showArchitectureDiagram() {
    this.showingArchitectureDiagram = true;
    this.renderArchitectureDiagramLightbox();
  },

  hideArchitectureDiagram() {
    this.showingArchitectureDiagram = false;
    const lightboxEl = document.getElementById('architecture-diagram-lightbox');
    if (lightboxEl) lightboxEl.remove();
  },

  renderArchitectureDiagramLightbox() {
    if (!this.activeAgent || !this.activeAgent.architectureDiagram) return;
    
    const architecture = this.activeAgent.architectureDiagram;
    const imageSource = architecture.dataUrl || architecture.url || architecture.content || '';
    const container = document.createElement('div');
    container.id = 'architecture-diagram-lightbox';
    container.className = 'fixed inset-0 bg-black/80 flex items-center justify-center p-4 animate-fadeIn';
    container.style.zIndex = '200';
    container.onclick = (e) => {
      if (e.target === container) this.hideArchitectureDiagram();
    };
    
    container.innerHTML = `
      <div class="relative max-w-4xl max-h-[90vh] flex flex-col bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-medium)] overflow-hidden shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-gradient-to-r from-[var(--bg-tertiary)] to-[var(--bg-card)]">
          <div>
            <h3 class="text-lg font-bold text-white">${this.escapeHtml(architecture.title)}</h3>
            <p class="text-xs text-[var(--text-secondary)] mt-1">${this.escapeHtml(architecture.caption)}</p>
          </div>
          <button onclick="window.AgentDetailModal.hideArchitectureDiagram()" class="p-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)] transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        
        <!-- Content -->
        <div class="flex-1 overflow-auto p-4 bg-black/30">
          ${imageSource ? `
            <img src="${imageSource}" alt="${this.escapeHtml(architecture.title)}" class="max-w-full h-auto rounded-xl border border-[var(--border-medium)]">
          ` : `
            <div class="text-center text-[var(--text-muted)] py-8">
              <i data-lucide="image" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
              <p>No architecture diagram image available</p>
            </div>
          `}
        </div>
        
        <!-- Footer -->
        <div class="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-tertiary)]">
          <button onclick="window.AgentDetailModal.hideArchitectureDiagram()" class="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    if (window.lucide) window.lucide.createIcons();
  },

  toggleVideoPlay() {
    this.isPlayingVideo = !this.isPlayingVideo;
    if (this.isPlayingVideo) {
      this.videoInterval = setInterval(() => {
        const totalSteps = this.activeAgent?.artifacts?.demoVideo?.simulatedTimeline?.length || 1;
        this.videoStep = (this.videoStep + 1) % totalSteps;
        this.render();
      }, 3000);
    } else {
      if (this.videoInterval) clearInterval(this.videoInterval);
    }
    this.render();
  },

  setVideoStep(step) {
    this.videoStep = step;
    this.render();
  },

  async downloadZip() {
    if (!this.activeAgent) return;
    await CopilotExporter.downloadZipPackage(this.activeAgent, 'Enterprise Developer');
    window.NexusApp.showToast('Agent bundle (.zip) downloaded with all artifacts & VS Code configs!', 'success');
  },

  copyInstructions() {
    if (!this.activeAgent) return;
    const content = CopilotExporter.generateInstructionsMd(this.activeAgent);
    navigator.clipboard.writeText(content);
    StorageService.logActivity(
      ActivityActionTypes.VSCODE_CONFIG_COPIED,
      'Enterprise Developer',
      'developer',
      this.activeAgent.id,
      this.activeAgent.name,
      'Copied .github/copilot-instructions.md configuration to clipboard.'
    );
    window.NexusApp.showToast('.github/copilot-instructions.md copied to clipboard!', 'success');
  },

  copyVSCodeSettings() {
    if (!this.activeAgent) return;
    const content = CopilotExporter.generateVSCodeSettings(this.activeAgent);
    navigator.clipboard.writeText(content);
    window.NexusApp.showToast('.vscode/settings.json snippet copied!', 'success');
  },

  // Developer feedback state & handlers
  feedback: {
    rating: null, // 'up' | 'down'
    challenges: '',
    outcomes: ''
  },

  // AI Engineer outcome comments state
  engineerComments: [],
  newEngineerComment: '',

  updateNewEngineerComment(val) {
    this.newEngineerComment = val;
  },

  submitEngineerOutcome() {
    if (!this.activeAgent) return;
    const role = StorageService.getCurrentRole();
    if (role !== UserRoles.AI_ENGINEER) {
      window.NexusApp.showToast('Only AI Engineers may add outcome comments.', 'error');
      return;
    }
    const text = String(this.newEngineerComment || '').trim();
    if (!text) {
      window.NexusApp.showToast('Outcome comment cannot be empty.', 'error');
      return;
    }

    const agent = { ...this.activeAgent };
    agent.engineerOutcomes = agent.engineerOutcomes || [];
    const entry = {
      id: `ec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: { name: 'AI Engineer', role: UserRoles.AI_ENGINEER },
      text
    };
    agent.engineerOutcomes.unshift(entry);

    try {
      StorageService.saveAgent(agent);
      StorageService.logActivity(
        ActivityActionTypes.ENGINEER_OUTCOME_COMMENT,
        entry.author.name,
        UserRoles.AI_ENGINEER,
        agent.id,
        agent.name,
        `AI Engineer outcome comment added.`,
        { excerpt: text.slice(0, 120) }
      );
      this.newEngineerComment = '';
      this.activeAgent = StorageService.getAgentById(agent.id) || agent;
      window.NexusApp.showToast('Outcome comment saved.', 'success');
      this.render();
    } catch (err) {
      console.error('Failed to save engineer comment:', err);
      window.NexusApp.showToast('Failed to save comment.', 'error');
    }
  },

  setFeedbackRating(r) {
    this.feedback.rating = r;
    this.render();
  },

  updateFeedbackField(field, value) {
    if (!['challenges', 'outcomes'].includes(field)) return;
    this.feedback[field] = value;
  },

  submitDeveloperFeedback() {
    if (!this.activeAgent) return;
    const rating = this.feedback.rating;
    const challenges = String(this.feedback.challenges || '').trim();
    const outcomes = String(this.feedback.outcomes || '').trim();

    if (!rating && !challenges && !outcomes) {
      window.NexusApp.showToast('Please provide feedback or a thumbs rating before submitting.', 'error');
      return;
    }

    // Attach feedback to agent metadata (client-side only)
    const agent = { ...this.activeAgent };
    agent.developerFeedback = agent.developerFeedback || [];
    const entry = {
      id: `fb-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: { name: 'Enterprise Developer', role: 'developer' },
      rating,
      challenges,
      outcomes
    };
    agent.developerFeedback.unshift(entry);

    try {
      StorageService.saveAgent(agent);
      StorageService.logActivity(
        ActivityActionTypes.DEVELOPER_FEEDBACK,
        entry.actor.name,
        'developer',
        agent.id,
        agent.name,
        `Developer feedback submitted: rating=${rating} challenges=${challenges ? 'yes' : 'no'} outcomes=${outcomes ? 'yes' : 'no'}`,
        { rating, challenges: !!challenges, outcomes: !!outcomes }
      );

      // Reset feedback form
      this.feedback.rating = null;
      this.feedback.challenges = '';
      this.feedback.outcomes = '';
      window.NexusApp.showToast('Thanks — your feedback has been recorded.', 'success');
      this.activeAgent = StorageService.getAgentById(agent.id) || agent;
      this.render();
    } catch (err) {
      console.error('Failed to save developer feedback:', err);
      window.NexusApp.showToast('Failed to submit feedback.', 'error');
    }
  },

  render() {
    const modalEl = document.getElementById('agent-detail-modal-container');
    if (!modalEl || !this.activeAgent) return;

    const agent = this.activeAgent;
    const artifacts = agent.artifacts || {};
    const demo = artifacts.demoVideo || {};
    const inputDocs = artifacts.inputDocuments || [];
    const outputDocs = artifacts.outputDocuments || [];
    const kbItems = artifacts.knowledgeBase || [];
    const versions = agent.versions || [];

    modalEl.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target === this) window.AgentDetailModal.close()">
        <div class="modal-content glass-panel p-6 sm:p-8 space-y-6 max-w-5xl">
          
          <!-- Top Header: Agent Title, Badges & Close Button -->
          <div class="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl" style="background: linear-gradient(135deg, ${agent.color}33, ${agent.color}11); border: 1px solid ${agent.color}66;">
                <i data-lucide="${agent.icon || 'bot'}" class="w-7 h-7" style="color: ${agent.color}"></i>
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2.5 flex-wrap">
                  ${this.isEditingName ? `
                    <div class="flex items-center gap-2">
                      <input type="text" value="${this.escapeHtml(this.editedName)}" oninput="window.AgentDetailModal.editedName = this.value" class="input-field text-sm font-bold" />
                      <button onclick="window.AgentDetailModal.saveEditedName()" class="btn btn-primary btn-xs ml-1">Save</button>
                      <button onclick="window.AgentDetailModal.cancelEditName()" class="btn btn-secondary btn-xs ml-1">Cancel</button>
                    </div>
                  ` : `
                    <h2 class="text-xl sm:text-2xl font-extrabold text-white">${this.escapeHtml(agent.name)}</h2>
                    ${StorageService.getCurrentRole() === UserRoles.AI_ENGINEER ? `<button onclick="window.AgentDetailModal.editName()" class="btn btn-ghost btn-xs ml-1 text-[10px]">Rename</button>` : ''}
                  `}
                  <span class="badge badge-purple font-mono">v${agent.version}</span>
                  <span class="badge badge-emerald"><i data-lucide="shield-check" class="w-3 h-3"></i> Enterprise Certified</span>
                </div>
                <p class="text-xs sm:text-sm text-[var(--text-secondary)]">${agent.tagline}</p>
                <div class="flex items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
                  <span>Model: <strong class="text-purple-300">${agent.copilotModel}</strong></span>
                  <span>Chat: <code class="px-1.5 py-0.5 rounded bg-[var(--bg-input)] text-cyan-300 font-mono">${agent.copilotChatHandle}</code></span>
                  <span>Maintainer: <strong class="text-white">${agent.author.name}</strong> (${agent.author.team})</span>
                </div>
              </div>
            </div>

            <!-- Close & Quick Download -->
            <div class="flex items-center gap-2">
              <button onclick="window.AgentDetailModal.downloadZip()" class="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md">
                <i data-lucide="download" class="w-4 h-4"></i>
                <span class="hidden sm:inline">Get VS Code Bundle</span>
              </button>
              <button onclick="window.AgentDetailModal.close()" class="p-2 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-tertiary)] transition-colors">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Navigation Tabs -->
          <div class="flex items-center gap-2 overflow-x-auto border-b border-[var(--border-subtle)] pb-1 scrollbar-none">
            <button onclick="window.AgentDetailModal.setTab('demo')" class="nav-tab ${this.activeTab === 'demo' ? 'active' : ''}">
              <i data-lucide="video" class="w-4 h-4 text-purple-400"></i>
              <span>Demo Walkthrough</span>
            </button>
            <button onclick="window.AgentDetailModal.setTab('inputs')" class="nav-tab ${this.activeTab === 'inputs' ? 'active' : ''}">
              <i data-lucide="file-input" class="w-4 h-4 text-cyan-400"></i>
              <span>Input Documents (${inputDocs.length})</span>
            </button>
            <button onclick="window.AgentDetailModal.setTab('outputs')" class="nav-tab ${this.activeTab === 'outputs' ? 'active' : ''}">
              <i data-lucide="file-output" class="w-4 h-4 text-emerald-400"></i>
              <span>Output Documents (${outputDocs.length})</span>
            </button>
            <button onclick="window.AgentDetailModal.setTab('kb')" class="nav-tab ${this.activeTab === 'kb' ? 'active' : ''}">
              <i data-lucide="book-open" class="w-4 h-4 text-amber-400"></i>
              <span>Knowledge Base (${kbItems.length})</span>
            </button>
            <button onclick="window.AgentDetailModal.setTab('architecture')" class="nav-tab ${this.activeTab === 'architecture' ? 'active' : ''}">
              <i data-lucide="image" class="w-4 h-4 text-violet-400"></i>
              <span>Architecture Diagram</span>
            </button>
            <button onclick="window.AgentDetailModal.setTab('vscode')" class="nav-tab ${this.activeTab === 'vscode' ? 'active' : ''}">
              <i data-lucide="code" class="w-4 h-4 text-blue-400"></i>
              <span>VS Code Copilot Setup</span>
            </button>
            <button onclick="window.AgentDetailModal.setTab('versions')" class="nav-tab ${this.activeTab === 'versions' ? 'active' : ''}">
              <i data-lucide="git-branch" class="w-4 h-4 text-rose-400"></i>
              <span>Versions & Diffs (${versions.length})</span>
            </button>
          </div>

          <!-- Tab Content Bodies -->
          <div class="min-h-[380px]">
            ${this.renderTabContent()}
          </div>

          <!-- Developer Remarks (visible to Developers) -->
          ${StorageService.getCurrentRole() === 'developer' ? `
            <div class="pt-4 border-t border-[var(--border-subtle)] space-y-3">
              <h4 class="text-sm font-bold text-white">Developer Remarks & Feedback</h4>
              <div class="flex items-center gap-3">
                <button onclick="window.AgentDetailModal.setFeedbackRating('up')" class="btn ${this.feedback.rating === 'up' ? 'btn-primary' : 'btn-ghost'} btn-sm">👍</button>
                <button onclick="window.AgentDetailModal.setFeedbackRating('down')" class="btn ${this.feedback.rating === 'down' ? 'btn-danger' : 'btn-ghost'} btn-sm">👎</button>
                <span class="text-xs text-[var(--text-muted)]">Quick Thumbs</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1">Challenges (what failed / surprising)</label>
                  <textarea rows="3" oninput="window.AgentDetailModal.updateFeedbackField('challenges', this.value)" class="input-field text-xs">${this.escapeHtml(this.feedback.challenges)}</textarea>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1">Outcomes (what worked / expected)</label>
                  <textarea rows="3" oninput="window.AgentDetailModal.updateFeedbackField('outcomes', this.value)" class="input-field text-xs">${this.escapeHtml(this.feedback.outcomes)}</textarea>
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button onclick="window.AgentDetailModal.submitDeveloperFeedback()" class="btn btn-primary btn-sm">Submit Feedback</button>
              </div>
            </div>
          ` : ''}

          <!-- AI Engineer Outcome Comments -->
          ${StorageService.getCurrentRole() === UserRoles.AI_ENGINEER ? `
            <div class="pt-4 border-t border-[var(--border-subtle)] space-y-3">
              <h4 class="text-sm font-bold text-white">Outcome Comments</h4>
              <div class="space-y-2">
                ${(agent.engineerOutcomes || []).length === 0 ? `
                  <div class="text-xs text-[var(--text-muted)] p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">No outcome comments yet.</div>
                ` : (agent.engineerOutcomes || []).map(o => `
                  <div class="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-1">
                    <div class="flex items-center justify-between gap-2">
                      <div class="text-xs font-semibold text-white">${this.escapeHtml(o.author?.name || 'AI Engineer')}</div>
                      <div class="text-[10px] text-[var(--text-muted)]">${new Date(o.timestamp).toLocaleString()}</div>
                    </div>
                    <div class="text-xs text-[var(--text-secondary)]">${this.escapeHtml(o.text)}</div>
                  </div>
                `).join('')}
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-300 mb-1">Add Outcome Comment</label>
                <textarea rows="3" placeholder="Example: Dev Time Saved: 120 hours/month" oninput="window.AgentDetailModal.updateNewEngineerComment(this.value)" class="input-field text-xs">${this.escapeHtml(this.newEngineerComment || '')}</textarea>
              </div>

              <div class="flex justify-end pt-2">
                <button onclick="window.AgentDetailModal.submitEngineerOutcome()" class="btn btn-primary btn-sm">Save Outcome</button>
              </div>
            </div>
          ` : ''}

          <!-- Footer Actions -->
          <div class="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1.5"><i data-lucide="shield" class="w-4 h-4 text-emerald-400"></i> OWASP & SOC2 Type II Certified</span>
              <span class="flex items-center gap-1.5"><i data-lucide="lock" class="w-4 h-4 text-purple-400"></i> PII Redaction Active</span>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button onclick="window.NexusApp.openPlaygroundWithAgent('${agent.id}')" class="btn btn-secondary btn-sm flex-1 sm:flex-initial flex items-center justify-center gap-1.5">
                <i data-lucide="play" class="w-3.5 h-3.5 text-cyan-400"></i>
                Test in Copilot Sandbox
              </button>
              <button onclick="window.AgentDetailModal.downloadZip()" class="btn btn-primary btn-sm flex-1 sm:flex-initial flex items-center justify-center gap-1.5">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                Download Bundle (.zip)
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderTabContent() {
    const agent = this.activeAgent;
    const artifacts = agent.artifacts || {};

    // 1. DEMO WALKTHROUGH TAB
    if (this.activeTab === 'demo') {
      const demo = artifacts.demoVideo || { title: 'VS Code Demo', simulatedTimeline: [] };
      const steps = demo.simulatedTimeline || [];
      const currentStepObj = steps[this.videoStep] || steps[0] || { time: '0:00', title: 'Demo', detail: 'Ready' };

      return `
        <div class="space-y-4 animate-fadeIn">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="film" class="w-4 h-4 text-purple-400"></i>
                ${demo.title}
              </h3>
              <p class="text-xs text-[var(--text-secondary)]">Simulated live execution recording within VS Code GitHub Copilot Chat</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-purple">${demo.duration || '2m'}</span>
              <span class="badge badge-cyan">${demo.resolution || '1080p 60fps'}</span>
            </div>
          </div>

          <!-- Video Player Simulation Container -->
          <div class="video-player-container bg-[#080b12] border border-[var(--border-medium)] rounded-2xl overflow-hidden shadow-2xl relative">
            
            <!-- VS Code Mock Header -->
            <div class="bg-[#181d28] px-4 py-2 flex items-center justify-between border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              <div class="flex items-center gap-2">
                <div class="flex gap-1.5">
                  <div class="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div class="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div class="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <span class="font-mono text-[11px] text-gray-300 ml-2">VS Code — workspace-prod [GitHub Copilot Chat]</span>
              </div>
              <div class="flex items-center gap-2 font-mono text-[11px]">
                <span class="text-purple-400">${agent.copilotChatHandle}</span>
                <span class="text-emerald-400">● LIVE RUNNER</span>
              </div>
            </div>

            <!-- VS Code Copilot Chat Mock Workspace -->
            <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[260px] max-h-[340px] overflow-y-auto">
              
              <!-- Left: File Editor Preview -->
              <div class="md:col-span-2 bg-[#050811] p-4 rounded-xl border border-[var(--border-subtle)] font-mono text-xs text-gray-300 space-y-2">
                <div class="flex items-center justify-between text-[11px] text-[var(--text-muted)] border-b border-gray-800 pb-1.5">
                  <span class="flex items-center gap-1.5 text-cyan-300"><i data-lucide="file-code" class="w-3.5 h-3.5"></i> active-workspace/manifest.yaml</span>
                  <span>Step ${this.videoStep + 1} of ${steps.length}</span>
                </div>
                <div class="space-y-1 text-[11.5px] leading-relaxed">
                  <div class="text-emerald-400 font-bold"># Step ${this.videoStep + 1}: ${currentStepObj.title}</div>
                  <div class="text-purple-300 mt-2">${currentStepObj.detail}</div>
                  <div class="p-2.5 rounded bg-black/40 border border-gray-800 text-gray-400 text-[11px] mt-3">
                    <span class="text-cyan-400">$</span> copilot-agent --exec "${agent.copilotChatHandle}" --inspect-artifacts
                    <br><span class="text-emerald-300">✓ Knowledge Base Context Injected (2 documents parsed)</span>
                    <br><span class="text-purple-300">✓ Generating patch diff with zero security violations...</span>
                  </div>
                </div>
              </div>

              <!-- Right: Copilot Chat Panel -->
              <div class="bg-[#111625] p-3 rounded-xl border border-purple-500/20 flex flex-col justify-between text-xs">
                <div class="space-y-2">
                  <div class="flex items-center gap-1.5 text-purple-300 font-bold border-b border-purple-500/20 pb-1">
                    <i data-lucide="bot" class="w-3.5 h-3.5"></i> Copilot Chat Agent
                  </div>
                  <div class="text-[11px] text-gray-300 leading-snug bg-purple-950/40 p-2 rounded border border-purple-800/30">
                    "${agent.copilotChatHandle} is currently active and executing with prompt constraints."
                  </div>
                  <div class="text-[10px] text-emerald-400 flex items-center gap-1">
                    <i data-lucide="check" class="w-3 h-3"></i> 0 SAST Vulnerabilities Found
                  </div>
                </div>
                <div class="pt-2">
                  <div class="text-[10px] text-gray-400 mb-1">Target Model: ${agent.copilotModel}</div>
                  <button onclick="window.NexusApp.openPlaygroundWithAgent('${agent.id}')" class="btn btn-cyan btn-sm w-full text-[11px] py-1">
                    Launch Interactive Playground
                  </button>
                </div>
              </div>

            </div>

            <!-- Video Player Controls Bar -->
            <div class="bg-[#111624] px-4 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <button onclick="window.AgentDetailModal.toggleVideoPlay()" class="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors">
                  <i data-lucide="${this.isPlayingVideo ? 'pause' : 'play'}" class="w-4 h-4"></i>
                </button>
                <span class="text-xs font-mono text-gray-300">${currentStepObj.time || '0:00'} / ${demo.duration || '2:00'}</span>
              </div>

              <!-- Step Navigation Dots -->
              <div class="flex items-center gap-1.5">
                ${steps.map((s, idx) => `
                  <button 
                    onclick="window.AgentDetailModal.setVideoStep(${idx})"
                    class="px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${this.videoStep === idx 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white'}"
                    title="${s.title}"
                  >
                    ${idx + 1}
                  </button>
                `).join('')}
              </div>
            </div>

          </div>
        </div>
      `;
    }

    // 2. INPUT DOCUMENTS TAB
    if (this.activeTab === 'inputs') {
      const docs = artifacts.inputDocuments || [];
      const currentDoc = docs[this.activeDocIndex] || docs[0];

      if (docs.length === 0) {
        return `<div class="p-8 text-center text-gray-400">No input sample documents registered.</div>`;
      }

      return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          <!-- Document List Sidebar -->
          <div class="space-y-2">
            <div class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Input Artifacts (${docs.length})</div>
            ${docs.map((doc, idx) => `
              <div 
                onclick="window.AgentDetailModal.selectDoc(${idx})"
                class="p-3 rounded-xl cursor-pointer border transition-all ${this.activeDocIndex === idx 
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-md' 
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'}"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold truncate">${doc.title}</span>
                  <span class="badge badge-cyan text-[9px]">${doc.fileType}</span>
                </div>
                <div class="text-[11px] font-mono text-[var(--text-muted)] mt-1 flex items-center gap-2">
                  <span>${doc.filename}</span>
                  <span>•</span>
                  <span>${doc.size}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Document Content Viewer -->
          <div class="md:col-span-2 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-white">${currentDoc.title}</h4>
                <p class="text-xs text-[var(--text-secondary)]">${currentDoc.description}</p>
              </div>
              <button onclick="navigator.clipboard.writeText(\`${currentDoc.content}\`); window.NexusApp.showToast('Input document copied!', 'success')" class="btn btn-secondary btn-sm flex items-center gap-1">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy Content
              </button>
            </div>
            <pre class="code-block max-h-[320px] text-xs"><code>${this.escapeHtml(currentDoc.content)}</code></pre>
          </div>
        </div>
      `;
    }

    // 3. OUTPUT DOCUMENTS TAB
    if (this.activeTab === 'outputs') {
      const docs = artifacts.outputDocuments || [];
      const currentDoc = docs[this.activeDocIndex] || docs[0];

      if (docs.length === 0) {
        return `<div class="p-8 text-center text-gray-400">No output sample documents registered.</div>`;
      }

      return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          <!-- Output Document List Sidebar -->
          <div class="space-y-2">
            <div class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Output Artifacts (${docs.length})</div>
            ${docs.map((doc, idx) => `
              <div 
                onclick="window.AgentDetailModal.selectDoc(${idx})"
                class="p-3 rounded-xl cursor-pointer border transition-all ${this.activeDocIndex === idx 
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-md' 
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'}"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold truncate">${doc.title}</span>
                  <span class="badge badge-emerald text-[9px]">${doc.fileType}</span>
                </div>
                <div class="text-[11px] font-mono text-[var(--text-muted)] mt-1 flex items-center gap-2">
                  <span>${doc.filename}</span>
                  <span>•</span>
                  <span>${doc.size}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Output Document Content Viewer -->
          <div class="md:col-span-2 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-white">${currentDoc.title}</h4>
                <p class="text-xs text-[var(--text-secondary)]">${currentDoc.description}</p>
              </div>
              <button onclick="navigator.clipboard.writeText(\`${currentDoc.content}\`); window.NexusApp.showToast('Output document copied!', 'success')" class="btn btn-secondary btn-sm flex items-center gap-1">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy Content
              </button>
            </div>
            <pre class="code-block max-h-[320px] text-xs"><code>${this.escapeHtml(currentDoc.content)}</code></pre>
          </div>
        </div>
      `;
    }

    // 4. KNOWLEDGE BASE TAB
    if (this.activeTab === 'kb') {
      const kbItems = artifacts.knowledgeBase || [];
      const currentKb = kbItems[this.activeKbIndex] || kbItems[0];

      if (kbItems.length === 0) {
        return `<div class="p-8 text-center text-gray-400">No knowledge base runbooks attached.</div>`;
      }

      return `
        <div class="space-y-6 animate-fadeIn">
          <div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-2">
                <div class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Knowledge Base Runbooks (${kbItems.length})</div>
                ${kbItems.map((kb, idx) => `
                  <div 
                    onclick="window.AgentDetailModal.selectKb(${idx})"
                    class="p-3 rounded-xl cursor-pointer border transition-all ${this.activeKbIndex === idx 
                      ? 'bg-amber-950/40 border-amber-500/50 text-white shadow-md' 
                      : 'bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'}"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold truncate">${kb.title}</span>
                      <span class="badge badge-amber text-[9px]">${kb.category}</span>
                    </div>
                    <div class="text-[11px] text-[var(--text-muted)] mt-1 flex items-center justify-between">
                      <span>${kb.author}</span>
                      <span>${kb.tokenCount} tokens</span>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div class="md:col-span-2 space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-bold text-white">${currentKb.title}</h4>
                    <p class="text-xs text-[var(--text-secondary)]">${currentKb.description || 'Enterprise knowledge document injected into Copilot context.'}</p>
                  </div>
                  <button onclick="navigator.clipboard.writeText(\`${currentKb.content}\`); window.NexusApp.showToast('Knowledge base markdown copied!', 'success')" class="btn btn-secondary btn-sm flex items-center gap-1">
                    <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy Markdown
                  </button>
                </div>
                <pre class="code-block max-h-[320px] text-xs"><code>${this.escapeHtml(currentKb.content)}</code></pre>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // 5. ARCHITECTURE DIAGRAM TAB
    if (this.activeTab === 'architecture') {
      const architecture = agent.architectureDiagram;
      const imageUrl = architecture && (architecture.dataUrl || architecture.url || architecture.content);

      if (!architecture || !imageUrl) {
        return `<div class="p-8 text-center text-gray-400">No architecture diagram attached to this agent.</div>`;
      }

      return `
        <div class="space-y-5 animate-fadeIn">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-bold text-white">${this.escapeHtml(architecture.title || 'System Architecture Diagram')}</h3>
              <p class="text-xs text-[var(--text-secondary)]">${this.escapeHtml(architecture.caption || 'Full-size view of the attached architecture diagram.')}</p>
            </div>
            <button onclick="window.AgentDetailModal.showArchitectureDiagram()" class="btn btn-secondary btn-sm flex items-center gap-1">
              <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
              Full View
            </button>
          </div>
          <div class="rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-input)] p-3 overflow-hidden">
            <img src="${imageUrl}" alt="${this.escapeHtml(architecture.title || 'Architecture Diagram')}" class="w-full h-auto max-h-[72vh] object-contain rounded-xl border border-[var(--border-subtle)] bg-black/20">
          </div>
        </div>
      `;
    }

    // 6. VS CODE SETUP TAB
    if (this.activeTab === 'vscode') {
      const instructions = CopilotExporter.generateInstructionsMd(agent);
      const vscodeSettings = CopilotExporter.generateVSCodeSettings(agent);

      return `
        <div class="space-y-6 animate-fadeIn">
          <div class="bg-gradient-to-r from-purple-900/30 to-blue-900/20 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between">
            <div>
              <h4 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
                1-Click GitHub Copilot Integration for VS Code
              </h4>
              <p class="text-xs text-[var(--text-secondary)]">Drop the config files below directly into your project's root folder.</p>
            </div>
            <button onclick="window.AgentDetailModal.downloadZip()" class="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md">
              <i data-lucide="download" class="w-4 h-4"></i> Download All (.zip)
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 1. .github/copilot-instructions.md -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                  <i data-lucide="file-text" class="w-3.5 h-3.5"></i> .github/copilot-instructions.md
                </span>
                <button onclick="window.AgentDetailModal.copyInstructions()" class="btn btn-secondary btn-sm py-1 text-[11px] flex items-center gap-1">
                  <i data-lucide="copy" class="w-3 h-3"></i> Copy
                </button>
              </div>
              <pre class="code-block max-h-[220px] text-xs"><code>${this.escapeHtml(instructions)}</code></pre>
            </div>

            <!-- 2. .vscode/settings.json -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                  <i data-lucide="settings" class="w-3.5 h-3.5"></i> .vscode/settings.json
                </span>
                <button onclick="window.AgentDetailModal.copyVSCodeSettings()" class="btn btn-secondary btn-sm py-1 text-[11px] flex items-center gap-1">
                  <i data-lucide="copy" class="w-3 h-3"></i> Copy
                </button>
              </div>
              <pre class="code-block max-h-[220px] text-xs"><code>${this.escapeHtml(vscodeSettings)}</code></pre>
            </div>
          </div>
        </div>
      `;

    }

    // 6. VERSIONS & DIFFS TAB
    if (this.activeTab === 'versions') {
      const versions = agent.versions || [];
      return `
        <div class="space-y-4 animate-fadeIn">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-white">Semantic Version Release History</h4>
            <button onclick="window.NexusApp.openUploadWizard('${agent.id}')" class="btn btn-primary btn-sm flex items-center gap-1">
              <i data-lucide="git-pull-request" class="w-3.5 h-3.5"></i> Publish New Version
            </button>
          </div>

          <div class="space-y-3">
            ${versions.map(v => `
              <div class="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-white text-sm">v${v.version}</span>
                    <span class="badge ${v.status === 'CURRENT_STABLE' ? 'badge-emerald' : 'badge-zinc'} text-[10px]">
                      ${v.status}
                    </span>
                  </div>
                  <span class="text-xs text-[var(--text-muted)]">${v.releaseDate} by ${v.author}</span>
                </div>
                <p class="text-xs text-[var(--text-secondary)]">${v.changelog}</p>
                ${v.instructionsDiff ? `
                  <pre class="code-block text-[11px] p-2 bg-black/40 text-gray-300"><code>${this.escapeHtml(v.instructionsDiff)}</code></pre>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return '';
  },

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};
