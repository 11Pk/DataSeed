const pool = require("../config/db");

const createSubmission = async ({
    taskId = null,
    userId = null,
    datasetId,
    data,
    source,
    status = "pending",
}) => {

    const result = await pool.query(
        `
        INSERT INTO submissions (
            task_id,
            user_id,
            dataset_id,
            data,
            source,
            status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
            taskId,
            userId,
            datasetId,
            JSON.stringify(data),
            source,
            status,
        ]
    );

    return result.rows[0];
};

module.exports = {
    createSubmission,
};