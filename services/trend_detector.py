from collections import defaultdict
from JobPostingWebApp.services.hyperloglog import Hyperloglog
from JobPostingWebApp.models.connect_to_redis import redis_connect
import json

class SkillTrendDetector:
    def __init__(self,precision = 12):
        self.precision = precision
        #one HLL sketch per skill
        self.hll_map = defaultdict(lambda:Hyperloglog(precision))

        # exact tweet count per skill for comparison
        self.skills_count = defaultdict(int)

    def process_skill(self,skill):
        '''Feed a skill into the detector'''
        idx = skill["idx"]
        for tag in skill["skills"]:
            self.hll_map[tag].add(idx) # tracks unique idx
            self.skills_count[tag] += 1 # traccks raw volume

    def process_all(self,skills):
        '''Process an entire list of skills'''
        for skill in skills:
            self.process_skill(skill)

    def get_top_skills(self, n=10, by='unique_idx'):
        """
        Return top-n skills.
        by: 'unique_idx' (HLL estimate) or 'volume' (skill count)
        """

        if by == "unique_idx":
            scores = {
                tag:(hll.count() or 0) for tag,hll in self.hll_map.items()
            }
        else:
            scores = dict(self.skills_count)


        return sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]
    
    def memory_usage_bytes(self):
        """Estimate memory used by all HLL registers."""
        num_tags = len(self.hll_map)
        registers_per_hll = 1 << self.precision  # 2^b
        return num_tags * registers_per_hll       # 1 byte per register


class SkillTrendPipeline:
    def __init__(self, precision=12):
        self.redis_client = redis_connect()
        self.detector = SkillTrendDetector(precision=precision)

    def load_skills_from_redis(self, pattern="job_skills:*"):
        """
        Retrieve skills from Redis.
        Redis key format: job_skills:<idx>
        Stored value: comma-separated skills string
        Returns a list of dicts: [{"idx": idx, "skills": [skill1, skill2, ...]}, ...]
        """
        records = []
        keys = self.redis_client.keys(pattern)  
        for key in keys:
            skills_json = self.redis_client.get(key)
            if skills_json:
                try:
                    skills = json.loads(skills_json)
                    idx = key.split(":", 1)[1]  # extract the idx after prefix
                    records.append({"idx": idx, "skills": skills})
                except json.JSONDecodeError:
                    continue
        return records

    def run(self):
        """Run the full pipeline: Redis -> Detector"""
        skill_records = self.load_skills_from_redis()
        self.detector.process_all(skill_records)

    def get_top_skills(self, n=5, by="volume"):
        return self.detector.get_top_skills(n=n, by=by)
    
    def save_data_to_redis(self):
        self.run()
        top_skills = self.get_top_skills(n=50)

        self.redis_client.set("top_skills",json.dumps(top_skills),ex=24*60*60) # a full day


def pre_server_start():
    pipline = SkillTrendPipeline()
    pipline.save_data_to_redis()

if __name__ == "__main__":
    pre_server_start()