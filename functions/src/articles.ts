import { db } from './firestore';
import { Article, RssObject, Topic, fetchAndParseRssFeed, parseHTMLFromURL } from './rss';

async function isDuplicate(storedArticlesTitles: string[], newArticleTitle: string) {
    return storedArticlesTitles.includes(newArticleTitle)
}

async function fetchStoredArticlesTitles(): Promise<string[]> {
    const storedArticlesTitles: string[] = [];
    const storedArticles = await db.collection("articles").get();

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

export async function fetchArticles(topics: Topic[]): Promise<Article[]> {
    const articles: Article[] = [];
    const storedArticlesTitles: string[] = await fetchStoredArticlesTitles();

    const topicPromises = topics.map(async (topic: Topic) => {
      const topicId = topic.id as string;
      const deliveryCounter = topic.deliveryCounter as number;
      let articlesCounter = 0;

      const feedPromises = topic.feeds.map(async (feed) => {
        const rssObjects: RssObject[] = await fetchAndParseRssFeed(feed);

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

      articlesCounter += articles.length;

      await db
        .collection("topics")
        .doc(topicId)
        .set({"deliveryCounter": deliveryCounter + articlesCounter}, {merge: true});

      await Promise.all(feedPromises);
    });

    await Promise.all(topicPromises);

    return articles;
}

export async function fetchTopics(): Promise<Topic[]> {
    const topics: Topic[] = [];
    const topicsCollection = db.collection("topics");
    const topicsDocuments = await topicsCollection.get();

    if (!topicsDocuments.empty){
      topicsDocuments.forEach((topicDocument) => {
        if (topicDocument.exists) {
          const topicData = topicDocument.data() as Topic;
          const topicFeeds: string[] = topicData.feeds;
          const deliveryCounter: number = topicData.deliveryCounter;

          const topic: Topic = {
            id: topicDocument.id,
            feeds: topicFeeds,
            deliveryCounter: deliveryCounter
          };

          topics.push(topic);
        }
      })
    }

    return topics;
  }