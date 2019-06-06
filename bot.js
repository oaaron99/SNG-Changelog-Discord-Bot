const mysql = require('mysql');
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');

let guild = null;
let messageChannel = null;
let commandChannel = null;
let updatesRoles = null;

let con = mysql.createConnection({

    host: config.db.host,
    user: config.db.username,
    password: config.db.password,
    database: config.db.database

});

con.connect(function(err) {

    if (err) {
        console.error("[" + getDate() + "] " + err);
        process.exit();
        return;
    }
     
    log("Info", 'MYSQL connected');

});

client.on('ready', () => {
    
    client.user.setActivity('for updates', { type: 'WATCHING' })

    guild = client.guilds.first();
    if (guild == null) {
        log("Error", "Unable to find guild");
        process.exit();
    }

    messageChannel = guild.channels.find(x => x.name === config.message_channel);
    if (messageChannel == null) {
        log("Error", "Unable to find the message channel");
        process.exit();
    }

    commandChannel = guild.channels.find(x => x.name === config.command_channel);
    if (commandChannel == null) {
        log("Error", "Unable to find the command channel");
        process.exit();
    }

    updatesRoles = guild.roles.find(x => x.name === config.updates_role);
    if (commandChannel == null) {
        log("Error", "Unable to find the updates role");
        process.exit();
    }

    log("Info", `${client.user.tag} connected`);

});

client.on('message', async message => {
    
    if (message.author.bot) {
        return;
    }

    if (!message.guild) {
        return;
    }

    if (message.content.indexOf(config.message_prefix) !== 0) {
        return;
    }

    const args = message.content.slice(config.message_prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command == "updates") {

        if (!hasUpdatesRole(message.member)) {
            message.reply("You don't have permission to use this command");
            return;
        }

        if (args.length != 1) {
            message.reply("Invalid syntax: !updates <@member>");
            return;
        }

        let target = message.mentions.members.first();
        if(!target) {
            message.reply("Please mention a valid member of this server");
            return;
        }

        if (hasUpdatesRole(target)) {
            message.reply(target.displayName + " already has the updates role");
            return;
        }

        target.addRole(updatesRoles);
        message.reply(target.displayName + " now has the role")
    
        log("Info", `${message.member.user.tag} used the !updates command`);
        return;
    }

    if (message.channel.name != config.command_channel) {
        return;
    }

    if (command == "commands" || command == "cmds") {

        let commandList = "!commands, !updates, ";
        config.commands.forEach(element => {
            commandList += "!" + element.command + ", ";
        });

        commandList = commandList.substring(0, commandList.length - 2);
        commandChannel.send(commandList);

        log("Info", `${message.member.user.tag} used the !commands command`);
        return;
    }

    config.commands.forEach(element => {
        if (command == element.command) {
            commandChannel.send(element.reminder);
            messageChannel.send(element.message).then(function (message) {
                message.react('🤠');
            });
            insertShoutboxMessage(element.shoutbox);
            log("Info", `${message.member.user.tag} used the !${element.command} command`);
            return;
        }
    });

});

function hasUpdatesRole(member) {

    return member.roles.some(r=>[config.updates_role].includes(r.name));

}

function getDate() {

    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

}

function insertShoutboxMessage(message) {

    const escapedMessage = con.escape(message);
    let sql = "INSERT INTO `" + config.db.table + "` (user, chat, time) VALUES (8761, " + escapedMessage + ", " + Math.floor(new Date() / 1000) + ")";
    con.query(sql, function (err, result) {
        if (err) {
            log("Error", "Failed to submit shoutbox message " + err);
            return;
        }
    });
    
}

function log(type, message) {

    if (config.logging) {
        console.log("[" + getDate() + "] " + type + ": " + message)
    }

};

client.login(config.bot_token);