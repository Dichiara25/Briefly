import { parseString } from 'xml2js';
import fetch from 'node-fetch';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { firestore } from '../../../../../lib/firebase';
import { Article, RssRootObject, Topic } from '../../../../../utils/articles';

const https = require('https');

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
      const topicId = topicDocument.id;

      if (topicDocument.exists) {
        const topicData = topicDocument.data() as Topic;
        const topicName: string = topicData.name;
        const topicFeeds: string[] = topicData.feeds;
        const subscribers: number = topicData.subscribers;

        const topic: Topic = {
          id: topicId,
          name: topicName,
          feeds: topicFeeds,
          subscribers: subscribers
        };

        topics.push(topic);
      }
    })
  }

  return topics;
}

async function fetchArticles(topics: Topic[]): Promise<Article[]> {
  const articles: Article[] = [];

  const topicPromises = topics.map(async (topic: Topic) => {
    const topicId = topic.id as string;

    const feedPromises = topic.feeds.map(async (feed) => {
      const feedArticles: Article[] = await fetchAndParseRssFeed(feed, topicId);
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
async function fetchAndParseRssFeed(url: string, topicId: string): Promise<Article[]> {
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

              const items = result.rss.channel[0].article;
              let jsonItems: Article[] = [];

              for (const item of items) {
                const itemDate = new Date(item.pubDate![0]);
                if (itemDate >= today) {
                    const content = await parseHTMLFromURL(item.link[0]);

                    jsonItems.push({
                        title: item.title[0],
                        link: item.link[0],
                        topicId: topicId,
                        description: item.description[0],
                        pubDate: item.pubDate[0],
                        content: content.join(' ')
                    });
                }
              }

              resolve(jsonItems);
          }
      });
  });
}