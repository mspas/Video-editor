import React, { useState, useEffect } from "react";
import styles from "./styles/editor.module.sass";
import Loader from "react-loader-spinner";
import EditorGlue from "../cutter.mjs";

//here will be a component for asm.js, but for now it's just another one for wasm

function EditorAsmJS(props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isModuleLoading, setIsModuleLoading] = useState(false);
  const [gifData, setGifData] = useState();
  const [isConverting, setIsConverting] = useState(false);
  const [wasmModule, setWasmModule] = useState(null);

  useEffect(() => {
    setIsModuleLoading(true);
    const mmoduleBuffer = EditorGlue({
      noInitialRun: true,
      noExitRuntime: true,
    }).then((response) => {
      setWasmModule(response);
      setIsModuleLoading(false);
    });
  }, []);

  const cutVideo = () => {
    if (!props.videoData || !wasmModule) return true;

    setIsLoading(true);
    window.scrollTo(0, document.body.scrollHeight);

    let a = wasmModule._doubler(7);
    console.log(wasmModule);

    let b = wasmModule.FS_createDataFile(
      "/",
      "test.mp4",
      props.videoData,
      true,
      true
    );
    //wasmModule.FS("writeFile", "test.mp4", props.videoData);
    console.log(b);

    wasmModule._cut_video1(1.0, 3.0);
    //let data = wasmModule.FS("readFile", "cut.mp4");
    //console.log(data);
    //await fs.promises.writeFile('./test.mp4', ffmpeg.FS('readFile', 'test.mp4'));

    /*const t0 = performance.now();
    return new Promise((resolve, reject) => {
      const memory = wasmModule._malloc(length); // Allocating WASM memory
      wasmModule.HEAPU8.set(props.imageData, memory); // Copying JS image data to WASM memory
      wasmModule._rotate2(memory, length, channels); // Calling WASM method
      const filteredImageData = wasmModule.HEAPU8.subarray(
        memory,
        memory + length
      );
      resolve(filteredImageData);
    })
      .then((filteredImageData) => {
        const t1 = performance.now();
        console.log(`Call to rotate took ${t1 - t0} milliseconds.`);
        createCanvas(filteredImageData);
      })
      .then(() => {
        props.scrollBottom();
      });};*/
  };

  return (
    <div className={styles.container}>
      {isModuleLoading ? (
        <Loader type="TailSpin" color="#00BFFF" height={50} width={50} />
      ) : (
        <div>
          <p>
            <button className={styles.button} onClick={cutVideo}>
              Cut with Wasm
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
export default EditorAsmJS;
