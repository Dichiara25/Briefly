const { onSchedule } = require("firebase-functions/v2/scheduler");
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Article, Topic } from './rss';
import { fetchArticles, fetchTopics } from './articles';
import { PendingWorkspace, AcceptedWorkspace, WorkspaceId, db, getWorkspaceToken } from './firestore';
import { sendMessageToSlackChannel } from "./slack";
import { daysBetweenDates, getDateIn30Days } from "./dates";
import { formatArticleMessage, formatSettingMessage } from "./messages";
import { Timestamp } from "firebase-admin/firestore";
import { Request, onRequest } from "firebase-functions/v2/https";
import { Response } from "firebase-functions/v1";
import { supportedLanguages } from "./languages";

exports.fetchNewArticles = onSchedule(
    {
        schedule: "31 9 * * *",
        memory: "512MiB",
    }, async () => {
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

async function getSettingValue(documentId: string, field: string): Promise<any> {
    const document = await db
        .collection("acceptedWorkspaces")
        .doc(documentId)
        .collection("settings")
        .doc(field)
        .get();

    if (document.exists) {
        const data = document.data();
        return data ? data.value : null;
    }

    return null;
}

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
                const workspaceLanguage = await getSettingValue(workspace.id, "language");
                const workspaceChannel: string = await getSettingValue(workspace.id, "channel");
                const workspaceKeywords: string[] = await getSettingValue(workspace.id, "keywords");

                const message = await formatArticleMessage(
                    article,
                    workspaceLanguage,
                    workspaceKeywords
                );

                await sendMessageToSlackChannel(
                    workspaceToken,
                    workspaceChannel,
                    message
                );
            }
        })
    }
})

async function setField(documentId: string, field: string, value: string | string[] | boolean) {
    return db
    .collection("acceptedWorkspaces")
    .doc(documentId)
    .collection("settings")
    .doc(field)
    .set({value: value}, {merge: true});
}

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
        premium: false,
        settings: null,
        freeTrialStartDate: Timestamp.now(),
        freeTrialEndDate: Timestamp.fromDate(freeTrialEndDate),
    }

    // Save sensitive workspace data in a private collection
    await db
        .collection("acceptedWorkspaces")
        .doc(pendingWorkspace.id)
        .set(workspaceData);

    await setField(pendingWorkspace.id, "language", pendingWorkspace.language);
    await setField(pendingWorkspace.id, "channel", pendingWorkspace.channel);
    await setField(pendingWorkspace.id, "keywords", pendingWorkspace.keywords.filter(item => item !== ''));
    await setField(pendingWorkspace.id, "live", false);

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

exports.setLanguage = onRequest(
    { cors: ["api.slack.com"] },
    async (req: Request, res: Response) => {
        // Send acknowledgment to requesting Slack channel
        res.status(200).send();

        // Parse slash command request payload
        const data = await req.body;
        const teamId = data['team_id'] as string;
        const channelId = data['channel_id'] as string;
        const language = data['text'] as string;

        // Fetch team's access token
        const accessToken = await getWorkspaceToken(teamId);

        // Check access token existence
        if (!accessToken) {
            res.status(400).send("Could not fetch your team's access token.");
            return;
        }

        // Initialize message fields
        let title: string;
        let content: string;
        let hint: string;

        // Check language presence
        if (!language){
            // Format error message
            title = `:boom: Failed to change language`
            content = `It seems you did not provide an input language :confused:`
            hint = `:bulb: _You can change the default language by typing \`/setlanguage <language>\`_`

            // Send a bad request error
            res.status(400).send("A language is required.");
        }

        // Check whether input language is valid
        if (!supportedLanguages.includes(language)) {
            // Format error message
            title = `:boom: Failed to change language`
            content = `It seems you did not provide a supported language :confused:`
            hint = `:bulb: _Please choose a language among the following: ${supportedLanguages.join(', ')}_`

            res.status(400).send(`*${language}* does not belong to the supported languages :confused:`);
        }

        // Change the default display language for requesting team
        await setField(teamId, 'language', language);

        // Format success message
        title = `:gear: Language set to ${language}`
        content = `From now on, news will be displayed in *${language}* :blush:`
        hint = `:bulb: _You can change the default language at anytime by typing \`/setlanguage <language>\` in the chat_`

        const successMessage = formatSettingMessage(title, content, hint);
        await sendMessageToSlackChannel(accessToken, channelId, successMessage);
    }
  );