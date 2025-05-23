import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / "src"))
from spiralife import main
output_file = Path(__file__).parent / "output.svg"
main({
    "output_file": str(output_file)
})