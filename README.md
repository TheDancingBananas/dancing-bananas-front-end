[![Deploy Production](https://github.com/TheDancingBananas/dancing-bananas-front-end/actions/workflows/deploy-prod.yml/badge.svg)](https://github.com/TheDancingBananas/dancing-bananas-front-end/actions/workflows/deploy-prod.yml)[![Deploy Staging](https://github.com/TheDancingBananas/dancing-bananas-front-end/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/TheDancingBananas/dancing-bananas-front-end/actions/workflows/deploy-staging.yml)

# Dancing Bananas


This repo is a fork of the web application for [Sommelier.finance](https://app.sommelier.finance) and designed as a new game for silly apes.

-   Find our website at [https://dancingbananas.fun/](https://dancingbananas.fun/)
-   💬 Join the [Dancing Bananas](https://t.me/getbananas) channel on Telegram to chat with the community.
-   🔔 Subscribe to [Impermanent Loss Alerts](https://t.me/getsomm_alerts) generated by the Sommelier stack.

## Packages

-   `client` - the frontend interface for the Sommelier stack. Made with [Create React App](https://github.com/facebook/create-react-app).
-   `deploy` - Scripts and tools for deployment on Sommelier infra (work in progress).
-   `server` - a Node.js Express server handling data querying and caching for the front end. No database - it's a stateless integration later.
-   `sommelier-types` - TypeScript types and other shared code between packages.
-   `workers` - Supporting workers and services to analyze and alert on changing market conditions.

## Ecosystem Dependencies

-   [Cosmos](https://cosmos.network/) - The Sommelier protocol is built on the Cosmos network - meaning faster transactions, lower fees, and a universe of interoperability.
-   [Uniswap](https://uniswap.org/) - Sommelier began as a tool for LP positions on Uniswap. More AMM integrations are coming soon!
-   [The Graph](https://thegraph.com/) - Sommelier uses a custom implementation of the [Uniswap V2 Subgraph](https://thegraph.com/explorer/subgraph/uniswap/uniswap-v2) for indexing and query Uniswap event data.
-   [Infura](https://infura.io/) - We use Infura as our Ethereum provider, with a roadmap for adding additional providers and redundancies on our backend.
-   [web3js](https://web3js.readthedocs.io/en/v1.3.0/) - used for connecting to client wallets (e.g. Metamask) and transaction construction and signing.

## Setup

Dancing Bananas has a standard monorepo setup using [Yarn Workspaces](https://classic.yarnpkg.com/blog/2017/08/02/introducing-workspaces/) and [Lerna](https://github.com/lerna/lerna). This allows one to run commands at the project root and apply that command to all packages.

In order to run this locally, you will need an Infura Project ID, to get your infura project ID, please go to https://infura.io/ and create an account. It is free to create an account.

To set up the app for local development:

```
git clone https://github.com/PeggyJV/il-loss-charts
cd il-loss-charts

yarn config set workspaces-experimental true # Use to enable yarn workspaces
yarn # Running 'yarn' once at workspace roots installs all dependencies for each package

yarn prepare # setup commit hooks

### Local Development

# Getting environment variables set
# Run following command inside packages/server and packages/client individually
cp .env.sample .env
# After seeing your .env file, make sure to replace placeholders with your Infura Project ID


# Requires a local redis server at port 6379
yarn dev # starts both express server and CRA webpack server in same shell, with re-compile on save for both server and client

### Building and Running

yarn build # builds each package
yarn prod # runs the server only, which serves the client bundle

### Linting

yarn lint # lints each package concurrently
```

Lerna infers package topology to ensure that all lint/build tasks run in the proper order based on inter-package dependencies.

## API Documentation

The `server` package uses [OpenAPI](https://github.com/PeggyJV/il-loss-charts) for documentation. You can see compiled documentation at [https://app.sommelier.finance/api/explorer/](https://app.sommelier.finance/api/explorer/) or [http://localhost:3001/api/explorer](http://localhost:3001/api/explorer) (when running locally).

The documentation source is at `packages/server/src/docs/api.yml`. When adding a new API route, make sure to update this file. The server uses [Express OpenAPI Validator](https://www.npmjs.com/package/express-openapi-validator) so if your route is not correctly documented, it will not be validated correctly and will not work as expected.

## Connecting to the Mainnet Subgraph node locally

You'll need access to the subgraph instance and the [gcloud sdk](https://cloud.google.com/sdk/docs/install) installed.

```bash
gcloud auth login # only need to login once
gcloud beta compute ssh --zone "us-west1-b" "graph-node-mainnet-1-bhtp"  --project "peggyjv-services" -- -NL 8000:localhost:8000
```

This will setup an ssh tunnel from your local @ port 8000 to the subgraph running on the instance @ port 8000

## TODOs

You can see all TODOs for this repo in the [Issues](https://github.com/PeggyJV/il-loss-charts/issues) section. Feel free to submit any suggestion as an issue!


## Deploy

Prerequisite Install [gcloud sdk](https://cloud.google.com/sdk/docs/install)

`gcloud config set app/cloud_build_timeout 1600 && gcloud app deploy app.yaml`

