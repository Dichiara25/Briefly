import type { NextRequest, NextResponse } from 'next/server';

const headers = {
    'Content-Type': 'application/json',
};

export async function POST(
    req: NextRequest,
){
    const searchParams = req.nextUrl.searchParams;
    const channel = searchParams.get('channel')

    if (!channel){
        return new Response(JSON.stringify({ error: 'Please provide a valid Slack channel name' }), {
            headers: headers,
            status: 400
        })
    }

    return new Response(JSON.stringify({ message: channel }), {
        headers: headers,
        status: 200, // HTTP OK
    });
}