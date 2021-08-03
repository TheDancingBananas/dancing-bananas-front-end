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
    let time_out = 20000;
    const minute = 1000 * 60;

    if(msg.text.includes('/start')) {
       user = -1;
       let text_array = msg.text.split(" ");
       time_out = (text_array.length == 2) ? parseInt(text_array[1]) : 20000
    } else {
       get_user(msg.chat.id);
    }



    if(user == -1) {
        if(get_user(msg.chat.id) == -1) {
            bot.sendMessage(msg.chat.id, "🍌I'm the Dancing Banana Monkey Bot!🍌");
        }

        const minutes_left = parseInt(time_out / minute);

        bot.sendMessage(msg.chat.id,`🙊🙊🙊In ${minutes_left} minutes, I will let you know when you have bananas ready! 🙊🙊🙊`);

        let new_user = {
            id: msg.chat.id,
            hash: '',
            notified: false
        };

        setTimeout(function() {
                bot.sendMessage(msg.chat.id, "⏰ ⏰ ⏰ It's time! You have new pools ready to play and you have new banana rewards to collect! ⏰ ⏰ ");
                bot.sendMessage(msg.chat.id, "🍌🍌🍌🍌 Click https://dancingbananas.fun/ and let's go Bananas! 🍌🍌🍌🍌");
                new_user.notified = true;
            }, time_out);


        //users.push(new_user);
        if (users.indexOf(new_user) === -1) users.push(new_user);
    } else {
        if(!user.notified) {
            bot.sendMessage(msg.chat.id,"Please wait your bananas are not ready yet!");
        } else {
            bot.sendMessage(msg.chat.id, "Go to https://dancingbananas.fun/ if you want to be notified again! 🍌🍌🍌🍌");
        }
    }
});

