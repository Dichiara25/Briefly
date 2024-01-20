import styles from "./Header.module.css"

export default function Header() {
    return (<div className={styles.container}>
        <div style={{display: "flex", alignItems: "center"}}>
            <a style={{display: "flex", alignItems: "center"}} href="/">
                <div>🗞️</div>
                <div className={styles.brand}>Briefly</div>
            </a>
        </div>
        <div style={{display: "flex", alignItems: "center"}}>
            <a>Getting started</a>
            <a>Pricing</a>
            <button>Add to Slack</button>
        </div>
    </div>)
}