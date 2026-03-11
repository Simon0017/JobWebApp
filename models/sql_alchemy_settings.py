#sql_alchemy_settings.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL,echo=False)
Base = declarative_base()