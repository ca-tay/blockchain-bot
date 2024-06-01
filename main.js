const { Client, Intents, MessageEmbed } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const axios = require('axios');
require('dotenv').config(); 
const fs = require('fs');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

const API_URL = 'https://bvc-blockchain.vercel.app/';

const dbFilePath = './db.json';

let db;
try {
  db = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
} catch (error) {
  db = { wallets: {} };
}

const saveDb = () => {
  fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2), 'utf8');
};

const commands = [
  {
    name: 'createwallet',
    description: 'Create a new wallet',
    options: [
      {
        name: 'username',
        type: 3, 
        description: 'The username for the new wallet',
        required: true
      }
    ]
  },
  {
    name: 'getpublickey',
    description: 'Get public key from username',
    options: [
      {
        name: 'username',
        type: 3, 
        description: 'The username to get the public key for',
        required: true
      }
    ]
  },
  {
    name: 'createtransaction',
    description: 'Create a new transaction',
    options: [
      {
        name: 'amount',
        type: 10, 
        description: 'The amount for the transaction',
        required: true
      },
      {
        name: 'payer',
        type: 3, 
        description: 'The payer of the transaction',
        required: true
      },
      {
        name: 'payee',
        type: 3, 
        description: 'The payee of the transaction',
        required: true
      }
    ]
  },
  {
    name: 'checkbalancepublickey',
    description: 'Check balance using public key',
    options: [
      {
        name: 'publickey',
        type: 3, 
        description: 'The public key to check the balance for',
        required: true
      }
    ]
  },
  {
    name: 'balance',
    description: 'Check balance using username',
    options: [
      {
        name: 'username',
        type: 3, 
        description: 'The username to check the balance for',
        required: true
      }
    ]
  }
];

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const executeCommand = async (commandName, options, user, interaction, prefixCommand = false) => {
  switch (commandName) {
    case 'createwallet':
      if (db.wallets[user.id]) {
        const embed = new MessageEmbed()
          .setTitle('Error')
          .setDescription('You already have a wallet.')
          .setColor('RED');
        await interaction.reply({ embeds: [embed] });
        return;
      }

      const username = options.getString ? options.getString('username') : options[0];
      try {
        const response = await axios.post(`${API_URL}/addWallet`, { username });
        const { privateKey } = response.data;

        db.wallets[user.id] = { username, privateKey };
        saveDb();

        const embed = new MessageEmbed()
          .setTitle('Wallet Created')
          .setDescription(`Wallet created successfully. Your private key is: ${privateKey}`)
          .setColor('GREEN');

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        const embed = new MessageEmbed()
          .setTitle('Error')
          .setDescription(`Error: ${error.response ? error.response.data : error.message}`)
          .setColor('RED');

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
      break;

    case 'getpublickey':
      const usernameToGetKey = options.getString ? options.getString('username') : options[0];
      try {
        const response = await axios.get(`${API_URL}/getPublicKeyFromUsername`, {
          data: { username: usernameToGetKey }
        });
        const embed = new MessageEmbed()
          .setTitle('Public Key')
          .setDescription(response.data.message ? response.data.message : `Public Key for ${usernameToGetKey}: ${response.data.publicKey}`)
          .setColor('BLUE');

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        const embed = new MessageEmbed()
          .setTitle('Error')
          .setDescription(`Error: ${error.response ? error.response.data : error.message}`)
          .setColor('RED');

        await interaction.reply({ embeds: [embed] });
      }
      break;

    case 'createtransaction':
      const amount = options.getNumber ? options.getNumber('amount') : parseFloat(options[0]);
      const payer = options.getString ? options.getString('payer') : options[1];
      const payee = options.getString ? options.getString('payee') : options[2];

      if (!db.wallets[user.id] || db.wallets[user.id].username !== payer) {
        const embed = new MessageEmbed()
          .setTitle('Unauthorized')
          .setDescription('You are not authorized to make transactions from this wallet.')
          .setColor('RED');

        await interaction.reply({ embeds: [embed] });
        return;
      }

      try {
        const privateKey = db.wallets[user.id].privateKey;
        const response = await axios.post(`${API_URL}/createTransaction`, {
          amount,
          payer,
          payee,
          privateKey
        });

        const embed = new MessageEmbed()
          .setTitle('Transaction Created')
          .setDescription(response.data.message)
          .setColor('GREEN');

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        const embed = new MessageEmbed()
          .setTitle('Error')
          .setDescription(`Error: ${error.response ? error.response.data : error.message}`)
          .setColor('RED');

        await interaction.reply({ embeds: [embed] });
      }
      break;

    case 'checkbalancepublickey':
      const publicKeyToCheck = options.getString ? options.getString('publickey') : options[0];
      try {
        const response = await axios.get(`${API_URL}/checkBalance/publicKey`, {
          data: { publicKey: publicKeyToCheck }
        });

        const embed = new MessageEmbed()
          .setTitle('Balance')
          .setDescription(response.data.message ? response.data.message : `Balance for public key ${publicKeyToCheck}: ${response.data.balance}`)
          .setColor('BLUE');

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        const embed = new MessageEmbed()
          .setTitle('Error')
          .setDescription(`Error: ${error.response ? error.response.data : error.message}`)
          .setColor('RED');

        await interaction.reply({ embeds: [embed] });
      }
      break;

    case 'balance':
      const usernameToCheck = options.getString ? options.getString('username') : options[0];
      try {
        const response = await axios.get(`${API_URL}/checkBalance/username`, {
          data: { username: usernameToCheck }
        });

        const embed = new MessageEmbed()
          .setTitle('Balance')
          .setDescription(response.data.message ? response.data.message : `Balance for username ${usernameToCheck}: ${response.data.balance}`)
          .setColor('BLUE');

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        const embed = new MessageEmbed()
          .setTitle('Error')
          .setDescription(`Error: ${error.response ? error.response.data : error.message}`)
          .setColor('RED');

        await interaction.reply({ embeds: [embed] });
      }
      break;

    case 'help':
      const helpEmbed = new MessageEmbed()
        .setTitle('Help')
        .setDescription('List of commands:\n' +
          '1. `/createwallet <username>` or `$createwallet <username>` - Create a new wallet\n' +
          '2. `/getpublickey <username>` or `$getpublickey <username>` - Get public key from username\n' +
          '3. `/createtransaction <amount> <payer> <payee>` or `$createtransaction <amount> <payer> <payee>` - Create a new transaction\n' +
          '4. `/checkbalancepublickey <publickey>` or `$checkbalancepublickey <publickey>` - Check balance using public key\n' +
          '5. `/balance <username>` or `$balance <username>` - Check balance using username')
        .setColor('BLUE');

      await interaction.reply({ embeds: [helpEmbed] });
      break;

    default:
      const defaultEmbed = new MessageEmbed()
        .setTitle('Unknown Command')
        .setDescription('Unknown command')
        .setColor('RED');

      await interaction.reply({ embeds: [defaultEmbed] });
  }
};

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options, user } = interaction;
  executeCommand(commandName, options, user, interaction);
});

client.on('messageCreate', async message => {
  if (!message.content.startsWith('$') || message.author.bot) return;

  const args = message.content.slice(1).split(' ');
  const commandName = args.shift().toLowerCase();
  executeCommand(commandName, args, message.author, message, true);
});

client.login(process.env.TOKEN);
