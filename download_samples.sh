#!/bin/bash

# Create samples directory if it doesn't exist
mkdir -p samples

# Clean existing files
rm -f samples/*.mp3

# Download piano samples from an alternative source
BASE_URL="https://gleitz.github.io/midi-js-soundfonts/FatBoy/acoustic_grand_piano-mp3"
NOTES=("A" "B" "C" "D" "E" "F" "G")
OCTAVES=(3 4 5 6)

for note in "${NOTES[@]}"; do
    for octave in "${OCTAVES[@]}"; do
        target_file="samples/piano-${note}${octave}.mp3"
        url="${BASE_URL}/${note}${octave}.mp3"
        echo "Downloading ${note}${octave} to $target_file..."
        
        # Download and convert the file
        if curl -L -f "$url" -o "$target_file"; then
            echo "Successfully downloaded ${note}${octave}"
        else
            echo "Failed to download ${note}${octave}"
        fi
    done
done

echo "Download complete!"
