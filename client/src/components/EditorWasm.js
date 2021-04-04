import React, { useState, useEffect } from "react";
import styles from "./styles/editor.module.sass";
import Loader from "react-loader-spinner";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const ffmpeg = createFFmpeg();

function EditorWasm({ videoData, properties, scrollBottom }) {
  const [isLoading, setIsLoading] = useState(true);
  const [gifData, setGifData] = useState();
  const [isConverting, setIsConverting] = useState(false);

  const load = async () => {
    if (!ffmpeg.isLoaded()) await ffmpeg.load();
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const convertToGif = async () => {
    setIsConverting(true);
    scrollBottom();

    const ss = properties.isStart
      ? (properties.startMin * 60 + properties.startSec).toString() + ".0"
      : "0.0";
    const t = properties.isEnd
      ? (
          properties.endMin * 60 +
          properties.endSec -
          (properties.startMin * 60 + properties.startSec)
        ).toString() + ".0"
      : "0.0";

    ffmpeg.FS("writeFile", "test.mp4", await fetchFile(videoData));

    if (properties.isEnd)
      await ffmpeg.run(
        "-i",
        "test.mp4",
        "-t",
        t,
        "-ss",
        ss,
        "-f",
        "gif",
        "out.gif"
      );
    else
      await ffmpeg.run(
        "-i",
        "test.mp4",
        "-vf",
        "scale=480:320",
        "-ss",
        ss,
        "-f",
        "gif",
        "out.gif"
      );

    const data = ffmpeg.FS("readFile", "out.gif");

    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: "image/gif" })
    );

    setIsConverting(false);
    setGifData(url);

    scrollBottom();
  };

  return (
    <div className={styles.container}>
      {isLoading ? (
        <Loader type="TailSpin" color="#00BFFF" height={50} width={50} />
      ) : (
        <div>
          <p>
            <button className={styles.button} onClick={convertToGif}>
              Convert to gif
            </button>
          </p>
          <h3>Result:</h3>
          {isConverting ? (
            <Loader type="TailSpin" color="#00BFFF" height={50} width={50} />
          ) : (
            ""
          )}
          {gifData ? <img src={gifData} width="400" height="225" /> : ""}
        </div>
      )}
    </div>
  );
}
export default EditorWasm;
