const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');

client.on('ready', () => {
   log("Info", `${client.user.tag} connected`);
});

client.on('message', msg => {
    
});

function log(type, message) {
    if (config.logging) {
        console.log("[" + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + "] " + type + ": " + message)
    }
};

client.login(config.bot_token);