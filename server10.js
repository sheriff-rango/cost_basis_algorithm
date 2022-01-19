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

const chainIdTable = {
  eth: 'eth',
  bsc: 'bsc',
  matic: 'polygon',
  avax: 'avalanche',
  ftm: 'fantom'
}

let testData = {
  // wallet: '0x3ddfa8ec3052539b6c9549f12cea2c295cff5296',
  wallet: '0x704111eDBee29D79a92c4F21e70A5396AEDCc44a',
  // blockheight: 20138207,
  // chain: 'polygon',
};

GLOBAL_API_KEY_INDEX = 0;
const TRANSACTION_MAX = 2000; // max length of fetched transaction to avoid error of rate exceed


Moralis.start({ serverUrl, appId })
.then(() => {
  console.log('moralis successfully started');
  serverProcess.moralis_started = true;
  getWalletCostHistory();
})
.catch((e) => {
  console.log('moralis start error', e);
  // history = 'moralis start error';
  serverProcess.isRunning = false;
});

function getWalletCostHistory(callback) {
  serverProcess.isRunning = true;
  history = null;
  const startTime = new Date();
  getWalletCostBasis(testData)
  .then((result) => {
    const endTime = new Date();
    console.log('final result ', result?.length, `in ${(endTime - startTime) / 1000}s`);
    fs.writeFileSync('./result.json', JSON.stringify(result || ''));
    history = result.sort((item1, item2) => item2.value - item1.value);
    serverProcess.isRunning = false;
    if (callback) callback(result);
  })
  .catch((e) => {
    console.log('get wallet cost basis error', e);
    serverProcess.isRunning = false;
    if (callback) callback(null);
  });
}

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
      // url: `https://openapi.debank.com/v1/user/token_list?id=${_address}${_chain? `&chain_id=${_chain}` : ''}&is_all=${_isAll === undefined? 'true' : isAll}`
      url: `https://openapi.debank.com/v1/user/token_list?id=${_address}${_chain? `&chain_id=${_chain}` : ''}&is_all=${_isAll || false}`
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
    const result = await Moralis.Web3API.account.getTransactions(options);
    // const result = await sendRequest({
    //   apiKey: getApiKey(),
    //   url: `https://deep-index.moralis.io/api/v2/${options.address}?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}&offset=${options.offset}`
    // });
    if (Number(result?.total) > 500) {
      let page = 1, txFunctions = [], mergeResult = result.result;
      while (page < Math.ceil(result.total / 500) && mergeResult.length <= TRANSACTION_MAX) {
        options.offset = page * 500;
        txFunctions.push(Moralis.Web3API.account.getTransactions(options));
        // txFunctions.push(sendRequest({
        //   apiKey: getApiKey(),
        //   url: `https://deep-index.moralis.io/api/v2/${options.address}?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}&offset=${options.offset}`
        // }));
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
    return await Moralis.Web3API.token.getTokenPrice(options);
    // return await sendRequest({
    //   apiKey: getApiKey(),
    //   url: `https://deep-index.moralis.io/api/v2/erc20/${options.address}/price?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}`
    // });
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
    const getTokenBalancesResult = await Moralis.Web3API.account.getTokenBalances(options);
    // const getTokenBalancesResult = await sendRequest({
    //   apiKey: getApiKey(),
    //   url: `https://deep-index.moralis.io/api/v2/${options.address}/erc20?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}`
    // });
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
    const getTokenBalancesResult = await Moralis.Web3API.account.getNativeBalance(options);
    // const getTokenBalancesResult = await sendRequest({
    //   apiKey: getApiKey(),
    //   url: `https://deep-index.moralis.io/api/v2/${options.address}/balance?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}`
    // });
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
    const result = await Moralis.Web3API.account.getTokenTransfers(options);
    // const result = await sendRequest({
    //   apiKey: getApiKey(),
    //   url: `https://deep-index.moralis.io/api/v2/${options.address}/erc20/transfers?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}&offset=${options.offset}`
    // });
    if (Number(result?.total) > 500) {
      let page = 1, transferFunctions = [], mergeResult = result.result;
      while (page < Math.ceil(result.total / 500) && mergeResult.length <= TRANSACTION_MAX) {
        options.offset = page * 500;
        transferFunctions.push(Moralis.Web3API.account.getTokenTransfers(options));
        // transferFunctions.push(sendRequest({
        //   apiKey: getApiKey(),
        //   url: `https://deep-index.moralis.io/api/v2/${options.address}/erc20/transfers?chain=${options.chain}${options.to_block? `&to_block=${options.to_block}` : ''}&offset=${options.offset}`
        // }));
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

async function getWalletCostBasis(data) {
  console.log('started getting wallet cost basis...');
  serverProcess.total_step = 1;
  serverProcess.current_step = 0;
  serverProcess.message = 'preparing data for calculation...';
  let result = [];
  
  // initiate global variables
  global_balances = [];
  global_transfers = [];
  global_tx = [];
  global_token_info_from_debank = [];
  global_token_meta = [];
  global_chain_list = [];

  const protocolList = await getProtocolListByDebank();
  global_chain_list = (await getWalletBalanceByDebank(data.wallet)).chain_list;
  let tokenList = [];

  for (let i = 0; i < global_chain_list.length; i++) {
    const chain = global_chain_list[i];
    if (!chainIdTable[chain.id]) continue;
    if (chain.usd_value <= 0) continue;

    let balances = await getTokenBalances(chainIdTable[chain.id] || 'eth', data.wallet.toLowerCase(), data.blockheight);

    // add native token balance to balances
    const nativeTokenBalance = await getNativeTokenBalances(chainIdTable[chain.id] || 'eth', data.wallet.toLowerCase(), data.blockheight);
    balances.push({...nativeTokenBalance, token_address: chain.id})

    let transfers = await getTokenTransfers(chainIdTable[chain.id] || 'eth', data.wallet.toLowerCase(), data.blockheight);

    const transactions = await getTransactions(chainIdTable[chain.id] || 'eth', data.wallet.toLowerCase(), data.blockheight);

    // copy native transfers to ERC20 transfers
    for (let j = 0; j < transactions.length; j++) {
      const transaction = transactions[j];
      if (Number(transaction) <= 0) continue;

      transfers.push({
        address: chain.id, //token address = wmatic
        block_hash: transaction.block_hash,
        block_number: transaction.block_number,
        block_timestamp: transaction.block_timestamp,
        from_address: transaction.from_address,
        to_address: transaction.to_address,
        transaction_hash: transaction.hash,
        value: transaction.value,

        gas: transaction.gas,
        gas_price: transaction.gas_price
      })
    }

    //sort global_transfers reverse-chronological by block_number
    transfers = transfers.sort(sortBlockNumber_reverseChrono);
    
    // /**
    //   tokenList.push(chain.wrapped_token_id || chain.native_token_id);
    //   if (chain_details[chain.id] && chain_details[chain.id].wrapped_token.address) tokenList.push(chain_details[chain.id].wrapped_token.address);
    // */
      
    if (chain.wrapped_token_id) tokenList.push(chain.wrapped_token_id);
    
    const tokenListOfChain = await getWalletTokenListByDebank(data.wallet, chain.id, true);
    
    let tokenIdListOfChain = [], nativeTokenId = null;
    for (let j = 0; j < tokenListOfChain.length; j++) {
      const token = tokenListOfChain[j];
      if (token.price <= 0) continue;
      if (token.id.substr(0, 2) === '0x') {
        tokenIdListOfChain.push(token.id);
      } else {
        nativeTokenId = token.id;
      }
    }
    // writeToFile(`token_id_list_of_${chain.id}`, tokenIdListOfChain);

    // get token metadata
    const tokenMeta = await getTokenMetadata(chainIdTable[chain.id] || 'eth', tokenIdListOfChain);
    // writeToFile(`token_metadata_${chain.id}`, tokenMeta);

    for (let j = 0; j < tokenListOfChain.length; j++) {
      const token = tokenListOfChain[j];
      if (token.price <= 0) continue;
      let cost_basis = 0;
      const filteredBalance = balances.filter(balance => balance?.token_address === token.id)[0];
      if (!filteredBalance) continue;
      
      const protocolId = token.protocol_id || '';
      const protocolInfo = protocolList.filter(protocol => protocol.id === protocolId)[0] || {};
      const price = await getTokenPrice(chainIdTable[chain.id] || 'eth', filteredBalance.token_address, data.blockheight);
      if (price) {
        result.push({
          id: chain.id || '',
          chain: chain.name || '',
          chain_id: chain.community_id || '',
          chain_logo: chain.logo_url || null,
          type: 'Wallet',
          type_img: '../assets/images/wallet.jpg',
          protocol: protocolInfo.name || '',
          protocol_logo: protocolInfo.logo_url || null,
          protocol_url: protocolInfo.site_url || null,
          assets: [{
            id: filteredBalance.token_address,
            ticker: filteredBalance.symbol,
            logo: filteredBalance.log || null,
          }],
          units: 123,
          cost_basis: price.usdPrice || 0,
          _comment: 'No cost info yet for wallet positions',
          value: (price.usdPrice || 0) * (filteredBalance.balance || 0) / 10 ** (filteredBalance.decimals || 18),
          history: [],
        });
        continue;
      }
      const tokenHistory = await getTokenCostBasis(
        chainIdTable[chain.id] || 'eth',
        data.blockheight,
        data.wallet.toLowerCase(),
        {...filteredBalance, address: filteredBalance.token_address},
        filteredBalance.balance / 10 ** (filteredBalance.decimals || 18),
        1,
        {},
        {transfers, chain, transactions}
      );
      cost_basis = tokenHistory.cost_basis;
      result.push({
        id: chain.id || '',
        chain: chain.name || '',
        chain_id: chain.community_id || '',
        chain_logo: chain.logo_url || null,
        type: 'Yield',
        type_img: '../assets/images/yield.jpg',
        protocol: protocolInfo.name || '',
        protocol_logo: protocolInfo.logo_url || null,
        protocol_url: protocolInfo.site_url || null,
        assets: tokenHistory.assets || [],
        units: 123,
        cost_basis: tokenHistory.cost_basis,
        _comment: 'No cost info yet for wallet positions',
        value: token.price? cost_basis * token.price : 456,
        history: tokenHistory.history.reverse(),
      });
    }
  }
}

async function getTokenCostBasis(chain, blockheight, wallet, token, balance, hierarchy_level, parent_transaction, global_values) {
  console.log('Cost basis for: Chain:' + chain + ' Token:' + token.address + ' Block:' + blockheight + ' balance: ' + balance);
  
  // initialize cost_basis and balance
  let cost_basis = 0, current_balance = balance, newHistory = [], assets = [];

  // retrieve list of token transactions to/from wallet, prior to block
  let token_transactions = global_values.transfers.filter(transfer => transfer && transfer.address == token.address && transfer.used == undefined && (!blockheight || Number(transfer.block_number) <= Number(blockheight)))

  // get token meta data and token info
  const token_meta = await getTokenMetadata(chain, [token.address])[0];
  const token_info = await getTokenInfoByDebank(global_values.chain.id, token.address);
  if (token_info) {
    assets.push({
      id: token_info.id,
      ticker: token_info.symbol,
      logo: token_info.logo_url,
    })
  }

  // get native price
  const native_price = await getTokenPrice(chain, global_values.chain.wrapped_token_id, blockheight) || {};

  // confirm whether token is valued or not
  const price = await getTokenPrice(chain, token.address, blockheight);

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
      fee_native_coin: global_values.chain,
      cost_basis,
      hierarchy_level,
      valued_directly: true,
    });
    return {cost_basis, history: newHistory, assets};
  }

  // process token transactions in reverse chronological order is skipped because global_transfers is already in that form
  token_transactions = token_transactions.sort(sortBlockNumber_reverseChrono);

  // for each transactions
  for (let i = 0; i < token_transactions.length; i++) {
    const transaction = token_transactions[i];

    const transaction_detail = global_values.transactions.filter(tx => tx.hash === transaction.transaction_hash)[0] || {};

    // confirm whether token is received or not
    let isReceived = true;
    if (transaction.from_address.toLowerCase() === wallet) {
      isReceived = false; // from my wallet. debit outflow
    } else if (transaction.to_address.toLowerCase() === wallet) {
      isReceived = true;  // to my wallet. credit inflow
    } else {
      console.log('Error: wallet address ' + wallet + 'is not found in transaction ' + transaction.transaction_hash);
      continue;
    }

    // calculate the balance of token in wallet, just before transaction
    const units_of_token = transaction.value / 10 ** (token_meta?.decimals || 18);
    current_balance = current_balance + (isReceived? -1 : 1) * units_of_token;

    // calculate the cost basis of current transaction
    const offsetting_coins = global_values.transfers.filter(xfer => 
      xfer.address &&
      xfer.transaction_hash == transaction.transaction_hash &&
      xfer.used == undefined &&
      (isReceived? (xfer.from_address.toLowerCase() == wallet) : (xfer.to_address.toLowerCase() == wallet))
    );
    
    let childHistory = [];

    for (let j = 0; j < offsetting_coins.length; j++) {
      let offsetting_coin = offsetting_coins[j];

      offsetting_coin.used = true;
      const coin_meta = await getTokenMetadata(chain, [offsetting_coin.address])[0];
      const balance_of_offsetting_coin = offsetting_coin.value / 10 ** (coin_meta?.decimals || 18);
      const getTokenCostBasisResult = await getTokenCostBasis(
        chain,
        offsetting_coin.block_number,
        wallet,
        offsetting_coin,
        balance_of_offsetting_coin,
        hierarchy_level + 1,
        transaction,
        global_values
      );
      cost_basis = cost_basis + (isReceived? 1 : -1) * getTokenCostBasisResult.cost_basis;
      childHistory = childHistory.concat(getTokenCostBasisResult.history);
      const assetsResult = getTokenCostBasisResult.assets.map(item => item.id);
      const assetsExist = assets.filter(item => assetsResult.includes(item.id))[0];
      if (!assetsExist) assets = assets.concat(getTokenCostBasisResult.assets || []);
    }
    const fee_native_units = transaction_detail.gas * transaction_detail.gas_price / 10 ** (token_meta?.decimals || 18)
    newHistory.push({
      units: transaction.value / 10 ** (token_meta?.decimals || 18),
      transaction_id: transaction.transaction_hash,
      transaction_url: `https://polygonscan.com/tx/${transaction.transaction_hash}`,
      datetime: convertDateTime(transaction.block_timestamp),
      token_id: token.address,
      token_name: token_meta?.name,
      token_img: token_info?.logo_url || '',
      fee_native_coin: global_values.chain.native_token_id || chain,
      fee_native_units,
      fee_usd: fee_native_units * native_price?.usdPrice || 0,
      cost_basis,
      hierarchy_level,
      valued_directly: false,
      child: childHistory,
    });

    // **************** STOP CONDITION ****************
    if (current_balance <= 0) break;
  }
  
  return {cost_basis, history: newHistory, assets};
}