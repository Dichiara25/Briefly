const CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
const SCOPES = "channels:join,chat:write,chat:write.public,commands";

export default function AddToSlackButton() {
    const STATE = "The cat is purring next to the chimney";
    const REDIRECT_URL = `https://slack.com/oauth/v2/authorize?client_id=${CLIENT_ID}&scope=${SCOPES}&state=${STATE}&user_scope=`;

    return <a href={REDIRECT_URL}>
            <button>Add to Slack</button>
    </a>
}