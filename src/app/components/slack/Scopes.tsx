import { APP_NAME } from "@/app/layout";
import styles from "../structure/Body.module.css";

export default function Scopes() {
    return <div className={styles.main}>
        <h1>Scopes</h1>
        <div className={styles.subtitle}>
            Only 3 scopes are required by {APP_NAME} to work properly
        </div>
        <div style={{marginTop: "50px", textAlign: "center"}}>
            <label>chat:write</label>
            <div className={styles.subtitle} style={{margin: "10px 0 30px 0"}}>
                Send messages as @{APP_NAME}
            </div>
            <label>chat:write.public</label>
            <div className={styles.subtitle} style={{margin: "10px 0 30px 0"}}>
                Send messages to channels @{APP_NAME} isn't a member of
            </div>
            <label>command</label>
            <div className={styles.subtitle} style={{margin: "10px 0 30px 0"}}>
                Configure {APP_NAME} directly from your Slack organization
            </div>
        </div>
    </div>
}