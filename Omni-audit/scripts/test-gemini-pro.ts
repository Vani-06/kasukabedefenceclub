
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function testGeminiPro() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    try {
        console.log("Testing gemini-pro...");
        const result = await model.generateContent("Hello");
        console.log("SUCCESS: gemini-pro works!");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("FAILED: gemini-pro failed");
        console.error(error);
    }
}

testGeminiPro();
