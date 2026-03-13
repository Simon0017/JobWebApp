import redis

def redis_connect(decode_opt = True):
    return redis.Redis(
        host="localhost",
        port=6379,
        db=0,
        decode_responses=decode_opt
    )