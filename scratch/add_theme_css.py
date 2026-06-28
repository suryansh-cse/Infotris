import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]

for html in root.rglob("*.html"):
    text = html.read_text(encoding="utf-8")
    if "css/system/theme.css" in text:
        continue
    rel = html.parent.relative_to(root)
    depth = len(rel.parts)
    prefix = "../" * depth if depth else ""
    theme_line = f'    <link rel="stylesheet" href="{prefix}css/system/theme.css">\n'
    pattern = r'(\s*)<link rel="stylesheet" href="([^"]*?)css/global\.css">'

    def repl(m):
        return m.group(1) + theme_line.rstrip() + "\n" + m.group(0)

    new_text, n = re.subn(pattern, repl, text, count=1)
    if n:
        html.write_text(new_text, encoding="utf-8")
        print("Updated:", html.relative_to(root))
    else:
        print("SKIP:", html.relative_to(root))
