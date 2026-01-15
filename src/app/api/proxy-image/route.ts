export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt } = body;

        if (!prompt) {
            return new Response(
                JSON.stringify({ error: 'Prompt is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const apiToken = process.env.CLOUDFLARE_API_TOKEN;

        console.log('API Request:', {
            hasAccountId: !!accountId,
            hasApiToken: !!apiToken,
            accountIdLength: accountId?.length
        });

        if (!accountId || !apiToken) {
            console.error('Missing Cloudflare credentials');
            return new Response(
                JSON.stringify({ error: 'Cloudflare credentials not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const model = '@cf/bytedance/stable-diffusion-xl-lightning';
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cloudflare AI Error:', response.status, errorText);

            // Try clean error parsing
            let errorMessage = `Cloudflare AI connection failed: ${response.status}`;
            try {
                const errJson = JSON.parse(errorText);
                if (errJson.errors && errJson.errors.length > 0) errorMessage = errJson.errors[0].message;
                else if (errJson.error) errorMessage = errJson.error;
            } catch (e) { errorMessage += ` - ${errorText}`; }

            return new Response(
                JSON.stringify({ error: errorMessage }),
                { status: response.status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Return the binary stream directly using standard Response
        return new Response(response.body, {
            headers: {
                'Content-Type': 'image/png',
            }
        });

    } catch (error: any) {
        console.error('Error in proxy-image route:', error);
        // Log the error message safely if possible
        const errorMessage = error instanceof Error ? error.message : String(error);

        return new Response(
            JSON.stringify({ error: `Internal server error: ${errorMessage}` }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
