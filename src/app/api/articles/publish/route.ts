import { firestore } from "../../../../../lib/firebase";
import { Channel } from '../../../../../utils/interfaces/slack';
import { Article } from '../../../../../utils/interfaces/articles';
import { getWorkspaceLanguage, formatMessage, sendMessageToSlackChannel } from "./slack";

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');

    // Check if the Authorization header exists and matches the valid key
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
        const slackOAuthToken = process.env.NEXT_PUBLIC_SLACK_OAUTH_TOKEN as string;
        const channels = await firestore.collection("channels").get();

        if (!channels.empty) {
            channels.forEach(async (channel) => {
                if (channel.exists) {
                    const channelData = channel.data() as Channel;
                    const channelName = channelData.name;
                    const workspaceId = channelData.workspaceId;
                    const article: Article = await req.json();
                    const language: string = await getWorkspaceLanguage(workspaceId);
                    const message = await formatMessage(article, language);

                    await sendMessageToSlackChannel(slackOAuthToken, channelName, message);
                }
            })
        }

        return Response.json({ status: 200, message: "🎉 Success" });
    } else {
        return Response.json({ status: 401, message: "🚫 Unauthorized" });
    }
}
