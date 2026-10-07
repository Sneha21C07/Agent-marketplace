/**
 * NexusAgent Enterprise - GitHub Copilot Exporter & Package Generator
 * Builds direct VS Code configurations, .github/copilot-instructions.md, and .zip artifact bundles
 */

import { StorageService } from './storage.js';
import { ActivityActionTypes } from './types.js';

export const CopilotExporter = {
  /**
   * Generates standard VS Code .github/copilot-instructions.md content
   */
  generateInstructionsMd(agent) {
    return `# Enterprise GitHub Copilot Instructions
# Agent: ${agent.name} (v${agent.version})
# Tagline: ${agent.tagline}
# Certified by: Enterprise Security Council (${agent.certificationStatus})

${agent.copilotConfig?.instructionsSnippet || ''}

---
## Enterprise Guardrails & Compliance
- LLM Model: ${agent.copilotModel || 'GitHub Copilot Enterprise'}
- PII Masking: ${agent.security?.piiMasking || 'ENABLED'}
- Security Standard: OWASP Top 10 & SOC2 Type II Certified
- Chat Handle: ${agent.copilotChatHandle || '@copilot'}
`;
  },

  /**
   * Generates .vscode/settings.json snippet
   */
  generateVSCodeSettings(agent) {
    return JSON.stringify({
      "github.copilot.chat.agent": {
        "id": agent.slug || agent.id,
        "name": agent.name,
        "handle": agent.copilotChatHandle,
        "version": agent.version,
        "instructionsPath": ".github/copilot-instructions.md",
        "knowledgeBasePath": ".github/knowledge_base/"
      },
      "github.copilot.advanced": {
        "model": agent.copilotModel?.includes('Sonnet') ? "claude-3.5-sonnet" : "gpt-4o",
        "enterpriseSync": true
      }
    }, null, 2);
  },

  /**
   * Generates complete agent manifest JSON
   */
  generateManifest(agent) {
    return JSON.stringify({
      manifestVersion: "2.0.0",
      type: "enterprise-github-copilot-agent",
      id: agent.id,
      name: agent.name,
      version: agent.version,
      category: agent.category,
      chatHandle: agent.copilotChatHandle,
      copilotModel: agent.copilotModel,
      certification: agent.security,
      author: agent.author,
      publishedAt: agent.lastUpdated,
      artifacts: {
        demoVideoTitle: agent.artifacts?.demoVideo?.title,
        inputDocsCount: agent.artifacts?.inputDocuments?.length || 0,
        outputDocsCount: agent.artifacts?.outputDocuments?.length || 0,
        knowledgeBaseArticlesCount: agent.artifacts?.knowledgeBase?.length || 0
      }
    }, null, 2);
  },

  /**
   * Downloads dynamic ZIP package containing all artifacts, manifests, and VS Code configs
   */
  async downloadZipPackage(agent, actorName = 'Enterprise Developer') {
    // Check if JSZip is available on window, or create fallback tar/zip
    if (typeof window.JSZip === 'undefined') {
      // Fallback: download the primary manifest and instructions as JSON package
      this.downloadJsonFallback(agent);
      return;
    }

    const zip = new window.JSZip();

    // 1. Root Readme & Manifest
    zip.file("README.md", `# ${agent.name} (v${agent.version})
${agent.tagline}

## Quickstart in VS Code:
1. Extract this repository into your project root.
2. Ensure GitHub Copilot Chat extension is enabled in VS Code.
3. Open Copilot Chat and invoke \`${agent.copilotChatHandle}\`.
4. The instructions in \`.github/copilot-instructions.md\` will automatically govern Copilot's context window.

## Included Artifacts:
- \`.github/copilot-instructions.md\` : Custom Copilot Enterprise system prompt
- \`.vscode/settings.json\` : VS Code workspace agent settings
- \`input_documents/\` : ${agent.artifacts?.inputDocuments?.length || 0} sample test inputs
- \`output_documents/\` : ${agent.artifacts?.outputDocuments?.length || 0} sample generated outputs
- \`knowledge_base/\` : ${agent.artifacts?.knowledgeBase?.length || 0} enterprise guidelines
`);

    zip.file("agent.manifest.json", this.generateManifest(agent));

    // 2. .github folder
    const githubFolder = zip.folder(".github");
    githubFolder.file("copilot-instructions.md", this.generateInstructionsMd(agent));

    const promptsFolder = githubFolder.folder("prompts");
    promptsFolder.file(`${agent.slug || 'agent'}.prompt.md`, `---
name: ${agent.name}
handle: ${agent.copilotChatHandle}
model: ${agent.copilotModel}
---
${agent.copilotConfig?.instructionsSnippet || ''}
`);

    // 3. .vscode folder
    const vscodeFolder = zip.folder(".vscode");
    vscodeFolder.file("settings.json", this.generateVSCodeSettings(agent));

    // 4. Input Documents
    if (agent.artifacts?.inputDocuments?.length) {
      const inFolder = zip.folder("input_documents");
      agent.artifacts.inputDocuments.forEach(doc => {
        inFolder.file(doc.filename, doc.content);
      });
    }

    // 5. Output Documents
    if (agent.artifacts?.outputDocuments?.length) {
      const outFolder = zip.folder("output_documents");
      agent.artifacts.outputDocuments.forEach(doc => {
        outFolder.file(doc.filename, doc.content);
      });
    }

    // 6. Knowledge Base
    if (agent.artifacts?.knowledgeBase?.length) {
      const kbFolder = githubFolder.folder("knowledge_base");
      agent.artifacts.knowledgeBase.forEach(kb => {
        const sanitizedTitle = kb.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        kbFolder.file(`${sanitizedTitle}.md`, `# ${kb.title}
Category: ${kb.category} | Author: ${kb.author} | Updated: ${kb.lastUpdated}

${kb.content}
`);
      });
    }

    // Generate zip blob & trigger download
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${agent.slug || 'copilot-agent'}-v${agent.version}-bundle.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Record activity in Audit Stream
    StorageService.logActivity(
      ActivityActionTypes.VSCODE_DOWNLOADED,
      actorName,
      'developer',
      agent.id,
      agent.name,
      `Downloaded complete agent bundle (.zip) with ${agent.artifacts?.knowledgeBase?.length || 0} KB docs and VS Code Copilot setup.`,
      { version: agent.version, packageSize: 'Zip Bundle' }
    );
  },

  downloadJsonFallback(agent) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(this.generateManifest(agent));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${agent.slug || 'agent'}-manifest.json`);
    dlAnchorElem.click();
  }
};
