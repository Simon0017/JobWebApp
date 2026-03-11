from JobPostingWebApp.models.sql_alchemy_settings import engine
from sqlalchemy import Table,MetaData,select

metadata = MetaData()

job_table = Table("job_postings",metadata,autoload_with=engine)