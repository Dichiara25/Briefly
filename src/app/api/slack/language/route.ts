import { db } from '@/app/firebase/config';
import { supportedLanguages } from '@/app/install/languages';
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

    if (!language || !team){
        return new Response(JSON.stringify({ error: 'Invalid request.' }), {
            headers: headers,
            status: 400
        })
    }

    if (!supportedLanguages.includes(language)) {
        return new Response(JSON.stringify(`*${language}* does not belong to the supported languages :confused:`), {
            headers: headers,
            status: 200
        })
    }

    await db
        .collection('acceptedWorkspaces')
        .doc(team)
        .collection('settings')
        .doc('language')
        .set({'value': language}, {merge: true});

    return new Response(JSON.stringify(`From now on, news will be delivered in *${language}* in your Slack organization :blush:`), {
        headers: headers,
        status: 200,
    });
}