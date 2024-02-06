import { db } from '@/app/firebase/config';
import type { NextRequest } from 'next/server';

const headers = {
    'Content-Type': 'application/json',
};

export async function POST(
    req: NextRequest,
){
    const data = await req.json();
    const team = data.team;
    const language = data.language;

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
        .collection('metadata')
        .doc('language')
        .set({'language': language}, {merge: true});

    return new Response(JSON.stringify({ message: language }), {
        headers: headers,
        status: 200, // HTTP OK
    });
}