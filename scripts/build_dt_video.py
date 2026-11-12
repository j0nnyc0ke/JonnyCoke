import os, sys, subprocess, math

out_dir = "public/videos"
os.makedirs(out_dir, exist_ok=True)
video_path = os.path.join(out_dir, "dtcover1-ar.mp4")
thumb_path = os.path.join(out_dir, "dtcover1-ar-thumb.png")

width = 540
height = 960
fps = 24
duration = 16  # 16 seconds loop
total_frames = fps * duration

# Pre-generate key background & magazine plates using ffmpeg/imagemagick
# We can use ffmpeg filter_complex to build the entire high-fidelity animated scene!

filter_script = f"""
color=c=#0b101d:s={width}x{height}:d={duration}:r={fps}[bg];

# Desk / Workspace ambience lines
[bg]drawbox=x=0:y=0:w={width}:h={height}:c=#070b14@1:t=fill[base];

# iPad Bezel frame
[base]drawbox=x=20:y=20:w={width-40}:h={height-40}:c=#1e293b:t=8[bezel1];
[bezel1]drawbox=x=28:y=28:w={width-56}:h={height-56}:c=#0f172a:t=fill[screen_bg];

# Camera UI Header
[screen_bg]drawbox=x=28:y=28:w={width-56}:h=46:c=#000000@0.8:t=fill[top_bar];
[top_bar]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='BLIPPAR AR CAMERA // CODE: 1040490':fontcolor=#38bdf8:fontsize=12:x=44:y=46[cam_header];
[cam_header]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='LIVE TRACKING':fontcolor=#4ade80:fontsize=11:x={width-130}:y=46[header2];

# The Magazine Cover in perspective on the table
[header2]drawbox=x=70:y=120:w=400:h=560:c=#030712:t=fill[mag_bg];
[mag_bg]drawbox=x=70:y=120:w=400:h=560:c=#334155:t=2[mag_border];

# Magazine Masthead: DIETETICS TODAY
[mag_border]drawbox=x=84:y=134:w=372:h=60:c=#ffffff:t=fill[mast_bg];
[mast_bg]drawbox=x=380:y=134:w=76:h=60:c=#eab308:t=fill[mast_yellow];
[mast_yellow]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='DIETETICS':fontcolor=#0284c7:fontsize=36:x=96:y=176[mast_text1];
[mast_text1]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='TODAY':fontcolor=#0f172a:fontsize=15:x=388:y=170[mast_text2];

# BDA Tagline
[mast_text2]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='BRITISH DIETETIC ASSOCIATION':fontcolor=#38bdf8:fontsize=9:x=96:y=210[bda_tag];

# Lead Story Box
[bda_tag]drawbox=x=250:y=230:w=196:h=66:c=#0284c7@0.25:t=fill[lead_box];
[lead_box]drawbox=x=250:y=230:w=196:h=66:c=#0284c7:t=1[lead_border];
[lead_border]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='BDA LAUNCHES':fontcolor=#38bdf8:fontsize=10:x=260:y=248[lead_t1];
[lead_t1]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='ONE BLUE DOT':fontcolor=#ffffff:fontsize=16:x=260:y=268[lead_t2];
[lead_t2]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='Sustainable Diets Project':fontcolor=#94a3b8:fontsize=8:x=260:y=284[lead_t3];

# Central Printed Earth Art
[lead_t3]drawbox=x=120:y=280:w=170:h=170:c=#0369a1@0.4:t=fill[earth_art];
[earth_art]drawbox=x=135:y=295:w=140:h=140:c=#0284c7:t=fill[earth_art2];
[earth_art2]drawbox=x=150:y=310:w=110:h=110:c=#22c55e@0.8:t=fill[earth_art3];

# Article teasers at bottom of magazine
[earth_art3]drawbox=x=84:y=520:w=372:h=140:c=#0f172a@0.9:t=fill[teas_bg];
[teas_bg]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='CLINICAL FREELANCE':fontcolor=#38bdf8:fontsize=11:x=96:y=546[art1_t];
[art1_t]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='Managing NHS trusts and client caseloads':fontcolor=#94a3b8:fontsize=9:x=96:y=562[art1_d];
[art1_d]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='BLENDED LEARNING':fontcolor=#fbbf24:fontsize=11:x=96:y=590[art2_t];
[art2_t]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='Continuous professional development matrix':fontcolor=#94a3b8:fontsize=9:x=96:y=606[art2_d];
[art2_d]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='BDA MEMBER BENEFIT // CENTURY ONE':fontcolor=#64748b:fontsize=8:x=96:y=636[art3_t];

# AR Spatial Hologram Overlay (Activates after 2 seconds)
[art3_t]drawbox=x=50:y=100:w=440:h=600:c=#38bdf8@'if(gte(t,2), 0.15*abs(sin(2*PI*(t-2))), 0)':t=2[ar_grid];

# Floating Hologram 3D Globe Ring
[ar_grid]drawbox=x='270-80':y='360-80':w=160:h=160:c=#38bdf8@'if(gte(t,2), 0.8, 0)':t=2[ar_ring];
[ar_ring]drawbox=x='270-95':y='360-95':w=190:h=190:c=#0284c7@'if(gte(t,2), 0.4*abs(cos(3*t)), 0)':t=1[ar_ring2];

# AR Floating Interactive Buttons Panel (on left of magazine in 3D space)
[ar_ring2]drawbox=x=84:y=240:w=120:h=32:c=#1d4ed8@'if(gte(t,2.5), 0.9, 0)':t=fill[btn_yt];
[btn_yt]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='[>] AR VIDEO':fontcolor=#ffffff@'if(gte(t,2.5), 1, 0)':fontsize=11:x=96:y=260[btn_yt_t];

[btn_yt_t]drawbox=x=84:y=280:w=120:h=32:c=#0284c7@'if(gte(t,2.8), 0.9, 0)':t=fill[btn_web];
[btn_web_t]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='[*] WEBSITE':fontcolor=#ffffff@'if(gte(t,2.8), 1, 0)':fontsize=11:x=96:y=300[btn_web_t];

[btn_web_t]drawbox=x=84:y=320:w=120:h=28:c=#0f172a@'if(gte(t,3.1), 0.9, 0)':t=fill[btn_tw];
[btn_tw]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='[@] Twitter':fontcolor=#94a3b8@'if(gte(t,3.1), 1, 0)':fontsize=10:x=96:y=338[btn_tw_t];

[btn_tw_t]drawbox=x=84:y=354:w=120:h=28:c=#0f172a@'if(gte(t,3.4), 0.9, 0)':t=fill[btn_fb];
[btn_fb]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='[f] Facebook':fontcolor=#94a3b8@'if(gte(t,3.4), 1, 0)':fontsize=10:x=96:y=372[btn_fb_t];

# AR Watermark banner (matches video "This Free Blipp is built with BlippBuilder")
[btn_fb_t]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='This Free Blipp is built with BlippBuilder':fontcolor=#94a3b8:fontsize=9:x=40:y=690:box=1:boxcolor=#000000@0.7:boxborderw=4[blipp_wm];

# Finger Tap Action 1: Tap Video at t=4s to t=5s
[blipp_wm]drawbox=x=120:y=255:w=26:h=26:c=#f43f5e@'if(between(t,4.2,4.8), 0.9, 0)':t=fill[touch1];

# Video Popout Window (t=5s to t=10s)
[touch1]drawbox=x=45:y=180:w=450:h=380:c=#0f172a@'if(between(t,5.0,10.0), 0.98, 0)':t=fill[yt_win];
[yt_win]drawbox=x=45:y=180:w=450:h=380:c=#38bdf8@'if(between(t,5.0,10.0), 1, 0)':t=2[yt_border];
[yt_border]drawbox=x=45:y=180:w=450:h=36:c=#1e293b@'if(between(t,5.0,10.0), 1, 0)':t=fill[yt_head];
[yt_head]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='YOUTUBE // ONE BLUE DOT SUSTAINABLE DIETS':fontcolor=#ffffff@'if(between(t,5.0,10.0), 1, 0)':fontsize=11:x=58:y=202[yt_title];
[yt_title]drawbox=x=440:y=186:w=46:h=24:c=#ef4444@'if(between(t,5.0,10.0), 1, 0)':t=fill[yt_done_btn];
[yt_done_btn]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='DONE':fontcolor=#ffffff@'if(between(t,5.0,10.0), 1, 0)':fontsize=9:x=448:y=202[yt_done_t];

# YouTube Video playback simulation inside popup
[yt_done_t]drawbox=x=65:y=230:w=410:h=220:c=#0284c7@'if(between(t,5.0,10.0), 0.9, 0)':t=fill[yt_vid_bg];
[yt_vid_bg]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='BDA: ONE BLUE DOT':fontcolor=#ffffff@'if(between(t,5.0,10.0), 1, 0)':fontsize=22:x=130:y=330[yt_vtext];
[yt_vtext]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='Environmentally Sustainable Diets Project':fontcolor=#bae6fd@'if(between(t,5.0,10.0), 1, 0)':fontsize=12:x=130:y=355[yt_vsub];
# YouTube playback progress bar
[yt_vsub]drawbox=x=65:y=446:w=410:h=4:c=#334155@'if(between(t,5.0,10.0), 1, 0)':t=fill[yt_pbg];
[yt_pbg]drawbox=x=65:y=446:w='if(between(t,5.0,10.0), 80*(t-5), 0)':h=4:c=#ef4444@'if(between(t,5.0,10.0), 1, 0)':t=fill[yt_prog];
[yt_prog]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='British Dietetic Association • 3:35 mins':fontcolor=#94a3b8@'if(between(t,5.0,10.0), 1, 0)':fontsize=10:x=68:y=480[yt_vchan];

# Finger tap Done at t=9.5s
[yt_vchan]drawbox=x=455:y=195:w=20:h=20:c=#f43f5e@'if(between(t,9.4,9.9), 0.9, 0)':t=fill[touch2];

# Finger tap Website button at t=10.8s
[touch2]drawbox=x=120:y=295:w=26:h=26:c=#f43f5e@'if(between(t,10.7,11.3), 0.9, 0)':t=fill[touch3];

# Website Popout Window (t=11.5s to t=15.5s)
[touch3]drawbox=x=45:y=180:w=450:h=420:c=#ffffff@'if(between(t,11.5,15.5), 1, 0)':t=fill[web_win];
[web_win]drawbox=x=45:y=180:w=450:h=40:c=#0284c7@'if(between(t,11.5,15.5), 1, 0)':t=fill[web_head];
[web_head]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='BDA.UK.COM // OFFICIAL PORTAL':fontcolor=#ffffff@'if(between(t,11.5,15.5), 1, 0)':fontsize=11:x=58:y=204[web_title];
[web_title]drawbox=x=440:y=188:w=46:h=24:c=#0f172a@'if(between(t,11.5,15.5), 1, 0)':t=fill[web_done_btn];
[web_done_btn]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='DONE':fontcolor=#ffffff@'if(between(t,11.5,15.5), 1, 0)':fontsize=9:x=448:y=204[web_done_t];

[web_done_t]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='How can we help?':fontcolor=#0f172a@'if(between(t,11.5,15.5), 1, 0)':fontsize=18:x=68:y=255[web_h1];
[web_h1]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='Find a registered dietitian near you':fontcolor=#475569@'if(between(t,11.5,15.5), 1, 0)':fontsize=11:x=68:y=278[web_p1];
[web_p1]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='What does a dietitian do?':fontcolor=#0f172a@'if(between(t,11.5,15.5), 1, 0)':fontsize=16:x=68:y=330[web_h2];
[web_h2]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='Dietitians use public health and scientific research...':fontcolor=#475569@'if(between(t,11.5,15.5), 1, 0)':fontsize=11:x=68:y=354[web_p2];

# Footer Telemetry Status
[web_p2]drawbox=x=28:y={height-68}:w={width-56}:h=40:c=#000000@0.9:t=fill[foot_bar];
[foot_bar]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSansBold.ttf:text='JONNY COKE AR PRINT ENGINE':fontcolor=#dfb15b:fontsize=10:x=44:y={height-44}[foot_t1];
[foot_t1]drawtext=fontfile=/usr/share/fonts/truetype/freefont/FreeSans.ttf:text='FIRST UK SECTOR AR COVER':fontcolor=#94a3b8:fontsize=9:x={width-180}:y={height-44}[foot_t2]
"""

# Remove comments and newlines for ffmpeg filter string
cleaned_filter = ";".join([line.split("#")[0].strip() for line in filter_script.strip().split("\n") if line.split("#")[0].strip()])

cmd = [
    "ffmpeg", "-y",
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=24000",
    "-filter_complex", cleaned_filter,
    "-map", "[foot_t2]",
    "-map", "0:a",
    "-t", str(duration),
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "64k",
    "-movflags", "+faststart",
    video_path
]

print("Rendering dtcover1-ar.mp4 via FFmpeg filtergraph...")
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode != 0:
    print("FFmpeg error:", res.stderr)
    sys.exit(1)

print("Video generated successfully!")

# Generate poster thumbnail
cmd_thumb = [
    "ffmpeg", "-y",
    "-ss", "00:00:03.5",
    "-i", video_path,
    "-vframes", "1",
    thumb_path
]
subprocess.run(cmd_thumb, check=True)
print("Thumbnail generated successfully at", thumb_path)
