// Migration script: D1 -> Durable Object
// Run with: node migrate-users.js

const API_URL = 'https://pppro-api.azhersallah1.workers.dev';

// Users from D1 (copy from wrangler d1 execute output)
const usersFromD1 = [
  { machine_id: 'KY15MC044J', customer_name: 'ئاژێر صلاح', purchase_state: 1, app_version: '1.5.4' },
  { machine_id: 'DW3NOG2_CN129637410021F', customer_name: 'هێدی لقمان', purchase_state: 1, app_version: '1.5.3' },
  { machine_id: 'M80-D8024401133', customer_name: 'ئارێز صلاح', purchase_state: 1, app_version: '1.5.4' },
  { machine_id: 'MP298LLA', customer_name: 'محمد ناظم', purchase_state: 1, app_version: '1.5.4' },
  { machine_id: 'PHMYF048JC702N', customer_name: 'Rovan Technology', purchase_state: 1, app_version: '1.5.3' },
  { machine_id: 'PRCSR0A8JIO07P', customer_name: 'IT Qalam', purchase_state: 1, app_version: '1.5.4' },
  { machine_id: 'PRCSR0A8JIO07Q', customer_name: 'علی فاضل', purchase_state: 1, app_version: '1.5.4' },
  { machine_id: 'PRCSR0A8JIO09Z', customer_name: 'عماد احمد', purchase_state: 1, app_version: '1.5.3' },
];

async function migrateUser(user) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update-user',
        adminEmail: 'azhersallah1@gmail.com',
        adminPassword: 'a4z4h4e4r',
        machineId: user.machine_id,
        customerName: user.customer_name,
        purchaseState: user.purchase_state === 1
      })
    });
    const result = await response.json();
    console.log(`Migrated ${user.machine_id}: ${result.success ? 'OK' : 'FAILED'}`);
  } catch (err) {
    console.error(`Failed to migrate ${user.machine_id}:`, err.message);
  }
}

async function main() {
  console.log('Starting migration...');
  for (const user of usersFromD1) {
    await migrateUser(user);
  }
  console.log('Migration complete!');
}

main();
