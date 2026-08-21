const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const exportDir = path.join(__dirname, 'mongodb_export');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

// 1. Users
const users = [
  {
    _id: { $oid: "66c46a010000000000000001" },
    email: "admin@pms.com",
    name: "Executive Super Admin",
    phone: "+1 (800) 555-0100",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    createdAt: { $date: "2026-08-15T10:00:00.000Z" }
  },
  {
    _id: { $oid: "66c46a010000000000000002" },
    email: "pm@pms.com",
    name: "Sarah Connor (Lead PM)",
    phone: "+1 (800) 555-0101",
    role: "PROJECT_MANAGER",
    status: "ACTIVE",
    createdAt: { $date: "2026-08-15T10:00:00.000Z" }
  },
  {
    _id: { $oid: "66c46a010000000000000003" },
    email: "accounts@pms.com",
    name: "Robert Financials",
    phone: "+1 (800) 555-0102",
    role: "ACCOUNTS",
    status: "ACTIVE",
    createdAt: { $date: "2026-08-15T10:00:00.000Z" }
  },
  {
    _id: { $oid: "66c46a010000000000000004" },
    email: "translator@pms.com",
    name: "Hans Gruber (Translator)",
    phone: "+49 89 123456",
    role: "VENDOR",
    status: "ACTIVE",
    vendorId: "66c46a020000000000000001",
    createdAt: { $date: "2026-08-15T10:00:00.000Z" }
  }
];

// 2. Clients
const clients = [
  {
    _id: { $oid: "66c46a030000000000000001" },
    clientCode: "CLT-0001",
    companyName: "Global Enterprise Tech Corp",
    contactPerson: "Alex Mercer",
    email: "alex@globaltech.com",
    phone: "+1 (415) 555-0199",
    address: "500 Silicon Way, San Francisco, CA",
    gstNumber: "GSTIN27AABCG1234H1Z5",
    paymentTerms: "30 Days",
    status: "ACTIVE"
  },
  {
    _id: { $oid: "66c46a030000000000000002" },
    clientCode: "CLT-0002",
    companyName: "BioHealth Solutions Inc.",
    contactPerson: "Dr. Elena Rostova",
    email: "elena@biohealth.com",
    phone: "+1 (617) 555-0144",
    address: "100 Medical Plaza, Boston, MA",
    gstNumber: "GSTIN27BBBCG5678H2Z9",
    paymentTerms: "15 Days",
    status: "ACTIVE"
  },
  {
    _id: { $oid: "66c46a030000000000000003" },
    clientCode: "CLT-0003",
    companyName: "Apex Financial Systems",
    contactPerson: "David Kim",
    email: "david@apexfin.com",
    phone: "+1 (212) 555-0188",
    address: "1 FinTech Boulevard, New York, NY",
    gstNumber: "GSTIN27CCCG9012H3Z1",
    paymentTerms: "30 Days",
    status: "ACTIVE"
  }
];

// 3. Vendors
const vendors = [
  {
    _id: { $oid: "66c46a020000000000000001" },
    vendorCode: "VND-0001",
    name: "Hans Gruber",
    companyName: "Bavaria Translations UG",
    email: "hans@bavariade.com",
    phone: "+49 89 123456",
    specialization: "Technical, Automotive, Legal",
    ratePerWord: 1.50,
    ratePerPage: 450.00,
    hourlyRate: 35.00,
    availability: "AVAILABLE",
    status: "ACTIVE",
    rating: 4.9,
    languages: [{ sourceLang: "English", targetLang: "German" }]
  },
  {
    _id: { $oid: "66c46a020000000000000002" },
    vendorCode: "VND-0002",
    name: "Maria Garcia",
    companyName: "Iberian Translation Services",
    email: "maria@iberian.es",
    phone: "+34 91 987654",
    specialization: "Medical, Pharma, Clinical Protocols",
    ratePerWord: 1.50,
    ratePerPage: 450.00,
    hourlyRate: 40.00,
    availability: "AVAILABLE",
    status: "ACTIVE",
    rating: 5.0,
    languages: [{ sourceLang: "English", targetLang: "Spanish" }]
  },
  {
    _id: { $oid: "66c46a020000000000000003" },
    vendorCode: "VND-0003",
    name: "Kenji Sato",
    companyName: "Tokyo Localization Works",
    email: "kenji@tokyolocal.jp",
    phone: "+81 3 5555 0123",
    specialization: "Software, Mobile UI, Gaming",
    ratePerWord: 2.00,
    ratePerPage: 600.00,
    hourlyRate: 50.00,
    availability: "BUSY",
    status: "ACTIVE",
    rating: 4.8,
    languages: [{ sourceLang: "English", targetLang: "Japanese" }]
  }
];

// 4. Projects
const projects = [
  {
    _id: { $oid: "66c46a040000000000000001" },
    projectCode: "PRJ-2026-0001",
    projectName: "Q3 Enterprise Software Manual Localization",
    projectManagerId: "66c46a010000000000000002",
    clientId: "66c46a030000000000000001",
    clientAddress: "500 Silicon Way, San Francisco, CA",
    clientContact: "Alex Mercer",
    poNumber: "PO-2026-8899",
    gstNumber: "GSTIN27AABCG1234H1Z5",
    projectType: "Translation",
    sourceLang: "English",
    targetLang: "German",
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
    startDate: { $date: "2026-08-15T00:00:00.000Z" },
    deadline: { $date: "2026-08-28T00:00:00.000Z" },
    priority: "HIGH",
    status: "IN_PROGRESS",
    paymentStatus: "PARTIALLY_PAID",
    notes: "High priority project. Ensure UI terminology matches approved termbase Glossaries v2.1."
  },
  {
    _id: { $oid: "66c46a040000000000000002" },
    projectCode: "PRJ-2026-0002",
    projectName: "BioHealth Clinical Protocol Translation & Review",
    projectManagerId: "66c46a010000000000000002",
    clientId: "66c46a030000000000000002",
    clientAddress: "100 Medical Plaza, Boston, MA",
    clientContact: "Dr. Elena Rostova",
    poNumber: "PO-MED-9921",
    gstNumber: "GSTIN27BBBCG5678H2Z9",
    projectType: "Certified Translation",
    sourceLang: "English",
    targetLang: "Spanish",
    wordCount: 15000,
    pageCount: 60,
    ratePerWord: 4.00,
    ratePerPage: 1000.00,
    clientAmount: 60000.00,
    totalVendorCost: 22500.00,
    grossProfit: 37500.00,
    profitMargin: 62.50,
    paidAmount: 60000.00,
    outstandingAmount: 0.00,
    startDate: { $date: "2026-08-01T00:00:00.000Z" },
    deadline: { $date: "2026-08-22T00:00:00.000Z" },
    priority: "URGENT",
    status: "COMPLETED",
    paymentStatus: "PAID",
    notes: "Requires certified medical translation stamp and back-translation proofing."
  },
  {
    _id: { $oid: "66c46a040000000000000003" },
    projectCode: "PRJ-2026-0003",
    projectName: "Mobile Banking App UI String Localization",
    projectManagerId: "66c46a010000000000000002",
    clientId: "66c46a030000000000000003",
    clientAddress: "1 FinTech Boulevard, New York, NY",
    clientContact: "David Kim",
    poNumber: "PO-FIN-3344",
    gstNumber: "GSTIN27CCCG9012H3Z1",
    projectType: "Localization",
    sourceLang: "English",
    targetLang: "Japanese",
    wordCount: 8000,
    pageCount: 0,
    ratePerWord: 3.50,
    ratePerPage: 0,
    clientAmount: 28000.00,
    totalVendorCost: 12000.00,
    grossProfit: 16000.00,
    profitMargin: 57.14,
    paidAmount: 0.00,
    outstandingAmount: 28000.00,
    startDate: { $date: "2026-08-18T00:00:00.000Z" },
    deadline: { $date: "2026-08-30T00:00:00.000Z" },
    priority: "MEDIUM",
    status: "ASSIGNED",
    paymentStatus: "PENDING",
    notes: "Android and iOS JSON string file localization."
  }
];

// 5. Invoices
const invoices = [
  {
    _id: { $oid: "66c46a050000000000000001" },
    invoiceNumber: "INV-2026-0001",
    clientId: "66c46a030000000000000001",
    projectId: "66c46a040000000000000001",
    invoiceDate: { $date: "2026-08-15T00:00:00.000Z" },
    dueDate: { $date: "2026-09-15T00:00:00.000Z" },
    poNumber: "PO-2026-8899",
    gstNumber: "GSTIN27AABCG1234H1Z5",
    subtotal: 30000.00,
    taxAmount: 5400.00,
    discount: 0,
    grandTotal: 35400.00,
    paidAmount: 15000.00,
    balanceAmount: 20400.00,
    paymentStatus: "PARTIALLY_PAID",
    notes: "Initial 50% milestone billed.",
    items: [
      { service: "Software User Manual Translation (EN -> DE)", language: "English -> German", quantity: 10000, unit: "word", rate: 3.00, amount: 30000.00 }
    ]
  },
  {
    _id: { $oid: "66c46a050000000000000002" },
    invoiceNumber: "INV-2026-0002",
    clientId: "66c46a030000000000000002",
    projectId: "66c46a040000000000000002",
    invoiceDate: { $date: "2026-08-01T00:00:00.000Z" },
    dueDate: { $date: "2026-08-16T00:00:00.000Z" },
    poNumber: "PO-MED-9921",
    gstNumber: "GSTIN27BBBCG5678H2Z9",
    subtotal: 60000.00,
    taxAmount: 10800.00,
    discount: 800.00,
    grandTotal: 70000.00,
    paidAmount: 70000.00,
    balanceAmount: 0.00,
    paymentStatus: "PAID",
    notes: "Clinical Protocol Certified Translation.",
    items: [
      { service: "Certified Clinical Protocol Translation (EN -> ES)", language: "English -> Spanish", quantity: 15000, unit: "word", rate: 4.00, amount: 60000.00 }
    ]
  }
];

// Write json files
fs.writeFileSync(path.join(exportDir, 'users.json'), JSON.stringify(users, null, 2));
fs.writeFileSync(path.join(exportDir, 'clients.json'), JSON.stringify(clients, null, 2));
fs.writeFileSync(path.join(exportDir, 'vendors.json'), JSON.stringify(vendors, null, 2));
fs.writeFileSync(path.join(exportDir, 'projects.json'), JSON.stringify(projects, null, 2));
fs.writeFileSync(path.join(exportDir, 'invoices.json'), JSON.stringify(invoices, null, 2));

console.log('MongoDB JSON collections created in:', exportDir);
