"""
Builds packages/core/data/cbam-data.json from the official EU Excel files in
docs/sources/eu/. Standard library only. Re-run whenever the Commission
publishes new default values or benchmarks:

    python3 -I scripts/extract_cbam_data.py

Values are copied exactly as published (decimal commas converted). The Excel
files are informative; the legally binding values are in Implementing
Regulations (EU) 2025/2621 (as corrected by 2026/1740) and 2025/2620.
"""
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from xlsx_reader import read  # noqa: E402

SRC = os.path.join(ROOT, "docs", "sources", "eu")
DV_FILE = "default-values-2026-08-06.xlsx"
BM_FILE = "benchmarks-2026-02-06.xlsx"
OUT = os.path.join(ROOT, "packages", "core", "data", "cbam-data.json")

SECTORS = {"Cement": "cement", "Fertilisers": "fertilisers", "Aluminium": "aluminium", "Hydrogen": "hydrogen", "Iron and steel": "steel"}


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def num(v):
    """'1,290' -> 1.29; '-' or '' -> None (no value, use 'Other countries'); 'N/A' -> 'na'."""
    if v is None:
        return None
    s = str(v).strip()
    if s in ("", "-", "–"):
        return None
    if s.upper() == "N/A":
        return "na"
    return float(s.replace(",", "."))


def default_values(sheet_name):
    sheets, rows = read(os.path.join(SRC, DV_FILE))
    d = dict(sheets)
    out, sector = [], None
    for _, c in rows(d[sheet_name]):
        a = (c.get("A") or "").strip()
        if a in SECTORS:
            sector = SECTORS[a]
            continue
        if not a[:1].isdigit():
            continue
        if str(c.get("C") or "").strip().lower() == "see below":
            continue  # group heading such as "3102"
        out.append({
            "code": a.replace(" ", ""),
            "codeDisplay": a,
            "description": (c.get("B") or "").strip(),
            "sector": sector,
            "direct": num(c.get("C")),
            "indirect": num(c.get("D")),
            "total": num(c.get("E")),
            "route": (c.get("F") or "").strip() or None,
        })
    return out


def benchmarks():
    sheets, rows = read(os.path.join(SRC, BM_FILE))
    d = dict(sheets)
    out, cur, desc, sector = {}, None, None, None
    for _, c in rows(d["Benchmarks"]):
        a = (c.get("A") or "").strip()
        if a in SECTORS:
            sector = SECTORS[a]
            continue
        if a[:1].isdigit():
            cur, desc = a, (c.get("B") or "").strip()
        # A row may carry only a Column B value (e.g. the "(F)(2)" rows for
        # production years 2028-30), so keep any row with Column A or B.
        if not cur or (c.get("C") is None and c.get("E") is None):
            continue
        out.setdefault(cur, {"description": desc, "sector": sector, "routes": []})["routes"].append({
            "routeA": (c.get("D") or "").strip() or None,
            "a": round(float(c["C"]), 6) if c.get("C") is not None else None,
            "routeB": (c.get("F") or "").strip() or None,
            "b": round(float(c["E"]), 6) if c.get("E") is not None else None,
        })
    return out


def main():
    other = default_values("_Other Countries and Territorie")
    egypt = {g["code"]: g for g in default_values("Egypt")}
    goods = []
    for g in other:
        e = egypt.get(g["code"])
        goods.append({
            "code": g["code"], "codeDisplay": g["codeDisplay"], "description": g["description"], "sector": g["sector"],
            "other": {k: g[k] for k in ("direct", "indirect", "total", "route")},
            # Egypt-specific value only when Egypt lists a number; otherwise the
            # 'Other countries and territories' value applies (IR 2025/2621, Annex I).
            "egypt": {k: e[k] for k in ("direct", "indirect", "total", "route")} if e and isinstance(e["total"], float) else None,
        })
    data = {
        "meta": {
            "builtBy": "scripts/extract_cbam_data.py",
            "checked": "2026-11-10",
            "legalNote": "Excel files are informative. Legally binding values: Implementing Regulation (EU) 2025/2621 as corrected by (EU) 2026/1740 (default values) and Implementing Regulation (EU) 2025/2620 (benchmarks).",
            "sources": {
                "defaultValues": {
                    "file": DV_FILE, "sha256": sha256(os.path.join(SRC, DV_FILE)),
                    "version": "2 — based on Annex I and II to Implementing Regulation (EU) 2026/1740 adopted 20 July 2026; published 10 August 2026",
                    "url": "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-legislation-and-guidance_en",
                    "law": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L_202601740",
                },
                "benchmarks": {
                    "file": BM_FILE, "sha256": sha256(os.path.join(SRC, BM_FILE)),
                    "version": "1 — based on Implementing Regulation (EU) 2025/2620 published 22 December 2025; file dated 13 February 2026",
                    "url": "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-legislation-and-guidance_en",
                    "law": "http://data.europa.eu/eli/reg_impl/2025/2620/oj",
                },
                "prices": {"url": "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en", "law": "Implementing Regulation (EU) 2025/2548"},
                "cbamFactor": {"law": "Directive 2003/87/EC, Article 10a(1a)", "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02003L0087-20240301"},
                "cscf": {"law": "Commission Implementing Decision (EU) 2026/1862", "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202601862"},
                "markups": {"law": "Implementing Regulation (EU) 2025/2621, Annex I", "url": "http://data.europa.eu/eli/reg_impl/2025/2621/oj"},
            },
        },
        # Official quarterly certificate prices for 2026 (EUR per certificate). Q4 published 4 Jan 2027.
        "prices2026": {"Q1": {"eur": 75.36, "published": "2026-04-07"}, "Q2": {"eur": 75.28, "published": "2026-07-06"}, "Q3": {"eur": 82.32, "published": "2026-10-05"}, "Q4": None},
        "cbamFactor": {"2026": 0.975, "2027": 0.95, "2028": 0.90, "2029": 0.775, "2030": 0.515, "2031": 0.39, "2032": 0.265, "2033": 0.14},
        "cscf": {"2026": 1.0, "2027": 1.0, "2028": 1.0, "2029": 1.0, "2030": 1.0},
        "markups": {"metals": {"2026": 0.10, "2027": 0.20, "2028": 0.30}, "fertilisers": 0.01},
        "routes": {
            "(1)": "production years 2026-27", "(2)": "production years 2028-30",
            "(A)": "grey clinker / cement", "(B)": "white clinker / cement",
            "(C)": "carbon steel, BF/BOF", "(D)": "carbon steel, DRI/EAF", "(E)": "carbon steel, scrap/EAF",
            "(F)": "low-alloy steel, BF/BOF", "(G)": "low-alloy steel, DRI/EAF", "(H)": "low-alloy steel, scrap/EAF",
            "(J)": "high-alloy steel (EAF)", "(K)": "primary aluminium", "(L)": "secondary aluminium",
        },
        "goods": goods,
        "benchmarks": benchmarks(),
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    eg = sum(1 for g in goods if g["egypt"])
    print(f"goods: {len(goods)} (Egypt-specific values: {eg}); benchmark codes: {len(data['benchmarks'])}; wrote {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT)//1024} KB)")


if __name__ == "__main__":
    main()
