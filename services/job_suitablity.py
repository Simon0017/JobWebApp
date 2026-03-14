'''Use Bipartite Graphs for matching''' 

import networkx as nx
import pandas as pd
from JobPostingWebApp.models.job_model import job_table
from redis import Redis
from JobPostingWebApp.models.sql_alchemy_settings import engine
from sqlalchemy import select
from rapidfuzz import process
import io
from JobPostingWebApp.services.skills_extractor import SkillsManager

class JobSuitablity:
    def __init__(self,candidate_data:dict,redis_client:Redis):
        self.skills = candidate_data.get("skills",[])
        self.education_level = candidate_data.get("education_level","") # label encode the education levels
        self.yrs_experience = int(candidate_data.get("experience",0))
        self.job_type = candidate_data.get("job_type","")
        self.location = candidate_data.get("location","") or ""
        self.jobs_list = []
        self.redis_conn = redis_client
        self.df = None
        self.sk_manager = None

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
        return pd.read_json(io.StringIO(df_json)) if df_json is not None else None
    
    def extract_skills(self,job:dict):
        if self.sk_manager is None:
            self.sk_manager = SkillsManager(self.redis_conn)

        skills = self.sk_manager.retrieve_job_skills_from_redis(job.get("id"))
        
        if skills is None:
            skills = []

        return skills


    def score_job(self,job:dict):
        score = 0

        job_skills = self.extract_skills(job)
        score += percentage_skills_overlap(cad_skills=self.skills,job_skills=job_skills)

        score += percentage_experience(self.yrs_experience,job.get("min_experience",0))
        
        ed_level_from_db = parse_education_levels(job.get("minimum_requirements",""))
        ed_level_encoded = encode_education_levels(ed_level_from_db)
        candidate_ed_level = parse_education_levels(self.education_level)
        candidate_ed_level_encoded = encode_education_levels(candidate_ed_level)

        score += percentage_ed_level(candidate_ed_level_encoded,ed_level_encoded)
        
        if self.job_type.lower() == job.get("type","").lower():
            score += 5

        if self.location.lower() == job.get("location","").lower():
            score += 5
        
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
                job['compat'] = score
                scored_jobs.append(job)

        scored_jobs.sort(key=lambda x: x.get('compat', 0), reverse=True)

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

def percentage_skills_overlap(cad_skills,job_skills):
    cad_skills_set = set([skill.lower() for skill in cad_skills])
    job_skills_set = set([skill.lower() for skill in job_skills])

    try:
        overlap = (len(cad_skills_set & job_skills_set) / max(len(job_skills),len(cad_skills))) * 50 # 50% weights for 
        overlap = round(overlap,1)
    except ZeroDivisionError:
        overlap = 0.0
    
    return overlap

def percentage_experience(cad_exp,job_exp):
    # punish scores where the candidate experience is less than the job experience
    if cad_exp == job_exp:
        calc = 1
    else:
        try:
            calc = (cad_exp - job_exp) / max(cad_exp,job_exp)
            calc = round(calc,1)
        except: # both are zero
            calc = 0

    return calc * 25 # 25% weight

def percentage_ed_level(cad_lvl,job_lvl):
    if cad_lvl ==job_lvl:
        calc = 1
    else:
        try:
            calc = (cad_lvl - job_lvl) / max(cad_lvl,job_lvl)
            calc = round(calc,1)
        except: # both are zero
            calc = 0
    return calc * 20



# testing
# candidate_data = {
#     "skills": [
#         "Python",
#         "SQL",
#         "Pandas",
#         "Redis",
#         "NetworkX",
#         "Data Analysis",
#         "Machine Learning",
#         "APIs",
#         "Backend Development"
#     ],
#     "education_level": "Bachelor's Degree",   # Bachelor's Degree
#     "experience": 2,        # estimated early-career developer
#     "job_type": "Full-time",
#     "location": "Remote"
# }

# from JobPostingWebApp.models.connect_to_redis import redis_connect


# candidate = JobSuitablity(candidate_data,redis_connect())
# df = candidate.load_df()
# jobs_list = convert_df_list(df)

# best_job = candidate.suggest_best_job_match(jobs_list)

# print(f"Suggested job is {best_job[0]}\nScore{best_job[1]}")

# top_suggestions = candidate.suggest_based_on_score(jobs_list)
# for best_job in top_suggestions:
#     print(f"Suggested job is {best_job['title']}")