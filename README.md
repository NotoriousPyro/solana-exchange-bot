# sexbot (Solana EXchange Bot)

This is the entire source code for the bot once seen operating at https://solscan.io/account/xGexTsXWrM6nrXErxrwS4u877EUKiHbXMiVe5rhVxbv

The reason for releasing this source code is more than one reason:
* Competition via other specialised onchain programs made this style of arbitrage program much less profitable than it once was several months ago.
* Numerous bugs and a complicated design due to heavy cache use made it too time consuming to develop, refactor, write tests for and there was a limit to how optimised it could be to beat the onchain programs and how much free time I had to develop it further.
* Onchain programs have no need for an RPC need, and can rely only on gRPC. So this program is already more costly to run than similar programs designed without use of jupiter api.
* The code is messy due to time pressure in a lot of places and became a bit too unwieldy to want to develop it further, additionally the reduced profitability made wanting to refactor even less likely.

I've decided to develop an onchain program once time permits, and want to leave this for others to learn from.

There is some nice code in here, particularly:
* the account caching took some thinking about but it works well, perhaps it will be useful to others (not suitable for everything though, but useful for address lookup table accounts).
* normalising the jupiter quote to remove duplicate hops etc

Not all code is used and some has been deprecated or was for experimentation but I kept the code around in case I needed to repurpose it.

**You should not expect to be profitable running this, especially against other traders with onchain programs.**

## Note
There are no real instructions to this and I'm not motivated to write them since it's not really that profitable to run it any more, so this is released more as educational material.

However, a brief overview is that you will need npm, and then you can use the sh scripts to install and build the bot.

You can use nvm to run it, see the service files.

Some env variables need to be set and your config file needs setting up.
See config.ts, the config example, env.d.ts, the service files and the overrides.

Good luck!
