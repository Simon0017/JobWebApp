from flask import Flask,render_template,jsonify,request
from JobPostingWebApp.views.job_directories import *
from JobPostingWebApp.services.job_evaluation import JobEvaluation
from JobPostingWebApp.services.market_analysis import MarketAnalysis


app = Flask(__name__)

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
    eval_obj = JobEvaluation(job_id)
    eval_obj.get_job_details()

    response = {}
    response["demand"] = eval_obj.calculate_job_activity()
    response["similar_jobs"] = eval_obj.get_similar_jobs(5)
    eval_obj.contruct_KG()
    response['kgraph'] = eval_obj.KG_to_json()

    return jsonify(response)

@app.route("/market_analysis",method = ['GET'])
def market_analysis():
    anly_obj = MarketAnalysis()
    response = {}

    anly_obj.get_active_jobs()
    anly_obj.get_avg_deadline()
    anly_obj.get_platforms_tracked()

    response['job_per_platform'] = anly_obj.job_per_platform()
    response['jobs_per_fields']  = anly_obj.jobs_per_field()
    response['job_types_distr'] = anly_obj.job_types_distribution()
    response['top_skills'] = anly_obj.top_skills()

    response['active_jobs'] = anly_obj.active_jobs
    response['avg_deadline'] = anly_obj.avg_days_to_deadline
    response['platforms_tracked'] = anly_obj.platforms_tracked
    response['multi_listed'] = anly_obj.multi_listed_jobs

    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)