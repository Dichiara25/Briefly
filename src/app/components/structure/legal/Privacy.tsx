import { APP_NAME, DOMAIN_NAME } from "@/app/layout";
import styles from "../Body.module.css";

function Introduction() {
    return <div>
        <h2>Introduction</h2>
        <div className={styles.paragraph}>
            Welcome to {APP_NAME}! We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy policy sets out how {APP_NAME} uses and protects any information that you give us when you use our SaaS project, which involves sending news to Slack organizations.
        </div>
    </div>
}

function DataHosting() {
    return <div>
        <h2>Data Hosting & Security</h2>
        <div className={styles.paragraph}>
            <p>
                <b>Data Hosting:</b> {APP_NAME}&apos;s data is hosted in Europe on the Google Cloud Platform, utilizing Firebase services. This ensures that your data is stored securely and in compliance with relevant European data protection regulations.
            </p>
            <p>
                <b>Security Measures:</b> We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure, so we cannot guarantee its absolute security.
            </p>
        </div>
    </div>
}

function InformationCollection() {
    return <div>
        <h2>Information Collection</h2>
        <div className={styles.paragraph}>
            <p>
                <b>Personal Information:</b> We do not collect any personal information from our users. Our service focuses on sending news to Slack organizations without requiring personal data.            </p>
            <p>
                <b>Non-Personal Information: </b> We may collect non-personal identification information about users whenever they interact with {APP_NAME}. This may include the browser name, the type of computer, and technical information about users&apos; means of connection to our services, such as the operating system and the Internet service providers utilized.
            </p>
        </div>
    </div>
}

function UseOfInformation() {
    return <div>
        <h2>Use Of Information</h2>
        <div className={styles.paragraph}>
            <p>
                <b>Service Provision:</b> The information we collect is used solely for the purpose of providing the service, which includes sending news to Slack organizations.
            </p>
            <p>
                <b>Non-Disclosure:</b> We may collect non-personal identification information about users whenever they interact with {APP_NAME}. This may include the browser name, the type of computer, and technical information about users&apos; means of connection to our services, such as the operating system and the Internet service providers utilized.
            </p>
        </div>
    </div>
}

function DataRetentionAndDeletion() {
    return <div>
        <h2>Data Retention & Deletion</h2>
        <div className={styles.paragraph}>
            <p>
                <b>Retention:</b> We will retain the data we collect only for as long as necessary to provide our services to you and fulfill the purposes outlined in this privacy policy.
            </p>
            <p>
                <b>Deletion:</b> Users can request the deletion of their data at any time, and we will respond to such requests in a timely manner, ensuring complete removal of the data from our systems.
            </p>
        </div>
    </div>
}

function YourRights() {
    return <div>
        <h2>Your Rights</h2>
        <div className={styles.paragraph}>
            <p>
                <b>Access & Control:</b> You have the right to access, update, or delete the information we have on you. You can do this by contacting us directly.
            </p>
            <p>
                <b>Consent Withdrawal:</b>You have the right to withdraw consent at any time, without affecting the lawfulness of processing based on consent before its withdrawal.
            </p>
        </div>
    </div>
}

function Changes() {
    return <div>
        <h2>Changes to This Privacy Policy</h2>
        <div className={styles.paragraph}>
            {APP_NAME} reserves the right to update or change our Privacy Policy at any time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
        </div>
    </div>
}

function Contact() {
    return <div>
        <h2>Contact Us</h2>
        <div className={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at support@{DOMAIN_NAME}.
        </div>
    </div>
}

export default function Privacy() {
    return <div className={styles.main}>
        <h1>Privacy</h1>
        <div className={styles.subtitle}>Last updated: January 2024</div>
        <hr style={{margin: "40px 0 20px 0"}} />
        <Introduction />
        <DataHosting />
        <InformationCollection />
        <UseOfInformation />
        <DataRetentionAndDeletion />
        <YourRights />
        <Changes />
        <Contact />
    </div>
}