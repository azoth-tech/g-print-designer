import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
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
            return NextResponse.json(
                { error: 'Cloudflare credentials not configured' },
                { status: 500 }
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
            return NextResponse.json(
                { error: `Cloudflare AI connection failed: ${response.status} - ${errorText}` },
                { status: response.status }
            );
        }

        // Cloudflare returns the raw image bytes
        const imageBuffer = await response.arrayBuffer();

        // Convert ArrayBuffer to Base64 without using Node.js Buffer
        let binary = '';
        const bytes = new Uint8Array(imageBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64Image = btoa(binary);

        const dataUrl = `data:image/png;base64,${base64Image}`;

        return NextResponse.json({ image: dataUrl });

    } catch (error: any) {
        console.error('Error in proxy-image route:', error);
        // Log the error message safely if possible
        const errorMessage = error instanceof Error ? error.message : String(error);

        return NextResponse.json(
            { error: `Internal server error: ${errorMessage}` },
            { status: 500 }
        );
    }
}
