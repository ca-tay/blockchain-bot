const { Client, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const axios = require('axios');
require('dotenv').config(); 

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

const URL = 'https://bvclockchain-findof1s-projects.vercel.app';

// Yeah it's not too clean, this was rushed. I will make the command handler later

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
      name: 'minepublickey',
      description: 'Mine blocks for a wallet using public key',
      options: [
        {
          name: 'publickey',
          type: 3, 
          description: 'The public key of the miner',
          required: true
        }
      ]
    },
    {
      name: 'mineusername',
      description: 'Mine blocks for a wallet using username',
      options: [
        {
          name: 'username',
          type: 3, 
          description: 'The username of the miner',
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



client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  switch (commandName) {


    case 'createwallet':
      const username = options.getString('username');
      try {
        const response = await axios.post(`${URL}/addWallet`, { username });
        await interaction.reply(response.data.message);
      } catch (error) {
        await interaction.reply(`Error: ${error.response.data}`);
      }
      break;

    case 'getpublickey':
      const usernameToGetKey = options.getString('username');
      try {
        const response = await axios.get(`${URL}/getPublicKeyFromUsername`, {
          data: { username: usernameToGetKey }
        });
        await interaction.reply(`Public Key for ${usernameToGetKey}: ${response.data.publicKey}`);
      } catch (error) {
        await interaction.reply(`Error: ${error.response.data}`);
      }
      break;



    case 'createtransaction':
      const amount = options.getNumber('amount');
      const payer = options.getString('payer');
      const payee = options.getString('payee');
      try {
        const response = await axios.post(`${URL}/createTransaction`, {
          amount,
          payer,
          payee
        });
        await interaction.reply(response.data.message);
      } catch (error) {
        await interaction.reply(`Error: ${error.response.data}`);
      }
      break;



    case 'minepublickey':
      const minerPublicKey = options.getString('publickey');
      try {
        const response = await axios.post(`${URL}/mine/publicKey`, {
          miner: minerPublicKey
        });
        await interaction.reply(response.data.message);
      } catch (error) {
        await interaction.reply(`Error: ${error.response.data}`);
      }
      break;



    case 'mineusername':
      const minerUsername = options.getString('username');
      try {
        const response = await axios.post(`${URL}/mine/username`, {
          miner: minerUsername
        });
        await interaction.reply(response.data.message);
      } catch (error) {
        await interaction.reply(`Error: ${error.response.data}`);
      }
      break;



    case 'checkbalancepublickey':
      const publicKeyToCheck = options.getString('publickey');
      try {
        const response = await axios.get(`${URL}/checkBalance/publicKey`, {
          data: { publicKey: publicKeyToCheck }
        });
        await interaction.reply(`Balance for public key ${publicKeyToCheck}: ${response.data.balance}`);
      } catch (error) {
        await interaction.reply(`Error: ${error.response.data}`);
      }
      break;



    case 'balance':
      const usernameToCheck = options.getString('username');
      try {
        const response = await axios.get(`${URL}/checkBalance/username`, {
          data: { username: usernameToCheck }
        });
        await interaction.reply(`Balance for username ${usernameToCheck}: ${response.data.balance}`);
      } catch (error) {
        await interaction.reply(`Error: ${error.response.data}`);
      }
      break;

    default:
      await interaction.reply('Unknown command');
  }
});

client.login(process.env.TOKEN);
