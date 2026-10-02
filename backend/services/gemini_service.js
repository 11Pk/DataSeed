const { GoogleGenAI } = require("@google/genai");

const generateAIRows = async ({ prompt, columns, rowCount }) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });

    const schema = columns.map((column) => ({
        name: column.name,
        type: column.type,
        role: column.role,
        categories: column.categories,
    }));

    const finalPrompt = `
You are generating structured machine learning dataset rows.

Dataset schema:
${JSON.stringify(schema, null, 2)}

Creator instructions:
${prompt}

Generate exactly ${rowCount} rows.
Return ONLY valid JSON in this format:
{"rows":[{"column_name":"value"}]}
Do not include markdown or explanations.
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: finalPrompt,
    });

    const text = String(response.text || "")
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (error) {
        throw new Error("Gemini returned invalid JSON");
    }

    if (!parsed.rows || !Array.isArray(parsed.rows)) {
        throw new Error("Invalid Gemini response format");
    }

    return parsed.rows;
};

module.exports = {
    generateAIRows,
};
