# Genshin Code Finder Discord Bot

## Overview

The Genshin Code Finder Discord bot is a powerful tool designed to enhance your Genshin Impact experience. It automatically fetches and notifies users of the latest Genshin Impact redemption codes, making sure your community stays up-to-date with the latest in-game rewards.

## Features

- **Code Scraping:** The bot regularly scans a designated website for the latest Genshin Impact codes and stores them with descriptions.
- **Automatic Alerts:** Notifies a Discord server when new codes are found and removes expired codes from the database.
- **Scheduled Scans:** Automatically checks the website every day at 1pm EST to keep the codes database up to date.
- **Manual Scans:** Users can force the bot to scrape the website and check for any new codes.
- **Code List Request:** Users can request a list of all active codes along with their descriptions.
- **Latest Code Request:** Users can quickly get the latest Genshin Impact code.
- **Admin Commands:** Admins can assign the role to be alerted and set the channel for the bot to send messages.
- **Default Configuration:** The bot automatically assigns a default channel and role upon joining a server.
- **Error Handling:** Implemented error catching to ensure the bot's stability.

## Setup
This bot is currently designed to be locally added to a server by cloning this repository. The roadmap includes plans to have this bot serversided and deployed on discord bots websites to be added with ease. 

### Prerequisites

- Node.js
- npm (Node Package Manager)

### Dependencies
- [Discord.js](https://discord.js.org/)
- [Cheerio](https://cheerio.js.org/)
- [Axios](https://axios-http.com/)
- Node-Schedule
- SQLite3




