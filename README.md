<h1 align="center"><a href="https://isaacnunez.com" target="_blank" rel="noreferrer">Genshin Codes Discord Bot</a></h1>
<h6 align="center">A powerful bot designed to enhance your Genshin Impact experience.</h6>


<h5>It automatically fetches and notifies users of the latest Genshin Impact redemption codes, making sure your community stays up-to-date with the latest in-game rewards.
</h5>

<h3>Features</h3>

- **Web Scraping**: The bot uses web scraping techniques to fetch the latest Genshin Impact codes from specified websites or sources.

- **Real-time Alerts**: Whenever new codes are discovered, the bot immediately sends alerts to Discord servers that have subscribed to its service.

- **Embed Message**s: Alerts are sent as embed messages, which are visually appealing and provide all the necessary information about the new codes.

- **Supports Commands** - The bot supports commands out of the box so no need to figure out a prefix. `/CheckCodes` will force the bot to scrape the source for example.
  
- **Customizable**: Customize what channels and roles the bot utlitizes to send and alert within Discord servers.

<h3>Forking this repository</h3>
I made this bot open source to allow anyone to improve upon it and customize it to fit their server's needs beyond what I provide and add in the future. So please feel free to use the code to help your needs and by all means make this bot even better than what I could do in the time I had. All I ask is that you provide proper credit back to this repository. 

Also if you'd like to submit your changes to be merged here, feel free to do so or reach out to me at isaacnunez2002@gmail.com

> [!IMPORTANT]
> The bot is specifically designed to scrape and pull codes from <a href="https://www.eurogamer.net/genshin-impact-codes-livestream-active-working-how-to-redeem-9026" target="_blank" rel="noreferrer">Eurogamer.net</a> as i needed to design the scrape to look in specific sections of the articles HTML.
> So if you find a better source, you will have to rework the `ScrapeCodes` function to handle that. 

<h3>Installation and Set Up</h3>
<h6>Looking to dive into the source code and customize the bot itself? Follow these instructions to get started!</h6>

1. Fork Repository
2. Create your own Discord bot in the <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">Discord Developer Portal</a>
3. Install and use the correct version of Node using NVM

   ```
   nvm install
   ```
4. Install dependencies
   
   ```
   npm install
   ```
   
5. Update `TOKEN` In `DiscordBot.json` to your Discord bot token

    ```
   {
        "TOKEN": "YOUR_BOT_TOKEN", <----- UPDATE THIS
        "BOTNAME": "Name",
        "WEBSITE": "URL"
    }
   ```
   
7. Run the bot
   
   ```
   node bot.js
   ```

8. Enjoy and customize as you please!



