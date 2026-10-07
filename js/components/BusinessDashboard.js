/**
 * Business Manager dashboard aligned to AI Initiatives BSS & Digital deck.
 */

export const BusinessDashboard = {
  toPercent(progress) {
    if (typeof progress === 'number') return progress;
    return Number.parseInt(String(progress).replace('%', ''), 10) || 0;
  },

  render() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const portfolio = {
      productionized: 1,
      stabilization: 9,
      earlyStage: 7,
      bss: 9,
      digital: 8
    };

    const realizedBss = [
      { initiative: 'Siebel LoV & Price List', outcome: '95% improvement', status: 'REALIZED' },
      { initiative: 'Design-to-Test Traceability & Gap Analysis', outcome: '1 week to 1 day; helps defect reduction', status: 'OCT RELEASE' },
      { initiative: 'Fusion IFC Completeness', outcome: '95% effort reduction', status: '31 AUG 2026' },
      { initiative: 'Siebel Open UI Code Accelerator', outcome: 'Defect analysis: 2 hrs to 1.5 hrs', status: 'AUG RELEASE' },
      { initiative: 'SmartReplay Performance Agent', outcome: '2 weeks to 1 week; 5 to 1 resources', status: '18 OCT 2026' },
      { initiative: 'AI Requirements Reverse Engineering Tool', outcome: '40% regression defect reduction', status: 'AUG RELEASE' }
    ];

    const realizedDigital = [
      { initiative: 'IFC Swagger Synthesizer', outcome: '3 days to <1 hour', status: 'DFA RELEASE' },
      { initiative: 'IFC Workflow Generator', outcome: '24 hours to <10 minutes', status: 'DFA RELEASE' },
      { initiative: 'SHOP Brownfield Agent', outcome: '75% productivity improvement; 3 days to <1 hour', status: '80% / DFA' },
      { initiative: 'Automated Multi-Module Code Enhancement Agent for Dependent Services', outcome: '80% defect reduction with 100% accuracy', status: 'DFA RELEASE' }
    ];

    const earlyStageBss = [
      { name: 'Siebel ST UI Test Case Generator & Execution Agent', track: 'Test Automation', horizon: '90 days', platform: 'Siebel ST', progress: '20%', impact: 'Faster test creation; consistent quality' },
      { name: 'Siebel Pseudocode Generation Agent', track: 'Doc. Automation', horizon: '30 days', platform: 'Siebel OpenUI', progress: 'REVIEW', impact: '80% faster pseudocode creation; better onboarding' },
      { name: 'Siebel OpenUI Functional Flow Generation', track: 'Doc. Automation', horizon: '30 days', platform: 'Siebel OpenUI', progress: 'REVIEW', impact: '70% faster low-level design documentation' }
    ];

    const earlyStageDigital = [
      { name: 'Digital OneApp Brownfield Agent', track: 'Development', horizon: '60 days', platform: 'Digital OneApp', progress: '20%', impact: 'Expected 50% cut in development effort and resources' },
      { name: 'AI Code Review & QA Agent', track: 'Code Quality', horizon: '60 days', platform: 'Digital OneApp', progress: '20%', impact: 'Proactive defect detection; faster application speed' },
      { name: 'Digital SHOP Greenfield Agent', track: 'Development', horizon: '90 days', platform: 'Digital SHOP', progress: '5%', impact: '75% faster greenfield build; reduced time-to-market' },
      { name: 'Digital OneApp Greenfield Agent', track: 'Development', horizon: '90 days', platform: 'Digital OneApp', progress: '5%', impact: 'Build time reduced from 4 weeks to 1 week' }
    ];

    const allEarlyStage = [
      ...earlyStageBss.map(item => ({ ...item, portfolio: 'BSS' })),
      ...earlyStageDigital.map(item => ({ ...item, portfolio: 'DIGITAL' }))
    ];

    container.innerHTML = `
      <div class="space-y-8 animate-fadeIn">

        <!-- Top Header -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#141c2e] via-[#101935] to-[#17132a] p-6 sm:p-8 rounded-2xl border border-[var(--border-medium)] shadow-xl">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="badge badge-emerald text-xs"><i data-lucide="layers" class="w-3.5 h-3.5"></i> TPG AI Workshop Action Tracker</span>
              <span class="badge badge-purple text-xs">BSS & Digital</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white">AI-First Automation Initiatives</h2>
            <p class="text-xs sm:text-sm text-[var(--text-secondary)]">Executive focus: realized value, near-term proof, and scale priorities across BSS and Digital portfolios.</p>
          </div>

          <div class="flex items-center gap-2">
            <span class="badge badge-cyan text-xs">Realized value</span>
            <span class="badge badge-amber text-xs">Near-term proof</span>
            <span class="badge badge-emerald text-xs">Scale priorities</span>
          </div>
        </div>

        <!-- Portfolio KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <div class="glass-panel p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-[var(--bg-card)] space-y-2">
            <div class="flex items-center justify-between text-[var(--text-muted)] text-xs">
              <span class="font-semibold uppercase tracking-wider">Productionized</span>
              <div class="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <i data-lucide="check-circle-2" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-3xl font-extrabold text-white">${portfolio.productionized}</div>
            <div class="text-[11px] text-emerald-400 font-semibold">
              95% faster and error-free bulk data deployment
            </div>
          </div>

          <div class="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-[var(--bg-card)] space-y-2">
            <div class="flex items-center justify-between text-[var(--text-muted)] text-xs">
              <span class="font-semibold uppercase tracking-wider">Stabilization</span>
              <div class="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <i data-lucide="wrench" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-3xl font-extrabold text-white">${portfolio.stabilization}</div>
            <div class="text-[11px] text-cyan-400 font-semibold">
              Adoption on track
            </div>
          </div>

          <div class="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-[var(--bg-card)] space-y-2">
            <div class="flex items-center justify-between text-[var(--text-muted)] text-xs">
              <span class="font-semibold uppercase tracking-wider">Early Stage</span>
              <div class="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                <i data-lucide="rocket" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-3xl font-extrabold text-white">${portfolio.earlyStage}</div>
            <div class="text-[11px] text-cyan-400 font-semibold">
              Pipeline initiatives
            </div>
          </div>

          <div class="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-[var(--bg-card)] space-y-2">
            <div class="flex items-center justify-between text-[var(--text-muted)] text-xs">
              <span class="font-semibold uppercase tracking-wider">Portfolio Split</span>
              <div class="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <i data-lucide="pie-chart" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-3xl font-extrabold text-white">${portfolio.bss} | ${portfolio.digital}</div>
            <div class="text-[11px] text-amber-300 font-semibold">
              BSS | Digital domain classification
            </div>
          </div>

        </div>

        <!-- Realized and Near-term Value -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div class="lg:col-span-6 glass-panel p-6 rounded-2xl border border-[var(--border-subtle)] space-y-5">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-white">BSS - Realized and Near-term Value</h3>
                <p class="text-xs text-[var(--text-secondary)]">Focus on measurable effort and quality outcomes</p>
              </div>
              <span class="badge badge-purple text-[10px]">BSS</span>
            </div>

            <div class="space-y-3">
              ${realizedBss.map(item => `
                <div class="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <div class="font-bold text-xs text-white">${item.initiative}</div>
                      <div class="text-[11px] text-[var(--text-secondary)] mt-1">${item.outcome}</div>
                    </div>
                    <span class="badge badge-emerald text-[10px] whitespace-nowrap">${item.status}</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
              <span>BSS focus:</span>
              <strong class="text-emerald-400 text-sm font-bold">Prove effort and quality outcomes</strong>
            </div>
          </div>

          <div class="lg:col-span-6 glass-panel p-6 rounded-2xl border border-[var(--border-subtle)] space-y-5">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-white">Digital - Value Anchored to DFA Release</h3>
                <p class="text-xs text-[var(--text-secondary)]">Capture actual DFA adoption and savings</p>
              </div>
              <span class="badge badge-cyan text-[10px]">Digital</span>
            </div>

            <div class="space-y-3">
              ${realizedDigital.map(item => `
                <div class="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <div class="font-bold text-xs text-white">${item.initiative}</div>
                      <div class="text-[11px] text-[var(--text-secondary)] mt-1">${item.outcome}</div>
                    </div>
                    <span class="badge badge-cyan text-[10px] whitespace-nowrap">${item.status}</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
              <span>Digital focus:</span>
              <strong class="text-cyan-400 text-sm font-bold">Anchor value to DFA adoption milestones</strong>
            </div>
          </div>

        </div>

        <!-- Early-stage Initiatives -->
        <div class="glass-panel p-6 rounded-2xl border border-[var(--border-subtle)] space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-bold text-white">Early-stage Initiatives: Next Wave of Value</h3>
              <p class="text-xs text-[var(--text-secondary)]">7 initiatives in development or scoping (BSS: 3, Digital: 4)</p>
            </div>
            <div class="flex items-center gap-2 text-[11px]">
              <span class="badge badge-purple">BSS | ${earlyStageBss.length}</span>
              <span class="badge badge-cyan">DIGITAL | ${earlyStageDigital.length}</span>
            </div>
          </div>

          <div class="space-y-3">
            ${allEarlyStage.map(item => {
              const progressNum = this.toPercent(item.progress);
              const showBar = progressNum > 0;
              return `
                <div class="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div class="font-bold text-xs text-white">${item.name}</div>
                      <div class="text-[10px] text-[var(--text-muted)] mt-1">${item.portfolio} • ${item.track} • ${item.horizon} • ${item.platform}</div>
                      <div class="text-[11px] text-[var(--text-secondary)] mt-2">${item.impact}</div>
                    </div>
                    <span class="badge ${item.portfolio === 'BSS' ? 'badge-purple' : 'badge-cyan'} text-[10px] whitespace-nowrap">${item.progress}</span>
                  </div>
                  ${showBar ? `
                    <div class="w-full mt-2.5 bg-[var(--bg-input)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <div class="h-full rounded-full transition-all duration-700 ${item.portfolio === 'BSS' ? 'bg-purple-500' : 'bg-cyan-500'}" style="width: ${progressNum}%;"></div>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>

          <div class="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1.5">
            <div><strong class="text-white">Pipeline outlook:</strong> Three BSS and four Digital initiatives are in early build or scoping.</div>
            <div><strong class="text-white">Priority sequencing:</strong> OneApp Brownfield and Code Review & QA are furthest along at 20% completion.</div>
            <div><strong class="text-white">Scale focus:</strong> Convert build progress into committed go-live and value-realization dates after scoping/build exits.</div>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
