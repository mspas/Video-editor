import React from "react";
import styles from "./styles/switch.module.sass";

function Switch(props) {
  let options = props.options.map((data, index) => {
    return (
      <div
        className={
          props.activeOption === index
            ? `${styles.switchOption} ${styles.active}`
            : styles.switchOption
        }
        key={index}
        onClick={props.onOptionClick.bind(null, data, index)}
      >
        <div className={styles.switchOptionContent}>
          <span className={styles.title}>{data.title}</span>
          <span className={styles.titleSm}>Editor</span>
        </div>
      </div>
    );
  });
  return <div className={styles.switchContainer}>{options}</div>;
}
export default Switch;
