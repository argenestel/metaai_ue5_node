const Replicate = require("replicate");
const dotenv = require('dotenv');
const express = require("express");

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
