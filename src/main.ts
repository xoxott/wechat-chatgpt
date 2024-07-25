/*
 * @Author: yangtao 212920320@qq.com
 * @Date: 2023-09-19 07:23:32
 * @FilePath: \wechat-chatgpt\src\main.ts
 * @LastEditTime: 2024-07-25 13:15:05
 * @LastEditors: yangtao 212920320@qq.com
 * @Description: 
 */

import { WechatyBuilder } from "wechaty";
import QRCode from "qrcode";
import { ChatGPTBot } from "./bot.js";
import { config } from "./config.js";
import http from 'http'
const chatGPTBot = new ChatGPTBot();
const bot = WechatyBuilder.build({
  name: "wechat-assistant", // generate xxxx.memory-card.json and save login data for the next login
  puppet: "wechaty-puppet-wechat",
  puppetOptions: {
    uos: true
  }
});

let url = '', code = ''
async function main() {
  const initializedAt = Date.now()
  bot
    .on("scan", async (qrcode, status) => {
      url = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`;
      code = await QRCode.toString(qrcode, { type: "terminal", small: true })
      console.log(`Scan QR Code to login: ${status}\n${url}`);
      console.log(code);
    })
    .on("login", async (user) => {
      chatGPTBot.setBotName(user.name());
      console.log(`User ${user} logged in`);
      console.log(`私聊触发关键词: ${config.chatPrivateTriggerKeyword}`);
      console.log(`已设置 ${config.blockWords.length} 个聊天关键词屏蔽. ${config.blockWords}`);
      console.log(`已设置 ${config.chatgptBlockWords.length} 个ChatGPT回复关键词屏蔽. ${config.chatgptBlockWords}`);
    })
    .on("message", async (message) => {
      if (message.date().getTime() < initializedAt) {
        return;
      }
      if (message.text().startsWith("/ping")) {
        await message.say("pong");
        return;
      }
      try {
        await chatGPTBot.onMessage(message);
      } catch (e) {
        console.error(e);
      }
    });

  try {
    await bot.start();
    http.createServer(async function (request, response) {
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
      response.end(`地址:${url}\n${code}`);
    }).listen(config.port);
  } catch (e) {
    console.error(
      `⚠️ Bot start failed, can you log in through wechat on the web?: ${e}`
    );
  }
}
main();


