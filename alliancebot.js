function updateTableAndReturn(message, err, cells, member, valueToSet, valueName, colWithValue)	
{
	var arrayLength = cells.length;
	//Check if any match your user ID
	for (var i = 0; i < arrayLength; i++) {
		// Col 5 is the col with IDs
		if (cells[i].value == member && cells[i].col == 5)
		{
			//If a match is found, update sheet and notify user
			if (cells[i+(colWithValue-5)].col == colWithValue) //Make sure the column is right
			{
				cells[i+(colWithValue-5)].setValue(valueToSet);
				
				const successMessage = 'Set ' + valueName + ' for ' + cells[i-1].value + ' to ' + valueToSet;
				console.log(successMessage);
				message.channel.send(successMessage);
			}
			
			return message.reply('```css\nAttendance: [' +cells[i+1].value+ ']\nWeapon: [' + cells[i-3].value + ']\nCombat power: [' + cells[i-2].value + ']\nNote: ['+cells[i+2].value+ ']```');
		}
	}
	//Notify if no match is found
	return message.reply(`I wasn't able to find you in the attendance sheet.`);
}

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
  client.user.setActivity(`Tribe Wars`);
});

client.on("error", () => {
	console.error;
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
  
  // Returns list of available commands
  if(command === "help") {
    return message.reply("List of commands: \n !help \n !register (name class weapon cp) !setatt (Yes/No) \n !setnote (Note) \n !setwep (Weapon name / both) \n !setcp (combat power number)");
  }
  
  // Makes the bot say something and delete the message
  if(command === "say") {
	const attMember = message.member.user.username;
	// Lock command to admin userid
	if(message.member.user.id!=config.adminid)
		return message.reply("Idiot");
	
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
	
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
	
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
	console.log('Say: ' +attMember+ ' : ' +sayMessage);
	return;
  }
  
  //For the next commands, only people with these roles can use them
  if(!message.member.roles.some(r=>["tribe-wars"].includes(r.name)) )
		return message.reply("Please sign up to the roster before using this command.");
	

  //Parse user ID
  const attMember = message.member.user.id;
  
  //char_name class weapon combat_power
  if(command === "register") {
	if (args.length != 4)
	{
		return message.reply(`Correct command usage: !register name class weapon cp`);
	}
	
	//Get all cells in the first row
	sheet.getCells({
      'min-row': 1,
	  'max-row': 99,
	  'min-col': 1,
      'max-col': 7,
	  'return-empty': true
    }, function(err, cells) {
		var arrayLength = cells.length;
		//Check if any match your user ID
		for (var i = 0; i < arrayLength; i++) 
		{
			// Col 5 is the col with IDs		
			if (cells[i].value == attMember && cells[i].col == 5)
			{
				return message.reply('You\'re already registered! ```css\nCharacter: [' +cells[i-1].value+ ']\nClass: [' +cells[i-4].value+ ']\nWeapon: [' + cells[i-3].value + ']\nCombat power: [' + cells[i-2].value + ']```');
			}
			
			// Empty line
			else if (cells[i].value == '' && cells[i].col == 5)
			{
				cells[i].setValue(attMember); // Discord ID
				cells[i-1].setValue(args[0]); // char name
				cells[i-4].setValue(args[1]); // class
				cells[i-3].setValue(args[2]); // weapon
				cells[i-2].setValue(args[3]); // combat power
				return message.reply('Character registered successfully. ```css\nCharacter registered: [' +cells[i-1].value+ ']\nClass: [' +cells[i-4].value+ ']\nWeapon: [' + cells[i-3].value + ']\nCombat power: [' + cells[i-2].value + ']```');
			}
		}
		//Notify if no match is found
		return message.reply(`The sheet is full, talk to an administrator to update it.`);
	})
  }
  
  if(command === "setatt") {	
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
	  'max-row': 99,
	  'min-col': 1,
      'max-col': 7,
	  'return-empty': true
    }, function(err, cells) {
		return updateTableAndReturn(message, err, cells, attMember, attStatus, 'attendance', 6);
	})
  }
  
  if(command === "setwep") {
	const attStatus = args.join(" ");
	
	//Limit length to a max of 60 characters
	if (attStatus.length>60)
		return message.reply("your weapon message can have a maximum of 60 characters.");
	
	//Get all cells in the first row
	sheet.getCells({
      'min-row': 1,
	  'max-row': 99,
	  'min-col': 1,
      'max-col': 7,
	  'return-empty': true
    }, function(err, cells) {
		return updateTableAndReturn(message, err, cells, attMember, attStatus, 'weapon', 2);
	})
  }
  
  if(command === "setcp") {	
	const attStatus = args.join(" ");
	
	//Limit length to a max of 7 characters
	if (attStatus.length>7)
		return message.reply("your combat power can have a maximum of 7 characters.");
	
	//Get all cells in the first row
	sheet.getCells({
      'min-row': 1,
	  'max-row': 99,
	  'min-col': 1,
      'max-col': 7,
	  'return-empty': true
    }, function(err, cells) {
		return updateTableAndReturn(message, err, cells, attMember, attStatus, 'Combat power', 3);
	})
  }
  
    if(command === "setnote") {
	const attStatus = args.join(" ");
	
	//Limit length to a max of 80 characters
	if (attStatus.length>80)
		return message.reply("your note can have a maximum of 80 characters.");
	
	//Get all cells in the first row
	sheet.getCells({
      'min-row': 1,
	  'max-row': 99,
	  'min-col': 1,
      'max-col': 7,
	  'return-empty': true
    }, function(err, cells) {
		return updateTableAndReturn(message, err, cells, attMember, attStatus, 'Note', 7);
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