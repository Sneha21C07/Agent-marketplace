/**
 * NexusAgent Enterprise - Marketplace Catalog Component
 * Agent Discovery, Category Filters, Search, and Quick Artifact Actions
 */

import { StorageService } from '../storage.js';
import { AgentCategories, BusinessCategories, UserRoles } from '../types.js';
import { getOutcomeHoursSaved } from '../metrics.js';

export const MarketplaceCatalog = {
  state: {
    searchQuery: '',
    selectedCategory: 'ALL',
    selectedTag: null,
    sortBy: 'popular',
    editingAuthorId: null,
    editedAuthorName: ''
  },

  moveAgentToBusinessCategory(agentId, categoryId) {
    if (StorageService.getCurrentRole() !== UserRoles.AI_ENGINEER) return;
    const agent = StorageService.getAgentById(agentId);
    if (!agent) return;
    StorageService.saveAgent({ ...agent, businessCategory: categoryId });
    this.render();
  },

  editAuthor(agentId) {
    if (StorageService.getCurrentRole() !== UserRoles.AI_ENGINEER) return;
    const agent = StorageService.getAgentById(agentId);
    if (!agent) return;
    this.state.editingAuthorId = agent.id;
    this.state.editedAuthorName = agent.author?.name || '';
    this.render();
  },

  cancelEditAuthor() {
    this.state.editingAuthorId = null;
    this.state.editedAuthorName = '';
    this.render();
  },

  saveEditedAuthor(agentId) {
    if (StorageService.getCurrentRole() !== UserRoles.AI_ENGINEER) return;
    const agent = StorageService.getAgentById(agentId);
    if (!agent) return;

    const newName = String(this.state.editedAuthorName || '').trim();
    if (!newName) {
      if (window.NexusApp) {
        window.NexusApp.showToast('Author name cannot be empty.', 'error');
      }
      return;
    }

    const updated = {
      ...agent,
      author: {
        ...agent.author,
        name: newName
      }
    };

    try {
      StorageService.saveAgent(updated);
      this.state.editingAuthorId = null;
      this.state.editedAuthorName = '';
      if (window.NexusApp) {
        window.NexusApp.showToast('Agent author updated.', 'success');
      }
      this.render();
    } catch (error) {
      console.error('Failed to update author:', error);
      if (window.NexusApp) {
        window.NexusApp.showToast('Failed to update author.', 'error');
      }
    }
  },

  setCategory(category) {
    this.state.selectedCategory = category;
    this.render();
  },

  setSearch(query) {
    this.state.searchQuery = query.toLowerCase();
    this.render();
  },

  getSummaryMetrics() {
    const agents = StorageService.getAgents();
    const registryCount = agents.length;
    const totalDownloads = agents.reduce((sum, agent) => sum + (Number(agent.downloads) || 0), 0);
    const totalHoursSaved = agents.reduce((sum, agent) => {
      const hours = getOutcomeHoursSaved(agent);
      return sum + (Number.isFinite(hours) ? hours : 0);
    }, 0);

    const passedSecurityCount = agents.filter(agent => {
      const securityStatus = String(agent.securityStatus || '').toLowerCase();
      const complianceState = String(agent.complianceStatus || '').toLowerCase();
      return agent.certified === true || agent.securityValidated === true || securityStatus.includes('passed') || complianceState.includes('passed');
    }).length;

    const complianceRate = registryCount > 0 ? Math.round((passedSecurityCount / registryCount) * 100) : 100;

    return {
      registryCount,
      totalDownloads,
      totalHoursSaved,
      complianceRate
    };
  },

  render() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const agents = StorageService.getAgents();
    const currentRole = StorageService.getCurrentRole();
    const isEngineerView = currentRole === UserRoles.AI_ENGINEER;
    const summary = this.getSummaryMetrics();

    // Filter agents
    const filteredAgents = agents.filter(agent => {
      const normalizedStatus = String(agent.certificationStatus || '').toUpperCase();
      const isCertified = normalizedStatus === 'CERTIFIED';
      const matchesRoleVisibility = currentRole !== UserRoles.DEVELOPER || isCertified;
      const matchesCategory = this.state.selectedCategory === 'ALL' || agent.category === this.state.selectedCategory;
      const matchesSearch = !this.state.searchQuery || 
        agent.name.toLowerCase().includes(this.state.searchQuery) ||
        agent.tagline.toLowerCase().includes(this.state.searchQuery) ||
        agent.copilotChatHandle.toLowerCase().includes(this.state.searchQuery) ||
        agent.tags.some(t => t.toLowerCase().includes(this.state.searchQuery));
      return matchesRoleVisibility && matchesCategory && matchesSearch;
    }).sort((a, b) => {
      const aIsCertified = String(a.certificationStatus || '').toUpperCase() === 'CERTIFIED';
      const bIsCertified = String(b.certificationStatus || '').toUpperCase() === 'CERTIFIED';
      return Number(bIsCertified) - Number(aIsCertified);
    });

    const categories = ['ALL', ...Object.values(AgentCategories)];

    container.innerHTML = `
      <div class="space-y-8 animate-fadeIn">
        
        <!-- Hero Banner: GitHub Copilot Enterprise Marketplace -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#18132b] via-[#101935] to-[#0c1e28] border border-[var(--border-medium)] p-8 sm:p-10 shadow-2xl">
          <!-- Background Glow Orbs -->
          <div class="absolute -right-20 -top-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute right-1/3 -bottom-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 max-w-3xl space-y-4">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i>
              Enterprise Verified Agents for GitHub Copilot in VS Code
            </div>

            <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Enterprise <span class="text-gradient-purple">Agentic Marketplace</span> & Artifact Registry
            </h1>
            
            <p class="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              Discover, version, and download specialized GitHub Copilot agents with complete artifact bundles—including 
              <strong class="text-purple-300">interactive demo walkthroughs</strong>, <strong class="text-cyan-300">input/output documents</strong>, and <strong class="text-emerald-300">enterprise knowledge bases</strong> ready for 1-click VS Code deployment.
            </p>

            <!-- Quick Metrics Header Ticker -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-[var(--border-subtle)]">
              <div>
                <div class="text-xl font-bold text-white">${summary.registryCount.toLocaleString()} Enterprise</div>
                <div class="text-[11px] text-[var(--text-muted)]">Agents in Registry</div>
              </div>
              <div>
                <div class="text-xl font-bold text-cyan-400">${summary.totalDownloads.toLocaleString()}+</div>
                <div class="text-[11px] text-[var(--text-muted)]">VS Code Installations</div>
              </div>
              <div>
                <div class="text-xl font-bold text-purple-400">${Math.round(summary.totalHoursSaved).toLocaleString()} hrs</div>
                <div class="text-[11px] text-[var(--text-muted)]">Dev Time Saved / Mo</div>
              </div>
              <div>
                <div class="text-xl font-bold text-emerald-400">${summary.complianceRate}% Passed</div>
                <div class="text-[11px] text-[var(--text-muted)]">Security & Prompt Injection</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Business Category Lanes -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-white">Business Categories</h2>
            ${isEngineerView ? `<span class="text-[11px] text-[var(--text-muted)]">AI Engineer: use <strong class="text-purple-300">Move →</strong> on any agent card to reassign it</span>` : ''}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${BusinessCategories.map(bc => {
              const bcAgents = agents.filter(a => a.businessCategory === bc.id);
              return `
                <div class="glass-panel rounded-2xl border ${bc.border} bg-gradient-to-b ${bc.gradient} flex flex-col">
                  <!-- Card Header -->
                  <div class="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)]">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style="background:${bc.color}22; border:1px solid ${bc.color}44;">
                      <i data-lucide="${bc.icon}" class="w-5 h-5" style="color:${bc.color}"></i>
                    </div>
                    <div>
                      <div class="font-bold text-sm text-white">${bc.label}</div>
                      <div class="text-[10px] text-[var(--text-muted)] leading-tight">${bc.description}</div>
                    </div>
                    <span class="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style="background:${bc.color}22; color:${bc.color}; border:1px solid ${bc.color}44;">${bcAgents.length}</span>
                  </div>
                  <!-- Agent List -->
                  <div class="flex flex-col gap-1 p-3 min-h-[80px]">
                    ${bcAgents.length === 0
                      ? `<div class="text-[11px] text-[var(--text-muted)] italic py-4 text-center">No agents assigned yet</div>`
                      : bcAgents.map(a => {
                          const isEngineer = isEngineerView;
                          const architectureAttachment = a.architectureDiagram?.attachment || null;
                          const hasArchitectureAttachment = Boolean(architectureAttachment && (architectureAttachment.name || architectureAttachment.content));
                          const otherCats = BusinessCategories.filter(c => c.id !== bc.id);
                          return `
                            <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-all">
                              <div class="flex items-center gap-2 min-w-0">
                                <i data-lucide="${a.icon || 'bot'}" class="w-3.5 h-3.5 shrink-0" style="color:${a.color}"></i>
                                <span class="text-xs font-semibold text-white truncate cursor-pointer hover:text-purple-300" onclick="window.NexusApp.openAgentDetail('${a.id}')">${this.escapeHtml(a.name)}</span>
                                <span class="badge ${hasArchitectureAttachment ? 'badge-blue' : 'badge-zinc'} text-[9px] shrink-0" title="${hasArchitectureAttachment ? this.escapeHtml(architectureAttachment.name || 'Architecture attachment available') : 'No architecture attachment'}">
                                  <i data-lucide="network" class="w-2.5 h-2.5"></i>
                                </span>
                              </div>
                              ${isEngineer ? `
                                <div class="relative shrink-0" id="move-menu-wrapper-${a.id}-${bc.id}">
                                  <button onclick="document.getElementById('move-menu-${a.id}-${bc.id}').classList.toggle('hidden')" class="text-[10px] text-purple-300 hover:text-white border border-purple-500/40 hover:border-purple-400 px-2 py-0.5 rounded-lg transition-all">Move →</button>
                                  <div id="move-menu-${a.id}-${bc.id}" class="hidden absolute right-0 top-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-medium)] rounded-xl shadow-xl p-1 z-20 min-w-[140px]">
                                    ${otherCats.map(oc => `<div onclick="window.MarketplaceCatalog.moveAgentToBusinessCategory('${a.id}','${oc.id}'); document.getElementById('move-menu-${a.id}-${bc.id}').classList.add('hidden')" class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-200 hover:bg-[var(--bg-tertiary)] hover:text-white cursor-pointer"><i data-lucide="${oc.icon}" class="w-3 h-3" style="color:${oc.color}"></i>${oc.label}</div>`).join('')}
                                  </div>
                                </div>
                              ` : ''}
                            </div>
                          `;
                        }).join('')
                    }
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Search & Category Filters Bar -->
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row items-center gap-4 justify-between">
            
            <!-- Search Bar -->
            <div class="relative w-full sm:max-w-md">
              <i data-lucide="search" class="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input 
                type="text" 
                placeholder="Search agents, @handles, skills, tags..." 
                value="${this.state.searchQuery}"
                oninput="window.MarketplaceCatalog.setSearch(this.value)"
                class="input-field pl-10 text-sm"
              />
            </div>

            <!-- Total Results Counter & Action -->
            <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span class="text-xs text-[var(--text-secondary)] font-medium">
                Showing <strong class="text-white">${filteredAgents.length}</strong> enterprise agents
              </span>
              <button onclick="window.NexusApp.navigate('prompts')" class="btn btn-secondary btn-sm flex items-center gap-1.5">
                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-purple-400"></i>
                <span>Explore Prompt Library</span>
              </button>
            </div>
          </div>

          <!-- Category Chips -->
          <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            ${categories.map(cat => {
              const active = this.state.selectedCategory === cat;
              return `
                <button 
                  onclick="window.MarketplaceCatalog.setCategory('${cat}')"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${active 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 border border-purple-400/40' 
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)] hover:border-[var(--border-medium)]'}"
                >
                  ${cat === 'ALL' ? '🌟 All Categories' : cat}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Agents Grid -->
        <div class="grid-marketplace">
          ${filteredAgents.map(agent => this.renderAgentCard(agent)).join('')}
        </div>

        ${filteredAgents.length === 0 ? `
          <div class="text-center py-16 glass-panel rounded-2xl space-y-3">
            <i data-lucide="search-x" class="w-12 h-12 text-[var(--text-muted)] mx-auto"></i>
            <h3 class="text-lg font-bold text-white">No agents match your filter criteria</h3>
            <p class="text-sm text-[var(--text-secondary)]">Try searching for other keywords like "Kubernetes", "Security", or "SQL".</p>
            <button onclick="window.MarketplaceCatalog.setCategory('ALL'); window.MarketplaceCatalog.setSearch('');" class="btn btn-secondary btn-sm mt-2">
              Clear All Filters
            </button>
          </div>
        ` : ''}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  renderAgentCard(agent) {
    const inputCount = agent.artifacts?.inputDocuments?.length || 0;
    const outputCount = agent.artifacts?.outputDocuments?.length || 0;
    const kbCount = agent.artifacts?.knowledgeBase?.length || 0;
    const architectureAttachment = agent.architectureDiagram?.attachment || null;
    const hasArchitectureAttachment = Boolean(
      architectureAttachment && (architectureAttachment.name || architectureAttachment.content)
    );
    const normalizedStatus = String(agent.certificationStatus || '').toUpperCase();
    const isCertified = normalizedStatus === 'CERTIFIED';
    const statusText = isCertified ? 'Certified' : 'Review In Progress';
    const statusIcon = isCertified ? 'check-circle' : 'loader-circle';
    const isAiEngineer = StorageService.getCurrentRole() === UserRoles.AI_ENGINEER;
    const isEditingAuthor = isAiEngineer && this.state.editingAuthorId === agent.id;

    return `
      <div class="glass-panel p-6 rounded-2xl flex flex-col justify-between card-hover glow-border border border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-secondary)]">
        
        <div class="space-y-4">
          <!-- Top Row: Icon, Name, Category & Version -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, ${agent.color}33, ${agent.color}11); border: 1px solid ${agent.color}66;">
                <i data-lucide="${agent.icon || 'bot'}" class="w-6 h-6" style="color: ${agent.color}"></i>
              </div>
              <div>
                <h3 class="font-bold text-base text-white leading-snug hover:text-purple-300 cursor-pointer" onclick="window.NexusApp.openAgentDetail('${agent.id}')">
                  ${agent.name}
                </h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="badge badge-purple text-[10px]">v${agent.version}</span>
                  <span class="text-xs text-[var(--text-muted)] font-mono">${agent.copilotChatHandle}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tagline -->
          <p class="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            ${agent.tagline}
          </p>

          <!-- Artifacts Included Pill Strip -->
          <div class="p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-1.5">
            <div class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
              <span>Maintained Artifacts</span>
              <span class="${isCertified ? 'text-emerald-400' : 'text-amber-300'} flex items-center gap-1"><i data-lucide="${statusIcon}" class="w-3 h-3"></i> ${statusText}</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span class="badge badge-purple text-[10px]"><i data-lucide="video" class="w-3 h-3"></i> Demo Video</span>
              <span class="badge badge-cyan text-[10px]"><i data-lucide="file-input" class="w-3 h-3"></i> ${inputCount} Input Docs</span>
              <span class="badge badge-emerald text-[10px]"><i data-lucide="file-output" class="w-3 h-3"></i> ${outputCount} Output Docs</span>
              <span class="badge badge-amber text-[10px]"><i data-lucide="book-open" class="w-3 h-3"></i> ${kbCount} KB Specs</span>
              <span class="badge ${hasArchitectureAttachment ? 'badge-blue' : 'badge-zinc'} text-[10px]" title="${hasArchitectureAttachment ? this.escapeHtml(architectureAttachment.name || 'Architecture attachment available') : 'No architecture attachment'}"><i data-lucide="network" class="w-3 h-3"></i> ${hasArchitectureAttachment ? 'Architecture Attached' : 'Architecture Missing'}</span>
            </div>
          </div>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1">
            ${agent.tags.slice(0, 3).map(tag => `
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                #${tag}
              </span>
            `).join('')}
            ${agent.tags.length > 3 ? `<span class="text-[10px] px-1.5 py-0.5 text-[var(--text-muted)]">+${agent.tags.length - 3}</span>` : ''}
          </div>
        </div>

        <!-- Footer: Author, Stats & Action Buttons -->
        <div class="pt-4 mt-4 border-t border-[var(--border-subtle)] space-y-3">
          <div class="flex items-center justify-between text-xs text-[var(--text-secondary)] gap-2">
            ${isEditingAuthor ? `
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <input
                  type="text"
                  value="${this.state.editedAuthorName}"
                  oninput="window.MarketplaceCatalog.state.editedAuthorName = this.value"
                  class="input-field text-[11px] py-1 px-2 flex-1 min-w-0"
                  placeholder="Author name"
                />
                <button onclick="window.MarketplaceCatalog.saveEditedAuthor('${agent.id}')" class="btn btn-primary btn-xs">Save</button>
                <button onclick="window.MarketplaceCatalog.cancelEditAuthor()" class="btn btn-secondary btn-xs">Cancel</button>
              </div>
            ` : `
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <img src="${agent.author.avatar}" alt="${agent.author.name}" class="w-5 h-5 rounded-full object-cover border border-[var(--border-medium)]">
                <span class="truncate max-w-[120px]">
                  <span class="text-[var(--text-muted)]">Author:</span> ${this.escapeHtml(agent.author.name || 'Unknown')}
                </span>
              </div>
            `}
            <div class="flex items-center gap-3 shrink-0">
              ${isAiEngineer && !isEditingAuthor ? `
                <button onclick="window.MarketplaceCatalog.editAuthor('${agent.id}')" class="btn btn-ghost btn-xs px-1.5 py-0.5 text-[10px]">Edit</button>
              ` : ''}
              <span class="flex items-center gap-1 text-amber-400 font-bold"><i data-lucide="star" class="w-3 h-3 fill-amber-400"></i> ${agent.rating}</span>
              <span class="flex items-center gap-1 text-[var(--text-muted)]"><i data-lucide="download" class="w-3 h-3"></i> ${agent.downloads}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="grid ${isAiEngineer ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5' : 'grid-cols-2'} gap-2">
            <button onclick="window.NexusApp.openAgentDetail('${agent.id}')" class="btn btn-secondary btn-xs sm:btn-sm flex items-center justify-center ${isAiEngineer ? '' : 'gap-1'} px-2 py-2 min-w-0 w-full leading-none text-[10px] sm:text-[11px] whitespace-nowrap">
              ${isAiEngineer ? '' : '<i data-lucide="layers" class="w-3.5 h-3.5 text-purple-400 shrink-0"></i>'}
              <span class="truncate">View Artifacts</span>
            </button>
            <button onclick="window.NexusApp.downloadAgent('${agent.id}')" class="btn btn-primary btn-xs sm:btn-sm flex items-center justify-center ${isAiEngineer ? '' : 'gap-1'} px-2 py-2 min-w-0 w-full leading-none text-[10px] sm:text-[11px] whitespace-nowrap">
              ${isAiEngineer ? '' : '<i data-lucide="download" class="w-3.5 h-3.5 shrink-0"></i>'}
              <span class="truncate">Get for VS Code</span>
            </button>
            ${isAiEngineer ? `
              <button onclick="window.NexusApp.editAgent('${agent.id}')" class="btn btn-secondary btn-xs sm:btn-sm flex items-center justify-center px-2 py-2 min-w-0 w-full leading-none text-[10px] sm:text-[11px] whitespace-nowrap">
                <span class="truncate">Edit</span>
              </button>
              <div class="relative group min-w-0">
                <button onclick="document.getElementById('move-card-menu-${agent.id}').classList.toggle('hidden')" class="btn btn-secondary btn-xs sm:btn-sm flex items-center justify-center px-2 py-2 min-w-0 w-full leading-none text-[10px] sm:text-[11px] whitespace-nowrap">
                  <span class="truncate">Move</span>
                </button>
                <div id="move-card-menu-${agent.id}" class="hidden absolute right-0 bottom-full mb-1 bg-[var(--bg-secondary)] border border-[var(--border-medium)] rounded-xl shadow-xl p-1 z-20 min-w-[160px]">
                  ${BusinessCategories.map(cat => `
                    <div onclick="window.MarketplaceCatalog.moveAgentToBusinessCategory('${agent.id}', '${cat.id}'); document.getElementById('move-card-menu-${agent.id}').classList.add('hidden')" class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-200 hover:bg-[var(--bg-tertiary)] hover:text-white cursor-pointer transition-all">
                      <i data-lucide="${cat.icon}" class="w-3.5 h-3.5" style="color: ${cat.color}"></i>
                      <span>${cat.label}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
              <button onclick="window.NexusApp.deleteAgent('${agent.id}')" class="btn btn-secondary btn-xs sm:btn-sm flex items-center justify-center px-2 py-2 min-w-0 w-full leading-none text-[10px] sm:text-[11px] whitespace-nowrap" title="Delete this agent">
                <span class="truncate">Delete</span>
              </button>
            ` : ''}
          </div>
        </div>

      </div>
    `;
  }
};
