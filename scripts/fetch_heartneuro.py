import urllib.request
import ssl
import re
import os

url = "https://heartneuro.love"
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    url,
    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
)

try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as response:
        html = response.read().decode("utf-8", errors="ignore")
        print("Successfully connected to https://heartneuro.love!")
        print("Status:", response.status)
        print("HTML length:", len(html))
        
        titles = re.findall(r"<title>(.*?)</title>", html, re.IGNORECASE)
        print("Page Title:", titles)
        
        # Extract meta description
        meta_desc = re.findall(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
        print("Meta Description:", meta_desc)

        # Extract og:image
        og_images = re.findall(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
        print("OG Images:", og_images)

        # Extract all image sources
        imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE)
        print("Found Images:", len(imgs))
        for img in imgs[:15]:
            print("  Image:", img)

        os.makedirs("public/assets/heartneuro", exist_ok=True)
        with open("public/assets/heartneuro/heartneuro_scraped.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("Saved HTML to public/assets/heartneuro/heartneuro_scraped.html")

except Exception as e:
    print("Fetch error:", e)
