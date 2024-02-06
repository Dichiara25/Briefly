import { db } from '@/app/firebase/config';
import type { NextRequest } from 'next/server';

const headers = {
    'Content-Type': 'application/json',
};

interface SlashCommandData {
    token: string,
    command: string,
    text: string,
    response_url: string,
    trigger_id: string,
    user_id: string,
    user_name: string,
    team_id: string,
    entreprise_id: string,
    channel_id: string,
    api_app_id: string
}

export async function POST(
    req: NextRequest,
){
    const data = await req.formData();
    const team = data.get('team_id') as string;
    const language = data.get('text') as string;

    console.log(team, language);

    if (!language || !team){
        return new Response(JSON.stringify({ error: 'Invalid request.' }), {
            headers: headers,
            status: 400
        })
    }

    await db
        .collection('acceptedWorkspaces')
        .doc(team)
        .collection('settings')
        .doc('language')
        .set({'value': language}, {merge: true});

    return new Response(JSON.stringify({ message: language }), {
        headers: headers,
        status: 200, // HTTP OK
    });
}