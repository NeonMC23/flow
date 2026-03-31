import argparse
import json
from pathlib import Path

SETTINGS_PATH = Path(__file__).resolve().parents[1] / "src" / "data" / "settings.json"


def parse_value(raw: str):
    lowered = raw.lower()
    if lowered in {"true", "false"}:
        return lowered == "true"
    try:
        if "." in raw:
            return float(raw)
        return int(raw)
    except ValueError:
        return raw


def load_settings(path: Path):
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_settings(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def main():
    parser = argparse.ArgumentParser(description="Update Flow settings.json")
    parser.add_argument("--set", action="append", default=[], help="key=value (repeatable)")
    parser.add_argument("--get", help="key")
    parser.add_argument("--reset", action="store_true", help="reset to defaults")
    args = parser.parse_args()

    settings = load_settings(SETTINGS_PATH)

    if args.reset:
        settings = {
            "showOrbs": True,
            "glassPlayer": True,
            "autoplayNext": True,
            "showOscilloscope": True,
        }

    if args.set:
        for pair in args.set:
            if "=" not in pair:
                raise SystemExit("--set requires key=value")
            key, value = pair.split("=", 1)
            settings[key] = parse_value(value)

    if args.get:
        print(settings.get(args.get))
        return

    save_settings(SETTINGS_PATH, settings)
    print(f"Updated {SETTINGS_PATH}")


if __name__ == "__main__":
    main()
