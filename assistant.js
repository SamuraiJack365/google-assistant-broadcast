"use strict";

const GoogleAssistant = require("google-assistant");
const fs = require("fs");

/** See https://github.com/endoplasmic/google-assistant for more info **/
const config = {
  auth: {
    keyFilePath: process.env.CLIENT_SECRET
        || "/usr/src/config/client_secret.json",
    savedTokensPath: process.env.TOKEN || "/usr/src/config/tokens.json"
  },
  conversation: {
    lang: process.env.LANGUAGE || 'en-GB', // defaults to en-GB, but try other ones, it's fun!
    isNew: true,
  },
};

function Assistant() {
  this.validateFiles = () => {
    if (!checkFileExistsSync(config.auth.keyFilePath)) {
      throw Error(
          `Client Secret file at path '${config.auth.keyFilePath}' does not exist.`)
    }

    if (!checkFileExistsSync(config.auth.savedTokensPath)) {
      throw Error(
          `Tokens file at path '${config.auth.savedTokensPath}' does not exist.`)
    }
  }

  this.cast = async (message) => {
    const assistant = new GoogleAssistant(config.auth);
    config.conversation.textQuery = `Broadcast ${message}`;

    console.log(`Sending message (${config.conversation.lang}):`,
        config.conversation.textQuery);

    return new Promise((resolve, reject) => {
      assistant
      .on("ready", () => assistant.start(config.conversation))
      .on("started", (conversation) => {
        conversation
        .on("response", (text) => {
          const response = text || "empty"
          console.log("[OK] Conversation Response: ", response);
          resolve(response);
        })
        .on('ended', (error, continueConversation) => {
          if (error) {
            console.log('[ERROR] Conversation Ended Error:', error);
          } else if (continueConversation) {
            console.log('[WARN] Conversation continue is not handled');
          } else {
            console.log('[OK] Conversation Completed');
            conversation.end();
          }
        })
        .on("error", (error) => {
          console.log("[ERROR] Error while broadcasting:", error);
          reject(new Error(`Error while broadcasting: ${error}`));
        })
      })
      .on("error", (error) => {
        console.log("[ERROR] Error while broadcasting: ", error);
        reject(new Error(`Error while broadcasting: ${error}`));
      });
    })
  }

  const checkFileExistsSync = filepath => {
    let exists = true;

    try {
      fs.accessSync(filepath, fs.constants.F_OK);
    } catch (e) {
      exists = false;
    }

    return exists;
  };
}

module.exports = Assistant;
