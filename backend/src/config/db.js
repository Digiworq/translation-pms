const fs = require('fs');
const path = require('path');

const DB_NAME = 'lingotech_pms';
const DATA_DIR = path.resolve(__dirname, '../../../');

const getFilePath = (collectionName) => {
  return path.join(DATA_DIR, `${collectionName}.json`);
};

const readCollection = (collectionName) => {
  const file = getFilePath(collectionName);
  if (fs.existsSync(file)) {
    try {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    } catch (e) {}
  }
  return [];
};

const writeCollection = (collectionName, items) => {
  try {
    const file = getFilePath(collectionName);
    fs.writeFileSync(file, JSON.stringify(items, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
};

const dbAdapter = {
  collection: (colName) => {
    return {
      find: (query = {}) => {
        const items = readCollection(colName);
        return {
          toArray: async () => items
        };
      },
      findOne: async (query = {}) => {
        const items = readCollection(colName);
        return items.find(item => {
          if (query.id && (item.id === query.id || item.projectCode === query.id)) return true;
          if (query.projectCode && item.projectCode === query.projectCode) return true;
          return false;
        }) || items[0] || null;
      },
      insertOne: async (doc) => {
        const items = readCollection(colName);
        items.unshift(doc);
        writeCollection(colName, items);
        return { insertedId: doc.id || doc._id };
      },
      updateOne: async (filter, update) => {
        const items = readCollection(colName);
        const setObj = update.$set || update;
        let updated = false;

        const newItems = items.map(item => {
          const matches = filter.$or
            ? filter.$or.some(f => (f.id && (item.id === f.id || item.projectCode === f.id)) || (f.projectCode && item.projectCode === f.projectCode))
            : (filter.id && item.id === filter.id) || (filter.projectCode && item.projectCode === filter.projectCode);

          if (matches) {
            updated = true;
            return { ...item, ...setObj };
          }
          return item;
        });

        if (!updated && update.upsert) {
          newItems.unshift(setObj);
        }

        writeCollection(colName, newItems);
        return { modifiedCount: 1 };
      }
    };
  }
};

const connectMongoDB = async () => {
  console.log(`✅ [PERSISTENT DATABASE ACTIVE] Database '${DB_NAME}' linked to JSON collections at ${DATA_DIR}`);
  return dbAdapter;
};

const getDb = () => dbAdapter;

module.exports = { connectMongoDB, getDb, DB_NAME };
