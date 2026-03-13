# Job Market Analysis & Recommendation Platform

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-Web_Framework-black.svg)
![Redis](https://img.shields.io/badge/Redis-Caching-red.svg)
![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)

A **Flask-based web application** that analyzes job postings and provides insights into the job market.
The platform extracts skills from job advertisements, evaluates job descriptions, recommends similar jobs, and tracks trending skills using Redis data structures.

The system collects job data from **publicly available job listing websites** and processes it using **Natural Language Processing (NLP)** and **machine learning techniques**.

---

# Features

### Job Evaluation

* Analyze job descriptions to extract required skills.
* Evaluate job listings using NLP-based techniques.

### Job Market Analysis

* Analyze patterns across multiple job postings.
* Identify frequently requested skills.

### Trending Skills Tracking

* Uses **HyperLogLog** to track trending skills efficiently.
* Handles large-scale skill tracking with minimal memory usage.

### Skill Extraction

* Uses **SkillNer + spaCy models** to extract professional skills from job descriptions.

### Job Recommendation

* Uses **Sentence Transformers** to generate semantic embeddings.
* Finds similar job listings using vector similarity.

### Text Similarity

* Uses **RapidFuzz** for fast fuzzy matching between job descriptions.

### Job Advertisement Evaluation

* Compare and evaluate job postings using NLP similarity techniques.

### Pagination

* Efficient pagination for browsing large job datasets.

### Caching

* Redis caching layer improves response speed and reduces database queries.

### Web Scraping

* Job data is collected from **publicly accessible job listing websites** using **Scrapy**.

---

# Technology Stack

## Backend

* Python
* Flask
* Redis
* PostgreSQL
* SQLAlchemy

## NLP / Machine Learning

* spaCy
* SkillNer
* Sentence Transformers
* RapidFuzz
* Scikit-learn
* PyTorch

## Data Collection (*Check another repository*)

* Scrapy

## Frontend

* HTML
* CSS
* JavaScript

## Data Processing

* Pandas
* NumPy

---

# System Architecture

```
Scrapy Crawlers
      │
      ▼
PostgreSQL Database
      │
      ▼
Flask API Layer
      │
      ├── Redis Cache
      │      └── HyperLogLog (Trending Skills)
      │
      ├── NLP Processing
      │      ├── SkillNer (Skill Extraction)
      │      ├── RapidFuzz (Text Similarity)
      │      └── Sentence Transformers (Job Similarity)
      │
      ▼
Frontend (HTML / CSS / JavaScript)
```

---

# Installation

## 1. Clone the repository

```bash
git clone https://github.com/Simon0017/JobWebApp.git
cd JobWebApp
```

---

## 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it:

### Linux / Mac

```bash
source venv/bin/activate
```

### Windows

```bash
venv\Scripts\activate
```

---

## 3. Install dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure environment variables

Create a `.env` file:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=****
POSTGRES_USER=***
POSTGRES_PASSWORD=****

DATABASE_URL=****************************
```

---

## 5. Start Redis

Make sure the Redis server is running:

```bash
redis-server
```

---

## 6. Run the Flask application

```bash
flask run
```

Application will start at:

```
http://127.0.0.1:5000
```

---


# Key Libraries Used

| Library               | Purpose                             |
| --------------------- | ----------------------------------- |
| Flask                 | Web framework                       |
| Redis                 | Caching and trending skill tracking |
| Scrapy                | Job data collection                 |
| spaCy                 | NLP processing                      |
| SkillNer              | Skill extraction                    |
| Sentence Transformers | Job similarity and recommendations  |
| RapidFuzz             | Text similarity matching            |
| SQLAlchemy            | Database ORM                        |

---

# API Functionality

The Flask backend exposes APIs used by the frontend for:

* Job listings retrieval
* Job similarity queries
* Job evaluation
* Trending skills
* Market analytics

All endpoints support **pagination** for efficient browsing.

Example:

```
GET /jobs?page=1
```

---

# Project Structure

```
project/
│
├── app.py
├── requirements.txt
├── .env
│
├── models/
├── services/
├── db_selectors/
├── views/
│
│
├── static/
│   ├── css/
│   ├── js/
│
└── templates/
```

---

# Data Sources

All job data used in this project is obtained from **publicly available job listing websites** and collected using **legal web scraping techniques**.

---

# Future Improvements

* Real-time job updates
* Advanced recommendation algorithms
* Salary prediction models
* Skill gap analysis
* Data visualization dashboards
* Real-time trending skill monitoring

---

# License

This project is licensed under the **GPL- 3.0 license**.

---

# Author

Developed as part of a job market analysis and recommendation platform project using modern **NLP**, **machine learning**, and **data engineering** tools.
