'use client'

import { supportedLanguages } from "@/app/install/languages";
import styles from "../structure/Body.module.css";
import AddToSlackButton from "./AddToSlackButton";
import { useEffect, useState } from "react";
import { Topic } from "../../../../functions/src/rss";

const topics = [
    {id: 'aPda03sqlr', name: 'Cyber Security'},
    {id: 'azadcokcko', name: 'Artifical Intelligence'},
];

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



function TopicsSelection(props: {
    availableTopics: string[],
    topics: string[],
    setTopics: (topics: string[]) => void
}) {
    return <>
        <label>Channels</label>
        <select
            placeholder="Please select one topic or more"
            value={props.topics[topics.length - 1]}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                if (!props.topics.includes(e.target.value)) {
                    props.setTopics([...props.topics, e.target.value]);
                }
            }
            }
        >
            {props.availableTopics.map((topic: string) => (
                <option
                    key={topic}
                    value={topic}
                >
                    {topic}
                </option>
            ))}
        </select>
    </>
}

export default function InstallationForm(props: {availableTopics: string[]}) {
    const [language, setLanguage] = useState(localStorage.getItem("language") || "English");
    const [topics, setTopics] = useState<string[]>(() => {
        // Attempt to get topics from localStorage
        const savedTopics = localStorage.getItem('topics');
        // If savedTopics exists and is not null, parse it, otherwise default to an empty array
        return savedTopics ? JSON.parse(savedTopics) : [];
    });

    const removeTopic = (valueToRemove: string) => {
        setTopics(prevArray => prevArray.filter(item => item !== valueToRemove));
    };

    useEffect(() => {
        // Save topics to localStorage whenever they change
        localStorage.setItem('topics', JSON.stringify(topics));
    }, [topics]);

    useEffect(() => {
        // Update localStorage whenever language changes
        localStorage.setItem("language", language);
    }, [language]);

    return <div className={styles.main}>
        <h1>Preferences</h1>
        <div className={styles.subtitle}>
            Set your topics & display language preferences
        </div>
        <form
            style={{
                margin: "50px 0",
                textAlign: "center"
            }}
        >
            <div>
                <LanguageSelection
                    language={language as string}
                    setLanguage={setLanguage}
                />
            </div>
            <div>
                <TopicsSelection
                    availableTopics={props.availableTopics}
                    topics={topics}
                    setTopics={setTopics}
                />
            </div>
            {topics.length > 0 &&
                <div>
                    {topics.map((topic) => (
                        <div
                            key={topic}
                            style={{display: "flex", alignItems: "center", margin: "20px 0"}}
                        >
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    removeTopic(topic);
                                    }
                                }
                                style={{
                                    background: "none",
                                    padding: 0,
                                    fontSize: "xxx-large",
                                }}
                            >
                                🗑️
                            </button>
                            <button
                                key={topic}
                                style={{
                                    margin: "0",
                                    padding: "10px 20px",
                                    scale: "1",
                                    opacity: "1"
                                }}
                            >
                                <div>
                                    {topic}
                                </div>
                                <input
                                    style={{border: "none"}}
                                    placeholder="#channel-name"
                                    defaultValue="#general"
                                />
                            </button>
                        </div>
                    )
                    )}
                </div>
            }
        </form>
        <AddToSlackButton />
    </div>
}