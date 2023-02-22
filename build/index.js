"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const Web3 = require('web3');
const fs = require('fs');
const erc20abi = require('human-standard-token-abi');
const node_fetch_1 = __importDefault(require("node-fetch"));
const { PRIVATE_KEY } = process.env;
const app = express();
const web3 = new Web3(`https://mainnet.infura.io/v3/24dc87778a10429b8c54d05a795d1269`);
app.get('/balances/:address', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const address = req.params.address;
    const ethBalance = yield web3.eth.getBalance(address);
    const tokens = [
        { name: 'Ethereum', symbol: 'ETH', address: '', decimals: 18, balance: ethBalance },
    ];
    const coingeckoResponse = yield (0, node_fetch_1.default)('https://api.coingecko.com/api/v3/coins/list');
    const coingeckoCoins = (yield coingeckoResponse).json();
    const tokenAddresses = coingeckoCoins
        .filter((coin) => coin.platforms && coin.platforms.ethereum)
        .map((coin) => coin.platforms.ethereum);
    const tokenPromises = tokenAddresses.map((tokenAddress) => __awaiter(void 0, void 0, void 0, function* () {
        const tokenContract = new web3.eth.Contract(erc20abi, tokenAddress);
        const balance = yield tokenContract.methods.balanceOf(address).call();
        const name = yield tokenContract.methods.name().call();
        const symbol = yield tokenContract.methods.symbol().call();
        const decimals = yield tokenContract.methods.decimals().call();
        return { name, symbol, address: tokenAddress, decimals, balance };
    }));
    const tokenBalances = yield Promise.all(tokenPromises);
    tokens.push(...tokenBalances);
    res.json(tokens);
}));
function writeBalance(balance) {
    const data = JSON.stringify({ balance, timestamp: new Date().toISOString() });
    fs.writeFile('balance.json', data, (err) => {
        if (err) {
            console.error(`Error writing balance to file: ${err}`);
        }
        else {
            console.log(`Balance written to file: ${data}`);
        }
    });
}
function fetchAndWriteBalance() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ethBalance = yield web3.eth.getBalance('0xA145ac099E3d2e9781C9c848249E2e6b256b030D');
            const balance = web3.utils.fromWei(ethBalance, 'ether');
            writeBalance(balance);
        }
        catch (err) {
            console.error(`Error fetching balance: ${err}`);
        }
    });
}
fetchAndWriteBalance();
setInterval(fetchAndWriteBalance, 60 * 1000);
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
