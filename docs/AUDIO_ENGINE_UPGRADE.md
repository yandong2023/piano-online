# Audio Engine Upgrade Plan

## Current issues

- HTMLAudio based playback limits realistic piano behavior.
- Sharp notes currently reuse nearby natural note samples.
- Sustain lifecycle is incomplete.
- All samples are eagerly preloaded.

## Target architecture

InputController

```
Keyboard / Touch / Mouse / MIDI
            |
            v
      Note Event Bus
            |
            v
      Piano Audio Engine
            |
            +--> Practice Mode
            +--> Rhythm Game
            +--> Recorder
```

## Migration steps

1. Introduce unified note events.
2. Replace HTMLAudio playback with Tone.Sampler.
3. Load samples after first user interaction.
4. Add real sustain pedal lifecycle.
5. Add selectable instruments.
