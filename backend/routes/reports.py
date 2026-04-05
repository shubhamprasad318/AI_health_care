"""
Health Report PDF Generation Routes
"""

from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from database.connection import db, get_user_by_email
from utils.security import require_auth
from utils.helpers import standard_response, serialize_date
from datetime import datetime, timedelta
from io import BytesIO
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])


async def _gather_report_data(email: str, days: int) -> dict:
    """Gather all health data for report generation"""
    cutoff = datetime.utcnow() - timedelta(days=days)

    # User profile
    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = {
        "name": user.get("name")
        or f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        or "User",
        "email": email,
        "age": user.get("age"),
        "gender": user.get("gender"),
        "phone": user.get("phone") or user.get("phone_number"),
        "city": user.get("city"),
        "state": user.get("state"),
    }

    # Health metrics
    metrics = {
        "height": user.get("height"),
        "weight": user.get("weight"),
        "bmi": user.get("bmi"),
        "blood_pressure": user.get("pressure"),
    }

    # Predictions
    pred_cursor = db.predictions.find(
        {"email": email, "created_at": {"$gte": cutoff}}
    ).sort("created_at", -1)
    predictions = await pred_cursor.to_list(length=100)

    # Appointments
    appt_cursor = db.appointments.find({"user_email": email}).sort("date", -1).limit(50)
    appointments = await appt_cursor.to_list(length=50)

    # Medications
    med_cursor = db.medications.find({"email": email, "active": True}).sort(
        "created_at", -1
    )
    medications = await med_cursor.to_list(length=50)

    # Medication adherence stats
    log_cutoff = datetime.utcnow() - timedelta(days=30)
    total_logs = await db.medication_logs.count_documents(
        {"email": email, "logged_at": {"$gte": log_cutoff}}
    )
    taken_logs = await db.medication_logs.count_documents(
        {"email": email, "logged_at": {"$gte": log_cutoff}, "skipped": False}
    )

    # Journal entries
    journal_cursor = (
        db.journal_entries.find({"email": email, "created_at": {"$gte": cutoff}})
        .sort("created_at", -1)
        .limit(20)
    )
    journal_entries = await journal_cursor.to_list(length=20)

    return {
        "profile": profile,
        "metrics": metrics,
        "predictions": predictions,
        "appointments": appointments,
        "medications": medications,
        "adherence": {"total": total_logs, "taken": taken_logs},
        "journal_entries": journal_entries,
        "period_days": days,
        "generated_at": datetime.utcnow(),
    }


def _generate_pdf(data: dict) -> BytesIO:
    """Generate PDF report from collected data"""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import inch, mm
    from reportlab.lib.colors import HexColor, white, black
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
        HRFlowable,
        KeepTogether,
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(
        ParagraphStyle(
            "ReportTitle",
            parent=styles["Title"],
            fontSize=24,
            textColor=HexColor("#2563EB"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            "SectionHeader",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=HexColor("#1e40af"),
            spaceBefore=16,
            spaceAfter=8,
            borderPadding=(0, 0, 4, 0),
        )
    )
    styles.add(
        ParagraphStyle(
            "SubHeader",
            parent=styles["Heading3"],
            fontSize=11,
            textColor=HexColor("#374151"),
            spaceBefore=8,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            "InfoText",
            parent=styles["Normal"],
            fontSize=10,
            textColor=HexColor("#4b5563"),
            spaceAfter=3,
        )
    )
    styles.add(
        ParagraphStyle(
            "SmallText",
            parent=styles["Normal"],
            fontSize=8,
            textColor=HexColor("#6b7280"),
        )
    )
    styles.add(
        ParagraphStyle(
            "CenterText",
            parent=styles["Normal"],
            fontSize=10,
            alignment=TA_CENTER,
            textColor=HexColor("#6b7280"),
        )
    )

    elements = []
    profile = data["profile"]
    metrics = data["metrics"]

    # --- Header ---
    elements.append(Paragraph("AI Health Care", styles["ReportTitle"]))
    elements.append(Paragraph("Personal Health Report", styles["CenterText"]))
    elements.append(Spacer(1, 4))
    elements.append(
        Paragraph(
            f"Generated: {data['generated_at'].strftime('%B %d, %Y at %I:%M %p')} | "
            f"Period: Last {data['period_days']} days",
            styles["CenterText"],
        )
    )
    elements.append(Spacer(1, 6))
    elements.append(HRFlowable(width="100%", thickness=2, color=HexColor("#2563EB")))
    elements.append(Spacer(1, 12))

    # --- Patient Information ---
    elements.append(Paragraph("Patient Information", styles["SectionHeader"]))
    patient_data = [
        ["Name", profile.get("name") or "N/A", "Email", profile.get("email") or "N/A"],
        [
            "Age",
            str(profile.get("age") or "N/A"),
            "Gender",
            profile.get("gender") or "N/A",
        ],
        [
            "Phone",
            profile.get("phone") or "N/A",
            "Location",
            f"{profile.get('city') or ''}, {profile.get('state') or ''}".strip(", ")
            or "N/A",
        ],
    ]
    patient_table = Table(
        patient_data, colWidths=[1.2 * inch, 2 * inch, 1.2 * inch, 2 * inch]
    )
    patient_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), HexColor("#eff6ff")),
                ("BACKGROUND", (2, 0), (2, -1), HexColor("#eff6ff")),
                ("TEXTCOLOR", (0, 0), (-1, -1), HexColor("#1f2937")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#d1d5db")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    elements.append(patient_table)
    elements.append(Spacer(1, 12))

    # --- Health Metrics ---
    elements.append(Paragraph("Health Metrics", styles["SectionHeader"]))
    bmi_val = metrics.get("bmi")
    bmi_display = bmi_val or "Not recorded"
    if bmi_val:
        try:
            bv = float(bmi_val)
            if bv < 18.5:
                bmi_display = f"{bmi_val} (Underweight)"
            elif bv < 25:
                bmi_display = f"{bmi_val} (Normal)"
            elif bv < 30:
                bmi_display = f"{bmi_val} (Overweight)"
            else:
                bmi_display = f"{bmi_val} (Obese)"
        except ValueError:
            pass

    metrics_data = [
        [
            "Height",
            metrics.get("height") or "Not recorded",
            "Weight",
            metrics.get("weight") or "Not recorded",
        ],
        [
            "BMI",
            bmi_display,
            "Blood Pressure",
            metrics.get("blood_pressure") or "Not recorded",
        ],
    ]
    metrics_table = Table(
        metrics_data, colWidths=[1.2 * inch, 2 * inch, 1.2 * inch, 2 * inch]
    )
    metrics_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), HexColor("#f0fdf4")),
                ("BACKGROUND", (2, 0), (2, -1), HexColor("#f0fdf4")),
                ("TEXTCOLOR", (0, 0), (-1, -1), HexColor("#1f2937")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#d1d5db")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    elements.append(metrics_table)
    elements.append(Spacer(1, 12))

    # --- Active Medications ---
    medications = data.get("medications", [])
    elements.append(
        Paragraph(f"Active Medications ({len(medications)})", styles["SectionHeader"])
    )
    if medications:
        med_header = ["Medication", "Dosage", "Frequency", "Started"]
        med_rows = [med_header]
        for med in medications[:20]:
            freq_map = {
                "once_daily": "Once daily",
                "twice_daily": "Twice daily",
                "three_times": "3x daily",
                "four_times": "4x daily",
                "as_needed": "As needed",
                "weekly": "Weekly",
            }
            med_rows.append(
                [
                    med.get("name", "N/A"),
                    med.get("dosage", "N/A"),
                    freq_map.get(med.get("frequency", ""), med.get("frequency", "N/A")),
                    serialize_date(med.get("start_date"), fmt="human"),
                ]
            )
        med_table = Table(
            med_rows, colWidths=[1.8 * inch, 1.3 * inch, 1.3 * inch, 2 * inch]
        )
        med_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#2563EB")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#d1d5db")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f9fafb")]),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(med_table)

        # Adherence
        adherence = data.get("adherence", {})
        total = adherence.get("total", 0)
        taken = adherence.get("taken", 0)
        rate = round((taken / total) * 100, 1) if total > 0 else 0
        elements.append(Spacer(1, 6))
        elements.append(
            Paragraph(
                f"<b>30-Day Adherence:</b> {taken}/{total} doses taken ({rate}%)",
                styles["InfoText"],
            )
        )
    else:
        elements.append(
            Paragraph("No active medications recorded.", styles["InfoText"])
        )
    elements.append(Spacer(1, 12))

    # --- Disease Predictions ---
    predictions = data.get("predictions", [])
    elements.append(
        Paragraph(f"Disease Predictions ({len(predictions)})", styles["SectionHeader"])
    )
    if predictions:
        pred_header = ["Date", "Predicted Condition", "Specialist", "Symptoms"]
        pred_rows = [pred_header]
        for pred in predictions[:15]:
            symptoms = pred.get("symptoms", {})
            if isinstance(symptoms, dict):
                symptom_list = [k for k, v in symptoms.items() if v == 1]
                symptom_str = ", ".join(symptom_list[:5])
                if len(symptom_list) > 5:
                    symptom_str += f" +{len(symptom_list) - 5} more"
            else:
                symptom_str = str(symptoms)[:60]

            pred_rows.append(
                [
                    serialize_date(pred.get("created_at"), fmt="human"),
                    pred.get("ml_prediction", "N/A"),
                    pred.get("specialist", "N/A"),
                    Paragraph(symptom_str or "N/A", styles["SmallText"]),
                ]
            )
        pred_table = Table(
            pred_rows, colWidths=[1.4 * inch, 1.6 * inch, 1.2 * inch, 2.2 * inch]
        )
        pred_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#0891B2")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#d1d5db")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f9fafb")]),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(pred_table)
    else:
        elements.append(
            Paragraph("No disease predictions in this period.", styles["InfoText"])
        )
    elements.append(Spacer(1, 12))

    # --- Appointments ---
    appointments = data.get("appointments", [])
    elements.append(
        Paragraph(f"Appointments ({len(appointments)})", styles["SectionHeader"])
    )
    if appointments:
        appt_header = ["Date", "Time", "Doctor", "Specialization"]
        appt_rows = [appt_header]
        for appt in appointments[:15]:
            appt_rows.append(
                [
                    appt.get("date", "N/A"),
                    appt.get("time", "N/A"),
                    appt.get("doctorName", "N/A"),
                    appt.get("doctorSpecialization", "N/A"),
                ]
            )
        appt_table = Table(
            appt_rows, colWidths=[1.4 * inch, 1.2 * inch, 2 * inch, 1.8 * inch]
        )
        appt_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#7c3aed")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#d1d5db")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f9fafb")]),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(appt_table)
    else:
        elements.append(Paragraph("No appointments recorded.", styles["InfoText"]))
    elements.append(Spacer(1, 12))

    # --- Journal Entries Summary ---
    journal = data.get("journal_entries", [])
    elements.append(
        Paragraph(f"Health Journal ({len(journal)} entries)", styles["SectionHeader"])
    )
    if journal:
        mood_emoji = {
            "great": "Excellent",
            "good": "Good",
            "okay": "Fair",
            "bad": "Poor",
            "terrible": "Bad",
        }
        for entry in journal[:10]:
            entry_block = []
            title = entry.get("title", "Untitled")
            date = serialize_date(entry.get("created_at"), fmt="human")
            mood = mood_emoji.get(entry.get("mood", ""), entry.get("mood", ""))
            pain = entry.get("pain_level")

            header_text = f"<b>{title}</b> — {date}"
            if mood:
                header_text += f" | Mood: {mood}"
            if pain is not None:
                header_text += f" | Pain: {pain}/10"
            entry_block.append(Paragraph(header_text, styles["InfoText"]))

            content = entry.get("content", "")
            if content:
                truncated = content[:200] + ("..." if len(content) > 200 else "")
                entry_block.append(Paragraph(truncated, styles["SmallText"]))

            entry_block.append(Spacer(1, 6))
            elements.append(KeepTogether(entry_block))
    else:
        elements.append(
            Paragraph("No journal entries in this period.", styles["InfoText"])
        )

    # --- Footer ---
    elements.append(Spacer(1, 24))
    elements.append(HRFlowable(width="100%", thickness=1, color=HexColor("#d1d5db")))
    elements.append(Spacer(1, 8))
    elements.append(
        Paragraph(
            "<b>Disclaimer:</b> This report is generated from self-reported data and AI-assisted "
            "predictions. It is NOT a substitute for professional medical advice, diagnosis, or "
            "treatment. Always consult a qualified healthcare provider.",
            styles["SmallText"],
        )
    )
    elements.append(Spacer(1, 4))
    elements.append(
        Paragraph(
            f"AI Health Care Platform | Report ID: RPT-{data['generated_at'].strftime('%Y%m%d%H%M%S')}",
            ParagraphStyle("Footer", parent=styles["SmallText"], alignment=TA_CENTER),
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer


@router.get("/generate")
async def generate_health_report(
    request: Request,
    days: int = Query(90, ge=7, le=365, description="Report period in days"),
):
    """Generate a comprehensive PDF health report"""
    try:
        email = await require_auth(request)
        logger.info(f"Generating health report for {email}, period: {days} days")

        # Gather all data
        report_data = await _gather_report_data(email, days)

        # Generate PDF
        pdf_buffer = _generate_pdf(report_data)

        filename = f"health_report_{datetime.utcnow().strftime('%Y%m%d')}.pdf"

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Cache-Control": "no-cache",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate health report")


@router.get("/summary")
async def get_report_summary(
    request: Request,
    days: int = Query(90, ge=7, le=365),
):
    """Get report data summary (without PDF generation)"""
    try:
        email = await require_auth(request)
        report_data = await _gather_report_data(email, days)

        # Return summary stats (not full data — for preview)
        return standard_response(
            message="Report summary retrieved",
            data={
                "profile": report_data["profile"],
                "metrics": report_data["metrics"],
                "counts": {
                    "predictions": len(report_data["predictions"]),
                    "appointments": len(report_data["appointments"]),
                    "medications": len(report_data["medications"]),
                    "journal_entries": len(report_data["journal_entries"]),
                },
                "adherence": report_data["adherence"],
                "period_days": days,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report summary error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get report summary")
