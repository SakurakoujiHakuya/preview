"""Static checks for the Yjs update-flight overlay on the new homepage."""
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class YjsFlightTests(unittest.TestCase):
    def test_script_loaded_after_lab(self):
        html = (ROOT / 'index.html').read_text()
        self.assertIn('js/yjs-flight.js', html)
        self.assertLess(html.index('js/yjs-lab.js'), html.index('js/yjs-flight.js'))
    def test_syntax_and_reduced_motion(self):
        path = ROOT / 'js' / 'yjs-flight.js'
        subprocess.run(['node', '--check', str(path)], check=True, capture_output=True)
        src = path.read_text()
        self.assertIn('prefers-reduced-motion', src)
        self.assertIn('IntersectionObserver', src)

if __name__ == '__main__':
    unittest.main()
