import { APP_NAME } from "@/app/layout"
import styles from "../Body.module.css"

export default function Summaries() {
    return <div className={styles.main}>
        <h1>Summaries</h1>
        <div
            className={styles.subtitle}
            style={{
                textAlign: "justify",
                maxWidth: "30%",
            }}
        >
            Get byte-sized, daily <b>AI-summarized cyber security</b> news reports directly in your Slack organization. Using {APP_NAME}, you can finally layback and stop having to accept hundreds of cookie policies before finding meaningful insights.
        </div>
    </div>
}