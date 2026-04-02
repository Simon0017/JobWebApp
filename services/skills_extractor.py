from JobPostingWebApp.models.connect_to_redis import redis_connect 
import json
from DbIndexing.models.setup import SessionLocal
from DbIndexing.models.job_postings import JobPostings
from DbIndexing.models.skills import Skills #NECCESSARY DONT REMOVE THIS UNUSED IMPORT
from DbIndexing.models.job_embeddings import JobEmbeddings #NECCESSARY DONT REMOVE THIS UNUSED IMPORT


class SkillsManager:
    '''Class extracts skills from the skill index and saves it to redis for quick retrieval'''
    def __init__(self,redis_client = None):
        self.redis_conn = redis_client
        
    
    def extract_skills_data_db(self):
        with SessionLocal() as session:
            jobs = session.query(JobPostings).filter(JobPostings.skills.any()).all()
            skills_data = {}
            for job in jobs:
                skills_data[job.id] = [skill.name for skill in job.skills]
            return skills_data
        
    def extract_skills_for_job(self,job_id):
        with SessionLocal() as session:
            job = session.query(JobPostings).filter(JobPostings.id == job_id).first()
            if job and job.skills:
                return [skill.name for skill in job.skills]
            return []
    
    def batch_skills_extraction_redis(self):
        skills_data = self.extract_skills_data_db()

        for job_id, skills in skills_data.items():
            self.save_job_skills_to_redis(job_id,skills)

    
    def save_job_skills_to_redis(self,idx,skills:list):
        if self.redis_conn is None:
            return

        pattern = f"job_skills:{idx}"
        try:
            self.redis_conn.set(pattern,json.dumps(skills))
        except Exception as e:
            print(f"Error saving skills to Redis: {e}")

    def retrieve_job_skills_from_redis(self,idx):
        if self.redis_conn is None:
            return None

        try:
            pattern = f"job_skills:{idx}"
            data = self.redis_conn.get(pattern)
            if data is None:
                return None
            return json.loads(data)
        except Exception as e:
            print(f"Error loading skills from Redis: {e}")
            return None