import React, {useEffect, useState, useRef} from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from 'ethers';
import abi from './abis/Domains.json'
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks.js'

// Constants
const TWITTER_HANDLE = 'Shivansh0810';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const tld = ".exe";
const CONTRACT_ADDRESS = '0xDec18EbA48108a85363606348eab954A4F4Fef31';
const CONTRACT_ABI=abi.abi;

const App = () => {

	const [currentAccount, setCurrentAccount] = useState('');
	const [disableMint, setDisableMint] = useState("");
	const [network, setNetwork] = useState("");
	const domainRef = useRef();
	const recordRef = useRef();

	const connectWallet = async () => {
		try {
			const { ethereum } = window;
			
			if(!ethereum){
				alert("Metamask not installed.");
				return;
			}

			const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
			console.log("Conected: ", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (e) {
			console.log(e);
		}
	}

	const checkWalletConnected = async () => {
		const { ethereum } = window;
		if(!ethereum) {
			console.log("Make sure you have Metamask!");
			return;
		}

		console.log("We have the ethereum name object :)");
		const accounts = await ethereum.request({ method: 'eth_accounts' });

		if(accounts.length!==0) {
			setCurrentAccount(accounts[0]);
			console.log('Found an authorized account: ', accounts[0]);
		} else {
			console.log("Could not find authorized account.");
		}

		const chainId = await ethereum.request({method: "eth_chainId"});
		setNetwork(networks[chainId]);

		ethereum.on("chainChanged", handleChainChanged);

		function handleChainChanged(_chain){
			setNetwork(networks[chainId]);
			window.location.reload();
		}
	};

	const mintDomain = async () => {
		// Don't run if the domain is empty
		const domain = domainRef.current.value;
		const record = recordRef.current.value;
		if (!domain) { return }
		// Alert the user if the domain is too short
		if (domain.length < 3) {
			alert('Domain must be at least 3 characters long');
			return;
		}
		// Calculate price based on length of domain (change this to match your contract)	
		// 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
		const price = domain.length === 3 ? '0.05' : domain.length === 4 ? '0.03' : '0.01';
		console.log("Minting domain", domain, "with price", price);
		try {
			const { ethereum } = window;
			if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
		
			console.log("Going to pop wallet now to pay gas...")
			setDisableMint(true);
		  	let tx = await contract.register(domain, {value: ethers.utils.parseEther('0.03')});
		  // Wait for the transaction to be mined
		   	const receipt = await tx.wait();
	
			// Check if the transaction was successfully completed
			if (receipt.status === 1) {
				console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);
				
				// Set the record for the domain
				tx = await contract.setRecord(domain, record);
				await tx.wait();

				console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);
				
				domainRef.current.value = "";
				recordRef.current.value = "";
			}
			else {
				alert("Transaction failed! Please try again");
			}
			setDisableMint(false);
		}
	  }
	  catch(error){
		console.log(error);
		setDisableMint(false);
	  }
	}

	const switchNetwork = async () => {
		if(window.ethereum) {
			const {ethereum} = window;
			try {
				await ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: '0x13881' }],
				});
			} catch (err) {

				if (err.code === 4902) {
					try {
						await ethereum.request({
							method: 'wallet_addEthereumChain',
							params: [
								{	
									chainId: '0x13881',
									chainName: 'Polygon Mumbai Testnet',
									rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
									nativeCurrency: {
											name: "Mumbai Matic",
											symbol: "MATIC",
											decimals: 18
									},
									blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
								},
							],
						});
					} catch(e) {
						console.log(e);
					}
				}
				console.log(err);
			}
		} else {
			alert('MetaMask is not installed. Please install it to use this app -> https://metamask.io/download.html');
		}
	}

	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img src="https://c.tenor.com/IdftKL28w7QAAAAC/backflip-exe.gif" alt="EXE gif" />
			<button onClick={connectWallet} className="cta-button connect-wallet-button">
				Connect Wallet
			</button>
		</div>
  	);

	const renderInputForms = () => {

		if (network !== 'Polygon Mumbai Testnet') {
			return (
				<div className="connect-wallet-container">
					<p>Please connect to the Polygon Mumbai Testnet</p>
					<button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
				</div>
			);
		}

		return (
			<div className='form-container'>
				<div className='first-row'>
					<input 
						type="text"
						ref={domainRef}
						placeholder="Enter domain here"
					/>
					<p className='tld'>{tld}</p>
				</div>

				<input 
					type="text"
					ref={recordRef}
					placeholder="Enter your favorite exe here!"
				/>

				<div className="button-container">
					<button className='cta-button mint-button' disabled={disableMint} onClick={mintDomain}>
						Mint
					</button> 
				</div>
			</div>
		)
	}

	useEffect(() => {
		checkWalletConnected();
	}, []);

	return (
			<div className="App">
				<div className="container">
					<div className="header-container">
						<header>
							<div className="left">
							<p className="title">🐯 EXE Name Service</p>
							<p className="subtitle">This .exe will never stop responding!</p>
							</div>
							<div className='right'>
								<img alt="Network logo" className='logo' src = { network.includes("Polygon")? polygonLogo : ethLogo } />
								{currentAccount?<p>Wallet: {currentAccount.slice(0,6)}...{currentAccount.slice(-4)}</p>:<p>Not connected</p>}
							</div>
						</header>
					</div>
					{!currentAccount && renderNotConnectedContainer()}
					{currentAccount && renderInputForms()}
					<div className="footer-container">
						<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
							<a
								className="footer-text"
								href={TWITTER_LINK}
								target="_blank"
								rel="noreferrer"
							>{`built with @${TWITTER_HANDLE}`}</a>
					</div>
				</div>
			</div>
		);
}

export default App;
