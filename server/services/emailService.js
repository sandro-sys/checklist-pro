import nodemailer from 'nodemailer';

// Configurar transporter
const createTransporter = () => {
  // Se tiver SMTP configurado, usa ele
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Fallback para Gmail (precisa de App Password)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // 10 segundos
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
  }

  // Modo desenvolvimento - apenas loga
  console.log('⚠️ Email service: Modo desenvolvimento (emails serao apenas logados)');
  return null;
};

const transporter = createTransporter();

// Template base do email
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CheckList Pro</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: #1f2937;
      margin-top: 0;
    }
    .highlight-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .details-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .details-table td:first-child {
      color: #6b7280;
      width: 40%;
    }
    .details-table td:last-child {
      font-weight: 600;
      color: #1f2937;
    }
    .footer {
      background-color: #1f2937;
      color: #9ca3af;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
    }
    .footer a {
      color: #f59e0b;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>CheckList Pro - Sistema de Gestao de Checklists</p>
      <p><a href="https://checklist-pro.rhumarh.com">checklist-pro.rhumarh.com</a></p>
      <p style="margin-top: 15px; font-size: 12px;">
        Este email foi enviado automaticamente. Por favor, nao responda.
      </p>
    </div>
  </div>
</body>
</html>
`;

// Email de confirmacao de assinatura
export const sendSubscriptionConfirmation = async (to, data) => {
  const { userName, companyName, planName, price, expiresAt } = data;
  
  const formattedDate = new Date(expiresAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const html = baseTemplate(`
    <div class="header">
      <h1>CheckList Pro</h1>
      <p>Assinatura Confirmada!</p>
    </div>
    <div class="content">
      <h2>Ola, ${userName}!</h2>
      <p>Sua assinatura do <strong>CheckList Pro</strong> foi ativada com sucesso!</p>
      
      <div class="highlight-box">
        <strong>Parabens!</strong> Agora voce tem acesso a todos os recursos do plano ${planName}.
      </div>
      
      <table class="details-table">
        <tr>
          <td>Empresa</td>
          <td>${companyName}</td>
        </tr>
        <tr>
          <td>Plano</td>
          <td>${planName}</td>
        </tr>
        <tr>
          <td>Valor</td>
          <td>R$ ${price.toFixed(2).replace('.', ',')}/mes</td>
        </tr>
        <tr>
          <td>Proxima cobranca</td>
          <td>${formattedDate}</td>
        </tr>
      </table>
      
      <p>Acesse sua conta para comecar a criar seus checklists:</p>
      
      <center>
        <a href="https://checklist-pro.rhumarh.com/dashboard" class="button">
          Acessar Dashboard
        </a>
      </center>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Se voce tiver alguma duvida, entre em contato conosco.
      </p>
    </div>
  `);

  return sendEmail(to, 'Assinatura Confirmada - CheckList Pro', html);
};

// Email de pagamento recebido
export const sendPaymentReceived = async (to, data) => {
  const { userName, companyName, planName, amount, paymentMethod, paymentDate } = data;
  
  const formattedDate = new Date(paymentDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = baseTemplate(`
    <div class="header">
      <h1>CheckList Pro</h1>
      <p>Pagamento Recebido</p>
    </div>
    <div class="content">
      <h2>Ola, ${userName}!</h2>
      <p>Recebemos seu pagamento com sucesso!</p>
      
      <table class="details-table">
        <tr>
          <td>Empresa</td>
          <td>${companyName}</td>
        </tr>
        <tr>
          <td>Plano</td>
          <td>${planName}</td>
        </tr>
        <tr>
          <td>Valor</td>
          <td>R$ ${amount.toFixed(2).replace('.', ',')}</td>
        </tr>
        <tr>
          <td>Metodo</td>
          <td>${paymentMethod}</td>
        </tr>
        <tr>
          <td>Data</td>
          <td>${formattedDate}</td>
        </tr>
      </table>
      
      <div class="highlight-box">
        Sua assinatura foi renovada por mais 30 dias.
      </div>
      
      <center>
        <a href="https://checklist-pro.rhumarh.com/dashboard" class="button">
          Acessar Dashboard
        </a>
      </center>
    </div>
  `);

  return sendEmail(to, 'Pagamento Recebido - CheckList Pro', html);
};

// Email de trial ativado
export const sendTrialActivated = async (to, data) => {
  const { userName, companyName, expiresAt } = data;
  
  const formattedDate = new Date(expiresAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const html = baseTemplate(`
    <div class="header">
      <h1>CheckList Pro</h1>
      <p>Trial Ativado!</p>
    </div>
    <div class="content">
      <h2>Bem-vindo, ${userName}!</h2>
      <p>Seu periodo de teste gratuito foi ativado com sucesso!</p>
      
      <div class="highlight-box">
        Voce tem <strong>14 dias gratis</strong> para experimentar o CheckList Pro.
      </div>
      
      <table class="details-table">
        <tr>
          <td>Empresa</td>
          <td>${companyName}</td>
        </tr>
        <tr>
          <td>Plano</td>
          <td>Trial (14 dias)</td>
        </tr>
        <tr>
          <td>Expira em</td>
          <td>${formattedDate}</td>
        </tr>
        <tr>
          <td>Checklists</td>
          <td>Ate 3</td>
        </tr>
        <tr>
          <td>Colaboradores</td>
          <td>Ate 2</td>
        </tr>
      </table>
      
      <p>Comece agora a criar seus checklists:</p>
      
      <center>
        <a href="https://checklist-pro.rhumarh.com/checklists/create" class="button">
          Criar Primeiro Checklist
        </a>
      </center>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Apos o periodo de teste, escolha um plano para continuar usando o CheckList Pro.
      </p>
    </div>
  `);

  return sendEmail(to, 'Trial Ativado - CheckList Pro', html);
};

// Email de assinatura cancelada
export const sendSubscriptionCancelled = async (to, data) => {
  const { userName, companyName, expiresAt } = data;
  
  const formattedDate = new Date(expiresAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const html = baseTemplate(`
    <div class="header" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
      <h1>CheckList Pro</h1>
      <p>Assinatura Cancelada</p>
    </div>
    <div class="content">
      <h2>Ola, ${userName}</h2>
      <p>Sua assinatura do CheckList Pro foi cancelada conforme solicitado.</p>
      
      <div class="highlight-box">
        Voce ainda tera acesso ate <strong>${formattedDate}</strong>.
      </div>
      
      <table class="details-table">
        <tr>
          <td>Empresa</td>
          <td>${companyName}</td>
        </tr>
        <tr>
          <td>Acesso ate</td>
          <td>${formattedDate}</td>
        </tr>
      </table>
      
      <p>Sentiremos sua falta! Se mudar de ideia, voce pode reativar sua assinatura a qualquer momento:</p>
      
      <center>
        <a href="https://checklist-pro.rhumarh.com/pricing" class="button" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
          Reativar Assinatura
        </a>
      </center>
    </div>
  `);

  return sendEmail(to, 'Assinatura Cancelada - CheckList Pro', html);
};

// Email de recuperacao de senha
export const sendPasswordReset = async (to, data) => {
  const { userName, resetLink, expiresIn } = data;

  const html = baseTemplate(`
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      <h1>CheckList Pro</h1>
      <p>Recuperacao de Senha</p>
    </div>
    <div class="content">
      <h2>Ola, ${userName}!</h2>
      <p>Recebemos uma solicitacao para redefinir sua senha.</p>
      
      <div class="highlight-box" style="background-color: #fef2f2; border-left-color: #ef4444;">
        <strong>Atencao:</strong> Este link expira em <strong>${expiresIn}</strong>.
      </div>
      
      <p>Clique no botao abaixo para criar uma nova senha:</p>
      
      <center>
        <a href="${resetLink}" class="button" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
          Redefinir Senha
        </a>
      </center>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Se voce nao solicitou a recuperacao de senha, ignore este email. Sua senha permanecera a mesma.
      </p>
      
      <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
        Se o botao nao funcionar, copie e cole este link no seu navegador:<br>
        <a href="${resetLink}" style="color: #ef4444; word-break: break-all;">${resetLink}</a>
      </p>
    </div>
  `);

  return sendEmail(to, 'Recuperacao de Senha - CheckList Pro', html);
};

// Email de comprovante de checklist concluido
export const sendChecklistCertificate = async (to, data, imageBuffer) => {
  const { userName, checklistTitle, companyName, executedAt, completionRate } = data;
  
  const formattedDate = new Date(executedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = baseTemplate(`
    <div class="header" style="background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);">
      <h1>CheckList Pro</h1>
      <p>Checklist Concluido!</p>
    </div>
    <div class="content">
      <h2>Ola, ${userName}!</h2>
      <p>O checklist foi concluido com sucesso. Segue em anexo o comprovante.</p>
      
      <div class="highlight-box" style="background-color: #eef2ff; border-left-color: #6366f1;">
        <strong>${checklistTitle}</strong><br>
        Taxa de conformidade: <strong>${completionRate}%</strong>
      </div>
      
      <table class="details-table">
        <tr>
          <td>Empresa</td>
          <td>${companyName}</td>
        </tr>
        <tr>
          <td>Checklist</td>
          <td>${checklistTitle}</td>
        </tr>
        <tr>
          <td>Data de execucao</td>
          <td>${formattedDate}</td>
        </tr>
        <tr>
          <td>Conformidade</td>
          <td>${completionRate}%</td>
        </tr>
      </table>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        O comprovante visual esta anexado a este email.
      </p>
    </div>
  `);

  return sendEmailWithAttachment(to, `Checklist Concluido: ${checklistTitle}`, html, imageBuffer, `checklist-${Date.now()}.png`);
};

// Funcao principal de envio
const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"CheckList Pro" <noreply@checklist-pro.rhumarh.com>',
    to,
    subject,
    html
  };

  if (!transporter) {
    console.log('📧 [DEV] Email que seria enviado:');
    console.log(`   Para: ${to}`);
    console.log(`   Assunto: ${subject}`);
    return { success: true, mode: 'development' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
};

// Funcao de envio com anexo
const sendEmailWithAttachment = async (to, subject, html, imageBuffer, filename) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"CheckList Pro" <noreply@checklist-pro.rhumarh.com>',
    to,
    subject,
    html,
    attachments: [
      {
        filename,
        content: imageBuffer,
        contentType: 'image/png'
      }
    ]
  };

  if (!transporter) {
    console.log('📧 [DEV] Email com anexo que seria enviado:');
    console.log(`   Para: ${to}`);
    console.log(`   Assunto: ${subject}`);
    console.log(`   Anexo: ${filename}`);
    return { success: true, mode: 'development' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email com anexo enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email com anexo:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendSubscriptionConfirmation,
  sendPaymentReceived,
  sendTrialActivated,
  sendSubscriptionCancelled,
  sendChecklistCertificate,
  sendPasswordReset
};

