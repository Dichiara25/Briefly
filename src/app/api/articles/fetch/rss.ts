
import { parseString } from 'xml2js';
import fetch from 'node-fetch';
import { RssObject, RssRootObject } from '../../../../../utils/interfaces/articles';

const https = require('https');

// Function to fetch and parse XML to JSON
export async function fetchAndParseRssFeed(url: string, topicId: string): Promise<RssObject[]> {
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