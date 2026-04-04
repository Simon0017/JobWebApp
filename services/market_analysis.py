from datetime import datetime,timedelta
from JobPostingWebApp.models.job_model import job_table
from JobPostingWebApp.models.sql_alchemy_settings import engine
from sqlalchemy import DateTime, cast, select,func,distinct
import statistics
from JobPostingWebApp.services.trend_detector import SkillTrendPipeline
import datefinder

class MarketAnalysis:
    """Class to perform market analysis"""

    def __init__(self,redis_client = None):
        self.redis_client = redis_client
        self.active_jobs = 0
        self.platforms_tracked = 0
        self.multi_listed_jobs = 0
        self.avg_days_to_deadline = 0
        self.today = datetime.now()
        self.last_week = self.today - timedelta(days=7)

    def get_avg_deadline(self):
        query = select(
                func.avg(
                    func.extract(
                        "epoch",
                        cast(job_table.c.application_deadline, DateTime) - func.now()
                    ) / 86400
                ).label("avg_days")
            ).where(
                job_table.c.application_deadline.isnot(None),
                cast(job_table.c.application_deadline, DateTime) > func.now()
            )
        

        with engine.connect() as conn:
            self.avg_days_to_deadline = round(conn.execute(query).scalar(),2)

    def get_active_jobs(self):
        query = select(func.count()).where(
            job_table.c.application_deadline.isnot(None),
            cast(job_table.c.application_deadline, DateTime) > func.now()
        )
        with engine.connect() as conn:
            self.active_jobs = conn.execute(query).scalar()

    def get_platforms_tracked(self):
        query = select(func.count(distinct(job_table.c.posted_by))).where(job_table.c.posted_by.isnot(None))

        with engine.connect() as conn:
            self.platforms_tracked = conn.execute(query).scalar()


    def get_multilisted_jobs(self):
        # until we can find similarity between job titles UNIMPLIMENTED
        pass

    def job_per_platform(self):
        query = select(
                job_table.c.posted_by,
                func.count(job_table.c.id).label("total_jobs")
            ).group_by(
                job_table.c.posted_by
            ).order_by(
                func.count(job_table.c.id).desc()
            )
        with engine.connect() as conn:
            result = conn.execute(query).fetchall()
            posted_by_counter = {row[0]: row[1] for row in result}

        return posted_by_counter


    def jobs_per_field(self,limit = 10):
        query = select(
                job_table.c.field,
                func.count(job_table.c.id).label("total_jobs")
            ).where(
                job_table.c.field.isnot(None)
            ).group_by(
                job_table.c.field
            ).order_by(
                func.count(job_table.c.id).desc()
            ).limit(limit)
        with engine.connect() as conn:
            result = conn.execute(query).fetchall()
            field_counter = {row[0]: row[1] for row in result} 

        return field_counter

    def posting_trend(self):
        query = select(
                func.date_trunc('day', cast(job_table.c.date_posted, DateTime)).label("date"),
                func.count(job_table.c.id).label("total_jobs")
            ).group_by(
                func.date_trunc('day', cast(job_table.c.date_posted, DateTime))
            ).order_by(
                func.date_trunc('day', cast(job_table.c.date_posted, DateTime))
            )
        with engine.connect() as conn:
            result = conn.execute(query).fetchall()
            type_counter = {row[0].strftime("%Y-%m-%d"): row[1] for row in result}

        return type_counter
    
    def job_types_distribution(self):
        query = select(
                job_table.c.type,
                func.count(job_table.c.id).label("total_jobs")
            ).where(
                job_table.c.type.isnot(None)
            ).group_by(
                job_table.c.type
            ).order_by(
                func.count(job_table.c.id).desc()
            )
        with engine.connect() as conn:
            result = conn.execute(query).fetchall()
            type_counter = {row[0]: row[1] for row in result} 

        return type_counter

    def top_skills(self):
        # application of hyperloglog
        skills_pipeline = SkillTrendPipeline(self.redis_client,12)
        skills_pipeline.run()

        top_skills_unique = skills_pipeline.get_top_skills(n=5,by="volume")
        return dict(top_skills_unique)


    def active_job_stat_change(self):
        query = select(func.count()).where(
            job_table.c.application_deadline.isnot(None),
            cast(job_table.c.application_deadline, DateTime) >= self.last_week
        )

        with engine.connect() as conn:
            result = conn.execute(query).scalar()
            
        return result - self.active_jobs

    def platforms_tracked_change(self):
        query = select(
            func.count(distinct(job_table.c.posted_by))
            ).where(
                job_table.c.posted_by.isnot(None),
                cast(job_table.c.date_posted, DateTime) >= self.last_week)

        with engine.connect() as conn:
            result = conn.execute(query).scalar()
            
        return result - self.platforms_tracked

    def multi_listed_change(self):
        pass
    
    def avg_dl_change(self):
        query = select(
                func.avg(
                    func.extract(
                        "epoch",
                        cast(job_table.c.application_deadline, DateTime) - func.now()
                    ) / 86400
                ).label("avg_days")
            ).where(
                job_table.c.application_deadline.isnot(None),
                cast(job_table.c.application_deadline, DateTime) > func.now(),
                cast(job_table.c.date_posted, DateTime) >= self.last_week
            )
        

        with engine.connect() as conn:
            result = round(conn.execute(query).scalar(),2)
            
        return result - self.avg_days_to_deadline




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
if __name__ == "__main__":
    analysis = MarketAnalysis()
    analysis.get_active_jobs()
    analysis.get_avg_deadline()
    analysis.get_platforms_tracked()
    j_per_platform = analysis.job_per_platform()
    j_types_distr = analysis.job_types_distribution()
    j_per_field = analysis.jobs_per_field()
    top_skills = analysis.top_skills()
    active_jobs_change = analysis.active_job_stat_change()
    platforms_tracked_change = analysis.platforms_tracked_change()
    avg_dl_change = analysis.avg_dl_change()

    print(f"Active jobs:\t{analysis.active_jobs}\n")
    print(f"Avg deaslines:\t{analysis.avg_days_to_deadline}\n")
    print(f"Platforms tracked:\t{analysis.platforms_tracked}\n")
    from pprint import pprint
    print("Jobs per Platform:")
    pprint(j_per_platform)
    print("\nJob Types Distribution:")
    pprint(j_types_distr)
    print("\nJobs per Field:")
    pprint(j_per_field)
    print("\nTop Skills:")
    pprint(top_skills)
    print(f"\nActive Jobs Change:\t{active_jobs_change}")
    print(f"Platforms Tracked Change:\t{platforms_tracked_change}")
    print(f"Avg Deadline Change:\t{avg_dl_change}")