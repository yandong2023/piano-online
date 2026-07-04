#!/usr/bin/env python3
"""给12篇教程文章批量添加 Article + BreadcrumbList JSON-LD 结构化数据"""

import os
import re

articles = {
    "piano-basics.html": {
        "title": "钢琴基础知识：认识键盘与正确坐姿",
        "desc": "详细介绍钢琴键盘布局、正确的弹琴坐姿、手型放置等基础知识。适合钢琴初学者的入门教程。",
        "date": "2025-03-22",
        "section": "基础入门",
    },
    "reading-notes.html": {
        "title": "五线谱入门：如何读懂音符",
        "desc": "零基础五线谱入门教程，详细讲解音符、节拍、调号等基本概念，帮助初学者快速掌握五线谱阅读技巧。",
        "date": "2025-03-22",
        "section": "基础入门",
    },
    "finger-numbers.html": {
        "title": "钢琴手指编号与基本指法",
        "desc": "详细讲解钢琴手指编号规则、基本指法原则和常见指法练习。帮助初学者建立正确的指法意识。",
        "date": "2025-03-22",
        "section": "基础入门",
    },
    "rhythm-basics.html": {
        "title": "节奏基础：认识拍子与节拍",
        "desc": "详细介绍钢琴节奏基础知识，包括拍子、节拍、节奏型等内容，帮助初学者建立良好的节奏感。",
        "date": "2025-03-22",
        "section": "基础入门",
    },
    "practice-methods.html": {
        "title": "科学的钢琴练习方法",
        "desc": "详细介绍科学有效的钢琴练习方法，包括时间管理、练习计划制定、难点突破技巧等内容。帮助钢琴学习者提高练习效率。",
        "date": "2025-03-22",
        "section": "练习方法",
    },
    "scales-practice.html": {
        "title": "音阶练习指南",
        "desc": "全面的钢琴音阶练习指南，包括大调音阶、小调音阶、琶音练习等内容，帮助钢琴学习者系统掌握音阶技巧。",
        "date": "2025-03-22",
        "section": "练习方法",
    },
    "hand-coordination.html": {
        "title": "双手协调性训练技巧",
        "desc": "详细介绍钢琴双手协调性训练方法，包括基础练习、进阶技巧和实用训练曲目。帮助钢琴学习者提高双手配合能力。",
        "date": "2025-03-22",
        "section": "练习方法",
    },
    "music-theory.html": {
        "title": "基础乐理知识",
        "desc": "全面的钢琴基础乐理知识介绍，包括音符、节奏、调式、和声等内容，帮助钢琴学习者建立扎实的理论基础。",
        "date": "2025-03-22",
        "section": "乐理知识",
    },
    "advanced-music-theory.html": {
        "title": "进阶乐理知识",
        "desc": "深入的钢琴进阶乐理知识，包括和声进行、调性转换、曲式分析等高级理论内容，适合有一定基础的钢琴学习者。",
        "date": "2025-03-22",
        "section": "乐理知识",
    },
    "sight-reading.html": {
        "title": "视奏训练方法",
        "desc": "全面的钢琴视奏训练指南，包括基础训练方法、进阶技巧和实用建议，帮助钢琴学习者提高视奏能力。",
        "date": "2025-03-22",
        "section": "进阶技巧",
    },
    "performance-skills.html": {
        "title": "演奏技巧提升",
        "desc": "全面的钢琴演奏技巧提升指南，包括音色控制、踏板使用、表现力培养等内容，帮助钢琴学习者提升演奏水平。",
        "date": "2025-03-22",
        "section": "进阶技巧",
    },
    "music-analysis.html": {
        "title": "经典曲目解析",
        "desc": "深入解析经典钢琴曲目的演奏技巧、音乐结构和表现手法，帮助钢琴学习者理解和演绎经典作品。",
        "date": "2025-03-22",
        "section": "进阶技巧",
    },
    "piano-maintenance.html": {
        "title": "钢琴保养知识",
        "desc": "全面的钢琴保养维护知识，包括日常护理、调音调律、环境控制等内容，帮助钢琴拥有者延长乐器寿命。",
        "date": "2025-03-22",
        "section": "乐器保养",
    },
}

base_dir = "/Users/rise/www/piano-online/articles/tutorials"

for filename, meta in articles.items():
    filepath = os.path.join(base_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 检查是否已有 Article schema
    if '"@type": "Article"' in content or '"@type":"Article"' in content:
        print(f"SKIP {filename} - already has Article schema")
        continue

    slug = filename.replace('.html', '')
    url = f"https://pianoonline.cc/articles/tutorials/{filename}"

    schema = f'''
    <!-- 结构化数据 Schema.org -->
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "{meta['title']}",
        "description": "{meta['desc']}",
        "url": "{url}",
        "image": "https://pianoonline.cc/images/og-image.jpg",
        "datePublished": "{meta['date']}",
        "dateModified": "{meta['date']}",
        "author": {{
            "@type": "Organization",
            "name": "Piano Online",
            "url": "https://pianoonline.cc"
        }},
        "publisher": {{
            "@type": "Organization",
            "name": "Piano Online",
            "logo": {{
                "@type": "ImageObject",
                "url": "https://pianoonline.cc/images/logo.svg"
            }}
        }},
        "mainEntityOfPage": {{
            "@type": "WebPage",
            "@id": "{url}"
        }},
        "articleSection": "{meta['section']}",
        "inLanguage": "zh-CN"
    }}
    </script>
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {{
                "@type": "ListItem",
                "position": 1,
                "name": "首页",
                "item": "https://pianoonline.cc/"
            }},
            {{
                "@type": "ListItem",
                "position": 2,
                "name": "教程",
                "item": "https://pianoonline.cc/tutorials.html"
            }},
            {{
                "@type": "ListItem",
                "position": 3,
                "name": "{meta['section']}",
                "item": "https://pianoonline.cc/tutorials.html#{slug}"
            }},
            {{
                "@type": "ListItem",
                "position": 4,
                "name": "{meta['title']}",
                "item": "{url}"
            }}
        ]
    }}
    </script>
</body>'''

    content = content.replace('</body>', schema)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"OK {filename}")

print("\nDone! All articles processed.")
