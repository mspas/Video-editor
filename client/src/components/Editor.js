import React, { useState } from "react";
import styles from "./styles/editor.module.sass";
import EditorJS from "./EditorJS";
import EditorWasm from "./EditorWasm";
import EditorAsmJS from "./EditorAsmJS";

function Editor(props) {
  const [videoData, setVideoData] = useState();
  const [videoDataU8A, setVideoDataU8A] = useState();
  const [videoDataURL, setVideoDataURL] = useState();
  const [isStart, setIsStart] = useState(false);
  const [isEnd, setIsEnd] = useState(false);
  const [startMin, setStartMin] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [endMin, setEndMin] = useState(0);
  const [endSec, setEndSec] = useState(0);

  const prepareImageData = async (fileData, type) => {
    const file = fileData;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.onerror = (err) => {
        reject(err);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const scrollBottom = () => {
    setTimeout(() => {
      let element = document.body;
      element.scrollIntoView({
        alignToTop: false,
        behavior: "smooth",
        block: "end",
      });
    }, 100);
  };

  return (
    <div className={styles.downloaderContainer}>
      <h1 className={styles.heading}>
        {props.data.title} <span>Editor</span>
      </h1>
      <div className={styles.box}>
        <input
          type="file"
          id="inputfile"
          onChange={async (e) => {
            setVideoData(e.target.files.item(0));
            setVideoDataURL(URL.createObjectURL(e.target.files.item(0)));
            let buffer = await prepareImageData(e.target.files.item(0));
            setVideoDataU8A(new Uint8Array(buffer));
          }}
        />
        <label className={styles.button} htmlFor="inputfile">
          <span>+ Select video...</span>
        </label>
      </div>

      <h3>Preview:</h3>
      {videoData ? (
        <video controls width="400" src={videoDataURL} />
      ) : (
        "Select video file"
      )}
      <h3>Properties:</h3>
      <div className={styles.inputGroup}>
        <input
          type="checkbox"
          id="checkboxStart"
          onClick={() => {
            setIsStart(!isStart);
          }}
        />
        <label className={styles.titleLabel} htmlFor="checkboxStart">
          Start:
        </label>
        <label>min:</label>
        <input
          className={styles.value}
          disabled={!isStart}
          type="number"
          min="0"
          max="59"
          onChange={(e) => setStartMin(e.target.value)}
        />
        <label>sec:</label>
        <input
          className={styles.value}
          disabled={!isStart}
          type="number"
          min="0"
          max="59"
          onChange={(e) => setStartSec(e.target.value)}
        />
      </div>

      <div className={styles.inputGroup}>
        <input
          type="checkbox"
          id="checkboxEnd"
          onClick={() => {
            setIsEnd(!isEnd);
          }}
        />
        <label className={styles.titleLabel} htmlFor="checkboxEnd">
          End:
        </label>
        <label>min:</label>
        <input
          className={styles.value}
          disabled={!isEnd}
          type="number"
          min="0"
          max="59"
          onChange={(e) => setEndMin(e.target.value)}
        />
        <label>sec:</label>
        <input
          className={styles.value}
          disabled={!isEnd}
          type="number"
          min="0"
          max="59"
          onChange={(e) => setEndSec(e.target.value)}
        />
      </div>
      {props.activeOption === 0 ? (
        <EditorJS videoData={videoData} scrollBottom={scrollBottom} />
      ) : (
        ""
      )}
      {props.activeOption === 1 ? (
        <EditorAsmJS videoData={videoDataU8A} scrollBottom={scrollBottom} />
      ) : (
        ""
      )}
      {props.activeOption === 2 ? (
        <EditorWasm
          videoData={videoData}
          scrollBottom={scrollBottom}
          properties={{
            startMin: startMin,
            startSec: startSec,
            endMin: endMin,
            endSec: endSec,
          }}
        />
      ) : (
        ""
      )}
    </div>
  );
}
export default Editor;
