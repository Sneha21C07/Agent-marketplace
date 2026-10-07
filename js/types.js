/**
 * NexusAgent Enterprise - Type Definitions, Constants & RBAC Permissions Matrix
 * GitHub Copilot Enterprise Agentic Marketplace
 */

export const UserRoles = {
  DEVELOPER: 'developer',
  AI_ENGINEER: 'ai_engineer',
  BUSINESS_MANAGER: 'business_manager',
  SECURITY_GOVERNANCE: 'security_governance'
};

export const RoleMetadata = {
  [UserRoles.DEVELOPER]: {
    title: 'Developer',
    subtitle: 'Consumer & Integrator',
    description: 'Discovers agents, inspects artifacts, tests prompts in sandbox, and downloads 1-click VS Code GitHub Copilot setups.',
    icon: 'code',
    color: '#00d4ff',
    badge: 'Developer',
    allowedTabs: ['catalog', 'prompts', 'playground'],
    permissions: {
      canBrowseCatalog: true,
      canViewArtifacts: true,
      canDownloadVSCode: true,
      canUsePromptLibrary: true,
      canExecuteSandbox: true,
      canPublishAgent: false,
      canEditArtifacts: false,
      canViewDashboard: false,
      canViewAuditLogs: false,
      canCertifyAgents: false
    }
  },

  [UserRoles.AI_ENGINEER]: {
    title: 'AI Engineer',
    subtitle: 'Creator & Artifact Maintainer',
    description: 'Authors agents, maintains demo videos, input/output documents, and knowledge bases, releases semantic versions, and contributes prompt templates.',
    icon: 'cpu',
    color: '#8957e5',
    badge: 'AI Studio Lead',
    allowedTabs: ['catalog', 'studio', 'prompts', 'playground'],
    permissions: {
      canBrowseCatalog: true,
      canViewArtifacts: true,
      canDownloadVSCode: true,
      canUsePromptLibrary: true,
      canCreatePrompts: true,
      canExecuteSandbox: true,
      canPublishAgent: true,
      canEditArtifacts: true,
      canViewDashboard: false,
      canViewAuditLogs: false,
      canCertifyAgents: false
    }
  },

  [UserRoles.BUSINESS_MANAGER]: {
    title: 'Business Manager',
    subtitle: 'Executive & ROI Lead',
    description: 'Tracks Copilot agent adoption, developer hours saved, departmental seat utilization, and calculates return-on-investment (ROI).',
    icon: 'bar-chart-3',
    color: '#10b981',
    badge: 'Management',
    allowedTabs: ['dashboard', 'catalog', 'audit'],
    permissions: {
      canBrowseCatalog: true,
      canViewArtifacts: true,
      canDownloadVSCode: false,
      canUsePromptLibrary: false,
      canExecuteSandbox: false,
      canPublishAgent: false,
      canEditArtifacts: false,
      canViewDashboard: true,
      canViewAuditLogs: true,
      canCertifyAgents: false
    }
  },

  [UserRoles.SECURITY_GOVERNANCE]: {
    title: 'Enterprise Governance',
    subtitle: 'SecOps & Compliance Officer',
    description: 'Audits live user actions, validates prompt injection resistance, enforces PII compliance, and certifies agents for the enterprise store.',
    icon: 'shield-check',
    color: '#f43f5e',
    badge: 'Governance Officer',
    allowedTabs: ['audit', 'catalog'],
    permissions: {
      canBrowseCatalog: true,
      canViewArtifacts: true,
      canDownloadVSCode: false,
      canUsePromptLibrary: false,
      canExecuteSandbox: false,
      canPublishAgent: false,
      canEditArtifacts: false,
      canViewDashboard: false,
      canViewAuditLogs: true,
      canCertifyAgents: true
    }
  }
};

export const AgentCategories = {
  DEVOPS: 'DevOps & SRE',
  SECURITY: 'Security & Compliance',
  FRONTEND: 'Frontend & Fullstack',
  BACKEND: 'Backend & APIs',
  DATABASE: 'Database & Data',
  QA: 'QA & Testing',
  ARCHITECTURE: 'System Architecture'
};

export const BusinessCategories = [
  {
    id: 'Digital',
    label: 'Digital',
    icon: 'monitor-smartphone',
    color: '#00d4ff',
    gradient: 'from-cyan-950/40 to-[var(--bg-card)]',
    border: 'border-cyan-500/30',
    badge: 'badge-cyan',
    description: 'Digital transformation, web & mobile automation agents'
  },
  {
    id: 'Siebel and Fusion',
    label: 'Siebel & Fusion',
    icon: 'database-zap',
    color: '#8957e5',
    gradient: 'from-purple-950/40 to-[var(--bg-card)]',
    border: 'border-purple-500/30',
    badge: 'badge-purple',
    description: 'Oracle Siebel CRM & Oracle Fusion middleware automation agents'
  },
  {
    id: 'Testing',
    label: 'Testing',
    icon: 'flask-conical',
    color: '#f59e0b',
    gradient: 'from-amber-950/40 to-[var(--bg-card)]',
    border: 'border-amber-500/30',
    badge: 'badge-amber',
    description: 'QA automation, test generation & validation agents'
  }
];

export const CopilotModels = {
  SONNET: 'Claude 3.5 Sonnet (GitHub Copilot)',
  GPT4O: 'GPT-4o (GitHub Copilot)',
  O1: 'o1 / o3-mini (GitHub Copilot Reasoning)',
  CUSTOM_COPILOT: 'Enterprise Custom Copilot Fine-Tune'
};

export const ActivityActionTypes = {
  AGENT_CREATED: 'AGENT_CREATED',
  VERSION_BUMPED: 'VERSION_BUMPED',
  ARTIFACT_UPDATED: 'ARTIFACT_UPDATED',
  DOC_UPLOADED: 'DOC_UPLOADED',
  KB_MODIFIED: 'KB_MODIFIED',
  PROMPT_FORKED: 'PROMPT_FORKED',
  PROMPT_CREATED: 'PROMPT_CREATED',
  PROMPT_UPDATED: 'PROMPT_UPDATED',
  VSCODE_DOWNLOADED: 'VSCODE_DOWNLOADED',
  VSCODE_CONFIG_COPIED: 'VSCODE_CONFIG_COPIED',
  SANDBOX_EXECUTED: 'SANDBOX_EXECUTED',
  SECURITY_SCAN_COMPLETED: 'SECURITY_SCAN_COMPLETED',
  AGENT_CERTIFIED: 'AGENT_CERTIFIED',
  AGENT_REJECTED: 'AGENT_REJECTED'
  ,DEVELOPER_FEEDBACK: 'DEVELOPER_FEEDBACK'
  ,ENGINEER_OUTCOME_COMMENT: 'ENGINEER_OUTCOME_COMMENT'
};
