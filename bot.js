const Discord = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();

const BOT_TOKEN = 'YOUR_BOT_TOKEN';

const { Client, GatewayIntentBits } = require('discord.js'); //Initializes the Discord bot
const client = new Discord.Client({ 
    intents: [
      GatewayIntentBits.Guilds,         // Required for basic bot functionality
      GatewayIntentBits.GuildMembers,   // Required to access member presence
      GatewayIntentBits.GuildMessages,  //Required to send messages
    ]
  });

const database = new sqlite3.Database('codes.db');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  scrapeAndStoreCodes(client.channels.cache.get('1203485910604316733'));
});


async function scrapeAndStoreCodes(channel) {
    try {
      // Scrape codes from the website
      const scrapedCodes = await scrapeCodes();
  
      // Compare and update database
      await compareScrapeAndDatabase(scrapedCodes, channel);
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
  
  async function compareScrapeAndDatabase(scrapedCodes, channel) {
    try {
      // Retrieve existing codes from the database
      const existingCodes = await getAllCodesFromDatabase();
  
      // Find new codes to add to the database
      const newCodes = scrapedCodes.filter(code => !existingCodes.includes(code));
  
      // Find expired codes to remove from the database
      const expiredCodes = existingCodes.filter(code => !scrapedCodes.includes(code));

    // Check if there are no new codes and no expired codes
    if (newCodes.length === 0 && expiredCodes.length === 0) {
        channel.send('Codes are up to date. No changes needed.');
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
  
      channel.send(`Comparison complete. Added ${newCodes.length} new codes and removed ${expiredCodes.length} expired codes.`);
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
