import LightBackground from "@/components/DotBackground";
import ProtectedRoute from "@/components/ProtectedRoute";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import BackButton from "../components/buttons/backButton";
import { Button } from "../components/buttons/button";

// Section component for each term section
interface TermSectionProps {
  number?: number;
  title: string;
  children: React.ReactNode;
  isDark?: boolean;
}

const TermSection = ({ number, title, children, isDark }: TermSectionProps) => (
  <View className="mb-5">
    <Text
      className={`font-open-sans-semibold text-[17px] mb-2 ${isDark ? "text-white" : "text-[#1A1A2E]"}`}
    >
      {number ? `${number}. ${title}` : title}
    </Text>
    <View>{children}</View>
  </View>
);

// Paragraph component for consistent text styling
interface ParagraphProps {
  children: React.ReactNode;
  isDark?: boolean;
}

const Paragraph = ({ children, isDark }: ParagraphProps) => (
  <Text
    className={`font-open-sans text-[15px] leading-6 mb-2 ${isDark ? "text-white/80" : "text-[#4B5563]"}`}
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
  <View className="flex-row mb-1 pl-2">
    <Text
      className={`font-open-sans text-[15px] mr-2 ${isDark ? "text-white/80" : "text-[#4B5563]"}`}
    >
      •
    </Text>
    <Text
      className={`font-open-sans text-[15px] leading-6 flex-1 ${isDark ? "text-white/80" : "text-[#4B5563]"}`}
    >
      {children}
    </Text>
  </View>
);

const TermsOfService = () => {
  const isDark = false;
  const searchParams = useLocalSearchParams<{ fromStart?: string }>();
  const fromStart = searchParams.fromStart === "true";

  return (
    <ProtectedRoute>
      <LightBackground forceLight>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <BackButton
            label="Termos de Serviço"
            dark={false}
            onPress={() => router.push(fromStart ? "/" : "/definicoes")}
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
                Bem-vindo(a) ao AIDE. Estes Termos e Condições são fornecidos
                apenas para fins de protótipo e demonstração e não constituem um
                acordo juridicamente vinculativo.
              </Paragraph>
              <Paragraph isDark={isDark}>
                Ao acessar ou usar este protótipo, você reconhece e concorda com
                o seguinte:
              </Paragraph>
            </View>

            {/* Section 1 */}
            <TermSection
              number={1}
              title="Apenas para usos de prototipagem"
              isDark={isDark}
            >
              <Paragraph isDark={isDark}>
                AIDE é um protótipo conceitual e não comercial. Todos os
                recursos, conteúdo e funcionalidades estão sujeitos a
                alterações, remoção ou descontinuação a qualquer momento, sem
                aviso prévio.
              </Paragraph>
            </TermSection>

            {/* Section 2 */}
            <TermSection
              number={2}
              title="Sem aconselhamento jurídico ou profissional"
              isDark={isDark}
            >
              <Paragraph isDark={isDark}>
                Qualquer informação, sugestão ou resultado exibido no AIDE é
                meramente ilustrativo e não deve ser considerado como
                aconselhamento jurídico, médico, financeiro ou profissional.
              </Paragraph>
            </TermSection>

            {/* Section 3 */}
            <TermSection number={3} title="Dados e privacidade" isDark={isDark}>
              <Paragraph isDark={isDark}>
                Quaisquer dados inseridos neste protótipo podem ser fictícios,
                simulados ou armazenados temporariamente para fins de
                demonstração.
              </Paragraph>
              <BulletPoint isDark={isDark}>
                Não envie informações sensíveis, confidenciais ou que permitam a
                identificação pessoal.
              </BulletPoint>
              <BulletPoint isDark={isDark}>
                Os dados podem ser redefinidos ou excluídos sem aviso prévio.
              </BulletPoint>
            </TermSection>

            {/* Section 4 */}
            <TermSection
              number={4}
              title="Disponibilidade e precisão"
              isDark={isDark}
            >
              <Paragraph isDark={isDark}>Não garantimos:</Paragraph>
              <BulletPoint isDark={isDark}>
                Disponibilidade ou tempo de atividade do sistema
              </BulletPoint>
              <BulletPoint isDark={isDark}>
                Precisão, integridade ou confiabilidade dos resultados
              </BulletPoint>
              <BulletPoint isDark={isDark}>Operação sem erros</BulletPoint>
            </TermSection>

            {/* Section 5 */}
            <TermSection
              number={5}
              title="Propriedade intelectual"
              isDark={isDark}
            >
              <Paragraph isDark={isDark}>
                Todos os nomes, logotipos, designs e conteúdo usados ​​neste
                protótipo são provisórios, salvo indicação em contrário, e
                permanecem propriedade de seus respectivos proprietários.
              </Paragraph>
            </TermSection>

            {/* Section 6 */}
            <TermSection
              number={6}
              title="Limitação de responsabilidade"
              isDark={isDark}
            >
              <Paragraph isDark={isDark}>
                Na máxima extensão permitida pela legislação aplicável, a AIDE
                não será responsável por quaisquer danos decorrentes do uso ou
                da impossibilidade de uso deste protótipo.
              </Paragraph>
            </TermSection>

            {/* Section 7 */}
            <TermSection
              number={7}
              title="Alterações a estes termos"
              isDark={isDark}
            >
              <Paragraph isDark={isDark}>
                Estes Termos podem ser modificados a qualquer momento para fins
                de teste ou iteração. O uso contínuo do protótipo constitui
                aceitação de quaisquer termos simulados atualizados.
              </Paragraph>
            </TermSection>

            {/* Section 8 */}
            <TermSection number={8} title="Contacto" isDark={isDark}>
              <Paragraph isDark={isDark}>
                Para dúvidas sobre este protótipo, entre em contato com:
                geral@aide.pt
              </Paragraph>
            </TermSection>

            <View className="h-10" />

            <View className="items-center mb-8">
              <Button
                variant="primary"
                forceLight
                label="Aceitar e continuar"
                onPress={() => router.push("/perfil" as any)}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  </ProtectedRoute>
  );
};

export default TermsOfService;
