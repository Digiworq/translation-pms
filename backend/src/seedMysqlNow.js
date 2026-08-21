const prisma = require('./config/prisma');

const ACTIVE_WEBSITE_PROJECTS = [
  {
    id: 'prj-1787222696001',
    projectCode: 'PRJ-2026-3178',
    projectName: 'karan',
    clientName: 'digiworq',
    projectType: 'Translation',
    sourceLang: 'English',
    targetLang: 'German',
    wordCount: 10000,
    ratePerWord: 2.50,
    clientAmount: 25000.00,
    totalVendorCost: 7500.00,
    grossProfit: 17500.00,
    profitMargin: 70.00,
    deadline: new Date('2026-08-27T00:00:00.000Z'),
    priority: 'MEDIUM',
    status: 'NEW'
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
    deadline: new Date('2026-08-28T00:00:00.000Z'),
    priority: 'HIGH',
    status: 'NEW'
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
    deadline: new Date('2026-08-22T00:00:00.000Z'),
    priority: 'URGENT',
    status: 'COMPLETED'
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
    deadline: new Date('2026-08-30T00:00:00.000Z'),
    priority: 'MEDIUM',
    status: 'DELIVERED'
  }
];

async function runSeed() {
  try {
    const activeCodes = ACTIVE_WEBSITE_PROJECTS.map(p => p.projectCode);

    // Delete removed/deleted projects from MySQL
    await prisma.project.deleteMany({
      where: {
        projectCode: { notIn: activeCodes }
      }
    });

    let pmUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!pmUser) {
      pmUser = await prisma.user.create({
        data: {
          email: 'admin@pms.com',
          password: '$2a$10$HASHEDPASSWORD',
          name: 'Executive Super Admin',
          role: 'SUPER_ADMIN'
        }
      });
    }

    for (const p of ACTIVE_WEBSITE_PROJECTS) {
      let clientRec = await prisma.client.findFirst({ where: { companyName: p.clientName } });
      if (!clientRec) {
        const cCode = `CLT-${Math.floor(1000 + Math.random() * 9000)}`;
        clientRec = await prisma.client.create({
          data: {
            clientCode: cCode,
            companyName: p.clientName,
            contactPerson: 'Alex Mercer',
            email: `contact@${p.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            phone: '+1 (800) 555-0199'
          }
        });
      }

      await prisma.project.upsert({
        where: { projectCode: p.projectCode },
        update: {
          projectName: p.projectName,
          status: p.status,
          priority: p.priority,
          wordCount: p.wordCount,
          ratePerWord: p.ratePerWord,
          clientAmount: p.clientAmount,
          totalVendorCost: p.totalVendorCost,
          grossProfit: p.grossProfit,
          profitMargin: p.profitMargin
        },
        create: {
          id: p.id,
          projectCode: p.projectCode,
          projectName: p.projectName,
          projectType: p.projectType,
          sourceLang: p.sourceLang,
          targetLang: p.targetLang,
          wordCount: p.wordCount,
          ratePerWord: p.ratePerWord,
          clientAmount: p.clientAmount,
          totalVendorCost: p.totalVendorCost,
          grossProfit: p.grossProfit,
          profitMargin: p.profitMargin,
          status: p.status,
          priority: p.priority,
          deadline: p.deadline,
          clientId: clientRec.id,
          projectManagerId: pmUser.id
        }
      });
    }
    console.log('✅ Clean MySQL Sync Complete. Deleted projects removed from MySQL.');
  } catch (err) {
    console.error('Seed Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();
