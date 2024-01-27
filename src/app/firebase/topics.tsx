'use server'

import { db } from "./config";

export async function getAvailableTopics(): Promise<string[]> {
    const availableTopics: string[] = []
    const topicsCollection = await db.collection('topics').get();

    if (!topicsCollection.empty) {
        topicsCollection.forEach((topic) => {
            if (topic.exists) {
                const topicId: string = topic.id as string;

                availableTopics.push(topicId);
            }
        })
    }

    return availableTopics
}