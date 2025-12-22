/**
 * Script de Teste de Padding - Superflix
 * Verifica se o CSS está funcionando corretamente
 *
 * Execute com: node test-padding.js
 * Requer servidor rodando: npm run dev
 */

async function testPadding() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SUPERFLIX - Teste de Padding e CSS                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let errors = 0;
  let warnings = 0;

  try {
    // Testa conexão com servidor
    console.log('🔌 Conectando ao servidor...');
    const response = await fetch('http://localhost:3000');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    console.log('✅ Servidor respondendo em localhost:3000\n');

    // Verificar classes de padding no HTML
    const paddingClasses = ['px-4', 'px-6', 'px-8', 'px-12', 'px-16', 'px-20'];
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CLASSES DE PADDING NO HTML');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    paddingClasses.forEach(cls => {
      const found = html.includes(cls);
      const status = found ? '✅' : '❌';
      console.log(`  ${status} ${cls}`);
      if (!found) errors++;
    });

    // Buscar arquivo CSS
    const cssLinkMatch = html.match(/href="(\/_next\/static\/chunks\/[^"]+\.css)"/);

    if (cssLinkMatch) {
      console.log(`\n📄 CSS: ${cssLinkMatch[1]}\n`);

      const cssResponse = await fetch(`http://localhost:3000${cssLinkMatch[1]}`);
      const cssContent = await cssResponse.text();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎨 DEFINIÇÕES CSS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Verificar definições de padding
      const paddingDefinitions = [
        { pattern: /\.px-4\s*\{[^}]+padding/i, name: 'Classe px-4' },
        { pattern: /\.px-6\s*\{[^}]+padding/i, name: 'Classe px-6' },
        { pattern: /\.px-8\s*\{[^}]+padding/i, name: 'Classe px-8' },
        { pattern: /padding-inline/i, name: 'padding-inline (Tailwind v4)' },
        { pattern: /--spacing:\s*\.25rem/i, name: '--spacing: 0.25rem' },
      ];

      paddingDefinitions.forEach(({ pattern, name }) => {
        const found = pattern.test(cssContent);
        console.log(`  ${found ? '✅' : '❌'} ${name}`);
        if (!found) errors++;
      });

      // Verificar conflitos
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  VERIFICAÇÃO DE CONFLITOS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Verificar reset universal FORA de @layer (problema original)
      const outsideLayerReset = /(?<!@layer[^{]*\{[^}]*)\*\s*\{[^}]*padding\s*:\s*0/gi;
      const hasConflictingReset = outsideLayerReset.test(cssContent);

      if (hasConflictingReset) {
        console.log('  ❌ Reset universal fora de @layer detectado!');
        errors++;
      } else {
        console.log('  ✅ Sem reset universal conflitante');
      }

      // Verificar !important no padding
      const hasImportant = /padding[^}]*!important/i.test(cssContent);
      if (hasImportant) {
        console.log('  ⚠️  padding !important detectado');
        warnings++;
      } else {
        console.log('  ✅ Sem !important em padding');
      }

      // Verificar @layer structure
      const hasThemeLayer = /@layer\s+theme\s*\{/.test(cssContent);
      const hasBaseLayer = /@layer\s+base\s*\{/.test(cssContent);
      const hasComponentsLayer = /@layer\s+components/.test(cssContent);
      const hasUtilitiesLayer = /@layer\s+utilities\s*\{/.test(cssContent);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📦 ESTRUTURA DE CAMADAS CSS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      console.log(`  ${hasThemeLayer ? '✅' : '⚠️ '} @layer theme (variáveis customizadas)`);
      console.log(`  ${hasBaseLayer ? '✅' : '⚠️ '} @layer base (estilos base)`);
      console.log(`  ${hasComponentsLayer ? '✅' : '⚠️ '} @layer components`);
      console.log(`  ${hasUtilitiesLayer ? '✅' : '⚠️ '} @layer utilities`);

    } else {
      console.log('❌ Arquivo CSS não encontrado');
      errors++;
    }

    // Verificar componentes específicos
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧩 COMPONENTES COM PADDING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const components = [
      { name: 'Header', pattern: /px-6\s+md:px-12/ },
      { name: 'Footer', pattern: /px-4/ },
      { name: 'HeroSection', pattern: /px-8\s+md:px-16\s+lg:px-20/ },
      { name: 'CategoryRow', pattern: /px-8\s+md:px-16\s+lg:px-20/ },
    ];

    components.forEach(({ name, pattern }) => {
      const found = pattern.test(html);
      console.log(`  ${found ? '✅' : '❌'} ${name}`);
      if (!found) warnings++;
    });

    // Resultado final
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESULTADO FINAL');
    console.log('═'.repeat(60) + '\n');

    if (errors === 0 && warnings === 0) {
      console.log('  ✅ SUCESSO! Todos os testes passaram.\n');
      console.log('  O problema de padding foi corrigido.');
      console.log('  As classes do Tailwind agora têm precedência correta.\n');
    } else if (errors === 0) {
      console.log(`  ⚠️  AVISO: ${warnings} warning(s) encontrado(s)\n`);
    } else {
      console.log(`  ❌ FALHA: ${errors} erro(s), ${warnings} warning(s)\n`);
      process.exit(1);
    }

    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se de que o servidor está rodando:');
    console.log('   npm run dev\n');
    process.exit(1);
  }
}

testPadding();
