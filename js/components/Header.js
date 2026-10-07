/**
 * NexusAgent Enterprise - Header Component
 * Enforces Role-Based Access Control (RBAC) on navigation tabs and role switcher
 */

import { UserRoles, RoleMetadata } from '../types.js';
import { StorageService } from '../storage.js';

export const Header = {
  render(currentTab = 'catalog', currentRole = UserRoles.DEVELOPER) {
    const roleMeta = RoleMetadata[currentRole] || RoleMetadata[UserRoles.DEVELOPER];
    const allowedTabs = roleMeta.allowedTabs || ['catalog'];
    const canPublish = roleMeta.permissions?.canPublishAgent;

    return `
      <header class="glass-header sticky top-0 z-40 border-b border-[var(--border-subtle)]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16 gap-4">
            
            <!-- TPG Logo (top-left) -->
            <div class="flex items-center shrink-0">
              <img src="/images/tpg-logo.png" alt="TPG Telecom" class="h-10 w-auto" />
            </div>

            <!-- RBAC Filtered Navigation Links (Only allowed tabs for current role) -->
            <nav class="hidden md:flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-subtle)]">
              
              ${allowedTabs.includes('catalog') ? `
                <button onclick="window.NexusApp.navigate('catalog')" class="nav-tab ${currentTab === 'catalog' ? 'active' : ''} text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all">
                  <i data-lucide="grid" class="w-4 h-4"></i>
                  Marketplace
                </button>
              ` : ''}

              ${allowedTabs.includes('prompts') ? `
                <button onclick="window.NexusApp.navigate('prompts')" class="nav-tab ${currentTab === 'prompts' ? 'active' : ''} text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all">
                  <i data-lucide="sparkles" class="w-4 h-4 text-purple-400"></i>
                  Prompt Library
                </button>
              ` : ''}

              ${allowedTabs.includes('playground') ? `
                <button onclick="window.NexusApp.navigate('playground')" class="nav-tab ${currentTab === 'playground' ? 'active' : ''} text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all">
                  <i data-lucide="terminal" class="w-4 h-4 text-cyan-400"></i>
                  Copilot Sandbox
                </button>
              ` : ''}

              ${allowedTabs.includes('studio') ? `
                <button onclick="window.NexusApp.navigate('studio')" class="nav-tab ${currentTab === 'studio' ? 'active' : ''} text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all">
                  <i data-lucide="cpu" class="w-4 h-4 text-amber-400"></i>
                  AI Studio & Artifacts
                </button>
              ` : ''}

              ${allowedTabs.includes('dashboard') ? `
                <button onclick="window.NexusApp.navigate('dashboard')" class="nav-tab ${currentTab === 'dashboard' ? 'active' : ''} text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all">
                  <i data-lucide="bar-chart-2" class="w-4 h-4 text-emerald-400"></i>
                  Manager Analytics
                </button>
              ` : ''}

              ${allowedTabs.includes('audit') ? `
                <button onclick="window.NexusApp.navigate('audit')" class="nav-tab ${currentTab === 'audit' ? 'active' : ''} text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all">
                  <i data-lucide="activity" class="w-4 h-4 text-rose-400"></i>
                  Activity Audit
                </button>
              ` : ''}

            </nav>

            <!-- Right Controls: Role Switcher & Testing Guide -->
            <div class="flex items-center gap-4">
              
              <!-- Testing Guide & Use Cases Button -->
              <button onclick="window.NexusApp.openTestGuideModal()" class="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-cyan-300 border-cyan-500/30 hover:border-cyan-400 shadow-sm">
                <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Use Cases & Testing Guide</span>
              </button>

              <!-- Persona / Role Selector Dropdown (click-to-toggle, not hover, to avoid mouse-path dead zones) -->
              <div class="relative" id="role-switcher-container">
                <div onclick="window.NexusApp.toggleRoleMenu(event)" class="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-medium)] hover:border-[#8957e5] px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-sm">
                  <i data-lucide="${roleMeta.icon}" class="w-4 h-4" style="color: ${roleMeta.color}"></i>
                  <div class="text-left">
                    <div class="text-[10px] text-[var(--text-muted)] font-medium leading-none">Role:</div>
                    <div class="text-xs font-bold text-white leading-tight">${roleMeta.title}</div>
                  </div>
                  <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-[var(--text-muted)] ml-1"></i>
                </div>

                <!-- Dropdown Menu -->
                <div id="role-switcher-menu" class="absolute right-0 top-full mt-2 w-72 bg-[var(--bg-secondary)] border border-[var(--border-medium)] rounded-2xl shadow-2xl p-2 hidden z-50 animate-fadeIn">
                  <div class="text-[11px] font-bold text-[var(--text-muted)] px-3 py-1 uppercase tracking-wider">Enterprise RBAC Roles</div>
                  
                  ${Object.keys(UserRoles).map(key => {
                    const r = UserRoles[key];
                    const meta = RoleMetadata[r];
                    const active = r === currentRole;
                    return `
                      <div onclick="window.NexusApp.setRole('${r}')" class="flex items-start justify-between p-2.5 rounded-xl cursor-pointer transition-all ${active ? 'bg-purple-950/40 border border-purple-500/50 text-white' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'}">
                        <div class="flex items-start gap-2.5">
                          <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style="background: ${meta.color}22; border: 1px solid ${meta.color}44;">
                            <i data-lucide="${meta.icon}" class="w-4 h-4" style="color: ${meta.color}"></i>
                          </div>
                          <div>
                            <div class="text-xs font-bold ${active ? 'text-white' : 'text-gray-200'}">${meta.title}</div>
                            <div class="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">${meta.subtitle}</div>
                          </div>
                        </div>
                        ${active ? '<i data-lucide="check" class="w-4 h-4 text-purple-400 shrink-0 mt-1"></i>' : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Quick Action: Publish Agent Button (Only visible for AI Engineer Role) -->
              ${canPublish ? `
                <button onclick="window.NexusApp.openUploadWizard()" class="btn btn-primary btn-sm flex items-center gap-1.5">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i>
                  <span class="hidden sm:inline">Publish Agent</span>
                </button>
              ` : ''}

            </div>

          </div>
        </div>
      </header>
    `;
  }
};
