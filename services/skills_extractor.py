import spacy
from spacy.matcher import PhraseMatcher
from skillNer.general_params import SKILL_DB
from skillNer.skill_extractor_class import SkillExtractor
from JobPostingWebApp.models.connect_to_redis import redis_connect
import json
from JobPostingWebApp.models.job_model import job_table
from JobPostingWebApp.models.sql_alchemy_settings import engine
from sqlalchemy import select
import io
from redis import Redis

def extract_skills(val_string:str):
    nlp = spacy.load('en_core_web_lg')

    skill_extractor  = SkillExtractor(nlp,SKILL_DB,PhraseMatcher)

    annotations = skill_extractor.annotate(val_string)
    skills = [item["doc_node_value"] for item in annotations["results"]["ngram_scored"]]

    return skills


class SkillsManager:
    def __init__(self,redis_client:Redis):
        self.redis_conn = redis_client
        self.nlp = None
        self.skill_extractor = None
    
    def init_extractor(self):
        self.nlp = spacy.load('en_core_web_lg')
        self.skill_extractor = SkillExtractor(self.nlp,SKILL_DB,PhraseMatcher)
    
    def extract_skills(self,val_string):
        annotations = self.skill_extractor.annotate(val_string)
        skills = [item["doc_node_value"] for item in annotations["results"]["ngram_scored"]]

        return skills

    def connect_to_redis(self):
        self.redis_conn = redis_connect()
        print("[Redis] Connection successfull..\n")
    
    def load_data_from_db(self):
        query = select(job_table.c.id,job_table.c.minimum_requirements).where(job_table.c.minimum_requirements.isnot(None)).order_by(job_table.c.id)

        with engine.connect() as conn:
            result  = conn.execute(query)
            rows = result.fetchall()
            return rows
    
    def batch_skills_extraction_redis(self):
        idx_req = self.load_data_from_db()

        for row in idx_req:
            idx = row[0]
            min_req = row[1]
            skills = self.extract_skills(min_req)
            self.save_job_skills_to_redis(idx,skills)

    
    def save_job_skills_to_redis(self,idx,skills:list):
        pattern = f"job_skills:{idx}"
        self.redis_conn.set(pattern,json.dumps(skills))

    def retrieve_job_skills_from_redis(self,idx):
        pattern = f"job_skills:{idx}"
        data = self.redis_conn.get(pattern)
        if data is None:
            return None
        return json.loads(data)
    

def pre_server_start():
    obj = SkillsManager(redis_connect())
    obj.init_extractor()
    obj.batch_skills_extraction_redis()

if __name__ == "__main__":
    pre_server_start()