import os
import requests
from tqdm import tqdm

def download_piano_samples():
    # 创建samples目录（如果不存在）
    samples_dir = 'samples'
    if not os.path.exists(samples_dir):
        os.makedirs(samples_dir)

    # 需要下载的音符列表
    notes = ['B4', 'D4', 'E4', 'G4', 'D5', 'E5', 'G5']
    
    # Tone.js piano samples的基础URL
    base_url = "https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/piano"

    for note in tqdm(notes, desc="Downloading piano samples"):
        filename = f"piano-{note}.mp3"
        filepath = os.path.join(samples_dir, filename)
        
        # 如果文件已存在，跳过
        if os.path.exists(filepath):
            print(f"Skipping {filename} - already exists")
            continue

        # 构建完整的URL
        url = f"{base_url}/{filename}"
        
        try:
            # 下载文件
            response = requests.get(url)
            response.raise_for_status()
            
            # 保存文件
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"Downloaded {filename}")
            
        except Exception as e:
            print(f"Error downloading {filename}: {str(e)}")

if __name__ == "__main__":
    download_piano_samples()
