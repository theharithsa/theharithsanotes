"""Build the approved Margin identity as native SVG paths. Requires fonttools==4.60.1."""

from hashlib import sha256
from html import escape
from pathlib import Path
import json

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/brand-identity/source/BodoniModa.ttf"
OUT = ROOT / "public/brand/v1"
OUT.mkdir(parents=True, exist_ok=True)
EXPECTED_FONT = "550f5e34ee0a828d7941b1fe9bc58b34e5260d3f33a61532e6d0a0114e79a5cf"
if sha256(SOURCE.read_bytes()).hexdigest() != EXPECTED_FONT:
    raise RuntimeError("Brand font source checksum does not match the reviewed source")
FONT = instantiateVariableFont(TTFont(SOURCE), {"wght": 650, "opsz": 12})
GLYPHS = FONT.getGlyphSet()
CMAP = FONT.getBestCmap()

INK = "#242321"
PAPER = "#FAF7F0"
ACCENT = "#C75C3A"
# Original h: book-spine slit and ribbon are part of this mark, not font glyphs.
H_PATH = (
    "M17 20 95 2V116C111 91 131 82 153 82C184 82 198 103 198 137"
    "V225C198 239 202 242 220 242V250H132V242C150 242 154 239 154 225"
    "V137C154 114 146 103 132 103C110 103 95 125 95 149V225"
    "C95 239 100 242 118 242V250H17V242C37 242 43 239 43 225"
    "V44C43 29 37 27 17 27Z M50 39H56V226H50Z"
)
H_SMALL = (
    "M22 22 95 7V116C111 93 131 84 153 84C184 84 198 105 198 139"
    "V220C198 234 204 237 220 237V252H132V237C149 237 154 234 154 220"
    "V139C154 116 146 106 132 106C110 106 95 127 95 151V220"
    "C95 234 101 237 118 237V252H22V237C39 237 43 234 43 220"
    "V51C43 36 37 34 22 34Z"
)


def mark(small=False, accent=ACCENT):
    ribbon = "M64 28H86V101L75 91 64 101Z" if not small else "M61 37H83V111L72 100 61 111Z"
    return (
        f'<path fill="currentColor" fill-rule="evenodd" d="{H_SMALL if small else H_PATH}"/>'
        f'<path fill="{accent}" d="{ribbon}"/>'
    )


def text_paths(text, size, x, baseline):
    scale = size / FONT["head"].unitsPerEm
    result = []
    for character in text:
        name = CMAP[ord(character)]
        pen = SVGPathPen(GLYPHS)
        GLYPHS[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
        result.append(f'<path d="{pen.getCommands()}"/>')
        x += FONT["hmtx"][name][0] * scale - size * 0.014
    return '<g fill="currentColor">' + ''.join(result) + '</g>', x


def horizontal(accent=ACCENT):
    the, _ = text_paths("the", 158, 354, 130)
    rest, end = text_paths("arithsa", 435, 335, 425)
    notes, end = text_paths("notes", 190, end + 40, 425)
    return f'<g transform="translate(24 99) scale(1.3)">{mark(accent=accent)}</g>' + the + rest + notes, round(end + 40), 475


def vertical(accent=ACCENT):
    the, _ = text_paths("the", 150, 330, 130)
    rest, end = text_paths("arithsa", 435, 330, 425)
    notes, _ = text_paths("notes", 270, 350, 687)
    return f'<g transform="translate(20 99) scale(1.3)">{mark(accent=accent)}</g>' + the + rest + notes, round(end + 30), 745


def svg(body, width, height, color=INK, background=None, title="The Harithsa Notes"):
    bg = f'<path fill="{background}" d="M0 0H{width}V{height}H0Z"/>' if background else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}" color="{color}" role="img" aria-label="{escape(title)}">'
        + bg + body + '</svg>\n'
    )


def save(name, value):
    (OUT / name).write_text(value, encoding="utf-8", newline="\n")


for layout, build in [("horizontal", horizontal), ("vertical", vertical)]:
    for treatment, color, accent in [("ink", INK, ACCENT), ("inverse", PAPER, ACCENT), ("black", "#000000", "#000000"), ("white", "#FFFFFF", "#FFFFFF")]:
        body, width, height = build(accent)
        save(f"logo-{layout}-{treatment}.svg", svg(body, width, height, color))

for treatment, color, accent in [("ink", INK, ACCENT), ("inverse", PAPER, ACCENT), ("black", "#000000", "#000000"), ("white", "#FFFFFF", "#FFFFFF")]:
    save(f"mark-{treatment}.svg", svg(f'<g transform="translate(10 15)">{mark(accent=accent)}</g>', 250, 280, color))

for name, color, accent, background, inset in [
    ("profile", PAPER, INK, ACCENT, 210),
    ("app-icon", PAPER, ACCENT, INK, 190),
    ("app-icon-maskable", PAPER, ACCENT, INK, 275),
    ("icon-paper", INK, ACCENT, PAPER, 190),
]:
    scale = (1024 - 2 * inset) / 250
    body = f'<g transform="translate({inset + 5} {inset - 4}) scale({scale})">{mark(small=True, accent=accent)}</g>'
    save(f"{name}.svg", svg(body, 1024, 1024, color, background))

# Pixel-aware version: no fine book-spine slit, heavier serifs and a visible ribbon.
favicon_body = f'<rect width="64" height="64" rx="13" fill="{INK}"/><g transform="translate(8 5) scale(.2)">{mark(small=True)}</g>'
save("favicon.svg", svg(favicon_body, 64, 64, PAPER))
(ROOT / "public/favicon.svg").write_text(svg(favicon_body, 64, 64, PAPER), encoding="utf-8", newline="\n")

# Artwork for the brand review sheet and generic branded share image.
body, width, height = horizontal()
board = f'<g transform="translate(90 150) scale({1740 / width})">{body}</g>'
board += f'<path fill="{INK}" d="M0 620H1920V1000H0Z"/>'
inverse_body, _, _ = horizontal()
board += f'<g color="{PAPER}" transform="translate(140 640) scale({1640 / width})">{inverse_body}</g>'
vbody, vw, vh = vertical()
board += f'<g transform="translate(70 1090) scale({690 / vw})">{vbody}</g>'
board += f'<rect x="1010" y="1080" width="250" height="250" rx="50" fill="{ACCENT}"/><g color="{PAPER}" transform="translate(1061 1113) scale(.65)">{mark(small=True, accent=INK)}</g>'
board += f'<rect x="1450" y="1080" width="250" height="250" rx="50" fill="{INK}"/><g color="{PAPER}" transform="translate(1501 1113) scale(.65)">{mark(small=True)}</g>'
labels = [(90, 80, "THE MARGIN / IDENTITY 1.0"), (90, 580, "HORIZONTAL WORDMARK"), (70, 1440, "VERTICAL LOCKUP"), (1010, 1390, "PROFILE"), (1450, 1390, "APP ICON")]
for x, y, label in labels:
    board += f'<text x="{x}" y="{y}" fill="{INK}" font-family="Arial,sans-serif" font-size="25" letter-spacing="3">{label}</text>'
save("identity-sheet.svg", svg(board, 1920, 1500, INK, PAPER))
share = f'<g transform="translate(80 170) scale({1040 / width})">{body}</g>'
share += f'<path fill="{ACCENT}" d="M80 482H1120V488H80Z"/>'
share += f'<text x="80" y="550" font-family="Arial,sans-serif" font-size="25" fill="{INK}">theharithsa.com</text>'
save("social-card.svg", svg(share, 1200, 630, INK, PAPER))

manifest = {
    "identity": "The Margin", "version": "1.0.0", "ownerApproved": "2026-11-06",
    "palette": {"ink": INK, "paper": PAPER, "accent": ACCENT},
    "font": {"family": "Bodoni Moda", "license": "SIL OFL 1.1", "sourceGitBlob": "c5d582f8003ae692761dd8e9ce69de23cb9fea53", "sha256": EXPECTED_FONT, "axes": {"wght": 650, "opsz": 12}},
    "customGeometry": "Original h, book-spine cutout, bookmark ribbon and optical small mark",
    "exports": [{"file": path.name, "sha256": sha256(path.read_bytes()).hexdigest()} for path in sorted(OUT.glob("*.svg"))],
}
(OUT / "identity.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
