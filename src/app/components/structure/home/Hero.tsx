import { APP_NAME } from '@/app/layout'
import styles from '../Body.module.css'
import AddToSlackButton from '../../slack/AddToSlackButton'

export default function Hero() {
   return (
      <main className={styles.main}>
        <h1>
          An AI-powered newsfeed. Right into your Slack. ✨
        </h1>
        <div className={styles.subtitle}>
          {APP_NAME} helps you keeping up by sending you byte-sized reports on your favorite topics.
        </div>
        <div style={{margin: "100px 0", fontSize: "x-large"}}>
          <AddToSlackButton />
        </div>
        <hr />
      </main>
   )
}