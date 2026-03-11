'''This serves queries for the job directory'''
from JobPostingWebApp.db_selectors.dbconn import db_connect

CONN = db_connect()

def get_general_paginated_data_db(start_idx,limit):
    with CONN.cursor() as cur:
        cur.execute(f"""
            SELECT id,title,field,company,type,location,payment,application_deadline,posted_by,date_posted,minimum_requirements,
                    responsibilities,application_method FROM job_postings
            LIMIT {limit} OFFSET {start_idx};
        """)

        rows = cur.fetchall()
        return rows


def get_companies_linked_with_title_db(title):
    #Twist so that title and company go together----REFINE THIS(INCLUDE COSINE SIMILARITY IN THE VIEWS HADNLING IT)
    with CONN.cursor() as cur:
        cur.execute(f'''
            SELECT posted_by FROM job_postings WHERE title=%s;
        ''',(title,))
        rows = cur.fetchall()
        return rows
