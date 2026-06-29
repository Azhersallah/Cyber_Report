// Script to insert users into pppro D1 database via Cloudflare Worker API
// Run with: node insert-users.js

const API_URL = "https://pppro-api.azhersallah1.workers.dev"; // Your Cloudflare Worker URL

const ADMIN_EMAIL = "azhersallah1@gmail.com";
const ADMIN_PASSWORD = "a4z4h4e4r"; // Default password from code

const users = [
  {
    machineId: "DW3NOG2_CN129637410021F",
    customerName: "خۆشی شادی",
    appVersion: "1.5.3",
    purchaseState: true,
    createdAt: "2026-01-04T12:24:25.000Z",
    activatedAt: "2026-01-08T11:29:05.000Z"
  },
  {
    machineId: "KY15MC044J",
    customerName: "شارۆ سەلاح",
    appVersion: "1.5.2",
    purchaseState: true,
    createdAt: "2026-01-02T04:16:17.000Z",
    activatedAt: "2026-01-09T06:04:19.000Z"
  },
  {
    machineId: "M80-D8024401133",
    customerName: "شارۆ سەلاح",
    appVersion: "1.5.3",
    purchaseState: true,
    createdAt: "2026-01-09T10:20:23.000Z",
    activatedAt: "2026-01-09T05:30:00.000Z"
  },
  {
    machineId: "MP298LLA",
    customerName: "محمد ئەسیر",
    appVersion: "1.5.3",
    purchaseState: true,
    createdAt: "2026-01-04T09:12:17.000Z",
    activatedAt: "2026-01-07T09:52:57.000Z"
  },
  {
    machineId: "PHMYF048JC702N",
    customerName: "Rovan Technology",
    appVersion: "1.5.1",
    purchaseState: true,
    createdAt: "2026-01-04T04:15:52.000Z",
    activatedAt: "2026-01-05T09:36:52.000Z"
  },
  {
    machineId: "PRCSR0A8JIO07P",
    customerName: "IT Qalam",
    appVersion: "1.5.3",
    purchaseState: true,
    createdAt: "2026-01-04T08:38:58.000Z",
    activatedAt: "2026-01-08T10:58:22.000Z"
  },
  {
    machineId: "PRCSR0A8JIO07Q",
    customerName: "علی فەیسەل",
    appVersion: "1.5.3",
    purchaseState: true,
    createdAt: "2026-01-05T12:27:33.000Z",
    activatedAt: "2026-01-08T09:01:48.000Z"
  },
  {
    machineId: "PRCSR0A8JIO09Z",
    customerName: "شهاد احمد",
    appVersion: "1.5.3",
    purchaseState: true,
    createdAt: "2026-01-04T09:22:05.000Z",
    activatedAt: "2026-01-04T10:28:06.000Z"
  }
];

async function insertUsers() {
  console.log("Starting user insertion...\n");
  
  for (const user of users) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-user",
          machineId: user.machineId,
          customerName: user.customerName,
          purchaseState: user.purchaseState,
          adminEmail: ADMIN_EMAIL,
          adminPassword: ADMIN_PASSWORD
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${user.machineId} - ${user.customerName}`);
      } else {
        console.log(`❌ ${user.machineId} - Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${user.machineId} - Network error: ${error.message}`);
    }
  }
  
  console.log("\n✅ Done!");
}

insertUsers();
