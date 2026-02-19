import { router } from "expo-router";
import React from "react";
import { ScrollView, SafeAreaView, Text, View } from "react-native";
import BackButton from "../components/buttons/backButton";
import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";

// Section component for each privacy section
interface SectionProps {
  number?: number;
  title: string;
  children: React.ReactNode;
  isDark?: boolean;
}

const PrivacySection = ({
  number,
  title,
  children,
  isDark,
}: SectionProps) => (
  <View className="mb-6">
    <Text
      className={`font-open-sans-semibold text-[17px] mb-3 ${
        isDark ? "text-white" : "text-[#1A1A2E]"
      }`}
    >
      {number ? `${number}. ${title}` : title}
    </Text>
    <View>{children}</View>
  </View>
);

// Paragraph component
interface ParagraphProps {
  children: React.ReactNode;
  isDark?: boolean;
}

const Paragraph = ({ children, isDark }: ParagraphProps) => (
  <Text
    className={`font-open-sans text-[15px] leading-6 mb-3 ${
      isDark ? "text-white/80" : "text-[#4B5563]"
    }`}
  >
    {children}
  </Text>
);

// Bullet point component
interface BulletPointProps {
  children: React.ReactNode;
  isDark?: boolean;
}

const BulletPoint = ({ children, isDark }: BulletPointProps) => (
  <View className="flex-row mb-2 pl-2">
    <Text
      className={`font-open-sans text-[15px] mr-2 ${
        isDark ? "text-white/80" : "text-[#4B5563]"
      }`}
    >
      •
    </Text>
    <Text
      className={`font-open-sans text-[15px] leading-6 flex-1 ${
        isDark ? "text-white/80" : "text-[#4B5563]"
      }`}
    >
      {children}
    </Text>
  </View>
);

const Privacidade = () => {
  const { isDark } = useTheme();

  return (
    <LightBackground>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <BackButton
            label="Política de Privacidade"
            dark={!isDark}
            onPress={() => router.push("/definicoes")}
          />

          {/* Content */}
          <ScrollView
            className="flex-1 pt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 25, paddingBottom: 40 }}
          >
            {/* Introduction */}
            <View className="mb-6 mt-4">
              <Paragraph isDark={isDark}>
                A sua privacidade é fundamental para nós. No AIDE, estamos
                comprometidos em proteger as informações pessoais e de saúde que
                você partilha conosco.
              </Paragraph>
              <Paragraph isDark={isDark}>
                Esta Política de Privacidade descreve como recolhemos, usamos, e
                protegemos os seus dados ao utilizar a nossa aplicação de
                monitorização e assistência.
              </Paragraph>
            </View>

            {/* Section 1: Dados Recolhidos */}
            <PrivacySection
              number={1}
              title="Dados que Recolhemos"
              isDark={isDark}
            >
              <Paragraph isDark={isDark}>
                Para fornecer os nossos serviços de assistência e monitorização,
                podemos recolher os seguintes tipos de informações:
              </Paragraph>
              <BulletPoint isDark={isDark}>
                <Text className="font-open-sans-semibold">
                  Informações Pessoais:
                </Text>{" "}
                Nome, data de nascimento, contactos de emergência e informações de
                perfil.
              </BulletPoint>
              <BulletPoint isDark={isDark}>
                <Text className="font-open-sans-semibold">Dados de Saúde:</Text>{" "}
                Frequência cardíaca, níveis de atividade, histórico de quedas e
                outras métricas vitais monitorizadas pelos sensores conectados.
              </BulletPoint>
              <BulletPoint isDark={isDark}>
                <Text className="font-open-sans-semibold">
                  Dados do Dispositivo:
                </Text>{" "}
                Informações sobre o dispositivo móvel e sensores emparelhados,
                incluindo estado da bateria e conectividade.
              </BulletPoint>
            </PrivacySection>

            {/* Section 2: Utilização dos Dados */}
            <PrivacySection
              number={2}
              title="Como Utilizamos os Seus Dados"
              isDark={isDark}
            >
              <Paragraph isDark={isDark}>
                Utilizamos as informações recolhidas para:
              </Paragraph>
              <BulletPoint isDark={isDark}>
                Monitorizar o seu bem-estar e detetar situações de emergência.
              </BulletPoint>
              <BulletPoint isDark={isDark}>
                Enviar alertas automáticos para os seus contactos de emergência ou
                cuidadores em caso de necessidade.
              </BulletPoint>
              <BulletPoint isDark={isDark}>
                Personalizar a sua experiência e fornecer recomendações de saúde e
                segurança.
              </BulletPoint>
              <BulletPoint isDark={isDark}>
                Melhorar continuamente a precisão dos nossos algoritmos de deteção e
                a qualidade do serviço.
              </BulletPoint>
            </PrivacySection>

            {/* Section 3: Partilha de Dados */}
            <PrivacySection
              number={3}
              title="Partilha de Informações"
              isDark={isDark}
            >
              <Paragraph isDark={isDark}>
                Não vendemos os seus dados pessoais a terceiros. As suas informações
                apenas são partilhadas nas seguintes circunstâncias:
              </Paragraph>
              <BulletPoint isDark={isDark}>
                <Text className="font-open-sans-semibold">Cuidadores e Familiares:</Text>{" "}
                Partilha de alertas e relatórios de saúde com as pessoas que você
                autorizar explicitamente.
              </BulletPoint>
              <BulletPoint isDark={isDark}>
                <Text className="font-open-sans-semibold">Serviços de Emergência:</Text>{" "}
                Em situações críticas, podemos partilhar a sua localização e dados
                vitais com equipas de socorro.
              </BulletPoint>
              <BulletPoint isDark={isDark}>
                <Text className="font-open-sans-semibold">Obrigação Legal:</Text>{" "}
                Quando exigido por lei ou para proteger os direitos e segurança dos
                nossos utilizadores.
              </BulletPoint>
            </PrivacySection>

            {/* Section 4: Segurança */}
            <PrivacySection
              number={4}
              title="Segurança dos Dados"
              isDark={isDark}
            >
              <Paragraph isDark={isDark}>
                Implementamos medidas técnicas e organizacionais robustas para
                proteger os seus dados contra acesso não autorizado, alteração ou
                destruição. Todos os dados sensíveis são encriptados, tanto em
                trânsito como em repouso.
              </Paragraph>
            </PrivacySection>

            {/* Section 5: Direitos */}
            <PrivacySection
              number={5}
              title="Os Seus Direitos"
              isDark={isDark}
            >
              <Paragraph isDark={isDark}>
                Você tem o direito de aceder, corrigir, ou apagar os seus dados
                pessoais a qualquer momento através das definições da aplicação.
                Pode também revogar o consentimento para a recolha de dados, embora
                isso possa limitar a funcionalidade dos serviços de alerta.
              </Paragraph>
            </PrivacySection>

            {/* Section 6: Contacto */}
            <PrivacySection number={6} title="Contacte-nos" isDark={isDark}>
              <Paragraph isDark={isDark}>
                Se tiver dúvidas sobre esta Política de Privacidade ou sobre como
                tratamos os seus dados, por favor entre em contacto connosco através
                da secção de suporte da aplicação ou pelo e-mail:
                privacidade@aide.com.
              </Paragraph>
            </PrivacySection>

            <View className="h-10" />
          </ScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
};

export default Privacidade;
