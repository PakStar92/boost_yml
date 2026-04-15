# mediaforge-battle-test

Battle test suite for [mediaforge](https://www.npmjs.com/package/mediaforge) — covers every documented export and builder method.

## What it tests

- Every export: `ffmpeg`, `FFmpegBuilder`, `screenshots`, `frameToBuffer`, `pipeThrough`, `streamOutput`, `streamToFile`, `mergeToFile`, `concatFiles`, `toGif`, `gifToMp4`, `normalizeAudio`, `adjustVolume`, `addWatermark`, `addTextWatermark`, `burnSubtitles`, `extractSubtitles`, `writeMetadata`, `stripMetadata`, `generateWaveform`, `generateSpectrum`, `getPreset`, `applyPreset`, `listPresets`, `hlsPackage`, `adaptiveHls`, `dashPackage`, `twoPassEncode`, `buildTwoPassArgs`, `mapStream`, `mapAVS`, `copyStream`, `setMetadata`, `ss`, `nvencToArgs`, `vaapiToArgs`, all filter functions, all ffprobe helpers, `renice`, `autoKillOnExit`, `killAllFFmpeg`, `guardCodec`, `guardFeatureVersion`, `selectBestCodec`
- All fluent builder methods
- All 7 watermark positions
- All named presets (web, web-hq, mobile, archive, podcast, hls-input, gif, discord, instagram, prores, dnxhd)
- CJS require compatibility

## Run locally

```bash
npm install
node test.mjs
```

Requires `ffmpeg` and `ffprobe` on PATH (or set `FFMPEG_PATH` / `FFPROBE_PATH`).

### Termux (Android)
```bash
pkg install ffmpeg nodejs
npm install
node test.mjs
```

### Deno
```bash
npm install   # populate node_modules for npm compat
deno run --allow-run=ffmpeg,ffprobe --allow-read --allow-write --allow-env test.mjs
```

### Bun
```bash
bun install
bun run test.mjs
```

## CI Workflows

| Workflow | Runtimes | Platforms |
|----------|----------|-----------|
| `node.yml` | Node 20, 22, 24 | Ubuntu, macOS, Windows |
| `deno.yml` | Deno 2.x | Ubuntu, macOS, Windows |
| `bun.yml` | Bun latest | Ubuntu, macOS, Windows |

All workflows:
- Keep running on individual test failures
- Log comprehensive error details inline
- Print a full error summary at the end
- Upload test output as artifacts
