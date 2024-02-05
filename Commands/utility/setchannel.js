const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, PermissionsBitField } = require('discord.js');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Set the channel you want Genshin Codes to post in!')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Select the channel')
        .setRequired(true)
    ),
  async execute(interaction) {
  
    // Check if the user has the necessary permissions (e.g., ADMINISTRATOR)
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply('You do not have permission to use this command.');
    }

    // Retrieve the selected role from the interaction
    const channel = interaction.options.getChannel('channel');
    config.channel = channel.id;

    // Your logic to store the selected role goes here...
    interaction.reply(`Genshin Codes will now send alerts to ${channel.name}`);
  },
};