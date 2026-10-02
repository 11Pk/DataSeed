const { MongoClient } = require("mongodb");

let client;
let db;

const connectMongo = async () => {
  if (db) {
    return db;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  client ??= new MongoClient(mongoUri);
  await client.connect();

  db = client.db(process.env.MONGO_DB_NAME);

  console.log("MongoDB connected");

  return db;
};

module.exports = {
  connectMongo,
};
