const moralisServices = require('./moralisUtils');
const debankServices = require('./debankUtils');
const constants = require('./constant');

function convertDateTime(time) {
  if (!time) return '';
  return time.split('.')[0];
}

function sortBlockNumber_reverseChrono(a, b) {
  if (a.block_number > b.block_number) {
    return -1;
  }
  if (a.block_number < b.block_number) {
    return 1;
  }
  return 0;
}

module.exports = async function calcCostBasis(data) {
  let returnData = [];

  global_balances = await moralisServices.getTokenBalances(data.chain, data.wallet.toLowerCase(), data.blockheight);
  global_transfers = await moralisServices.getTokenTransfers(data.chain, data.wallet.toLowerCase(), data.blockheight);
  global_tx = await moralisServices.getTransactions(data.chain, data.wallet.toLowerCase(), data.blockheight);

  global_token_info_from_debank = await debankServices.getTokenInfoByDebank(data.chain, data.wallet);

  //Copy native transfers to ERC20 transfers
  native_xfers = global_tx.filter((xfer) => xfer.value > 0);
  for (let i = 0; i < native_xfers.length; i++) {
    const tx = native_xfers[i];
    global_transfers.push({
      address: constants.chainCoins[data.chain].address, //token address = wmatic
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

  //Sort global_transfers reverse-chronological by block_number
  global_transfers = global_transfers.sort(sortBlockNumber_reverseChrono);

  //Get token metadata
  var token_list = global_transfers.map((xfer) => xfer.address);
  token_list.push(constants.chainCoins[data.chain].address); //add native token
  token_list = Array.from(new Set(token_list)); //de-dupe
  global_token_meta = await moralisServices.getTokenMetadata(data.chain, token_list);

  // global_token_meta_rest = await getTokenMetadataRestApi(data.chain, token_list);
  // writeToFile(`'getTokenMetaData_${Number(new Date())}`, {
  //   option: {chain: data.chain, tokenList: token_list},
  //   web3: global_token_meta,
  //   rest: global_token_meta_rest,
  // });

  // console.log('global token meta', global_token_meta)

  //If token specified in request, just do that token instead of the whole wallet
  if (data.token) {
    global_balances = global_balances.filter((each) => each.token_address == data.token);
  }

  //Run cost basis for illiquid tokens
  let cost_basis = 0;
  //TODO: Make this loop asynchronous using Promise.allSettled
  for (let i = 0; i < global_balances.length; i++) {
    global_balances[i].usdPrice = null;
    // console.log('global balances', global_balances[i])
    const tokenHistory = await getTokenCostBasis(
      data.chain,
      data.blockheight,
      data.wallet.toLowerCase(),
      {
        ...global_balances[i],
        address: global_balances[i].token_address
      },
      global_balances[i].balance / 10 ** global_balances[i].decimals,
      1,
      {}
    );
    cost_basis = tokenHistory.cost_basis;
    returnData = returnData.concat(tokenHistory.history);
  }

  // return returnData.reverse();
  return [{
    id: "p2",
		chain: "Polygon",
		chain_id: 123,
		chain_logo: "https://debank.com/static/media/polygon.23445189.svg",
		type: "Yield",
		type_img: "../assets/images/yield.jpg",
		protocol: "Kogefarm",
		protocol_logo: "https://static.debank.com/image/project/logo_url/ftm_kogefarm/55341a6e10b63e331441928a6bb19572.png",
		protocol_url: "https://kogefarm.io/vaults",
		assets: [
			{
				id: "0x123",
				ticker: "WMATIC",
				logo: "https://static.debank.com/image/matic_token/logo_url/matic/e5a8a2860ba5cf740a474dcab796dc63.png"
			},
			{
				id: "0x8a953cfe442c5e8855cc6c61b1293fa648bae472",
				ticker: "POLYDOGE",
				logo: "https://assets.coingecko.com/coins/images/15146/small/p1kSco1h_400x400.jpg?1619842715"
			}
		],
		units: 123,
		cost_basis,
		_comment: "No cost info yet for wallet positions",
		value: 456,
    history: returnData.reverse(),
  }];
}

async function getTokenCostBasis(chain, blockheight, wallet, token, balance, hierarchy_level, parent_transaction) {
  console.log('Cost basis for: Token:' + token.address + ' Block:' + blockheight + ' balance: ' + balance);

  // initialize cost_basis and balance
  let cost_basis = 0, current_balance = balance, newHistory = [];

  // retrieve list of token transactions to/from wallet, prior to block
  let token_transactions = global_transfers.filter((xfer) => xfer.address == token.address && xfer.used == undefined && Number(xfer.block_number) <= Number(blockheight));

  // get token meta data
  const token_meta = global_token_meta.filter((meta) => meta.address == token.address)[0];
  const token_info = global_token_info_from_debank.filter((tk) => tk.id === token.address)[0];
  // console.log('token meta', token_meta);

  // get native price
  const native_price = await moralisServices.getTokenPrice(chain, constants.chainCoins[chain].address, blockheight);
  // console.log('native price', native_price);

  // confirm wether token is valued or not
  let price = await moralisServices.getTokenPrice(chain, token.address, blockheight);
  // console.log('price', price);
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
      fee_native_coin: constants.chainCoins[chain].native_coin,
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
      const coin_meta = global_token_meta.filter((t) => t.address == offsetting_coin.address)[0];
      const balance_of_offsetting_coin = offsetting_coin.value / 10 ** (coin_meta?.decimals || 18);
      const getTokenCostBasisResult = await getTokenCostBasis(
        chain,
        offsetting_coin.block_number,
        wallet,
        offsetting_coin,
        balance_of_offsetting_coin,
        hierarchy_level + 1,
        transaction,
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
      fee_native_coin: constants.chainCoins[chain].native_coin,
      fee_native_units,
      fee_usd: fee_native_units * native_price.usdPrice,
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