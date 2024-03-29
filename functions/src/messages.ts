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

function getTitle(articleTitle: string, language: string): string {
    return `:rolled_up_newspaper: ${articleTitle}`;
}

async function getSummary(articleContent: string, language: string): Promise<string> {
    return `:newspaper: *Summary*\n${articleContent.slice(0, 150)}...`;
}

async function getTopic(topicId: string, language: string): Promise<string> {
    return `:tropical_drink: *Topic*\n${topicId}`;
}

async function getSentiment(summary: string, language: string): Promise<string> {
    return ":cocktail: *Sentiment*\nGood news :relieved:";
}

function getLink(articleLink: string, language: string): string {
    return `:link: *<${articleLink}|Full article (${articleLink.split('https://')[1].split('/')[0]})>*`;
}

function getKeywords(keywords: string[], language: string): string {
    return `:loudspeaker: <!here> *The following keywords are mentioned*\n${keywords.join(', ')}`
}

export async function formatArticleMessage(article: Article, language: string, keywords: string[]): Promise<Block[]> {
    const blocks: Block[] = []
    const matchingWords: string[] = []

    if (keywords.length > 0) {
        keywords.forEach((keyword: string) => {
            if (article.title.includes(keyword)) {
                matchingWords.push(keyword);
            }
        })
    }

    const title = getTitle(article.title, language);
    const topic = await getTopic(article.topicId, language);
    const formattedKeywords = getKeywords(matchingWords, language);
    const summary = await getSummary(article.content, language);
    const sentiment = await getSentiment(summary, language);
    const link = getLink(article.link, language);

    const titleBlock: SimpleSection = formatTitle(title);
    const metadataBlock: DoubleSection = formatDoubleSection(topic, sentiment);
    const firstDividerBlock: Divider = formatDivider(0);
    const matchingWordsBlock: SimpleSection = formatSimpleSection(formattedKeywords);
    const secondDividerBlock: Divider = formatDivider(1);
    const summaryBlock: SimpleSection = formatSimpleSection(summary);
    const thirdDividerBlock: Divider = formatDivider(2);
    const linkBlock: SimpleSection = formatSimpleSection(link);

    blocks.push(titleBlock);
    blocks.push(metadataBlock);
    blocks.push(firstDividerBlock);

    if (matchingWords.length > 0) {
        blocks.push(matchingWordsBlock);
        blocks.push(secondDividerBlock);
    }

    blocks.push(summaryBlock);
    blocks.push(thirdDividerBlock);
    blocks.push(linkBlock);

    return blocks;
}

export function formatSettingMessage(title: string, content: string, hint: string): Block[] {
    const blocks: Block[] = []

    const titleBlock: SimpleSection = formatTitle(title);
    const firstDividerBlock: Divider = formatDivider(0);
    const contentBlock: SimpleSection = formatSimpleSection(content);
    const secondDividerBlock: Divider = formatDivider(1);
    const hintBlock: SimpleSection = formatSimpleSection(hint);

    blocks.push(titleBlock);
    blocks.push(firstDividerBlock);
    blocks.push(contentBlock);
    blocks.push(secondDividerBlock);
    blocks.push(hintBlock);

    return blocks;
}