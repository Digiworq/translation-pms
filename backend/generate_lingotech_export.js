const fs = require('fs');
const path = require('path');

const dir1 = path.join(__dirname, 'lingotech_export');
const dir2 = path.join(__dirname, '..', 'lingotech_export');

[dir1, dir2].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const projects = [
  {
    projectCode: "PRJ-2026-0001",
    projectName: "Q3 Enterprise Software Manual Localization",
    projectType: "Translation",
    sourceLang: "English",
    targetLang: "German",
    wordCount: 10000,
    pageCount: 40,
    ratePerWord: 3.00,
    clientAmount: 30000.00,
    totalVendorCost: 9000.00,
    grossProfit: 21000.00,
    profitMargin: 70.00,
    paidAmount: 15000.00,
    outstandingAmount: 15000.00,
    startDate: "2026-08-15T00:00:00.000Z",
    deadline: "2026-08-28T00:00:00.000Z",
    priority: "HIGH",
    status: "IN_PROGRESS",
    paymentStatus: "PARTIALLY_PAID",
    clientName: "Global Enterprise Tech Corp",
    assignedVendor: "Hans Gruber (Bavaria Translations)"
  },
  {
    projectCode: "PRJ-2026-0002",
    projectName: "BioHealth Clinical Protocol Translation & Review",
    projectType: "Certified Translation",
    sourceLang: "English",
    targetLang: "Spanish",
    wordCount: 15000,
    pageCount: 60,
    ratePerWord: 4.00,
    clientAmount: 60000.00,
    totalVendorCost: 22500.00,
    grossProfit: 37500.00,
    profitMargin: 62.50,
    paidAmount: 60000.00,
    outstandingAmount: 0.00,
    startDate: "2026-08-01T00:00:00.000Z",
    deadline: "2026-08-22T00:00:00.000Z",
    priority: "URGENT",
    status: "COMPLETED",
    paymentStatus: "PAID",
    clientName: "BioHealth Solutions Inc.",
    assignedVendor: "Maria Garcia (Iberian Trans)"
  },
  {
    projectCode: "PRJ-2026-0003",
    projectName: "Mobile Banking App UI String Localization",
    projectType: "Localization",
    sourceLang: "English",
    targetLang: "Japanese",
    wordCount: 8000,
    pageCount: 0,
    ratePerWord: 3.50,
    clientAmount: 28000.00,
    totalVendorCost: 12000.00,
    grossProfit: 16000.00,
    profitMargin: 57.14,
    paidAmount: 0.00,
    outstandingAmount: 28000.00,
    startDate: "2026-08-18T00:00:00.000Z",
    deadline: "2026-08-30T00:00:00.000Z",
    priority: "MEDIUM",
    status: "ASSIGNED",
    paymentStatus: "PENDING",
    clientName: "Apex Financial Systems",
    assignedVendor: "Kenji Sato (Tokyo Works)"
  }
];

const users = [
  { email: "admin@pms.com", name: "Executive Super Admin", role: "SUPER_ADMIN", status: "ACTIVE", phone: "+1 (800) 555-0100" },
  { email: "pm@pms.com", name: "Sarah Connor (Lead PM)", role: "PROJECT_MANAGER", status: "ACTIVE", phone: "+1 (800) 555-0101" },
  { email: "accounts@pms.com", name: "Robert Financials", role: "ACCOUNTS", status: "ACTIVE", phone: "+1 (800) 555-0102" },
  { email: "translator@pms.com", name: "Hans Gruber", role: "VENDOR", status: "ACTIVE", phone: "+49 89 123456" }
];

const clients = [
  { clientCode: "CLT-0001", companyName: "Global Enterprise Tech Corp", contactPerson: "Alex Mercer", email: "alex@globaltech.com", phone: "+1 (415) 555-0199", address: "500 Silicon Way, San Francisco, CA", gstNumber: "GSTIN27AABCG1234H1Z5", paymentTerms: "30 Days", status: "ACTIVE" },
  { clientCode: "CLT-0002", companyName: "BioHealth Solutions Inc.", contactPerson: "Dr. Elena Rostova", email: "elena@biohealth.com", phone: "+1 (617) 555-0144", address: "100 Medical Plaza, Boston, MA", gstNumber: "GSTIN27BBBCG5678H2Z9", paymentTerms: "15 Days", status: "ACTIVE" },
  { clientCode: "CLT-0003", companyName: "Apex Financial Systems", contactPerson: "David Kim", email: "david@apexfin.com", phone: "+1 (212) 555-0188", address: "1 FinTech Boulevard, New York, NY", gstNumber: "GSTIN27CCCG9012H3Z1", paymentTerms: "30 Days", status: "ACTIVE" }
];

const vendors = [
  { vendorCode: "VND-0001", name: "Hans Gruber", companyName: "Bavaria Translations UG", email: "hans@bavariade.com", phone: "+49 89 123456", specialization: "Technical, Automotive, Legal", ratePerWord: 1.50, availability: "AVAILABLE", status: "ACTIVE", rating: 4.9, languages: [{ sourceLang: "English", targetLang: "German" }] },
  { vendorCode: "VND-0002", name: "Maria Garcia", companyName: "Iberian Translation Services", email: "maria@iberian.es", phone: "+34 91 987654", specialization: "Medical, Pharma, Clinical Protocols", ratePerWord: 1.50, availability: "AVAILABLE", status: "ACTIVE", rating: 5.0, languages: [{ sourceLang: "English", targetLang: "Spanish" }] },
  { vendorCode: "VND-0003", name: "Kenji Sato", companyName: "Tokyo Localization Works", email: "kenji@tokyolocal.jp", phone: "+81 3 5555 0123", specialization: "Software, Mobile UI, Gaming", ratePerWord: 2.00, availability: "BUSY", status: "ACTIVE", rating: 4.8, languages: [{ sourceLang: "English", targetLang: "Japanese" }] }
];

const invoices = [
  { invoiceNumber: "INV-2026-0001", clientName: "Global Enterprise Tech Corp", projectCode: "PRJ-2026-0001", invoiceDate: "2026-08-15T00:00:00.000Z", dueDate: "2026-09-15T00:00:00.000Z", subtotal: 30000.00, taxAmount: 5400.00, discount: 0, grandTotal: 35400.00, paidAmount: 15000.00, balanceAmount: 20400.00, paymentStatus: "PARTIALLY_PAID" },
  { invoiceNumber: "INV-2026-0002", clientName: "BioHealth Solutions Inc.", projectCode: "PRJ-2026-0002", invoiceDate: "2026-08-01T00:00:00.000Z", dueDate: "2026-08-16T00:00:00.000Z", subtotal: 60000.00, taxAmount: 10800.00, discount: 800.00, grandTotal: 70000.00, paidAmount: 70000.00, balanceAmount: 0.00, paymentStatus: "PAID" }
];

[dir1, dir2].forEach(dir => {
  fs.writeFileSync(path.join(dir, 'projects.json'), JSON.stringify(projects, null, 2));
  fs.writeFileSync(path.join(dir, 'users.json'), JSON.stringify(users, null, 2));
  fs.writeFileSync(path.join(dir, 'clients.json'), JSON.stringify(clients, null, 2));
  fs.writeFileSync(path.join(dir, 'vendors.json'), JSON.stringify(vendors, null, 2));
  fs.writeFileSync(path.join(dir, 'invoices.json'), JSON.stringify(invoices, null, 2));
});

console.log('JSON files generated in both directories.');
