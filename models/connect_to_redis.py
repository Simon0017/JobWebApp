import redis

def redis_connect():
    return redis.Redis(
        host="localhost",
        port=6379,
        db=0,
        decode_responses=True
    )