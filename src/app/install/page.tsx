import { Topic } from '../../../functions/src/rss'
import InstallationForm from '../components/slack/InstallationForm'
import { getAvailableTopics } from '../firebase/topics'

export default async function Page() {
    const availableTopics = await getAvailableTopics();

    return <InstallationForm availableTopics={availableTopics} />
}