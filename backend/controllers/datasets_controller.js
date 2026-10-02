const {
    getDatasetsByOwner,
    getOwnedDataset,
    getDatasetColumns,
} = require("../services/dataset_service");
const { getApprovedRows } = require("../services/mongo_service");

const toCsv = (rows) => {
    if (!rows.length) {
        return "";
    }

    const objects = rows.map((row) => row.data || {});
    const headers = Array.from(
        new Set(objects.flatMap((row) => Object.keys(row)))
    );

    const escapeCell = (value) => {
        const text = value == null ? "" : String(value);
        if (/[",\n]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    };

    const lines = [
        headers.join(","),
        ...objects.map((row) =>
            headers.map((header) => escapeCell(row[header])).join(",")
        ),
    ];

    return lines.join("\n");
};

const getMyDatasets = async (req, res) => {
    try {
        const datasets = await getDatasetsByOwner(req.user.userId);
        return res.status(200).json({ datasets });
    } catch (error) {
        console.error("Get datasets failed:", error);
        return res.status(500).json({
            message: "Failed to fetch datasets",
        });
    }
};

const getDataset = async (req, res) => {
    try {
        const dataset = await getOwnedDataset(
            req.user.userId,
            req.params.datasetId
        );

        if (!dataset) {
            return res.status(404).json({
                message: "Dataset not found",
            });
        }

        const [columns, rows] = await Promise.all([
            getDatasetColumns(dataset.id),
            getApprovedRows(dataset.id),
        ]);

        return res.status(200).json({
            dataset,
            columns,
            rows: rows.map((row) => ({
                id: row.submission_id,
                source: row.source,
                data: row.data,
                created_at: row.created_at,
            })),
        });
    } catch (error) {
        console.error("Get dataset failed:", error);
        return res.status(500).json({
            message: "Failed to fetch dataset",
        });
    }
};

const downloadDataset = async (req, res) => {
    try {
        const dataset = await getOwnedDataset(
            req.user.userId,
            req.params.datasetId
        );

        if (!dataset) {
            return res.status(404).json({
                message: "Dataset not found",
            });
        }

        const rows = await getApprovedRows(dataset.id);
        const csv = toCsv(rows);
        const filename = `${dataset.name.replace(/[^\w-]+/g, "_") || "dataset"}.csv`;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );
        return res.status(200).send(csv);
    } catch (error) {
        console.error("Download dataset failed:", error);
        return res.status(500).json({
            message: "Failed to download dataset",
        });
    }
};

module.exports = {
    getMyDatasets,
    getDataset,
    downloadDataset,
};
