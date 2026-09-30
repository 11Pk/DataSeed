const { connectMongo } = require("../config/mongo");

const createMongoCollection = async (
    dataset
) => {
    const db = await connectMongo();

    const collectionName =
        `dataset_${dataset.id.replace(/-/g, "_")}`;

    const collections =
        await db
            .listCollections({
                name: collectionName,
            })
            .toArray();

    if (collections.length === 0) {
        await db.createCollection(
            collectionName
        );
    }

    return collectionName;
};

module.exports = {
    createMongoCollection,
};