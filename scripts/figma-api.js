/**
 * Figma REST API Client
 * https://www.figma.com/developers/api
 */
const https = require('https');
const fs = require('fs');

const API_BASE = 'api.figma.com';
const API_VERSION = 'v1';

// Load token from credentials file
function loadToken() {
  try {
    const envContent = fs.readFileSync('/data/workspace/credentials/figma.env', 'utf8');
    const match = envContent.match(/FIGMA_TOKEN=(.+)/);
    if (match) return match[1].trim();
  } catch (e) {
    console.error('Error reading credentials:', e.message);
  }
  return null;
}

const TOKEN = loadToken();

if (!TOKEN) {
  console.error('Error: FIGMA_TOKEN not found in credentials/figma.env');
  process.exit(1);
}

/**
 * Make HTTPS request to Figma API
 */
function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      port: 443,
      path: `/${API_VERSION}${path}`,
      method: method,
      headers: {
        'X-Figma-Token': TOKEN,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(json)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Get file metadata
 */
async function getFile(fileKey) {
  return apiRequest('GET', `/files/${fileKey}`);
}

/**
 * Create a new Figma file via API
 * 
 * ⚠️ IMPORTANT: Figma REST API does NOT support file creation with Personal Access Token.
 * File creation requires OAuth2 authentication with 'files:write' scope.
 * 
 * Personal Access Token only supports READ operations:
 * - GET /v1/files/:key
 * - GET /v1/images/:key
 * - GET /v1/me
 * - etc.
 * 
 * For file creation, you need to:
 * 1. Register an OAuth app at https://www.figma.com/developers/apps
 * 2. Implement OAuth2 flow to get access token with files:write scope
 * 3. Use the OAuth token instead of Personal Access Token
 * 
 * Alternative: Create files manually via Figma UI or use Figma Plugin API
 */
async function createFile(name) {
  throw new Error(
    'File creation is not supported via REST API with Personal Access Token.\n' +
    'Figma REST API only supports READ operations.\n' +
    'To create files, use:\n' +
    '1. Figma UI (manual creation)\n' +
    '2. OAuth2 app with files:write scope\n' +
    '3. Figma Plugin API'
  );
}

/**
 * Add rectangle to a file (requires OAuth with files:write scope)
 * 
 * ⚠️ NOT SUPPORTED with Personal Access Token
 * This operation requires OAuth2 authentication.
 */
async function createRectangle(fileKey, x, y, width, height, color) {
  throw new Error(
    'Adding rectangles requires OAuth2 with files:write scope.\n' +
    'Personal Access Token only supports read operations.\n' +
    'File: ' + fileKey
  );
}

/**
 * Add text to a file (requires OAuth with files:write scope)
 * 
 * ⚠️ NOT SUPPORTED with Personal Access Token
 * This operation requires OAuth2 authentication.
 */
async function createText(fileKey, x, y, text, fontSize) {
  throw new Error(
    'Adding text requires OAuth2 with files:write scope.\n' +
    'Personal Access Token only supports read operations.\n' +
    'File: ' + fileKey
  );
}

/**
 * Export image from a node
 */
async function exportImage(fileKey, nodeId, format = 'png', scale = 1) {
  // First request the export
  const exportRequest = await apiRequest('GET', 
    `/images/${fileKey}?ids=${nodeId}&format=${format}&scale=${scale}`
  );
  
  if (exportRequest.images && exportRequest.images[nodeId]) {
    return exportRequest.images[nodeId]; // URL to download
  }
  throw new Error('Export failed: ' + JSON.stringify(exportRequest));
}

/**
 * Get user info
 */
async function getMe() {
  return apiRequest('GET', '/me');
}

/**
 * Get team projects
 */
async function getTeamProjects(teamId) {
  return apiRequest('GET', `/teams/${teamId}/projects`);
}

/**
 * Get project files
 */
async function getProjectFiles(projectId) {
  return apiRequest('GET', `/projects/${projectId}/files`);
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'me':
        const user = await getMe();
        console.log('User:', JSON.stringify(user, null, 2));
        break;

      case 'get':
        if (!args[1]) {
          console.error('Usage: node figma-api.js get <file-key>');
          process.exit(1);
        }
        const file = await getFile(args[1]);
        console.log('File:', JSON.stringify(file, null, 2));
        break;

      case 'export':
        if (!args[1] || !args[2]) {
          console.error('Usage: node figma-api.js export <file-key> <node-id>');
          process.exit(1);
        }
        const url = await exportImage(args[1], args[2]);
        console.log('Export URL:', url);
        break;

      case 'test':
        // Test API connectivity
        const testUser = await getMe();
        console.log('✓ API connection successful');
        console.log('User:', testUser.handle, `(${testUser.email})`);
        break;

      default:
        console.log(`
Figma API Client

Usage:
  node figma-api.js me                    - Get current user info
  node figma-api.js get <file-key>        - Get file metadata
  node figma-api.js export <file-key> <node-id>  - Export node as image
  node figma-api.js test                  - Test API connection

Limitations:
- Personal Access Token only supports READ operations
- File creation requires OAuth2 with files:write scope
- To create files: use Figma UI or implement OAuth2 flow

API Documentation: https://www.figma.com/developers/api
`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  getMe,
  getFile,
  createFile,
  createRectangle,
  createText,
  exportImage,
  getTeamProjects,
  getProjectFiles,
  apiRequest
};

// Run CLI if called directly
if (require.main === module) {
  main();
}
