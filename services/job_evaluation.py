import networkx as nx
from JobPostingWebApp.models.job_model import job_table
from JobPostingWebApp.models.sql_alchemy_settings import engine
from sqlalchemy import select,func,distinct
from JobPostingWebApp.services.skills_extractor import extract_skills,SkillsManager
from JobPostingWebApp.services.job_similarity import JobSimilarityAlgo
import json
from networkx.readwrite import json_graph

class JobEvaluation:
    def __init__(self,job_id):
        self.job_id = job_id
        self.job_details = None
        self.graph = nx.Graph()

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
        sk_manager = SkillsManager()
        nodes = sk_manager.retrieve_job_skills_from_redis(self.job_details.get("id"))
        if nodes is None:
            nodes = extract_skills(self.job_details.get("minimum_requirements"))
        
        candidate_node = self.job_details.get("title")
        return {
            "nodes":nodes,
            "candidate":candidate_node
        }
    

    def contruct_KG(self):
        data = self.extract_nodes()
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
        job_sim_obj = JobSimilarityAlgo()
        job_sim_obj.connect_to_redis()
        job_sim_obj.set_cached_df()
        job_sim_obj.set_cached_similarity_matrix()

        if (job_sim_obj.similarity_matrix is None and job_sim_obj.df is None):
            job_sim_obj.get_all_rows()
            embeddings = job_sim_obj.encode_jobs()
            job_sim_obj.compute_similarity_matrix(embeddings)
            
        similar_jobs = job_sim_obj.get_similar_jobs(self.job_details.get("title"),top_n)
        similar_jobs_list = similar_jobs.to_dict(orient="records")
        return similar_jobs_list



    def platform_listing_data(self):
        pass
