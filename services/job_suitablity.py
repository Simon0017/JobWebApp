'''Use Bipartite Graphs for matching''' 

import networkx

class JobSuitablity:
    def __init__(self,candidate_data:dict):
        self.skills = candidate_data.get("skills")
        self.education_level = candidate_data.get("education_level")
        self.yrs_experience = candidate_data.get("experience")
        self.job_type = candidate_data.get("job_type")
        self.location = candidate_data.get("location")
    

'''
import networkx as nx

class JobSuitablity:
    def __init__(self, candidate_data):
        self.skills = candidate_data.get("skills", [])
        self.education_level = candidate_data.get("education_level", 0)
        self.yrs_experience = candidate_data.get("experience", 0)
        self.job_type = candidate_data.get("job_type")
        self.location = candidate_data.get("location")

    # Hook: compute a score between candidate and job
    def score_job(self, job):
        score = 0
        score += len(set(self.skills) & set(job.get("skills", [])))
        if self.yrs_experience >= job.get("min_experience", 0):
            score += 1
        if self.education_level >= job.get("education_level", 0):
            score += 1
        if self.job_type == job.get("job_type"):
            score += 1
        if self.location == job.get("location"):
            score += 1
        return score

    # Hook: build bipartite graph and add weighted edges
    def build_graph(self, jobs_list):
        G = nx.Graph()
        candidate_node = "candidate"
        G.add_node(candidate_node, bipartite=0)

        for idx, job in enumerate(jobs_list):
            job_node = f"job_{idx}"
            G.add_node(job_node, bipartite=1)
            score = self.score_job(job)
            if score > 0:
                G.add_edge(candidate_node, job_node, weight=score)
        return G'''


'''
# Example jobs
jobs_list = [
    {"title": "Data Analyst", "skills": ["Python", "SQL"], "min_experience": 2, "education_level": 3, "job_type": "Full-time", "location": "Remote"},
    {"title": "Web Developer", "skills": ["JavaScript", "HTML"], "min_experience": 1, "education_level": 2, "job_type": "Full-time", "location": "Remote"},
    {"title": "Data Scientist", "skills": ["Python", "SQL", "ML"], "min_experience": 3, "education_level": 4, "job_type": "Full-time", "location": "Remote"}
]

candidate_data = {
    "skills": ["Python", "SQL", "Pandas"],
    "education_level": 3,
    "experience": 4,
    "job_type": "Full-time",
    "location": "Remote"
}

candidate = JobSuitablity(candidate_data)
G = candidate.build_graph(jobs_list)

# Maximum weight matching
matching = nx.algorithms.matching.max_weight_matching(G, maxcardinality=True)

# Extract matched job nodes
matched_jobs = [node for node in matching if node.startswith("job_")]
print("Suggested jobs:", matched_jobs)
'''


'''
import networkx as nx

class JobSuitablity:
    def __init__(self, candidate_data):
        self.skills = candidate_data.get("skills", [])
        self.education_level = candidate_data.get("education_level", 0)
        self.yrs_experience = candidate_data.get("experience", 0)
        self.job_type = candidate_data.get("job_type")
        self.location = candidate_data.get("location")

    def score_job(self, job):
        score = 0
        score += len(set(self.skills) & set(job.get("skills", [])))
        if self.yrs_experience >= job.get("min_experience", 0):
            score += 1
        if self.education_level >= job.get("education_level", 0):
            score += 1
        if self.job_type == job.get("job_type"):
            score += 1
        if self.location == job.get("location"):
            score += 1
        return score

    def suggest_jobs(self, jobs_list, top_n=5):
        G = nx.Graph()
        candidate_node = "candidate"
        G.add_node(candidate_node, bipartite=0)

        # Add job nodes and edges with weights
        for idx, job in enumerate(jobs_list):
            job_node = f"job_{idx}"
            G.add_node(job_node, bipartite=1)
            score = self.score_job(job)
            if score > 0:
                G.add_edge(candidate_node, job_node, weight=score)

        # Compute max weight matching
        matching = nx.algorithms.matching.max_weight_matching(G, maxcardinality=True)

        # Extract matched jobs with scores
        matched_jobs = []
        for job_node in matching:
            if job_node.startswith("job_"):
                idx = int(job_node.split("_")[1])
                score = self.score_job(jobs_list[idx])
                matched_jobs.append((jobs_list[idx]["title"], score))

        # Sort descending by score
        matched_jobs.sort(key=lambda x: x[1], reverse=True)

        return matched_jobs[:top_n]
'''

'''
jobs_list = [
    {"title": "Data Analyst", "skills": ["Python", "SQL"], "min_experience": 2, "education_level": 3, "job_type": "Full-time", "location": "Remote"},
    {"title": "Web Developer", "skills": ["JavaScript", "HTML"], "min_experience": 1, "education_level": 2, "job_type": "Full-time", "location": "Remote"},
    {"title": "Data Scientist", "skills": ["Python", "SQL", "ML"], "min_experience": 3, "education_level": 4, "job_type": "Full-time", "location": "Remote"}
]

candidate_data = {
    "skills": ["Python", "SQL", "Pandas"],
    "education_level": 3,
    "experience": 4,
    "job_type": "Full-time",
    "location": "Remote"
}

candidate = JobSuitablity(candidate_data)
top_jobs = candidate.suggest_jobs(jobs_list, top_n=3)

for title, score in top_jobs:
    print(f"{title}: match score = {score}")
'''