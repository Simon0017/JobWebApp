from datetime import datetime
from JobPostingWebApp.models.job_model import job_table
from JobPostingWebApp.models.sql_alchemy_settings import engine
from sqlalchemy import select,func,distinct
import statistics
from collections import Counter
from JobPostingWebApp.services.trend_detector import SkillTrendPipeline
from redis import Redis
import datefinder

class MarketAnalysis:
    """Class to perform market analysis"""

    def __init__(self,redis_client:Redis):
        self.redis_client = redis_client
        self.active_jobs = 0
        self.platforms_tracked = 0
        self.multi_listed_jobs = 0
        self.avg_days_to_deadline = 0
        self.today = datetime.now()

    def get_avg_deadline(self):
        query = select(job_table.c.application_deadline).where(job_table.c.application_deadline.isnot(None))
        with engine.connect() as conn:
            result = conn.execute(query)
            rows = result.fetchall()
            self.avg_days_to_deadline = calc_avg_days(rows,self.today)

    def get_active_jobs(self):
        # change this later so that application dealines are maintained
        # THE  APPLICATIOON DEADLINE FIELD IS NOT A DATE OR TIMESTAMP HERE WE CANNOT DO FILTERING BASED ON THE TIME ON THE SQL
        query = select(job_table.c.application_deadline).where(job_table.c.application_deadline.isnot(None))

        with engine.connect() as conn:
            result = conn.execute(query)
            rows = result.fetchall()
            self.active_jobs = get_active_jobs_count(rows,self.today)
    
    def get_platforms_tracked(self):
        query = select(func.count(distinct(job_table.c.posted_by))).where(job_table.c.posted_by.isnot(None))

        with engine.connect() as conn:
            self.platforms_tracked = conn.execute(query).scalar()


    def get_multilisted_jobs(self):
        # until we can find similarity between job titles UNIMPLIMENTED
        pass

    def job_per_platform(self):
        query = select(job_table.c.posted_by).where(job_table.c.posted_by.isnot(None))
        with engine.connect() as conn:
            result = conn.execute(query).fetchall()

        posted_by_list = [row[0] for row in result]
        posted_by_counter = dict(Counter(posted_by_list))

        return posted_by_counter


    def jobs_per_field(self):
        #impliment a similarity check(IMPLEMETED BY THE CHILD CLASS OF JOBSIMILARITY CLASS) here to aggregate similar fields:
        query = select(job_table.c.field).where(job_table.c.field.isnot(None))
        with engine.connect() as conn:
            result = conn.execute(query).fetchall()

        field_list = [row[0] for row in result]
        field_counter = dict(Counter(field_list))

        return field_counter

    def posting_trend(self):
        #UNIMPLEMENTED until we figure out the date posted field during scraping

        query = select(job_table.c.date_posted).where(job_table.c.date_posted.isnot(None))
        with engine.connect() as conn:
            result = conn.execute(query).fetchall()

        date_list = [row[0] for row in result]
        date_counter = dict(Counter(date_list))

        return date_counter

    def job_types_distribution(self):
        query = select(job_table.c.type).where(job_table.c.type.isnot(None))
        with engine.connect() as conn:
            result = conn.execute(query).fetchall()

        type_list = [row[0] for row in result]
        type_counter = dict(Counter(type_list))

        return type_counter

    def top_skills(self):
        # application of hyperloglog
        skills_pipeline = SkillTrendPipeline(self.redis_client,12)
        skills_pipeline.run()

        top_skills_unique = skills_pipeline.get_top_skills(n=5,by="volume")
        return dict(top_skills_unique)






def calc_avg_days(date_list:list,today:datetime):
    days = []
    for row in date_list:
        date_obj = parse_datetime(row[0])
        date_diff = date_obj - today
        days_diff = date_diff.days
        if days_diff > 0:
            days.append(days_diff)
    
    return round(statistics.mean(days),2)

def get_active_jobs_count(date_list:list,today:datetime):
    count = 0
    for row in date_list:
        date_obj = parse_datetime(row[0]) 
        date_diff = date_obj - today
        days_diff = date_diff.days
        if days_diff > 0:
            count += 1
    return count

def parse_datetime(val):
    value = val.strip()
    try:
        matches  = list(datefinder.find_dates(value))
        if matches:
            match_datetime = matches[0]
            return match_datetime.replace(tzinfo=None)
    except:
        return datetime.now()


# testing

# analysis = MarketAnalysis()
# analysis.get_active_jobs()
# analysis.get_avg_deadline()
# analysis.get_platforms_tracked()
# j_per_platform = analysis.job_per_platform()
# j_types_distr = analysis.job_types_distribution()
# j_per_field = analysis.jobs_per_field()

# print(f"Active jobs:\t{analysis.active_jobs}\n")
# print(f"Avg deaslines:\t{analysis.avg_days_to_deadline}\n")
# print(f"Platforms tracked:\t{analysis.platforms_tracked}\n")
# from pprint import pprint
# print("Jobs per Platform:")
# pprint(j_per_platform)
# print("\nJob Types Distribution:")
# pprint(j_types_distr)
# print("\nJobs per Field:")
# pprint(j_per_field)