import { routes } from "@/app/routes"
import styles from "./Header.module.css"
import { APP_NAME } from "@/app/layout"

export function Brand() {
    return <a style={{display: "flex", alignItems: "center"}} href="/">
        <div>🗞️</div>
        <div className={styles.brand}>{APP_NAME}</div>
    </a>
}

export function Navigation() {
    return <>
        <a href={routes.documentation}>Documentation</a>
        <a href={routes.pricing}>Pricing</a>
        <a href={routes.install}>
            <button>Add to Slack</button>
        </a>
    </>
}

export default function Header() {
    return (<div className={styles.container}>
        <div style={{display: "flex", alignItems: "center"}}>
            <Brand />
        </div>
        <div style={{display: "flex", alignItems: "center"}}>
            <Navigation />
        </div>
    </div>)
}