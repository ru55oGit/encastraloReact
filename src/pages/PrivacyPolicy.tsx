import { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Layout from "../components/Layout";
import AdsenseScript from "../components/AdsenseScript";
import { useLanguage } from "../i18n/LanguageContext";
import { SupportedLanguage } from "../i18n/translations";

interface PolicyContent {
  title: string;
  intro: string;
  sections: { heading: string; body: ReactNode }[];
}

const linkStyle = { color: "#ffd" };

const content: Record<SupportedLanguage, PolicyContent> = {
  es: {
    title: "Política de Privacidad",
    intro: "En Encastralo (encastralo.com) respetamos tu privacidad. Esta política explica qué información se recopila y cómo se usa.",
    sections: [
      {
        heading: "1. Información que recopilamos",
        body: "Encastralo no recopila datos personales de forma directa. Tu progreso en el juego (récord, palabras encontradas, idioma elegido) se guarda localmente en tu dispositivo (localStorage) y no se envía a ningún servidor.",
      },
      {
        heading: "2. Publicidad — Google AdSense",
        body: (
          <>
            Usamos <strong>Google AdSense</strong> para mostrar anuncios. Google puede usar cookies para personalizar los anuncios según tus intereses y el contenido que visitás. Para más información, consultá la{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Política de Privacidad de Google
            </a>. Podés optar por no recibir publicidad personalizada en{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Configuración de anuncios de Google
            </a>.
          </>
        ),
      },
      {
        heading: "3. Cookies",
        body: "Este sitio utiliza cookies propias (para guardar tu idioma y preferencias) y cookies de terceros de Google AdSense para la entrega de anuncios. Al continuar usando el sitio, aceptás el uso de cookies.",
      },
      {
        heading: "4. Servicios de terceros",
        body: "Además de Google AdSense, utilizamos nuestro propio servicio de anuncios (Boludeando Ads) y MercadoPago como procesador de pagos. No compartimos datos con otras empresas ni vendemos información a terceros.",
      },
      {
        heading: "5. Publicidad propia y pago para sacar anuncios",
        body: "Además de Google AdSense, mostramos avisos propios de otros juegos de Boludeando y anuncios \"rewarded\" (a cambio de recompensas en el juego). Para esto enviamos a nuestro propio servidor (ads-api.boludeando.com) datos anónimos: un identificador de sesión generado en tu dispositivo (sin relación con tu identidad), tu país aproximado (por IP), tipo de dispositivo e idioma. No incluye nombre, email ni ningún dato que te identifique. Si elegís comprar la opción de sacarte los anuncios, el pago se procesa a través de MercadoPago; nosotros no recibimos ni guardamos los datos de tu tarjeta — eso queda entre vos y MercadoPago.",
      },
      {
        heading: "6. Menores de edad",
        body: "Este sitio no está dirigido a menores de 13 años ni recopila intencionalmente información de ellos.",
      },
      {
        heading: "7. Cambios en esta política",
        body: "Podemos actualizar esta política en cualquier momento. Te recomendamos revisarla periódicamente. La fecha de última actualización es julio de 2026.",
      },
      {
        heading: "8. Contacto",
        body: (
          <>
            Si tenés preguntas sobre esta política, podés contactarnos en{" "}
            <a href="mailto:boludeando.app@gmail.com" style={linkStyle}>boludeando.app@gmail.com</a>.
          </>
        ),
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    intro: "At Encastralo (encastralo.com) we respect your privacy. This policy explains what information is collected and how it's used.",
    sections: [
      {
        heading: "1. Information we collect",
        body: "Encastralo does not directly collect personal data. Your game progress (record, words found, chosen language) is saved locally on your device (localStorage) and is never sent to any server.",
      },
      {
        heading: "2. Advertising — Google AdSense",
        body: (
          <>
            We use <strong>Google AdSense</strong> to display ads. Google may use cookies to personalize ads based on your interests and the content you visit. For more information, see Google's{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Privacy Policy
            </a>. You can opt out of personalized advertising in{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Google Ads Settings
            </a>.
          </>
        ),
      },
      {
        heading: "3. Cookies",
        body: "This site uses its own cookies (to save your language and preferences) and third-party cookies from Google AdSense to serve ads. By continuing to use the site, you accept the use of cookies.",
      },
      {
        heading: "4. Third-party services",
        body: "Besides Google AdSense, we use our own ad service (Boludeando Ads) and MercadoPago as a payment processor. We don't share data with other companies or sell information to third parties.",
      },
      {
        heading: "5. Our own ads and the ad-free purchase",
        body: "Besides Google AdSense, we show our own ads for other Boludeando games and \"rewarded\" ads (in exchange for in-game rewards). For this we send anonymous data to our own server (ads-api.boludeando.com): a session identifier generated on your device (not linked to your identity), your approximate country (via IP), device type, and language. It never includes your name, email, or anything that identifies you. If you choose to buy the ad-free option, the payment is processed through MercadoPago; we never receive or store your card details — that stays between you and MercadoPago.",
      },
      {
        heading: "6. Children",
        body: "This site is not directed at children under 13 and does not intentionally collect information from them.",
      },
      {
        heading: "7. Changes to this policy",
        body: "We may update this policy at any time. We recommend reviewing it periodically. Last updated: July 2026.",
      },
      {
        heading: "8. Contact",
        body: (
          <>
            If you have questions about this policy, you can reach us at{" "}
            <a href="mailto:boludeando.app@gmail.com" style={linkStyle}>boludeando.app@gmail.com</a>.
          </>
        ),
      },
    ],
  },
  pt: {
    title: "Política de Privacidade",
    intro: "No Encastralo (encastralo.com) respeitamos sua privacidade. Esta política explica quais informações são coletadas e como são usadas.",
    sections: [
      {
        heading: "1. Informações que coletamos",
        body: "O Encastralo não coleta dados pessoais diretamente. Seu progresso no jogo (recorde, palavras encontradas, idioma escolhido) é salvo localmente no seu dispositivo (localStorage) e nunca é enviado a nenhum servidor.",
      },
      {
        heading: "2. Publicidade — Google AdSense",
        body: (
          <>
            Usamos o <strong>Google AdSense</strong> para exibir anúncios. O Google pode usar cookies para personalizar os anúncios de acordo com seus interesses e o conteúdo que você visita. Para mais informações, consulte a{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Política de Privacidade do Google
            </a>. Você pode optar por não receber publicidade personalizada em{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Configurações de anúncios do Google
            </a>.
          </>
        ),
      },
      {
        heading: "3. Cookies",
        body: "Este site utiliza cookies próprios (para salvar seu idioma e preferências) e cookies de terceiros do Google AdSense para a entrega de anúncios. Ao continuar usando o site, você aceita o uso de cookies.",
      },
      {
        heading: "4. Serviços de terceiros",
        body: "Além do Google AdSense, utilizamos nosso próprio serviço de anúncios (Boludeando Ads) e o MercadoPago como processador de pagamentos. Não compartilhamos dados com outras empresas nem vendemos informações a terceiros.",
      },
      {
        heading: "5. Publicidade própria e compra para remover anúncios",
        body: "Além do Google AdSense, exibimos anúncios próprios de outros jogos do Boludeando e anúncios \"recompensados\" (em troca de recompensas no jogo). Para isso enviamos ao nosso próprio servidor (ads-api.boludeando.com) dados anônimos: um identificador de sessão gerado no seu dispositivo (sem relação com sua identidade), seu país aproximado (por IP), tipo de dispositivo e idioma. Nunca inclui nome, email ou qualquer dado que te identifique. Se você escolher comprar a opção de remover os anúncios, o pagamento é processado pelo MercadoPago; nós não recebemos nem armazenamos os dados do seu cartão — isso fica entre você e o MercadoPago.",
      },
      {
        heading: "6. Menores de idade",
        body: "Este site não é direcionado a menores de 13 anos nem coleta intencionalmente informações deles.",
      },
      {
        heading: "7. Alterações nesta política",
        body: "Podemos atualizar esta política a qualquer momento. Recomendamos revisá-la periodicamente. Última atualização: julho de 2026.",
      },
      {
        heading: "8. Contato",
        body: (
          <>
            Se você tiver dúvidas sobre esta política, pode nos contatar em{" "}
            <a href="mailto:boludeando.app@gmail.com" style={linkStyle}>boludeando.app@gmail.com</a>.
          </>
        ),
      },
    ],
  },
};

export default function PrivacyPolicy() {
  const { currentLanguage } = useLanguage();
  const page = content[currentLanguage];

  return (
    <Layout showFooter>
      <AdsenseScript />
      <Box sx={{ width: "100%", px: 2, pb: 4, color: "#fff" }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, mt: 1 }}>
          {page.title}
        </Typography>

        <Typography sx={{ mb: 2, lineHeight: 1.7 }}>{page.intro}</Typography>

        {page.sections.map((section) => (
          <Box key={section.heading}>
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>
              {section.heading}
            </Typography>
            <Typography sx={{ mb: 2, lineHeight: 1.7 }}>{section.body}</Typography>
          </Box>
        ))}
      </Box>
    </Layout>
  );
}
