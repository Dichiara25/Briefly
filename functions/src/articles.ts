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

    console.log("Fetching stored articles title...");

    const storedArticlesTitles: string[] = await fetchStoredArticlesTitles();

    const topicPromises = topics.map(async (topic: Topic) => {
      const topicId = topic.id as string;

      const feedPromises = topic.feeds.map(async (feed) => {
        console.log("Fetching and parsing RSS feed...");

        const rssObjects: RssObject[] = await fetchAndParseRssFeed(feed);

        for (const rssObject of rssObjects) {
          console.log("Checking if article is already stored...");

          const alreadyStored: boolean = await isDuplicate(storedArticlesTitles, rssObject.title);

          if (!alreadyStored) {
              console.log("Parsing HTML from article link...");

              const content = await parseHTMLFromURL(rssObject.link);

              console.log("Article content: ", content);

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

export async function fetchTopics(): Promise<Topic[]> {
    const topics: Topic[] = [];
    const topicsCollection = db.collection("topics");
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