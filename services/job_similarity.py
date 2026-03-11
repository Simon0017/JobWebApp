import redis
from JobPostingWebApp.models.job_model import job_table
from JobPostingWebApp.models.sql_alchemy_settings import engine
from sqlalchemy import select
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import io

class JobSimilarityAlgo:
    '''Fethes and calculates similarities between jobs'''
    def __init__(self):
        self.rows_data = None
        self.df = None
        self.model = None
        self.similarity_matrix = None
        self.redis_conn = None
    
    def get_all_rows(self):
        query = select(job_table).order_by(job_table.c.id).limit(200)

        with engine.connect() as conn:
            result  = conn.execute(query)
            rows = result.mappings().all()
            self.rows_data = rows
        
    def encode_jobs(self):
        self.df = pd.DataFrame(self.rows_data)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
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
        self.redis_conn = redis.Redis(
            host="localhost",
            port=6379,
            db=0,
            decode_responses=True
        )

        print("[Redis] Connection successfull..\n")
    
    def cache_df(self,expiration_dur = 3600): # in seconds
        self.redis_conn.set(
            "dataframe_jobs",
            self.df.to_json(),
            ex=expiration_dur,
        )
        
    def get_cached_df(self):
        df_json = self.redis_conn.get("dataframe_jobs")
        return pd.read_json(df_json)

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
        buffer = io.BytesIO(self.redis_conn.get("sim_matrix"))
        return np.load(buffer)
    
    def set_cached_similarity_matrix(self):
        self.similarity_matrix = self.get_cached_similarity_matrix()