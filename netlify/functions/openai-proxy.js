exports.handler = async function(event, context) {
    // CORS 헤더 설정 (필요한 경우)
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ error: "Method Not Allowed. Only POST requests are accepted." }) 
        };
    }

    // Get the OpenAI API key from Netlify environment variables
    const apiKey = process.env.OPENAI_API_KEY; 
    if (!apiKey) {
        console.error("OpenAI API key not configured in Netlify environment variables");
        return { 
            statusCode: 500, 
            headers,
            body: JSON.stringify({ error: "OpenAI API key not configured. Please set OPENAI_API_KEY in Netlify environment variables." }) 
        };
    }

    try {
        // Parse the incoming request body from the frontend
        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
        } catch (parseError) {
            console.error("Invalid JSON in request body:", parseError);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Invalid JSON in request body" })
            };
        }

        // Validate required fields
        if (!requestBody.model || !requestBody.messages) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Missing required fields: model and messages are required" })
            };
        }

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
            console.error("OpenAI API Error:", {
                status: response.status,
                statusText: response.statusText,
                error: errorBody
            });
            
            return { 
                statusCode: response.status, 
                headers,
                body: JSON.stringify({ 
                    error: {
                        message: errorMessage,
                        type: errorBody.error?.type || 'api_error',
                        code: errorBody.error?.code || response.status
                    }
                }) 
            };
        }

        // Return the successful response from OpenAI back to the frontend
        const data = await response.json();
        console.log("OpenAI API Success - Response structure:", {
            hasChoices: !!data.choices,
            choicesLength: data.choices?.length,
            hasMessage: !!data.choices?.[0]?.message,
            hasContent: !!data.choices?.[0]?.message?.content
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Proxy function error:", error);
        return { 
            statusCode: 500, 
            headers,
            body: JSON.stringify({ 
                error: {
                    message: error.message || "Internal Server Error in Proxy Function",
                    type: "proxy_error"
                }
            }) 
        };
    }
};
