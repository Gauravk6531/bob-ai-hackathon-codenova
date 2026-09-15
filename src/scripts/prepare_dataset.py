from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src'
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from data_pipeline.main import run_pipeline


if __name__ == '__main__':
    result = run_pipeline()
    print(f"Dataset prepared. Final rows: {result['final_rows']}")
