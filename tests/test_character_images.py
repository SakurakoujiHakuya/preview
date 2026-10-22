"""Character image coverage checks, separate from live browser verification."""
import json
import re
import subprocess
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
class CharacterImageTests(unittest.TestCase):
    def test_manifest_has_34_credited_photos(self):
        items = json.loads((ROOT/'assets/characters/sources.json').read_text())
        self.assertEqual(len(items),34)
        for key,item in items.items():
            p=ROOT/'assets/characters'/item['file']
            self.assertTrue(p.is_file(),key)
            self.assertGreater(p.stat().st_size,1000,key)
            for f in ['alt','caption','credit','source']:
                self.assertTrue(item[f],f'{key}: {f}')
            self.assertGreater(item['width'],100)
            self.assertGreater(item['height'],100)
            self.assertTrue(item['source'].startswith('https://'))
    def test_source_data_matches_runtime(self):
        runtime=(ROOT/'portraits.js').read_text()
        serialized=runtime.split('const characterPhotos = ',1)[1].split(';\nfunction',1)[0]
        self.assertEqual(json.loads(serialized),json.loads((ROOT/'assets/characters/sources.json').read_text()))
        subprocess.run(['node','--check',str(ROOT/'portraits.js')],check=True,capture_output=True)
    def test_script_dependency_order_and_honest_exception(self):
        html=(ROOT/'index.html').read_text()
        self.assertLess(html.index('src="portraits.js'),html.index('src="library.js'))
        self.assertIn('尚未取得能核实角色对应的非露骨原作人物截图',html)
        self.assertIn('青年叶淑柔',html)
        self.assertIn('青年谢南枝',html)
    def test_expected_character_keys(self):
        keys=set(json.loads((ROOT/'assets/characters/sources.json').read_text()))
        for prefix,n in [('aoi-',5),('women-',4),('dear-',4),('hamnet-',3),('umineko-',4)]:
            self.assertEqual(len([k for k in keys if k.startswith(prefix)]),n)
    def test_joy_gallery_contains_six_distinct_images(self):
        import hashlib
        files=list((ROOT/'assets/characters').glob('joy-modesta-*.jpg'))
        self.assertEqual(len(files),6)
        self.assertEqual(len({hashlib.sha256(p.read_bytes()).hexdigest() for p in files}),6)
        html=(ROOT/'index.html').read_text()
        self.assertEqual(html.count('data-gallery="modesta"'),6)
        self.assertIn('HAKUYA 重点推荐',html)
        self.assertIn('joy-reading',html)
    def test_academic_revision_preserves_five_essays_and_25_sections(self):
        html=(ROOT/'index.html').read_text().split('<section class="psyche shell"',1)[1].split('</section>',1)[0]
        self.assertEqual(html.count('class="long-essay"'),5)
        self.assertEqual(html.count('<h4>'),25)
        self.assertIn('自我理想',html)
        self.assertIn('享乐',html)
        self.assertIn('修通',html)
