const pool = require("../config/db");

const initializeValidation = async ({
    datasetId,
    validation,
}) => {

    const enabled =
        validation?.enabled === true;

    const result = await pool.query(
        `
        INSERT INTO validation_configs (
            dataset_id,
            enabled,
            required_validators,
            approval_percentage
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
            datasetId,
            enabled,
            validation?.contributors ?? 1,
            validation?.approvalPercentage ?? 67,
        ]
    );

    return result.rows[0];
};

module.exports = {
    initializeValidation,
};