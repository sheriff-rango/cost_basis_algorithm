const Moralis = require('moralis/node');
const sendRequest = require('./fetch');

GLOBAL_API_KEY_INDEX = 0;

const TRANSACTION_MAX = 2000;
let moralisStarted = false;

//server=defir_beta (preloaded with data for test wallet 0x...44a)
// const serverUrl = 'https://tjdngb7yqmm6.usemoralis.com:2053/server';
// const appId = 'ZRFrzeWTDRmhMFszuq7VSWgM5hgJI4GOY7cY2Ebx';

const serverUrl = 'https://8dyuriovbupo.usemoralis.com:2053/server';
const appId = 'rLSZFQmw1hUwtAjRnjZnce5cxu1qcPJzy01TuyU1';

// const serverUrl = 'https://ea4ql61igwkq.usemoralis.com:2053/server';
// const appId = 'ayFgiTCfWrFcBtgXqvwiLJQqSlGbnxYezYipOJQx';

// const serverUrl = 'https://nobftmga5e7k.usemoralis.com:2053/server';
// const appId = '1ECvf1IwjzCgTFYXyD44lIeVKPMgV6ZYFoUHrPwS';

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

function getApiKey() {
  // await sleep(DELAY);
  const result = apiKeys[GLOBAL_API_KEY_INDEX % apiKeys.length];
  GLOBAL_API_KEY_INDEX++;
  console.log('api key: ', GLOBAL_API_KEY_INDEX % apiKeys.length, result);
  return result;
}

function getServerState() {
  return moralisStarted;
}

function startMoralisServer(_callback) {
  Moralis.start({ serverUrl, appId })
  .then(() => {
    console.log('moralis successfully started');
    moralisStarted = true;
    GLOBAL_API_KEY_INDEX = 0;
    if (_callback) _callback(true, null);
  })
  .catch((e) => {
    console.log('moralis start error', e);
    serverState = false;
    if (_callback) _callback(false, e);
  });
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
    // console.log('get token balances', Moralis.Web3API.account);
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
    // console.log('get token balances', Moralis.Web3API.account);
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
    // console.log('get token transfer result', result);
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

module.exports = {
  getServerState,
  startMoralisServer,
  getTokenMetadata,
  getTransactions,
  getTokenPrice,
  getTokenBalances,
  getNativeTokenBalances,
  getTokenTransfers,
  getTokenMetadataRestApi,
  getTransactionsRestApi,
  getTokenPriceRestApi,
  getTokenBalancesRestApi,
  getTokenTransfersRestApi
};