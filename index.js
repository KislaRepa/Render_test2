const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const OpenAI = require("openai");
require('dotenv').config();

console.log("OpenAI API Key:", process.env.OPENAI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const { createAssistant } = require("./openai.service");
app.use(cors());
app.use(bodyParser.json());

(async () => {
  try {
    const assistant = await createAssistant(openai);
    console.log("Assistant created successfully");
    app.get("/start", async (req, res) => {
      try {
        const thread = await openai.beta.threads.create();
        console.log("Thread created successfully:", thread.id);
        return res.json({ thread_id: thread.id });
      } catch (error) {
        console.error("Error creating thread:", error);
        return res.status(500).json({ error: "Failed to create thread" });
      }
    });

    app.post("/chat", async (req, res) => {
      try {
        const assistantId = assistant.id;
        const threadId = req.body.thread_id;
        const message = req.body.message;
        if (!threadId) {
          return res.status(400).json({ error: "Missing thread_id" });
        }
        console.log(`Received message: ${message} for thread ID: ${threadId}`);
        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: message,
        });
        const run = await openai.beta.threads.runs.createAndPoll(threadId, {
          assistant_id: assistantId,
        });
        const messages = await openai.beta.threads.messages.list(run.thread_id);
        const response = messages.data[0].content[0].text.value;
        return res.json({ response });
      } catch (error) {
        console.error("Error processing chat:", error);
        return res.status(500).json({ error: "Failed to process chat" });
      }
    });

    app.get("/", (req, res) => {
      res.send("Server is running. Use /start to create a thread or /chat to chat.");
    });

    app.listen(process.env.PORT || 8080, () => {
      console.log(`Server running on port ${process.env.PORT || 8080}`);
    });
  } catch (error) {
    console.error("Error initializing assistant:", error);
  }
})();
