import io
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models import User

class ExportService:
    @staticmethod
    def generate_pdf_report(user: User, data: dict) -> bytes:
        """
        Generates a comprehensive executive PDF report synchronizing precisely
        with the web interface: Live KPIs, Connected Feeds, Top Posts, Revenue Deals,
        and AI Recommendations.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=14
        )
        section_style = ParagraphStyle(
            'ReportSection',
            parent=styles['Heading2'],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#4f46e5"),
            spaceBefore=12,
            spaceAfter=6
        )
        cell_style = ParagraphStyle(
            'CellText',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#1e293b")
        )
        cell_bold = ParagraphStyle(
            'CellBold',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#0f172a")
        )

        story = []

        # 1. Header
        story.append(Paragraph("CreatorIQ Executive Performance & Intelligence Audit", title_style))
        story.append(Paragraph(
            f"Prepared for: <b>{user.full_name or user.email}</b> ({user.role.value if hasattr(user.role, 'value') else str(user.role)}) &bull; "
            f"Generated: {datetime.utcnow().strftime('%B %d, %Y - %H:%M UTC')} &bull; Status: Real-Time Synced",
            subtitle_style
        ))

        # 2. Executive Performance Summary KPIs
        story.append(Paragraph("1. Live Web Interface KPIs", section_style))
        summary = data.get("summary", {})
        kpi_rows = [
            ["Metric Tile", "Current Live Value", "Status / Benchmark"],
            ["Total Audience Reach", f"{summary.get('total_followers', 0):,}", "Across all linked accounts"],
            ["Total Video & Post Views", f"{summary.get('total_views', 0):,}", "Blended cross-platform telemetry"],
            ["Total Monetized Revenue", f"${summary.get('total_revenue', 0.0):,.2f}", "Sponsorships, AdSense & Deals"],
            ["Blended Engagement Rate", f"{summary.get('engagement_rate', 0.0)}%", "Industry benchmark: 3.2%"],
            ["Active Channels Connected", f"{summary.get('connected_channels', 0)} Channels", "YouTube, Instagram, LinkedIn"]
        ]
        t_kpi = Table(kpi_rows, colWidths=[200, 160, 180])
        t_kpi.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white])
        ]))
        story.append(t_kpi)
        story.append(Spacer(1, 10))

        # 3. Connected Social Media Accounts Table
        story.append(Paragraph("2. Active Social Ingestion Feeds", section_style))
        accounts = data.get("accounts", [])
        if accounts:
            acc_rows = [["Platform", "Account Handle", "Followers / Subscribers", "Status"]]
            for a in accounts:
                acc_rows.append([
                    a.get("platform", "").capitalize(),
                    a.get("account_handle", ""),
                    f"{a.get('follower_count', 0):,}",
                    "Active (Synced)" if a.get("is_active", True) else "Inactive"
                ])
        else:
            acc_rows = [["Platform", "Account Handle", "Followers", "Status"], ["None", "No channels connected yet", "0", "-"]]
        t_acc = Table(acc_rows, colWidths=[120, 200, 120, 100])
        t_acc.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4338ca")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white])
        ]))
        story.append(t_acc)
        story.append(Spacer(1, 10))

        # 4. Tracked Content Posts Table
        story.append(Paragraph("3. Top Content Performance Analytics", section_style))
        posts = data.get("posts", [])
        if posts:
            post_rows = [["Title / Hook", "Platform", "Views", "Likes", "Engagement"]]
            for p in posts[:6]:
                post_rows.append([
                    Paragraph(p.get("title", ""), cell_bold),
                    p.get("platform", "").capitalize(),
                    f"{p.get('views', 0):,}",
                    f"{p.get('likes', 0):,}",
                    f"{p.get('engagement_rate', 0.0)}%"
                ])
        else:
            post_rows = [["Title", "Platform", "Views", "Likes", "Engagement"], ["No posts tracked yet", "-", "0", "0", "0.0%"]]
        t_posts = Table(post_rows, colWidths=[240, 70, 75, 75, 80])
        t_posts.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0284c7")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white])
        ]))
        story.append(t_posts)
        story.append(Spacer(1, 10))

        # 5. Tracked Revenue Deals Table
        story.append(Paragraph("4. Monetization Pipeline & Deals", section_style))
        revenues = data.get("revenues", [])
        if revenues:
            rev_rows = [["Contract / Deal", "Brand Partner", "Stream Type", "Amount", "Status"]]
            for r in revenues[:6]:
                rev_rows.append([
                    Paragraph(r.get("title", ""), cell_style),
                    r.get("brand_name", "N/A"),
                    r.get("source_type", "Sponsorship"),
                    f"${r.get('amount', 0.0):,.2f}",
                    r.get("status", "Completed")
                ])
        else:
            rev_rows = [["Contract", "Brand", "Type", "Amount", "Status"], ["No revenue deals recorded", "-", "-", "$0.00", "-"]]
        t_rev = Table(rev_rows, colWidths=[180, 120, 90, 80, 70])
        t_rev.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#059669")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white])
        ]))
        story.append(t_rev)
        story.append(Spacer(1, 10))

        # 6. Strategic AI Recommendations
        story.append(Paragraph("5. AI Strategic Recommendations", section_style))
        recs = data.get("recommendations", [])
        rec_rows = [["Area", "Insight", "Impact"]]
        for r in recs[:3]:
            rec_rows.append([
                r.get("category", "Strategy"),
                Paragraph(f"<b>{r.get('title', '')}</b>: {r.get('description', '')}", cell_style),
                r.get("impact", "High")
            ])
        t_rec = Table(rec_rows, colWidths=[90, 370, 80])
        t_rec.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#d97706")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white])
        ]))
        story.append(t_rec)

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_csv_report(user: User, data: dict) -> str:
        """
        Generates a multi-section structured CSV containing complete web interface data:
        KPI Summary, Social Feeds, Posts, Revenue Deals, and Recommendations.
        """
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["CREATORIQ AUDIT & DATA EXPORT"])
        writer.writerow(["User Email", user.email])
        writer.writerow(["Role", user.role.value if hasattr(user.role, "value") else str(user.role)])
        writer.writerow(["Exported At", datetime.utcnow().isoformat()])
        writer.writerow([])

        # Section 1: Executive KPI Summary
        summary = data.get("summary", {})
        writer.writerow(["[1. EXECUTIVE KPI SUMMARY]"])
        writer.writerow(["Total Audience Reach", summary.get("total_followers", 0)])
        writer.writerow(["Total Video & Post Views", summary.get("total_views", 0)])
        writer.writerow(["Total Monetized Revenue (USD)", summary.get("total_revenue", 0.0)])
        writer.writerow(["Blended Engagement Rate (%)", summary.get("engagement_rate", 0.0)])
        writer.writerow(["Connected Channels Count", summary.get("connected_channels", 0)])
        writer.writerow([])

        # Section 2: Connected Social Accounts
        writer.writerow(["[2. ACTIVE SOCIAL INGESTION FEEDS]"])
        writer.writerow(["Platform", "Account Handle", "Followers", "Status"])
        for a in data.get("accounts", []):
            writer.writerow([a.get("platform"), a.get("account_handle"), a.get("follower_count"), "Active" if a.get("is_active") else "Inactive"])
        writer.writerow([])

        # Section 3: Content Posts
        writer.writerow(["[3. CONTENT PERFORMANCE ANALYTICS]"])
        writer.writerow(["Title", "Platform", "Views", "Likes", "Comments", "Shares", "Engagement Rate (%)"])
        for p in data.get("posts", []):
            writer.writerow([p.get("title"), p.get("platform"), p.get("views"), p.get("likes"), p.get("comments"), p.get("shares"), p.get("engagement_rate")])
        writer.writerow([])

        # Section 4: Revenue & Deals
        writer.writerow(["[4. MONETIZATION CONTRACTS & REVENUE]"])
        writer.writerow(["Deal Title", "Brand Partner", "Source Type", "Amount (USD)", "Status", "Date"])
        for r in data.get("revenues", []):
            writer.writerow([r.get("title"), r.get("brand_name"), r.get("source_type"), r.get("amount"), r.get("status"), r.get("deal_date")])
        writer.writerow([])

        # Section 5: Strategic Recommendations
        writer.writerow(["[5. AI STRATEGIC RECOMMENDATIONS]"])
        writer.writerow(["Category", "Title", "Description", "Impact", "Platform"])
        for rec in data.get("recommendations", []):
            writer.writerow([rec.get("category"), rec.get("title"), rec.get("description"), rec.get("impact"), rec.get("platform")])

        return output.getvalue()
