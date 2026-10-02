const pool = require("../config/db");
const { connectMongo } = require("../config/mongo");

const collectionNameForDataset = (datasetId) => `dataset_${datasetId}`;

const createMongoCollection = async (dataset) => {
    const db = await connectMongo();
    const collectionName = collectionNameForDataset(dataset.id);

    const collections = await db
        .listCollections({ name: collectionName })
        .toArray();

    if (collections.length === 0) {
        await db.createCollection(collectionName);
    }

    await db.collection(collectionName).createIndex(
        { submission_id: 1 },
        { unique: true }
    );

    return collectionName;
};

const pushApprovedSubmissionToMongo = async (submission) => {
    if (!submission || submission.status !== "approved") {
        return null;
    }

    if (submission.pushed_to_mongodb_at) {
        return collectionNameForDataset(submission.dataset_id);
    }

    const db = await connectMongo();
    const collectionName = collectionNameForDataset(submission.dataset_id);
    const collection = db.collection(collectionName);
    const row =
        typeof submission.data === "string"
            ? JSON.parse(submission.data)
            : submission.data;

    try {
        await collection.insertOne({
            submission_id: submission.id,
            source: submission.source,
            data: row,
            created_at: new Date(),
        });
    } catch (error) {
        if (error.code !== 11000) {
            throw error;
        }
    }

    await pool.query(
        `
        UPDATE submissions
        SET pushed_to_mongodb_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND pushed_to_mongodb_at IS NULL
        `,
        [submission.id]
    );

    return collectionName;
};

const getApprovedRows = async (datasetId) => {
    const db = await connectMongo();
    const collection = db.collection(collectionNameForDataset(datasetId));
    return collection.find({}).sort({ created_at: 1 }).toArray();
};

module.exports = {
    collectionNameForDataset,
    createMongoCollection,
    pushApprovedSubmissionToMongo,
    getApprovedRows,
};
