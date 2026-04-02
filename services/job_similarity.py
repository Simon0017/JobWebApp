from JobPostingWebApp.models.job_model import job_table
from JobPostingWebApp.models.sql_alchemy_settings import engine
from JobPostingWebApp.models.connect_to_redis import redis_connect
from sqlalchemy import select
import pandas as pd
import numpy as np
import io
from DbIndexing.models.job_similarity_matrix import JobSimilarityMatrix
from DbIndexing.models.setup import SessionLocal
import redis

# load similarity matrix
def load_similarity_matrix():
    with SessionLocal() as session:
            obj = session.query(JobSimilarityMatrix).order_by(JobSimilarityMatrix.created_at.desc()).first()
            if obj:
                buffer = io.BytesIO(obj.matrix)
                buffer.seek(0)
                return np.load(buffer)

SIMILARITY_MATRIX = load_similarity_matrix()

class JobSimilarityAlgo:
    '''Fethes and calculates similarities between jobs'''
    def __init__(self,redis_client = None):
        self.rows_data = None
        self.df = None
        self.similarity_matrix = SIMILARITY_MATRIX
        self.redis_conn = redis_client
    
    def get_all_rows(self):
        query = select(job_table).order_by(job_table.c.id)

        with engine.connect() as conn:
            result  = conn.execute(query)
            rows = result.mappings().all()
            self.rows_data = rows
            if self.rows_data is not None:
                self.df = pd.DataFrame(self.rows_data)
         

    def get_idx(self,title:str):
        title = title.strip()
        idx = self.df.index[self.df["title"] == title][0]
        return idx

    def get_row(self,idx:int):
        return self.df.loc[idx]

    def get_similar_jobs(self,title:str,limit:int):
        limit_std  = len(self) if limit > len(self.df) else limit + 1
        idx = self.get_idx(title)
        top_similar_idxes = np.argsort(self.similarity_matrix[idx])[::-1][1:limit_std]
        
        return self.df.iloc[top_similar_idxes]
    
    def connect_to_redis(self):
        self.redis_conn = redis_connect()

        print("[Redis] Connection successfull..\n")
    
    def cache_df(self,expiration_dur = 24*3600): # one day
        self.redis_conn.set(
            "dataframe_jobs",
            self.df.to_json(date_format="iso"),
            ex=expiration_dur,
        )
        
    def get_cached_df(self):
        if self.redis_conn is None:
            return None

        try:
            df_json = self.redis_conn.get("dataframe_jobs")
            if df_json is None:
                return None
            return pd.read_json(io.StringIO(df_json))
        except Exception as e:
            print(f"Error loading cached df from Redis: {e}")
            return None

    def set_cached_df(self):
        self.df = self.get_cached_df()
    
    def cache_similarity_matrix(self):
        buffer = io.BytesIO()
        np.save(buffer,self.similarity_matrix)

        self.redis_conn.set(
            "sim_matrix",
            buffer.getvalue()
        )

    def get_cached_similarity_matrix(self):
        r = redis.Redis(host='localhost', port=6379, decode_responses=False)

        data = r.get("sim_matrix")
        if data is None:
            return None

        try:
            data = r.get("sim_matrix")
            if data is None:
                return None
            buffer = io.BytesIO(data)
            return np.load(buffer)
        except Exception as e:
            print(f"Error loading cached similarity matrix from Redis: {e}")
            return None

    def set_cached_similarity_matrix(self):
        self.similarity_matrix = self.get_cached_similarity_matrix()

def pre_server_start():
    obj = JobSimilarityAlgo(redis_connect())
    obj.get_all_rows()
    obj.connect_to_redis()
    obj.cache_df()
    obj.cache_similarity_matrix()

if __name__ == "__main__":
    pre_server_start()