# Minimal .xlsx reader (stdlib only): prints sheets and the first rows.
import sys, zipfile, re, xml.etree.ElementTree as ET
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main", "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
def read(path):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
            shared.append("".join(t.text or "" for t in si.iter("{%s}t" % NS["m"])))
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    target = {r.get("Id"): r.get("Target") for r in rels}
    sheets = []
    for s in wb.find("m:sheets", NS):
        rid = s.get("{%s}id" % NS["r"]); t = target[rid].lstrip("/")
        sheets.append((s.get("name"), t if t.startswith("xl/") else "xl/" + t))
    def rows(sheetpath):
        root = ET.fromstring(z.read(sheetpath))
        for row in root.iter("{%s}row" % NS["m"]):
            out = {}
            for c in row.findall("m:c", NS):
                ref = c.get("r"); col = re.match(r"[A-Z]+", ref).group()
                v = c.find("m:v", NS); typ = c.get("t")
                if typ == "s" and v is not None: val = shared[int(v.text)]
                elif typ == "inlineStr": val = "".join(t.text or "" for t in c.iter("{%s}t" % NS["m"]))
                else: val = v.text if v is not None else None
                out[col] = val
            yield int(row.get("r")), out
    return sheets, rows
if __name__ == "__main__":
    sheets, rows = read(sys.argv[1])
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    for name, p in sheets:
        allrows = list(rows(p))
        print(f"=== sheet '{name}' rows={len(allrows)}")
        for r, c in allrows[:n]: print(r, {k: (v[:40] if isinstance(v, str) else v) for k, v in c.items()})
