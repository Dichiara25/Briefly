import axios from 'axios';
import { firestore } from "../../../../../lib/firebase";
import { Channel } from '../../../../../utils/interfaces/slack';

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');

    // Check if the Authorization header exists and matches the valid key
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
        const slackOAuthToken = process.env.NEXT_PUBLIC_SLACK_OAUTH_TOKEN as string;
        const slackChannels = await firestore.collection("channels").get();

        if (!slackChannels.empty) {
            slackChannels.forEach(async (slackChannel) => {
                if (slackChannel.exists) {
                    const slackChannelData = slackChannel.data() as Channel;
                    const slackChannelName = slackChannelData.name;

                    await sendMessageToSlackChannel(slackOAuthToken, slackChannelName, "Hello world!");
                }
            })
        }

        return Response.json({ status: 200, message: "🎉 Success" });
    } else {
        return Response.json({ status: 401, message: "🚫 Unauthorized" });
    }
}

async function sendMessageToSlackChannel(token: string, channel: string, message: string): Promise<void> {
  try {
    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel,
        text: message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.ok) {
      console.log('Message sent successfully.');
    } else {
      console.error('Failed to send message:', response.data.error);
    }
  } catch (error: any) {
    console.error('Error sending message:', error.message);
  }
}
