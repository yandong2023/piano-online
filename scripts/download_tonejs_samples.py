import os
import urllib.request
import ssl

def download_tonejs_samples():
    # Disable SSL certificate verification (only if needed)
    ssl._create_default_https_context = ssl._create_unverified_context
    
    # Base URL for tonejs-instruments piano samples
    base_url = "https://nbrosowsky.github.io/tonejs-instruments/samples/piano"
    
    # Notes we need (focusing on F notes which we're missing)
    notes = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6']
    
    # Create samples directory if it doesn't exist
    samples_dir = '../samples'
    if not os.path.exists(samples_dir):
        os.makedirs(samples_dir)
    
    # Download each sample
    for note in notes:
        filename = f'piano-{note}.mp3'
        url = f"{base_url}/{note}.mp3"
        output_path = os.path.join(samples_dir, filename)
        
        try:
            print(f'Downloading {note}...')
            urllib.request.urlretrieve(url, output_path)
            print(f'Successfully downloaded {note}')
        except Exception as e:
            print(f'Error downloading {note}: {str(e)}')

if __name__ == '__main__':
    download_tonejs_samples()
