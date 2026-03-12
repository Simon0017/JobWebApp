#!/bin/bash

export PYTHONPATH=$(pwd)

echo "Executing code in the job_similarity.py..."

python job_similarity.py &

echo "Executing code in skill_extractor.py..."


python  skills_extractor.py &

wait

echo "Executing code in trend_detector.py..."
python trend_detector.py


echo "All task completed.Exiting..."