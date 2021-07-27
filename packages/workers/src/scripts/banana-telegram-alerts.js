process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BANANAGRAM;
const bot = new TelegramBot(token, {polling: true});

let users = [];

bot.on('message', (msg) => {
    if(users.indexOf(msg.chat.id) == -1) {
        bot.sendMessage(msg.chat.id,"Hi I will let you know when you have bananas ready.");
        setInterval(function() {bot.sendMessage(msg.chat.id, "🍌🍌🍌🍌 You have new bananas ready! 🍌🍌🍌🍌"); }, 20000);
        users.push(msg.chat.id);
    } else {
        bot.sendMessage(msg.chat.id,"Please wait your bananas are not ready yet!");
    }
});

