const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);

const PROJECTS_TO_INSERT = [
  {
    id: 'prj-1787213560137',
    projectCode: 'PRJ-2026-5270',
    projectName: 'aditya',
    clientName: 'Global Enterprise Tech Corp',
    projectType: 'Translation',
    sourceLang: 'English',
    targetLang: 'German',
    wordCount: 10000,
    ratePerWord: 3.00,
    clientAmount: 30000.00,
    totalVendorCost: 9000.00,
    grossProfit: 21000.00,
    profitMargin: 70.00,
    deadline: '2026-08-27T00:00:00.000Z',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assignedVendor: 'aditya'
  },
  {
    id: 'prj-1787213560138',
    projectCode: 'PRJ-2026-8321',
    projectName: 'adi',
    clientName: 'Global Enterprise Tech Corp',
    projectType: 'Translation',
    sourceLang: 'English',
    targetLang: 'German',
    wordCount: 10000,
    ratePerWord: 3.00,
    clientAmount: 30000.00,
    totalVendorCost: 9000.00,
    grossProfit: 21000.00,
    profitMargin: 70.00,
    deadline: '2026-08-27T00:00:00.000Z',
    priority: 'MEDIUM',
    status: 'NEW',
    assignedVendor: 'Pending Allocation'
  },
  {
    id: 'prj-1',
    projectCode: 'PRJ-2026-0001',
    projectName: 'Q3 Enterprise Software Manual Localization',
    clientName: 'Global Enterprise Tech Corp',
    projectType: 'Translation',
    sourceLang: 'English',
    targetLang: 'German',
    wordCount: 10000,
    ratePerWord: 3.00,
    clientAmount: 30000.00,
    totalVendorCost: 9000.00,
    grossProfit: 21000.00,
    profitMargin: 70.00,
    deadline: '2026-08-28T00:00:00.000Z',
    priority: 'HIGH',
    status: 'NEW',
    assignedVendor: 'Hans Gruber (Bavaria Translations)'
  },
  {
    id: 'prj-2',
    projectCode: 'PRJ-2026-0002',
    projectName: 'BioHealth Clinical Protocol Translation & Review',
    clientName: 'BioHealth Solutions Inc.',
    projectType: 'Certified Translation',
    sourceLang: 'English',
    targetLang: 'Spanish',
    wordCount: 15000,
    ratePerWord: 4.00,
    clientAmount: 60000.00,
    totalVendorCost: 22500.00,
    grossProfit: 37500.00,
    profitMargin: 62.50,
    deadline: '2026-08-22T00:00:00.000Z',
    priority: 'URGENT',
    status: 'COMPLETED',
    assignedVendor: 'Maria Garcia (Iberian Trans)'
  },
  {
    id: 'prj-3',
    projectCode: 'PRJ-2026-0003',
    projectName: 'Mobile Banking App UI String Localization',
    clientName: 'Apex Financial Systems',
    projectType: 'Localization',
    sourceLang: 'English',
    targetLang: 'Japanese',
    wordCount: 8000,
    ratePerWord: 3.50,
    clientAmount: 28000.00,
    totalVendorCost: 12000.00,
    grossProfit: 16000.00,
    profitMargin: 57.14,
    deadline: '2026-08-30T00:00:00.000Z',
    priority: 'MEDIUM',
    status: 'DELIVERED',
    assignedVendor: 'Kenji Sato (Tokyo Works)'
  }
];

async function run() {
  try {
    await client.connect();
    const db = client.db('lingotech_pms');
    const col = db.collection('projects');

    for (const p of PROJECTS_TO_INSERT) {
      await col.updateOne(
        { projectCode: p.projectCode },
        { $set: p },
        { upsert: true }
      );
    }

    const allProj = await col.find({}).toArray();
    console.log('--- MONGODB LINGOTECH_PMS PROJECTS COUNT ---', allProj.length);
    allProj.forEach(p => {
      console.log(`- [${p.projectCode}] ${p.projectName} (${p.status})`);
    });
  } finally {
    await client.close();
  }
}

run();
