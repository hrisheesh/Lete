import sqlite3
from typing import Generic, TypeVar
from pydantic import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType]):
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
