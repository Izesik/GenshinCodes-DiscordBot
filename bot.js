const Discord = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();
const fs = require('node:fs');
const path = require('node:path');

const BOT_TOKEN = 'YOUR TOKEN HERE';

const { Client, GatewayIntentBits, Collection, Events } = require('discord.js'); //Initializes the Discord bot
const client = new Discord.Client({ 
    intents: [
      GatewayIntentBits.Guilds,         // Required for basic bot functionality
      GatewayIntentBits.GuildMembers,   // Required to access member presence
      GatewayIntentBits.GuildMessages,  //Required to send messages
    ]
  });

client.commands = new Collection();

//#region CommandSetUp

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

//#endregion

const database = new sqlite3.Database('codes.db');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const config = require('./config'); 

//Handles Command Interaction events.
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // Handle different slash commands
  if (commandName === 'checkcodes') {
    // Call the scraping function and reply to the user
    const user = interaction.user;
    const userMention = `<@${user.id}>`;

    scrapeAndStoreCodes(client.channels.cache.get('1203485910604316733'), true, userMention);
    interaction.reply(`Checking for codes...`);
  }
});



async function scrapeAndStoreCodes(channel, userPrompt, userMention) {
    try {
      // Scrape codes from the website
      const scrapedCodes = await scrapeCodes();
  
      // Compare and update database
      if (userPrompt) 
      {
        await compareScrapeAndDatabase(scrapedCodes, channel, true, userMention);
      } else if (!userPrompt) 
      {
        await compareScrapeAndDatabase(scrapedCodes, channel, false, userMention);
      }
      
    } catch (error) {
      console.error('Error scraping and storing codes:', error.message);
      channel.send('An error occurred while scraping and storing codes. Please try again later.');
    }
  }
  
  async function scrapeCodes() {
    const response = await axios.get('https://www.eurogamer.net/genshin-impact-codes-livestream-active-working-how-to-redeem-9026');
    const $ = cheerio.load(response.data);
    const codeElements = $('li strong');
    return codeElements.map((index, element) => $(element).html()).get();
  }
  
  async function compareScrapeAndDatabase(scrapedCodes, channel, userPrompt, userMention) {
    try {
      // Retrieve existing codes from the database
      const existingCodes = await getAllCodesFromDatabase();
  
      // Find new codes to add to the database
      const newCodes = scrapedCodes.filter(code => !existingCodes.includes(code));
  
      // Find expired codes to remove from the database
      const expiredCodes = existingCodes.filter(code => !scrapedCodes.includes(code));

    // Check if there are no new codes and no expired codes
    if (newCodes.length === 0 && expiredCodes.length === 0) {
        if (userPrompt) {
          channel.send('Codes are up to date. No changes needed.');
          return;
        }
        return;
      }
  
      // Add new codes to the database
      await Promise.all(newCodes.map(async (code) => {
        await storeCodeInDatabase(code);
      }));
  
      // Remove expired codes from the database
      await Promise.all(expiredCodes.map(async (code) => {
        await removeCodeFromDatabase(code);
      }));

      //Announce to the discord server there are new codes.
      const genshinRole = config.getRole(channel.guild.id) || '1203602424158228532'; //The discord role that will be alerted of the codes.
      const mentionRole = `<@&${genshinRole}>`;
      if (newCodes.length == 1) 
      {
        if (userPrompt) 
        {
          const message = `${userMention} There is a new PROMO code for Genshin! The code is **${newCodes[0]}**.`;
          channel.send(message);
        } else 
        { 
          const message = `${mentionRole} There is a new PROMO code for Genshin! The code is **${newCodes[0]}**.`;
          channel.send(message);
        }
      } else if (newCodes.length > 1) 
      {
        if (userPrompt) 
        {
          const formattedCodes = newCodes.map(code => `• **${code}**`).join('\n');
          const message = `${userMention} There are multiple new PROMO codes for Genshin!\n${formattedCodes}`;
          channel.send(message);
        } else 
        {
          const formattedCodes = newCodes.map(code => `• **${code}**`).join('\n');
          const message = `${mentionRole} There are multiple new PROMO codes for Genshin!\n${formattedCodes}`;
          channel.send(message);
        }
      }
      
    } catch (error) {
      console.error('Error comparing and updating codes:', error.message);
      channel.send('An error occurred while comparing and updating codes. Please try again later.');
    }
  }

// Function to store a code in the SQLite database
function storeCodeInDatabase(code) {
  database.run('INSERT INTO codes (code) VALUES (?)', [code], (err) => {
    if (err) {
      console.error('Error storing code in database:', err.message);
    }
  });
}

// Function to retrieve all codes from the database
function getAllCodesFromDatabase() {
    return new Promise((resolve, reject) => {
      database.all('SELECT code FROM codes', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const codes = rows.map(row => row.code);
          resolve(codes);
        }
      });
    });
  }

// SQLite database setup
database.serialize(() => {
  database.run('CREATE TABLE IF NOT EXISTS codes (id INTEGER PRIMARY KEY, code TEXT NOT NULL)');
});



// Replace 'YOUR_BOT_TOKEN' with your actual bot token
client.login(BOT_TOKEN);
