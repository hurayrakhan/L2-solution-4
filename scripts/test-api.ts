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

    console.log('\n--- RUNNING PROPERTY TESTS ---');
    // 5. Login Landlord
    const loginLandlordRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: landlordEmail,
        password: 'password123',
      }),
    });
    const loginLandlordData = await loginLandlordRes.json() as any;
    console.log('Landlord Login:', loginLandlordData.success ? 'PASSED' : 'FAILED', loginLandlordData.message);
    const landlordToken = loginLandlordData.token;

    // 6. Get Categories
    const categoriesRes = await fetch(`${BASE_URL}/categories`);
    const categoriesData = await categoriesRes.json() as any;
    console.log('Get Categories:', categoriesData.success ? 'PASSED' : 'FAILED', `${categoriesData.data?.length} categories found`);
    const categoryId = categoriesData.data?.[0]?.id;

    if (!categoryId) throw new Error('No category found, seed database first');

    // 7. Create Property as Landlord
    const createPropRes = await fetch(`${BASE_URL}/landlord/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${landlordToken}`,
      },
      body: JSON.stringify({
        title: 'Beautiful Studio Apartment',
        description: 'Cozy studio apartment near downtown.',
        location: 'Downtown Dhaka',
        price: 350.00,
        categoryId: categoryId,
        amenities: ['WiFi', 'Air Conditioning', 'Kitchen'],
        images: ['https://example.com/image.jpg'],
      }),
    });
    const createPropData = await createPropRes.json() as any;
    console.log('Create Property:', createPropData.success ? 'PASSED' : 'FAILED', createPropData.message || createPropData.data?.title);
    const propertyId = createPropData.data?.id;

    // 8. Fetch Properties Publicly
    const propsRes = await fetch(`${BASE_URL}/properties?location=Dhaka`);
    const propsData = await propsRes.json() as any;
    console.log('Query Properties:', propsData.success ? 'PASSED' : 'FAILED', `${propsData.data?.length} matching properties`);

    // 9. Fetch Property Details Publicly
    const propDetailsRes = await fetch(`${BASE_URL}/properties/${propertyId}`);
    const propDetailsData = await propDetailsRes.json() as any;
    console.log('Get Property Details:', propDetailsData.success ? 'PASSED' : 'FAILED', propDetailsData.data?.title);

    console.log('\n--- RUNNING RENTAL REQUEST TESTS ---');
    // 10. Create Rental Request as Tenant
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const createRentalRes = await fetch(`${BASE_URL}/rentals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tenantToken}`,
      },
      body: JSON.stringify({
        propertyId: propertyId,
        startDate: today.toISOString(),
        endDate: nextWeek.toISOString(),
      }),
    });
    const createRentalData = await createRentalRes.json() as any;
    console.log('Create Rental Request:', createRentalData.success ? 'PASSED' : 'FAILED', createRentalData.message || createRentalData.data?.id);
    const rentalRequestId = createRentalData.data?.id;

    // 11. Fetch Tenant Rental Requests
    const tenantRentalsRes = await fetch(`${BASE_URL}/rentals`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const tenantRentalsData = await tenantRentalsRes.json() as any;
    console.log('Get Tenant Rentals:', tenantRentalsData.success ? 'PASSED' : 'FAILED', `${tenantRentalsData.data?.length} rentals found`);

    // 12. Fetch Landlord Requests
    const landlordRequestsRes = await fetch(`${BASE_URL}/landlord/requests`, {
      headers: { Authorization: `Bearer ${landlordToken}` },
    });
    const landlordRequestsData = await landlordRequestsRes.json() as any;
    console.log('Get Landlord Requests:', landlordRequestsData.success ? 'PASSED' : 'FAILED', `${landlordRequestsData.data?.length} requests found`);

    // 13. Approve Request as Landlord
    const approveRes = await fetch(`${BASE_URL}/landlord/requests/${rentalRequestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${landlordToken}`,
      },
      body: JSON.stringify({
        status: 'APPROVED',
      }),
    });
    const approveData = await approveRes.json() as any;
    console.log('Approve Rental Request:', approveData.success ? 'PASSED' : 'FAILED', approveData.message);

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await stopServer();
  }
}

runTests();
