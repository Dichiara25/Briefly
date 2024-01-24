import { APP_NAME } from "@/app/layout";
import styles from "./Footer.module.css";
import { routes } from "@/app/routes";

function getCurrentYear(): number {
    return new Date().getFullYear();
}

export default function Footer() {
    const currentYear = getCurrentYear();

    return <div className={styles.container} style={{flexDirection: "column", textAlign: "center"}}>
        <div style={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center"}}>
            <div style={{display: "flex"}}>
                <div>🗞️</div>
                <h1 style={{fontSize: 'x-large', margin: '0 5px'}}>Briefly</h1>
            </div>
            <div style={{margin: "0 50px", opacity: ".3"}}>
                |
            </div>
            <div style={{display: "flex", flexDirection: "column", opacity: ".7"}}>
                <a style={{margin: "10px 0"}} href={routes.privacy}>Privacy</a>
                <a style={{margin: "10px 0"}} href={routes.termsOfUse}>Terms of use</a>
            </div>
        </div>
        <p>Made with ❤️ in Paris | © {APP_NAME} {currentYear}</p>
    </div>
}