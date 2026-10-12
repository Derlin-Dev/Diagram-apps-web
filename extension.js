const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vscode = require('vscode');

const DESIGNERS = [
  {
    id: 'database',
    label: 'DB Designer',
    description: 'Diseñador de bases de datos relacionales',
    icon: 'database',
    directory: 'database-designer',
    file: 'index.html',
  },
  {
    id: 'architecture',
    label: 'ArqSketch',
    description: 'Diagramador de arquitectura de aplicaciones',
    icon: 'type-hierarchy',
    directory: 'architecture-designer',
    file: 'index.html',
  },
];

class DesignerTreeProvider {
  getTreeItem(designer) {
    const item = new vscode.TreeItem(designer.label);
    item.description = designer.description;
    item.iconPath = new vscode.ThemeIcon(designer.icon);
    item.command = {
      command: designer.command,
      title: `Abrir ${designer.label}`,
    };
    return item;
  }

  getChildren() {
    return DESIGNERS.map((designer) => ({
      ...designer,
      command: designer.id === 'database'
        ? 'designTools.openDatabaseDesigner'
        : 'designTools.openArchitectureDesigner',
    }));
  }
}

function createWebviewHtml(webview, extensionUri, designer) {
  const appDirectory = path.posix.join('apps', designer.directory);
  const indexUri = vscode.Uri.joinPath(extensionUri, appDirectory, designer.file);
  let html = fs.readFileSync(indexUri.fsPath, 'utf8');
  const nonce = crypto.randomBytes(16).toString('base64');

  html = html.replace(/<a\b(?=[^>]*\bhome-link\b)[^>]*>[\s\S]*?<\/a>/gi, '');
  html = html.replace(/\b(href|src)="([^"]+)"/g, (match, attribute, resourcePath) => {
    if (/^(?:https?:|data:|#|\/)/i.test(resourcePath)) return match;
    const targetPath = path.posix.normalize(path.posix.join(appDirectory, resourcePath));
    if (targetPath.startsWith('../')) return match;
    const resourceUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, targetPath));
    return `${attribute}="${resourceUri}"`;
  });
  html = html.replace(/<script\b/g, `<script nonce="${nonce}"`);

  const csp = [
    `default-src 'none'`,
    `img-src ${webview.cspSource} data: https://api.iconify.design`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
    `font-src ${webview.cspSource} data:`,
    `connect-src https://api.iconify.design`,
    `base-uri 'none'`,
    `form-action 'none'`,
  ].join('; ');
  return html.replace(
    /<head>([\s\S]*?)<\/head>/i,
    `<head><meta http-equiv="Content-Security-Policy" content="${csp}">$1</head>`,
  );
}

function openDesigner(context, designer) {
  const panel = vscode.window.createWebviewPanel(
    `designTools.${designer.id}`,
    designer.label,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, 'apps', designer.directory),
        vscode.Uri.joinPath(context.extensionUri, 'shared'),
      ],
    },
  );
  panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', `${designer.id}.svg`);
  panel.webview.html = createWebviewHtml(panel.webview, context.extensionUri, designer);
}

function activate(context) {
  const provider = new DesignerTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('designToolsExplorer', provider),
    vscode.commands.registerCommand('designTools.openDatabaseDesigner', () => {
      openDesigner(context, DESIGNERS[0]);
    }),
    vscode.commands.registerCommand('designTools.openArchitectureDesigner', () => {
      openDesigner(context, DESIGNERS[1]);
    }),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
