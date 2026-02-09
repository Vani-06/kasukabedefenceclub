
const https = require('https');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error('API Error:', json.error);
            } else if (json.models) {
                console.log('Available Models:');
                json.models.forEach(m => console.log(`- ${m.name.replace('models/', '')}`));
            } else {
                console.log('No models found or unexpected format:', data.substring(0, 200));
            }
        } catch (e) {
            console.error('Parse Error:', e);
            console.log('Raw Data:', data.substring(0, 200));
        }
    });
}).on('error', (e) => {
    console.error('Request Error:', e);
});
