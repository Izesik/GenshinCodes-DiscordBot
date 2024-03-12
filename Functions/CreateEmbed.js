const { EmbedBuilder } = require('discord.js');
module.exports = CreateEmbed;

function CreateEmbed (title, description, fieldTitle, fieldValue) {

    const embed = new EmbedBuilder()
    .setColor('#d7c7d9') // You need to specify a color here
    .setTitle(title)
    .setDescription(description)
    .addFields(
        { name: fieldTitle, value: fieldValue }
    )
    .setTimestamp()
    .setFooter({ text: 'Data Source: Eurogamer.net' });

return embed;
}

