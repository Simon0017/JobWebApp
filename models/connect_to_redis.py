import redis

def redis_connect(decode_opt = True):
    try:
        redis_client = redis.Redis(
            host="localhost",
            port=6379,
            db=0,
            decode_responses=decode_opt
        )
        # verify connectivity, to avoid lazy connect errors later
        redis_client.ping()
        print('[Redis] Connection successful')
        return redis_client
    except Exception as e:
        print(f'[Redis] Connection failed: {e}')
        return None