const Discord = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();
const fs = require('node:fs');
const schedule = require('node-schedule');
const path = require('node:path');

const BOT_TOKEN = '';

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

//lets assign the default role and channel
client.on('guildCreate', async (guild) => {
  // Check if the default channel and role are not set
  if (!config.channel || !config.announcementRole) {
    // Get the default channel and role from the guild (you can customize this logic)
    const defaultChannel = guild.channels.cache.find(channel => channel.type === 'text');
    const defaultRole = guild.roles.cache.find(role => role.name === 'everyone');

    // Update the configuration with default values
    config.channel = defaultChannel ? defaultChannel.id : null;
    config.announcementRole = defaultRole ? defaultRole.id : null;

    console.log(`Default channel and role set for guild ${guild.name}`);
  }
});

const dailyJob = schedule.scheduleJob('00 13 * * *', async () => {
  console.log('Running daily scrape and store command...');
  // Call your scrape and store function here
  await scrapeAndStoreCodes(client.channels.cache.get(config.channel), false, '1234');
  console.log('Daily scrape and store completed.');
});

const config = require('./config'); 

//#region Command Interactions
//Handles Command Interaction events.
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // Handle different slash commands
  if (commandName === 'checkcodes') {
    // Call the scraping function and reply to the user
    const user = interaction.user;
    const userMention = `<@${user.id}>`;

    scrapeAndStoreCodes(client.channels.cache.get(config.channel), true, userMention);
    interaction.reply(`Checking for codes...`);
  }

  if (commandName === 'latestcode') 
  {
    const codes = await getAllCodesFromDatabase();
    
    if (codes.length > 0) 
    {
      const latestCode = codes[0];
      interaction.reply(`The latest code for Genshin Impact is: **${latestCode.code}** ${latestCode.description}`);
  
    } else 
    {
      interaction.reply(`There are currently no promo codes for Genshin Impact. Please check back later.`)
    }
    
  }

  if (commandName === 'activecodes') 
  {
    const codes = await getAllCodesFromDatabase();
    const formattedCodes = codes.map(entry => `• **${entry.code}** ${entry.description}`).join('\n');

    if (codes.length > 0) 
    {
      interaction.reply(`Here are all the currently active promo codes for Genshin Impact \n${formattedCodes}`);
    } else 
    {
      interaction.reply(`There are currently no promo codes for Genshin Impact. Please check back later.`)
    }
   
  }
});
//#endregion

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

    const codesWithDescriptions = [];

    $('li').each((index, element) => {
      const liText = $(element).html().trim();
  
      // Extract code from the <strong> tag
      const codeMatch = liText.match(/<strong>(.*?)<\/strong>/);
      const code = codeMatch ? codeMatch[1].trim() : '';
  
      // Extract description (text after <strong> tag)
      const description = liText.replace(/<strong>.*?<\/strong>/, '').trim();
  
      if (code) {
        codesWithDescriptions.push({ code, description });
      }
    });
  
    return codesWithDescriptions;
  }
  
  async function compareScrapeAndDatabase(scrapedCodes, channel, userPrompt, userMention) {
    try {

      // Retrieve existing codes and descriptions from the database
      const existingCodesAndDescriptions = await getAllCodesFromDatabase();

      // Extract existing codes from the existingCodesAndDescriptions array
      const existingCodes = existingCodesAndDescriptions.map(entry => entry.code);

      // Extract existing descriptions from the existingCodesAndDescriptions array
      const existingDescriptions = existingCodesAndDescriptions.map(entry => entry.description);

      // Find new codes and descriptions to add to the database
      const newCodesAndDescriptions = scrapedCodes.filter(entry => {
      return !existingCodes.includes(entry.code) || !existingDescriptions.includes(entry.description);
    });

      // Find expired codes and descriptions to remove from the database
      const expiredCodesAndDescriptions = existingCodesAndDescriptions.filter(entry => {
      return !scrapedCodes.some(scrapedEntry =>
      scrapedEntry.code === entry.code && scrapedEntry.description === entry.description
      );
    });

      // Extract only the codes from newCodesAndDescriptions
      const newCodes = newCodesAndDescriptions.map(entry => entry.code);

      // Extract only the codes from expiredCodesAndDescriptions
      const expiredCodes = expiredCodesAndDescriptions.map(entry => entry.code);


      // Check if there are no new codes and no expired codes
      if (newCodes.length === 0 && expiredCodes.length === 0) {
        if (userPrompt) {
          channel.send('Codes are up to date.');
          return;
        }
        return;
      }
  
      // Add new codes to the database
      await Promise.all(newCodesAndDescriptions.map(async ({ code, description }) => {
      await storeCodeInDatabase(code, description);
      }));

  
      // Remove expired codes from the database
      await Promise.all(expiredCodesAndDescriptions.map(async ({code, description}) => {
        await removeCodeFromDatabase(code, description);
      }));

      //Announce to the discord server there are new codes.
      const genshinRole = config.announcementRole || '1203602424158228532'; //The discord role that will be alerted of the codes.
      const mentionRole = `<@&${genshinRole}>`;
      //if a user prompted the commmand, lets @ them if not lets @ the selected announcementrole.
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
          const formattedCodes = newCodesAndDescriptions.map(entry => `• **${entry.code}** ${entry.description}`).join('\n');
          const message = `${userMention} There are multiple new PROMO codes for Genshin!\n${formattedCodes}`;
          channel.send(message);
        } else 
        {
          const formattedCodes = newCodesAndDescriptions.map(entry => `• **${entry.code}** ${entry.description}`).join('\n');
          const message = `${mentionRole} There are multiple new PROMO codes for Genshin!\n${formattedCodes}`;
          channel.send(message);
        }
      }
      
    } catch (error) {
      console.error('Error comparing and updating codes:', error.message);
      channel.send('An error occurred while comparing and updating codes. Please try again later.');
    }
  }

// Function to store a code and description in the SQLite database
function storeCodeInDatabase(code, description) {
  database.run('INSERT INTO codes (code, description) VALUES (?, ?)', [code, description], (err) => {
    if (err) {
      console.error('Error storing code and description in database:', err.message);
    }
  });
}


// Function to remove a code from the database
function removeCodeFromDatabase(code, description) {
  return new Promise((resolve, reject) => {
    database.run('DELETE FROM codes WHERE code = ?', [code, description], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Function to retrieve all codes and descriptions from the database
function getAllCodesFromDatabase() {
  return new Promise((resolve, reject) => {
    database.all('SELECT code, description FROM codes', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const codesAndDescriptions = rows.map(row => ({ code: row.code, description: row.description }));
        resolve(codesAndDescriptions);
      }
    });
  });
}

// SQLite database setup
database.serialize(() => {
  database.run('CREATE TABLE IF NOT EXISTS codes (id INTEGER PRIMARY KEY, code TEXT NOT NULL, description TEXT)');
});

// Replace 'YOUR_BOT_TOKEN' with your actual bot token
client.login(BOT_TOKEN);
