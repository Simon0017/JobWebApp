import networkx as nx
from JobPostingWebApp.models.job_model import job_table
from JobPostingWebApp.models.sql_alchemy_settings import engine
from sqlalchemy import select,func,distinct
from JobPostingWebApp.services.skills_extractor import SkillsManager
from JobPostingWebApp.services.job_similarity import JobSimilarityAlgo
import json
from networkx.readwrite import json_graph

class JobEvaluation:
    def __init__(self,job_id,redis_client = None):
        self.job_id = job_id
        self.job_details = None
        self.graph = nx.Graph()
        self.redis_client = redis_client

    def get_job_details(self):
        query = select(job_table).where(job_table.c.id==self.job_id)

        with engine.connect() as conn:
            self.job_details = conn.execute(query).mappings().first()

    
    def calculate_job_activity(self):
        # HOW MANY TIMES HAS THE POST BEEN POSTED ACROS VARIOUS SITES
        job_title = self.job_details.get("title")
        query_1 = select(func.count(job_table.c.posted_by)).where(job_table.c.title==job_title,job_table.c.posted_by.isnot(None))

        with engine.connect() as conn:
            title_count = conn.execute(query_1).scalar()
        
        query_2 = select(func.count(distinct(job_table.c.posted_by))).where(job_table.c.posted_by.isnot(None))

        with engine.connect() as conn:
            platforms_tracked = conn.execute(query_2).scalar()
        
        try:
            percentage_of_appearence = round((title_count/platforms_tracked),2) * 100
        except ZeroDivisionError:
            percentage_of_appearence = 10 # default

        return percentage_of_appearence

        
    
    def get_KG_data(self):#KG = Knowledge graph
        #nodes = skills
        #candidate = self
        sk_manager = SkillsManager(self.redis_client)
        try:
            nodes = sk_manager.retrieve_job_skills_from_redis(self.job_id)
        except Exception as e:
            print(f"Error occurred while extracting skills for job {self.job_id}: {e}")
            nodes = []

        if not nodes:
            nodes = sk_manager.extract_skills_for_job(self.job_id)

        if not nodes:
            nodes = []
        
        candidate_node = self.job_details.get("title","")
        return {
            "nodes":nodes,
            "candidate":candidate_node
        }
    

    def contruct_KG(self):
        data = self.get_KG_data()
        candidate_node = data["candidate"]
        skill_nodes = data["nodes"]

        self.graph.add_node(candidate_node, type="candidate")
        for skill in skill_nodes:
            self.graph.add_node(skill, type="skill")
            self.graph.add_edge(candidate_node, skill)

        return self.graph
    
    def KG_to_json(self):
        data = json_graph.node_link_data(self.graph)
        return json.dumps(data)

    def get_similar_jobs(self,top_n = 5):
        job_sim_obj = JobSimilarityAlgo(self.redis_client)
        try:
            job_sim_obj.set_cached_df()
            job_sim_obj.set_cached_similarity_matrix()
        except Exception as e:
            print(f"Error getting cached data from Redis: {e}")
            job_sim_obj.get_all_rows()
        
        similar_jobs = job_sim_obj.get_similar_jobs(self.job_details.get("title"),top_n).fillna("")
        similar_jobs_list = similar_jobs.to_dict(orient="records")
        return similar_jobs_list



    def platform_listing_data(self):
        pass



# testing
if __name__ == "__main__":
    job_eval = JobEvaluation(1)
    job_eval.get_job_details()
    print(job_eval.job_details)
    print(job_eval.calculate_job_activity())
    kg = job_eval.contruct_KG()
    print(job_eval.KG_to_json())
    print(job_eval.get_similar_jobs(3))