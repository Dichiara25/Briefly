const { onSchedule } = require("firebase-functions/v2/scheduler");
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Article, Topic } from './rss';
import { fetchArticles, fetchTopics } from './articles';
import { db } from './firestore';
import { SlackChannel, formatMessage, getWorkspaceLanguage, sendMessageToSlackChannel } from "./slack";
import { daysBetweenDates } from "./dates";

exports.fetchNewArticles = onSchedule("31 9 * * *", async () => {
    const topics: Topic[] = await fetchTopics();
    const storedArticlesCollection = db.collection("articles");
    const newArticles = await fetchArticles(topics);

    newArticles.forEach(async (article: Article) => {
        storedArticlesCollection.add(article);
    });
});

exports.deleteOldArticles = onSchedule("0 0 * * *", async () => {
    const articles = await db.collection("articles").get();
    const today = new Date();

    articles.forEach((article) => {
        if (article.exists) {
            const data = article.data() as Article;
            const pubDate: Date = new Date(data.pubDate);
            const daysDifference: number = daysBetweenDates(today, pubDate);

            if (daysDifference > 7) {
                const articleReference = article.ref;
                articleReference.delete();
            }
        }
    })
});

exports.publishNewArticles = onDocumentCreated("articles/{docId}", async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }

    const article = snapshot.data() as Article;
    const channels = await db.collection("channels").get();

    if (!channels.empty) {
        channels.forEach(async (channel) => {
            if (channel.exists) {
                const channelData = channel.data() as SlackChannel;
                const channelName = channelData.name;
                const workspaceId = channelData.workspaceId;
                const language: string = await getWorkspaceLanguage(workspaceId);
                const message = await formatMessage(article, language);

                await sendMessageToSlackChannel(channelName, message);
            }
        })
    }
})