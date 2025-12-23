'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacidadePage() {
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

        <h1 className="text-4xl font-bold text-white mb-8">Política de Privacidade</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-[var(--text-secondary)]">
          <p className="text-lg">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">1. Introdução</h2>
            <p>
              A sua privacidade é importante para nós. Esta Política de Privacidade explica como
              o Superflix coleta, usa, armazena e protege suas informações quando você usa
              nosso serviço.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">2. Informações que Coletamos</h2>

            <h3 className="text-xl font-medium text-white">2.1 Informações fornecidas por você</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de conta:</strong> email e nome ao criar uma conta</li>
              <li><strong>Preferências:</strong> favoritos e histórico de visualização</li>
            </ul>

            <h3 className="text-xl font-medium text-white">2.2 Informações coletadas automaticamente</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de uso:</strong> páginas visitadas, tempo de permanência</li>
              <li><strong>Dados do dispositivo:</strong> tipo de navegador, sistema operacional</li>
              <li><strong>Cookies:</strong> para manter sua sessão e preferências</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">3. Como Usamos suas Informações</h2>
            <p>Utilizamos as informações coletadas para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer e manter nosso serviço</li>
              <li>Personalizar sua experiência</li>
              <li>Salvar seus favoritos e histórico</li>
              <li>Melhorar nosso serviço</li>
              <li>Comunicar atualizações importantes</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">4. Armazenamento de Dados</h2>
            <p>
              Seus dados são armazenados de forma segura. Utilizamos práticas padrão da
              indústria para proteger suas informações:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Senhas são criptografadas usando bcrypt</li>
              <li>Conexões são protegidas por HTTPS</li>
              <li>Tokens de autenticação são armazenados de forma segura</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">5. Compartilhamento de Dados</h2>
            <p>
              <strong>Não vendemos, alugamos ou compartilhamos</strong> suas informações
              pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Quando exigido por lei</li>
              <li>Para proteger nossos direitos legais</li>
              <li>Com seu consentimento explícito</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">6. Cookies e Tecnologias Similares</h2>
            <p>Usamos cookies para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Manter você conectado</li>
              <li>Lembrar suas preferências</li>
              <li>Entender como você usa o serviço</li>
            </ul>
            <p>
              Você pode configurar seu navegador para recusar cookies, mas isso pode
              afetar a funcionalidade do site.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">7. Seus Direitos</h2>
            <p>Você tem o direito de:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Acessar:</strong> solicitar uma cópia dos seus dados</li>
              <li><strong>Corrigir:</strong> atualizar informações incorretas</li>
              <li><strong>Excluir:</strong> solicitar a exclusão da sua conta</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato legível</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">8. Armazenamento Local</h2>
            <p>
              Alguns dados são armazenados localmente no seu navegador (localStorage),
              incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Preferências de tema</li>
              <li>Favoritos (quando não logado)</li>
              <li>Histórico de visualização (quando não logado)</li>
            </ul>
            <p>
              Você pode limpar esses dados a qualquer momento através das configurações
              do seu navegador ou usando o botão "Limpar Cache" disponível no menu.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">9. Menores de Idade</h2>
            <p>
              Nosso serviço não é direcionado a menores de 13 anos. Não coletamos
              intencionalmente informações de crianças. Se você é pai/mãe e sabe que
              seu filho nos forneceu dados pessoais, entre em contato conosco.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">10. Alterações nesta Política</h2>
            <p>
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos
              sobre quaisquer mudanças publicando a nova política nesta página e atualizando
              a data de "última atualização".
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">11. Contato</h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato
              conosco através do GitHub do projeto.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
