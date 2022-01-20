const axios = require('axios');
const constants = require('./constant');

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
      url: `https://openapi.debank.com/v1/user/token_list?chain_id=${constants.chainCoins[_chain].chainId}&id=${_address}&is_all=true`
    });
    return result.data;
  } catch(err) {
    console.log('get token price', err);
    return null;
  }
}

module.exports = {
  getWalletBalanceByDebank,
  getWalletTokenListByDebank,
  getProtocolListByDebank,
  getTokenInfoByDebank,
}