#!/usr/bin/env python3
"""Restore verified piano samples without replacing existing audio files."""

from concurrent.futures import ThreadPoolExecutor
import hashlib
from pathlib import Path
import re
from urllib.request import urlopen

SAMPLES = Path(__file__).resolve().parents[1] / "samples"
SOURCE = (
    "https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/"
    "044fab8e1456bfafc5776e86dfd6bb8697149aef/"
    "FatBoy/acoustic_grand_piano-mp3/"
)


def restore(entry):
    expected, filename = entry
    if not re.fullmatch(r"piano-[A-G][0-8]\.mp3", filename):
        raise ValueError(f"Invalid sample filename: {filename}")
    path = SAMPLES / filename
    if path.exists():
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise ValueError(f"{filename} differs from the manifest; leaving it unchanged")
        return f"Verified {filename}"

    source_name = filename.removeprefix("piano-")
    with urlopen(SOURCE + source_name, timeout=30) as response:
        data = response.read(2_000_000)
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError(f"Source checksum mismatch: {filename}")
    temporary = path.with_suffix(".mp3.part")
    temporary.write_bytes(data)
    temporary.replace(path)
    return f"Restored {filename}"


def main():
    entries = [line.split() for line in (SAMPLES / "SHA256SUMS").read_text().splitlines() if line]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(restore, entries):
            print(result, flush=True)


if __name__ == "__main__":
    main()
