import { APP_NAME } from '@/app/layout'
import styles from '../Body.module.css'

export default function Hero() {
   return (
      <main className={styles.main}>
        <h1>
          An AI-powered newsfeed. Right into your Slack. ✨
        </h1>
        <div className={styles.subtitle}>
          {APP_NAME} helps you keeping up by sending you byte-sized reports on your favorite topics.
        </div>
        <button style={{margin: "100px 0", fontSize: "x-large"}}>
          Add to Slack
        </button>
        <hr />
      </main>
   )
}