import os
import time
import asyncio
import shutil

TMP_DIR = "./tmp"
MAX_AGE = 600  # 10 minutes

async def cleanup_task():
    while True:
        try:
            now = time.time()
            if os.path.exists(TMP_DIR):
                for folder in os.listdir(TMP_DIR):
                    folder_path = os.path.join(TMP_DIR, folder)
                    if os.path.isdir(folder_path):
                        mtime = os.path.getmtime(folder_path)
                        if now - mtime > MAX_AGE:
                            shutil.rmtree(folder_path, ignore_errors=True)
                    elif os.path.isfile(folder_path):
                        mtime = os.path.getmtime(folder_path)
                        if now - mtime > MAX_AGE:
                            os.remove(folder_path)
        except Exception as e:
            print(f"Cleanup error: {e}")
        
        await asyncio.sleep(300)  # run every 5 mins
