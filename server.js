const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const sharp = require("sharp");

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

app.post("/api/rotate-image", async (req, res) => {
  try {
    let array = [];
    for (let i = 0; i < req.body.arraySize; i++) {
      const element = req.body.imageData[i];
      array.push(element);
    }
    let data = new Uint8Array(array);
    let buffer = Buffer.from(data.buffer);

    const image = await sharp(buffer)
      .rotate(180)
      .toFormat("png")
      .png({ quality: 100 })
      .toBuffer();

    const imageBase64 = "data:image/png;base64," + image.toString("base64");

    res.status(200).send({
      success: true,
      result: imageBase64,
    });
  } catch (e) {
    console.warn(e);
  }
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));

  app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}

app.listen(port, () => console.log(`Listening on port ${port}`));
