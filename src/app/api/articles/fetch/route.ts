import { parseString } from 'xml2js';
import fetch from 'node-fetch';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { firestore } from '../../../../../lib/firebase';
import { Article, RssObject, RssRootObject, Topic } from '../../../../../utils/interfaces/articles';

const https = require('https');

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');

  // Check if the Authorization header exists and matches the valid key
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    const topics: Topic[] = await fetchTopics();
    const articlesCollection = firestore.collection("articles");
    const articles = await fetchArticles(topics);

    articles.forEach(async (article) => {
      articlesCollection.add(article);
      await sendData(`https://${process.env.NEXT_PUBLIC_APP_URL}/api/articles/publish`, article);
    });

    return Response.json({ status: 200, message: "🎉 Success" });
  } else {
    return Response.json({ status: 401, message: "🚫 Unauthorized" });
  }
}

async function sendData(url: string, data: object): Promise<void> {
  try {
    const response = await axios.post(url, data,  {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });
    console.log('Data sent successfully', response.data);
  } catch (error) {
    console.error('Error sending data', error);
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
  const storedArticlesTitles: string[] = await fetchStoredArticlesTitles();

  const topicPromises = topics.map(async (topic: Topic) => {
    const topicId = topic.id as string;

    const feedPromises = topic.feeds.map(async (feed) => {
      const rssObjects: RssObject[] = await fetchAndParseRssFeed(feed, topicId);

      for (const rssObject of rssObjects) {
        const alreadyStored: boolean = await isDuplicate(storedArticlesTitles, rssObject.title);

        if (!alreadyStored) {
            const content = await parseHTMLFromURL(rssObject.link);

            const article: Article = {
              title: rssObject.title,
              link: rssObject.link,
              pubDate: rssObject.pubDate,
              topicId: topicId,
              content: content.join(" ").replace('\n', ''),
              summary: ""
            }

            articles.push(article);
          }
        };
      });

    await Promise.all(feedPromises);
  });

  await Promise.all(topicPromises);

  return articles;
}

async function isDuplicate(storedArticlesTitles: string[], newArticleTitle: string) {
  return storedArticlesTitles.includes(newArticleTitle)
}

async function fetchStoredArticlesTitles(): Promise<string[]> {
  const storedArticlesTitles: string[] = [];
  const storedArticles = await firestore.collection("articles").get();

  if (!storedArticles.empty) {
    storedArticles.forEach((storedArticle) => {
      if (storedArticle.exists) {
        const storedArticleData = storedArticle.data() as Article;
        storedArticlesTitles.push(storedArticleData.title);
      }
    })
  }

  return storedArticlesTitles;
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
async function fetchAndParseRssFeed(url: string, topicId: string): Promise<RssObject[]> {
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
      });
  });
}