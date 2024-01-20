import styles from "./Footer.module.css";

function getCurrentYear(): number {
    return new Date().getFullYear();
}

export default function Footer() {
    const currentYear = getCurrentYear();

    return <div className={styles.container}>Made with ❤️ in Paris | © Briefly {currentYear}</div>
}