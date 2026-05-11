"""
resume_parser.py
================
Extracts plain text from uploaded PDF or DOCX resume files.
"""
import io


def extract_text_from_file(file_obj) -> str:
    """
    Accepts a Django InMemoryUploadedFile or similar file-like object.
    Detects format from filename/content-type and extracts text.
    """
    name = getattr(file_obj, 'name', '').lower()
    content = file_obj.read()

    if name.endswith('.pdf') or getattr(file_obj, 'content_type', '') == 'application/pdf':
        return _extract_from_pdf(content)
    elif name.endswith('.docx'):
        return _extract_from_docx(content)
    else:
        # Try PDF first, then DOCX
        try:
            return _extract_from_pdf(content)
        except Exception:
            return _extract_from_docx(content)


def _extract_from_pdf(content: bytes) -> str:
    """Extract text using pdfplumber (preferred) or PyPDF2 as fallback."""
    text_parts = []

    # Try pdfplumber first — better layout awareness
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        if text_parts:
            return '\n'.join(text_parts)
    except Exception:
        pass

    # Fallback: PyPDF2
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
        return '\n'.join(text_parts)
    except Exception as e:
        raise ValueError(f"Could not extract text from PDF: {e}")


def _extract_from_docx(content: bytes) -> str:
    """Extract text from a DOCX file using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return '\n'.join(paragraphs)
    except Exception as e:
        raise ValueError(f"Could not extract text from DOCX: {e}")
