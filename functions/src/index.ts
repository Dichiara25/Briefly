const { onSchedule } = require("firebase-functions/v2/scheduler");
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Article, Topic } from './rss';
import { fetchArticles, fetchTopics } from './articles';
import { PendingWorkspace, AcceptedWorkspace, WorkspaceId, db, Channel } from './firestore';
import { sendMessageToSlackChannel } from "./slack";
import { daysBetweenDates, getDateIn30Days } from "./dates";
import { formatMessage } from "./messages";
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
    const workspaces = await db.collection("acceptedWorkspaces").get();

    if (!workspaces.empty) {
        workspaces.forEach(async (workspace) => {
            if (workspace.exists) {
                const workspaceData = workspace.data() as AcceptedWorkspace;
                const workspaceToken = workspaceData.accessToken;
                const workspaceLanguage = workspaceData.language;
                const workspaceChannels: Channel[] = workspaceData.channels;

                workspaceChannels.forEach(async (channel: Channel) => {
                    if (channel.topicIds.includes(article.topicId)) {
                        const channelName = channel.id;
                        const message = await formatMessage(article, workspaceLanguage);

                        await sendMessageToSlackChannel(
                            workspaceToken,
                            channelName,
                            message
                        );
                    }
                })
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

    const workspaceData: AcceptedWorkspace = {
        name: pendingWorkspace.name,
        accessToken: pendingWorkspace.accessToken,
        channels: pendingWorkspace.channels,
        language: pendingWorkspace.language,
        premium: false,
        live: false,
        freeTrialStartDate: Timestamp.now(),
        freeTrialEndDate: Timestamp.fromDate(freeTrialEndDate),
    }

    // Save sensitive workspace data in a private collection
    await db
        .collection("acceptedWorkspaces")
        .doc(pendingWorkspace.id)
        .set(workspaceData);

    const workspaceId: WorkspaceId = {
        id: pendingWorkspace.id
    }

    // Save workspace ID in a public read-only collection
    await db
        .collection("workspacesIds")
        .doc(pendingWorkspace.id)
        .set(workspaceId);

    // Delete workspace integration request
    await db
        .collection("pendingWorkspaces")
        .doc(pendingWorkspace.id)
        .delete();
})