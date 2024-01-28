'use client'

import { supportedLanguages } from "@/app/install/languages";
import styles from "../structure/Body.module.css";
import AddToSlackButton from "./AddToSlackButton";
import { useEffect, useState } from "react";

function LanguageSelection(props: {
    language: string,
    setLanguage: (language: string) => void
}) {
    return <div style={{
        display: "flex",
        flexDirection: "column"
    }}>
        <label>Language</label>
        <div className={styles.subtitle}>
            Language you would like news to be translated to
        </div>
        <select
            placeholder="Please select a language"
            value={props.language}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                props.setLanguage(e.target.value);
            }
            }
        >
            {supportedLanguages.map((language: string) => (
                <option
                    key={language}
                    value={language}
                >
                    {language}
                </option>
            ))}
        </select>
    </div>
}


function ChannelSelection(props: {
    channel: string,
    setChannel: (channel: string) => void
}) {
    return <div style={{
            display: "flex",
            flexDirection: "column"
        }}>
            <label>Channel</label>
            <div className={styles.subtitle}>
                Channel name you would like to receive news in
            </div>
            <input
                placeholder="#channel-name"
                type="text"
                value={props.channel}
                onChange={(e) => props.setChannel(e.target.value)}
                required
            />
        </div>
}


export default function InstallationForm(props: {availableTopics: string[]}) {
    const [language, setLanguage] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("language") || "English"
        } else {
            return "English"
        }
    });
    const [channel, setChannel] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("channel") || "#general"
        } else {
            return "#general"
        }
    });

    useEffect(() => {
        // Update localStorage whenever language changes
        localStorage.setItem("language", language);
    }, [language]);

    useEffect(() => {
        // Update localStorage whenever language changes
        localStorage.setItem("channel", channel);
    }, [channel]);

    return <div className={styles.main}>
        <h1>Preferences</h1>
        <div className={styles.subtitle}>
            Set your channel & display language preferences
        </div>
        <form
            style={{
                margin: "50px 0",
                textAlign: "center",
            }}
        >
            <LanguageSelection
                language={language as string}
                setLanguage={setLanguage}
            />
            <ChannelSelection
                channel={channel}
                setChannel={setChannel}
            />
        </form>
        <AddToSlackButton />
    </div>
}