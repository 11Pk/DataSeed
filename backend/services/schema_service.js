const pool = require("../config/db");

const createDatasetSchema = async (
    datasetId,
    columns
) => {
    const createdColumns = [];

    for (const column of columns) {
        const result = await pool.query(
            `
            INSERT INTO dataset_columns (
                dataset_id,
                name,
                data_type,
                role,
                categories
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                datasetId,
                column.name,
                column.type,
                column.role,
                column.role === "label"
                    ? column.categories
                    : null,
            ]
        );

        createdColumns.push(result.rows[0]);
    }

    return createdColumns;
};

module.exports = {
    createDatasetSchema,
};