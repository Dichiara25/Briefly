import { Timestamp } from "firebase-admin/firestore";
import { Article } from './rss';
import { getTopicName } from './firestore';

export interface SlackChannel {
    id: string,
    name: string,
    workspaceId: string,
    language: string,
    live: boolean,
    keywords: string[],
    lastDelivery: Timestamp,
}

export interface Text {
    type: string,
    text: string
}

export interface Message {
    type: string,
    text?: Text,
    fields?: Text[],
    block_id?: string
}

export interface Section {
    type: string,
    text?: Text,
    fields?: Text[],
}

export interface Divider {
    type: string,
    block_id: string
}

function getTitle(articleTitle: string): string {
    return `:rolled_up_newspaper: ${articleTitle}`
}

async function getSummary(articleContent: string): Promise<string> {
    return `:newspaper: *Summary*\n${articleContent}...`
}

async function getTopic(topicId: string): Promise<string> {
    const topicName = await getTopicName(topicId);
    return `:tropical_drink: *Topic*\n${topicName !== undefined ? topicName : topicId}`;
}

async function getSentiment(summary: string): Promise<string> {
    return ":bubble_tea: *Sentiment*\nGood news :relieved:"
}

function getLink(articleLink: string): string {
    return `:link: *Link*\n<${articleLink}|Full article (${articleLink.split('https://')[1].split('/')[0]})>`
}

export async function formatMessage(article: Article, language: string): Promise<Message[]> {
    const blocks: Message[] = []
    const maxTitleLength = 150;
    const maxSummaryLength = 300;
    const maxSentimentLength = 50;

    const title = getTitle(article.title);
    const topic = await getTopic(article.topicId);
    const summary = await getSummary(article.content);
    const sentiment = await getSentiment(summary);
    const link = getLink(article.link);

    const titleBlock: Section = {
        'type': 'header',
        'text': {
            'type': 'plain_text',
            'text': `${title.slice(0, maxTitleLength)}${title.length > maxTitleLength ? "..." : ""}`,
        }
    }

    const metadataBlock: Section = {
        type: 'section',
        fields: [
            {
                type: 'mrkdwn',
                text: topic
            },
            {
                type: 'mrkdwn',
                text: `${sentiment.slice(0, maxSentimentLength)}${sentiment.length > maxSentimentLength ? "..." : ""}`
            }
        ]
    }

    const summaryBlock: Section = {
        type: 'section',
        text: {
            'type': 'mrkdwn',
            'text': `${summary.slice(0, maxSummaryLength)}${summary.length > maxSummaryLength ? "..." : ""}`
        }
    }

    const firstDividerBlock: Divider = {
        type: 'divider',
        block_id: 'divider0'
    }

    const linkBlock: Section = {
        type: 'section',
        text: {
            'type': 'mrkdwn',
            'text': link
        }
    }

    const secondDividerBlock: Divider = {
        type: 'divider',
        block_id: 'divider1'
    }

    blocks.push(titleBlock);
    blocks.push(metadataBlock);
    blocks.push(firstDividerBlock);
    blocks.push(summaryBlock);
    blocks.push(secondDividerBlock);
    blocks.push(linkBlock);

    return blocks;
}
