import os
import urllib.request

def download_piano_samples():
    # Piano sample URLs (replace these with actual URLs to piano samples)
    sample_urls = {
        'F1': 'https://piano-samples.s3.amazonaws.com/piano-F1.mp3',
        'F2': 'https://piano-samples.s3.amazonaws.com/piano-F2.mp3',
        'F3': 'https://piano-samples.s3.amazonaws.com/piano-F3.mp3',
        'F4': 'https://piano-samples.s3.amazonaws.com/piano-F4.mp3',
        'F5': 'https://piano-samples.s3.amazonaws.com/piano-F5.mp3',
        'F6': 'https://piano-samples.s3.amazonaws.com/piano-F6.mp3',
    }
    
    # Create samples directory if it doesn't exist
    if not os.path.exists('../samples'):
        os.makedirs('../samples')
    
    # Download each sample
    for note, url in sample_urls.items():
        output_path = f'../samples/piano-{note}.mp3'
        try:
            print(f'Downloading {note}...')
            urllib.request.urlretrieve(url, output_path)
            print(f'Successfully downloaded {note}')
        except Exception as e:
            print(f'Error downloading {note}: {str(e)}')

if __name__ == '__main__':
    download_piano_samples()
