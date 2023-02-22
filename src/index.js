const express = require('express');
const Web3 = require('web3');
const fs = require('fs');
const erc20abi = require('human-standard-token-abi');

const { PRIVATE_KEY } = process.env;

const app = express();
const web3 = new Web3(`https://mainnet.infura.io/v3/24dc87778a10429b8c54d05a795d1269`);

app.get('/balances/:address', async (req, res) => {
  const address = req.params.address;
  const ethBalance = await web3.eth.getBalance(address);
  const tokens = [
    { name: 'Ethereum', symbol: 'ETH', address: '', decimals: 18, balance: ethBalance },
  ];

  const coingeckoResponse = await fetch('https://api.coingecko.com/api/v3/coins/list');
  const coingeckoCoins = await coingeckoResponse.json();

  const tokenAddresses = coingeckoCoins
    .filter(coin => coin.platforms && coin.platforms.ethereum)
    .map(coin => coin.platforms.ethereum);

  const tokenPromises = tokenAddresses.map(async tokenAddress => {
    const tokenContract = new web3.eth.Contract(erc20abi, tokenAddress);
    const balance = await tokenContract.methods.balanceOf(address).call();
    const name = await tokenContract.methods.name().call();
    const symbol = await tokenContract.methods.symbol().call();
    const decimals = await tokenContract.methods.decimals().call();
    return { name, symbol, address: tokenAddress, decimals, balance };
  });

  const tokenBalances = await Promise.all(tokenPromises);
  tokens.push(...tokenBalances);

  res.json(tokens);
});

function writeBalance(balance) {
  const data = JSON.stringify({ balance, timestamp: new Date().toISOString() });
  fs.writeFile('balance.json', data, err => {
    if (err) {
      console.error(`Error writing balance to file: ${err}`);
    } else {
      console.log(`Balance written to file: ${data}`);
    }
  });
}

async function fetchAndWriteBalance() {
  try {
    const ethBalance = await web3.eth.getBalance('0xA145ac099E3d2e9781C9c848249E2e6b256b030D');
    const balance = web3.utils.fromWei(ethBalance, 'ether');
    writeBalance(balance);
  } catch (err) {
    console.error(`Error fetching balance: ${err}`);
  }
}

fetchAndWriteBalance();
setInterval(fetchAndWriteBalance, 60 * 1000);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
