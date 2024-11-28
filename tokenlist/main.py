from time import sleep
from pydantic import TypeAdapter
import requests.sessions
from models import BirdEyeResponse, Token, Tokens
import requests
import typing as T
from datetime import timedelta, datetime

session = requests.sessions.Session()
session.headers.update({
    "X-API-KEY": "5c825a60b3214f548c64ffc3907662e5",
    "x-chain": "solana",
    "accept": "application/json",
})


def get_trending_birdeye_tokens():
    adapter = TypeAdapter(BirdEyeResponse[Tokens])
    for offset in range(0, 10000, 50):
        response = session.get(f"https://public-api.birdeye.so/defi/tokenlist?sort_by=mc&sort_type=desc&offset={offset}")
        tokens_trending = adapter.validate_json(response.text)
        for token in tokens_trending.data.tokens:
            yield token
    sleep(50)

token_adapter = TypeAdapter(T.List[Token])

def update_tokens_from_birdeye():
    tokens = list(get_trending_birdeye_tokens())

    with open("tokens.json", "wb") as f:
        f.write(token_adapter.dump_json(tokens))

liquidity_minimum = 1000
v24h_change_percent_minimum = -99
lastTradeUnixTime_diff = timedelta(days=1)

def get_tokens_addresses():
    with open("tokens.json", "rb") as f:
        tokens = token_adapter.validate_json(f.read())
        for token in tokens:
            if not token.last_trade_unix_time:
                continue
            if not token.v24h_change_percent:
                continue
            if token.v24h_change_percent < v24h_change_percent_minimum:
                continue
            if datetime.now() - datetime.fromtimestamp(token.last_trade_unix_time) > lastTradeUnixTime_diff:
                continue
            if token.liquidity >= liquidity_minimum:
                yield token.address


def update_tradable_tokens():
    tokens = list(get_tokens_addresses())
    with open("current_tokens.txt") as ct:
        current_tokens = ct.read().split(",")
        tokens = list(set(tokens) - set(current_tokens))
        with open("tradable_tokens.txt", "w") as t:
            t.write(",".join(tokens))

#update_tokens_from_birdeye()
update_tradable_tokens()
