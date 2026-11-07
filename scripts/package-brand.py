"""Create a portable, deterministic brand kit from reviewed vector/raster exports."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
exports = root / "public/brand/v1"
target = root / "archives/harithsa-notes-brand-v1.zip"
target.parent.mkdir(exist_ok=True)
with ZipFile(target, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
    paths = [(path.name, path) for path in sorted(exports.iterdir()) if path.is_file()]
    paths.append(("OFL.txt", root / "assets/brand-identity/source/OFL.txt"))
    for name, path in paths:
        info = ZipInfo("harithsa-notes-brand-v1/" + name, date_time=(2026, 11, 6, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        archive.writestr(info, path.read_bytes())
