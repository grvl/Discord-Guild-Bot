// Load up the discord.js library
const Discord = require("discord.js");

// Create bot client
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

//Create spreadsheet
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet(config.sheetid);
var sheet;
 
//Function for getting a random integer
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Load the spreadsheet
async.series([
  function setAuth(step) {
    var creds = require("./IdiotBotAuth.json");
    doc.useServiceAccountAuth(creds, step);
  },
  function getInfoAndWorksheets(step) {
    doc.getInfo(function(err, info) {
      console.log('Loaded doc: '+info.title+' by '+info.author.email);
      sheet = info.worksheets[0];
      console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
      step();
    });
  },
], function(err){
    if( err ) {
      console.log('Error: '+err);
    }
});

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  // Change the "playing game"
  client.user.setActivity(`Adult WoE`);
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

try
{
client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  
  //Check if DM
  if(message.channel.type == "dm")
  {
	  console.log(message.author + message.content);
	  return;
  }
   
  //Only check specified server
  if(message.guild.id!=config.guildid) return;
  
  // Ignore bots
   if(message.author.bot) return;
  
  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if(message.content.indexOf(config.prefix) !== 0) return;
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "!say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  if(command === "help") {
	//Parse character name and get a random background/pose
    return message.reply("List of commands: \n !help \n !say \n !sig (Character name) \n !setatt (Yes/No) \n !setnote (Note) \n !setjobs (Jobs)");
  }
  
  if(command === "sig") {
	//Parse character name and get a random background/pose
    const characterName = args.join("%20");
	const randomBG = (getRandomInt(1,11));
	const randomPose = (getRandomInt(1,13));
    // And we get the bot to say the thing: 
    return message.reply('https://www.novaragnarok.com/ROChargenPHP/newsig/' +characterName+ '/' +randomBG+ '/' +randomPose);
	// ("My Bot's message", {files: ['https://www.novaragnarok.com/ROChargenPHP/newsig/' +characterName+ '/' +randomBG+ '/' +randomPose"]});
	//return message.reply({files: ['https://www.novaragnarok.com/ROChargenPHP/newsig/' +characterName+ '/' +randomBG+ '/' +randomPose]});
  }
  
  if(command === "say") {
	const attMember = message.member.user.username;
	  //Lock command to admin userid
	if(message.member.user.id!=config.adminid)
		return message.reply("Idiot");
    // makes the bot say something and delete the message
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
	console.log('Say: ' +attMember+ ' : ' +sayMessage);
  }
  
  if(command === "setatt") {
	//Make sure you are part of the roster before you can set your attendance
	if(!message.member.roles.some(r=>["core", "tryout", "guest"].includes(r.name)) )
		return message.reply("you are not worthy.");
	
	//Parse username and status
	const attMember = message.member.user.username;
	switch (args[0].toLowerCase()) {
		case "yes":
		attStatus = "Yes";
		break;
		
		case "no":
		attStatus = "No";
		break;
		
		default:
			return message.reply(`you can only set your attendance to yes or no.`);
	}
	
	//Get all cells in the first row
	sheet.getCells({
      'min-row': 1,
	  'max-row': 70,
	  'min-col': 1,
      'max-col': 5,
	  'return-empty': true
    }, function(err, cells) {
		var arrayLength = cells.length;
		//Check if any match your username
		for (var i = 0; i < arrayLength; i++) {
			if (cells[i].value==attMember && cells[i].col==3)
			{
			//If a match is found, update sheet and notify user
			if (cells[i+1].col = 4) //Make sure the column is right
			{
			cells[i+1].setValue(attStatus);
			console.log('Set attendance for ' +attMember+ ' to ' +attStatus);
			}
			return message.reply('```css\nAttendance: [' +attStatus+ ']\nJobs: ' +cells[i-2].value+ '\nNote: '+cells[i+2].value+ '```');
			}
		}
		//Notify if no match is found
		return message.reply(`I wasn't able to find you in the attendance sheet.`);
	})
  }
  
  if(command === "setjobs") {
	//Make sure you are part of the roster before you can set your jobs
	if(!message.member.roles.some(r=>["core", "tryout", "guest"].includes(r.name)) )
		return message.reply("you are not worthy.");
	
	//Parse username and status
	const attMember = message.member.user.username;
	const attStatus = args.join(" ");
	
	//Limit length to a max of 60 characters
	if (attStatus.length>60)
		return message.reply("your jobs message can have a maximum of 60 characters.");
	
	//Get all cells in the first row
	sheet.getCells({
      'min-row': 1,
	  'max-row': 70,
	  'min-col': 1,
      'max-col': 5,
	  'return-empty': true
    }, function(err, cells) {
		var arrayLength = cells.length;
		//Check if any match your username
		for (var i = 0; i < arrayLength; i++) {
			if (cells[i].value==attMember && cells[i].col==3)
			{
			//If a match is found, update sheet and notify user
			if (cells[i-2].col = 1) //Make sure the column is right
			{
				cells[i-2].setValue(attStatus);
				console.log('Set jobs for ' +attMember+ ' to ' +attStatus);
			}
			return message.reply('```css\nAttendance: ' +cells[i+1].value+ '\nJobs: [' +attStatus+ ']\nNote: '+cells[i+2].value+ '```');
			}
		}
		//Notify if no match is found
		return message.reply(`I wasn't able to find you in the attendance sheet.`);
	})
  }
  
    if(command === "setnote") {
	//Make sure you are part of the roster before you can set your jobs
	if(!message.member.roles.some(r=>["core", "tryout", "guest"].includes(r.name)) )
		return message.reply("you are not worthy.");
	
	//Parse username and status
	const attMember = message.member.user.username;
	const attStatus = args.join(" ");
	
	//Limit length to a max of 80 characters
	if (attStatus.length>80)
		return message.reply("your note can have a maximum of 80 characters.");
	//Get all cells in the first row
	sheet.getCells({
      'min-row': 1,
	  'max-row': 85,
	  'min-col': 1,
      'max-col': 5,
	  'return-empty': true
    }, function(err, cells) {
		var arrayLength = cells.length;
		//Check if any match your username
		for (var i = 0; i < arrayLength; i++) {
			if (cells[i].value==attMember && cells[i].col==3)
			{
			//If a match is found, update sheet and notify user
			if (cells[i+2].col = 5) //Make sure the column is right
			{
				cells[i+2].setValue(attStatus);
				console.log('Set note for ' +attMember+ ' to ' +attStatus);
			}
			return message.reply('```css\nAttendance: ' +cells[i+1].value+ '\nJobs: ' +cells[i-2].value+ '\nNote: [' +attStatus+ ']```');
			}
		}
		//Notify if no match is found
		return message.reply(`I wasn't able to find you in the attendance sheet.`);
	})
  }
  return;
});

client.login(config.token);
}
catch (e)
{
	console.log(e);
}