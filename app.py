from flask import Flask,render_template,jsonify,request
from JobPostingWebApp.views.job_directories import *

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