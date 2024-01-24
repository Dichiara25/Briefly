const CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
const SCOPES = "channels:join,chat:write,chat:write.public,commands";

export default function AddToSlackButton() {
    return <a href={`https://slack.com/oauth/v2/authorize?client_id=${CLIENT_ID}&scope=${SCOPES}&user_scope=`}>
            <button>Add to Slack</button>
    </a>
}