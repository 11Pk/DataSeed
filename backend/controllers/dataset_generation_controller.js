const { createTask,} = require("../services/task.service");
const {assignTaskToUsers,} = require("../services/assignment.service");
const {  generateAIRows,} = require("../services/gemini.service");
const { createSubmission,} = require("../services/submission.service");

const generateDatasetData = async ({
    datasetId,
    columns,
    generation,
    humanPrompts,
}) => {

    const result = {
        humanTask: null,
        aiSubmissions: [],
    };


    // -----------------------------
    // HUMAN GENERATION
    // -----------------------------

    if (generation.humanRows > 0) {

        const humanTask =
            await createTask({
                datasetId,

                taskType:
                    "human_generation",

                title:
                    "Generate Dataset Row",

                description:
                    humanPrompts,

                targetCount:
                    generation.humanRows,
            });


        await assignTaskToUsers({
            taskId:
                humanTask.id,

            userCount:
                generation.humanRows,
        });


        result.humanTask =
            humanTask;
    }


    // -----------------------------
    // AI GENERATION
    // -----------------------------

    if (generation.aiRows > 0) {

        const generatedRows =
            await generateAIRows({
                prompt:
                    generation.aiPrompt,

                columns,

                rowCount:
                    generation.aiRows,
            });


        for (const row of generatedRows) {

            const submission =
                await createSubmission({
                    taskId: null,

                    userId: null,

                    datasetId,

                    data: row,

                    source: "ai",

                    status: "approved",
                });

            result.aiSubmissions.push(
                submission
            );
        }
    }


    return result;
};


module.exports = {
    generateDatasetData,
};