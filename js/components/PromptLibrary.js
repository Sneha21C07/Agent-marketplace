/**
 * NexusAgent Enterprise - Prompt Library Component
 * Centralized Enterprise Prompt Templates for GitHub Copilot in VS Code
 */

import { StorageService } from '../storage.js';
import { ActivityActionTypes } from '../types.js';

export const PromptLibrary = {
  state: {
    searchQuery: '',
    selectedCategory: 'ALL',
    selectedPromptId: 'prompt-arch-review',
    variableValues: {},
    isCreatingPrompt: false
  },

  setCategory(cat) {
    this.state.selectedCategory = cat;
    this.render();
  },

  setSearch(q) {
    this.state.searchQuery = q.toLowerCase();
    this.render();
  },

  selectPrompt(id) {
    this.state.selectedPromptId = id;
    const prompts = StorageService.getPromptLibrary();
    const prompt = prompts.find(p => p.id === id);
    if (prompt && prompt.variables) {
      this.state.variableValues = {};
      prompt.variables.forEach(v => {
        this.state.variableValues[v.name] = v.default || '';
      });
    }
    this.render();
  },

  updateVariable(varName, value) {
    this.state.variableValues[varName] = value;
    this.renderPreviewOnly();
  },

  getResolvedPrompt(prompt) {
    if (!prompt) return '';
    let text = prompt.template;
    const vars = this.state.variableValues;
    for (const [key, val] of Object.entries(vars)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      text = text.replace(regex, val || `[${key}]`);
    }
    return text;
  },

  copyToCopilot() {
    const prompts = StorageService.getPromptLibrary();
    const prompt = prompts.find(p => p.id === this.state.selectedPromptId);
    if (!prompt) return;

    const resolved = this.getResolvedPrompt(prompt);
    navigator.clipboard.writeText(resolved);

    // Bump usage count in storage
    prompt.usageCount = (prompt.usageCount || 0) + 1;
    StorageService.savePrompt(prompt);

    StorageService.logActivity(
      ActivityActionTypes.PROMPT_FORKED,
      'Enterprise Developer',
      'developer',
      prompt.id,
      prompt.title,
      `Copied resolved Copilot prompt (${prompt.copilotCommand}) to clipboard with active parameters.`,
      { templateVersion: prompt.version }
    );

    window.NexusApp.showToast(`Prompt "${prompt.title}" copied to clipboard! Paste into VS Code Copilot Chat.`, 'success');
    this.render();
  },

  downloadPromptFile() {
    const prompts = StorageService.getPromptLibrary();
    const prompt = prompts.find(p => p.id === this.state.selectedPromptId);
    if (!prompt) return;

    const fileContent = `---
name: ${prompt.title}
command: ${prompt.copilotCommand}
version: ${prompt.version}
category: ${prompt.category}
model: GitHub Copilot Enterprise
---
${this.getResolvedPrompt(prompt)}
`;

    const blob = new Blob([fileContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${prompt.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.prompt.md`;
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    window.NexusApp.showToast(`Downloaded .github/prompts/${filename}`, 'success');
  },

  renderPreviewOnly() {
    const prompts = StorageService.getPromptLibrary();
    const prompt = prompts.find(p => p.id === this.state.selectedPromptId);
    const previewEl = document.getElementById('prompt-resolved-preview');
    if (previewEl && prompt) {
      previewEl.textContent = this.getResolvedPrompt(prompt);
    }
  },

  openNewPromptModal() {
    const modalEl = document.getElementById('prompt-editor-modal-container');
    if (!modalEl) return;

    modalEl.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target === this) this.parentElement.innerHTML = ''">
        <div class="modal-content glass-panel p-6 sm:p-8 space-y-5 max-w-2xl">
          <div class="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <i data-lucide="sparkles" class="w-5 h-5 text-purple-400"></i>
              Add Enterprise Copilot Prompt Template
            </h3>
            <button onclick="this.closest('#prompt-editor-modal-container').innerHTML = ''" class="p-1 rounded text-gray-400 hover:text-white">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form id="new-prompt-form" onsubmit="window.PromptLibrary.handleCreatePrompt(event)" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-gray-300 mb-1">Prompt Title</label>
              <input type="text" id="prompt-title" required placeholder="e.g. Next.js 15 Server Action Security Review" class="input-field" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-gray-300 mb-1">Copilot Slash Command</label>
                <input type="text" id="prompt-command" required placeholder="e.g. /secure-action" class="input-field font-mono" />
              </div>
              <div>
                <label class="block font-semibold text-gray-300 mb-1">Category</label>
                <select id="prompt-category" class="input-field">
                  <option value="System Architecture">System Architecture</option>
                  <option value="QA & Testing">QA & Testing</option>
                  <option value="Security & Compliance">Security & Compliance</option>
                  <option value="Database & Data">Database & Data</option>
                  <option value="DevOps & SRE">DevOps & SRE</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-gray-300 mb-1">Description & Enterprise Intent</label>
              <input type="text" id="prompt-desc" required placeholder="Short summary of what this prompt enforces" class="input-field" />
            </div>

            <div>
              <label class="block font-semibold text-gray-300 mb-1">Prompt Template (Use {{variable_name}} for dynamic slots)</label>
              <textarea id="prompt-template" required rows="6" placeholder="Analyze the code for {{framework}} ensuring compliance with {{security_standard}}..." class="input-field font-mono"></textarea>
            </div>

            <div class="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              <button type="button" onclick="this.closest('#prompt-editor-modal-container').innerHTML = ''" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm flex items-center gap-1">
                <i data-lucide="plus" class="w-4 h-4"></i> Save to Enterprise Library
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  openEditPromptModal(promptId) {
    const modalEl = document.getElementById('prompt-editor-modal-container');
    if (!modalEl) return;

    const prompt = StorageService.getPromptLibrary().find(p => p.id === promptId);
    if (!prompt) return;

    modalEl.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target === this) this.parentElement.innerHTML = ''">
        <div class="modal-content glass-panel p-6 sm:p-8 space-y-5 max-w-2xl">
          <div class="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <i data-lucide="pencil" class="w-5 h-5 text-cyan-400"></i>
              Edit Enterprise Copilot Prompt
            </h3>
            <button onclick="this.closest('#prompt-editor-modal-container').innerHTML = ''" class="p-1 rounded text-gray-400 hover:text-white">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form id="edit-prompt-form" onsubmit="window.PromptLibrary.handleEditPrompt(event)" class="space-y-4 text-xs">
            <input type="hidden" id="edit-prompt-id" value="${prompt.id}" />

            <div>
              <label class="block font-semibold text-gray-300 mb-1">Prompt Title</label>
              <input type="text" id="edit-prompt-title" required value="${this.escapeAttribute(prompt.title)}" class="input-field" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-gray-300 mb-1">Copilot Slash Command</label>
                <input type="text" id="edit-prompt-command" required value="${this.escapeAttribute(prompt.copilotCommand.replace(/^\//, ''))}" class="input-field font-mono" />
              </div>
              <div>
                <label class="block font-semibold text-gray-300 mb-1">Category</label>
                <select id="edit-prompt-category" class="input-field">
                  ${['System Architecture', 'QA & Testing', 'Security & Compliance', 'Database & Data', 'DevOps & SRE'].map(cat => `
                    <option value="${cat}" ${prompt.category === cat ? 'selected' : ''}>${cat}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-gray-300 mb-1">Description & Enterprise Intent</label>
              <input type="text" id="edit-prompt-desc" required value="${this.escapeAttribute(prompt.description)}" class="input-field" />
            </div>

            <div>
              <label class="block font-semibold text-gray-300 mb-1">Prompt Template (Use {{variable_name}} for dynamic slots)</label>
              <textarea id="edit-prompt-template" required rows="6" class="input-field font-mono">${this.escapeHtml(prompt.template)}</textarea>
            </div>

            <div class="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              <button type="button" onclick="this.closest('#prompt-editor-modal-container').innerHTML = ''" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm flex items-center gap-1">
                <i data-lucide="save" class="w-4 h-4"></i> Save Prompt Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  handleCreatePrompt(event) {
    event.preventDefault();
    const title = document.getElementById('prompt-title').value;
    const command = document.getElementById('prompt-command').value;
    const category = document.getElementById('prompt-category').value;
    const desc = document.getElementById('prompt-desc').value;
    const template = document.getElementById('prompt-template').value;

    // Extract dynamic variables from {{var}}
    const varMatches = template.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) || [];
    const variables = [...new Set(varMatches)].map(m => {
      const name = m.replace(/[{}]/g, '').trim();
      return { name, default: '', description: `Variable for ${name}` };
    });

    const newPrompt = {
      id: `prompt-${Date.now()}`,
      title,
      copilotCommand: command.startsWith('/') ? command : `/${command}`,
      category,
      description: desc,
      template,
      variables,
      version: '1.0.0',
      rating: 5.0,
      usageCount: 1,
      author: 'Enterprise AI Guild'
    };

    StorageService.savePrompt(newPrompt);
    StorageService.logActivity(
      ActivityActionTypes.PROMPT_CREATED,
      'Enterprise AI Engineer',
      'ai_engineer',
      newPrompt.id,
      newPrompt.title,
      `Published new Copilot prompt template "${newPrompt.title}" (${newPrompt.copilotCommand}) into enterprise registry.`
    );

    document.getElementById('prompt-editor-modal-container').innerHTML = '';
    this.state.selectedPromptId = newPrompt.id;
    window.NexusApp.showToast(`Prompt "${title}" added to Enterprise Library!`, 'success');
    this.render();
  },

  handleEditPrompt(event) {
    event.preventDefault();
    const promptId = document.getElementById('edit-prompt-id').value;
    const title = document.getElementById('edit-prompt-title').value;
    const command = document.getElementById('edit-prompt-command').value;
    const category = document.getElementById('edit-prompt-category').value;
    const desc = document.getElementById('edit-prompt-desc').value;
    const template = document.getElementById('edit-prompt-template').value;

    const prompts = StorageService.getPromptLibrary();
    const existing = prompts.find(p => p.id === promptId);
    if (!existing) return;

    const varMatches = template.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) || [];
    const variables = [...new Set(varMatches)].map(m => {
      const name = m.replace(/[{}]/g, '').trim();
      const previous = existing.variables?.find(v => v.name === name);
      return {
        name,
        default: previous?.default || '',
        description: previous?.description || `Variable for ${name}`
      };
    });

    const updatedPrompt = {
      ...existing,
      title,
      copilotCommand: command.startsWith('/') ? command : `/${command}`,
      category,
      description: desc,
      template,
      variables,
      version: existing.version || '1.0.0',
      lastEdited: new Date().toISOString()
    };

    StorageService.savePrompt(updatedPrompt);
    StorageService.logActivity(
      ActivityActionTypes.PROMPT_UPDATED,
      'Enterprise AI Engineer',
      'ai_engineer',
      updatedPrompt.id,
      updatedPrompt.title,
      `Updated Copilot prompt template "${updatedPrompt.title}" (${updatedPrompt.copilotCommand}) in the enterprise registry.`
    );

    document.getElementById('prompt-editor-modal-container').innerHTML = '';
    this.state.selectedPromptId = updatedPrompt.id;
    this.state.variableValues = {};
    window.NexusApp.showToast(`Prompt "${title}" updated successfully!`, 'success');
    this.render();
  },

  render() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const prompts = StorageService.getPromptLibrary();

    // Filter prompts
    const filtered = prompts.filter(p => {
      const matchCat = this.state.selectedCategory === 'ALL' || p.category === this.state.selectedCategory;
      const matchSearch = !this.state.searchQuery ||
        p.title.toLowerCase().includes(this.state.searchQuery) ||
        p.copilotCommand.toLowerCase().includes(this.state.searchQuery) ||
        p.description.toLowerCase().includes(this.state.searchQuery);
      return matchCat && matchSearch;
    });

    // Make sure we have a selected prompt
    let selectedPrompt = prompts.find(p => p.id === this.state.selectedPromptId) || filtered[0] || prompts[0];
    if (selectedPrompt && Object.keys(this.state.variableValues).length === 0 && selectedPrompt.variables) {
      selectedPrompt.variables.forEach(v => {
        this.state.variableValues[v.name] = v.default || '';
      });
    }

    const categories = ['ALL', 'System Architecture', 'QA & Testing', 'Security & Compliance', 'Database & Data', 'DevOps & SRE'];

    container.innerHTML = `
      <div class="space-y-6 animate-fadeIn">
        
        <!-- Header Banner -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#17132a] via-[#101935] to-[#0c1825] p-6 rounded-2xl border border-[var(--border-medium)] shadow-xl">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="badge badge-purple text-xs"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Enterprise Catalog</span>
              <span class="badge badge-cyan text-xs">GitHub Copilot Prompts</span>
            </div>
            <h2 class="text-2xl font-extrabold text-white">Centralized Copilot Prompt Library</h2>
            <p class="text-xs sm:text-sm text-[var(--text-secondary)]">Curated, battle-tested prompt templates with live variable interpolation for VS Code Copilot Chat.</p>
          </div>

          <button onclick="window.PromptLibrary.openNewPromptModal()" class="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto shadow-md">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Add New Prompt Template</span>
          </button>
        </div>

        <!-- Filter Chips & Search -->
        <div class="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div class="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            ${categories.map(cat => `
              <button 
                onclick="window.PromptLibrary.setCategory('${cat}')"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${this.state.selectedCategory === cat 
                  ? 'bg-purple-600 text-white shadow border border-purple-400' 
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)]'}"
              >
                ${cat}
              </button>
            `).join('')}
          </div>

          <div class="relative w-full sm:w-72">
            <i data-lucide="search" class="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input 
              type="text" 
              placeholder="Search prompts or /commands..." 
              value="${this.state.searchQuery}"
              oninput="window.PromptLibrary.setSearch(this.value)"
              class="input-field pl-9 py-1.5 text-xs"
            />
          </div>
        </div>

        <!-- Main Prompt Library Grid & Tester Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left Column: Prompts List (5 Cols) -->
          <div class="lg:col-span-5 space-y-3">
            <div class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
              <span>Standard Enterprise Prompts</span>
              <span>${filtered.length} Available</span>
            </div>

            <div class="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              ${filtered.map(p => {
                const isSelected = selectedPrompt && selectedPrompt.id === p.id;
                return `
                  <div 
                    onclick="window.PromptLibrary.selectPrompt('${p.id}')"
                    class="p-4 rounded-xl border cursor-pointer transition-all ${isSelected 
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-500/10 text-white' 
                      : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-medium)] text-[var(--text-secondary)]'}"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="space-y-1">
                        <div class="flex items-center gap-2">
                          <code class="px-1.5 py-0.5 rounded bg-[var(--bg-input)] text-cyan-300 font-mono text-[11px] font-bold">${p.copilotCommand}</code>
                          <span class="badge badge-zinc text-[9px]">${p.category}</span>
                        </div>
                        <h4 class="font-bold text-sm text-white">${p.title}</h4>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          onclick="event.stopPropagation(); window.PromptLibrary.openEditPromptModal('${p.id}')"
                          class="p-1 rounded text-gray-400 hover:text-cyan-300 transition-colors"
                          title="Edit prompt"
                          aria-label="Edit prompt"
                        >
                          <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                        </button>
                        <span class="badge badge-purple text-[10px]">v${p.version}</span>
                      </div>
                    </div>

                    <p class="text-xs text-[var(--text-secondary)] line-clamp-2 mt-2 leading-relaxed">${p.description}</p>

                    <div class="flex items-center justify-between text-[11px] text-[var(--text-muted)] mt-3 pt-2 border-t border-[var(--border-subtle)]">
                      <span class="flex items-center gap-1 text-amber-400 font-bold"><i data-lucide="star" class="w-3 h-3 fill-amber-400"></i> ${p.rating}</span>
                      <span class="flex items-center gap-1"><i data-lucide="copy" class="w-3 h-3"></i> ${p.usageCount} uses</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Right Column: Interactive Prompt Configurator & Live Copilot Preview (7 Cols) -->
          <div class="lg:col-span-7">
            ${selectedPrompt ? `
              <div class="glass-panel p-6 rounded-2xl border border-[var(--border-medium)] space-y-5 bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-secondary)] shadow-xl">
                
                <!-- Prompt Details Top -->
                <div class="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                  <div>
                    <div class="flex items-center gap-2">
                      <code class="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-[var(--bg-input)] border border-cyan-500/30">${selectedPrompt.copilotCommand}</code>
                      <span class="badge badge-purple">v${selectedPrompt.version}</span>
                      <span class="badge badge-emerald"><i data-lucide="shield" class="w-3 h-3"></i> Certified</span>
                    </div>
                    <h3 class="text-xl font-extrabold text-white mt-1.5">${selectedPrompt.title}</h3>
                    <p class="text-xs text-[var(--text-secondary)] mt-0.5">${selectedPrompt.description}</p>
                  </div>

                  <div class="flex items-center gap-2">
                    <button onclick="window.PromptLibrary.openEditPromptModal('${selectedPrompt.id}')" class="btn btn-secondary btn-sm flex items-center gap-1" title="Edit prompt template">
                      <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                      <span>Edit</span>
                    </button>
                    <button onclick="window.PromptLibrary.downloadPromptFile()" class="btn btn-secondary btn-sm flex items-center gap-1" title="Download .github/prompts file">
                      <i data-lucide="download" class="w-3.5 h-3.5"></i>
                      <span>.prompt.md</span>
                    </button>
                    <button onclick="window.PromptLibrary.copyToCopilot()" class="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md">
                      <i data-lucide="copy" class="w-4 h-4"></i>
                      <span>Copy to Copilot</span>
                    </button>
                  </div>
                </div>

                <!-- Dynamic Variables Form -->
                ${selectedPrompt.variables && selectedPrompt.variables.length > 0 ? `
                  <div class="space-y-3 bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                    <div class="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                      <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                      Template Variables (Customize for your repo)
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      ${selectedPrompt.variables.map(v => `
                        <div>
                          <label class="block text-[11px] font-semibold text-gray-300 mb-1">
                            {{${v.name}}} <span class="text-[10px] text-gray-400 font-normal">(${v.description})</span>
                          </label>
                          <input 
                            type="text" 
                            value="${this.state.variableValues[v.name] || ''}"
                            oninput="window.PromptLibrary.updateVariable('${v.name}', this.value)"
                            placeholder="${v.default || v.name}"
                            class="input-field py-1.5 text-xs font-mono"
                          />
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Resolved Output Live Preview -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs font-semibold text-gray-300">
                    <span class="flex items-center gap-1.5 text-cyan-300">
                      <i data-lucide="terminal" class="w-3.5 h-3.5"></i>
                      Resolved Copilot Prompt (Ready for VS Code)
                    </span>
                    <span class="text-[11px] text-[var(--text-muted)]">Live Interpolated</span>
                  </div>

                  <pre class="code-block text-xs leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap"><code id="prompt-resolved-preview">${this.escapeHtml(this.getResolvedPrompt(selectedPrompt))}</code></pre>
                </div>

                <!-- Footer Quick Action -->
                <div class="pt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Author: <strong class="text-white">${selectedPrompt.author || 'Enterprise AI Guild'}</strong></span>
                  <button onclick="window.PromptLibrary.copyToCopilot()" class="btn btn-cyan btn-sm flex items-center gap-1.5">
                    <i data-lucide="clipboard-check" class="w-4 h-4"></i> Copy Resolved Prompt
                  </button>
                </div>

              </div>
            ` : ''}
          </div>

        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  escapeAttribute(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/'/g, '&#039;');
  }
};
