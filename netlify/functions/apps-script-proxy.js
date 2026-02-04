exports.handler = async function(event, context) {
    // CORS 헤더 설정
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // POST 요청만 허용
    if (event.httpMethod !== 'POST') {
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
                    success: false,
                    error: 'Google Apps Script URL is not configured in Netlify environment variables.' 
                })
            };
        }

        // 요청 본문 파싱
        const requestBody = JSON.parse(event.body || '{}');

        // Google Apps Script에 요청 전달
        const response = await fetch(appsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: `Google Apps Script error: ${errorText}`
                })
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: 'Internal Server Error', 
                details: error.message 
            })
        };
    }
};
