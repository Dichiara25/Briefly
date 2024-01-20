'use client'

import React, { useState, useEffect, ReactNode, useRef } from 'react';
import styles from './ScrollAppear.module.css'; // Create a CSS file for styling

export default function ScrollAppear(props: { children: ReactNode }) {
    const containerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const options = {
          root: null, // Use the viewport as the root
          rootMargin: '0px',
          threshold: .1, // Trigger when at least 50% of the component is in view
        };

        const observer = new IntersectionObserver(([entry]) => {
          // When the component enters or exits the viewport, update visibility
            setIsVisible(entry.isIntersecting);
        }, options);

        const currentContainerRef = containerRef.current; // Create a variable

        // Start observing the container element
        if (currentContainerRef) {
          observer.observe(currentContainerRef);
        }

        // Clean up the observer when the component unmounts
        return () => {
          if (currentContainerRef) {
            observer.unobserve(currentContainerRef);
          }
        };
      }, []);

    return (<div className={styles.container}>
      <div className={`${isVisible ? styles.visible : styles.hidden}`} ref={containerRef}>
        {props.children}
      </div>
      </div>
    );
  };