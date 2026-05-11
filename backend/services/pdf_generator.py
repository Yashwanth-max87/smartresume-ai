"""
pdf_generator.py
================
Generates ATS-friendly PDF resumes using ReportLab.
Supports 4 templates: modern, minimal, ats_professional, two_column.
"""
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, KeepTogether
)
from reportlab.lib.utils import simpleSplit

PAGE_W, PAGE_H = A4
MARGIN = 1.8 * cm


def _hex_to_color(hex_str: str):
    """Convert #RRGGBB to ReportLab Color."""
    hex_str = hex_str.lstrip('#')
    r, g, b = int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16)
    return colors.Color(r / 255, g / 255, b / 255)


def _safe(val, default=''):
    return val if val else default


def _list_val(val):
    return val if isinstance(val, list) else []


# ---------------------------------------------------------------------------
# Template: ATS Professional (default — cleanest for ATS systems)
# ---------------------------------------------------------------------------

def _build_ats_professional(data: dict, buf: io.BytesIO) -> bytes:
    accent = _hex_to_color(data.get('accent_color', '#6366f1'))
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
    )

    def section_heading(title):
        return [
            Spacer(1, 0.3 * cm),
            Paragraph(f'<font color="#{_color_hex(accent)}" size="11"><b>{title.upper()}</b></font>',
                      ParagraphStyle('sh', fontName='Helvetica-Bold', fontSize=11)),
            HRFlowable(width='100%', thickness=1, color=accent),
            Spacer(1, 0.15 * cm),
        ]

    body_style = ParagraphStyle('body', fontName='Helvetica', fontSize=9.5, leading=14)
    bold_style = ParagraphStyle('bold', fontName='Helvetica-Bold', fontSize=9.5, leading=14)
    small_style = ParagraphStyle('small', fontName='Helvetica', fontSize=8.5, leading=12,
                                 textColor=colors.HexColor('#555555'))

    story = []

    # Header
    story.append(Paragraph(
        f'<font size="20" color="#{_color_hex(accent)}"><b>{_safe(data.get("name"), "Your Name")}</b></font>',
        ParagraphStyle('name', fontName='Helvetica-Bold', fontSize=20, alignment=TA_CENTER)
    ))
    if data.get('title'):
        story.append(Paragraph(
            f'<font size="12">{data["title"]}</font>',
            ParagraphStyle('title', fontName='Helvetica', fontSize=12, alignment=TA_CENTER,
                           textColor=colors.HexColor('#444444'))
        ))
    story.append(Spacer(1, 0.2 * cm))

    # Contact line
    contacts = []
    for field in ['email', 'phone', 'location']:
        if data.get(field):
            contacts.append(data[field])
    for field in ['linkedin', 'github', 'portfolio']:
        if data.get(field):
            contacts.append(data[field])
    if contacts:
        story.append(Paragraph(' | '.join(contacts),
                               ParagraphStyle('contact', fontName='Helvetica', fontSize=9,
                                              alignment=TA_CENTER, textColor=colors.HexColor('#555555'))))
    story.append(HRFlowable(width='100%', thickness=1.5, color=accent))
    story.append(Spacer(1, 0.2 * cm))

    # Summary
    if data.get('summary'):
        story += section_heading('Professional Summary')
        story.append(Paragraph(data['summary'], body_style))

    # Skills
    skills = _list_val(data.get('skills'))
    if skills:
        story += section_heading('Skills')
        skill_str = ' • '.join(skills)
        story.append(Paragraph(skill_str, body_style))

    # Experience
    experience = _list_val(data.get('experience'))
    if experience:
        story += section_heading('Experience')
        for exp in experience:
            title_line = f"<b>{_safe(exp.get('title'))}</b> — {_safe(exp.get('company'))}"
            date_line = f"{_safe(exp.get('start_date'))} – {_safe(exp.get('end_date', 'Present'))}"
            story.append(KeepTogether([
                Paragraph(title_line, bold_style),
                Paragraph(date_line, small_style),
                Paragraph(_safe(exp.get('description')), body_style),
                Spacer(1, 0.2 * cm),
            ]))

    # Education
    education = _list_val(data.get('education'))
    if education:
        story += section_heading('Education')
        for edu in education:
            story.append(KeepTogether([
                Paragraph(f"<b>{_safe(edu.get('degree'))}</b> — {_safe(edu.get('institution'))}",
                          bold_style),
                Paragraph(f"{_safe(edu.get('year'))}  {_safe(edu.get('gpa', ''))}",
                          small_style),
                Spacer(1, 0.15 * cm),
            ]))

    # Projects
    projects = _list_val(data.get('projects'))
    if projects:
        story += section_heading('Projects')
        for proj in projects:
            story.append(KeepTogether([
                Paragraph(f"<b>{_safe(proj.get('name'))}</b>", bold_style),
                Paragraph(_safe(proj.get('description')), body_style),
                Spacer(1, 0.15 * cm),
            ]))

    # Certifications
    certs = _list_val(data.get('certifications'))
    if certs:
        story += section_heading('Certifications')
        for cert in certs:
            story.append(Paragraph(
                f"• <b>{_safe(cert.get('name'))}</b>  {_safe(cert.get('issuer', ''))}  {_safe(cert.get('year', ''))}",
                body_style
            ))

    # Achievements
    achievements = _list_val(data.get('achievements'))
    if achievements:
        story += section_heading('Achievements')
        for ach in achievements:
            story.append(Paragraph(f"• {ach}", body_style))

    # Languages
    languages = _list_val(data.get('languages'))
    if languages:
        story += section_heading('Languages')
        story.append(Paragraph(' • '.join(languages), body_style))

    doc.build(story)
    return buf.getvalue()


def _color_hex(c) -> str:
    """Convert ReportLab Color to hex string (without #)."""
    return '{:02x}{:02x}{:02x}'.format(
        int(c.red * 255), int(c.green * 255), int(c.blue * 255)
    )


# ---------------------------------------------------------------------------
# Template: Modern (colored top banner)
# ---------------------------------------------------------------------------

def _build_modern(data: dict, buf: io.BytesIO) -> bytes:
    """Modern template with coloured header block."""
    accent = _hex_to_color(data.get('accent_color', '#6366f1'))
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=0.5 * cm, bottomMargin=MARGIN,
    )

    body_style = ParagraphStyle('body', fontName='Helvetica', fontSize=9.5, leading=14)
    bold_style = ParagraphStyle('bold', fontName='Helvetica-Bold', fontSize=9.5, leading=14)
    small_style = ParagraphStyle('small', fontName='Helvetica', fontSize=8.5, leading=12,
                                 textColor=colors.HexColor('#666666'))

    story = []

    # Coloured header box via Table
    name_para = Paragraph(
        f'<font size="22" color="white"><b>{_safe(data.get("name"), "Your Name")}</b></font>',
        ParagraphStyle('hname', fontName='Helvetica-Bold', fontSize=22, textColor=colors.white)
    )
    title_para = Paragraph(
        f'<font size="12" color="#e0e0ff">{_safe(data.get("title", ""))}</font>',
        ParagraphStyle('htitle', fontName='Helvetica', fontSize=12, textColor=colors.HexColor('#e0e0ff'))
    )
    contacts = ' | '.join(filter(None, [
        data.get('email'), data.get('phone'), data.get('location'),
        data.get('linkedin'), data.get('github')
    ]))
    contact_para = Paragraph(
        f'<font size="9" color="#c0c0e0">{contacts}</font>',
        ParagraphStyle('hcon', fontName='Helvetica', fontSize=9, textColor=colors.HexColor('#c0c0e0'))
    )

    header_table = Table(
        [[name_para], [title_para], [contact_para]],
        colWidths=[PAGE_W - 2 * MARGIN],
    )
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), accent),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.4 * cm))

    def section_heading(title):
        return [
            Spacer(1, 0.25 * cm),
            Table(
                [[Paragraph(f'<font color="#{_color_hex(accent)}" size="11"><b>{title.upper()}</b></font>',
                             ParagraphStyle('sh', fontName='Helvetica-Bold', fontSize=11))]],
                colWidths=[PAGE_W - 2 * MARGIN],
                style=[('LINEBELOW', (0, 0), (-1, -1), 1, accent),
                       ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]
            ),
            Spacer(1, 0.1 * cm),
        ]

    if data.get('summary'):
        story += section_heading('Summary')
        story.append(Paragraph(data['summary'], body_style))

    skills = _list_val(data.get('skills'))
    if skills:
        story += section_heading('Skills')
        story.append(Paragraph(' • '.join(skills), body_style))

    experience = _list_val(data.get('experience'))
    if experience:
        story += section_heading('Experience')
        for exp in experience:
            story.append(KeepTogether([
                Paragraph(f"<b>{_safe(exp.get('title'))}</b> @ {_safe(exp.get('company'))}", bold_style),
                Paragraph(f"{_safe(exp.get('start_date'))} – {_safe(exp.get('end_date', 'Present'))}", small_style),
                Paragraph(_safe(exp.get('description')), body_style),
                Spacer(1, 0.2 * cm),
            ]))

    education = _list_val(data.get('education'))
    if education:
        story += section_heading('Education')
        for edu in education:
            story.append(KeepTogether([
                Paragraph(f"<b>{_safe(edu.get('degree'))}</b> — {_safe(edu.get('institution'))}", bold_style),
                Paragraph(f"{_safe(edu.get('year'))}", small_style),
                Spacer(1, 0.1 * cm),
            ]))

    projects = _list_val(data.get('projects'))
    if projects:
        story += section_heading('Projects')
        for proj in projects:
            story.append(KeepTogether([
                Paragraph(f"<b>{_safe(proj.get('name'))}</b>", bold_style),
                Paragraph(_safe(proj.get('description')), body_style),
                Spacer(1, 0.1 * cm),
            ]))

    certs = _list_val(data.get('certifications'))
    if certs:
        story += section_heading('Certifications')
        for cert in certs:
            story.append(Paragraph(
                f"• <b>{_safe(cert.get('name'))}</b>  {_safe(cert.get('issuer', ''))}",
                body_style
            ))

    doc.build(story)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Template: Minimal (clean whitespace-heavy design)
# ---------------------------------------------------------------------------

def _build_minimal(data: dict, buf: io.BytesIO) -> bytes:
    accent = _hex_to_color(data.get('accent_color', '#6366f1'))
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2.2 * cm, rightMargin=2.2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )

    story = []
    h1 = ParagraphStyle('h1', fontName='Helvetica-Bold', fontSize=24, leading=30,
                         textColor=colors.HexColor('#111111'))
    h2 = ParagraphStyle('h2', fontName='Helvetica', fontSize=13, leading=18,
                         textColor=colors.HexColor('#555555'))
    body = ParagraphStyle('body', fontName='Helvetica', fontSize=9.5, leading=15,
                          textColor=colors.HexColor('#333333'))
    small = ParagraphStyle('small', fontName='Helvetica', fontSize=8.5, leading=12,
                           textColor=colors.HexColor('#888888'))
    sec_style = ParagraphStyle('sec', fontName='Helvetica-Bold', fontSize=10, leading=14,
                               textColor=accent)

    story.append(Paragraph(_safe(data.get('name'), 'Your Name'), h1))
    if data.get('title'):
        story.append(Paragraph(data['title'], h2))
    story.append(Spacer(1, 0.1 * cm))

    contacts = ' · '.join(filter(None, [
        data.get('email'), data.get('phone'), data.get('location')
    ]))
    if contacts:
        story.append(Paragraph(contacts, small))
    story.append(Spacer(1, 0.5 * cm))

    def sec(title):
        return [
            Paragraph(title.upper(), sec_style),
            HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#dddddd')),
            Spacer(1, 0.15 * cm),
        ]

    if data.get('summary'):
        story += sec('Summary')
        story.append(Paragraph(data['summary'], body))
        story.append(Spacer(1, 0.3 * cm))

    skills = _list_val(data.get('skills'))
    if skills:
        story += sec('Skills')
        story.append(Paragraph(' · '.join(skills), body))
        story.append(Spacer(1, 0.3 * cm))

    experience = _list_val(data.get('experience'))
    if experience:
        story += sec('Experience')
        for exp in experience:
            story.append(KeepTogether([
                Paragraph(f"<b>{_safe(exp.get('title'))}</b>  {_safe(exp.get('company'))}", body),
                Paragraph(f"{_safe(exp.get('start_date'))} – {_safe(exp.get('end_date', 'Present'))}", small),
                Paragraph(_safe(exp.get('description')), body),
                Spacer(1, 0.2 * cm),
            ]))
        story.append(Spacer(1, 0.1 * cm))

    education = _list_val(data.get('education'))
    if education:
        story += sec('Education')
        for edu in education:
            story.append(KeepTogether([
                Paragraph(f"<b>{_safe(edu.get('degree'))}</b>  {_safe(edu.get('institution'))}", body),
                Paragraph(_safe(edu.get('year', '')), small),
                Spacer(1, 0.1 * cm),
            ]))

    doc.build(story)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_pdf(resume_data: dict, template_name: str = None) -> bytes:
    """
    Generate a PDF resume and return bytes.
    template_name overrides resume_data['template_name'] if provided.
    """
    template = template_name or resume_data.get('template_name', 'modern')
    buf = io.BytesIO()

    if template == 'modern':
        return _build_modern(resume_data, buf)
    elif template == 'minimal':
        return _build_minimal(resume_data, buf)
    elif template in ('ats_professional', 'two_column'):
        return _build_ats_professional(resume_data, buf)
    else:
        return _build_modern(resume_data, buf)
