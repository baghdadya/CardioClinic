"""
Email service for sending prescriptions and appointment reminders.
Generic SMTP — works with Gmail, Outlook, SendGrid, or any SMTP server.
"""

import asyncio
import logging
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from smtplib import SMTP, SMTP_SSL, SMTPException
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.enums import AuditAction
from app.services.audit import log_audit

logger = logging.getLogger(__name__)


def _create_smtp_connection() -> SMTP:
    if settings.SMTP_USE_TLS:
        server = SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
    else:
        server = SMTP(settings.SMTP_HOST, settings.SMTP_PORT)

    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

    return server


def _send_email_sync(
    to_email: str,
    subject: str,
    body_html: str,
    attachment_path: str | None = None,
    attachment_name: str | None = None,
) -> bool:
    if not settings.SMTP_HOST:
        logger.warning("SMTP not configured, skipping email send")
        return False

    msg = MIMEMultipart()
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body_html, "html", "utf-8"))

    if attachment_path and Path(attachment_path).exists():
        with open(attachment_path, "rb") as f:
            attach = MIMEApplication(f.read(), _subtype="pdf")
            attach.add_header(
                "Content-Disposition",
                "attachment",
                filename=attachment_name or Path(attachment_path).name,
            )
            msg.attach(attach)

    try:
        server = _create_smtp_connection()
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except SMTPException as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


async def send_email(
    to_email: str,
    subject: str,
    body_html: str,
    attachment_path: str | None = None,
    attachment_name: str | None = None,
) -> bool:
    """Send email asynchronously (runs SMTP in thread pool to avoid blocking)."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, _send_email_sync, to_email, subject, body_html, attachment_path, attachment_name
    )


async def send_prescription_email(
    db: AsyncSession,
    patient_email: str,
    patient_name: str,
    pdf_path: str,
    user_id: UUID,
) -> bool:
    """Send a finalized prescription PDF to a patient's email."""
    # No PHI in subject line (per contract §9.2)
    subject = "Your Prescription — CardioClinic"

    body_html = f"""
    <div style="font-family:'Source Sans 3',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="text-align:center;padding:20px 0;border-bottom:3px solid #0f4c75;">
            <h1 style="color:#0f4c75;margin:0;">CardioClinic</h1>
        </div>
        <div style="padding:20px 0;">
            <p>Dear {patient_name},</p>
            <p>Please find your prescription attached to this email.</p>
            <p>If you have any questions about your medications, please contact the clinic.</p>
            <br>
            <p style="color:#64748b;font-size:13px;">
                This is an automated message from CardioClinic.
                Please do not reply to this email.
            </p>
        </div>
        <div style="direction:rtl;text-align:right;padding:20px 0;border-top:1px solid #e2e8f0;font-family:'Noto Sans Arabic',sans-serif;">
            <p>عزيزي {patient_name}،</p>
            <p>يرجى الاطلاع على الوصفة الطبية المرفقة.</p>
            <p>في حال وجود أي استفسار، يرجى التواصل مع العيادة.</p>
        </div>
    </div>
    """

    success = await send_email(
        to_email=patient_email,
        subject=subject,
        body_html=body_html,
        attachment_path=pdf_path,
        attachment_name="prescription.pdf",
    )

    # Audit log the send attempt
    await log_audit(
        db,
        user_id=user_id,
        action=AuditAction.export,
        entity_type="email",
        new_values={
            "recipient": patient_email,
            "type": "prescription",
            "success": success,
        },
    )
    await db.commit()

    return success


async def send_appointment_reminder(
    db: AsyncSession,
    patient_email: str,
    patient_name: str,
    appointment_date: str,
    appointment_time: str,
    user_id: UUID,
) -> bool:
    """Send an appointment reminder email."""
    subject = "Appointment Reminder — CardioClinic"

    body_html = f"""
    <div style="font-family:'Source Sans 3',sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="text-align:center;padding:20px 0;border-bottom:3px solid #0f4c75;">
            <h1 style="color:#0f4c75;margin:0;">CardioClinic</h1>
        </div>
        <div style="padding:20px 0;">
            <p>Dear {patient_name},</p>
            <p>This is a reminder for your upcoming appointment:</p>
            <div style="background:#f0f4f8;padding:15px;border-radius:8px;margin:15px 0;">
                <p style="margin:5px 0;"><strong>Date:</strong> {appointment_date}</p>
                <p style="margin:5px 0;"><strong>Time:</strong> {appointment_time}</p>
            </div>
            <p>Please arrive 10 minutes early. If you need to reschedule, contact the clinic.</p>
        </div>
        <div style="direction:rtl;text-align:right;padding:20px 0;border-top:1px solid #e2e8f0;font-family:'Noto Sans Arabic',sans-serif;">
            <p>عزيزي {patient_name}،</p>
            <p>نود تذكيركم بموعدكم القادم:</p>
            <div style="background:#f0f4f8;padding:15px;border-radius:8px;margin:15px 0;">
                <p style="margin:5px 0;"><strong>التاريخ:</strong> {appointment_date}</p>
                <p style="margin:5px 0;"><strong>الوقت:</strong> {appointment_time}</p>
            </div>
            <p>يرجى الحضور قبل الموعد بعشر دقائق.</p>
        </div>
    </div>
    """

    success = await send_email(to_email=patient_email, subject=subject, body_html=body_html)

    await log_audit(
        db,
        user_id=user_id,
        action=AuditAction.export,
        entity_type="email",
        new_values={
            "recipient": patient_email,
            "type": "appointment_reminder",
            "success": success,
        },
    )
    await db.commit()

    return success
