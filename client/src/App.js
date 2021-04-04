import React, { useState, useRef } from "react";
import styles from "./App.module.sass";
import Switch from "./components/Switch";
import Editor from "./components/Editor";

const options = [
  {
    title: "JS",
    color: "#cfb0ff",
  },
  {
    title: "asm.js",
    color: "#BBCCFF",
  },
  {
    title: "Wasm",
    color: "#ffbdbd",
  },
];

function App() {
  const [activeOption, setActiveOption] = useState(0);
  const mainRef = useRef(null);

  const handleOptionClick = (data, index) => {
    setActiveOption(index);
    mainRef.current.style.backgroundColor = options[index].color;
  };

  return (
    <main ref={mainRef}>
      <Switch
        activeOption={activeOption}
        options={options}
        onOptionClick={handleOptionClick}
      />
      <div className={styles.downloaderWrap}>
        <Editor
          activeOption={activeOption}
          data={options[activeOption]}
          key={options[activeOption].type}
        />
      </div>
    </main>
  );
}

export default App;
