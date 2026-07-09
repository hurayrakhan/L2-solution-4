import app from '../src/app.js';
import { Server } from 'http';

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

let server: Server;

async function startServer(): Promise<void> {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
      resolve();
    });
  });
}

async function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      console.log('Test server stopped');
      resolve();
    });
  });
}

async function runTests() {
  await startServer();
  try {
    console.log('\n--- RUNNING AUTH TESTS ---');
    const tenantEmail = `tenant_${Date.now()}@test.com`;
    const landlordEmail = `landlord_${Date.now()}@test.com`;

    // 1. Register Tenant
    const regTenantRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Tenant',
        email: tenantEmail,
        password: 'password123',
        role: 'TENANT',
      }),
    });
    const regTenantData = await regTenantRes.json() as any;
    console.log('Tenant Registration:', regTenantData.success ? 'PASSED' : 'FAILED', regTenantData.message);

    // 2. Register Landlord
    const regLandlordRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Landlord',
        email: landlordEmail,
        password: 'password123',
        role: 'LANDLORD',
      }),
    });
    const regLandlordData = await regLandlordRes.json() as any;
    console.log('Landlord Registration:', regLandlordData.success ? 'PASSED' : 'FAILED', regLandlordData.message);

    // 3. Login Tenant
    const loginTenantRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: tenantEmail,
        password: 'password123',
      }),
    });
    const loginTenantData = await loginTenantRes.json() as any;
    console.log('Tenant Login:', loginTenantData.success ? 'PASSED' : 'FAILED', loginTenantData.message);
    const tenantToken = loginTenantData.token;

    // 4. Get Current User (Tenant)
    const meTenantRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${tenantToken}`,
      },
    });
    const meTenantData = await meTenantRes.json() as any;
    console.log('Tenant Profile Fetch:', meTenantData.success ? 'PASSED' : 'FAILED', meTenantData.data?.name);

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await stopServer();
  }
}

runTests();
