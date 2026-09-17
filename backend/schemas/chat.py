from typing import Literal
from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    message: str


class AdminChatTurn(BaseModel):
    role: Literal['user', 'assistant']
    content: str = Field(max_length=12000)


class AdminChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    language: Literal['en', 'rw', 'fr', 'sw'] = 'en'
    history: list[AdminChatTurn] = Field(default_factory=list, max_length=12)
