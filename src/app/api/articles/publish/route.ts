import { firestore } from "../../../../../lib/firebase";
import { Channel } from '../../../../../utils/interfaces/slack';
import { Article } from '../../../../../utils/interfaces/articles';
import { formatMessage, sendMessageToSlackChannel } from "./slack";

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');
    const article: Article = await req.json();
    const message = await formatMessage(article);

    // Check if the Authorization header exists and matches the valid key
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
        const slackOAuthToken = process.env.NEXT_PUBLIC_SLACK_OAUTH_TOKEN as string;
        const slackChannels = await firestore.collection("channels").get();

        if (!slackChannels.empty) {
            slackChannels.forEach(async (slackChannel) => {
                if (slackChannel.exists) {
                    const slackChannelData = slackChannel.data() as Channel;
                    const slackChannelName = slackChannelData.name;

                    await sendMessageToSlackChannel(slackOAuthToken, slackChannelName, message);
                }
            })
        }

        return Response.json({ status: 200, message: "🎉 Success" });
    } else {
        return Response.json({ status: 401, message: "🚫 Unauthorized" });
    }
}
