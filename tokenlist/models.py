import datetime
import typing as T

from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal


class Token(BaseModel):
    address: str
    decimals: int
    last_trade_unix_time: int | None = Field(None, alias="lastTradeUnixTime")
    liquidity: Decimal
    logo_uri: str | None = Field(None, alias="logoURI")
    mc: Decimal | None = Field(None)
    name: str | None = Field(None)
    symbol: str | None = Field(None)
    v24h_change_percent: Decimal | None = Field(None, alias="v24hChangePercent")
    v24h_USD: Decimal | None = Field(None, alias="v24hUSD")

    model_config = ConfigDict(populate_by_name=True)


class Tokens(BaseModel):
    update_unix_time: int = Field(..., alias="updateUnixTime")
    update_time: datetime.datetime = Field(..., alias="updateTime")
    tokens: T.List[Token]
    total: int

DataT = T.TypeVar("DataT", bound=BaseModel)

class BirdEyeResponse(BaseModel, T.Generic[DataT]):
    success: bool
    data: DataT
