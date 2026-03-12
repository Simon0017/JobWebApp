'''This serves views for the job directory'''
from JobPostingWebApp.db_selectors.directory_queries import *

def general_directory_list(start_idx,limit):
    raw_data = get_general_paginated_data_db(start_idx,limit)

    processed_data = []
    for r in raw_data:
        processed_data.append({
            "id":r[0],
            "title":r[1],
            "field":r[2],
            "company":r[3],
            "posted_by":r[8],
            "location":r[5],
            "type":r[4],
            "payment":r[6],
            "date_posted":r[9],
            "minimum_requirements":r[10],
            "responsibilities":r[11],
            "application_method":r[12],
            "application_deadline":r[7],
            "sites":get_companies_linked_with_title_db(str(r[1])),
            "skills":r[10],
            "url":r[13]
        })

    return processed_data
