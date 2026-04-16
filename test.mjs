/**
 * mediaforge battle test — v0.2.0
 * Covers every export and method from the updated README + CHANGELOG.
 * Each test is isolated: errors are collected, suite keeps running.
 * Full error summary printed at the end.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, 'tmp');
fs.mkdirSync(TMP, { recursive: true });

// ─── harness ───────────────────────────────────────────────────────────────
const errors = [];
let passed = 0;
let skipped = 0;

async function run(label, fn) {
  process.stdout.write(`  ▸ ${label} ... `);
  try {
    await fn();
    console.log('✅ PASS');
    passed++;
  } catch (err) {
    const msg = err?.message ?? String(err);
    const short = msg.split('\n').slice(0, 3).join(' | ').slice(0, 300);
    console.log(`❌ FAIL\n      ${short}`);
    errors.push({ label, error: msg, stack: err?.stack ?? '' });
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

const p = (name) => path.join(TMP, name);

// ffmpegExec: shows real stderr on failure
function ffmpegExec(args) {
  try {
    execSync(`ffmpeg -y ${args}`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });
  } catch (e) {
    const stderr = e.stderr?.toString?.() ?? '';
    const detail = stderr.split('\n').filter(Boolean).slice(-6).join('\n');
    throw new Error(`ffmpeg exited ${e.status ?? 'null'}: ${detail || e.message}`);
  }
}

// ─── SETUP ─────────────────────────────────────────────────────────────────
section('SETUP — generating test media via ffmpeg lavfi');

await run('generate input.mp4 (10s 640x360)', () => {
  ffmpegExec(
    '-f lavfi -i testsrc=duration=10:size=640x360:rate=30 ' +
    '-f lavfi -i sine=frequency=440:duration=10 ' +
    '-c:v libx264 -preset ultrafast -c:a aac ' +
    p('input.mp4')
  );
});

await run('generate short.mp4 (3s 320x180)', () => {
  ffmpegExec(
    '-f lavfi -i testsrc=duration=3:size=320x180:rate=15 ' +
    '-f lavfi -i sine=frequency=440:duration=3 ' +
    '-c:v libx264 -preset ultrafast -c:a aac ' +
    p('short.mp4')
  );
});

await run('generate audio.mp3', () => {
  ffmpegExec(
    '-f lavfi -i sine=frequency=440:duration=10 ' +
    '-c:a libmp3lame -b:a 128k ' +
    p('audio.mp3')
  );
});

await run('generate audio_raw.wav', () => {
  ffmpegExec(
    '-f lavfi -i sine=frequency=440:duration=10 -c:a pcm_s16le ' +
    p('audio_raw.wav')
  );
});

await run('generate logo.png', () => {
  ffmpegExec(
    '-f lavfi -i color=red:size=100x50:rate=1 -frames:v 1 ' +
    p('logo.png')
  );
});

await run('generate animation.gif', () => {
  ffmpegExec(
    '-f lavfi -i testsrc=duration=2:size=160x90:rate=10 ' +
    p('animation.gif')
  );
});

await run('generate part1/2/3.mp4', () => {
  for (const n of ['part1', 'part2', 'part3']) {
    ffmpegExec(
      '-f lavfi -i testsrc=duration=2:size=320x180:rate=15 ' +
      '-f lavfi -i sine=frequency=440:duration=2 ' +
      '-c:v libx264 -preset ultrafast -c:a aac ' +
      p(`${n}.mp4`)
    );
  }
});

await run('generate subs.srt', () => {
  fs.writeFileSync(
    p('subs.srt'),
    '1\n00:00:00,500 --> 00:00:02,000\nHello world\n\n2\n00:00:03,000 --> 00:00:05,000\nTest subtitle\n'
  );
});

await run('generate with_subs.mkv', () => {
  ffmpegExec(
    `-f lavfi -i testsrc=duration=5:size=320x180:rate=15 ` +
    `-f lavfi -i sine=frequency=440:duration=5 ` +
    `-i ${p('subs.srt')} ` +
    `-c:v libx264 -preset ultrafast -c:a aac -c:s srt ` +
    p('with_subs.mkv')
  );
});

// ─── IMPORTS ───────────────────────────────────────────────────────────────
section('IMPORT — loading all exports');

let ffmpeg, FFmpegBuilder;
let screenshots, frameToBuffer;
let pipeThrough, streamOutput, streamToFile;
let mergeToFile, concatFiles;
let toGif, gifToMp4;
let normalizeAudio, adjustVolume;
let addWatermark, addTextWatermark;
let burnSubtitles, extractSubtitles;
let writeMetadata, stripMetadata;
let generateWaveform, generateSpectrum;
let getPreset, applyPreset, listPresets;
let hlsPackage, adaptiveHls, dashPackage;
let twoPassEncode, buildTwoPassArgs;
let mapStream, mapAVS, copyStream, setMetadata, ss;
// hw serializers
let nvencToArgs, vaapiToArgs, qsvToArgs, mediacodecVideoToArgs, vulkanVideoToArgs;
// video codec serializers
let x264ToArgs, x265ToArgs, svtav1ToArgs, vp9ToArgs;
let proResToArgs, dnxhdToArgs, mjpegToArgs, mpeg2ToArgs;
let mpeg4ToArgs, vp8ToArgs, theoraToArgs, ffv1ToArgs;
// audio codec serializers
let aacToArgs, mp3ToArgs, opusToArgs, flacToArgs, ac3ToArgs;
let alacToArgs, eac3ToArgs, truehdToArgs, vorbisToArgs, wavpackToArgs;
let pcmToArgs, mp2ToArgs;
// filter system
let scale, crop, overlay, drawtext, fade;
let volume, loudnorm, equalizer, atempo;
let FilterGraph, videoFilterChain, filterGraph;
// ffprobe
let probe, probeAsync, ProbeError;
let getVideoStreams, getAudioStreams;
let getDefaultVideoStream, getDefaultAudioStream;
let getMediaDuration, durationToMicroseconds;
let summarizeVideoStream, summarizeAudioStream;
let parseFrameRate, parseDuration, parseBitrate;
let isHdr, isInterlaced, getChapterList;
let findStreamByLanguage, formatDuration;
// process
let renice, autoKillOnExit, killAllFFmpeg;
// guards
let guardCodec, guardFeatureVersion, selectBestCodec;

await run('import mediaforge (all exports)', async () => {
  const mod = await import('mediaforge');
  ffmpeg = mod.ffmpeg;
  FFmpegBuilder = mod.FFmpegBuilder;
  screenshots = mod.screenshots;
  frameToBuffer = mod.frameToBuffer;
  pipeThrough = mod.pipeThrough;
  streamOutput = mod.streamOutput;
  streamToFile = mod.streamToFile;
  mergeToFile = mod.mergeToFile;
  concatFiles = mod.concatFiles;
  toGif = mod.toGif;
  gifToMp4 = mod.gifToMp4;
  normalizeAudio = mod.normalizeAudio;
  adjustVolume = mod.adjustVolume;
  addWatermark = mod.addWatermark;
  addTextWatermark = mod.addTextWatermark;
  burnSubtitles = mod.burnSubtitles;
  extractSubtitles = mod.extractSubtitles;
  writeMetadata = mod.writeMetadata;
  stripMetadata = mod.stripMetadata;
  generateWaveform = mod.generateWaveform;
  generateSpectrum = mod.generateSpectrum;
  getPreset = mod.getPreset;
  applyPreset = mod.applyPreset;
  listPresets = mod.listPresets;
  hlsPackage = mod.hlsPackage;
  adaptiveHls = mod.adaptiveHls;
  dashPackage = mod.dashPackage;
  twoPassEncode = mod.twoPassEncode;
  buildTwoPassArgs = mod.buildTwoPassArgs;
  mapStream = mod.mapStream;
  mapAVS = mod.mapAVS;
  copyStream = mod.copyStream;
  setMetadata = mod.setMetadata;
  ss = mod.ss;
  nvencToArgs = mod.nvencToArgs;
  vaapiToArgs = mod.vaapiToArgs;
  qsvToArgs = mod.qsvToArgs;
  mediacodecVideoToArgs = mod.mediacodecVideoToArgs;
  vulkanVideoToArgs = mod.vulkanVideoToArgs;
  x264ToArgs = mod.x264ToArgs;
  x265ToArgs = mod.x265ToArgs;
  svtav1ToArgs = mod.svtav1ToArgs;
  vp9ToArgs = mod.vp9ToArgs;
  proResToArgs = mod.proResToArgs;
  dnxhdToArgs = mod.dnxhdToArgs;
  mjpegToArgs = mod.mjpegToArgs;
  mpeg2ToArgs = mod.mpeg2ToArgs;
  mpeg4ToArgs = mod.mpeg4ToArgs;
  vp8ToArgs = mod.vp8ToArgs;
  theoraToArgs = mod.theoraToArgs;
  ffv1ToArgs = mod.ffv1ToArgs;
  aacToArgs = mod.aacToArgs;
  mp3ToArgs = mod.mp3ToArgs;
  opusToArgs = mod.opusToArgs;
  flacToArgs = mod.flacToArgs;
  ac3ToArgs = mod.ac3ToArgs;
  alacToArgs = mod.alacToArgs;
  eac3ToArgs = mod.eac3ToArgs;
  truehdToArgs = mod.truehdToArgs;
  vorbisToArgs = mod.vorbisToArgs;
  wavpackToArgs = mod.wavpackToArgs;
  pcmToArgs = mod.pcmToArgs;
  mp2ToArgs = mod.mp2ToArgs;
  scale = mod.scale;
  crop = mod.crop;
  overlay = mod.overlay;
  drawtext = mod.drawtext;
  fade = mod.fade;
  volume = mod.volume;
  loudnorm = mod.loudnorm;
  equalizer = mod.equalizer;
  atempo = mod.atempo;
  FilterGraph = mod.FilterGraph;
  videoFilterChain = mod.videoFilterChain;
  filterGraph = mod.filterGraph;
  probe = mod.probe;
  probeAsync = mod.probeAsync;
  ProbeError = mod.ProbeError;
  getVideoStreams = mod.getVideoStreams;
  getAudioStreams = mod.getAudioStreams;
  getDefaultVideoStream = mod.getDefaultVideoStream;
  getDefaultAudioStream = mod.getDefaultAudioStream;
  getMediaDuration = mod.getMediaDuration;
  durationToMicroseconds = mod.durationToMicroseconds;
  summarizeVideoStream = mod.summarizeVideoStream;
  summarizeAudioStream = mod.summarizeAudioStream;
  parseFrameRate = mod.parseFrameRate;
  parseDuration = mod.parseDuration;
  parseBitrate = mod.parseBitrate;
  isHdr = mod.isHdr;
  isInterlaced = mod.isInterlaced;
  getChapterList = mod.getChapterList;
  findStreamByLanguage = mod.findStreamByLanguage;
  formatDuration = mod.formatDuration;
  renice = mod.renice;
  autoKillOnExit = mod.autoKillOnExit;
  killAllFFmpeg = mod.killAllFFmpeg;
  guardCodec = mod.guardCodec;
  guardFeatureVersion = mod.guardFeatureVersion;
  selectBestCodec = mod.selectBestCodec;
});

// ─── 1. FLUENT BUILDER ─────────────────────────────────────────────────────
section('1 — FLUENT BUILDER: core methods');

await run('.videoCodec .videoBitrate .audioCodec .audioBitrate .run()', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_basic.mp4'))
    .videoCodec('libx264').videoBitrate('500k')
    .audioCodec('aac').audioBitrate('64k')
    .run();
  if (!fs.existsSync(p('out_basic.mp4'))) throw new Error('output not created');
});

await run('.crf .fps .size .pixelFormat', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_crf.mp4'))
    .videoCodec('libx264').crf(28).fps(15).size('320x180').pixelFormat('yuv420p')
    .run();
  if (!fs.existsSync(p('out_crf.mp4'))) throw new Error('output not created');
});

await run('.noVideo()', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_novideo.mp3'))
    .noVideo().audioCodec('libmp3lame').audioBitrate('128k')
    .run();
  if (!fs.existsSync(p('out_novideo.mp3'))) throw new Error('output not created');
});

await run('.noAudio()', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_noaudio.mp4'))
    .noAudio().videoCodec('libx264')
    .run();
  if (!fs.existsSync(p('out_noaudio.mp4'))) throw new Error('output not created');
});

await run('.audioSampleRate .audioChannels', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_audio_opts.mp4'))
    .videoCodec('copy').audioCodec('aac').audioSampleRate(44100).audioChannels(1)
    .run();
  if (!fs.existsSync(p('out_audio_opts.mp4'))) throw new Error('output not created');
});

await run('.outputFormat matroska', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_format.mkv'))
    .outputFormat('matroska').videoCodec('copy').audioCodec('copy')
    .run();
  if (!fs.existsSync(p('out_format.mkv'))) throw new Error('output not created');
});

await run('.seekInput .inputDuration', async () => {
  await ffmpeg(p('input.mp4'))
    .seekInput('00:00:02').inputDuration('3')
    .output(p('out_seekin.mp4'))
    .videoCodec('libx264').audioCodec('aac')
    .run();
  if (!fs.existsSync(p('out_seekin.mp4'))) throw new Error('output not created');
});

await run('.seekOutput .duration', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_seekout.mp4'))
    .seekOutput('00:00:01').duration('3')
    .videoCodec('libx264').audioCodec('aac')
    .run();
  if (!fs.existsSync(p('out_seekout.mp4'))) throw new Error('output not created');
});

await run('.inputFormat', async () => {
  await ffmpeg(p('input.mp4'))
    .inputFormat('mp4')
    .output(p('out_infmt.mp4'))
    .videoCodec('copy').audioCodec('copy')
    .run();
  if (!fs.existsSync(p('out_infmt.mp4'))) throw new Error('output not created');
});

await run('.addOutputOption .addGlobalOption', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_opts.mp4'))
    .videoCodec('libx264').addOutputOption('-preset', 'ultrafast')
    .addGlobalOption('-loglevel', 'error')
    .run();
  if (!fs.existsSync(p('out_opts.mp4'))) throw new Error('output not created');
});

await run('.overwrite(true) .logLevel', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_overwrite.mp4'))
    .videoCodec('copy').audioCodec('copy').overwrite(true).logLevel('error')
    .run();
  if (!fs.existsSync(p('out_overwrite.mp4'))) throw new Error('output not created');
});

await run('.map stream spec', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_map.mp4'))
    .map('0:v:0').map('0:a:0')
    .videoCodec('copy').audioCodec('copy')
    .run();
  if (!fs.existsSync(p('out_map.mp4'))) throw new Error('output not created');
});

await run('.videoFilter string', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_vfilter.mp4'))
    .videoFilter('scale=320:180').videoCodec('libx264').audioCodec('copy')
    .run();
  if (!fs.existsSync(p('out_vfilter.mp4'))) throw new Error('output not created');
});

await run('.audioFilter string', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_afilter.mp4'))
    .audioFilter('volume=0.5').videoCodec('copy').audioCodec('aac')
    .run();
  if (!fs.existsSync(p('out_afilter.mp4'))) throw new Error('output not created');
});

await run('.complexFilter with .map', async () => {
  await ffmpeg(p('input.mp4'))
    .complexFilter('[0:v]scale=320:180[v];[0:a]volume=0.5[a]')
    .output(p('out_complex.mp4'))
    .map('[v]').map('[a]')
    .videoCodec('libx264').audioCodec('aac')
    .run();
  if (!fs.existsSync(p('out_complex.mp4'))) throw new Error('output not created');
});

await run('.input() chained (two inputs)', async () => {
  await ffmpeg(p('input.mp4'))
    .input(p('audio.mp3'))
    .output(p('out_twoinputs.mp4'))
    .map('0:v:0').map('1:a:0')
    .videoCodec('copy').audioCodec('copy')
    .run();
  if (!fs.existsSync(p('out_twoinputs.mp4'))) throw new Error('output not created');
});

await run('multiple outputs in one pass', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('out_multi1.mp4')).size('320x180').videoCodec('libx264').audioCodec('aac')
    .output(p('out_multi2.mp4')).size('160x90').videoCodec('libx264').audioCodec('aac')
    .run();
  if (!fs.existsSync(p('out_multi1.mp4'))) throw new Error('out_multi1 not created');
  if (!fs.existsSync(p('out_multi2.mp4'))) throw new Error('out_multi2 not created');
});

await run('.spawn() with emitter', async () => {
  const proc = ffmpeg(p('input.mp4'))
    .output(p('out_spawn.mp4'))
    .videoCodec('copy').audioCodec('copy')
    .spawn();
  if (!proc?.emitter) throw new Error('spawn() missing emitter');
  await new Promise((res, rej) => {
    proc.emitter.on('end', res);
    proc.emitter.on('error', rej);
  });
  if (!fs.existsSync(p('out_spawn.mp4'))) throw new Error('output not created');
});

await run('.enableProgress() + .spawn({ parseProgress: true })', async () => {
  const progressEvents = [];
  const proc = ffmpeg(p('input.mp4'))
    .output(p('out_progress.mp4'))
    .videoCodec('libx264').audioCodec('aac')
    .enableProgress()
    .spawn({ parseProgress: true });
  proc.emitter.on('progress', (info) => progressEvents.push(info));
  proc.emitter.on('start', (args) => {
    if (!Array.isArray(args)) throw new Error('start event args not array');
  });
  await new Promise((res, rej) => {
    proc.emitter.on('end', res);
    proc.emitter.on('error', rej);
  });
  if (!fs.existsSync(p('out_progress.mp4'))) throw new Error('output not created');
});

await run('.spawn() emitter: stderr event', async () => {
  const lines = [];
  const proc = ffmpeg(p('input.mp4'))
    .output(p('out_stderrev.mp4'))
    .videoCodec('copy').audioCodec('copy').logLevel('verbose')
    .spawn();
  proc.emitter.on('stderr', (line) => lines.push(line));
  await new Promise((res, rej) => {
    proc.emitter.on('end', res);
    proc.emitter.on('error', rej);
  });
});

await run('.run() returns Promise<void>', async () => {
  const result = ffmpeg(p('input.mp4'))
    .output(p('out_runvoid.mp4'))
    .videoCodec('copy').audioCodec('copy')
    .run();
  if (!(result instanceof Promise)) throw new Error('not a Promise');
  await result;
});

// ─── 2. SCREENSHOTS & FRAME EXTRACTION ────────────────────────────────────
section('2 — SCREENSHOTS & FRAME EXTRACTION');

await run('screenshots({ count: 3 })', async () => {
  const folder = path.join(TMP, 'thumbs1');
  fs.mkdirSync(folder, { recursive: true });
  const { files } = await screenshots({ input: p('input.mp4'), folder, count: 3 });
  if (!Array.isArray(files) || files.length === 0) throw new Error('no files returned');
});

await run('screenshots({ timestamps, size, filename })', async () => {
  const folder = path.join(TMP, 'thumbs2');
  fs.mkdirSync(folder, { recursive: true });
  const { files } = await screenshots({
    input: p('input.mp4'),
    folder,
    timestamps: [1, 3, 5],
    filename: 'thumb_%04d.jpg',
    size: '320x180',
  });
  if (!Array.isArray(files) || files.length === 0) throw new Error('no files returned');
});

await run('frameToBuffer({ format: png, size })', async () => {
  const buf = await frameToBuffer({ input: p('input.mp4'), timestamp: 2, format: 'png', size: '320x180' });
  if (!Buffer.isBuffer(buf) || buf.length === 0) throw new Error('empty buffer');
  fs.writeFileSync(p('frame.png'), buf);
});

await run('frameToBuffer({ format: mjpeg })', async () => {
  const buf = await frameToBuffer({ input: p('input.mp4'), timestamp: 1, format: 'mjpeg' });
  if (!Buffer.isBuffer(buf) || buf.length === 0) throw new Error('empty buffer');
});

// ─── 3. PIPE & STREAM I/O ──────────────────────────────────────────────────
section('3 — PIPE & STREAM I/O');

await run('pipeThrough: readable -> ffmpeg -> writable', async () => {
  const proc = pipeThrough({
    inputFormat: 'mp4',
    outputArgs: ['-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac'],
    outputFormat: 'mp4',
  });
  fs.createReadStream(p('input.mp4')).pipe(proc.stdin);
  const out = fs.createWriteStream(p('out_pipe.mp4'));
  proc.stdout.pipe(out);
  await new Promise((res, rej) => {
    proc.emitter.on('end', res);
    proc.emitter.on('error', rej);
  });
  if (!fs.existsSync(p('out_pipe.mp4'))) throw new Error('output not created');
});

await run('streamOutput: returns readable stream', async () => {
  const stream = streamOutput({
    input: p('input.mp4'),
    outputFormat: 'mp4',
    outputArgs: ['-c', 'copy', '-movflags', 'frag_keyframe+empty_moov'],
  });
  const chunks = [];
  await new Promise((res, rej) => {
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', res);
    stream.on('error', rej);
  });
  if (chunks.length === 0) throw new Error('no data received');
});

await run('streamToFile: stream -> file', async () => {
  const readable = fs.createReadStream(p('input.mp4'));
  await streamToFile({
    stream: readable,
    inputFormat: 'mp4',
    output: p('out_streamtofile.mp4'),
    outputArgs: ['-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac'],
  });
  if (!fs.existsSync(p('out_streamtofile.mp4'))) throw new Error('output not created');
});

// ─── 4. CONCAT & MERGE ─────────────────────────────────────────────────────
section('4 — CONCAT & MERGE');

await run('mergeToFile (stream copy)', async () => {
  await mergeToFile({ inputs: [p('part1.mp4'), p('part2.mp4'), p('part3.mp4')], output: p('merged_copy.mp4') });
  if (!fs.existsSync(p('merged_copy.mp4'))) throw new Error('output not created');
});

await run('mergeToFile (reencode)', async () => {
  await mergeToFile({
    inputs: [p('part1.mp4'), p('part2.mp4')],
    output: p('merged_reencode.mp4'),
    reencode: true,
    videoCodec: 'libx264',
    audioCodec: 'aac',
  });
  if (!fs.existsSync(p('merged_reencode.mp4'))) throw new Error('output not created');
});

await run('concatFiles (event-based)', async () => {
  const proc = concatFiles({ inputs: [p('part1.mp4'), p('part2.mp4'), p('part3.mp4')], output: p('concat_out.mp4') });
  const progressEvents = [];
  proc.emitter.on('progress', (e) => progressEvents.push(e));
  await new Promise((res, rej) => {
    proc.emitter.on('end', res);
    proc.emitter.on('error', rej);
  });
  if (!fs.existsSync(p('concat_out.mp4'))) throw new Error('output not created');
});

// ─── 5. ANIMATED GIF ───────────────────────────────────────────────────────
section('5 — ANIMATED GIF');

await run('toGif (2-pass palette)', async () => {
  await toGif({ input: p('short.mp4'), output: p('out.gif'), width: 160, fps: 10, colors: 128, dither: 'bayer', startTime: 0, duration: 3 });
  if (!fs.existsSync(p('out.gif'))) throw new Error('output not created');
});

await run('gifToMp4', async () => {
  await gifToMp4({ input: p('animation.gif'), output: p('gif_to_mp4.mp4') });
  if (!fs.existsSync(p('gif_to_mp4.mp4'))) throw new Error('output not created');
});

// ─── 6. AUDIO NORMALIZATION ────────────────────────────────────────────────
section('6 — AUDIO NORMALIZATION');

await run('normalizeAudio (EBU R128 two-pass)', async () => {
  const result = await normalizeAudio({ input: p('input.mp4'), output: p('normalized.mp4'), targetI: -23, targetLra: 7, targetTp: -2 });
  if (result == null) throw new Error('result was null');
  console.log(`      inputI: ${result.inputI}`);
  if (!fs.existsSync(p('normalized.mp4'))) throw new Error('output not created');
});

await run('normalizeAudio podcast (-16 LUFS)', async () => {
  await normalizeAudio({ input: p('audio.mp3'), output: p('audio_norm.mp3'), targetI: -16 });
  if (!fs.existsSync(p('audio_norm.mp3'))) throw new Error('output not created');
});

await run('adjustVolume (0.5)', async () => {
  await adjustVolume({ input: p('input.mp4'), output: p('vol_half.mp4'), volume: '0.5' });
  if (!fs.existsSync(p('vol_half.mp4'))) throw new Error('output not created');
});

await run('adjustVolume (6dB)', async () => {
  await adjustVolume({ input: p('input.mp4'), output: p('vol_6db.mp4'), volume: '6dB' });
  if (!fs.existsSync(p('vol_6db.mp4'))) throw new Error('output not created');
});

// ─── 7. WATERMARKS ─────────────────────────────────────────────────────────
section('7 — WATERMARKS');

const positions = ['top-left', 'top-right', 'top-center', 'bottom-left', 'bottom-right', 'bottom-center', 'center'];
for (const pos of positions) {
  await run(`addWatermark position=${pos}`, async () => {
    await addWatermark({
      input: p('input.mp4'),
      watermark: p('logo.png'),
      output: p(`wm_${pos.replace(/-/g, '_')}.mp4`),
      position: pos,
      margin: 8,
      opacity: 0.8,
    });
    if (!fs.existsSync(p(`wm_${pos.replace(/-/g, '_')}.mp4`))) throw new Error('output not created');
  });
}

await run('addWatermark scaleWidth', async () => {
  await addWatermark({ input: p('input.mp4'), watermark: p('logo.png'), output: p('wm_scaled.mp4'), position: 'bottom-right', scaleWidth: 50 });
  if (!fs.existsSync(p('wm_scaled.mp4'))) throw new Error('output not created');
});

await run('addTextWatermark', async () => {
  await addTextWatermark({ input: p('input.mp4'), output: p('wm_text.mp4'), text: '© Test 2026', position: 'bottom-right', fontSize: 20, fontColor: 'white@0.8' });
  if (!fs.existsSync(p('wm_text.mp4'))) throw new Error('output not created');
});

// ─── 8. SUBTITLES ──────────────────────────────────────────────────────────
section('8 — SUBTITLES');

await run('burnSubtitles', async () => {
  await burnSubtitles({ input: p('short.mp4'), subtitleFile: p('subs.srt'), output: p('burned_subs.mp4'), fontSize: 18, fontName: 'Monospace' });
  if (!fs.existsSync(p('burned_subs.mp4'))) throw new Error('output not created');
});

await run('extractSubtitles', async () => {
  await extractSubtitles({ input: p('with_subs.mkv'), output: p('extracted.srt'), streamIndex: 0 });
  if (!fs.existsSync(p('extracted.srt'))) throw new Error('output not created');
});

// ─── 9. METADATA ───────────────────────────────────────────────────────────
section('9 — METADATA');

await run('writeMetadata (container + streams + chapters)', async () => {
  await writeMetadata({
    input: p('input.mp4'),
    output: p('tagged.mp4'),
    metadata: { title: 'Battle Test', artist: 'mediaforge', year: '2026', comment: 'test' },
    streamMetadata: { 'a:0': { language: 'eng', title: 'English Audio' } },
    chapters: [
      { title: 'Introduction', startSec: 0, endSec: 5 },
      { title: 'Main', startSec: 5, endSec: 10 },
    ],
  });
  if (!fs.existsSync(p('tagged.mp4'))) throw new Error('output not created');
});

await run('stripMetadata', async () => {
  await stripMetadata({ input: p('tagged.mp4'), output: p('stripped.mp4') });
  if (!fs.existsSync(p('stripped.mp4'))) throw new Error('output not created');
});

// ─── 10. WAVEFORM & SPECTRUM ───────────────────────────────────────────────
section('10 — WAVEFORM & SPECTRUM');

await run('generateWaveform (mode=line)', async () => {
  await generateWaveform({ input: p('audio.mp3'), output: p('waveform_line.png'), width: 800, height: 120, color: '#00aaff', backgroundColor: '#1a1a2e', mode: 'line', scale: 'lin' });
  if (!fs.existsSync(p('waveform_line.png'))) throw new Error('output not created');
});

await run('generateWaveform (mode=point — draw is now no-op per CHANGELOG)', async () => {
  await generateWaveform({ input: p('audio.mp3'), output: p('waveform_point.png'), width: 400, height: 80, color: '#ff0000', mode: 'point', scale: 'log' });
  if (!fs.existsSync(p('waveform_point.png'))) throw new Error('output not created');
});

await run('generateWaveform (mode=p2p — draw is now no-op per CHANGELOG)', async () => {
  await generateWaveform({ input: p('audio.mp3'), output: p('waveform_p2p.png'), width: 400, height: 80, color: '#00ff00', mode: 'p2p' });
  if (!fs.existsSync(p('waveform_p2p.png'))) throw new Error('output not created');
});

await run('generateSpectrum', async () => {
  await generateSpectrum({ input: p('audio.mp3'), output: p('spectrum.mp4'), width: 640, height: 360, color: 'fire', fps: 10 });
  if (!fs.existsSync(p('spectrum.mp4'))) throw new Error('output not created');
});

// ─── 11. CODEC SERIALIZERS — VIDEO (12 helpers) ────────────────────────────
section('11 — CODEC SERIALIZERS: video (12 helpers)');

await run('x264ToArgs args shape', () => {
  const args = x264ToArgs({ crf: 22, preset: 'fast' });
  if (!Array.isArray(args) || !args.includes('libx264')) throw new Error(`bad: ${args}`);
  console.log(`      ${args.join(' ')}`);
});

await run('x264ToArgs — encode', async () => {
  await ffmpeg(p('short.mp4')).output(p('enc_x264.mp4')).addOutputOption(...x264ToArgs({ crf: 28, preset: 'ultrafast' })).run();
  if (!fs.existsSync(p('enc_x264.mp4'))) throw new Error('output not created');
});

await run('x265ToArgs args shape', () => {
  const args = x265ToArgs({ crf: 28, preset: 'ultrafast' });
  if (!Array.isArray(args) || !args.includes('libx265')) throw new Error(`bad: ${args}`);
});

await run('svtav1ToArgs args shape', () => {
  const args = svtav1ToArgs({ crf: 35 });
  if (!Array.isArray(args)) throw new Error('not array');
  console.log(`      ${args.join(' ')}`);
});

await run('vp9ToArgs args shape', () => {
  const args = vp9ToArgs({ bitrate: 1000, cpuUsed: 4 });
  if (!Array.isArray(args)) throw new Error('not array');
  const joined = args.join(' ');
  if (!joined.includes('vp9') && !joined.includes('vpx')) throw new Error('missing vp9/vpx encoder');
});

await run('proResToArgs args shape', () => {
  const args = proResToArgs({ profile: 3 });
  if (!Array.isArray(args)) throw new Error('not array');
  console.log(`      ${args.join(' ')}`);
});

await run('dnxhdToArgs args shape', () => {
  const args = dnxhdToArgs({ bitrate: 145 });
  if (!Array.isArray(args) || !args.join(' ').includes('dnxhd')) throw new Error(`bad: ${args}`);
});

await run('mjpegToArgs args shape', () => {
  const args = mjpegToArgs({ qscale: 3 });
  if (!Array.isArray(args) || !args.includes('mjpeg')) throw new Error(`bad: ${args}`);
});

await run('mjpegToArgs — encode', async () => {
  await ffmpeg(p('short.mp4')).output(p('enc_mjpeg.avi')).noAudio().addOutputOption(...mjpegToArgs({ qscale: 5 })).run();
  if (!fs.existsSync(p('enc_mjpeg.avi'))) throw new Error('output not created');
});

await run('mpeg2ToArgs args shape', () => {
  const args = mpeg2ToArgs({ bitrate: 4000 });
  if (!Array.isArray(args) || !args.join(' ').includes('mpeg2')) throw new Error(`bad: ${args}`);
});

await run('mpeg4ToArgs args shape', () => {
  const args = mpeg4ToArgs();
  if (!Array.isArray(args) || !args.join(' ').includes('mpeg4')) throw new Error(`bad: ${args}`);
});

await run('vp8ToArgs args shape', () => {
  const args = vp8ToArgs({ bitrate: 800 });
  if (!Array.isArray(args) || !args.join(' ').includes('libvpx')) throw new Error(`bad: ${args}`);
});

await run('theoraToArgs args shape', () => {
  const args = theoraToArgs({ quality: 5 });
  if (!Array.isArray(args) || !args.join(' ').includes('libtheora')) throw new Error(`bad: ${args}`);
});

await run('ffv1ToArgs args shape', () => {
  const args = ffv1ToArgs({ version: 3, slices: 16, sliceCrc: true });
  if (!Array.isArray(args) || !args.includes('ffv1')) throw new Error(`bad: ${args}`);
});

await run('ffv1ToArgs — lossless encode', async () => {
  await ffmpeg(p('short.mp4')).output(p('enc_ffv1.mkv')).noAudio().addOutputOption(...ffv1ToArgs({ version: 3 })).run();
  if (!fs.existsSync(p('enc_ffv1.mkv'))) throw new Error('output not created');
});

// ─── 12. CODEC SERIALIZERS — AUDIO (12 helpers) ────────────────────────────
section('12 — CODEC SERIALIZERS: audio (12 helpers)');

await run('aacToArgs args shape', () => {
  const args = aacToArgs({ bitrate: 128 });
  if (!Array.isArray(args) || !args.join(' ').includes('aac')) throw new Error(`bad: ${args}`);
});

await run('aacToArgs — encode', async () => {
  await ffmpeg(p('input.mp4')).output(p('enc_aac.m4a')).noVideo().addOutputOption(...aacToArgs({ bitrate: 128 })).run();
  if (!fs.existsSync(p('enc_aac.m4a'))) throw new Error('output not created');
});

await run('mp3ToArgs args shape', () => {
  const args = mp3ToArgs({ bitrate: 192 });
  if (!Array.isArray(args) || !args.join(' ').includes('mp3lame')) throw new Error(`bad: ${args}`);
});

await run('mp3ToArgs — encode', async () => {
  await ffmpeg(p('input.mp4')).output(p('enc_mp3.mp3')).noVideo().addOutputOption(...mp3ToArgs({ bitrate: 128 })).run();
  if (!fs.existsSync(p('enc_mp3.mp3'))) throw new Error('output not created');
});

await run('opusToArgs args shape', () => {
  const args = opusToArgs({ bitrate: 96 });
  if (!Array.isArray(args) || !args.join(' ').includes('opus')) throw new Error(`bad: ${args}`);
});

await run('flacToArgs args shape', () => {
  const args = flacToArgs();
  if (!Array.isArray(args) || !args.includes('flac')) throw new Error(`bad: ${args}`);
});

await run('flacToArgs — encode', async () => {
  await ffmpeg(p('audio_raw.wav')).output(p('enc_flac.flac')).addOutputOption(...flacToArgs()).run();
  if (!fs.existsSync(p('enc_flac.flac'))) throw new Error('output not created');
});

await run('ac3ToArgs args shape', () => {
  const args = ac3ToArgs({ bitrate: 320 });
  if (!Array.isArray(args) || !args.includes('ac3')) throw new Error(`bad: ${args}`);
});

await run('alacToArgs args shape', () => {
  const args = alacToArgs();
  if (!Array.isArray(args) || !args.includes('alac')) throw new Error(`bad: ${args}`);
});

await run('eac3ToArgs args shape', () => {
  const args = eac3ToArgs({ bitrate: 640 });
  if (!Array.isArray(args) || !args.includes('eac3')) throw new Error(`bad: ${args}`);
});

await run('truehdToArgs args shape', () => {
  const args = truehdToArgs();
  if (!Array.isArray(args) || !args.join(' ').includes('truehd')) throw new Error(`bad: ${args}`);
});

await run('vorbisToArgs args shape', () => {
  const args = vorbisToArgs({ quality: 5 });
  if (!Array.isArray(args) || !args.join(' ').includes('vorbis')) throw new Error(`bad: ${args}`);
});

await run('wavpackToArgs args shape', () => {
  const args = wavpackToArgs();
  if (!Array.isArray(args) || !args.includes('wavpack')) throw new Error(`bad: ${args}`);
});

await run('pcmToArgs(pcm_s16le) args shape', () => {
  const args = pcmToArgs('pcm_s16le', { sampleRate: 48000 });
  if (!Array.isArray(args) || !args.includes('pcm_s16le')) throw new Error(`bad: ${args}`);
  console.log(`      ${args.join(' ')}`);
});

await run('pcmToArgs(pcm_s24le) — encode', async () => {
  await ffmpeg(p('audio_raw.wav')).output(p('enc_pcm24.wav')).addOutputOption(...pcmToArgs('pcm_s24le')).run();
  if (!fs.existsSync(p('enc_pcm24.wav'))) throw new Error('output not created');
});

await run('mp2ToArgs args shape', () => {
  const args = mp2ToArgs({ bitrate: 192 });
  if (!Array.isArray(args) || !args.includes('mp2')) throw new Error(`bad: ${args}`);
});

// ─── 13. CODEC SERIALIZERS — HARDWARE (5 helpers) ──────────────────────────
section('13 — CODEC SERIALIZERS: hardware (5 helpers)');

await run('nvencToArgs args shape', () => {
  const args = nvencToArgs({ preset: 'p4', cq: 23 }, 'h264_nvenc');
  if (!Array.isArray(args)) throw new Error('not array');
  console.log(`      ${args.join(' ')}`);
});

await run('vaapiToArgs args shape', () => {
  const args = vaapiToArgs({}, 'h264_vaapi');
  if (!Array.isArray(args)) throw new Error('not array');
  console.log(`      ${args.join(' ')}`);
});

await run('qsvToArgs args shape', () => {
  const args = qsvToArgs({}, 'h264_qsv');
  if (!Array.isArray(args)) throw new Error('not array');
  console.log(`      ${args.join(' ')}`);
});

await run('mediacodecVideoToArgs args shape', () => {
  const args = mediacodecVideoToArgs({ bitrate: 4000 }, 'h264_mediacodec');
  if (!Array.isArray(args)) throw new Error('not array');
  console.log(`      ${args.join(' ')}`);
});

await run('vulkanVideoToArgs args shape', () => {
  const args = vulkanVideoToArgs({ crf: 22 }, 'h264_vulkan');
  if (!Array.isArray(args)) throw new Error('not array');
  console.log(`      ${args.join(' ')}`);
});

// ─── 14. NAMED PRESETS ─────────────────────────────────────────────────────
section('14 — NAMED PRESETS');

await run('listPresets() returns non-empty array', () => {
  const list = listPresets();
  if (!Array.isArray(list) || list.length === 0) throw new Error('empty');
  console.log(`      presets: ${list.join(', ')}`);
});

const presetNames = ['web', 'web-hq', 'mobile', 'archive', 'podcast', 'hls-input', 'gif', 'discord', 'instagram', 'prores', 'dnxhd'];
for (const name of presetNames) {
  await run(`getPreset('${name}') shape`, () => {
    const pr = getPreset(name);
    if (!pr || !Array.isArray(pr.videoArgs) || !Array.isArray(pr.audioArgs)) throw new Error(`bad shape: ${JSON.stringify(pr)}`);
  });
  await run(`applyPreset('${name}') flat array`, () => {
    if (!Array.isArray(applyPreset(name))) throw new Error('not array');
  });
}

await run('applyPreset(web) — encode', async () => {
  await ffmpeg(p('input.mp4')).output(p('preset_web.mp4')).addOutputOption(...applyPreset('web')).run();
  if (!fs.existsSync(p('preset_web.mp4'))) throw new Error('output not created');
});

// ─── 15. HLS & DASH ────────────────────────────────────────────────────────
section('15 — HLS & DASH PACKAGING');

await run('hlsPackage (hlsVersion silently ignored per CHANGELOG)', async () => {
  const outDir = path.join(TMP, 'hls_single');
  fs.mkdirSync(outDir, { recursive: true });
  await hlsPackage({ input: p('short.mp4'), outputDir: outDir, segmentDuration: 2, hlsVersion: 3, videoCodec: 'libx264', videoBitrate: '500k', audioBitrate: '64k' }).run();
  if (!fs.readdirSync(outDir).some((f) => f.endsWith('.m3u8'))) throw new Error('no .m3u8');
});

await run('adaptiveHls multi-bitrate', async () => {
  const outDir = path.join(TMP, 'hls_adaptive');
  fs.mkdirSync(outDir, { recursive: true });
  await adaptiveHls({
    input: p('short.mp4'),
    outputDir: outDir,
    variants: [
      { label: '360p', resolution: '640x360', videoBitrate: '500k', audioBitrate: '64k' },
      { label: '180p', resolution: '320x180', videoBitrate: '200k', audioBitrate: '48k' },
    ],
  }).run();
  if (!fs.readdirSync(outDir).some((f) => f.endsWith('.m3u8'))) throw new Error('no .m3u8');
});

await run('dashPackage', async () => {
  const outDir = path.join(TMP, 'dash_out');
  fs.mkdirSync(outDir, { recursive: true });
  await dashPackage({ input: p('short.mp4'), output: path.join(outDir, 'manifest.mpd'), segmentDuration: 2, videoCodec: 'libx264', videoBitrate: '500k' }).run();
  if (!fs.existsSync(path.join(outDir, 'manifest.mpd'))) throw new Error('manifest.mpd not created');
});

// ─── 16. TWO-PASS ENCODING ─────────────────────────────────────────────────
section('16 — TWO-PASS ENCODING');

await run('twoPassEncode (CHANGELOG: pass1 uses temp MKV, not /dev/null)', async () => {
  let pass1Done = false;
  await twoPassEncode({
    input: p('short.mp4'),
    output: p('twopass.mp4'),
    videoCodec: 'libx264',
    videoBitrate: '500k',
    audioCodec: 'aac',
    audioBitrate: '64k',
    onPass1Complete: () => { pass1Done = true; },
  });
  if (!pass1Done) throw new Error('onPass1Complete not called');
  if (!fs.existsSync(p('twopass.mp4'))) throw new Error('output not created');
});

await run('buildTwoPassArgs returns { pass1, pass2 }', () => {
  const { pass1, pass2 } = buildTwoPassArgs({ input: p('short.mp4'), output: p('tp_inspect.mp4'), videoCodec: 'libx264', videoBitrate: '500k' });
  if (!Array.isArray(pass1) || !Array.isArray(pass2)) throw new Error('expected arrays');
  if (!(pass1.join(' ') + pass2.join(' ')).includes('pass')) throw new Error('no pass flag');
});

// ─── 17. STREAM MAPPING DSL ────────────────────────────────────────────────
section('17 — STREAM MAPPING DSL');

await run('mapStream(fileIdx, type, streamIdx) — 3-arg overload (CHANGELOG)', () => {
  const result = mapStream(0, 'v', 0);
  if (typeof result !== 'string') throw new Error(`expected string, got ${typeof result}`);
  console.log(`      mapStream(0,'v',0): ${result}`);
});

await run('mapStream single-arg (original form)', () => {
  const result = mapStream('0:v:0');
  if (!result) throw new Error('falsy');
});

await run('mapAVS(0)', () => {
  if (!mapAVS(0)) throw new Error('falsy');
});

await run('copyStream', () => {
  if (!copyStream('v')) throw new Error('falsy');
});

await run('setMetadata', () => {
  if (!setMetadata('title', 'test')) throw new Error('falsy');
});

await run('ss(0, a, eng)', () => {
  const result = ss(0, 'a', 'eng');
  if (!result) throw new Error('falsy');
  console.log(`      ss: ${JSON.stringify(result)}`);
});

// ─── 18. FILTER SYSTEM ─────────────────────────────────────────────────────
section('18 — FILTER SYSTEM (standalone form per CHANGELOG 0.2.0)');

await run('scale({w,h}) returns string', () => {
  const f = scale({ w: 320, h: 180 });
  if (typeof f !== 'string' || !f.includes('scale')) throw new Error(`bad: ${f}`);
  console.log(`      scale: ${f}`);
});

await run('scale({width,height}) — alias', () => {
  const f = scale({ width: 320, height: 180 });
  if (typeof f !== 'string') throw new Error('not string');
});

await run('crop({w,h,x,y}) returns string', () => {
  const f = crop({ w: 320, h: 180, x: 0, y: 0 });
  if (f == null) throw new Error('null');
  console.log(`      crop: ${f}`);
});

await run('overlay({x,y}) returns string', () => {
  const f = overlay({ x: 10, y: 10 });
  if (f == null) throw new Error('null');
});

await run('drawtext({text,...}) returns string', () => {
  const f = drawtext({ text: 'hello', x: 10, y: 10, fontsize: 24 });
  if (f == null) throw new Error('null');
});

await run('fade({type,...}) returns string', () => {
  const f = fade({ type: 'in', start_time: 0, duration: 1 });
  if (f == null) throw new Error('null');
});

await run('volume({volume}) returns string', () => {
  const f = volume({ volume: '0.5' });
  if (f == null) throw new Error('null');
  console.log(`      volume: ${f}`);
});

await run('loudnorm({i,lra,tp}) returns string', () => {
  const f = loudnorm({ i: -16, lra: 11, tp: -1.5 });
  if (f == null) throw new Error('null');
  console.log(`      loudnorm: ${f}`);
});

await run('equalizer({frequency,...})', () => {
  if (equalizer({ frequency: 1000, width_type: 'o', width: 1, gain: 3 }) == null) throw new Error('null');
});

await run('atempo({tempo})', () => {
  const f = atempo({ tempo: 1.5 });
  if (f == null) throw new Error('null');
  console.log(`      atempo: ${f}`);
});

await run('filterGraph() factory', () => {
  if (filterGraph() == null) throw new Error('null');
});

await run('videoFilterChain', () => {
  if (videoFilterChain == null) throw new Error('not exported');
  if (videoFilterChain('scale=640:360') == null) throw new Error('null');
});

await run('FilterGraph class', () => {
  if (FilterGraph == null) throw new Error('not exported');
  if (new FilterGraph() == null) throw new Error('null');
});

await run('.videoFilter(scale({w,h})) — standalone filter to builder', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('filter_scale.mp4'))
    .videoFilter(scale({ w: 320, h: 180 }))
    .videoCodec('libx264').audioCodec('copy')
    .run();
  if (!fs.existsSync(p('filter_scale.mp4'))) throw new Error('output not created');
});

await run('.audioFilter(loudnorm({...})) — standalone filter to builder', async () => {
  await ffmpeg(p('input.mp4'))
    .output(p('filter_loudnorm.mp4'))
    .audioFilter(loudnorm({ i: -16, lra: 11, tp: -1.5 }))
    .videoCodec('copy').audioCodec('aac')
    .run();
  if (!fs.existsSync(p('filter_loudnorm.mp4'))) throw new Error('output not created');
});

// ─── 19. FFPROBE INTEGRATION ───────────────────────────────────────────────
section('19 — FFPROBE INTEGRATION');

await run('probe() synchronous', () => {
  const info = probe(p('input.mp4'));
  if (!info?.streams || !info.format) throw new Error('bad shape');
  console.log(`      duration: ${info.format.duration}`);
});

await run('probeAsync()', async () => {
  const info = await probeAsync(p('input.mp4'));
  if (!info?.streams) throw new Error('no streams');
});

await run('ProbeError exported', () => {
  if (!ProbeError) throw new Error('missing');
});

await run('getVideoStreams', () => {
  const streams = getVideoStreams(probe(p('input.mp4')));
  if (!Array.isArray(streams) || streams.length === 0) throw new Error('no video streams');
});

await run('getAudioStreams', () => {
  const streams = getAudioStreams(probe(p('input.mp4')));
  if (!Array.isArray(streams) || streams.length === 0) throw new Error('no audio streams');
});

await run('getDefaultVideoStream', () => {
  const stream = getDefaultVideoStream(probe(p('input.mp4')));
  if (stream?.codec_type !== 'video') throw new Error(`wrong: ${stream?.codec_type}`);
});

await run('getDefaultAudioStream', () => {
  const stream = getDefaultAudioStream(probe(p('input.mp4')));
  if (stream?.codec_type !== 'audio') throw new Error(`wrong: ${stream?.codec_type}`);
});

await run('getMediaDuration returns number > 0', () => {
  const dur = getMediaDuration(probe(p('input.mp4')));
  if (typeof dur !== 'number' || dur <= 0) throw new Error(`bad: ${dur}`);
  console.log(`      duration: ${dur}s`);
});

await run('durationToMicroseconds', () => {
  const dur = getMediaDuration(probe(p('input.mp4')));
  const us = durationToMicroseconds(dur);
  if (typeof us !== 'number' || us <= 0) throw new Error(`bad: ${us}`);
});

await run('summarizeVideoStream', () => {
  const s = summarizeVideoStream(getDefaultVideoStream(probe(p('input.mp4'))));
  if (!s || typeof s !== 'object') throw new Error('bad shape');
  console.log(`      ${JSON.stringify(s)}`);
});

await run('summarizeAudioStream', () => {
  const s = summarizeAudioStream(getDefaultAudioStream(probe(p('input.mp4'))));
  if (!s || typeof s !== 'object') throw new Error('bad shape');
  console.log(`      ${JSON.stringify(s)}`);
});

await run('parseFrameRate — CHANGELOG: returns number | null (NOT object)', () => {
  const stream = getDefaultVideoStream(probe(p('input.mp4')));
  const fps = parseFrameRate(stream.r_frame_rate ?? stream.avg_frame_rate ?? '30/1');
  if (fps === null) { console.log('      null (ok)'); return; }
  if (typeof fps !== 'number') throw new Error(`expected number, got ${typeof fps} (${JSON.stringify(fps)}) — parseFrameRate no longer returns {num,den,value}`);
  if (fps <= 0) throw new Error(`fps must be > 0, got ${fps}`);
  console.log(`      fps: ${fps}`);
});

await run('parseDuration', () => {
  const d = parseDuration('00:01:30');
  if (typeof d !== 'number') throw new Error(`expected number, got ${typeof d}`);
  console.log(`      parseDuration('00:01:30'): ${d}`);
});

await run('parseBitrate 2M and 128k', () => {
  if (typeof parseBitrate('2M') !== 'number') throw new Error('2M not number');
  if (typeof parseBitrate('128k') !== 'number') throw new Error('128k not number');
  console.log(`      2M=${parseBitrate('2M')}, 128k=${parseBitrate('128k')}`);
});

await run('isHdr returns boolean', () => {
  const r = isHdr(probe(p('input.mp4')));
  if (typeof r !== 'boolean') throw new Error(`expected boolean, got ${typeof r}`);
  console.log(`      isHdr: ${r}`);
});

await run('isInterlaced returns boolean', () => {
  const r = isInterlaced(probe(p('input.mp4')));
  if (typeof r !== 'boolean') throw new Error(`expected boolean, got ${typeof r}`);
  console.log(`      isInterlaced: ${r}`);
});

await run('getChapterList returns array', () => {
  const chapters = getChapterList(probe(p('tagged.mp4')));
  if (!Array.isArray(chapters)) throw new Error('expected array');
  console.log(`      chapters: ${chapters.length}`);
});

await run('findStreamByLanguage', () => {
  const stream = findStreamByLanguage(probe(p('input.mp4')), 'eng', 'audio');
  console.log(`      eng audio: ${stream ? stream.codec_name : 'not found (ok)'}`);
});

await run('formatDuration(90.5) returns string', () => {
  const s = formatDuration(90.5);
  if (typeof s !== 'string') throw new Error(`expected string, got ${typeof s}`);
  console.log(`      formatDuration(90.5): ${s}`);
});

// ─── 20. PROCESS MANAGEMENT ────────────────────────────────────────────────
section('20 — PROCESS MANAGEMENT');

await run('renice — non-fatal on any platform failure', async () => {
  const proc = ffmpeg(p('input.mp4'))
    .output(p('out_renice.mp4'))
    .videoCodec('copy').audioCodec('copy')
    .spawn();
  try {
    renice(proc.child, 10);
    console.log('      renice: ok');
  } catch (e) {
    // wmic / permission failures are expected on Windows CI — log, don't fail
    console.log(`      renice not supported here: ${e.message.split('\n')[0].slice(0, 80)}`);
  }
  await new Promise((res, rej) => {
    proc.emitter.on('end', res);
    proc.emitter.on('error', rej);
  });
});

await run('autoKillOnExit returns unregister fn', async () => {
  const proc = ffmpeg(p('input.mp4'))
    .output(p('out_autokill.mp4'))
    .videoCodec('copy').audioCodec('copy')
    .spawn();
  const unregister = autoKillOnExit(proc.child);
  if (typeof unregister !== 'function') throw new Error('expected function');
  await new Promise((res, rej) => {
    proc.emitter.on('end', res);
    proc.emitter.on('error', rej);
  });
  unregister();
});

await run('killAllFFmpeg is a function', () => {
  if (typeof killAllFFmpeg !== 'function') throw new Error('not a function');
});

// ─── 21. COMPATIBILITY GUARDS ──────────────────────────────────────────────
section('21 — COMPATIBILITY GUARDS');

await run('checkCodec(libx264) — CHANGELOG: fixed, no longer always false', async () => {
  const builder = new FFmpegBuilder(p('input.mp4'));
  const result = await builder.checkCodec('libx264', 'encode');
  if (typeof result !== 'object' || !('available' in result)) throw new Error(`bad shape: ${JSON.stringify(result)}`);
  console.log(`      libx264 available: ${result.available}`);
});

await run('checkCodec(nonexistent_xyz) returns available=false', async () => {
  const result = await new FFmpegBuilder(p('input.mp4')).checkCodec('nonexistent_codec_xyz', 'encode');
  if (result.available !== false) throw new Error('expected false');
});

await run('selectVideoCodec returns string — CHANGELOG: fixed', async () => {
  const builder = new FFmpegBuilder(p('input.mp4'));
  const codec = await builder.selectVideoCodec([
    { codec: 'h264_nvenc', featureKey: 'nvenc' },
    { codec: 'h264_vaapi' },
    { codec: 'libx264' },
  ]);
  if (typeof codec !== 'string') throw new Error(`expected string, got ${typeof codec}: ${JSON.stringify(codec)}`);
  console.log(`      selected: ${codec}`);
});

await run('selectHwaccel returns string or null', () => {
  const best = new FFmpegBuilder(p('input.mp4')).selectHwaccel(['cuda', 'vaapi', 'videotoolbox', 'none']);
  if (best !== null && typeof best !== 'string') throw new Error(`unexpected: ${best}`);
  console.log(`      best hwaccel: ${best ?? 'none'}`);
});

await run('guardCodec exported function', () => {
  if (typeof guardCodec !== 'function') throw new Error('not a function');
});

await run('guardFeatureVersion exported function', () => {
  if (typeof guardFeatureVersion !== 'function') throw new Error('not a function');
});

await run('selectBestCodec exported', () => {
  if (selectBestCodec == null) throw new Error('not exported');
});

// ─── 22. CJS REQUIRE ───────────────────────────────────────────────────────
section('22 — CJS REQUIRE (via createRequire)');

await run('require("mediaforge") exports ffmpeg', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  try {
    const cjs = require('mediaforge');
    if (typeof cjs.ffmpeg !== 'function') throw new Error('ffmpeg not a function');
  } catch (e) {
    if (e.code === 'ERR_REQUIRE_ESM') {
      console.log('      ESM-only build — ok');
      return;
    }
    throw e;
  }
});

// ─── 23. FFmpegBuilder direct instantiation ────────────────────────────────
section('23 — FFmpegBuilder class direct instantiation');

await run('new FFmpegBuilder(input).run()', async () => {
  const builder = new FFmpegBuilder(p('input.mp4'));
  builder.output(p('out_builder_direct.mp4'));
  builder.videoCodec('libx264').audioCodec('aac');
  await builder.run();
  if (!fs.existsSync(p('out_builder_direct.mp4'))) throw new Error('output not created');
});

await run('new FFmpegBuilder() + .input().run()', async () => {
  const builder = new FFmpegBuilder();
  builder.input(p('input.mp4'));
  builder.output(p('out_builder_noinput.mp4'));
  builder.videoCodec('copy').audioCodec('copy');
  await builder.run();
  if (!fs.existsSync(p('out_builder_noinput.mp4'))) throw new Error('output not created');
});

// ─── FINAL SUMMARY ─────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log('  BATTLE TEST SUMMARY');
console.log('═'.repeat(60));
console.log(`  ✅ PASSED : ${passed}`);
console.log(`  ⏭  SKIPPED: ${skipped}`);
console.log(`  ❌ FAILED : ${errors.length}`);

if (errors.length > 0) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log('  FAILED TESTS — FULL ERROR LOG');
  console.log('─'.repeat(60));
  for (let i = 0; i < errors.length; i++) {
    console.log(`\n  [${i + 1}] ${errors[i].label}`);
    console.log(`       ERROR : ${errors[i].error.split('\n').slice(0, 4).join(' | ')}`);
    if (errors[i].stack) {
      const stackLines = errors[i].stack.split('\n').slice(1, 4).join('\n       ');
      if (stackLines.trim()) console.log(`       STACK : ${stackLines}`);
    }
  }
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${errors.length} test(s) failed.`);
  console.log('─'.repeat(60));
  process.exit(1);
} else {
  console.log('\n  All tests passed! 🎉');
}
