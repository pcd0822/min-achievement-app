exports.handler = async function(event, context) {
    // CORS 헤더 설정
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers
        };
    }

    // GET 요청만 허용
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        // Netlify 환경 변수에서 Google Apps Script URL 가져오기
        const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

        if (!appsScriptUrl) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Google Apps Script URL is not configured in Netlify environment variables.' 
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                url: appsScriptUrl 
            })
        };
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal Server Error', 
                details: error.message 
            })
        };
    }
};
