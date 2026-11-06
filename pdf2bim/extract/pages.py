"""Per page of a PDF: its text layer (for the quote check) and a PNG image (for Claude to read)."""
import io


def page_count(pdf_path):
    import pypdfium2 as pdfium
    return len(pdfium.PdfDocument(pdf_path))


def page_text(pdf_path, i):
    """Text layer of page i (0-based); '' for a scanned page."""
    import pypdfium2 as pdfium
    pg = pdfium.PdfDocument(pdf_path)[i]
    return pg.get_textpage().get_text_range() or ""


def page_png(pdf_path, i, long_edge=2400):
    """PNG bytes of page i, scaled so its long edge is about long_edge px (drawing text stays legible)."""
    import pypdfium2 as pdfium
    pg = pdfium.PdfDocument(pdf_path)[i]
    w, h = pg.get_size()
    im = pg.render(scale=long_edge / max(w, h)).to_pil()
    b = io.BytesIO()
    im.save(b, "PNG", optimize=True)
    return b.getvalue()
