const moralisServices = require('./utils/moralisUtils');
const debankServices = require('./utils/debankUtils');
const calcCostBasis = require('./utils/algorithm');
const constants = require('./utils/constant');
const { writeToFile } = require('./utils');

WALLET_ADDRESS = '0x704111eDBee29D79a92c4F21e70A5396AEDCc44a';

moralisServices.startMoralisServer(async (started, err) => {
  if (started) {
    console.log('moralis server started successfully');
    const walletCostBasis = await getWalletCostBasis();
    writeToFile('final', walletCostBasis);
    console.log(walletCostBasis);
  } else {
    console.log('moralis starting failed', err)
  }
})

async function getWalletCostBasis() {
  let result = [];

  const protocolList = await debankServices.getProtocolListByDebank();
  const chainList = (await debankServices.getWalletBalanceByDebank(WALLET_ADDRESS)).chain_list;

  for (let i = 0; i < chainList.length; i++ ) {
    const chain = chainList[i];
    if (!constants.chainIdTable[chain.id]) continue;
    if (chain.usd_value <= 0) continue;

    const tokenListOfChain = await debankServices.getWalletTokenListByDebank(WALLET_ADDRESS, chain.id, true);
    for (let j = 0; j < tokenListOfChain.length; j++) {
      const token = tokenListOfChain[j];
      console.log('chain = ', chain.id, 'token = ', token.id);
      let tokenId = token.id;
      if (tokenId.substr(0, 2) !== '0x') {
        tokenId = constants.chainCoins[constants.chainIdTable[chain.id]].address;
      }
      const crrCostBasis = await calcCostBasis({
        wallet: WALLET_ADDRESS,
        token: tokenId,
        // blockheight: 20138207,
        chain: constants.chainIdTable[chain.id],
      });
      result = result.concat(crrCostBasis);
    }
  }
  return result;
}