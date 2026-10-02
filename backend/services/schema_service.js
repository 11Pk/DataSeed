const pool = require("../config/db");

const formatCategories = (column) => {
    if (!column.categories) {
        return null;
    }

    if (Array.isArray(column.categories)) {
        return column.categories.join(",");
    }

    return String(column.categories);
};

const createDatasetSchema = async (datasetId, columns) => {
    const createdColumns = [];

    for (let index = 0; index < columns.length; index += 1) {
        const column = columns[index];
        const dataType = column.type || (column.role === "label" ? "category" : "text");
        const shouldStoreCategories =
            dataType === "category" || column.role === "label";

        const result = await pool.query(
            `
            INSERT INTO dataset_columns (
                dataset_id,
                name,
                data_type,
                role,
                required,
                column_order,
                categories
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [
                datasetId,
                column.name,
                dataType,
                column.role,
                true,
                index + 1,
                shouldStoreCategories ? formatCategories(column) : null,
            ]
        );

        createdColumns.push(result.rows[0]);
    }

    return createdColumns;
};

module.exports = {
    createDatasetSchema,
};
