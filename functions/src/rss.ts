import axios from 'axios';
import cheerio from 'cheerio';
import { parseString } from 'xml2js';
import fetch from 'node-fetch';

const https = require('https');

export interface Article {
    title: string;
    topicId: string;
    link: string;
    content: string;
    pubDate: string;
    summary: string;
}

export interface RssObject {
    title: string;
    link: string;
    pubDate: string;
}

export interface RssChannel {
    item: Article[];
}

export interface RssRootObject {
    rss: {
        channel: RssChannel[];
    };
}

export interface Topic {
    feeds: string[],
    subscribers: number
}

// Function to fetch and parse XML to JSON
export async function fetchAndParseRssFeed(url: string): Promise<RssObject[]> {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const response = await fetch(url, {
      method: 'GET',
      agent: httpsAgent,
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed from ${url}`);
    }

    const xml = await response.text();

    return new Promise(async (resolve, reject) => {
        parseString(xml, async (error: any, result: RssRootObject) => {
            if (error) {
                reject(error);
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (result) {
                    const items = result.rss.channel[0].item;
                    let jsonItems: RssObject[] = [];

                    for (const item of items) {
                        const itemDate = new Date(item.pubDate[0]);

                        if (itemDate >= today) {
                            jsonItems.push({
                                title: item.title[0],
                                link: item.link[0],
                                pubDate: item.pubDate[0],
                            });
                        }
                    }

                    resolve(jsonItems);
                }
            }
        });
    });
}

export async function parseHTMLFromURL(url: string): Promise<string[]> {
    try {
        // Fetch the content from the given URL
        const response = await axios.get(url);

        // Use cheerio to parse the HTML content
        const $ = cheerio.load(response.data);

        // Query for all <p> elements
        const paragraphs = $('p');

        // Extract text from each <p> element
        const content: string[] = [];

        paragraphs.each((_, p) => {
          content.push($(p).text());
        });

        return content;
    } catch (error) {
        return [];
    }
}