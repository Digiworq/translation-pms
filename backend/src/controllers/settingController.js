const prisma = require('../config/prisma');

const getSettings = async (req, res, next) => {
  try {
    const settingsList = await prisma.systemSetting.findMany();
    const settingsMap = {};
    settingsList.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    // Provide default settings if empty
    const defaults = {
      companyName: 'LingoTech Translation & Localization Inc.',
      companyAddress: '100 Global Towers, Technology Park, Financial District',
      companyEmail: 'billing@lingotech.com',
      companyPhone: '+1 (800) 555-0199',
      defaultTaxPercent: '18',
      defaultCurrencySymbol: '₹',
      defaultCurrencyCode: 'INR',
      invoiceNotesTemplate: 'Payment due within 30 days of invoice date. Thank you for your business!'
    };

    return res.json({
      success: true,
      settings: { ...defaults, ...settingsMap }
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const settingsData = req.body;

    for (const [key, value] of Object.entries(settingsData)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    }

    return res.json({
      success: true,
      message: 'System settings updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
