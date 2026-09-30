const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);

let db;

const connectMongo = async () => {
    if (db) {
        return db;
    }

    await client.connect();

    db = client.db(
        process.env.MONGO_DB_NAME
    );

    console.log("MongoDB connected");

    return db;
};

module.exports = {
    connectMongo,
};