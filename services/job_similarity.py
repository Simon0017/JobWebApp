from JobPostingWebApp.models.job_model import job_table
from JobPostingWebApp.models.sql_alchemy_settings import engine
from JobPostingWebApp.models.connect_to_redis import redis_connect
from sqlalchemy import select
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import io
import redis

MODEL = SentenceTransformer('all-MiniLM-L6-v2')

class JobSimilarityAlgo:
    '''Fethes and calculates similarities between jobs'''
    def __init__(self,redis_client:redis.Redis):
        self.rows_data = None
        self.df = None
        self.model = None
        self.similarity_matrix = None
        self.redis_conn = redis_client
    
    def get_all_rows(self):
        query = select(job_table).order_by(job_table.c.id)

        with engine.connect() as conn:
            result  = conn.execute(query)
            rows = result.mappings().all()
            self.rows_data = rows
        
    def encode_jobs(self):
        if self.df is None:
            self.df = pd.DataFrame(self.rows_data)

        if self.model is None:
            self.model = MODEL
            
        self.df['combined_text'] = self.df["title"] + " " + self.df["field"].fillna('') + self.df['responsibilities'].fillna('') + ' ' + self.df['minimum_requirements'].fillna('') + self.df["company"].fillna('') + self.df["type"]
        embeddings = self.model.encode(self.df['combined_text'].to_list(),convert_to_tensor=True)

        return embeddings
    
    def compute_similarity_matrix(self,embeddings):
        similarity_matrix = cosine_similarity(embeddings.cpu())

        self.similarity_matrix = similarity_matrix

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
        df_json = self.redis_conn.get("dataframe_jobs")
        if df_json is None:
            return None
        return pd.read_json(io.StringIO(df_json))

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
        
        buffer = io.BytesIO(data)
        return np.load(buffer)
    
    def set_cached_similarity_matrix(self):
        self.similarity_matrix = self.get_cached_similarity_matrix()

def pre_server_start():
    obj = JobSimilarityAlgo(redis_connect())
    obj.get_all_rows()
    embeddings = obj.encode_jobs()
    obj.compute_similarity_matrix(embeddings)
    obj.connect_to_redis()
    obj.cache_df()
    obj.cache_similarity_matrix()

if __name__ == "__main__":
    pre_server_start()