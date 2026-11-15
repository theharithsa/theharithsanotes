#!/usr/bin/env python3
"""Build the public site from curated inputs and validate local HTML links."""
import argparse
from html import escape
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
GUIDES = {
    'product': 'Product handbook',
    'technical': 'Technical guide',
    'settings': 'Settings reference',
    'sdlc': 'SDLC guide',
    'pipeline': 'CI/CD pipeline',
    'roadmap': 'Roadmap',
    'releases': 'Release history',
}
MEDIA_SUFFIXES = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.mp4', '.webm', '.vtt'}


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids = set()
        self.links = []
        self.template_depth = 0
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        if tag == 'template':
            self.template_depth += 1
        if self.template_depth:
            return
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        self.links.extend(attrs[key] for key in ('href', 'src', 'poster') if attrs.get(key))

    def handle_endtag(self, tag):
        if tag == 'template':
            self.template_depth -= 1


def validate_links(output):
    pages = {file: Page(file.read_text(encoding='utf-8')) for file in output.rglob('*.html')}
    for file, page in pages.items():
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc:
                continue
            path = unquote(url.path)
            target = (file.parent / path).resolve() if path else file
            if path.startswith('/') or not target.is_relative_to(output):
                raise ValueError(f'{file.relative_to(output)}: use a relative site link for {link}')
            if target.is_dir():
                target /= 'index.html'
            if not target.is_file():
                raise ValueError(f'{file.relative_to(output)}: missing target {link}')
            if url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                raise ValueError(f'{file.relative_to(output)}: missing anchor {link}')


def render(slug, data):
    title = GUIDES[slug]
    project = escape(data['project'])
    menu = ''.join(
        f'<a href="{key}.html"' + (' aria-current="page"' if key == slug else '')
        + f'>{label}</a>'
        for key, label in GUIDES.items()
    )
    sections = ''.join(
        f'<section id="{section_id(heading)}"><h2>{escape(heading)}</h2>'
        + ''.join(f'<p>{escape(paragraph)}</p>' for paragraph in paragraphs)
        + (render_steps(steps[0]) if steps else '')
        + '</section>'
        for heading, paragraphs, *steps in data['sections']
    )
    if slug == 'product':
        sections = (
            '<figure><a href="../media/blog.webp">'
            '<img src="../media/blog.webp" width="1600" height="810" '
            'alt="Blog archive with topic filters, tag dropdown and year rail"></a>'
            '<figcaption>The public Blog archive.</figcaption></figure>' + sections
        )
    if slug == 'pipeline':
        sections += '<section><h2>Delivery flow</h2><ol class="pipeline">' + ''.join(
            f'<li><strong>{escape(stage)}</strong><span>{escape(result)}</span></li>'
            for stage, result in data['stages']
        ) + '</ol></section>'
    if slug == 'roadmap':
        sections += '<section><h2>Path to production</h2><ol class="pipeline roadmap-flow">' + ''.join(
            f'<li><strong>{escape(stage)}</strong><span>{escape(result)}</span></li>'
            for stage, result in data['flow']
        ) + '</ol></section>'
    if slug == 'releases':
        sections += '<section><h2>Published versions</h2><ol class="pipeline">' + ''.join(
            f'<li><a href="{escape(url, quote=True)}">Version {escape(version)}</a>'
            f'<span>{escape(highlight)}</span></li>'
            for version, highlight, url in data['versions']
        ) + '</ol></section>'
    if links := data.get('links'):
        sections += '<section><h2>Related links</h2><ul>' + ''.join(
            f'<li><a href="{escape(url, quote=True)}">{escape(label)}</a></li>'
            for label, url in links
        ) + '</ul></section>'
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{escape(data['intro'], quote=True)}">
  <title>{title} | {project}</title>
  <link rel="icon" href="../media/icon.png">
  <link rel="stylesheet" href="../landing.css">
  <link rel="stylesheet" href="../guides.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="wrap header">
    <a class="brand" href="../"><img src="../media/wordmark.webp" alt="{project}" width="210" height="58"></a>
    <nav aria-label="Main navigation"><a href="../#tour">Demo</a><a href="../#guides">Guides</a><a href="https://theharithsanotes.com/">Read the site</a></nav>
  </header>
  <main id="main" class="wrap guide-layout">
    <nav class="guide-nav" aria-label="Documentation"><h2>Guides</h2>{menu}</nav>
    <article class="guide">
      <h1>{title}</h1>
      <p class="lead">{escape(data['intro'])}</p>
      {sections}
    </article>
  </main>
  <footer class="wrap footer"><a href="../">Product and documentation</a><a href="https://github.com/theharithsa/theharithsanotes/issues">Report a docs issue</a></footer>
</body>
</html>
'''


def section_id(heading):
    return re.sub('[^a-z0-9]+', '-', heading.lower()).strip('-')


def render_steps(steps):
    return '<ol>' + ''.join(f'<li>{escape(step)}</li>' for step in steps) + '</ol>'


def text_list(values):
    return isinstance(values, list) and bool(values) and all(
        isinstance(value, str) and value.strip() for value in values
    )


def validate_guide(slug, data):
    if not data['intro'].strip():
        raise ValueError(f'{slug}: introduction is required')
    sections = data['sections']
    if not isinstance(sections, list) or not sections or any(
        not isinstance(section, list) or len(section) not in (2, 3)
        or not isinstance(section[0], str) or not section[0].strip()
        or not all(text_list(lines) for lines in section[1:])
        for section in sections
    ):
        raise ValueError(f'{slug}: sections must contain a heading, paragraphs and optional steps')
    anchors = [section_id(section[0]) for section in sections]
    if not all(anchors) or len(anchors) != len(set(anchors)):
        raise ValueError(f'{slug}: sections must have unique anchors')
    fields = {'pipeline': ('stages', 2), 'roadmap': ('flow', 2), 'releases': ('versions', 3)}
    if slug in fields:
        field, arity = fields[slug]
        entries = data[field]
        if not isinstance(entries, list) or not entries or any(
            not text_list(entry) or len(entry) != arity for entry in entries
        ):
            raise ValueError(f'{slug}: invalid {field} entries')


def build(root, output):
    config = json.loads((root / 'docs/public-guides.json').read_text(encoding='utf-8'))
    if not config['project'].strip() or set(config['guides']) != set(GUIDES):
        raise ValueError('Public guides must match the registered guide list.')
    revision = os.getenv('GITHUB_SHA')
    if revision and not re.fullmatch('[0-9a-f]{40}', revision):
        raise ValueError('Invalid GitHub source revision')
    output = output.resolve()
    with tempfile.TemporaryDirectory(prefix='app-launchpad-docs-') as scratch:
        staged = Path(scratch).resolve()
        for asset in ('index.html', 'landing.css', 'guides.css'):
            source = root / 'site' / asset
            if not source.is_file() or source.is_symlink():
                raise ValueError(f'Expected a regular site file at {asset}')
            if asset == 'index.html' and revision:
                page = source.read_text(encoding='utf-8')
                stamp = f'  <meta name="source-revision" content="{revision}">'
                (staged / asset).write_text(page.replace('</head>', stamp + '\n</head>'), encoding='utf-8')
            else:
                shutil.copyfile(source, staged / asset)
        media = root / 'site/media'
        if media.is_dir() and not media.is_symlink():
            for source in sorted(media.iterdir()):
                if source.is_file() and not source.is_symlink() and source.suffix.lower() in MEDIA_SUFFIXES:
                    destination = staged / 'media' / source.name
                    destination.parent.mkdir(exist_ok=True)
                    shutil.copyfile(source, destination)
        guides = staged / 'docs'
        guides.mkdir()
        for slug, data in config['guides'].items():
            validate_guide(slug, data)
            page = render(slug, {**data, 'project': config['project']})
            if revision:
                page = page.replace('</head>', f'  <meta name="source-revision" content="{revision}">\n</head>')
            (guides / (slug + '.html')).write_text(page, encoding='utf-8')
        validate_links(staged)
        if output.exists() and (not output.is_dir() or any(output.iterdir())):
            raise ValueError(f'Use an empty build output directory: {output}')
        shutil.copytree(staged, output, dirs_exist_ok=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, help='Use an empty output directory. Omit for a temporary validation build.')
    args = parser.parse_args()
    try:
        if args.output:
            build(ROOT, args.output)
        else:
            with tempfile.TemporaryDirectory(prefix='app-launchpad-docs-check-') as scratch:
                build(ROOT, Path(scratch))
        print('Public documentation build and local links passed.')
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as error:
        raise SystemExit(f'Public documentation build failed: {error}')
