const Discord = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();

const BOT_TOKEN = 'MTIwMTk0NzAxNDk2MzY1ODg1Mg.GSDI1U.bZYSTLGrkv5XCyu9HC3aoK4pGqf_pLlC7Hlhlc';

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


// Function to scrape codes from the website and store them in the database
async function scrapeAndStoreCodes(channel) {
  try {
    // Make a request to the website
    const response = await axios.get('https://www.eurogamer.net/genshin-impact-codes-livestream-active-working-how-to-redeem-9026');

      // Log the HTML content for inspection
      //console.log(response.data);
    
    // Load the HTML content using cheerio
    const $ = cheerio.load(response.data);

    // Select the HTML elements containing the codes
    const codeElements = $('li strong');

    // Extract codes from the list items
    const codes = codeElements.map((index, element) => $(element).html()).get();

    // Log the extracted codes for inspection
    console.log('Extracted codes:', codes);

    // Store codes in the database
    codes.forEach((code) => {
      storeCodeInDatabase(code);
    });

    // Notify the channel about the successful code scrape
    channel.send(`Scraped ${codes.length} codes and stored them in the database.`);
  } catch (error) {
    console.error('Error scraping codes:', error.message);
    channel.send('An error occurred while scraping codes. Please try again later.');
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

// SQLite database setup
database.serialize(() => {
  database.run('CREATE TABLE IF NOT EXISTS codes (id INTEGER PRIMARY KEY, code TEXT NOT NULL)');
});

// Replace 'YOUR_BOT_TOKEN' with your actual bot token
client.login(BOT_TOKEN);
