import AccessToken from '../components/slack/AccessToken'
import { getAvailableTopics } from '../firebase/topics'

export default async function Page() {
    const availableTopics = await getAvailableTopics();
    return <AccessToken availableTopics={availableTopics} />
}