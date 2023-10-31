import { parseString } from 'xml2js';
import fetch from 'node-fetch';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import * as admin from 'firebase-admin';

const https = require('https');

const serviceAccount = {
  type: process.env.NEXT_PUBLIC_FIREBASE_TYPE,
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  private_key_id: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY_ID,
  private_key: (process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  client_email: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
  client_id: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_ID,
  auth_uri: process.env.NEXT_PUBLIC_FIREBASE_AUTH_URI,
  token_uri: process.env.NEXT_PUBLIC_FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.NEXT_PUBLIC_FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_X509_CERT_URL,
};

if (admin.apps.length === 0) {
  admin.initializeApp({
    // @ts-ignore
    credential: admin.credential.cert(serviceAccount)
  });
  }

const firestore = admin.firestore();

interface RssItem {
  title: string;
  link: string;
  description: string;
  content?: string | null;
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
  name: string,
  feeds: string[],
  subscribers: number
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');

  // Check if the Authorization header exists and matches the valid key
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    const topics: Topic[] = await fetchTopics();
    const articlesCollection = firestore.collection("articles");
    const articles = await fetchArticles(topics);

    articles.forEach((article) => articlesCollection.add(article));

    return Response.json({ status: 200, message: "🎉 Success" });
  } else {
    return Response.json({ status: 401, message: "🚫 Unauthorized" });
  }
}

async function fetchTopics(): Promise<Topic[]> {
  const topics: Topic[] = [];
  const topicsCollection = firestore.collection("topics");
  const topicsDocuments = await topicsCollection.get();

  if (!topicsDocuments.empty){
    topicsDocuments.forEach((topicDocument) => {
      if (topicDocument.exists) {
        const topicData = topicDocument.data() as Topic;
        const topicName: string = topicData.name;
        const topicFeeds: string[] = topicData.feeds;
        const subscribers: number = topicData.subscribers;

        const topic: Topic = {name: topicName, feeds: topicFeeds, subscribers: subscribers};
        topics.push(topic);
      }
    })
  }

  return topics;
}

async function fetchArticles(topics: Topic[]): Promise<RssItem[]> {
  const articles: RssItem[] = [];

  const topicPromises = topics.map(async (topic) => {
    const feedPromises = topic.feeds.map(async (feed) => {
      const feedArticles: RssItem[] = await fetchAndParseRssFeed(feed);
      feedArticles.forEach((article) => articles.push(article));
    });

    await Promise.all(feedPromises);
  });

  await Promise.all(topicPromises);

  return articles;
}

async function parseHTMLFromURL(url: string): Promise<string[]> {
  // Fetch the content from the given URL
  const response = await axios.get(url);

  // Use JSDOM to parse the HTML content
  const dom = new JSDOM(response.data);

  // Query for all <p> elements
  const paragraphs = dom.window.document.querySelectorAll('p');

  // Extract text from each <p> element
  const content: string[] = [];
  paragraphs.forEach(p => {
    content.push(p.textContent || "");
  });

  return content;
}

// Function to fetch and parse XML to JSON
async function fetchAndParseRssFeed(url: string): Promise<RssItem[]> {
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

              const items = result.rss.channel[0].item;
              let jsonItems: RssItem[] = [];

              for (const item of items) {
                const itemDate = new Date(item.pubDate![0]);
                if (itemDate >= today) {
                    const content = await parseHTMLFromURL(item.link[0]);

                    jsonItems.push({
                        title: item.title[0],
                        link: item.link[0],
                        description: item.description[0],
                        pubDate: item.pubDate ? item.pubDate[0] : undefined,
                        content: content.join(' ')
                    });
                }
              }

              resolve(jsonItems);
          }
      });
  });
}