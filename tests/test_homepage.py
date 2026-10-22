"""Static regression checks. These do not replace a browser interaction test."""
import re
import subprocess
import unittest
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.assets = [], []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.append(a['id'])
        if tag in ('img', 'script', 'link'):
            path = a.get('src', a.get('href', ''))
            if path and not path.startswith(('http', 'data:', '#')):
                self.assets.append(path)

class HomepageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / 'index.html').read_text()
        cls.js = (ROOT / 'library.js').read_text()
        cls.doc = Document()
        cls.doc.feed(cls.html)
    def test_unique_ids(self):
        self.assertFalse([k for k, n in Counter(self.doc.ids).items() if n > 1])
    def test_local_assets_exist(self):
        for asset in self.doc.assets:
            self.assertTrue((ROOT / asset).is_file(), asset)
    def test_all_nine_work_panels_exist(self):
        expected = {'aoi-tokugawa', 'dear-you', 'hamnet', 'umineko', 'nenotori', 'gilded-age', 'little-women', 'art-of-joy', 'flowers-of-evil'}
        registered = set(re.findall(r"\{id:'([^']+)'", self.js))
        self.assertEqual(expected, registered)
        self.assertTrue(expected.issubset(self.doc.ids))
    def test_other_sections_preserved(self):
        self.assertTrue({'psyche', 'field', 'about'}.issubset(self.doc.ids))
        self.assertIn('assets/yjs-lab.js', self.doc.assets)
        for n in range(1, 6):
            self.assertIn(f'psyche-essay-{n}', self.doc.ids)
    def test_aoi_art_and_three_generations(self):
        for art in ('assets/aoi-dvd.jpg', 'assets/aoi-still.jpg'):
            self.assertIn(art, self.doc.assets)
            self.assertGreater((ROOT / art).stat().st_size, 1000)
        for key in ('ieyasu', 'hidetada', 'iemitsu'):
            self.assertIn(f'data-aoi="{key}"', self.html)
        self.assertIn('aria-controls="aoi-dossier"', self.html)
        self.assertIn('aoi-dossier', self.doc.ids)
    def test_js_syntax(self):
        for path in ('app.js', 'library.js', 'assets/yjs-lab.js'):
            subprocess.run(['node', '--check', str(ROOT / path)], check=True, capture_output=True)

if __name__ == '__main__':
    unittest.main()
