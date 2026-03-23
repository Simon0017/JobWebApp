import redis
from JobPostingWebApp.models.job_model import job_table
from JobPostingWebApp.models.sql_alchemy_settings import engine
from sqlalchemy import select
import pandas as pd
import io
from rapidfuzz import process
from random import shuffle
import json
from JobPostingWebApp.db_selectors.directory_queries import get_companies_linked_with_title_db


class SearchAlgorithm:
    ''''Algorithm used to search the db for job based  titles,company or any keyword
    Spacy nlp used,Fuzzy search etc
    '''
    def __init__(self,redis_client:redis.Redis):
        self.redis_conn = redis_client

    def save_search(self,data:dict):
        search_term = data['search']
        results = data['result']

        self.redis_conn.set(
            search_term,
            json.dumps(results),
            ex=24*3600
        )

    def extract_db_data(self):
        query = select(job_table.c.title,job_table.c.company)

        with engine.connect() as conn:
            result = conn.execute(query)
            return result.mappings().all()
        

    def save_db_to_cache(self):
        df = pd.DataFrame(self.extract_db_data())
        self.redis_conn.set(
            "search_df",
            df.to_json(),
            ex=24*3600
        )

    def load_redis_db(self):
        df_json = self.redis_conn.get("search_df")
        if df_json is None:
            return None
        return pd.read_json(io.StringIO(df_json))


    def search_titles(self,text,limit = 5):
        df = self.load_redis_db()
        if df is None:
            data = self.extract_db_data()
            df = pd.DataFrame(data)
            self.save_db_to_cache()

        titles = df["title"].to_list()
        best = process.extract( # fuzzy search for best macthed titles
            text,
            titles,
            limit=limit
        )

        best_titles = [job(0) for job in best]
        

        return get_job_data_by_title(best_titles)

    def search_companies(self,text,limit=5):
        df = self.load_redis_db()
        if df is None:
            data = self.extract_db_data()
            df = pd.DataFrame(data)
            self.save_db_to_cache()

        companies = df["company"].to_list()
        best = process.extract( # fuzzy search
            text,
            companies,
            limit=limit
        )

        best_matched_companies = [job[0] for job in best]

        return get_job_data_by_company(best_matched_companies)

    def aggregate_search(self,text):
        by_title = self.search_titles(text)
        by_company = self.search_companies(text)

        combined_search = list(set([*by_title,*by_company])) # removing duplicates in the search results
        shuffle(combined_search)  # shuffles list

        return combined_search
    


def get_job_data_by_title(titles:list):
    query = select(job_table).filter(job_table.c.title.in_(titles))

    with engine.connect() as conn:
        results =  conn.execute(query).mappings().all()
        all_res = []
        for res in results:
            res_dict = dict(res)
            res_dict["sites"] = get_companies_linked_with_title_db(res_dict['title'])
            all_res.append(res)

        return all_res

def get_job_data_by_company(companies:list):
    query = select(job_table).filter(job_table.c.company.in_(companies))

    with engine.connect() as conn:
        results =  conn.execute(query).mappings().all()
        all_res = []
        for res in results:
            res_dict = dict(res)
            res_dict["sites"] = get_companies_linked_with_title_db(res_dict['title'])
            all_res.append(res)

        return all_res