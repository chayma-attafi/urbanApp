import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_verification_email(to_email: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/verify?token={token}"

    msg = MIMEMultipart("alternative")
    msg["From"] = f"UrbanFlow <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = "Confirmez votre compte UrbanFlow"

    text = (
        f"Bonjour,\n\n"
        f"Cliquez sur ce lien pour confirmer votre compte :\n{link}\n\n"
        f"Ce lien est valable 24h."
    )
    html = f"""
<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
  <h2 style="color:#176b87;margin-bottom:4px">UrbanFlow</h2>
  <p style="color:#555">Confirmez votre adresse email pour accéder à votre compte.</p>
  <a href="{link}"
     style="display:inline-block;background:#22C55E;color:#fff;padding:13px 28px;
            border-radius:8px;text-decoration:none;font-weight:700;margin:20px 0;font-size:15px">
    Confirmer mon compte
  </a>
  <p style="color:#999;font-size:0.82rem">
    Ce lien expire dans 24h.<br>
    Si vous n'avez pas créé de compte UrbanFlow, ignorez cet email.
  </p>
</div>
"""

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
