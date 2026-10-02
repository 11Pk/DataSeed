const pool = require("../config/db");

const createDatasetRecord = async (userId, dataset) => {
    const result = await pool.query(
        `
        INSERT INTO datasets (
            creator_id,
            name,
            description,
            domain,
            purpose,
            target_rows,
            visibility,
            status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [
            userId,
            dataset.name,
            dataset.description,
            dataset.domain,
            dataset.purpose,
            dataset.target,
            dataset.visibility,
            "active",
        ]
    );

    return result.rows[0];
};

const getDatasetsByOwner = async (userId) => {
    const result = await pool.query(
        `
        SELECT
            d.*,
            (
                SELECT COUNT(*)::int
                FROM submissions s
                WHERE s.dataset_id = d.id
                  AND s.status = 'approved'
            ) AS approved_rows
        FROM datasets d
        WHERE d.creator_id = $1
        ORDER BY d.created_at DESC
        `,
        [userId]
    );

    return result.rows;
};

const getOwnedDataset = async (userId, datasetId) => {
    const result = await pool.query(
        `
        SELECT *
        FROM datasets
        WHERE id = $1
          AND creator_id = $2
        `,
        [datasetId, userId]
    );

    return result.rows[0] || null;
};

const getDatasetColumns = async (datasetId) => {
    const result = await pool.query(
        `
        SELECT *
        FROM dataset_columns
        WHERE dataset_id = $1
        ORDER BY column_order ASC
        `,
        [datasetId]
    );

    return result.rows;
};

module.exports = {
    createDatasetRecord,
    getDatasetsByOwner,
    getOwnedDataset,
    getDatasetColumns,
};
