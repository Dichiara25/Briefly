import Image from 'next/image'
import styles from '../../../page.module.css'
import newspaper from "../../../assets/newpaper_asset_1.jpg"
import ScrollAppear from '../ScrollAppear'

export default function Hero() {
   return (
      <main className={styles.main}>
        <h1>
          An AI-powered newsfeed. Right into your Slack. ✨
        </h1>
        <div style={{fontSize: "large", "opacity": 0.3}}>
          Briefly helps you keeping up by sending you byte-sized reports on your favorite topics.
        </div>
        <button style={{margin: "100px 0", fontSize: "x-large"}}>
          Add to Slack
        </button>
        <hr />
      </main>
   )
}