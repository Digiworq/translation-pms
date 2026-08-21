const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting PMS database seed...');

  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  const vendorPassHash = await bcrypt.hash('Vendor@123456', 10);

  // 1. Create System Users
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@pms.com' },
    update: {},
    create: {
      email: 'admin@pms.com',
      password: passwordHash,
      name: 'Executive Super Admin',
      phone: '+1 (800) 555-0100',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    }
  });

  const pmUser = await prisma.user.upsert({
    where: { email: 'pm@pms.com' },
    update: {},
    create: {
      email: 'pm@pms.com',
      password: passwordHash,
      name: 'Sarah Connor (Lead PM)',
      phone: '+1 (800) 555-0101',
      role: 'PROJECT_MANAGER',
      status: 'ACTIVE'
    }
  });

  const accountsUser = await prisma.user.upsert({
    where: { email: 'accounts@pms.com' },
    update: {},
    create: {
      email: 'accounts@pms.com',
      password: passwordHash,
      name: 'Robert Financials',
      phone: '+1 (800) 555-0102',
      role: 'ACCOUNTS',
      status: 'ACTIVE'
    }
  });

  // 2. Create Vendors
  const vendor1 = await prisma.vendor.upsert({
    where: { vendorCode: 'VND-0001' },
    update: {},
    create: {
      vendorCode: 'VND-0001',
      name: 'Hans Gruber',
      companyName: 'Bavaria Translations UG',
      address: 'Munich, Germany',
      phone: '+49 89 123456',
      email: 'hans@bavariade.com',
      gstNumber: 'DE999888777',
      paymentInfo: 'IBAN: DE89370400440532013000, SWIFT: BYLADEMM',
      specialization: 'Technical, Automotive, Legal',
      projectTypes: JSON.stringify(['Translation', 'Proofreading']),
      ratePerWord: 1.50,
      ratePerPage: 450.00,
      hourlyRate: 35.00,
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      rating: 4.9,
      notes: 'Top tier German translator, fast turnarounds.',
      languages: {
        create: [
          { sourceLang: 'English', targetLang: 'German' },
          { sourceLang: 'German', targetLang: 'English' }
        ]
      }
    }
  });

  const vendorUser = await prisma.user.upsert({
    where: { email: 'translator@pms.com' },
    update: {},
    create: {
      email: 'translator@pms.com',
      password: vendorPassHash,
      name: 'Hans Gruber (Translator)',
      phone: '+49 89 123456',
      role: 'VENDOR',
      status: 'ACTIVE',
      vendorId: vendor1.id
    }
  });

  // 3. Create Clients
  const client1 = await prisma.client.upsert({
    where: { clientCode: 'CLT-0001' },
    update: {},
    create: {
      clientCode: 'CLT-0001',
      companyName: 'Global Enterprise Tech Corp',
      contactPerson: 'Alex Mercer',
      email: 'alex@globaltech.com',
      phone: '+1 (415) 555-0199',
      address: '500 Silicon Way, San Francisco, CA',
      gstNumber: 'GSTIN27AABCG1234H1Z5',
      taxInfo: 'Tax ID: 94-3210987',
      poInfo: 'PO-2026-8899',
      paymentTerms: '30 Days',
      status: 'ACTIVE',
      notes: 'Key Enterprise Account. High volume requests.'
    }
  });

  // 4. Create Sample Project
  const project1 = await prisma.project.upsert({
    where: { projectCode: 'PRJ-2026-0001' },
    update: {},
    create: {
      projectCode: 'PRJ-2026-0001',
      projectName: 'Q3 Enterprise Software Manual Localization',
      projectManagerId: pmUser.id,
      clientId: client1.id,
      clientAddress: client1.address,
      clientContact: client1.contactPerson,
      poNumber: 'PO-2026-8899',
      gstNumber: client1.gstNumber,
      projectType: 'Translation',
      sourceLang: 'English',
      targetLang: 'German',
      wordCount: 10000,
      pageCount: 40,
      ratePerWord: 3.00,
      ratePerPage: 750.00,
      clientAmount: 30000.00,
      totalVendorCost: 9000.00,
      grossProfit: 21000.00,
      profitMargin: 70.00,
      paidAmount: 15000.00,
      outstandingAmount: 15000.00,
      startDate: new Date(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      paymentStatus: 'PARTIALLY_PAID',
      notes: 'High priority project. Ensure terminology guidelines are strictly followed.',
      vendors: {
        create: [
          {
            vendorId: vendor1.id,
            taskType: 'Translation',
            sourceLang: 'English',
            targetLang: 'German',
            assignedWords: 6000,
            assignedPages: 24,
            vendorRate: 1.50,
            vendorAmount: 9000.00,
            status: 'IN_PROGRESS',
            notes: 'Translating main UI module.'
          }
        ]
      }
    }
  });

  // 5. Sample Invoice
  const invoice1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-0001' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-0001',
      clientId: client1.id,
      projectId: project1.id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      poNumber: 'PO-2026-8899',
      gstNumber: client1.gstNumber,
      subtotal: 30000.00,
      taxAmount: 5400.00,
      discount: 0,
      grandTotal: 35400.00,
      paidAmount: 15000.00,
      balanceAmount: 20400.00,
      paymentStatus: 'PARTIALLY_PAID',
      notes: 'Initial 50% advance milestone billed.',
      items: {
        create: [
          {
            service: 'Software User Manual Translation (EN -> DE)',
            language: 'English -> German',
            quantity: 10000,
            unit: 'word',
            rate: 3.00,
            amount: 30000.00
          }
        ]
      }
    }
  });

  console.log('PMS Database Seed finished successfully!');
  console.log('Credentials:');
  console.log('Super Admin: admin@pms.com / Admin@123456');
  console.log('Project Manager: pm@pms.com / Admin@123456');
  console.log('Accounts: accounts@pms.com / Admin@123456');
  console.log('Vendor: translator@pms.com / Vendor@123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
