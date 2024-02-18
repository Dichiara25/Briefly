const { onSchedule } = require("firebase-functions/v2/scheduler");
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Article, Topic } from './rss';
import { fetchArticles, fetchTopics } from './articles';
import { PendingTeam, Team, TeamId, db, getAccessToken, setField, getSettingValue } from './firestore';
import { sendMessageToSlackChannel } from "./slack";
import { daysBetweenDates, getDateIn30Days } from "./dates";
import { formatArticleMessage, formatSettingMessage } from "./messages";
import { Timestamp } from "firebase-admin/firestore";
import { Request, onRequest } from "firebase-functions/v2/https";
import { Response } from "firebase-functions/v1";
import { supportedLanguages } from "./languages";
import { isLimitValid } from "./numbers";

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

exports.resetDeliveryCounters = onSchedule("0 0 * * *", async () => {
    const workspaces = await db.collection("teams").get();

    workspaces.forEach(async (workspace) => {
        await db
            .collection("teams")
            .doc(workspace.id)
            .set({"deliveryCounter": 0}, {merge: true});
    })
})

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
    const workspaces = await db.collection("teams").get();

    if (!workspaces.empty) {
        for (const workspace of workspaces.docs) {
            if (workspace.exists) {
                const teamData = workspace.data() as Team;
                const workspaceToken = teamData.accessToken;
                const workspaceLanguage = await getSettingValue(workspace.id, "language");
                const workspaceChannel: string = await getSettingValue(workspace.id, "channel");
                const workspaceKeywords: string[] = await getSettingValue(workspace.id, "keywords");
                const workspaceDailyLimit: number = await getSettingValue(workspace.id, "limit");
                let workspaceDeliveryCounter = teamData.deliveryCounter;

                // Check news limit has not been reached
                if (workspaceDeliveryCounter == workspaceDailyLimit) break;

                // Format Slack message
                const message = await formatArticleMessage(
                    article,
                    workspaceLanguage,
                    workspaceKeywords
                );

                // Send formatted message to Slack channel
                await sendMessageToSlackChannel(
                    workspaceToken,
                    workspaceChannel,
                    message
                );

                // Increment delivery counter
                await db
                    .collection("teams")
                    .doc(workspace.id)
                    .set({"deliveryCounter": workspaceDeliveryCounter + 1}, {merge: true});
            }
        }
    }
})

exports.authorizeWorkspace = onDocumentCreated("pendingTeams/{docId}", async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }

    const pendingTeam = snapshot.data() as PendingTeam;
    const freeTrialEndDate = getDateIn30Days();

    const teamData: Team = {
        name: pendingTeam.name,
        accessToken: pendingTeam.accessToken,
        premium: false,
        deliveryCounter: 0,
        freeTrialStartDate: Timestamp.now(),
        freeTrialEndDate: Timestamp.fromDate(freeTrialEndDate),
    }

    // Save sensitive workspace data in a private collection
    await db
        .collection("teams")
        .doc(pendingTeam.id)
        .set(teamData);

    await setField(pendingTeam.id, "language", pendingTeam.language);
    await setField(pendingTeam.id, "channel", pendingTeam.channel);
    await setField(pendingTeam.id, "keywords", pendingTeam.keywords.filter(item => item !== ''));
    await setField(pendingTeam.id, "live", false);
    await setField(pendingTeam.id, "limit", 10);

    const teamId: TeamId = {
        id: pendingTeam.id
    }

    // Save workspace ID in a public read-only collection
    await db
        .collection("teamsIds")
        .doc(pendingTeam.id)
        .set(teamId);

    // Delete workspace integration request
    await db
        .collection("pendingTeams")
        .doc(pendingTeam.id)
        .delete();
})

exports.sendWelcomeMessage = onDocumentCreated("teams/{docId}", async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }

    const team = snapshot.data() as Team;
    const teamId = snapshot.id;
    const accessToken = team.accessToken;
    const channelId = await getSettingValue(teamId, "channel");
    const endDate = team.freeTrialEndDate as Timestamp;

    const title = "🔥 Thanks for installing Briefly"
    const content = `Your free trial ends on \`${endDate.toDate()}\``;
    const hint = "🔗 You can subscribe to Briefly by clicking *<https://briefly.rocks/pricing|here>*."

    const settingMessage = formatSettingMessage(
        title,
        content,
        hint
    );
    await sendMessageToSlackChannel(accessToken, channelId, settingMessage);
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
        const accessToken = await getAccessToken(teamId);

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
            hint = `:bulb: _You can change the default language with_ \`/setlanguage language\` _(eg. \`/setlanguage french\` for french translation)_`
        } else if (!supportedLanguages.includes(language.toLowerCase())) {
            // Format error message
            content = `It seems you did not provide a supported language :confused:`
            hint = `:bulb: _Supported languages: ${supportedLanguages.join(', ')}_`
        } else {
            // Change the default display language for requesting team
            await setField(teamId, 'language', language);

            // Format success message
            title = `:partying_face: Successfully set language`
            content = `From now on, news will be displayed in *${language}* :blush:`
            hint = `:bulb: _You can change the default language with_ \`/setlanguage language\` _(eg. \`/setlanguage french\` for french translation)_`
        }

        const settingMessage = formatSettingMessage(title, content, hint);
        await sendMessageToSlackChannel(accessToken, channelId, settingMessage);
    }
);

exports.getLanguage = onRequest(
    { cors: ["api.slack.com"] },
    async (req: Request, res: Response) => {
        // Send acknowledgment to requesting Slack channel
        res.status(200).send();

        // Parse slash command request payload
        const data = await req.body;
        const teamId = data['team_id'] as string;
        const channelId = data['channel_id'] as string;
        const language: string = await getSettingValue(teamId, "language");

        // Fetch team's access token
        const accessToken = await getAccessToken(teamId);

        // Check access token existence
        if (!accessToken) {
            res.status(400).send("Could not fetch your team's access token.");
            return;
        }

        // Format success message
        const title = `:gear: Language`
        const content = `Language is currently set to *${language}* :blush:`
        const hint = `:bulb: _You can change the default language with_ \`/setlanguage language\` _(eg. \`/setlanguage french\` for french translation)_`

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
        const channelName = data['channel_name'] as string;

        // Fetch team's access token
        const accessToken = await getAccessToken(teamId);

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
        await setField(teamId, 'channel', `#${channelName}`);

        const settingMessage = formatSettingMessage(title, content, hint);
        await sendMessageToSlackChannel(accessToken, channelId, settingMessage);
    }
);

exports.getChannel = onRequest(
    { cors: ["api.slack.com"] },
    async (req: Request, res: Response) => {
        // Send acknowledgment to requesting Slack channel
        res.status(200).send();

        // Parse slash command request payload
        const data = await req.body;
        const teamId = data['team_id'] as string;
        const channelId = data['channel_id'] as string;
        const channel: string = await getSettingValue(teamId, "channel");

        // Fetch team's access token
        const accessToken = await getAccessToken(teamId);

        // Check access token existence
        if (!accessToken) {
            res.status(400).send("Could not fetch your team's access token.");
            return;
        }

        // Format success message
        const title = `:gear: Delivery channel`
        const content = `Your delivery channel is currently set to *${channel}* :blush:`
        const hint = `:bulb: _You can change the default delivery channel with_ \`/setchannel\``

        const settingMessage = formatSettingMessage(title, content, hint);
        await sendMessageToSlackChannel(accessToken, channelId, settingMessage);
    }
);

exports.setLiveMode = onRequest(
    { cors: ["api.slack.com"] },
    async (req: Request, res: Response) => {
        // Send acknowledgment to requesting Slack channel
        res.status(200).send();

        // Parse slash command request payload
        const data = await req.body;
        const teamId = data['team_id'] as string;
        const channelId = data['channel_id'] as string;
        const liveMode = data['text'] as string;

        // Fetch team's access token
        const accessToken = await getAccessToken(teamId);

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
        if (!liveMode){
            // Format error message
            content = `It seems you did not provide the required live mode argument :confused:`
            hint = `:bulb: _You can change the default live mode with_ \`/setlivemode live_mode\` _(eg. \`/setlivemode on\` for live mode)_`
        } else if (liveMode !== "on" && liveMode !== "off") {
            // Format error message
            content = `It seems you did not provide a supported live mode :confused:`
            hint = `:bulb: _Supported live modes: *on* and *off*_`
        } else {
            // Change the default display language for requesting team
            await setField(teamId, 'live', liveMode === "on");

            // Format success message
            title = `:partying_face: Successfully set live mode`
            content = `From now on, news will be delivered *${liveMode === "on" ? "in real time" : "once a day"}* :blush:`
            hint = `:bulb: _You can change the default live mode with_ \`/setlivemode live_mode\` _(eg. \`/setlivemode on\` for live mode)_`
        }

        const settingMessage = formatSettingMessage(title, content, hint);
        await sendMessageToSlackChannel(accessToken, channelId, settingMessage);
    }
);

exports.getLiveMode = onRequest(
    { cors: ["api.slack.com"] },
    async (req: Request, res: Response) => {
        // Send acknowledgment to requesting Slack channel
        res.status(200).send();

        // Parse slash command request payload
        const data = await req.body;
        const teamId = data['team_id'] as string;
        const channelId = data['channel_id'] as string;
        const liveMode: boolean = await getSettingValue(teamId, "live");

        // Fetch team's access token
        const accessToken = await getAccessToken(teamId);

        // Check access token existence
        if (!accessToken) {
            res.status(400).send("Could not fetch your team's access token.");
            return;
        }

        // Format success message
        const title = `:gear: Live mode`
        const content = `Live mode is currently *${liveMode ? "active" : "inactive"}* :blush:`
        const hint = `:bulb: _You can change the default live mode value with_ \`/setlivemode live_mode\` _(eg. \`/setlivemode on\` for live mode)_`

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
        const accessToken = await getAccessToken(teamId);

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
            hint = `:bulb: _You can change the default daily limit with_ \`/setlimit daily_limit\` _(eg. \`/setlimit 10\` for 10 news max per day)_`
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
            content = `From now on, you will receive up to *${dailyLimit}* news a day :blush:`
            hint = `:bulb: _You can change the default daily limit with_ \`/setlimit daily_limit\` _(eg. \`/setlimit 10\` for 10 news max per day)_`
        }

        const settingMessage = formatSettingMessage(title, content, hint);
        await sendMessageToSlackChannel(accessToken, channelId, settingMessage);
    }
);

exports.getDailyLimit = onRequest(
    { cors: ["api.slack.com"] },
    async (req: Request, res: Response) => {
        // Send acknowledgment to requesting Slack channel
        res.status(200).send();

        // Parse slash command request payload
        const data = await req.body;
        const teamId = data['team_id'] as string;
        const channelId = data['channel_id'] as string;
        const dailyLimit: string = await getSettingValue(teamId, "limit");

        // Fetch team's access token
        const accessToken = await getAccessToken(teamId);

        // Check access token existence
        if (!accessToken) {
            res.status(400).send("Could not fetch your team's access token.");
            return;
        }

        // Format success message
        const title = `:gear: Daily limit`
        const content = `Your daily limit is currently set to *${dailyLimit}* news a day :blush:`
        const hint = `:bulb: _You can change the default daily limit with_ \`/setlimit daily_limit\` _(eg. \`/setlimit 10\` for 10 news max per day)_`

        const settingMessage = formatSettingMessage(title, content, hint);
        await sendMessageToSlackChannel(accessToken, channelId, settingMessage);
    }
);
