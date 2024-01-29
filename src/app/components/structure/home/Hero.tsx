import styles from '../Body.module.css'
import { routes } from '@/app/routes'

export default function Hero() {
   return (
      <main className={styles.main}>
        <h1>
          AI-powered security news. Right into your Slack. ✨
        </h1>
        <div className={styles.subtitle}>
          Stay ahead of the curve with byte-sized news reports and AI-generated insights.
        </div>
        <div style={{margin: "100px 0", fontSize: "x-large"}}>
          <a href={routes.install}>
              <button>Add to Slack</button>
          </a>
        </div>
      </main>
   )
}