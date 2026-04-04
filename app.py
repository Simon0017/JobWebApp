from flask import Flask,render_template,jsonify,request
from JobPostingWebApp.views.job_directories import *
from JobPostingWebApp.services.job_evaluation import JobEvaluation
from JobPostingWebApp.services.market_analysis import MarketAnalysis
from JobPostingWebApp.services.job_suitablity import JobSuitablity,convert_df_list
from JobPostingWebApp.models.connect_to_redis import redis_connect
from JobPostingWebApp.services.search_algorithms import SearchAlgorithm

app = Flask(__name__)

redis_client = redis_connect()

@app.route('/')
def index():
    return render_template("index_1.html")



@app.route("/jobs",methods = ['GET'])
def get_listed_jobs():
    page = int(request.args.get("page",1))
    limit = 6
    start_idx = ((page-1) * limit) + 1 
    
    data = general_directory_list(start_idx,limit)
    return jsonify({
        "page":page,
        "data":data
    })


@app.route("/job_eval",methods= ["GET"])
def job_evaluation():
    job_id = int(request.args.get("id"))
    eval_obj = JobEvaluation(job_id,redis_client)
    eval_obj.get_job_details()

    response = {}
    response["demand"] = eval_obj.calculate_job_activity()
    response["similar_jobs"] = eval_obj.get_similar_jobs(5)
    eval_obj.contruct_KG()
    response['kgraph'] = eval_obj.KG_to_json()

    return jsonify(response)



@app.route("/market_analysis",methods = ['GET'])
def market_analysis():
    anly_obj = MarketAnalysis(redis_client)
    response = {}

    anly_obj.get_active_jobs()
    anly_obj.get_avg_deadline()
    anly_obj.get_platforms_tracked()

    response['job_per_platform'] = anly_obj.job_per_platform()
    response['jobs_per_fields']  = anly_obj.jobs_per_field()
    response['job_types_distr'] = anly_obj.job_types_distribution()
    response['top_skills'] = anly_obj.top_skills()
    active_jobs_change = anly_obj.active_job_stat_change()
    platforms_tracked_change = anly_obj.platforms_tracked_change()
    avg_dl_change = anly_obj.avg_dl_change()

    response['active_jobs'] = anly_obj.active_jobs
    response['avg_deadline'] = anly_obj.avg_days_to_deadline
    response['platforms_tracked'] = anly_obj.platforms_tracked
    response['multi_listed'] = anly_obj.multi_listed_jobs
    response['active_jobs_change'] = active_jobs_change
    response['platforms_tracked_change'] = platforms_tracked_change
    response['avg_deadline_change'] = avg_dl_change

    return jsonify(response)



@app.route("/job_recommendation",methods = ["POST"])
def job_recommendation():
    data = request.get_json()

    candidate = JobSuitablity(data)
    df = candidate.load_df().fillna("")
    jobs_list = convert_df_list(df)
    top_suggestions = candidate.suggest_based_on_score(jobs_list)
    response = {}

    response["recommendations"] = top_suggestions
    return jsonify(response)


@app.route("/search",methods = ['GET'])
def search_jobs():
    data = request.args.get("q","")
    response = {}

    search_obj = SearchAlgorithm(redis_client)
    results = search_obj.aggregate_search(data)
    response["results"] = [dict(res) for res in results]

    return jsonify(response)


@app.route("/job_details",methods = ['GET'])
def get_job_details():
    job_id = int(request.args.get("id"))
    search_obj = SearchAlgorithm(redis_client)
    details = search_obj.get_job_details(job_id)

    return jsonify(details)

if __name__ == "__main__":
    app.run(debug=True)