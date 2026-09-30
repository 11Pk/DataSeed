const pool = require("../config/db");

const createDatasetRecord = async (
    userId,
    dataset
) => {
    const result = await pool.query(
        `
        INSERT INTO datasets (
            user_id,
            name,
            description,
            domain,
            purpose,
            target_count,
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

module.exports = {
    createDatasetRecord,
};