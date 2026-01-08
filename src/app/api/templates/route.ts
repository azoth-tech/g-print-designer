import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');

    if (!folder) {
        return NextResponse.json({ error: 'Folder parameter is required' }, { status: 400 });
    }

    // Prevent directory traversal
    const safeFolder = folder.replace(/[^a-zA-Z0-9-_]/g, '');
    const templatesDir = path.join(process.cwd(), 'public', 'templates', safeFolder);

    try {
        if (!fs.existsSync(templatesDir)) {
            return NextResponse.json({ templates: [] });
        }

        const files = fs.readdirSync(templatesDir);
        const templates = files
            .filter((file) => file.toLowerCase().endsWith('.json'))
            .map((file) => ({
                name: file.replace('.json', ''),
                url: `/templates/${safeFolder}/${file}`,
            }));

        return NextResponse.json({ templates });
    } catch (error) {
        console.error('Error listing templates:', error);
        return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 });
    }
}
