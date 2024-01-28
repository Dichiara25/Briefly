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

function KeywordsSelection(props: {
    keywords: string,
    setKeywords: (keywords: string) => void,
}) {
    return <div style={{
            display: "flex",
            flexDirection: "column"
        }}>
            <label>Keywords</label>
            <div className={styles.subtitle}>
                Mention @here when the following words appear in a news
            </div>
            <input
                placeholder="Debian, GitHub, etc."
                type="text"
                value={props.keywords}
                onChange={(e) => props.setKeywords(e.target.value)}
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
    const [keywords, setKeywords] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("keywords") || "Linux"
        } else {
            return "Linux"
        }
    });
    const [keywordsList, setKeywordsList] = useState<string[]>([]);

    const removeKeywordFromArray = (valueToRemove: string) => {
        setKeywordsList(prevArray => prevArray.filter(item => item !== valueToRemove));
    };

    useEffect(() => {
        // Update localStorage whenever language changes
        localStorage.setItem("language", language);
    }, [language]);

    useEffect(() => {
        // Update localStorage whenever language changes
        localStorage.setItem("channel", channel);
    }, [channel]);

    useEffect(() => {
        // Save keywords to localStorage whenever they change
        localStorage.setItem('keywords', JSON.stringify(keywords));
    }, [keywords]);

    useEffect(() => {
        setKeywordsList(keywords.split(/[,\s\-\/]/));
    }, [keywords]);

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
            <KeywordsSelection
                keywords={keywords}
                setKeywords={setKeywords}
            />
            {keywords && <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
                {keywordsList
                    .map((keyword) => (
                        keyword.length > 0 && <button
                            key={keyword}
                            onClick={(e) => {
                                e.preventDefault();
                                removeKeywordFromArray(keyword);
                                const newKeywords = keywords.replace(`${keyword}`, '');
                                setKeywords(newKeywords);
                            }}
                            style={{
                                background: "orange",
                                padding: "10px 20px",
                                borderRadius: "10px",
                                margin: "10px",
                            }}
                        >
                            - {keyword.replace(/[,\s\-\/]/, '')}
                        </button>
                    ))
                }
            </div>
            }
        </form>
        <AddToSlackButton />
    </div>
}