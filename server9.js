const Moralis = require('moralis/node');
const axios = require('axios');
const { exit } = require('process');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const sendRequest = require('./utils/fetch');

const apiKeys = [
  'K6epf8Uh3ZlE1Q6d5fQUBbqEu1NDNOdmis0TTlvyYsRcc9im24qLDO51GAP5eto9',
  'ZvdJsqDv6WA1EfL156oHBPcAjhWzxkiL0zIIUxwOnYvmUmJDCjS2jkIKUHKmlzze',
  'ncvWaJOzaqmgCdFp7KuTqT7P1iEOt99W1lgTH4gcFC0QvdA9M1h8qivhPox84Gbw',
  'ToPhBUKese30Env6Wz0Vcko5oRMW8Yi6KVQ685c6fT5TIcgqeCii9b0b7Fv7dKCc',
  'xgqbsMJcRSDBv3QJRDhKKb1O3FQmPNR2SFICj3XpbXFizRmuFVIkWUnJe6msefX3',
  '6VpvKY01acd6wWaNc4E8tDfa8acPGlUrCNhrB2Nzmxz2jEHzYx3d1GTvIdL2MXPn',
  'IT6Gaj3LZxFWkjXkdgxTqA7HlyDMDy5oZUO1oDAQLi1aLkETgNZcHV7yI4mOZjmB',
  'bTPO9xE2un2yW33Z0v6AGkxH0E58ixzJk1FvBzLls11UhuilQrtWNkcCVl888JlQ',
  'D8Cmgo0Y3veZwCvru3IqE2Z46UnC2fGsk0feLmXkHKiWY6K4g5MccWsxuwFjrXL7',
  'zrdRW3z8YbmHVXzRHFh4wIbwmrJs9FQgdOVXbGw4ZWc52OiVCYqbQkR8NxoTgEV1'
]

//server=defir_beta (preloaded with data for test wallet 0x...44a)
// const serverUrl = 'https://tjdngb7yqmm6.usemoralis.com:2053/server';
// const appId = 'ZRFrzeWTDRmhMFszuq7VSWgM5hgJI4GOY7cY2Ebx';

const serverUrl = 'https://8dyuriovbupo.usemoralis.com:2053/server';
const appId = 'rLSZFQmw1hUwtAjRnjZnce5cxu1qcPJzy01TuyU1';

// const serverUrl = 'https://ea4ql61igwkq.usemoralis.com:2053/server';
// const appId = 'ayFgiTCfWrFcBtgXqvwiLJQqSlGbnxYezYipOJQx';

// const serverUrl = 'https://nobftmga5e7k.usemoralis.com:2053/server';
// const appId = '1ECvf1IwjzCgTFYXyD44lIeVKPMgV6ZYFoUHrPwS';

let history = null;
let serverProcess = {
  moralis_started: false,
  isRunning: false,
  current_step: 0,
  total_step: 0,
  message: '',
};

// common data
const chain_details = {
  eth: {
    id: "eth",
    community_id: 1,
    name: "Ethereum",
    native_token_id: "eth",
    logo_url: "https://static.debank.com/image/chain/logo_url/eth/42ba589cd077e7bdd97db6480b0ff61d.png",
    wrapped_token: { name: 'Wrapped Ether', decimals: 18, symbol: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' }
  },
  bsc: {
    id: "bsc",
    community_id: 56,
    name: "BSC",
    native_token_id: "bsc",
    logo_url: "https://static.debank.com/image/chain/logo_url/bsc/7c87af7b52853145f6aa790d893763f1.png",
    wrapped_token: { name: 'Wrapped BNB', decimals: 18, symbol: 'WBNB', address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' }
  },
  xdai: {
    id: "xdai",
    community_id: 100,
    name: "xDai",
    native_token_id: "xdai",
    logo_url: "https://static.debank.com/image/chain/logo_url/xdai/8b5320523b30bd57a388d1bcc775acd5.png",
    wrapped_token: { name: 'Wrapped XDAI', decimals: 18, symbol: 'WXDAI', address: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d' }
  },
  matic: {
    id: "matic",
    community_id: 137,
    name: "Polygon",
    native_token_id: "matic",
    logo_url: "https://static.debank.com/image/chain/logo_url/matic/d3d807aff1a13e9ba51a14ff153d6807.png",
    wrapped_token: { name:'Wrapped Matic', decimals: 18, symbol: 'WMATIC', address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270' }
  },
  polygon: {
    id: "matic",
    community_id: 137,
    name: "Polygon",
    native_token_id: "matic",
    logo_url: "https://static.debank.com/image/chain/logo_url/matic/d3d807aff1a13e9ba51a14ff153d6807.png",
    wrapped_token: { name:'Wrapped Matic', decimals: 18, symbol: 'WMATIC', address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270' }
  },
  ftm: {
    id: "ftm",
    community_id: 250,
    name: "Fantom",
    native_token_id: "ftm",
    logo_url: "https://static.debank.com/image/chain/logo_url/ftm/700fca32e0ee6811686d72b99cc67713.png",
    wrapped_token: { name:'Wrapped Fantom', decimals: 18, symbol: 'WFTM', address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83' }
  },
  okt: {
    id: "okt",
    community_id: 66,
    name: "OEC",
    native_token_id: "okt",
    logo_url: "https://static.debank.com/image/chain/logo_url/okt/1228cd92320b3d33769bd08eecfb5391.png",
    wrapped_token: { name:'Wrapped OKT', decimals: 18, symbol: 'WOKT', address: '0x8f8526dbfd6e38e3d8307702ca8469bae6c56c15' }
  },
  heco: {
    id: "heco",
    community_id: 128,
    name: "HECO",
    native_token_id: "heco",
    logo_url: "https://static.debank.com/image/chain/logo_url/heco/db5152613c669e0cc8624d466d6c94ea.png",
    wrapped_token: { name:'Wrapped HT', decimals: 18, symbol: 'WHT', address: '0x5545153ccfca01fbd7dd11c0b23ba694d9509a6f' }
  },
  avax: {
    id: "avax",
    community_id: 43114,
    name: "Avalanche",
    native_token_id: "avax",
    logo_url: "https://static.debank.com/image/chain/logo_url/avax/4d1649e8a0c7dec9de3491b81807d402.png",
    wrapped_token: { name:'Wrapped AVAX', decimals: 18, symbol: 'WAVAX', address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7' }
  },
  op: {
    id: "op",
    community_id: 10,
    name: "Optimism",
    native_token_id: "op",
    logo_url: "https://static.debank.com/image/chain/logo_url/op/01ae734fe781c9c2ae6a4cc7e9244056.png",
    wrapped_token: { name:'Wrapped Ether', decimals: 18, symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' }
  },
  arb: {
    id: "arb",
    community_id: 42161,
    name: "Arbitrum",
    native_token_id: "arb",
    logo_url: "https://static.debank.com/image/chain/logo_url/arb/f6d1b236259654d531a1459b2bccaf64.png",
    wrapped_token: { name:'Wrapped Ether', decimals: 18, symbol: 'WETH', address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1' }
  },
  celo: {
    id: "celo",
    community_id: 42220,
    name: "Celo",
    native_token_id: "0x471ece3750da237f93b8e339c536989b8978a438",
    logo_url: "https://static.debank.com/image/chain/logo_url/celo/41da5c1d3c0945ae822a1f85f02c76cf.png",
    wrapped_token: { name:'', decimals: 18, symbol: '', address: '' }
  },
  movr: {
    id: "movr",
    community_id: 1285,
    name: "Moonriver",
    native_token_id: "movr",
    logo_url: "https://static.debank.com/image/chain/logo_url/movr/4b0de5a711b437f187c0d0f15cc0398b.png",
    wrapped_token: { name:'Wrapped MOVR', decimals: 18, symbol: 'WMOVR', address: '0xe3c7487eb01c74b73b7184d198c7fbf46b34e5af' }
  },
  cro: {
    id: "cro",
    community_id: 25,
    name: "Cronos",
    native_token_id: "cro",
    logo_url: "https://static.debank.com/image/chain/logo_url/cro/44f784a1f4c0ea7d26d00acabfdf0028.png",
    wrapped_token: { name:'Wrapped CRO', decimals: 18, symbol: 'WCRO', address: '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23' }
  },
  boba: {
    id: "boba",
    community_id: 288,
    name: "Boba",
    native_token_id: "boba",
    logo_url: "https://static.debank.com/image/chain/logo_url/boba/e43d79cd8088ceb3ea3e4a240a75728f.png",
    wrapped_token: { name:'Wrapped ETHER', decimals: 18, symbol: 'WETH', address: '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000' }
  },
  metis: {
    id: "metis",
    community_id: 1088,
    name: "Metis",
    native_token_id: "metis",
    logo_url: "https://static.debank.com/image/chain/logo_url/metis/b289da32db4d860ebf6fb46a6e41dcfc.png",
    wrapped_token: { name:'Wrapped METIS', decimals: 18, symbol: 'WMETIS', address: '0x75cb093e4d61d2a2e65d8e0bbb01de8d89b53481' }
  },
  btt: {
    id: "btt",
    community_id: 199,
    name: "BitTorrent",
    native_token_id: "btt",
    logo_url: "https://static.debank.com/image/chain/logo_url/btt/2130a8d57ff2a0f3d50a4ec9432897c6.png",
    wrapped_token: { name:'Wrapped BTT', decimals: 18, symbol: 'WBTT', address: '0x197a4ed2b1bb607e47a144b9731d7d34f86e9686' }
  },
  aurora: {
    id: "aurora",
    community_id: 1313161554,
    name: "Aurora",
    native_token_id: "aurora",
    logo_url: "https://static.debank.com/image/chain/logo_url/aurora/c7590fd2defb8e7d7dc071166838c33a.png",
    wrapped_token: { name:'Aurora', decimals: 18, symbol: 'WHT', address: '' }
  }
}

const chainExplorer = {
  eth: {
    main: 'https://etherscan.io/',
  },
  polygon: {
    main: 'https://polygonscan.com/',
    test: 'https://mumbai.polygonscan.com/',
  },
  fantom: {
    main: 'https://ftmscan.com/',
    test: 'https://testnet.ftmscan.com/',
  }
}

let testData = {
  wallet: '0x3ddfa8ec3052539b6c9549f12cea2c295cff5296',
  // wallet: '0x704111eDBee29D79a92c4F21e70A5396AEDCc44a',
  // blockheight: 20138207,
  // chain: 'polygon',
};

const DELAY = 1000;
const TRANSACTION_MAX = 2000; // max length of fetched transaction to avoid error of rate exceed

const app = express();
app.use(cors());
const PORT = process.env?.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at (http://localhost:${PORT})`);
});
// app.get('/', function (req, res) {
//   // if (!history) return res.status(400).send('Getting data. Please wait...')
//   // res.send({ result: history})
//   const downloadContent = JSON.stringify(history);
//   res.setHeader('Content-Length', downloadContent.length);
//   res.write(downloadContent, 'binary');
//   res.end();
// })
app.get('/costbasis', function (req, res) {
  if (!serverProcess.moralis_started) return res.status(400).send({status: false, message: 'Moralis server does not started yet. Please wait...'})
  if (serverProcess.isRunning) return res.status(400).send({status: false, message: 'Moralis server is busy at the moment. Please wait...'})
  // const startTime = new Date();
  // getWalletCostHistory((result) => {
  //   const endTime = new Date();
  //   const duration  = (endTime - startTime) / 1000;
  //   console.log('result in', duration, 's: ', result);
  //   res.send({ result, })
  // });
  getWalletCostHistory();
  res.send({status: true});
})

app.get('/status', function (req, res) {
  res.send(serverProcess);
})

app.get('/history', function (req, res) {
  res.send({result: history});
})

GLOBAL_API_KEY_INDEX = 0;

Moralis.start({ serverUrl, appId })
  .then(() => {
    console.log('moralis successfully started');
    serverProcess.moralis_started = true;
  })
  .catch((e) => {
    console.log('moralis start error', e);
    // history = 'moralis start error';
    serverProcess.isRunning = false;
    // exit(1);
  });

function getWalletCostHistory(callback) {
  serverProcess.isRunning = true;
  history = null;
  const startTime = new Date();
  getWalletCostBasis(testData)
  .then((result) => {
    const endTime = new Date();
    console.log('final result ', result, `in ${(endTime - startTime) / 1000}s`);
    fs.writeFileSync('./result.json', JSON.stringify(result || ''));
    history = result;
    serverProcess.isRunning = false;
    if (callback) callback(result);
    // exit(1);
  })
  .catch((e) => {
    console.log('get wallet cost basis error', e);
    serverProcess.isRunning = false;
    // history = 'get wallet cost basis error';
    // history = {
    //   message: 'get wallet cost basis error',
    //   error: e
    // };
    // exit(1);
    if (callback) callback(null);
  });
}
// main();


// utils functions
function sortBlockNumber_reverseChrono(a, b) {
  if (a.block_number > b.block_number) {
    return -1;
  }
  if (a.block_number < b.block_number) {
    return 1;
  }
  return 0;
}

function convertDateTime(time) {
  return time? time.split('.')[0] : '';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey() {
  // await sleep(DELAY);
  const result = apiKeys[GLOBAL_API_KEY_INDEX % apiKeys.length];
  GLOBAL_API_KEY_INDEX++;
  console.log('api key: ', GLOBAL_API_KEY_INDEX % apiKeys.length, result);
  return result;
}

function writeToFile(filename, data) {
  fs.writeFileSync(`./result_${filename}.json`, JSON.stringify(data || 'undefined'))
}

// Debank functions
async function getWalletBalanceByDebank(_address) {
  try {
    const result = await axios({
      method: 'get',
      header: {'content-type': 'application/json'},
      url: `https://openapi.debank.com/v1/user/total_balance?id=${_address}`
    });
    return result.data;
  } catch(err) {
    console.log('get token info by debank', err);
    return null;
  }
}

async function getWalletTokenListByDebank(_address, _chain, _isAll) {
  try {
    const result = await axios({
      method: 'get',
      header: {'content-type': 'application/json'},
      url: `https://openapi.debank.com/v1/user/token_list?id=${_address}${_chain? `&chain_id=${_chain}` : ''}&is_all=${_isAll === undefined? 'true' : isAll}`
    });
    return result.data;
  } catch(err) {
    console.log('get token info by debank', err);
    return null;
  }
}

async function getProtocolListByDebank() {
  try {
    const result = await axios({
      method: 'get',
      header: {'content-type': 'application/json'},
      url: 'https://openapi.debank.com/v1/protocol/list'
    });
    return result.data;
  } catch(err) {
    console.log('get protocol list by debank', err);
    return null;
  }
}

async function getTokenInfoByDebank(_chain, _address) {
  try {
    const result = await axios({
      method: 'get',
      header: {'content-type': 'application/json'},
      url: `https://openapi.debank.com/v1/token?chain_id=${_chain}&id=${_address}`
    });
    return result.data;
  } catch(err) {
    console.log('get token info by debank', err);
    return null;
  }
}

// Moralis functions
async function getTokenMetadata(_chain, _tokenAddresses) {
  let options;
  try {
    var page = 0, tokenMetadata = [], result;
    while (page < Math.ceil(_tokenAddresses.length / 10)) {
      options = {
        chain: _chain,
        addresses: _tokenAddresses.splice(0, 10)
      }
      result = await Moralis.Web3API.token.getTokenMetadata(options);
      // result = await sendRequest({
      //   apiKey: getApiKey(),
      //   url: `https://deep-index.moralis.io/api/v2/erc20/metadata?chain=${options.chain}&addresses=${options.addresses.join('&addresses=')}`
      // })
      tokenMetadata = tokenMetadata.concat(result || []);
      page++;
    }
    return tokenMetadata;
  } catch (e) {
    console.log('get token meta data error', e);
    return [];
  }
}

async function getTransactions(_chain, _tokenAddress, _toBlock) {
  let options = {
    chain: _chain,
    address: _tokenAddress,
    order: 'desc',
    offset: 0
  };
  if (_toBlock) options.to_block = _toBlock;
  try {
    // const result = await Moralis.Web3API.account.getTransactions(options);
    const result = await sendRequest({
      apiKey: getApiKey(),
      url: `https://deep-index.moralis.io/api/v2/${options.address}?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}&offset=${options.offset}`
    });
    if (Number(result?.total) > 500) {
      let page = 1, txFunctions = [], mergeResult = result.result;
      while (page < Math.ceil(result.total / 500) && mergeResult.length <= TRANSACTION_MAX) {
        options.offset = page * 500;
        // txFunctions.push(Moralis.Web3API.account.getTransactions(options));
        txFunctions.push(sendRequest({
          apiKey: getApiKey(),
          url: `https://deep-index.moralis.io/api/v2/${options.address}?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}&offset=${options.offset}`
        }));
        if (page % 1 === 0) {
          await Promise.all(txFunctions).then(results => {
            results.map(each => {
              mergeResult = mergeResult.concat(each?.result || []);
            })
          }).catch(e => console.log(e))
          txFunctions = [];
        }
        page++;
      }
      if (txFunctions.length) {
        await Promise.all(txFunctions).then(results => {
          results.map(each => {
            mergeResult = mergeResult.concat(each.result);
          }) 
          return mergeResult;
        }).catch(e => console.log(e))
      } else return mergeResult;
    }
    else return result?.result || [];
    return result?.result || [];
  } catch (e) {
    console.log('get transactions error', e);
    return [];
  }
}

async function getTokenPrice(_chain, _address, _toBlock) {
  const options = { address: _address, chain: _chain, to_block: _toBlock };
  try {
    // return await Moralis.Web3API.token.getTokenPrice(options);
    return await sendRequest({
      apiKey: getApiKey(),
      url: `https://deep-index.moralis.io/api/v2/erc20/${options.address}/price?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}`
    });
  } catch (e) {
    return null;
  }
}

async function getTokenBalances(_chain, _address, _toBlock) {
  let options = {
    chain: _chain,
    address: _address
  };
  if (_toBlock) options.to_block = _toBlock;
  try {
    // console.log('get token balances', Moralis.Web3API.account);
    // const getTokenBalancesResult = await Moralis.Web3API.account.getTokenBalances(options);
    const getTokenBalancesResult = await sendRequest({
      apiKey: getApiKey(),
      url: `https://deep-index.moralis.io/api/v2/${options.address}/erc20?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}`
    });
    return getTokenBalancesResult || [];
  } catch (e) {
    console.log('get token balances error', e);
    return [];
  }
}

async function getNativeTokenBalances(_chain, _address, _toBlock) {
  let options = {
    chain: _chain,
    address: _address
  };
  if (_toBlock) options.to_block = _toBlock;
  try {
    // console.log('get token balances', Moralis.Web3API.account);
    // const getTokenBalancesResult = await Moralis.Web3API.account.getTokenBalances(options);
    const getTokenBalancesResult = await sendRequest({
      apiKey: getApiKey(),
      url: `https://deep-index.moralis.io/api/v2/${options.address}/balance?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}`
    });
    return getTokenBalancesResult || [];
  } catch (e) {
    console.log('get token balances error', e);
    return [];
  }
}

async function getTokenTransfers(_chain, _address, _toBlock) {
  let options = {
    address: _address,
    chain: _chain,
    offset: 0
  };
  if (_toBlock) options.to_block = _toBlock;
  try {
    // const result = await Moralis.Web3API.account.getTokenTransfers(options);
    const result = await sendRequest({
      apiKey: getApiKey(),
      url: `https://deep-index.moralis.io/api/v2/${options.address}/erc20/transfers?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}&offset=${options.offset}`
    });
    // console.log('get token transfer result', result);
    if (Number(result?.total) > 500) {
      let page = 1, transferFunctions = [], mergeResult = result.result;
      while (page < Math.ceil(result.total / 500) && mergeResult.length <= TRANSACTION_MAX) {
        options.offset = page * 500;
        // transferFunctions.push(Moralis.Web3API.account.getTokenTransfers(options));
        transferFunctions.push(sendRequest({
          apiKey: getApiKey(),
          url: `https://deep-index.moralis.io/api/v2/${options.address}/erc20/transfers?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}&offset=${options.offset}`
        }));
        if (page % 1 === 0) {
          await Promise.all(transferFunctions).then(results => {
            results.map(each => {
              mergeResult = mergeResult.concat(each?.result || []);
            })
          }).catch(e => console.log(e))
          transferFunctions = [];
        }
        page++;
      }
      if (transferFunctions.length) {
        await Promise.all(transferFunctions).then(results => {
          results.map(each => {
            mergeResult = mergeResult.concat(each.result);
          }) 
          return mergeResult;
        }).catch(e => console.log('get token transfers error 1', e))
      } else return mergeResult;
    }
    else return result?.result || [];
  } catch (e) {
    console.log('get token transfers error 2', e);
    return [];
  }
}

// Rest API functions
async function getTokenMetadataRestApi(_chain, _tokenAddresses) {
  let options;
  try {
    var page = 0, tokenMetadata = [], result;
    while (page < Math.ceil(_tokenAddresses.length / 10)) {
      options = {
        chain: _chain,
        addresses: _tokenAddresses.splice(0, 10)
      }
      // console.log('get token meta data', options);
      result = await sendRequest({
        apiKey: getApiKey(),
        url: `https://deep-index.moralis.io/api/v2/erc20/metadata?chain=${options.chain}&addresses=${options.addresses.join('&addresses=')}`
      })
      tokenMetadata = tokenMetadata.concat(result);
      page++;
    }
    return tokenMetadata;
  } catch (e) {
    console.log('get token meta data error', e);
    return null;
  }
}

async function getTransactionsRestApi(_chain, _tokenAddress, _toBlock) {
  let options = {
    chain: _chain,
    address: _tokenAddress,
    order: 'desc',
    offset: 0
  };
  if (_toBlock) options.to_block = _toBlock;
  try {
    const result = await sendRequest({
      apiKey: getApiKey(),
      url: `https://deep-index.moralis.io/api/v2/${options.address}?chain=${options.chain}&to_block=${options.to_block || ''}&offset=${options.offset}`
    });
    if (Number(result.total) > 500) {
      let page = 1, txFunctions = [], mergeResult = result.result;
      while (page < Math.ceil(result.total / 500)) {
        options.offset = page * 500;
        txFunctions.push(sendRequest({
          apiKey: getApiKey(),
          url: `https://deep-index.moralis.io/api/v2/${options.address}?chain=${options.chain}&to_block=${options.to_block || ''}&offset=${options.offset}`
        }));
        if (page % 1 === 0) {
          await Promise.all(txFunctions).then(results => {
            results.map(each => {
              mergeResult = mergeResult.concat(each?.result || []);
            })
          }).catch(e => console.log(e))
          txFunctions = [];
        }
        page++;
      }
      if (txFunctions.length) {
        await Promise.all(txFunctions).then(results => {
          results.map(each => {
            mergeResult = mergeResult.concat(each.result);
          }) 
          return mergeResult;
        }).catch(e => console.log(e))
      } else return mergeResult;
    }
    else return result.result;
    return result.result;
  } catch (e) {
    console.log('get transactions error', e);
    return null;
  }
}

async function getTokenPriceRestApi(_chain, _address, _toBlock) {
  const options = { address: _address, chain: _chain, to_block: _toBlock };
  try {
    return await sendRequest({
      apiKey: getApiKey(),
      url: `https://deep-index.moralis.io/api/v2/erc20/${options.address}/price?chain=${options.chain}&to_block=${options.to_block}`
    });;
  } catch (e) {
    return null;
  }
}

async function getTokenBalancesRestApi(_chain, _address, _toBlock) {
  let options = {
    chain: _chain,
    address: _address
  };
  if (_toBlock) options.to_block = _toBlock;
  try {
    // console.log('get token balances', Moralis.Web3API.account);
    const getTokenBalancesResult = await sendRequest({
      apiKey: getApiKey(),
      url: `https://deep-index.moralis.io/api/v2/${options.address}/erc20?chain=${options.chain}&to_block=${options.to_block || ''}`
    });
    return getTokenBalancesResult;
  } catch (e) {
    console.log('get token balances error', e);
    return null;
  }
}

async function getTokenTransfersRestApi(_chain, _address, _toBlock) {
  let options = {
    address: _address,
    chain: _chain,
    offset: 0
  };
  if (_toBlock) options.to_block = _toBlock;
  try {
    console.log('get token transfers', options)
    const result = await sendRequest({
      apiKey: getApiKey(),
      url: `https://deep-index.moralis.io/api/v2/${options.address}/erc20/transfers?chain=${options.chain}&to_block=${options.to_block || ''}&offset=${options.offset}`
    });
    // console.log('get token transfer result', result);
    if (Number(result.total) > 500) {
      let page = 1, transferFunctions = [], mergeResult = result.result;
      while (page < Math.ceil(result.total / 500)) {
        options.offset = page * 500;
        transferFunctions.push(sendRequest({
          apiKey: getApiKey(),
          url: `https://deep-index.moralis.io/api/v2/${options.address}/erc20/transfers?chain=${options.chain}&to_block=${options.to_block || ''}&offset=${options.offset}`
        }));
        if (page % 1 === 0) {
          await Promise.all(transferFunctions).then(results => {
            results.map(each => {
              mergeResult = mergeResult.concat(each.result);
            })
          }).catch(e => console.log(e))
          transferFunctions = [];
        }
        page++;
      }
      if (transferFunctions.length) {
        await Promise.all(transferFunctions).then(results => {
          results.map(each => {
            mergeResult = mergeResult.concat(each.result);
          }) 
          return mergeResult;
        }).catch(e => console.log('get token transfers error 1', e))
      } else return mergeResult;
    }
    else return result.result;
  } catch (e) {
    console.log('get token transfers error 2', e);
    return null;
  }
}

// main function
async function getWalletCostBasis(data) {
  console.log('started getting wallet cost basis...');
  serverProcess.total_step = 1;
  serverProcess.current_step = 0;
  serverProcess.message = 'preparing data for calculation...';
  let result = [];
  //Get global data
  // await Promise.all([
  //   getTokenBalances(data.chain, data.wallet.toLowerCase(), data.blockheight),
  //   getTokenTransfers(data.chain, data.wallet.toLowerCase(), data.blockheight),
  //   getTransactions(data.chain, data.wallet.toLowerCase(), data.blockheight),
  // ]).then((result) => {
  //   global_balances = result[0];
  //   global_transfers = result[1];
  //   global_tx = result[2];
  // });
  global_balances = [];
  global_transfers = [];
  global_tx = [];
  global_token_info_from_debank = [];
  global_token_meta = [];
  global_chain_list = {};

  const protocolList = await getProtocolListByDebank();
  const walletChainlist = (await getWalletBalanceByDebank(data.wallet)).chain_list;
  let tokenList = [], chainIdList = [], chainIdListForMoralis = [];
  const filteredBalance = walletChainlist.filter(chain => {
    global_chain_list[chain.id === 'eth'? 'eth' : chain.name.toLowerCase()] = chain;
    const matched = chain.usd_value > 0;
    if (matched) {
      tokenList.push(chain.wrapped_token_id || chain.native_token_id);
      if (chain_details[chain.id] && chain_details[chain.id].wrapped_token.address) tokenList.push(chain_details[chain.id].wrapped_token.address);
      chainIdList.push(chain.id);
      chainIdListForMoralis.push(chain.id === 'eth'? 'eth' : chain.name.toLowerCase());
    }
    return matched;
  })

  // const tokenListOfWallet = await getWalletTokenListByDebank(data.wallet);
  // global_token_info_from_debank = global_token_info_from_debank.concat(tokenListOfWallet);
  // let addedTokenList = [];
  // tokenListOfWallet.map(tokenItem => {if (tokenItem.id.substr(0, 2) === '0x') addedTokenList.push(tokenItem.id)});
  // tokenList = tokenList.concat(addedTokenList);

  for (let i =0; i < chainIdList.length; i++) {
    const crrTokenList = await getWalletTokenListByDebank(data.wallet, chainIdList[i]);

    // global_token_info_from_debank = global_token_info_from_debank.concat(crrTokenList);
    
    let addedTokenList = [];
    crrTokenList.map(tokenItem => {
      if (tokenItem.price > 0) {
        addedTokenList.push(tokenItem.id)
        global_token_info_from_debank.push(tokenItem);
      }
    });
    tokenList = tokenList.concat(addedTokenList);

    let crrBalance = await getTokenBalances(chainIdListForMoralis[i], data.wallet.toLowerCase(), data.blockheight);
    crrBalance = crrBalance.map(item => ({...item, chain: chainIdListForMoralis[i], chainForDebank: chainIdList[i]}))
    global_balances = global_balances.concat(crrBalance);

    // add native token balance to global_balance
    let crrNativeTokenvBalance = await getNativeTokenBalances(chainIdListForMoralis[i], data.wallet.toLowerCase(), data.blockheight);
    global_balances.push({...crrNativeTokenvBalance, token_address: chainIdList[i], chain: chainIdListForMoralis[i], chainForDebank: chainIdList[i]});

    global_transfers = global_transfers.concat(await getTokenTransfers(chainIdListForMoralis[i], data.wallet.toLowerCase(), data.blockheight));
    const crrTx = await getTransactions(chainIdListForMoralis[i], data.wallet.toLowerCase(), data.blockheight);
    global_tx = global_tx.concat(crrTx);
    
    //Copy native transfers to ERC20 transfers
    const native_xfers = crrTx.filter((xfer) => xfer.value > 0);
    for (let i = 0; i < native_xfers.length; i++) {
      const tx = native_xfers[i];
      global_transfers.push({
        address: chainIdList[i], //token address = wmatic
        block_hash: tx.block_hash,
        block_number: tx.block_number,
        block_timestamp: tx.block_timestamp,
        from_address: tx.from_address,
        to_address: tx.to_address,
        transaction_hash: tx.hash,
        value: tx.value, //tx value
        gas: tx.gas,
        gas_price: tx.gas_price
      });
    }

    //Get token metadata
    const crrTokenMeta = await getTokenMetadata(chainIdListForMoralis[i], addedTokenList);
    global_token_meta = global_token_meta.concat(crrTokenMeta);
  }

    /**
    global_balances = await getTokenBalances(data.chain, data.wallet.toLowerCase(), data.blockheight);
    global_transfers = await getTokenTransfers(data.chain, data.wallet.toLowerCase(), data.blockheight);
    global_tx = await getTransactions(data.chain, data.wallet.toLowerCase(), data.blockheight);
    console.log('globle_tx length', global_tx?.length || 0)

    global_token_info_from_debank = await getWalletTokenListByDebank(chainCoins[data.chain].chainId, data.wallet);
  
  */
 
 //Sort global_transfers reverse-chronological by block_number
  global_transfers = global_transfers.sort(sortBlockNumber_reverseChrono);
 
  // console.log('GLOBAL_BALANCE BEFORE FILTER', global_balances.length)
  global_balances = global_balances.filter((each) => each && tokenList.includes(each.token_address));
  // global_balances = global_balances.filter((each) => each && chainIdListForMoralis.includes(each.chain));
  // console.log('GLOBAL_BALANCE AFTER FILTER', global_balances)
  serverProcess.total_step = global_balances.length + 1;
  serverProcess.current_step = 1;

  //Run cost basis for illiquid tokens
  let cost_basis = 0;
  //TODO: Make this loop asynchronous using Promise.allSettled
  for (let i = 0; i < global_balances.length; i++) {
    serverProcess.message = `calculating cost basis (${i + 1}/${global_balances.length})...`
    let returnData = [];
    const crrBalance = global_balances[i];
    crrBalance.usdPrice = null;
    // console.log('global balances', crrBalance)

    const tokenInfo = global_token_info_from_debank.filter(token => token.id === crrBalance.token_address)[0] || {};
    // can get protocol id by this. tokenInfo includes crrBalance
    const protocolId = tokenInfo?.protocol_id || '';
    const protocolInfo = protocolList.filter(protocol => protocol.id === protocolId)[0] || {};
    const chainInfo = global_chain_list[crrBalance.chain] || {};

    let price = null;
    if (crrBalance.token_address.substr(0, 2) === '0x') {
      price = await getTokenPrice(
        crrBalance.chain,
        crrBalance.token_address,
        data.blockheight
      );
    } else {
      const result = await getTokenInfoByDebank(
        crrBalance.chainForDebank,
        crrBalance.token_address
      );
      crrBalance.symbol = result.symbol;
      price = {
        usdPrice: result.price
      };
    }
    
    if (price) {
      serverProcess.current_step = (i + 1) + 1;

      result.push({
        id: chainInfo.id || '',
        chain: chainInfo.name || '',
        chain_id: chainInfo.community_id || '',
        chain_logo: chainInfo.logo_url || null,
        type: 'Wallet',
        type_img: '../assets/images/wallet.jpg',
        protocol: protocolInfo.name || '',
        protocol_logo: protocolInfo.logo_url || null,
        protocol_url: protocolInfo.site_url || null,
        assets: [{
          id: crrBalance.token_address,
          ticker: crrBalance.symbol,
          logo: crrBalance.logo || tokenInfo.logo_url || null,
        }],
        units: 123,
        cost_basis: price.usdPrice || 0,
        _comment: 'No cost info yet for wallet positions',
        value: price.usdPrice || 0,
        history: [],
      })
      continue;
    }
    const tokenHistory = await getTokenCostBasis(
      crrBalance.chain,
      data.blockheight,
      data.wallet.toLowerCase(),
      {
        ...crrBalance,
        address: crrBalance.token_address
      },
      crrBalance.balance / 10 ** crrBalance.decimals,
      1,
      {},
      [],
    );
    cost_basis = tokenHistory.cost_basis;
    returnData = returnData.concat(tokenHistory.history);

    serverProcess.current_step = (i + 1) + 1;
    
    result.push({
      id: chainInfo.id || '',
      chain: chainInfo.name || '',
      chain_id: chainInfo.community_id || '',
      chain_logo: chainInfo.logo_url || null,
      type: 'Yield',
      type_img: '../assets/images/yield.jpg',
      protocol: protocolInfo.name || '',
      protocol_logo: protocolInfo.logo_url || null,
      protocol_url: protocolInfo.site_url || null,
      assets: tokenHistory.assets || [],
      units: 123,
      cost_basis,
      _comment: 'No cost info yet for wallet positions',
      value: tokenInfo.price? cost_basis * tokenInfo.price : 456,
      history: returnData.reverse(),
    })
  }
  return result;
}

async function getTokenCostBasis(chain, blockheight, wallet, token, balance, hierarchy_level, parent_transaction, assets) {
  console.log('Cost basis for: Chain:' + chain + ' Token:' + token.address + ' Block:' + blockheight + ' balance: ' + balance);

  // initialize cost_basis and balance
  let cost_basis = 0, current_balance = balance, newHistory = [];

  // retrieve list of token transactions to/from wallet, prior to block
  let token_transactions = global_transfers.filter((xfer) => xfer && xfer.address == token.address && xfer.used == undefined && (!blockheight || Number(xfer.block_number) <= Number(blockheight)));
  // console.log('token transactions', token_transactions.length);

  // get token meta data
  let token_meta = global_token_meta.filter((meta) => meta.address == token.address)[0];
  if (!token_meta) {
    token_meta = await getTokenMetadata(chain, [token.address]);
    if (token_meta) global_token_meta.push(token_meta);
  }
  let token_info = global_token_info_from_debank.filter((tk) => tk.id === token.address)[0];
  if (!token_info && token.chainForDebank) {
    token_info = await getTokenInfoByDebank(token.chainForDebank, token.address);
    if (token_info) global_token_info_from_debank.push(token_info);
  }
  if (token_info) {
    assets.push({
      id: token_info.id,
      ticker: token_info.symbol,
      logo: token_info.logo_url
    });
  }
  // console.log('token meta', token_meta);

  // get native price
  const native_price = global_chain_list[chain]? (await getTokenPrice(chain, global_chain_list[chain].wrapped_token_id, blockheight)) : {};
  // console.log('native price', native_price);

  // confirm wether token is valued or not
  let price = await getTokenPrice(chain, token.address, blockheight);

  if (price) {
    cost_basis = balance * price.usdPrice;
    newHistory.push({
      units: token.value / 10 ** (token_meta?.decimals || 18),
      transaction_id: parent_transaction.transaction_hash,
      transaction_url: `https://polygonscan.com/tx/${parent_transaction.transaction_hash}`,
      datetime: convertDateTime(parent_transaction.block_timestamp),
      token_id: token.address,
      token_name: token_meta?.name,
      token_img: token_info?.logo_url || '',
      fee_native_coin: global_chain_list[chain]?.native_token_id || chain,
      cost_basis,
      hierarchy_level,
      valued_directly: true,
    })
    // console.log('Token: ' + token.address + ' Cost= ' + cost_basis);
    return {cost_basis, history: newHistory};
  }


  // process token transactions in reverse chronological order is skipped because global_transfers is already in that form
  token_transactions = token_transactions.sort(sortBlockNumber_reverseChrono);
  
  // For each transactions
  for (let i = 0; i < token_transactions.length; i++) {
    const transaction = token_transactions[i];
    // console.log('transaction', transaction);

    const transaction_detail = global_tx.filter((tx) => tx.hash === transaction.transaction_hash)[0] || {};

    // confirm whether token is received or not
    let isReceived = true;
    if (transaction.from_address.toLowerCase() == wallet) {
      isReceived = false; //from my wallet. debit outflow
    } else if (transaction.to_address.toLowerCase() == wallet) {
      isReceived = true; //to my wallet. credit inflow
    } else {
      console.log('Error: wallet address ' + wallet + ' not found in transaction ' + transaction.transaction_hash);
      continue;
    }

    //calculate the balance of token in wallet, just before transaction.
    const units_of_token = transaction.value / 10 ** (token_meta?.decimals || 18);
    current_balance = current_balance + (isReceived? -1 : 1) * units_of_token;
    // console.log('current balance', current_balance);

    // calculate the cost basis of current transaction
    const offsetting_coins = global_transfers.filter((xfer) =>
      xfer.transaction_hash == transaction.transaction_hash &&
      xfer.used == undefined &&
      (isReceived? (xfer.from_address.toLowerCase() == wallet) : (xfer.to_address.toLowerCase() == wallet))
    );

    // console.log('offsetting coins', offsetting_coins.length);
    let childHistory = [];
    
    for (let i = 0; i < offsetting_coins.length; i++) {
      let offsetting_coin = offsetting_coins[i];
      // console.log('offsetting coin', offsetting_coin);
      offsetting_coin.used = true;
      offsetting_coin.chainForDebank = token.chainForDebank;
      const coin_meta = global_token_meta?.filter((t) => t.address == offsetting_coin.address)[0];
      const balance_of_offsetting_coin = offsetting_coin.value / 10 ** (coin_meta?.decimals || 18);
      const getTokenCostBasisResult = await getTokenCostBasis(
        chain,
        offsetting_coin.block_number,
        wallet,
        offsetting_coin,
        balance_of_offsetting_coin,
        hierarchy_level + 1,
        transaction,
        assets,
      );
      cost_basis = cost_basis + (isReceived? 1 : -1) * getTokenCostBasisResult.cost_basis;
      // newHistory = newHistory.concat(getTokenCostBasisResult.history);
      childHistory = childHistory.concat(getTokenCostBasisResult.history);
      // childHistory.push(getTokenCostBasisResult.history);
    }
    const fee_native_units = transaction_detail.gas * transaction_detail.gas_price / 10 ** (token_meta?.decimals || 18);
    newHistory.push({
      units: transaction.value / 10 ** (token_meta?.decimals || 18),
      transaction_id: transaction.transaction_hash,
      transaction_url: `https://polygonscan.com/tx/${transaction.transaction_hash}`,
      datetime: convertDateTime(transaction.block_timestamp),
      token_id: token.address,
      token_name: token_meta?.name,
      token_img: token_info?.logo_url || '',
      fee_native_coin: global_chain_list[chain]?.native_token_id || chain,
      fee_native_units,
      fee_usd: fee_native_units * native_price?.usdPrice || 0,
      cost_basis,
      hierarchy_level,
      valued_directly: false,
      child: childHistory,
    })
    
    // ********* STOP CONDITION *********
    if (current_balance <= 0) break;
  }
  
  return {cost_basis, history: newHistory};
}