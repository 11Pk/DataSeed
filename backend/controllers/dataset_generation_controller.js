const { createTask } = require("../services/task_service");
const { assignTaskToUsers } = require("../services/assignment_service");
const { generateAIRows } = require("../services/gemini_service");
const { createSubmission } = require("../services/submission_service");

const buildHumanTaskDescription = (humanPrompts, columns) => {
    if (typeof humanPrompts === "string" && humanPrompts.trim()) {
        return humanPrompts;
    }

    if (humanPrompts && typeof humanPrompts === "object") {
        const lines = columns.map((column, index) => {
            const prompt =
                humanPrompts[column.id] ||
                humanPrompts[String(column.id)] ||
                humanPrompts[column.name] ||
                "";
            return `${column.name || `Column ${index + 1}`}: ${prompt}`.trim();
        });

        return lines.filter(Boolean).join("\n\n");
    }

    return "Generate one dataset row using the provided schema.";
};

const generateDatasetData = async ({
    datasetId,
    columns,
    generation,
    humanPrompts,
    creatorId,
}) => {
    const result = {
        humanTask: null,
        assignments: [],
        aiSubmissions: [],
    };

    if (Number(generation.humanRows) > 0) {
        const humanTask = await createTask({
            datasetId,
            taskType: "human_generation",
            title: "Generate Dataset Row",
            description: buildHumanTaskDescription(humanPrompts, columns),
            targetCount: Number(generation.humanRows),
        });

        const assignments = await assignTaskToUsers({
            taskId: humanTask.id,
            userCount: 25,
            excludeUserId: creatorId,
        });

        result.humanTask = humanTask;
        result.assignments = assignments;
    }

    if (Number(generation.aiRows) > 0) {
        const generatedRows = await generateAIRows({
            prompt: generation.aiPrompt,
            columns,
            rowCount: Number(generation.aiRows),
        });

        for (const row of generatedRows) {
            const submission = await createSubmission({
                taskId: null,
                userId: null,
                datasetId,
                data: row,
                source: "ai",
                status: "pending",
            });

            result.aiSubmissions.push(submission);
        }
    }

    return result;
};

module.exports = {
    generateDatasetData,
};
