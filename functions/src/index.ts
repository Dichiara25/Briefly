import { parseString } from 'xml2js';
import fetch from 'node-fetch';
import * as admin from 'firebase-admin';
const {onSchedule} = require("firebase-functions/v2/scheduler");
// import axios from 'axios';
// import { JSDOM } from 'jsdom';

// The Firebase Admin SDK to interact with the Firestore database.
admin.initializeApp();

interface RssItem {
    title: string;
    content: string | null;
    link: string;
    description: string;
    pubDate?: string;
}

interface RssChannel {
    item: RssItem[];
}

interface RssRootObject {
    rss: {
        channel: RssChannel[];
    };
}

interface Topic {
    title: string,
    rssFeeds: string[]
}

const topics: Topic[] = [{
    title: 'Cyber Security',
    rssFeeds: [
        'https://feeds.feedburner.com/TheHackersNews?format=xml'
    ]
}]

exports.fetchArticles = onSchedule("0 11 * * *", async () => {
    const firestore = admin.firestore();

    topics.forEach(async (topic: Topic) => {
        const topicName: string = topic.title;
        const rssFeeds: string[] = topic.rssFeeds;
        const collection = firestore.collection("topics").doc(topicName).collection("articles");

        rssFeeds.forEach(async (rssFeed: string) => {
            const articles: RssItem[] = await fetchAndParseRssFeed(rssFeed)
                .then(items => {
                    return items;
                }).catch(error => {
                    console.error("Error fetching and parsing RSS feed:", error);
                    return [];
                });

            articles.forEach(async (article: RssItem) => {
                await collection.add(article);
            })
        });
    })
});

// async function parseHTMLFromURL(url: string): Promise<string[]> {
//     // Fetch the content from the given URL
//     const response = await axios.get(url);

//     // Use JSDOM to parse the HTML content
//     const dom = new JSDOM(response.data);

//     // Query for all <p> elements
//     const paragraphs = dom.window.document.querySelectorAll('p');

//     // Extract text from each <p> element
//     const content: string[] = [];
//     paragraphs.forEach(p => {
//       content.push(p.textContent || "");
//     });

//     return content;
//   }


// Function to fetch and parse XML to JSON
async function fetchAndParseRssFeed(url: string): Promise<RssItem[]> {
    const response = await fetch(url);
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

                const items = result.rss.channel[0].item;
                let jsonItems: RssItem[] = [];

                for (const item of items) {
                  const itemDate = new Date(item.pubDate![0]);
                  if (itemDate >= today) {
                        // console.log(`Scraping content from article "${item.title}"...`);
                        // const content = await parseHTMLFromURL(item.link[0]);
                        // console.log(`Scraped content: "${content}"...`);

                        jsonItems.push({
                            title: item.title[0],
                            link: item.link[0],
                            description: item.description[0],
                            pubDate: item.pubDate ? item.pubDate[0] : undefined,
                            // content: content.join(' ')
                            content: ""
                        });
                  }
                }

                resolve(jsonItems);
            }
        });
    });
}