'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </Link>

        <h1 className="text-4xl font-bold text-white mb-8">Termos de Uso</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-[var(--text-secondary)]">
          <p className="text-lg">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o Superflix, você concorda em cumprir e estar vinculado a estes
              Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve
              usar nosso serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">2. Descrição do Serviço</h2>
            <p>
              O Superflix é uma plataforma de streaming que agrega links de conteúdo disponível
              na internet. Não hospedamos, armazenamos ou distribuímos qualquer conteúdo de
              mídia diretamente em nossos servidores.
            </p>
            <p>
              Todo o conteúdo exibido é proveniente de fontes externas e APIs de terceiros,
              incluindo TMDB para metadados e informações de filmes e séries.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">3. Uso Permitido</h2>
            <p>Você concorda em usar o Superflix apenas para fins legais e de acordo com estes Termos. Você não deve:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usar o serviço de qualquer maneira que viole leis locais, estaduais, nacionais ou internacionais</li>
              <li>Tentar acessar áreas não autorizadas do sistema</li>
              <li>Transmitir vírus, malware ou qualquer código malicioso</li>
              <li>Coletar informações de outros usuários sem consentimento</li>
              <li>Usar o serviço para fins comerciais sem autorização</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">4. Contas de Usuário</h2>
            <p>
              Para acessar certas funcionalidades, você pode precisar criar uma conta.
              Você é responsável por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Manter a confidencialidade de sua senha</li>
              <li>Todas as atividades que ocorram em sua conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">5. Propriedade Intelectual</h2>
            <p>
              O Superflix e seu conteúdo original, recursos e funcionalidades são de propriedade
              do Superflix e estão protegidos por leis de direitos autorais internacionais.
            </p>
            <p>
              As marcas registradas, logos e nomes de serviços exibidos são propriedade de seus
              respectivos donos e são usados apenas para fins informativos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">6. Isenção de Responsabilidade</h2>
            <p>
              O Superflix é fornecido "como está" e "conforme disponível". Não garantimos que:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>O serviço será ininterrupto ou livre de erros</li>
              <li>Os links externos estarão sempre funcionando</li>
              <li>O conteúdo de terceiros é preciso ou confiável</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">7. Limitação de Responsabilidade</h2>
            <p>
              Em nenhuma circunstância o Superflix, seus diretores, funcionários ou afiliados
              serão responsáveis por quaisquer danos indiretos, incidentais, especiais ou
              consequenciais resultantes do uso ou incapacidade de usar o serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">8. Modificações</h2>
            <p>
              Reservamos o direito de modificar ou substituir estes Termos a qualquer momento.
              Se uma revisão for material, tentaremos fornecer aviso com pelo menos 30 dias de
              antecedência antes que os novos termos entrem em vigor.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">9. Contato</h2>
            <p>
              Se você tiver dúvidas sobre estes Termos, entre em contato conosco através do
              GitHub do projeto.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
