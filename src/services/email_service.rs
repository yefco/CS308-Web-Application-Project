use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};

use crate::models::order::OrderResponse;

#[derive(Clone)]
pub struct EmailService {
    transport: Option<AsyncSmtpTransport<Tokio1Executor>>,
    from: Option<String>,
}

impl EmailService {
    pub fn new(
        smtp_host: Option<String>,
        smtp_port: u16,
        username: Option<String>,
        password: Option<String>,
        from_name: String,
        from_email: Option<String>,
    ) -> Self {
        let transport = match (&smtp_host, &username, &password) {
            (Some(host), Some(user), Some(pass)) => {
                let creds = Credentials::new(user.clone(), pass.clone());
                match AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(host) {
                    Ok(builder) => Some(builder.credentials(creds).port(smtp_port).build()),
                    Err(e) => {
                        tracing::error!("Failed to build SMTP transport: {e}");
                        None
                    }
                }
            }
            _ => None,
        };

        let from = from_email.map(|email| format!("{from_name} <{email}>"));

        Self { transport, from }
    }

    /// Sends an HTML invoice email to `recipient_email`.
    /// Returns `Ok(true)` on success, `Ok(false)` if SMTP is not configured.
    pub async fn send_invoice(
        &self,
        order: &OrderResponse,
        recipient_email: &str,
        recipient_name: &str,
    ) -> Result<bool, String> {
        let (transport, from) = match (&self.transport, &self.from) {
            (Some(t), Some(f)) => (t, f),
            _ => return Ok(false),
        };

        let to_str = if recipient_name.is_empty() {
            recipient_email.to_string()
        } else {
            format!("{recipient_name} <{recipient_email}>")
        };

        let email = Message::builder()
            .from(from.parse().map_err(|e| format!("Invalid from: {e}"))?)
            .to(to_str.parse().map_err(|e| format!("Invalid to: {e}"))?)
            .subject(format!("Your Invoice – Order #{}", order.order_id))
            .header(ContentType::TEXT_HTML)
            .body(build_invoice_html(order, recipient_name))
            .map_err(|e| format!("Failed to build email message: {e}"))?;

        transport
            .send(email)
            .await
            .map_err(|e| format!("SMTP send failed: {e}"))?;

        Ok(true)
    }
}

fn build_invoice_html(order: &OrderResponse, recipient_name: &str) -> String {
    let rows: String = order
        .items
        .iter()
        .map(|item| {
            format!(
                "<tr>\
                   <td style='padding:8px;border:1px solid #ddd'>{}</td>\
                   <td style='padding:8px;border:1px solid #ddd;text-align:center'>{}</td>\
                   <td style='padding:8px;border:1px solid #ddd;text-align:right'>${:.2}</td>\
                   <td style='padding:8px;border:1px solid #ddd;text-align:right'>${:.2}</td>\
                 </tr>",
                item.product_name, item.quantity, item.unit_price, item.subtotal
            )
        })
        .collect();

    format!(
        r#"<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto;padding:24px">
  <h2 style="color:#1a1a2e">Invoice – Order #{order_id}</h2>
  <p>Hello {name},</p>
  <p>Thank you for your order! Below is your invoice summary.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:8px;border:1px solid #ddd;text-align:left">Product</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:center">Qty</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:right">Unit Price</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>{rows}</tbody>
    <tfoot>
      <tr style="background:#f5f5f5">
        <td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right"><strong>Total</strong></td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right"><strong>${total:.2}</strong></td>
      </tr>
    </tfoot>
  </table>
  <p><strong>Delivery address:</strong> {address}</p>
  <p><strong>Order date:</strong> {date}</p>
  <hr style="margin:24px 0">
  <p style="font-size:12px;color:#888">This is an automated message. Please do not reply to this email.</p>
</body>
</html>"#,
        order_id = order.order_id,
        name = recipient_name,
        rows = rows,
        total = order.total_amount,
        address = order.delivery_address,
        date = order.created_at.format("%Y-%m-%d %H:%M UTC"),
    )
}
