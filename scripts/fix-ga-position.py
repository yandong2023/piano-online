#!/usr/bin/env python3
"""修复 GA 代码位置：从 </head> 后移到 <head> 内"""

import os
import re

# 需要修复的文件列表
files = [
    "/Users/rise/www/piano-online/practice.html",
    "/Users/rise/www/piano-online/tutorials.html",
]

# 文章页也检查
articles_dir = "/Users/rise/www/piano-online/articles/tutorials"
for f in os.listdir(articles_dir):
    if f.endswith('.html'):
        files.append(os.path.join(articles_dir, f))

ga_block = """<!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-EYGD99YB4Y"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-EYGD99YB4Y');
    </script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4423187689700927"
    crossorigin="anonymous"></script>
    <meta name="google-site-verification" content="Fii3zK2l54f0uFP7RPwdn7BEqB4OjC2jc_07JxSs1uI" />"""

# 匹配 </head> 之后、<body> 之前的 GA 代码块（允许各种空白和缩进）
ga_pattern = re.compile(
    r'</head>\s*'
    r'(?:<!--\s*Google tag\s*-->)?\s*'
    r'<script\s+async\s+src="https://www\.googletagmanager\.com/gtag/js\?id=G-EYGD99YB4Y"></script>\s*'
    r'<script>\s*'
    r'window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\];\s*'
    r'function\s+gtag\(\)\{dataLayer\.push\(arguments\);\}\s*'
    r"gtag\('js',\s*new Date\(\)\);\s*"
    r"gtag\('config',\s*'G-EYGD99YB4Y'\);\s*"
    r'</script>\s*'
    r'<script\s+async\s+src="https://pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js\?client=ca-pub-4423187689700927"\s*'
    r'crossorigin="anonymous"></script>\s*'
    r'<meta\s+name="google-site-verification"\s+content="Fii3zK2l54f0uFP7RPwdn7BEqB4OjC2jc_07JxSs1uI"\s*/?>\s*'
    r'<body>',
    re.DOTALL
)

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否已有 GA 在 head 内
    head_end = content.find('</head>')
    head_section = content[:head_end] if head_end > 0 else ""
    body_start = content.find('<body>')
    
    # 检查 </head> 和 <body> 之间是否有 GA 代码
    if head_end > 0 and body_start > head_end:
        between = content[head_end:body_start]
        if 'googletagmanager' in between:
            # 移除 </head> 到 <body> 之间的 GA 代码
            new_content = ga_pattern.sub('</head>\n<body>', content)
            if new_content == content:
                print(f"SKIP {os.path.basename(filepath)} - pattern not matched, manual check needed")
                continue
            
            # 在 </head> 前插入 GA 代码
            new_content = new_content.replace('</head>', ga_block + '\n</head>')
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"FIXED {os.path.basename(filepath)}")
        else:
            print(f"OK {os.path.basename(filepath)} - GA not between head and body")
    else:
        print(f"SKIP {os.path.basename(filepath)} - structure issue")

print("\nDone!")
