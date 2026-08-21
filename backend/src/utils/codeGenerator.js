const prisma = require('../config/prisma');

// Find the highest existing number for a given prefix and return next available code.
// Collision-proof: if the generated code already exists, keeps incrementing.

const generateProjectCode = async () => {
  const year = new Date().getFullYear();
  const prefix = `PRJ-${year}-`;

  // Find the highest existing code number this year
  const existing = await prisma.project.findMany({
    where: { projectCode: { startsWith: prefix } },
    select: { projectCode: true }
  });

  let max = 0;
  existing.forEach(p => {
    const num = parseInt(p.projectCode.replace(prefix, ''), 10);
    if (!isNaN(num) && num > max) max = num;
  });

  // Keep trying until we find a code that doesn't exist yet
  let candidate;
  let next = max + 1;
  do {
    candidate = `${prefix}${String(next).padStart(4, '0')}`;
    const clash = await prisma.project.findUnique({ where: { projectCode: candidate } });
    if (!clash) break;
    next++;
  } while (true);

  return candidate;
};

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const existing = await prisma.invoice.findMany({
    where: { invoiceNumber: { startsWith: prefix } },
    select: { invoiceNumber: true }
  });

  let max = 0;
  existing.forEach(i => {
    const num = parseInt(i.invoiceNumber.replace(prefix, ''), 10);
    if (!isNaN(num) && num > max) max = num;
  });

  let candidate;
  let next = max + 1;
  do {
    candidate = `${prefix}${String(next).padStart(4, '0')}`;
    const clash = await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } });
    if (!clash) break;
    next++;
  } while (true);

  return candidate;
};

const generateClientCode = async () => {
  const existing = await prisma.client.findMany({
    select: { clientCode: true }
  });

  let max = 0;
  existing.forEach(c => {
    const num = parseInt(c.clientCode.replace('CLT-', ''), 10);
    if (!isNaN(num) && num > max) max = num;
  });

  let candidate;
  let next = max + 1;
  do {
    candidate = `CLT-${String(next).padStart(4, '0')}`;
    const clash = await prisma.client.findFirst({ where: { clientCode: candidate } });
    if (!clash) break;
    next++;
  } while (true);

  return candidate;
};

const generateVendorCode = async () => {
  const existing = await prisma.vendor.findMany({
    select: { vendorCode: true }
  });

  let max = 0;
  existing.forEach(v => {
    const num = parseInt(v.vendorCode.replace('VND-', ''), 10);
    if (!isNaN(num) && num > max) max = num;
  });

  let candidate;
  let next = max + 1;
  do {
    candidate = `VND-${String(next).padStart(4, '0')}`;
    const clash = await prisma.vendor.findFirst({ where: { vendorCode: candidate } });
    if (!clash) break;
    next++;
  } while (true);

  return candidate;
};

module.exports = {
  generateProjectCode,
  generateInvoiceNumber,
  generateClientCode,
  generateVendorCode
};
