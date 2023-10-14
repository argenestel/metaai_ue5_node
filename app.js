const Replicate = require("replicate");
const dotenv = require('dotenv');
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const EventSource = require("eventsource");
const { url } = require("inspector");

dotenv.config();

const app = express();
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.get("/ask", async (req, res, next) => {
  const inputPrompt = req.query.input; // Get the input parameter from the query string

  if (!inputPrompt) {
    return res.status(400).send("Input parameter is missing.");
  }

  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(
      "replicate/oasst-sft-1-pythia-12b:28d1875590308642710f46489b97632c0df55adb5078d43064e1dc0bf68117c3",
      {
        input: {
          prompt: inputPrompt, // Use the input parameter as the prompt
        }
      }
    );

    const concatenatedOutput = output.join(' '); // Concatenate the array elements

    res.send(concatenatedOutput); // Send the concatenated output as a response
  } catch (error) {
    res.status(500).send("An error occurred: " + error.message);
  }
});
app.get("/tts", async (req, res) => {
  const { input } = req.query;

  if (!input) {
    return res.status(400).send("Input parameter is missing.");
  }

  try {
    const response = await axios.post("https://play.ht/api/v2/tts", {
      text: input,
      voice: "s3://mockingbird-prod/abigail_vo_6661b91f-4012-44e3-ad12-589fbdee9948/voices/speaker/manifest.json",
      voice_engine: "PlayHT2.0",
    }, {
      headers: {
        Authorization: "Bearer " + process.env.PLAY_HT_APIKEY,
        "X-USER-ID": process.env.PLAY_HT_USER,
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      }
    });

    const eventStreamData = response.data;
    const mp3Urls = [];

    // Split the data into individual events
    const events = eventStreamData.split("event: ");
    for (const event of events) {
      const eventData = event.trim();
      if (eventData.startsWith("completed")) {
        const url = JSON.parse(eventData.split("data: ")[1]).url;
        mp3Urls.push(url);
      }
    }

    if (mp3Urls.length > 0) {
      // Return the MP3 URLs as a JSON response
      res.json({ mp3Urls });

      // Close the connection
      res.end();
    } else {
      return res.status(500).send("No MP3 URLs found.");
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("An error occurred.");
  }
});
