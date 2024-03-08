const Discord = require('discord.js');
const { Permissions, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();
const fs = require('node:fs');
const schedule = require('node-schedule');
const path = require('node:path');
const CreateEmbed = require('./Functions/CreateEmbed');
const DiscordBot = require ('./Data/DiscordBot.json');
const exp = require('node:constants');
const { parse, stringify } = require('bigint-json');

const { Buffer } = require('buffer');
const bigintBuffer = require('bigint-buffer');

const TOKEN = DiscordBot.TOKEN;
console.log(TOKEN);

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
const discordIdDatabase = new sqlite3.Database('discordID.db');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

//let's store the current guild and create generic channel and mention role ids 
client.on('guildCreate', async (guild) => {

  const defaultChannel = guild.systemChannel;
  const defaultRole = guild.roles.everyone;

  //lets see if this guild is already in the database
  storeDefaultsinDatabase(guild.id, defaultChannel.id, defaultRole.id);

  console.log(`Default channel and role set for guild ${guild.name}`);
});

//The daily job will send a message to every server the bot is apart of.
const dailyJob = schedule.scheduleJob('*/10 * * * * *', async () => {
  console.log('Running daily scrape and store command...');

  if (!discordIdDatabase.open) {
    return;
  }
  // Retrieve channel IDs from the database
  const idDatabase = await getIDsFromDatabase();
  console.log(idDatabase)

  EmbedDetails = await updateCodes(false);

  for (const entry of idDatabase) {
    const guildId = entry.guildId;
    console.log(guildId);
    var mentionRole = entry.mentionRoleId;
    var channelID = entry.channelId;

    try {
      console.log(`Processing channel ID: ${channelID}`);
      //Check if EmbedDetails returned anything, if not there are no new codes.
      if (EmbedDetails) {
        const Embed = CreateEmbed(EmbedDetails.title, EmbedDetails.description, EmbedDetails.fieldTitle, EmbedDetails.fieldValue)
        const channel = client.channels.cache.get(channelID);
        //Check if channel exists, if not lets set the channel to the guild's system channel.
        if (channel) {
          const mention = mentionRole === 'everyone' ? '@everyone' : `<@&${mentionRole}>`;
          channel.send({content: `${mention}`, embeds: [Embed]});
        } else {
          console.log (`Channel with ID ${channelID} not found, assigning channel to guild's system channel`);
          guild = client.guilds.cache.get(guildId);
          //Check if guild or the guild's system channel exists, if not the bot must not be in that guild so let's remove it from the database.
          if (guild && guild.systemChannel) 
          {
            guild.systemChannel.send({content: `<@&${mentionRole}>`, embeds: [Embed]});
          } else {
            console.log(`The guild ${guildId} was not found or has no system channel. Removing it from the database.`);
            await removeGuildFromDatabase(guildId);
          }
        }
      } else {
        console.log('No new codes');
        continue;
      }
      console.log(`Scrape and store completed for channel ${channelID}`);
    } catch (error) {
        console.error(`Error occurred while processing channel ${channelID}:`, error.message);
    }
 
  }
  console.log('Daily scrape and store completed for all channels.');
});

//#region Command Interactions
//Handles Command Interaction events.
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const guildID = interaction.guildId;

  const { commandName } = interaction;

  // Handle different slash commands
  if (commandName === 'checkcodes') {
    // Call the scraping function and reply to the user
    const user = interaction.user;
    const userMention = `<@${user.id}>`;

    const channel = await getChannelIDFromGuild(guildID);

    EmbedDetails = await updateCodes(true)
    const Embed = CreateEmbed(EmbedDetails.title, EmbedDetails.description, EmbedDetails.fieldTitle, EmbedDetails.fieldValue)

    interaction.reply({embeds: [Embed]});
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

    const Embed = CreateEmbed("ALL CURRENTLY ACTIVE PROMO CODES FOR GENSHIN IMPACT", " ", "CODES", formattedCodes)

    if (codes.length > 0) 
    {
      interaction.reply({embeds: [Embed]});
    } else 
    {
      interaction.reply(`There are currently no promo codes for Genshin Impact. Please check back later.`)
    }
   
  }

  if (commandName === 'setchannel') 
  {
    const guildRow = await getGuildSettingsFromDatabase(guildID);

    // Check if the user has the necessary permissions (e.g., ADMINISTRATOR)
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply('You do not have permission to use this command.');
    }

    // Retrieve the selected channel from the interaction
    const channelId = interaction.options.getChannel('channel');

    await updateChannelIdInDatabase(guildID, channelId.id);
    console.log(channelId);

    interaction.reply(`Genshin Codes will now send alerts to ${channelId.name}`);
  }

  if (commandName === 'setrole') 
  {
      // Check if the user has the necessary permissions (e.g., ADMINISTRATOR)
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply('You do not have permission to use this command.');
      }
  
      // Retrieve the selected role from the interaction
      const role = interaction.options.getRole('role');

      await updateRoleIdInDatabase(guildID, role.id);
      interaction.reply(`Announcement role set to ${role.name}`);
  }
});
//#endregion
  async function scrapeCodes() {
    const response = await axios.get(DiscordBot.WEBSITE);
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
  
  async function updateCodes(userPrompt) {
    
    const scrapedCodes = await scrapeCodes();

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
      console.log(expiredCodes);


      // Check if there are no new codes and no expired codes
      if (newCodes.length === 0 && expiredCodes.length === 0) {
        if (userPrompt) {
            // Return an object with the relevant information
            return {
                title: 'Genshin Codes Bot',
                description: '#1 Source for the latest Genshin Codes!',
                fieldTitle: '**CODES**',
                fieldValue: 'There are no new codes at this time.'
            };
        }
        // Return undefined if userPrompt is false
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

      //Generate Embed object fields for the Embed message.
      if (newCodes.length == 1) 
      {
        return {
          title: '**🚨NEW CODE ALERT**',
          description: 'There is a new PROMO code for Genshin!',
          fieldTitle: '**CODES**',
          fieldValue: `The code is **${newCodesAndDescriptions[0].code}** ${newCodesAndDescriptions[0].description}.`
        };
      } else if (newCodes.length > 1) 
      {
          const formattedCodes = newCodesAndDescriptions.map(entry => `• **${entry.code}** ${entry.description}`).join('\n');
          return {
            title: '**🚨NEW CODES ALERT**',
            description: 'There are multiple new PROMO codes for Genshin!!',
            fieldTitle: '**NEW CODES**',
            fieldValue: `\n${formattedCodes}`
          };
      }
      
    } catch (error) {
      console.error('Error comparing and updating codes:', error.message);
      discordChannel.send('An error occurred while comparing and updating codes. Please try again later.');
    }
  }
//#region DATABASE
// stores code(s) and description(s) in the SQLite database
function storeCodeInDatabase(code, description) {
  database.run('INSERT INTO codes (code, description) VALUES (?, ?)', [code, description], (err) => {
    if (err) {
      console.error('Error storing code and description in database:', err.message);
    }
  });
}
// Removes code(s) from the database
async function removeCodeFromDatabase(code, description) {
  return new Promise((resolve, reject) => {
    database.run('DELETE FROM codes WHERE code = ? AND description = ?', [code, description], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
// Stores GuildID into the discordID database
function storeDefaultsinDatabase(guildID, defaultChannel, defaultRole) 
{
  discordIdDatabase.run('INSERT INTO discordId (guildId, channelId, mentionRoleId) VALUES (?, ?, ?)', [guildID, defaultChannel, defaultRole], (err) => {
    if (err) {
      console.error('Error storing guild ID in database: ', err.message);
    }
  });
}
async function removeGuildFromDatabase(guildID) {
  return new Promise((resolve, reject) => {
    discordIdDatabase.run('DELETE FROM discordID WHERE guildId = ?', [guildID], function(err) {
      if (err) {
        reject(err);
        return;
      }
      const changes = this.changes || 0;
      resolve(changes);
      console.log(`Rows affected: ${changes}`);
      if (changes === 0) {
        console.log(`Guild with ID ${guildID} not found in database`);
      } else {
        console.log(`Guild successfully removed from database: ${guildID}`);
      }
    });
  });
}
// Retrieves guild settings from the database based on guild ID
async function getGuildSettingsFromDatabase(guildId) {
  return new Promise((resolve, reject) => {
      // Perform database query to select settings based on guild ID
      discordIdDatabase.get('SELECT * FROM discordID WHERE guildId = ?', [guildId], (err, row) => {
          if (err) {
              reject(err); // Reject promise if there's an error
          } else {
              resolve(row); // Resolve promise with row data
          }
      });
  });
}
// Retrieves channel ID from the database based on guild ID
async function getChannelIDFromGuild(guildId) {
  return new Promise((resolve, reject) => {
      // Perform database query to select channel ID based on guild ID
      discordIdDatabase.get('SELECT channelId FROM discordID WHERE guildId = ?', [guildId], (err, row) => {
          if (err) {
              reject(err); // Reject promise if there's an error
          } else {
              if (row) {
                  resolve(row.channelId); // Resolve promise with channel ID
              } else {
                  resolve(null); // Resolve with null if no matching row is found
              }
          }
      });
  });
}
async function getAllChannelIDsFromDatabase() {
  return new Promise((resolve, reject) => { 
    discordIdDatabase.all('SELECT channelId FROM discordID', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const channelIds = rows.map(row => row.channelId);
        resolve(channelIds);
      }
    });
  });
}
async function getRoleIDFromGuild(guildId) {
  return new Promise((resolve, reject) => {
    // Perform database query to select role ID based on guild ID
    discordIdDatabase.get('SELECT mentionRoleId FROM discordID WHERE guildId = ?', [guildId], (err, row) => {
      console.log("RoleID: ", row);
        if (err) {
            reject(err); // Reject promise if there's an error
        } else {
            if (row) {
                resolve(row.mentionRoleId); // Resolve promise with role ID
            } else {
                resolve(null); // Resolve with null if no matching row is found
            }
        }
    });
});
}
// Updates channel ID in the database for a specific guild ID
async function updateChannelIdInDatabase(guildId, channelId) {
  return new Promise((resolve, reject) => {
      // Perform database query to update channel ID based on guild ID
      discordIdDatabase.run('UPDATE discordID SET channelId = ? WHERE guildId = ?', [channelId, guildId], function(err) {
          if (err) {
              reject(err); // Reject promise if there's an error
          } else {
              resolve(); // Resolve promise if update is successful
          }
      });
  });
}
// Updates role ID in the database for a specific guild ID
async function updateRoleIdInDatabase(guildId, roleId) {
  return new Promise((resolve, reject) => {
      // Perform database query to update channel ID based on guild ID
      discordIdDatabase.run('UPDATE discordID SET mentionRoleId = ? WHERE guildId = ?', [roleId, guildId], function(err) {
          if (err) {
              reject(err); // Reject promise if there's an error
          } else {
              resolve(); // Resolve promise if update is successful
          }
      });
  });
}
async function getIDsFromDatabase() {
  return new Promise((resolve, reject) => { 
    discordIdDatabase.all('SELECT guildId, channelId, mentionRoleId FROM discordID', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const ids = rows.map(row => ({ 
          guildId: row.guildId,
          channelId: row.channelId,
          mentionRoleId: row.mentionRoleId
        }));
        resolve(ids);
      }
    });
  });
}
// Retrieves all codes and descriptions from the database
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

// SQLite Discord ID Database setup
discordIdDatabase.serialize(() => {
  discordIdDatabase.run(`CREATE TABLE IF NOT EXISTS discordID (guildId TEXT PRIMARY KEY, channelId TEXT, mentionRoleId TEXT)`);
});

//#endregion

// Replace 'YOUR_BOT_TOKEN' with your actual bot token
client.login(TOKEN);
