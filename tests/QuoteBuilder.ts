import { QuoteResponse, RoutePlanStep, SwapMode } from "@jup-ag/api";

class RoutePlanStepBuilder {
    step: RoutePlanStep
    routePlanBuilder: RoutePlanBuilder;

    constructor(routePlanBuilder: RoutePlanBuilder) {
        this.routePlanBuilder = routePlanBuilder;
        this.step = {
            percent: 0,
            swapInfo: {
                ammKey: "test",
                label: "test",
                inputMint: "",
                inAmount: "0",
                outputMint: "",
                outAmount: "0",
                feeAmount: "0",
                feeMint: ""
            }
        }
    }

    build(): RoutePlanBuilder {
        this.routePlanBuilder.routePlan.push(this.step);
        return this.routePlanBuilder;
    }

    withPercentage(percent: number): RoutePlanStepBuilder {
        this.step.percent = percent;
        return this;
    }

    withAmmkey(ammKey: string): RoutePlanStepBuilder {
        this.step.swapInfo.ammKey = ammKey;
        return this;
    }

    withLabel(label: string): RoutePlanStepBuilder {
        this.step.swapInfo.label = label;
        return this;
    }

    withInputMint(inputMint: string): RoutePlanStepBuilder {
        this.step.swapInfo.inputMint = inputMint;
        return this;
    }

    withOutputMint(outputMint: string): RoutePlanStepBuilder {
        this.step.swapInfo.outputMint = outputMint;
        return this;
    }

    withInAmount(inAmount: number): RoutePlanStepBuilder {
        this.step.swapInfo.inAmount = String(inAmount);
        return this;
    }

    withOutAmount(outAmount: number): RoutePlanStepBuilder {
        this.step.swapInfo.outAmount = String(outAmount);
        return this;
    }

    withFeeAmount(feeAmount: number): RoutePlanStepBuilder {
        this.step.swapInfo.feeAmount = String(feeAmount);
        return this;
    }

    withFeeMint(feeMint: string): RoutePlanStepBuilder {
        this.step.swapInfo.feeMint = feeMint;
        return this;
    }
}

class RoutePlanBuilder {
    routePlan: RoutePlanStep[] = []
    quoteBuilder: QuoteBuilder;

    constructor(quoteBuilder: QuoteBuilder) {
        this.quoteBuilder = quoteBuilder;
    }

    build(): QuoteBuilder {
        this.quoteBuilder.quote.routePlan = this.routePlan;
        return this.quoteBuilder;
    }

    withStep(): RoutePlanStepBuilder {
        return new RoutePlanStepBuilder(this);
    }
}

class QuoteBuilder {
    quote: QuoteResponse

    constructor() {
        this.quote = {
            inputMint: "",
            inAmount: "0",
            outputMint: "",
            outAmount: "0",
            otherAmountThreshold: "0",
            swapMode: "ExactIn",
            slippageBps: 0,
            priceImpactPct: "0",
            routePlan: []
        }
    }

    build(): QuoteResponse {
        return this.quote;
    }

    withInputMint(inputMint: string): QuoteBuilder {
        this.quote.inputMint = inputMint;
        return this;
    }

    withInAmount(inAmount: number): QuoteBuilder {
        this.quote.inAmount = String(inAmount);
        return this;
    }

    withOutputMint(outputMint: string): QuoteBuilder {
        this.quote.outputMint = outputMint;
        return this;
    }

    withOutAmount(outAmount: number): QuoteBuilder {
        this.quote.outAmount = String(outAmount);
        return this;
    }

    withOtherAmountThreshold(otherAmountThreshold: number): QuoteBuilder {
        this.quote.otherAmountThreshold = String(otherAmountThreshold);
        return this;
    }

    withSwapMode(swapMode: SwapMode): QuoteBuilder {
        this.quote.swapMode = swapMode;
        return this;
    }

    withSlippageBps(slippageBps: number): QuoteBuilder {
        this.quote.slippageBps = slippageBps;
        return this;
    }

    withPriceImpactPct(priceImpactPct: number): QuoteBuilder {
        this.quote.priceImpactPct = String(priceImpactPct);
        return this;
    }

    withRoutePlan(): RoutePlanBuilder {
        return new RoutePlanBuilder(this);
    }
}

const testQuote = new QuoteBuilder()
    .withInputMint("SOLANA")
    .withInAmount(1_000_000)
    .withOutputMint("SOLANA")
    .withOutAmount(1_000_000)
    .withOtherAmountThreshold(0)
    .withSwapMode("ExactIn")
    .withSlippageBps(0)
    .withPriceImpactPct(0)
    .withRoutePlan()
        .withStep()
            .withPercentage(100)
            .withAmmkey("AMM_A")
            .withLabel("Raydium")
            .withInputMint("SOLANA")
            .withInAmount(1_000_000)
            .withOutputMint("USDC")
            .withOutAmount(100_000)
        .build()
        .withStep()
            .withPercentage(100)
            .withAmmkey("AMM_B")
            .withLabel("Raydium")
            .withInputMint("USDC")
            .withInAmount(100_000)
            .withOutputMint("USDT")
            .withOutAmount(100_000)
        .build()
        .withStep()
            .withPercentage(100)
            .withAmmkey("AMM_C")
            .withLabel("Saber Stable Swap")
            .withInputMint("USDT")
            .withInAmount(100_000)
            .withOutputMint("S-USDT8")
            .withOutAmount(100_000)
        .build()
    .build()
.build();

console.log(JSON.stringify(testQuote, null, 2));

/**
{
    "inputMint": "SOLANA",
    "inAmount": "1000000",
    "outputMint": "SOLANA",
    "outAmount": "1000000",
    "otherAmountThreshold": "0",
    "swapMode": "ExactIn",
    "slippageBps": 0,
    "priceImpactPct": "0",
    "routePlan": [
      {
        "percent": 100,
        "swapInfo": {
          "ammKey": "AMM_A",
          "label": "Raydium",
          "inputMint": "SOLANA",
          "inAmount": "1000000",
          "outputMint": "USDC",
          "outAmount": "100000",
          "feeAmount": "0",
          "feeMint": ""
        }
      },
      {
        "percent": 100,
        "swapInfo": {
          "ammKey": "AMM_B",
          "label": "Raydium",
          "inputMint": "USDC",
          "inAmount": "100000",
          "outputMint": "USDT",
          "outAmount": "100000",
          "feeAmount": "0",
          "feeMint": ""
        }
      },
      {
        "percent": 100,
        "swapInfo": {
          "ammKey": "AMM_C",
          "label": "Saber Stable Swap",
          "inputMint": "USDT",
          "inAmount": "100000",
          "outputMint": "S-USDT8",
          "outAmount": "100000",
          "feeAmount": "0",
          "feeMint": ""
        }
      }
    ]
  }
*/