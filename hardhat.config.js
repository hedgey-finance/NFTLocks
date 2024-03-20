require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-waffle');
require('hardhat-gas-reporter');
require('hardhat-deploy');
require('dotenv').config();

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP,
    gasPriceApi: 'https://api.etherscan.io/api?module=proxy&action=eth_gasPrice',
    gasPrice: 40,
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [process.env.TEST_DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    goerli: {
      url: process.env.GOERLI_URL,
      accounts: [process.env.TEST_DEPLOYER_PRIVATE_KEY],
    },
    optimisticGoerli: {
      url: process.env.OPTIMISTIC_GOERLI_URL,
      accounts: [process.env.TEST_DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
      gasPrice: 2000000000,
    },
    mainnet: {
      url: process.env.MAINNET_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    gnosis: {
      url: process.env.GNOSIS_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    arbitrumOne: {
      url: process.env.ARBITRUM_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    polygon: {
      url: process.env.POLYGON_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
      gasPrice: 130000000000,
    },
    opera: {
      url: process.env.FANTOM_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    avalanche: {
      url: process.env.AVALANCHE_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    bsc: {
      url: process.env.BSC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    optimisticEthereum: {
      url: process.env.OPTIMISM_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    harmony: {
      url: process.env.HARMONY_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    boba: {
      url: process.env.BOBA_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    aurora: {
      url: process.env.AURORA_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    oec: {
      url: process.env.OEC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    evmos: {
      url: process.env.EVMOS_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    celo: {
      url: process.env.CELO_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    base: {
      url: process.env.BASE_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
      gasPrice: 2000000000,
    },
    mantle: {
      url: process.env.MANTLE_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    palm: {
      url: process.env.PALM_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    viction: {
      url: process.env.VICTION_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.NEW_CLAIM_PRIVATE_KEY],
    },
    pgn: {
      url: process.env.PGN_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
      gasPrice: 1500000000,
    },
    lineaTestnet: {
      url: process.env.LINEAGOERLI_URL,
      accounts: [process.env.TOKEN_DEPLOYER],
    },
    linea: {
      url: process.env.LINEA_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    shimmer: {
      url: process.env.SHIMMER_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    zkEvm: {
      url: process.env.ZKEVM_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.TOKEN_DEPLOYER],
    },
    swissDLT: {
      url: process.env.SWISSDLT_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY, process.env.NEW_CLAIM_PRIVATE_KEY],
    },
  },
  etherscan: {
    customChains: [
      {
        network: 'gnosis',
        chainId: 100,
        urls: {
          apiURL: 'https://api.gnosisscan.io/api',
          browserURL: 'https://gnosisscan.io/',
        },
      },
      {
        network: 'boba',
        chainId: 288,
        urls: {
          apiURL: 'https://api.bobascan.com/api',
          browserURL: 'https://bobascan.com',
        },
      },
      {
        network: 'celo',
        chainId: 42220,
        urls: {
          apiURL: 'https://api.celoscan.io/api',
          browserURL: 'https://celoscan.io/',
        },
      },
      {
        network: 'mantle',
        chainId: 5000,
        urls: {
          apiURL: 'https://explorer.mantle.xyz/api',
          browserURL: 'https://explorer.mantle.xyz/',
        },
      },
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org/',
        },
      },
      {
        network: 'aurora',
        chainId: 1313161554,
        urls: {
          apiURL: 'https://explorer.mainnet.aurora.dev/api',
          browserURL: 'https://explorer.aurora.dev/',
        },
      },
      {
        network: 'palm',
        chainId: 11297108109,
        urls: {
          apiURL: 'https://explorer.palm.io/api',
          browserURL: 'https://explorer.palm.io/',
        }
      },
      {
        network: 'pgn',
        chainId: 424,
        urls: {
          apiURL: 'https://explorer.publicgoods.network/api',
          browserURL: 'https://explorer.publicgoods.network/',
        }
      },
      {
        network: 'evmos',
        chainId: 9001,
        urls: {
          apiURL: 'https://escan.live/api',
          browserURL: 'https://escan.live/',
        }
      },
      {
        network: 'viction',
        chainId: 88,
        urls: {
          apiURL: 'https://vicscan.xyz/api/contract/hardhat/verify',
          browserURL: 'https://vicscan.xyz',
        }
      },
      {
        network: 'linea',
        chainId: 59144,
        urls: {
         apiURL: 'https://api.lineascan.build/api',
         browserURL: 'https://lineascan.build/' 
        }
      },
      {
        network: 'lineaTestnet',
        chainId: 59140,
        urls: {
          apiURL: 'https://api-goerli.lineascan.build/api',
          browserURL: 'https://goerli.lineascan.build/',
        }
      },
      {
        network: 'oec',
        chainId: 66,
        urls: {
          apiURL: 'https://www.oklink.com/api/explorer/v5/oktc/contract/verify',
          browserURL: 'https://www.oklink.com/oktc',
        }
      },
      {
        network: 'shimmer',
        chainId: 148,
        urls: {
          apiURL: 'https://explorer.evm.shimmer.network/api/',
          browserURL: 'https://explorer.evm.shimmer.network/',
        }
      },
      {
        network: 'zkEvm',
        chainId: 1101,
        urls: {
          apiURL: 'https://api-zkevm.polygonscan.com/api',
          browserURL: 'https://zkevm.polygonscan.com/',
        }
      },
      {
        network: 'swissDLT',
        chainId: 94,
        urls: {
          apiURL: 'https://explorer.swissdlt.ch/api',
          browserURL: 'https://explorer.swissdlt.ch/',
        }
      },
    ],
    apiKey: {
      sepolia: process.env.ETHERSCAN_APIKEY,
      goerli: process.env.ETHERSCAN_APIKEY,
      mainnet: process.env.ETHERSCAN_APIKEY,
      gnosis: process.env.GNOSIS_APIKEY,
      arbitrumOne: process.env.ARBITRUM_APIKEY,
      polygon: process.env.POLYGON_APIKEY,
      opera: process.env.FANTOM_APIKEY,
      avalanche: process.env.AVALANCHE_APIKEY,
      bsc: process.env.BSC_APIKEY,
      optimisticEthereum: process.env.OPTIMISM_APIKEY,
      harmony: process.env.HARMONY_APIKEY,
      boba: process.env.BOBA_APIKEY,
      aurora: process.env.AURORA_APIKEY,
      oec: process.env.OEC_APIKEY,
      evmos: process.env.EVMOS_APIKEY,
      celo: process.env.CELO_APIKEY,
      optimisticGoerli: process.env.OPTIMISTICGOERLI_APIKEY,
      base: process.env.BASE_APIKEY,
      mantle: process.env.MANTLE_APIKEY,
      palm: process.env.PALM_APIKEY,
      pgn: process.env.PGN_APIKEY,
      linea: process.env.LINEA_APIKEY,
      lineaTestnet: process.env.LINEA_APIKEY,
      shimmer: process.env.SHIMMER_APIKEY,
      viction: process.env.VICTION_APIKEY,
      zkEvm: process.env.ZKEVM_APIKEY,
      swissDLT: process.env.SWISSDLT_APIKEY,
    },
  },
};
