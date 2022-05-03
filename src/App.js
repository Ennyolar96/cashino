import { useEffect, useState } from "react";
import { ethers } from "ethers";
import erc20abi from "./ERC20abi.json";
import dividendabi from "./DividendABI.json";
import TxList from "./TxList";
import {
  VStack,
  useDisclosure,
  Button,
  Text,
  HStack,
  Center,
  Container,
  Flex,
  Spacer,
  Grid, 
  GridItem,
  Stack,
  Select,
  Input,
  Heading,
  ButtonGroup,
  Box
} from "@chakra-ui/react";
import SelectWalletModal from "./Modal";
import { useWeb3React } from "@web3-react/core";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { Tooltip } from "@chakra-ui/react";
import { networkParams } from "./networks";
import { connectors } from "./connectors";
import { toHex, truncateAddress } from "./utils";
import "./App.css"
import { FaTwitter } from "react-icons/fa";
import { FaTelegram } from "react-icons/fa";

export default function Home() {

  const [txs, setTxs] = useState([]);
  const [contractListened, setContractListened] = useState();
  const [contractInfo, setContractInfo] = useState({
    address: "-",
    tokenName: "-",
    tokenSymbol: "-",
    totalSupply: "-",
    tokenDecimals: "-"
  });
  const [balanceInfo, setBalanceInfo] = useState({
    address: "-",
    balance: "-"
  });
  const [unpaidEarning, setUnpaidEarnings] = useState({
    rewards: "-"
  });

  const [sharesInfo, setSharesInfo] = useState({
    address: "-",
    totalClaimed: "-"
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    library,
    chainId,
    account,
    activate,
    deactivate,
    active
  } = useWeb3React();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cashinoAddress = "0xBf7f21f29B595f838eF00405978C7D12590ba0ab";
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    const erc20 = new ethers.Contract(cashinoAddress, erc20abi, provider);

    const tokenName = await erc20.name();
    const tokenSymbol = await erc20.symbol();
    const tokenDecimals = await erc20.decimals();
    const totalSupply = await erc20.totalSupply() / 10**(9);

    setContractInfo({
      address: cashinoAddress,
      tokenName,
      tokenSymbol,
      totalSupply,
      tokenDecimals
    });
  };

  const getMyBalance = async () => {
    const cashinoAddress = "0xBf7f21f29B595f838eF00405978C7D12590ba0ab";
    const provider = new ethers.providers.Web3Provider(window.ethereum);
  
    const erc20 = new ethers.Contract(cashinoAddress, erc20abi, provider);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const balance = await erc20.balanceOf(signerAddress) / 10**(9);

    setBalanceInfo({
      address: signerAddress,
      balance: String(balance)
    });
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const erc20 = new ethers.Contract(contractInfo.address, erc20abi, signer);
    const amount = data.get("amount");
    await erc20.transfer(data.get("recipient"), amount);
  };

  const ClaimETH = async () => {

    const dividendAddress = "0xc9d7B8434C2B3E885fBDF21F905e78b0C0511D77";
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const erc20 = new ethers.Contract(dividendAddress, dividendabi, signer);
    await erc20.claimDividend();

  };

  const myrewards = async () => {

    const dividendAddress = "0xc9d7B8434C2B3E885fBDF21F905e78b0C0511D77";
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const erc20 = new ethers.Contract(dividendAddress, dividendabi, provider);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const rewards = await erc20.getUnpaidEarnings(signerAddress) /10**(18);

    setUnpaidEarnings({
      rewards: String(rewards)
    });

  };

  const getMyShares = async () => {
    const dividendAddress = "0xc9d7B8434C2B3E885fBDF21F905e78b0C0511D77";
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const erc20 = new ethers.Contract(dividendAddress, dividendabi, provider);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const totalClaimed = await erc20.totalClaimed(signerAddress) / 10**(18);


    setSharesInfo({
      address: signerAddress,
      totalClaimed: String(totalClaimed)
    });
  };

  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [network, setNetwork] = useState(undefined);
  const [message, setMessage] = useState("");
  const [signedMessage, setSignedMessage] = useState("");
  const [verified, setVerified] = useState();

  const handleNetwork = (e) => {
    const id = e.target.value;
    setNetwork(Number(id));
  };

  const handleInput = (e) => {
    const msg = e.target.value;
    setMessage(msg);
  };

  const switchNetwork = async () => {
    try {
      await library.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: toHex(network) }]
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await library.provider.request({
            method: "wallet_addEthereumChain",
            params: [networkParams[toHex(network)]]
          });
        } catch (error) {
          setError(error);
        }
      }
    }
  };

  const signMessage = async () => {
    if (!library) return;
    try {
      const signature = await library.provider.request({
        method: "personal_sign",
        params: [message, account]
      });
      setSignedMessage(message);
      setSignature(signature);
    } catch (error) {
      setError(error);
    }
  };

  const verifyMessage = async () => {
    if (!library) return;
    try {
      const verify = await library.provider.request({
        method: "personal_ecRecover",
        params: [signedMessage, signature]
      });
      setVerified(verify === account.toLowerCase());
    } catch (error) {
      setError(error);
    }
  };

  const refreshState = () => {
    window.localStorage.setItem("provider", undefined);
    setNetwork("");
    setMessage("");
    setSignature("");
    setVerified(undefined);
  };

  const disconnect = () => {
    refreshState();
    deactivate();
  };

  useEffect(() => {
    const provider = window.localStorage.getItem("provider");
    if (provider) activate(connectors[provider]);
  }, []);

  return (
    <div className="hello">
      
      <HStack className="header">
      <Box className="headerimage">
        <a href="https://www.cashino.finance" target={"_blank"}><img src="/CASHINO-1.png" alt="cashinoLogo"/></a>
      </Box>
        <div className="headertext">
          <Text color="white">{`Connection Status: `}</Text>
          {active ? (
            <CheckCircleIcon color="green" />
          ) : (
            <WarningIcon color="#cd5700" />
          )}
            {!active ? (
              <Button onClick={onOpen} background="#dd9425">Connect Wallet</Button>
            ) : (
              <Button onClick={disconnect}>Disconnect</Button>
            )}
        </div>
      </HStack>

        {/* <VStack className="header2"> */}
        <div className="headercontainer">
           <div className="headercontainer1">
            <Tooltip label={account} placement="right">
            <Text color="white">{`Account: ${truncateAddress(account)}`}</Text>
          </Tooltip>
         </div>
          <div className="headercontainer2">
             <Text color="white">{`Network ID: ${chainId ? chainId : "No Network"}`}</Text>
          </div>
        </div>
        {/* </VStack> */}

      <VStack padding="50px 0" className="bodycolor">
      <HStack >
          <Text
            margin="0"
            lineHeight="1.15"
            fontSize={["1.5em", "2em", "2.5em", "3em"]}
            fontWeight="100"
            color="white"
            padding="1px 2px"
          >
            Earn passive income in
          </Text>
          <Text
            margin="0"
            padding="10px 0"
            lineHeight="1.15"
            fontSize={["1.5em", "2em", "2.5em", "3em"]}
            fontWeight="100"
            sx={{
              background: "linear-gradient(90deg, gold 0%, gold 70.35%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            Wrapped Ethereum
          </Text>
        </HStack>
          <Text
            color="white"
            padding="1px 5px"
            fontSize="1.2rem"
            margin="10px"
            // noOfLines={[1, 2]}
            as="i"
          >
            Rewards are automatically distributed whenever someone sells. <br></br>
            You can manually claim rewards 30mins after the buy transaction.
            The minimum $wETH claimable reward is 0.1 wETH. <br></br>
          </Text> 

        <HStack spacing='24px' padding='250'  position="absolute" left="90px">

        <div className="mybox">
          <Box className="box1">
            <Center padding='10' fontWeight="500" >
            <br></br>
                  
                    <form onSubmit={handleSubmit} className="box1form" >
                          <Button bg='#dd9425' w='100%' p={7} color='white'
                            onClick={getMyBalance()}
                            type="submit"
                            className="btn btn-primary submit-button focus:ring focus:outline-none w-full"
                          >
                            $CI BALANCE:
                          </Button>
                        <Text padding='30' fontSize='40px'>
                        {balanceInfo.balance} $CI 
                        </Text>
                    
                                        
                    </form>
            </Center>
          </Box>
          <Box className="box2">
          <Center padding='10' fontWeight="500" >
            <br></br>
                    <form onSubmit={handleSubmit} onClick={myrewards()} onClick={getMyShares()} className="box2form">
                          <Text position='absolute' paddingLeft={4}>Unclaimed Reward</Text>
                          <Box padding='5' fontSize='40px' bg='#471c3b' fontWeight="100" borderRadius="md" color='gold'>
                          {unpaidEarning.rewards} ETH
                          </Box> <br></br>
                          <Button  bg='#dd9425' w='300px' marginBottom={2} p={5} color='white' fontWeight="500" fontSize='30px'
                            onClick={ClaimETH}
                            type="submit"
                            className="btn btn-primary submit-button focus:ring focus:outline-none w-full"
                          >
                            Claim Reward
                          </Button>
                          <Text position='absolute'paddingLeft={4} >Claimed Reward</Text>
                          <Box padding='15' fontSize='40px' bg='#471c3b' fontWeight="100" borderRadius="md" color='gold'>
                          {sharesInfo.totalClaimed} ETH
                          </Box> <br></br>                              
                    </form>
            </Center>
          </Box>
        </div>
      </HStack>
      <VStack justifyContent="center" alignItems="center" h="100vh" background="#330325">
        <Text>{error ? error.message : null}</Text>
      </VStack>
      <Flex minWidth='max-content' alignItems='center' gap='2' direction={{base: 'column', md: 'row'}}>
  <Spacer />
</Flex>
      </VStack>
      <SelectWalletModal isOpen={isOpen} closeModal={onClose} />


      {/* // footer */}

    <div className="footer">
        <a href="#"> < FaTwitter /> </a>
        <a href="#"> < FaTelegram /> </a>
    </div>
    
    </div>
  );
}
