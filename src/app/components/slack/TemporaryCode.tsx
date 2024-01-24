'use client'

import { useSearchParams } from 'next/navigation'
import styles from "../structure/Body.module.css";

export default function TemporaryCode() {
    const searchParams = useSearchParams()
    const code = searchParams.get('code')

    return (
        <div className={styles.main}>
            <h1>Code Parameter</h1>
            <p>{code ? `The code is: ${code}` : 'No code provided!'}</p>
        </div>
    );
}