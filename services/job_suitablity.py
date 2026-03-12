'''Use Bipartite Graphs for matching''' 

import networkx as nx
import pandas as pd
from JobPostingWebApp.models.job_model import job_table
from JobPostingWebApp.models.connect_to_redis import redis_connect
from JobPostingWebApp.models.sql_alchemy_settings import engine
from sqlalchemy import select
from rapidfuzz import process

class JobSuitablity:
    def __init__(self,candidate_data:dict):
        self.skills = candidate_data.get("skills",[])
        self.education_level = candidate_data.get("education_level") # label encode the education levels
        self.yrs_experience = candidate_data.get("experience",0)
        self.job_type = candidate_data.get("job_type")
        self.location = candidate_data.get("location")
        self.jobs_list = []
        self.redis_conn = None
        self.df = None

    def connect_to_redis(self):
        self.redis_conn = redis_connect()

        print("[Redis] Connection successfull..\n")

    def load_df(self):
        df = self.load_from_redis()

        if df is None:
            rows_list = self.load_from_db()
            df = pd.DataFrame(rows_list)
        
        return df


    def load_from_db(self):
        query = select(job_table).order_by(job_table.c.id)

        with engine.connect() as conn:
            result  = conn.execute(query)
            return result.mappings().all()
    
    def load_from_redis(self):
        df_json = self.redis_conn.get("dataframe_jobs")
        return pd.read_json(df_json) if df_json is not None else None
    

    def score_job(self,job:dict):
        score = 0

        score += len(set(self.skills) & set(job.get("skills",[])) )

        if self.yrs_experience >= job.get("min_experience",0):
            score += 1
        
        ed_level_from_db = parse_education_levels(job.get("minimum_requirements"))
        ed_level_encoded = encode_education_levels(ed_level_from_db)
        if self.education_level >= ed_level_encoded:
            score += 1
        
        if self.job_type == job.get("type"):
            score +=1

        if self.location == job.get("location"):
            score += 1
        
        return score
    

    def suggest_best_job_match(self,jobs_list):
        # Hook: build bipartite graph and add weighted edges
        G = nx.Graph()
        candidate_node = "candidate"
        G.add_node(candidate_node,biparte = 0)

        # add jobs and edges with weights:
        for idx,job in enumerate(jobs_list):
            job_node = f"job_{idx}"
            G.add_node(job_node,biparte = 1)
            score = self.score_job(job)
            if score > 0:
                G.add_edge(candidate_node,job_node,weight = score)
        
        # compute max_weight matching
        matching = nx.algorithms.max_weight_matching(G,maxcardinality=True)

        # extract matched jobs with scores
        matched_jobs = []
        for u,v in matching:
            job_node = u if u.startswith("job_") else v
            idx= int(job_node.split("_")[1])
            score = self.score_job(jobs_list[idx])
            matched_jobs.append((jobs_list[idx]["title"], score))
        
        

        return matched_jobs[0]
    
    def suggest_based_on_score(self,job_lists:list,top_n=5):
        scored_jobs = []

        for job in job_lists:
            score = self.score_job(job)

            if score > 0:
                scored_jobs.append((job["title"], score))

        scored_jobs.sort(key=lambda x: x[1], reverse=True)

        return scored_jobs[:top_n]


def encode_education_levels(val:str):
    levels = [
        "No Education",
        "High School",
        "Certificate / Diploma",
        "Undergraduate Degree",
        "Bachelor's Degree",
        "Master's Degree",
        "PHD/Doctorate"
    ]

    encoded = {level:i for i,level in enumerate(levels)}

    return encoded.get(val,0)

def parse_education_levels(val:str):
    levels = [
        "Certificate / Diploma",
        "Bachelor's Degree",
        "Master's Degree",
        "PHD/Doctorate",
        "High School",
        "Undergraduate Degree",
        "No Education"
    ]

    return process.extractOne(str(val).strip(),levels)[0]

def convert_df_list(df:pd.DataFrame):
    return df.to_dict(orient="records")


# testing
candidate_data = {
    "skills": [
        "Python",
        "SQL",
        "Pandas",
        "Redis",
        "NetworkX",
        "Data Analysis",
        "Machine Learning",
        "APIs",
        "Backend Development"
    ],
    "education_level": 4,   # Bachelor's Degree
    "experience": 2,        # estimated early-career developer
    "job_type": "Full-time",
    "location": "Remote"
}

candidate = JobSuitablity(candidate_data)
candidate.connect_to_redis()
df = candidate.load_df()
jobs_list = convert_df_list(df)

best_job = candidate.suggest_best_job_match(jobs_list)

print(f"Suggested job is {best_job[0]},\nScore: {best_job[1]}")

top_suggestions = candidate.suggest_based_on_score(jobs_list)
for best_job in top_suggestions:
    print(f"Suggested job is {best_job[0]},\nScore: {best_job[1]}")