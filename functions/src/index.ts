const { onSchedule } = require("firebase-functions/v2/scheduler");
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Article, Topic } from './rss';
import { fetchArticles, fetchTopics } from './articles';
import { PendingWorkspace, AcceptedWorkspace, WorkspaceId, db, getWorkspaceToken, setField } from './firestore';
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
        let title: string = `:boom: Failed to change language`;
        let content: string;
        let hint: string;

        // Check language presence
        if (!language){
            // Format error message
            content = `It seems you did not provide an input language :confused:`
            hint = `:bulb: _You can change the default language with_ \`/setlanguage language\``
        } else if (!supportedLanguages.includes(language)) {
            // Format error message
            content = `It seems you did not provide a supported language :confused:`
            hint = `:bulb: _Supported languages: ${supportedLanguages.join(', ')}_`
        } else {
            // Change the default display language for requesting team
            await setField(teamId, 'language', language);

            // Format success message
            title = `:partying_face: Successfully set language`
            content = `From now on, news will be displayed in *${language}* :blush:`
            hint = `:bulb: _You can change the default language with_ \`/setlanguage language>\``
        }

        const settingMessage = formatSettingMessage(title, content, hint);
        await sendMessageToSlackChannel(accessToken, channelId, settingMessage);
    }
  );

exports.setChannel = onRequest(
    { cors: ["api.slack.com"] },
    async (req: Request, res: Response) => {
        // Send acknowledgment to requesting Slack channel
        res.status(200).send();

        // Parse slash command request payload
        const data = await req.body;
        const teamId = data['team_id'] as string;
        const channelId = data['channel_id'] as string;

        // Fetch team's access token
        const accessToken = await getWorkspaceToken(teamId);

        // Check access token existence
        if (!accessToken) {
            res.status(400).send("Could not fetch your team's access token.");
            return;
        }

        // Ensure channel matches an existing channel
        if (channelId.charAt(0) !== "C") {
            // Format error message
            res.status(400).send(`#${channelId} does not correspond to a public channel.`);
            return;
        }

        // Format success message
        const title = `:partying_face: Successfully set channel`
        const content = `From now on, news will be delivered in this channel :blush:`
        const hint = `:bulb: _You can change the default channel with_ \`/setchannel\` _in the desired channel_`

        // Change the default display language for requesting team
        await setField(teamId, 'channel', `#${channelId}`);

        const settingMessage = formatSettingMessage(title, content, hint);
        await sendMessageToSlackChannel(accessToken, channelId, settingMessage);
    }
);

exports.setDeliveryMode = onRequest(
    { cors: ["api.slack.com"] },
    async (req: Request, res: Response) => {
        // Send acknowledgment to requesting Slack channel
        res.status(200).send();

        // Parse slash command request payload
        const data = await req.body;
        const teamId = data['team_id'] as string;
        const channelId = data['channel_id'] as string;
        const deliveryMode = data['text'] as string;

        // Fetch team's access token
        const accessToken = await getWorkspaceToken(teamId);

        // Check access token existence
        if (!accessToken) {
            res.status(400).send("Could not fetch your team's access token.");
            return;
        }

        // Initialize message fields
        let title: string = `:boom: Failed to change delivery mode`;
        let content: string;
        let hint: string;

        // Check language presence
        if (!deliveryMode){
            // Format error message
            content = `It seems you did not provide a delivery mode :confused:`
            hint = `:bulb: _You can change the default delivery mode with_ \`/setmode delivery_mode\``
        } else if (deliveryMode !== "live" && deliveryMode !== "packed") {
            // Format error message
            content = `It seems you did not provide a supported delivery mode :confused:`
            hint = `:bulb: _Supported delivery modes: *live* and *packed*_`
        } else {
            // Change the default display language for requesting team
            await setField(teamId, 'live', deliveryMode === "live");

            // Format success message
            title = `:partying_face: Successfully set delivery mode`
            content = `From now on, news will be displayed in *${deliveryMode === "live" ? "one by one in real time" : "packs once a day"}* :blush:`
            hint = `:bulb: _You can change the default delivery mode with_ \`/setmode delivery_mode\``
        }

        const settingMessage = formatSettingMessage(title, content, hint);
        await sendMessageToSlackChannel(accessToken, channelId, settingMessage);
    }
);

exports.setDailyLimit = onRequest(
    { cors: ["api.slack.com"] },
    async (req: Request, res: Response) => {
        // Send acknowledgment to requesting Slack channel
        res.status(200).send();

        // Parse slash command request payload
        const data = await req.body;
        const teamId = data['team_id'] as string;
        const channelId = data['channel_id'] as string;
        const dailyLimit = data['text'] as string;

        // Fetch team's access token
        const accessToken = await getWorkspaceToken(teamId);

        // Check access token existence
        if (!accessToken) {
            res.status(400).send("Could not fetch your team's access token.");
            return;
        }

        // Initialize message fields
        let title: string = `:boom: Failed to change daily limit`;
        let content: string;
        let hint: string;

        // Check language presence
        if (!dailyLimit){
            // Format error message
            content = `It seems you did not provide a daily limit :confused:`
            hint = `:bulb: _You can change the default daily limit with_ \`/setlimit daily_limit\``
        } else if (!isLimitValid(dailyLimit)) {
            // Format error message
            content = `It seems you did not provide a valid daily limit :confused:`
            hint = `:bulb: _The daily limit must be a positive integer._`
        } else {
            // Cast daily limit to number
            const castedDailyLimit: number = parseInt(dailyLimit);

            // Change the default display language for requesting team
            await setField(teamId, 'limit', castedDailyLimit);

            // Format success message
            title = `:partying_face: Successfully set daily limit`
            content = `From now on, you will not receive more than *${dailyLimit}* news a day :blush:`
            hint = `:bulb: _You can change the default daily limit with_ \`/setlimit daily_limit\``
        }

        const settingMessage = formatSettingMessage(title, content, hint);
        await sendMessageToSlackChannel(accessToken, channelId, settingMessage);
    }
);