import csv
import json
import os
import re
import sys
from pathlib import Path

import pdfplumber


DEFAULT_PDF = r"C:\Users\dave\Downloads\The_Ethiopian_Food_Composition_Table_2025_cd9308_260707_131817.pdf"
ROOT = Path(__file__).resolve().parents[2]
OUT_JSON = ROOT / "data" / "ethiopian-fct-food-data.json"
OUT_CSV = ROOT / "data" / "ethiopian-fct-food-data.csv"

GROUP_HEADINGS = {
    "Cereals and their products",
    "Roots, tubers, and their products",
    "Legumes and their products",
    "Nuts, seeds, and their products",
    "Vegetables and their products",
    "Fruits and their products",
    "Meat, poultry, and their products",
    "Eggs and their products",
    "Fish, seafood, and their products",
    "Milk and its products",
    "Fats and oils",
    "Sugars, sweets, and beverages",
    "Spices, condiments, and herbs",
    "Composite dishes",
}

SKIP_PREFIXES = (
    "Condensed Food",
    "Code Food name",
    "portion",
    "INFOODS",
    "Non-African",
    "SD or",
    "n ",
)


def clean_number(value):
    if value is None:
        return None
    value = value.strip().replace("[", "").replace("]", "")
    if value.lower() in {"tr", "trace", "-"}:
        return 0
    try:
        return float(value)
    except ValueError:
        return None


def parse_energy(value):
    match = re.match(r"(?P<kj>\d+(?:\.\d+)?)\((?P<kcal>\d+(?:\.\d+)?)\)", value)
    if not match:
        return None, None
    return float(match.group("kj")), float(match.group("kcal"))


def looks_like_group(line):
    if any(char.isdigit() for char in line):
        return False
    return line in GROUP_HEADINGS


def normalize_food_name(value):
    return re.sub(r"\s+", " ", value).strip(" ,")


def parse_macro_line(code, line, current_group, pending_name):
    tokens = line.split()
    if len(tokens) < 9:
        return None

    ash = clean_number(tokens[-1])
    fiber = clean_number(tokens[-2])
    carbs = clean_number(tokens[-3])
    fat = clean_number(tokens[-4])
    protein = clean_number(tokens[-5])
    water = clean_number(tokens[-6])
    energy_kj, energy_kcal = parse_energy(tokens[-7])
    edible_portion = clean_number(tokens[-8])

    if energy_kj is None or protein is None:
        return None

    name_tokens = tokens[:-8]
    raw_name = " ".join(name_tokens)
    if pending_name and (not raw_name or raw_name[0].islower() or raw_name.startswith("(")):
        raw_name = f"{pending_name} {raw_name}"

    food_name = normalize_food_name(raw_name)
    if not food_name:
        food_name = normalize_food_name(pending_name)

    return {
        "source_code": code,
        "food_name": food_name,
        "food_name_amharic": None,
        "food_group": current_group or "Unclassified",
        "edible_portion": edible_portion,
        "energy_kj": energy_kj,
        "energy_kcal": energy_kcal,
        "protein": protein,
        "fat": fat,
        "carbs": carbs,
        "fiber": fiber,
        "ash": ash,
        "vitamins_minerals_json": {"water_g": water},
    }


def parse_mineral_line(line):
    match = re.match(r"^(?P<code>\d{6})\s+(?P<body>.+)$", line)
    if not match:
        return None
    tokens = match.group("body").split()
    if len(tokens) < 11:
        return None

    values = [clean_number(token) for token in tokens[-10:]]
    if any(value is None for value in values):
        return None
    keys = [
        "calcium_mg",
        "iron_mg",
        "magnesium_mg",
        "phosphorus_mg",
        "potassium_mg",
        "sodium_mg",
        "zinc_mg",
        "copper_mg",
        "manganese_mg",
        "selenium_mcg",
    ]
    return match.group("code"), dict(zip(keys, values))


def parse_pdf(pdf_path):
    foods = {}
    minerals = {}
    current_group = None
    pending_name = ""

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if "Condensed Food" not in text:
                continue

            is_macro_page = "(1/5)" in text
            is_mineral_page = "(2/5)" in text
            if not (is_macro_page or is_mineral_page):
                continue

            for raw_line in text.splitlines():
                line = normalize_food_name(raw_line.replace("(cid:415)", ""))
                if not line or line.startswith(SKIP_PREFIXES):
                    continue
                if looks_like_group(line):
                    current_group = line
                    pending_name = ""
                    continue

                if is_mineral_page:
                    mineral = parse_mineral_line(line)
                    if mineral:
                        code, values = mineral
                        minerals.setdefault(code, {}).update(values)
                    continue

                match = re.match(r"^(?P<code>\d{6})\s+(?P<body>.+)$", line)
                if match:
                    row = parse_macro_line(match.group("code"), match.group("body"), current_group, pending_name)
                    if row:
                        foods[row["source_code"]] = row
                        pending_name = ""
                    continue

                embedded = re.match(r"^(?P<prefix>.+?)\s+(?P<code>\d{6})\s+(?P<body>.+)$", line)
                if embedded:
                    pending = normalize_food_name(f"{pending_name} {embedded.group('prefix')}")
                    row = parse_macro_line(embedded.group("code"), embedded.group("body"), current_group, pending)
                    if row:
                        foods[row["source_code"]] = row
                        pending_name = ""
                    continue

                if not any(line.startswith(prefix) for prefix in SKIP_PREFIXES):
                    pending_name = normalize_food_name(line)

    for code, values in minerals.items():
        if code in foods:
            foods[code]["vitamins_minerals_json"].update(values)

    return sorted(foods.values(), key=lambda item: item["source_code"])


def write_outputs(rows):
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    with OUT_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "source_code",
                "food_name",
                "food_name_amharic",
                "food_group",
                "edible_portion",
                "energy_kj",
                "energy_kcal",
                "protein",
                "fat",
                "carbs",
                "fiber",
                "ash",
                "vitamins_minerals_json",
            ],
        )
        writer.writeheader()
        for row in rows:
            csv_row = dict(row)
            csv_row["vitamins_minerals_json"] = json.dumps(row["vitamins_minerals_json"], sort_keys=True)
            writer.writerow(csv_row)


if __name__ == "__main__":
    pdf_path = Path(sys.argv[1] if len(sys.argv) > 1 else os.getenv("ETHIOPIAN_FCT_PDF_PATH", DEFAULT_PDF))
    rows = parse_pdf(pdf_path)
    if len(rows) < 100:
        raise SystemExit(f"Parsed only {len(rows)} rows; table extraction likely failed")
    write_outputs(rows)
    print(f"Parsed {len(rows)} foods from {pdf_path}")
    print(f"Wrote {OUT_JSON}")
