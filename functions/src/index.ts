const { onSchedule } = require("firebase-functions/v2/scheduler");
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Article, Topic } from './rss';
import { fetchArticles, fetchTopics } from './articles';
import { PendingWorkspace, Workspace, WorkspaceId, db, getWorkspaceLanguage } from './firestore';
import { sendMessageToSlackChannel } from "./slack";
import { daysBetweenDates, getDateIn30Days } from "./dates";
import { SlackChannel, formatMessage } from "./messages";
import { Timestamp } from "firebase-admin/firestore";

exports.fetchNewArticles = onSchedule("31 9 * * *", async () => {
    const topics: Topic[] = await fetchTopics();
    const storedArticlesCollection = db.collection("articles");
    const newArticles = await fetchArticles(topics);

    newArticles.forEach(async (article: Article) => {
        if (article.content) storedArticlesCollection.add(article);
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

exports.authorizeWorkspace = onDocumentCreated("pendingWorkspaces/{docId}", async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }

    const pendingWorkspace = snapshot.data() as PendingWorkspace;
    const freeTrialEndDate = getDateIn30Days();

    const workspaceData: Workspace = {
        id: pendingWorkspace.id,
        name: pendingWorkspace.name,
        accessToken: pendingWorkspace.accessToken,
        channelIds: pendingWorkspace.channelIds,
        language: pendingWorkspace.language,
        premium: false,
        freeTrialStartDate: Timestamp.now(),
        freeTrialEndDate: Timestamp.fromDate(freeTrialEndDate),
    }

    const workspaceId: WorkspaceId = {
        id: pendingWorkspace.id
    }

    await db
        .collection("acceptedWorkspaces")
        .doc(pendingWorkspace.id)
        .set(workspaceData);

    await db
        .collection("workspacesIds")
        .doc(pendingWorkspace.id)
        .set(workspaceId);

    await db
        .collection("pendingWorkspaces")
        .doc(pendingWorkspace.id)
        .delete();
})