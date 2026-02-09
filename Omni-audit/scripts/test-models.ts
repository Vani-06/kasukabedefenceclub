
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const modelsToTry = [
        "gemini-1.5-flash-002",
        "gemini-1.5-pro-002",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash-8b",
        "gemini-1.5-flash",
        "gemini-pro"
    ];

    console.log("Testing specific models...");

    for (const modelName of modelsToTry) {
        process.stdout.write(`Testing ${modelName}: `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log("SUCCESS");
            // If success, we update the Mastra config to use this model
            console.log(`RECOMMENDATION: Use '${modelName}'`);
            return;
        } catch (error) {
            console.log("FAILED - " + error.message.split('\n')[0]);
        }
    }
}

listModels();
