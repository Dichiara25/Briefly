import { parseString } from 'xml2js';
import fetch from 'node-fetch';

// The Cloud Functions for Firebase SDK to set up triggers and logging.
const {onSchedule} = require("firebase-functions/v2/scheduler");

// The Firebase Admin SDK to interact with the Firestore database.
const admin = require("firebase-admin");
admin.initializeApp();

interface RssItem {
    title: string;
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

exports.fetchArticles = onSchedule("0 11 * * *", async () => {
    const rssUrl = "https://feeds.feedburner.com/TheHackersNews?format=xml"

    const articles: RssItem[] = await fetchAndParseRssFeed(rssUrl)
    .then(items => {
        return items;
    }).catch(error => {
        console.error("Error fetching and parsing RSS feed:", error);
        return [];
    });

    articles.forEach((article: RssItem) => {
        admin.Firestore.set(article);
    })
});

// Function to fetch and parse XML to JSON
async function fetchAndParseRssFeed(url: string): Promise<RssItem[]> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed from ${url}`);
    }

    const xml = await response.text();

    return new Promise((resolve, reject) => {
        parseString(xml, (error: any, result: RssRootObject) => {
            if (error) {
                reject(error);
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);

                const items = result.rss.channel[0].item;
                let jsonItems: RssItem[] = [];

                if (items !== undefined) {
                  jsonItems = items
                    .filter(item => {
                      const pubDate = item.pubDate![0];
                      const itemDate = new Date(pubDate);
                      return itemDate >= yesterday;
                    })
                    .map(item => {
                      return {
                          title: item.title[0],
                          link: item.link[0],
                          description: item.description[0],
                          pubDate: item.pubDate ? item.pubDate[0] : undefined
                      };
                  });
                }

                resolve(jsonItems);
            }
        });
    });
  }