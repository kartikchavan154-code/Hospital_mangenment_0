/**
 * deploy.js — Automated deployment script
 * 
 * Usage:
 *   set RENDER_API_KEY=your_render_key
 *   set VERCEL_TOKEN=your_vercel_token
 *   set VERCEL_PROJECT_ID=your_vercel_project_id (optional, from vercel.com dashboard URL)
 *   node deploy.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const RENDER_API_KEY = (process.env.RENDER_API_KEY || '').trim();
const VERCEL_TOKEN = (process.env.VERCEL_TOKEN || '').trim();
const VERCEL_PROJECT_ID = (process.env.VERCEL_PROJECT_ID || '').trim();
const VERCEL_TEAM_ID = (process.env.VERCEL_TEAM_ID || '').trim();

// Firebase credentials from local service account file
const SA_PATH = path.join(__dirname, 'server/config/hospital-6dfb6-firebase-adminsdk-fbsvc-60ceb00a01.json');
const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));

const FIREBASE_PROJECT_ID = sa.project_id;
const FIREBASE_CLIENT_EMAIL = sa.client_email;
const FIREBASE_PRIVATE_KEY = sa.private_key;

const VERCEL_FRONTEND_URL = 'https://hospital-mangenment-0-zzfj.vercel.app';

async function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function deployToRender() {
  if (!RENDER_API_KEY) {
    console.log('⚠️  RENDER_API_KEY not set. Skipping Render deployment.');
    return null;
  }
  console.log('\n🚀 Deploying backend to Render...');

  // First, find or create the service
  const listRes = await httpRequest({
    hostname: 'api.render.com',
    path: '/v1/services?limit=20',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Accept': 'application/json'
    }
  });

  let existingService = null;
  if (listRes.status === 200 && Array.isArray(listRes.body)) {
    existingService = listRes.body.find(s => s.service && s.service.name === 'hospital-management-api');
    if (existingService) {
      existingService = existingService.service;
      console.log(`  ✅ Found existing Render service: ${existingService.id}`);
    }
  }

  const envVars = [
    { key: 'NODE_ENV', value: 'production' },
    { key: 'DB_TYPE', value: 'firestore' },
    { key: 'JWT_SECRET', value: 'hospital_jwt_secret_prod_2024_verysecure!' },
    { key: 'JWT_EXPIRES_IN', value: '24h' },
    { key: 'FIREBASE_PROJECT_ID', value: FIREBASE_PROJECT_ID },
    { key: 'FIREBASE_CLIENT_EMAIL', value: FIREBASE_CLIENT_EMAIL },
    { key: 'FIREBASE_PRIVATE_KEY', value: FIREBASE_PRIVATE_KEY ? FIREBASE_PRIVATE_KEY.replace(/\n/g, '\\n') : '' },
    { key: 'CLIENT_URL', value: VERCEL_FRONTEND_URL },
    { key: 'ML_SERVICE_URL', value: 'http://localhost:5001' },
  ];

  if (existingService) {
    // Update env vars and trigger redeploy
    const updateRes = await httpRequest({
      hostname: 'api.render.com',
      path: `/v1/services/${existingService.id}/env-vars`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, envVars);
    console.log(`  ✅ Env vars updated (HTTP ${updateRes.status})`);

    const deployRes = await httpRequest({
      hostname: 'api.render.com',
      path: `/v1/services/${existingService.id}/deploys`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, {});
    console.log(`  ✅ Redeploy triggered (HTTP ${deployRes.status})`);
    return existingService.serviceDetails?.url || existingService.url;
  } else {
    // Fetch ownerId if not available
    let ownerId = null;
    const ownersRes = await httpRequest({
      hostname: 'api.render.com',
      path: '/v1/owners?limit=20',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (ownersRes.status === 200 && Array.isArray(ownersRes.body) && ownersRes.body.length > 0) {
      ownerId = ownersRes.body[0].owner.id;
      console.log(`  ✅ Retrieved Render Owner ID: ${ownerId}`);
    } else {
      console.error('  ⚠️  Could not retrieve ownerId from Render:', JSON.stringify(ownersRes.body));
    }

    // Create new service
    const createBody = {
      type: 'web_service',
      name: 'hospital-management-api',
      ownerId: ownerId,
      repo: 'https://github.com/kartikchavan154-code/Hospital_mangenment_0',
      autoDeploy: 'yes',
      rootDir: 'server',
      serviceDetails: {
        env: 'node',
        envSpecificDetails: {
          buildCommand: 'npm install',
          startCommand: 'node server.js'
        },
        plan: 'free',
        region: 'oregon',
        envVars: envVars
      }
    };

    const createRes = await httpRequest({
      hostname: 'api.render.com',
      path: '/v1/services',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, createBody);

    if (createRes.status === 201) {
      const svc = createRes.body.service;
      console.log(`  ✅ Render service created: ${svc.id}`);
      console.log(`  🌐 Service URL: https://${svc.slug}.onrender.com`);
      return `https://${svc.slug}.onrender.com`;
    } else {
      console.error('  ❌ Failed to create Render service:', JSON.stringify(createRes.body, null, 2));
      return null;
    }
  }
}

async function updateVercelEnvVar(apiUrl) {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.log('\n⚠️  VERCEL_TOKEN or VERCEL_PROJECT_ID not set. Skipping Vercel env update.');
    console.log(`   Manually set VITE_API_URL = ${apiUrl}/api in your Vercel project settings.`);
    return;
  }
  console.log('\n🔧 Updating VITE_API_URL in Vercel...');

  const apiUrlValue = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;

  // Delete existing VITE_API_URL if it exists
  const listRes = await httpRequest({
    hostname: 'api.vercel.com',
    path: `/v9/projects/${VERCEL_PROJECT_ID}/env${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Accept': 'application/json'
    }
  });

  if (listRes.status === 200 && listRes.body.envs) {
    const existing = listRes.body.envs.find(e => e.key === 'VITE_API_URL');
    if (existing) {
      await httpRequest({
        hostname: 'api.vercel.com',
        path: `/v9/projects/${VERCEL_PROJECT_ID}/env/${existing.id}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Accept': 'application/json'
        }
      });
      console.log('  ✅ Removed old VITE_API_URL');
    }
  }

  // Create new env var for all environments
  const createRes = await httpRequest({
    hostname: 'api.vercel.com',
    path: `/v10/projects/${VERCEL_PROJECT_ID}/env${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }, {
    key: 'VITE_API_URL',
    value: apiUrlValue,
    type: 'plain',
    target: ['production', 'preview', 'development']
  });

  if (createRes.status === 200 || createRes.status === 201) {
    console.log(`  ✅ VITE_API_URL set to: ${apiUrlValue}`);
  } else {
    console.error('  ❌ Failed to set Vercel env var:', JSON.stringify(createRes.body, null, 2));
  }

  // Trigger redeploy
  const redeployRes = await httpRequest({
    hostname: 'api.vercel.com',
    path: `/v13/deployments${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }, {
    name: 'hospital-mangenment-0',
    gitSource: {
      type: 'github',
      ref: 'main',
      repoId: null
    },
    target: 'production'
  });

  if (redeployRes.status === 200 || redeployRes.status === 201) {
    console.log('  ✅ Vercel redeploy triggered');
  } else {
    console.log(`  ℹ️  Vercel redeploy HTTP ${redeployRes.status} — please manually redeploy in the Vercel dashboard.`);
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  Hospital Management System — Deployment  ║');
  console.log('╚═══════════════════════════════════════════╝');

  const renderUrl = await deployToRender();

  if (renderUrl) {
    console.log(`\n  🌐 Backend URL: ${renderUrl}`);
    await updateVercelEnvVar(renderUrl);
  }

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║               Deployment Done!            ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('\nFrontend: https://hospital-mangenment-0-zzfj.vercel.app');
  if (renderUrl) console.log(`Backend:  ${renderUrl}/api/health`);
  console.log('\n🔑 You need to provide API tokens to fully automate this.');
  console.log('   - Get Render API key: https://dashboard.render.com/u/settings#api-keys');
  console.log('   - Get Vercel token:   https://vercel.com/account/tokens');
  console.log('   - Get Vercel project ID: from your project URL in Vercel dashboard (Settings > General)');
}

main().catch(console.error);
