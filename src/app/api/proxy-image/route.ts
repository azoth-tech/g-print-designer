
import { NextResponse } from 'next/server';

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

        if (!accountId || !apiToken) {
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
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const dataUrl = `data:image/png;base64,${base64Image}`;

        return NextResponse.json({ image: dataUrl });

    } catch (error) {
        console.error('Error in proxy-image route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
