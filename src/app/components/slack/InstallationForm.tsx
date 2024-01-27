'use client'

import { supportedLanguages } from "@/app/install/languages";
import styles from "../structure/Body.module.css";
import AddToSlackButton from "./AddToSlackButton";
import { useState } from "react";

function LanguageSelection(props: {
    language: string,
    setLanguage: (language: string) => void
}) {
    return <>
        <label>Language</label>
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
    </>
}

const topics = [{id: 'aPda03sqlr', name: 'Cyber Security'}];

function TopicSelection(props: {
    topic: string,
    setTopic: (topic: string) => void
}) {
    return <>
        <label>Topics</label>
        <select
            placeholder="Please select one topic or more"
            value={props.topic}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                props.setTopic(e.target.value);
            }
            }
        >
            {topics.map((topic) => (
                <option
                    key={topic.id}
                    value={topic.id}
                >
                    {topic.name}
                </option>
            ))}
        </select>
    </>
}

export default function InstallationForm() {
    const [language, setLanguage] = useState("English");
    const [topic, setTopic] = useState("");

    return <div className={styles.main}>
        <h1>Settings</h1>
        <form style={{margin: "0 0 50px 0", alignItems: "center"}}>
            <div>
                <LanguageSelection
                    language={language}
                    setLanguage={setLanguage}
                />
            </div>
            <div>
                <TopicSelection
                    topic={topic}
                    setTopic={setTopic}
                />
            </div>
        </form>
        <AddToSlackButton />
    </div>
}