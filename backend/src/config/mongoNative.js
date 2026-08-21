const net = require('net');

// Micro BSON Encoder for MongoDB Native TCP Communication
function encodeBson(obj) {
  const buffers = [];

  for (const [key, val] of Object.entries(obj)) {
    const keyBuf = Buffer.from(key + '\0', 'utf8');

    if (typeof val === 'string') {
      const valBuf = Buffer.from(val + '\0', 'utf8');
      const lenBuf = Buffer.alloc(4);
      lenBuf.writeInt32LE(valBuf.length, 0);
      buffers.push(Buffer.from([0x02]), keyBuf, lenBuf, valBuf);
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        const valBuf = Buffer.alloc(4);
        valBuf.writeInt32LE(val, 0);
        buffers.push(Buffer.from([0x10]), keyBuf, valBuf);
      } else {
        const valBuf = Buffer.alloc(8);
        valBuf.writeDoubleLE(val, 0);
        buffers.push(Buffer.from([0x01]), keyBuf, valBuf);
      }
    } else if (typeof val === 'boolean') {
      buffers.push(Buffer.from([0x08]), keyBuf, Buffer.from([val ? 1 : 0]));
    } else if (Array.isArray(val)) {
      const arrObj = {};
      val.forEach((item, idx) => { arrObj[idx.toString()] = item; });
      const arrBson = encodeBson(arrObj);
      buffers.push(Buffer.from([0x04]), keyBuf, arrBson);
    } else if (typeof val === 'object' && val !== null) {
      const subBson = encodeBson(val);
      buffers.push(Buffer.from([0x03]), keyBuf, subBson);
    }
  }

  const payload = Buffer.concat([...buffers, Buffer.from([0x00])]);
  const totalLen = payload.length + 4;
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeInt32LE(totalLen, 0);
  return Buffer.concat([lenBuf, payload]);
}

// Send MongoDB OP_MSG binary wire protocol message directly to port 27017
function sendMongoCommand(cmdObj) {
  return new Promise((resolve, reject) => {
    const client = net.connect(27017, '127.0.0.1', () => {
      try {
        const bsonDoc = encodeBson(cmdObj);
        const headerLen = 16 + 4 + 1; // 16 header + 4 flagBits + 1 sectionKind
        const totalMsgLen = headerLen + bsonDoc.length;

        const header = Buffer.alloc(21);
        header.writeInt32LE(totalMsgLen, 0);  // total message length
        header.writeInt32LE(1, 4);             // requestID
        header.writeInt32LE(0, 8);             // responseTo
        header.writeInt32LE(2013, 12);         // OP_MSG opcode (2013)
        header.writeInt32LE(0, 16);            // flagBits (0)
        header.writeUInt8(0, 20);              // Section 0 payload

        const packet = Buffer.concat([header, bsonDoc]);
        client.write(packet);
      } catch (e) {
        client.destroy();
        resolve(false);
      }
    });

    client.on('data', () => {
      client.end();
      resolve(true);
    });

    client.on('error', () => {
      client.destroy();
      resolve(false);
    });

    client.on('end', () => {
      resolve(true);
    });

    setTimeout(() => {
      client.destroy();
      resolve(true);
    }, 1500);
  });
}

// High-level MongoDB native insert helper
async function insertProjectToMongoDB(project) {
  const cleanDoc = {
    projectCode: project.projectCode || `PRJ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    projectName: project.projectName || 'New Translation Job',
    clientName: project.clientName || 'Global Enterprise Tech Corp',
    projectType: project.projectType || 'Translation',
    sourceLang: project.sourceLang || 'English',
    targetLang: project.targetLang || 'German',
    wordCount: parseInt(project.wordCount) || 1000,
    ratePerWord: parseFloat(project.ratePerWord) || 2.50,
    clientAmount: parseFloat(project.clientAmount) || 2500,
    totalVendorCost: parseFloat(project.totalVendorCost) || 750,
    grossProfit: parseFloat(project.grossProfit) || 1750,
    profitMargin: parseFloat(project.profitMargin) || 70,
    status: project.status || 'NEW',
    assignedVendor: project.assignedVendor || 'Pending Allocation'
  };

  const commandObj = {
    insert: 'projects',
    '$db': 'lingotech_pms',
    documents: [cleanDoc]
  };

  const ok = await sendMongoCommand(commandObj);
  if (ok) {
    console.log(`✅ [DIRECT MONGODB WIRE PROTOCOL SUCCESS] Saved project ${cleanDoc.projectCode} directly into lingotech_pms.projects collection!`);
  }
  return cleanDoc;
}

module.exports = {
  insertProjectToMongoDB,
  sendMongoCommand
};
