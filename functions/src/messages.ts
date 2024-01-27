import { Article } from './rss';

const maxHeaderTextLength = 150;
const maxSimpleSectionTextLength = 3000;
const maxDoubleSectionTextLength = 2000;

export interface Text {
    type: string,
    text: string
}

export interface Block {
    type: string,
    text?: Text,
    fields?: Text[],
    block_id?: string
}

export interface SimpleSection {
    type: string,
    text: Text,
}

export interface DoubleSection {
    type: string,
    fields: Text[],
}

export interface Divider {
    type: string,
    block_id: string
}

function sanitizeText(text: string, maxLength: number): string {
    if (!text) return text;

    const dots = "...";
    const dotsLength = dots.length;

    return text.length > maxLength ? `${text.slice(0, maxLength - dotsLength)}${dots}` : text;
}

function formatTitle(text: string): SimpleSection {
    return {
        'type': 'header',
        'text': {
            'type': 'plain_text',
            'text': sanitizeText(text, maxHeaderTextLength)
        }
    };
}

function formatSimpleSection(text: string): SimpleSection {
    return {
        type: 'section',
        text: {
            'type': 'mrkdwn',
            'text': sanitizeText(text, maxSimpleSectionTextLength)
        }
    };
}

function formatDoubleSection(firstText: string, secondText: string): DoubleSection {
    return {
        type: 'section',
        fields: [
            {
                type: 'mrkdwn',
                text: sanitizeText(firstText, maxDoubleSectionTextLength)
            },
            {
                type: 'mrkdwn',
                text: sanitizeText(secondText, maxDoubleSectionTextLength)
            }
        ]
    };
}

function formatDivider(id: number): Divider {
    return {
        type: 'divider',
        block_id: `divider${id}`
    }
}

function getTitle(articleTitle: string): string {
    return `:rolled_up_newspaper: ${articleTitle}`;
}

async function getSummary(articleContent: string): Promise<string> {
    return `:newspaper: *Summary*\n${articleContent.slice(0, 150)}...`;
}

async function getTopic(topicId: string): Promise<string> {
    return `:tropical_drink: *Topic*\n${topicId}`;
}

async function getSentiment(summary: string): Promise<string> {
    return ":cocktail: *Sentiment*\nGood news :relieved:";
}

function getLink(articleLink: string): string {
    return `:link: *<${articleLink}|Full article (${articleLink.split('https://')[1].split('/')[0]})>*`;
}

export async function formatMessage(article: Article, language: string): Promise<Block[]> {
    const blocks: Block[] = []

    const title = getTitle(article.title);
    const topic = await getTopic(article.topicId);
    const summary = await getSummary(article.content);
    const sentiment = await getSentiment(summary);
    const link = getLink(article.link);

    const titleBlock: SimpleSection = formatTitle(title);
    const metadataBlock: DoubleSection = formatDoubleSection(topic, sentiment);
    const summaryBlock: SimpleSection = formatSimpleSection(summary);
    const firstDividerBlock: Divider = formatDivider(0);
    const linkBlock: SimpleSection = formatSimpleSection(link);
    const secondDividerBlock: Divider = formatDivider(1);

    blocks.push(titleBlock);
    blocks.push(metadataBlock);
    blocks.push(firstDividerBlock);
    blocks.push(summaryBlock);
    blocks.push(secondDividerBlock);
    blocks.push(linkBlock);

    return blocks;
}
