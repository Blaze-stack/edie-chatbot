const Discord = require('discord.js');
const fs = require('fs');
const path = require("path");

//load config 
const config = require('config');
const TOKEN = config.get('token');
const prefix = config.get('prefix');
const owner_id = config.get('owner_id');
const useTimeout = config.get('useTimeout');
const timeout = config.get('timeout');

//use Absolute Path
//const data_path = config.get('data_path');
//const backup_path = config.get('backup_path');

//use Relative Path
const data_path = path.join(__dirname, '/data').split(path.sep).join(path.posix.sep);
const backup_path = path.join(__dirname, '/backups').split(path.sep).join(path.posix.sep);

const replyFactor = config.get('replyFactor');
const learnChance = config.get('learnChance');
const wordsToFilter = config.get('wordsToFilter');
const filter_mode = config.get('filter_mode');

const learnChannelFilter = config.get('learnChannelFilter');
const sendChannelFilter = config.get('sendChannelFilter');
let queue = config.get('queue');
let pingChance = config.get('pingChance');

const client = new Discord.Client();
const { exitCode, send } = require('process');
//load data
const raw = fs.readFileSync(`${data_path}/patterns.json`);
let patterns = JSON.parse(raw);
let userIDRaw = fs.readFileSync(`${data_path}/users.json`);
let userID = JSON.parse(userIDRaw)



async function main() {

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    client.on('ready', () => {
        let name = client.user.username;
        let id = client.user.id;
        console.log(`Instance launched under user: ${name}`);
        console.log(`User ID: ${id}`);
    });
    //start chatbot logic 
    const filterMessages = (message) => {
        if (filter_mode.toLowerCase() == "blacklist"){
            if (message.content.includes('http') || message.content.includes('\n') || message.content.includes('discord.gg') || learnChannelFilter.indexOf(message.channel.id) == -1) return '';
        } else {
            if (message.content.includes('http') || message.content.includes('\n') || message.content.includes('discord.gg') || learnChannelFilter.indexOf(message.channel.id) !== -1) return '';
        }
        speech = message.content.replace(/[!<@>\d]/g, '');
        speech = speech.replace(/:\w*:/g, '');
        for (let i = 0; i < wordsToFilter.length; i++) {
            if (speech.toLowerCase().includes(wordsToFilter[i])) return '';
        };
        return speech;
    };

    const getReplyTime = () => {
        let time = Math.floor(Math.random() * replyFactor);
        if (time < 3500) {
            return time * 7;
        } else {
            return time;
        }

    };

    const sendRand = (message) => {
        message.channel.send(patterns.speechPatterns[Math.floor(Math.random() *
            patterns.speechPatterns.length)]).catch(() => { });
        queue--;
        message.channel.stopTyping();

    };

    const writeMessages = (speech) => { //write new speech patterns to file
        if (Math.random() < learnChance) {
            if (speech.length === 0) return;
            for (let i = 0; i < patterns.speechPatterns.length; i++) {
                if (patterns.speechPatterns[i] == speech) return;
            };
            patterns.speechPatterns.push(speech);
            fs.writeFile(`${data_path}/patterns.json`, JSON.stringify(patterns), () => { });
        }
    };

    const replyMessages = (message, speech) => {
        let name = client.user.username.toLowerCase();
        if (Math.random() < 0.2 && !message.content.toLowerCase().includes(name) &&
            !message.content.includes(client.user.id)) {
            common = commonFound(message);
            if (common != null) {
                message.channel.stopTyping();
                setTimeout(() => {
                    message.channel.startTyping()
                }, Math.random() * 7000);
                queue++;
                setTimeout(() => {
                    message.channel.send(common).catch(() => { });
                    queue--
                    message.channel.stopTyping();
                }, getReplyTime());
                return;
            } else {
                if (Math.random() <
                    pingChance) {
                    message.channel.stopTyping();
                    setTimeout(() => {
                        message.channel.startTyping()
                    }, Math.random() * 7000);
                    queue++;
                    setTimeout(() => {
                        message.channel.send(
                            `<@${message.author.id}> ${patterns.speechPatterns[Math.floor(Math.random() * patterns.speechPatterns.length)]}`
                        ).catch(() => { });
                        queue--;
                        message.channel.stopTyping();
                    }, getReplyTime());
                } else {
                    setTimeout(() => {
                        message.channel.startTyping()
                    }, Math.random() * 7000);
                    queue++;
                    setTimeout(() => {
                        sendRand(message)
                    }, getReplyTime());
                }
            }
        }
    };

    const commonFound = (message) => {
        message.content = message.content.replace(/[!<@>\d]/g, '');
        message.content = message.content.replace(/:\w*:/g, '');
        let commonSpeech = null;
        for (let i = 0; i < patterns.speechPatterns.length; i++) {
            if (patterns.speechPatterns[i].includes(message.content) && patterns
                .speechPatterns[i] != message.content) {
                commonSpeech = patterns.speechPatterns[i];
                return commonSpeech;
            }
        };
    };

    const nameHeard = (message) => {
        let name = client.user.username.toLowerCase();
        if (message.content.toLowerCase().includes(name) || message.content
            .includes(client.user.id)) {
            common = commonFound(message);
            message.content = message.content.replace(/[!<@>\d]/g, '');
            message.content = message.content.replace(/:\w*:/g, '');
            if (common != null) {
                message.channel.stopTyping();
                setTimeout(() => {
                    message.channel.startTyping()
                }, Math.random() * 7000);
                queue++;
                setTimeout(() => {
                    message.channel.send(common).catch(() => { });
                    queue--;
                    message.channel.stopTyping();
                }, getReplyTime());
                return;
            } else {
                message.channel.stopTyping();
                setTimeout(() => {
                    message.channel.startTyping()
                }, Math.random() * 7000);
                queue++;
                setTimeout(() => {
                    sendRand(message)
                }, getReplyTime());
            }
        }
    };

    const initDM = async (message) => {
        if (message.author.tag == client.user.tag) {
            return;
        }
        for (let i = 0; i < userID.userIDs.length; i++) {
            if (userID.userIDs[i].includes(message.author.id)) {
                return;
            }
        }
        userID.userIDs.push(message.author.id);
        fs.writeFile('users.json', JSON.stringify(userID), () => { });
        await sleep(10000)
        message.channel.startTyping()
        await sleep(7500)
        message.channel.send("heyyy")
        message.channel.stopTyping()
        message.channel.startTyping()
        await sleep(25000)
        await message.channel.send(`what do you want to talk ab?`)
        message.channel.stopTyping()
    }
    //end chatbot logic

    //start embed logic
    function makeRequest(data) { //main embed method
        return new Promise(resolve => {
            let options = {
                host: "em.0x71.cc",
                path: "/",
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };
            let https = require("https");
            callback = function (response) {
                var str = '';

                response.on('data', function (chunk) {
                    str += chunk;
                });

                response.on('end', function () {
                    let id = JSON.parse(str).id;
                    let url = `https://em.0x71.cc/${id}`
                    resolve(url);
                });
            }
            let request = https.request(options, callback);
            request.write(data);
            request.end();
        });
    }

    const randomColor = () => { //random color for embeds
        let color = '';
        for (let i = 0; i < 6; i++) {
            const random = Math.random();
            const bit = (random * 16) | 0;
            color += (bit).toString(16);
        };
        return color;
    };

    const error_msg = (message, err_string) => {
        if (typeof err_string !== 'undefined' && err_string) { //if not undefined
            let err_msg = `An error occurred whilist trying to proccess your request.\n\nError string:\n${err_string}`
            let err_embed = JSON.stringify({
                title: 'Error',
                description: err_msg,
                color: "D0021B"
            });
            makeRequest(err_embed).then(resp_data => {
                if (useTimeout.toLowerCase() !== "false") {
                    message.channel.send(resp_data).then(msg => {
                        setTimeout(() => msg.delete(), timeout)
                    }).catch(err => {
                        console.error(err)
                    });
                } else {
                    message.channel.send(resp_data)
                }
            });
        } else { //else unkown error
            let err_embed = JSON.stringify({
                title: 'Error',
                description: "An unknown error has occured.",
                color: "D0021B"
            });
            makeRequest(err_embed).then(resp_data => {
                if (useTimeout.toLowerCase() !== "false") {
                    message.channel.send(resp_data).then(msg => {
                        setTimeout(() => msg.delete(), timeout)
                    }).catch(err => {
                        console.error(err)
                    });
                } else {
                    message.channel.send(resp_data)
                }
            });
        }
    }

    client.on('message', async message => {
        let rcolor = randomColor();
        let userAvatar = client.user.avatarURL;

        if (message.content.toLowerCase() == `${prefix}ping`) {
            let ping_embed = JSON.stringify({
                title: 'Pong!',
                image: userAvatar,
                color: rcolor
            });
            makeRequest(ping_embed).then(resp_data => {
                message.channel.send(resp_data).then(msg => {
                    setTimeout(() => msg.delete(), timeout)
                }).catch(err => {
                    console.error(err)
                });
            });
        } else if (message.content.toLowerCase() == `${prefix}help`) { //normal help
            if (owner_id.indexOf(message.author.id) !== -1) { //if is owner
                let helpmsg = `${prefix}shutdown\n  | stops current instance\n\n${prefix}backup <name>\n    | makes a backup of current training set\n\n${prefix}load <name>\n    | loads a backed up training set (after a backup)\n\n${prefix}wipe\n  | wipes the current training set (after a backup)\n`
                let help_embed_admin = JSON.stringify({
                    title: 'Admin Help',
                    description: helpmsg,
                    image: userAvatar,
                    color: rcolor
                });
                makeRequest(help_embed_admin).then(resp_data => {
                    if (useTimeout.toLowerCase() !== "false") {
                        message.channel.send(resp_data).then(msg => {
                            setTimeout(() => msg.delete(), timeout)
                        }).catch(err => {
                            console.error(err)
                        });
                    } else {
                        message.channel.send(resp_data)
                    }
                });
            } else {
                let helpmsg = `${prefix}help\n| lists commands \n\n${prefix}ping\n| pings the bot\n\n`
                let help_embed = JSON.stringify({
                    title: 'Help',
                    description: helpmsg,
                    image: userAvatar,
                    color: rcolor
                });
                makeRequest(help_embed).then(resp_data => {
                    if (useTimeout.toLowerCase() !== "false") {
                        message.channel.send(resp_data).then(msg => {
                            setTimeout(() => msg.delete(), timeout)
                        }).catch(err => {
                            console.error(err)
                        });
                    } else {
                        message.channel.send(resp_data)
                    }
                });
            }
            // } else if (message.channel.type == "dm") {
            //     initDM(message)
        } else if (owner_id.indexOf(message.author.id) !== -1) {
            if (message.content.toLowerCase() == `${prefix}shutdown`) {
                let shutdown_embed = JSON.stringify({
                    title: 'Shutting Down.',
                    color: "FF0000"
                });
                makeRequest(shutdown_embed).then(resp_data => {
                    message.channel.send(resp_data).then(msg => {
                        setTimeout(() => msg.delete(), timeout)
                    }).catch(err => {
                        console.error(err)
                    });
                });
                console.log("Shutting down...")
                await sleep(2500)
                process.exit(1)
            } else if (message.content.toLowerCase() == `${prefix}wipe`) {
                let date_time = new Date();
                let date = ("0" + date_time.getDate()).slice(-2);
                let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
                let year = date_time.getFullYear();
                let hours = date_time.getHours();
                let minutes = date_time.getMinutes();
                let seconds = date_time.getSeconds();
                let timestamp = `${date}-${month}-${year}-time-${hours}-${minutes}-${seconds}`
                let backupName = `training-data-backup-${timestamp}.json`
                let wipe_msg = `Making a backup of training data...\n\nBackup Name:\n${backupName}\n\nBackup Location:\n${backup_path}\n\n\nGoodbye!`
                let wipe_embed = JSON.stringify({
                    title: 'Wiping Training Data',
                    description: wipe_msg,
                    color: rcolor
                });
                makeRequest(wipe_embed).then(resp_data => {
                    if (useTimeout.toLowerCase() !== "false") {
                        message.channel.send(resp_data).then(msg => {
                            setTimeout(() => msg.delete(), timeout)
                        }).catch(err => {
                            console.error(err)
                        });
                    } else {
                        message.channel.send(resp_data)
                    }
                });
                fs.writeFile(`${backup_path}/${backupName}`, raw, function (err) {
                    if (err) {
                        error_msg(message, err);
                        return console.log(err);
                    }
                })
                fs.writeFile(`${data_path}/patterns.json`, '{"speechPatterns":[]}', function (err) {
                    if (err) {
                        error_msg(message, err);
                        return console.log(err);
                    }
                })

            } else if (message.content.toLowerCase().includes(`${prefix}load`)) {
                let filename = message.content.toLowerCase().replace(`${prefix}load `, "")
                console.log(`Loading training data from: ${filename}`)
                let date_time = new Date();
                let date = ("0" + date_time.getDate()).slice(-2);
                let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
                let year = date_time.getFullYear();
                let hours = date_time.getHours();
                let minutes = date_time.getMinutes();
                let seconds = date_time.getSeconds();
                let timestamp = `${date}-${month}-${year}-time-${hours}-${minutes}-${seconds}`
                let backupName = `training-data-backup-${timestamp}.json`
                let load_msg = `Loading training data from file...\n\nFilename:\ntraining-data-backup-${filename}.json\n\n\nMaking a backup...\n\nBackup Name:\n${backupName}\n\nBackup Location:\n${backup_path}\n\n\nGoodbye!`
                let load_embed = JSON.stringify({
                    title: 'Loading Training Data',
                    description: load_msg,
                    color: rcolor
                });
                makeRequest(load_embed).then(resp_data => {
                    if (useTimeout.toLowerCase() !== "false") {
                        message.channel.send(resp_data).then(msg => {
                            setTimeout(() => msg.delete(), timeout)
                        }).catch(err => {
                            console.error(err)
                        });
                    } else {
                        message.channel.send(resp_data)
                    }
                });

                fs.writeFile(`${backup_path}/${backupName}`, raw, function (err) {
                    if (err) {
                        error_msg(message, err);
                        return console.log(err);
                    }
                })
                let backup = fs.readFileSync(`${backup_path}/training-data-backup-${filename}.json`)
                console.log(backup)
                fs.writeFile(`${data_path}/patterns.json`, backup, function (err) {
                    if (err) {
                        error_msg(message, "No backup found!");
                        return console.log(err)
                    }
                })

            } else if (message.content.toLowerCase().includes(`${prefix}backup`)) {
                let filename = message.content.toLowerCase().replace(`${prefix}backup `, "")
                filename = filename.replace(" ", "")
                if (!filename) {
                    let date_time = new Date();
                    let date = ("0" + date_time.getDate()).slice(-2);
                    let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
                    let year = date_time.getFullYear();
                    let hours = date_time.getHours();
                    let minutes = date_time.getMinutes();
                    let seconds = date_time.getSeconds();
                    let timestamp = `${date}-${month}-${year}-time-${hours}-${minutes}-${seconds}`
                    let default_backup_name = `training-data-backup-${timestamp}.json`
                    let backup_msg = `Making a backup of training data under default name.\n\nBackup Name:\n${default_backup_name}\n\nBackup Location:\n${backup_path}\n\n\nGoodbye!`
                    let backup_embed = JSON.stringify({
                        title: 'Backing Up Training Data',
                        description: backup_msg,
                        color: rcolor
                    });
                    makeRequest(backup_embed).then(resp_data => {
                        if (useTimeout.toLowerCase() !== "false") {
                            message.channel.send(resp_data).then(msg => {
                                setTimeout(() => msg.delete(), timeout)
                            }).catch(err => {
                                console.error(err)
                            });
                        } else {
                            message.channel.send(resp_data)
                        }
                    });
                    fs.writeFile(`${backup_path}/${default_backup_name}`, raw, function (err) {
                        if (err) {
                            error_msg(message, err);
                            return console.log(err);
                        }
                    })
                } else {
                    let custom_backup_name = `training-data-backup-${filename}.json`
                    let backup_msg = `Making a backup of training data.\n\nBackup Name:\n${custom_backup_name}\n\nBackup Location:\n${backup_path}\n\n\nGoodbye!`
                    let backup_embed = JSON.stringify({
                        title: 'Backing Up Training Data',
                        description: backup_msg,
                        color: rcolor
                    });
                    makeRequest(backup_embed).then(resp_data => {
                        if (useTimeout.toLowerCase() !== "false") {
                            message.channel.send(resp_data).then(msg => {
                                setTimeout(() => msg.delete(), timeout)
                            }).catch(err => {
                                console.error(err)
                            });
                        } else {
                            message.channel.send(resp_data)
                        }
                    });
                    fs.writeFile(`${backup_path}/${custom_backup_name}`, raw, function (err) {
                        if (err) {
                            error_msg(message, err);
                            return console.log(err);
                        }
                    })
                }
            } else { //send messages for owners too
                if (queue > 2) return;
                if (message.author.tag == client.user.tag || message.author.bot == true || message.content.length > 1200) {
                    return;
                }
                if (filter_mode.toLowerCase() == "blacklist") {
                    if (sendChannelFilter.indexOf(message.channel.id) !== -1) { //if not present in blacklist then do send logic
                        //send no message if channel is blacklisted
                        speechPattern = filterMessages(message);
                        writeMessages(speechPattern);
                    } else {
                        //not blacklisted so messages sent
                        speechPattern = filterMessages(message);
                        writeMessages(speechPattern);
                        replyMessages(message, speechPattern)
                        nameHeard(message);
                    }
                } else {
                    if (sendChannelFilter.indexOf(message.channel.id) !== -1) { //if is present in whitelist then do send logic
                        //send a message if the channel is whitelisted
                        speechPattern = filterMessages(message); //create patterns from incoming data
                        writeMessages(speechPattern);            //save pattern data
                        replyMessages(message, speechPattern);   //reply to ppl who mention it
                        nameHeard(message);                      ////react to name
                    } else {
                        //not whitelisted so no message sent
                        speechPattern = filterMessages(message);
                        writeMessages(speechPattern);
                    }
                }
            }
        } else { //learning
            if (queue > 2) return;
            if (message.author.tag == client.user.tag || message.author.bot == true || message.content.length > 1200) {
                return;
            }
            if (filter_mode.toLowerCase() == "blacklist") {
                if (sendChannelFilter.indexOf(message.channel.id) !== -1) { //if not present in blacklist then do send logic
                    //send no message if channel is blacklisted
                    speechPattern = filterMessages(message);
                    writeMessages(speechPattern);
                } else {
                    //not blacklisted so messages sent
                    speechPattern = filterMessages(message);
                    writeMessages(speechPattern);
                    replyMessages(message, speechPattern)
                    nameHeard(message);
                }
            } else {
                if (sendChannelFilter.indexOf(message.channel.id) !== -1) { //if is present in whitelist then do send logic
                    //send a message if the channel is whitelisted
                    speechPattern = filterMessages(message); //create patterns from incoming data
                    writeMessages(speechPattern);            //save pattern data
                    replyMessages(message, speechPattern);   //reply to ppl who mention it
                    nameHeard(message);                      ////react to name
                } else {
                    //not whitelisted so no message sent
                    speechPattern = filterMessages(message);
                    writeMessages(speechPattern);
                }
            }

        }
    });

    client.login(TOKEN);
}

main()