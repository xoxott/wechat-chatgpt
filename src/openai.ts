/*
 * @Author: yangtao 212920320@qq.com
 * @Date: 2024-07-24 11:35:15
 * @FilePath: \wechat-chatgpt\src\openai.ts
 * @LastEditTime: 2024-07-24 11:36:42
 * @LastEditors: yangtao 212920320@qq.com
 * @Description: 
 */
import {
  Configuration,
  CreateImageRequestResponseFormatEnum,
  CreateImageRequestSizeEnum,
  OpenAIApi
} from "openai";
import fs from "fs";
import DBUtils from "./data.js";
import { config } from "./config.js";

const configuration = new Configuration({
  apiKey: config.openai_api_key,
  basePath: config.api,
});
const openai = new OpenAIApi(configuration);

/**
 * Get completion from OpenAI
 * @param username
 * @param message   
 */
async function chatgpt(username: string, message: string): Promise<string> {
  // 先将用户输入的消息添加到数据库中
  DBUtils.addUserMessage(username, message);
  const messages = DBUtils.getChatMessage(username);
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-0125",
    messages: messages,
    temperature: config.temperature,
  });
  let assistantMessage = "";
  try {
    if (response.status === 200) {
      if (response.data.choices && response.data.choices.length > 0) {
        const choice = response.data.choices[0]
        if (choice.message && choice.message.content) {
          assistantMessage = choice.message.content.replace(/^\n+|\n+$/g, "") as string
        }
      }

    } else {
      console.log(`Something went wrong,Code: ${response.status}, ${response.statusText}`)
    }
  } catch (e: any) {
    if (e.request) {
      console.log("请求出错");
    }
  }
  return assistantMessage;
}

/**
 * Get image from Dall·E
 * @param username
 * @param prompt
 */
async function dalle(username: string, prompt: string) {
  const response = await openai.createImage({
    prompt: prompt,
    n: 1,
    size: CreateImageRequestSizeEnum._256x256,
    response_format: CreateImageRequestResponseFormatEnum.Url,
    user: username
  }).then((res) => res.data).catch((err) => console.log(err));
  if (response) {
    return response.data[0].url;
  } else {
    return "Generate image failed"
  }
}

/**
 * Speech to text
 * @param username
 * @param videoPath
 */
async function whisper(username: string, videoPath: string): Promise<string> {
  const file: any = fs.createReadStream(videoPath);
  const response = await openai.createTranscription(file, "whisper-1")
    .then((res) => res.data).catch((err) => console.log(err));
  if (response) {
    return response.text;
  } else {
    return "Speech to text failed"
  }
}

export { chatgpt, dalle, whisper };