"""Sync the selected soundtrack and create a Pages-ready archive."""
from pathlib import Path
from shutil import copy2
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
source = root / "music" / "game_music.mp3"
destination = root / "docs" / "music" / "game_music.mp3"
destination.parent.mkdir(exist_ok=True)
copy2(source, destination)
output = root / ".build" / "iron-signal-web.zip"
output.parent.mkdir(exist_ok=True)
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for path in sorted((root / "docs").rglob("*")):
        if path.is_file() and not path.is_symlink() and path.name != ".DS_Store":
            archive.write(path, path.relative_to(root))
    archive.write(root / "WEB.md", "WEB.md")
print(f"Created {output} ({output.stat().st_size:,} bytes)")
