const prisma = require('./config/prisma');

async function clean() {
  try {
    await prisma.project.deleteMany({
      where: {
        OR: [
          { projectName: 'karan' },
          { projectCode: 'PRJ-2026-3178' },
          { projectName: 'aditya' },
          { projectName: 'adi' }
        ]
      }
    });
    console.log('✅ Cleaned karan, aditya, adi from MySQL Project table!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
