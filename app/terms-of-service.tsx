import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/buttons/button";
import { GradientBackground, useGradientScroll } from "../components/GradientBackground";
import TopTitleNav from "../components/navBar/TopTitleNav";
import '../global.css';

// Section component for each term section
interface TermSectionProps {
    number?: number;
    title: string;
    children: React.ReactNode;
}

const TermSection = ({ number, title, children }: TermSectionProps) => (
    <View className="mb-5">
        <Text className="font-open-sans-semibold text-[17px] text-[#1A1A2E] mb-2">
            {number ? `${number}. ${title}` : title}
        </Text>
        <View>
            {children}
        </View>
    </View>
);

// Paragraph component for consistent text styling
const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <Text className="font-open-sans text-[15px] text-[#4B5563] leading-6 mb-2">
        {children}
    </Text>
);

// Bullet point component
const BulletPoint = ({ children }: { children: React.ReactNode }) => (
    <View className="flex-row mb-1 pl-2">
        <Text className="font-open-sans text-[15px] text-[#4B5563] mr-2">•</Text>
        <Text className="font-open-sans text-[15px] text-[#4B5563] leading-6 flex-1">
            {children}
        </Text>
    </View>
);

// Content component that uses the gradient scroll context
const TermsContent = () => {
    const router = useRouter();
    const { scrollY } = useGradientScroll();

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    return (
        <SafeAreaView className="flex-1">
            {/* Header with Back Button and Title */}
            <TopTitleNav
                title="Termos de serviço"
                subtitle="Última atualização a 14/12/2025"
                href="/"
            />

            {/* Content */}
            <Animated.ScrollView
                className="flex-1 px-5 pt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
            >
                {/* Introduction */}
                <View className="mb-6">
                    <Paragraph>
                        Bem-vindo(a) ao AIDE. Estes Termos e Condições são fornecidos apenas para fins de protótipo e demonstração e não constituem um acordo juridicamente vinculativo.
                    </Paragraph>
                    <Paragraph>
                        Ao acessar ou usar este protótipo, você reconhece e concorda com o seguinte:
                    </Paragraph>
                </View>

                {/* Section 1 */}
                <TermSection number={1} title="Apenas para usos de prototipagem">
                    <Paragraph>
                        AIDE é um protótipo conceitual e não comercial. Todos os recursos, conteúdo e funcionalidades estão sujeitos a alterações, remoção ou descontinuação a qualquer momento, sem aviso prévio.
                    </Paragraph>
                </TermSection>

                {/* Section 2 */}
                <TermSection number={2} title="Sem aconselhamento jurídico ou profissional">
                    <Paragraph>
                        Qualquer informação, sugestão ou resultado exibido no AIDE é meramente ilustrativo e não deve ser considerado como aconselhamento jurídico, médico, financeiro ou profissional.
                    </Paragraph>
                </TermSection>

                {/* Section 3 */}
                <TermSection number={3} title="Dados e privacidade">
                    <Paragraph>
                        Quaisquer dados inseridos neste protótipo podem ser fictícios, simulados ou armazenados temporariamente para fins de demonstração.
                    </Paragraph>
                    <BulletPoint>
                        Não envie informações sensíveis, confidenciais ou que permitam a identificação pessoal.
                    </BulletPoint>
                    <BulletPoint>
                        Os dados podem ser redefinidos ou excluídos sem aviso prévio.
                    </BulletPoint>
                </TermSection>

                {/* Section 4 */}
                <TermSection number={4} title="Disponibilidade e precisão">
                    <Paragraph>
                        Não garantimos:
                    </Paragraph>
                    <BulletPoint>
                        Disponibilidade ou tempo de atividade do sistema
                    </BulletPoint>
                    <BulletPoint>
                        Precisão, integridade ou confiabilidade dos resultados
                    </BulletPoint>
                    <BulletPoint>
                        Operação sem erros
                    </BulletPoint>
                </TermSection>

                {/* Section 5 */}
                <TermSection number={5} title="Propriedade intelectual">
                    <Paragraph>
                        Todos os nomes, logotipos, designs e conteúdo usados ​​neste protótipo são provisórios, salvo indicação em contrário, e permanecem propriedade de seus respectivos proprietários.
                    </Paragraph>
                </TermSection>

                {/* Section 6 */}
                <TermSection number={6} title="Limitação de responsabilidade">
                    <Paragraph>
                        Na máxima extensão permitida pela legislação aplicável, a AIDE não será responsável por quaisquer danos decorrentes do uso ou da impossibilidade de uso deste protótipo.
                    </Paragraph>
                </TermSection>

                {/* Section 7 */}
                <TermSection number={7} title="Alterações a estes termos">
                    <Paragraph>
                        Estes Termos podem ser modificados a qualquer momento para fins de teste ou iteração. O uso contínuo do protótipo constitui aceitação de quaisquer termos simulados atualizados.
                    </Paragraph>
                </TermSection>

                {/* Section 8 */}
                <TermSection number={8} title="Contacto">
                    <Paragraph>
                        Para dúvidas sobre este protótipo, entre em contato com: geral@aide.pt
                    </Paragraph>
                </TermSection>

                <View className="items-center">
                    <Button
                        variant="primary"
                        label="Começa Já!"
                        onPress={() => { router.push('/login'); }}
                    />
                </View>
            </Animated.ScrollView>
        </SafeAreaView>

    );
};

export default function TermsOfService() {
    const [fontsLoaded] = useFonts({
        'Safiro-Medium': require('../assets/fonts/safiro/safiro-medium-webfont.ttf'),
        'OpenSans-Regular': require('../assets/fonts/open-sans/OpenSans-Regular.ttf'),
        'OpenSans-SemiBold': require('../assets/fonts/open-sans/OpenSans-SemiBold.ttf'),
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <GradientBackground>
            <TermsContent />
        </GradientBackground>
    );
}
