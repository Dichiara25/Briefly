import { parseString } from 'xml2js';
import fetch from 'node-fetch';
import axios from 'axios';
import { JSDOM } from 'jsdom';

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


export async function GET() {
  const rssUrl = "https://feeds.feedburner.com/TheHackersNews?format=xml"

  const articles = await fetchAndParseRssFeed(rssUrl)
    .then(items => {
      return items;
    }).catch(error => {
        console.error("Error fetching and parsing RSS feed:", error);
        return [];
    });

  return Response.json({ rssFeed: articles });
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