// netlify/functions/openai-proxy.js
exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Get the OpenAI API key from Netlify environment variables
    const apiKey = process.env.OPENAI_API_KEY; 
    if (!apiKey) {
        return { statusCode: 500, body: "OpenAI API key not configured." };
    }

    try {
        // Parse the incoming request body from the frontend
        const requestBody = JSON.parse(event.body);

        // Make the request to the OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            // Pass the original request body (messages, model, etc.) to OpenAI
            body: JSON.stringify(requestBody) 
        });

        // Handle potential errors from OpenAI
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const errorMessage = errorBody.error?.message || response.statusText;
            console.error("OpenAI API Error:", errorMessage);
            return { 
                statusCode: response.status, 
                body: JSON.stringify({ error: `OpenAI API Error: ${errorMessage}` }) 
            };
        }

        // Return the successful response from OpenAI back to the frontend
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        };

    } catch (error) {
        console.error("Proxy function error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Internal Server Error in Proxy Function" }) 
        };
    }
};
