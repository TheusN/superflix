'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Mail, FileText, CheckCircle } from 'lucide-react';

export default function DMCAPage() {
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

        <h1 className="text-4xl font-bold text-white mb-8">DMCA - Política de Direitos Autorais</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-[var(--text-secondary)]">
          {/* Important Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 flex gap-4">
            <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-yellow-500 mb-2">Aviso Importante</h3>
              <p className="text-[var(--text-secondary)]">
                O Superflix respeita os direitos de propriedade intelectual de terceiros.
                Não hospedamos nenhum conteúdo protegido por direitos autorais em nossos servidores.
                Funcionamos apenas como um agregador de links para conteúdo hospedado por terceiros.
              </p>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">O que é DMCA?</h2>
            <p>
              O Digital Millennium Copyright Act (DMCA) é uma lei de direitos autorais dos
              Estados Unidos que criminaliza a produção e disseminação de tecnologia,
              dispositivos ou serviços destinados a contornar medidas que controlam o
              acesso a obras protegidas por direitos autorais.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Nossa Posição</h2>
            <p>
              O Superflix opera como um serviço de agregação de links. Não armazenamos,
              hospedamos ou distribuímos qualquer conteúdo de mídia em nossos servidores.
              Todos os vídeos e streams são hospedados por serviços de terceiros.
            </p>
            <p>
              Utilizamos APIs públicas como o TMDB apenas para exibir metadados
              (títulos, sinopses, capas) dos conteúdos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Notificação de Violação</h2>
            <p>
              Se você é detentor de direitos autorais ou um agente autorizado e acredita
              que algum link em nosso site viola seus direitos autorais, você pode enviar
              uma notificação DMCA.
            </p>

            <div className="bg-[var(--bg-secondary)] rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-medium text-white flex items-center gap-2">
                <FileText size={20} />
                A notificação deve incluir:
              </h3>
              <ol className="list-decimal pl-6 space-y-3">
                <li>
                  <strong>Identificação do trabalho:</strong> Descrição do trabalho
                  protegido por direitos autorais que você alega ter sido violado.
                </li>
                <li>
                  <strong>URL do conteúdo:</strong> A URL exata do material que você
                  alega estar infringindo seus direitos.
                </li>
                <li>
                  <strong>Suas informações de contato:</strong> Nome, endereço, número
                  de telefone e email.
                </li>
                <li>
                  <strong>Declaração de boa-fé:</strong> Uma declaração de que você
                  acredita de boa-fé que o uso do material não é autorizado pelo
                  proprietário dos direitos autorais.
                </li>
                <li>
                  <strong>Declaração de precisão:</strong> Uma declaração, sob pena de
                  perjúrio, de que as informações em sua notificação são precisas e que
                  você é o proprietário dos direitos autorais ou está autorizado a agir
                  em nome do proprietário.
                </li>
                <li>
                  <strong>Assinatura:</strong> Sua assinatura física ou eletrônica.
                </li>
              </ol>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Como Enviar uma Notificação</h2>

            <div className="bg-[var(--bg-secondary)] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="text-[var(--accent-primary)]" size={24} />
                <h3 className="text-xl font-medium text-white">Via GitHub</h3>
              </div>
              <p>
                Envie sua notificação DMCA abrindo uma issue no repositório do projeto
                no GitHub com o título "DMCA Takedown Request" e incluindo todas as
                informações necessárias listadas acima.
              </p>
              <a
                href="https://github.com/TheusN/superflix/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Abrir Issue no GitHub
              </a>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Processo de Remoção</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                <p>Após receber uma notificação DMCA válida, removeremos o link em questão dentro de 24-48 horas úteis.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                <p>Notificaremos o usuário que publicou o link (se aplicável) sobre a remoção.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                <p>Manteremos um registro de todas as notificações recebidas.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Contra-Notificação</h2>
            <p>
              Se você acredita que o material removido não está infringindo, ou que você
              tem autorização do proprietário dos direitos autorais, você pode enviar
              uma contra-notificação.
            </p>
            <p>
              A contra-notificação deve incluir suas informações de contato, identificação
              do material removido, uma declaração sob pena de perjúrio de que você
              acredita de boa-fé que o material foi removido por erro, e sua assinatura.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Infratores Reincidentes</h2>
            <p>
              Em conformidade com a lei DMCA, adotamos uma política de encerrar, em
              circunstâncias apropriadas, as contas de usuários que são considerados
              infratores reincidentes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Isenção de Responsabilidade</h2>
            <p>
              Este documento é apenas para fins informativos e não constitui
              aconselhamento jurídico. Se você tiver dúvidas sobre direitos autorais
              ou procedimentos DMCA, consulte um advogado qualificado.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
