# Piano samples

The 52 natural-note samples cover A0–C8. The engine plays intervening black keys
by shifting a neighbouring sample by one semitone. The original 28 C3–B6 files
were preserved; all 28 were checked byte for byte against their source before
the outer registers were added.

See [CREDITS.txt](./CREDITS.txt) for attribution, the upstream source and the
CC BY-SA 3.0 sample license. This notice is also published with the site.

`SHA256SUMS` records every file. To restore missing files from the pinned upstream
revision, run:

```sh
python3 scripts/download-piano-range-samples.py
```

The script verifies checksums, leaves matching files in place and refuses to
overwrite a changed file. It needs only Python's standard library. The legacy
download scripts in this repository are not used for this sample set.

The browser warms only the original 19 notes C3–G5. The remaining registers load
when played, using the same cache and first-tap fallback as the middle register.
This set provides one sample per natural pitch, not multiple velocity layers;
MIDI velocity adjusts playback volume.
