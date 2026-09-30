"""Report exact legacy demo repairs. --apply commits the reported repair.

Run from backend/: python scripts/repair_demo_meetings.py
No title-only deletion. User notes/action items move to the retained ID.
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import SessionLocal
from seed import repair_demo_meetings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    with SessionLocal() as db:
        report = repair_demo_meetings(db, apply=args.apply)
        print(json.dumps(report, indent=2))
        if args.apply:
            db.commit()
            print("Committed demo repair.")
        else:
            db.rollback()
            print("Dry run; no database changes.")


if __name__ == "__main__":
    main()
