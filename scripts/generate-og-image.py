#!/usr/bin/env python3
"""生成 OG 分享图 1200x630"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
img = Image.new('RGB', (W, H), '#1a1a2e')
draw = ImageDraw.Draw(img)

# 背景渐变
for y in range(H):
    r = int(26 + (15 - 26) * y / H)
    g = int(26 + (52 - 26) * y / H)
    b = int(46 + (96 - 46) * y / H)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# 装饰光晕
for r in range(300, 0, -10):
    alpha_color = (15, 52, 96)
    draw.ellipse([200-r, 100-r, 200+r, 100+r], fill=alpha_color)

# 右侧钢琴键
kx, ky = 780, 160
kw, kh = 36, 280
bw, bh = 22, 175
white_keys = 10
for i in range(white_keys):
    x = kx + i * (kw + 2)
    draw.rectangle([x, ky, x + kw, ky + kh], fill='#f0f0f0', outline='#ccc')

black_positions = [0, 1, 3, 4, 5, 7, 8]
for pos in black_positions:
    x = kx + pos * (kw + 2) + kw - bw // 2
    draw.rectangle([x, ky, x + bw, ky + bh], fill='#1a1a1a')

# 字体
try:
    font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 56)
    font_sub = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 38)
    font_desc = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 26)
    font_url = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
except:
    font_title = ImageFont.load_default()
    font_sub = font_title
    font_desc = font_title
    font_url = font_title

# 标题
draw.text((80, 200), "Piano Online", fill='#ffffff', font=font_title)
draw.text((80, 270), "在线钢琴模拟器", fill='#e0e0e0', font=font_sub)
draw.text((80, 325), "88键全键盘 · 真实音色 · 免费练习", fill='#a0a0c0', font=font_desc)

# 分隔线
draw.rectangle([80, 370, 280, 373], fill='#e8b86d')

# 域名
draw.text((80, 530), "pianoonline.cc", fill='#e8b86d', font=font_url)

img.save('/Users/rise/www/piano-online/images/og-image.jpg', 'JPEG', quality=95)
print("og-image.jpg generated successfully")
