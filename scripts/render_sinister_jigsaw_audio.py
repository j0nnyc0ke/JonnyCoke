import subprocess
import glob
import os

print("Processing terrifying, fast-paced Jigsaw horror voice audio files...")

raw_files = sorted(glob.glob("public/audio/jigsaw/raw/line_*.wav"))

for raw_file in raw_files:
    filename = os.path.basename(raw_file)
    idx = filename.replace("line_", "").replace(".wav", "")
    out_mp3 = f"public/audio/jigsaw/line_{idx}.mp3"
    out_wav = f"public/audio/jigsaw/line_{idx}.wav"

    # Audio DSP Chain (A lot scarier + a bit faster):
    # 1. Main voice: deep pitch shift down 26% (asetrate=24000*0.74), accelerated to 1.12x tempo for sharp, calculated, aggressive delivery
    # 2. Demon sub-harmonic (Freddy / Megatron underworld): pitched down 46% (asetrate=24000*0.54) with 1600Hz lowpass for subterranean chest dread
    # 3. Microcassette ghost resonator: pitched down 36% (asetrate=24000*0.64) with bandpass 600-3600Hz for chilling acoustic presence
    # 4. amix 3 layers with aggressive dynamic compression (acompressor) and 75Hz sub-bass thump + 3200Hz consonant bite
    # 5. Saw bathroom slapback echo
    filter_complex = (
        "[0:a]asetrate=24000*0.74,aresample=44100,atempo=1.12[main];"
        "[0:a]asetrate=24000*0.54,aresample=44100,atempo=1.12,lowpass=f=1600,volume=0.45[demon];"
        "[0:a]asetrate=24000*0.64,aresample=44100,atempo=1.12,highpass=f=600,lowpass=f=3600,volume=0.28[whisper];"
        "[main][demon][whisper]amix=inputs=3:duration=first[mixed];"
        "[mixed]equalizer=f=75:width_type=h:width=40:g=11,"
        "equalizer=f=160:width_type=h:width=50:g=7,"
        "equalizer=f=3200:width_type=h:width=750:g=7,"
        "acompressor=threshold=0.15:ratio=5:attack=4:release=45:makeup=2.2,"
        "aecho=0.82:0.72:40|88:0.34|0.18,"
        "volume=2.2[out]"
    )

    # Render MP3 (192k)
    cmd_mp3 = [
        "ffmpeg", "-y", "-i", raw_file,
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "192k",
        out_mp3
    ]
    res_mp3 = subprocess.run(cmd_mp3, capture_output=True, text=True)

    # Render WAV (16-bit PCM 44.1kHz)
    cmd_wav = [
        "ffmpeg", "-y", "-i", raw_file,
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-c:a", "pcm_s16le",
        out_wav
    ]
    res_wav = subprocess.run(cmd_wav, capture_output=True, text=True)

    if res_mp3.returncode == 0 and res_wav.returncode == 0:
        print(f"Processed line {idx}: {out_mp3} and {out_wav} (Success)")
    else:
        print(f"Error processing line {idx}:", res_mp3.stderr or res_wav.stderr)

print("Scarier, faster Jigsaw horror voice rendering complete!")
