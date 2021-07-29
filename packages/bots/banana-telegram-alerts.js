process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BANANAGRAM;
const bot = new TelegramBot(token, {polling: true});

let users = [];

function get_user(id) {
    let result = -1;

    for (const user of users) {
        if (user.id == id) {
            result = user;
            break;
        }
    }

    return result;
}

bot.on('message', (msg) => {
    let user = get_user(msg.chat.id);

    if(user == -1) {
        bot.sendMessage(msg.chat.id,"🍌I'm the Dancing Banana Monkey Bot!🍌");
        bot.sendMessage(msg.chat.id,"🙊🙊🙊In X hours, I will let you know when you have bananas ready! 🙊🙊🙊");

        setTimeout(function() {bot.sendMessage(msg.chat.id, "🍌🍌🍌🍌 You have new bananas ready! 🍌🍌🍌🍌"); }, 20000);

        let new_user = {
            id: msg.chat.id,
            hash: ''
        };

        users.push(new_user);
    } else {
            bot.sendMessage(msg.chat.id,"Please wait your bananas are not ready yet!");
    }
});

