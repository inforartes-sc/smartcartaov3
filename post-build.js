
import fs from 'fs';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');
const indexPath = path.join(distPath, 'index.html');
const templPath = path.join(distPath, 'templ.html');

try {
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, templPath);
    console.log('✅ index.html copiado para templ.html');
  } else {
    console.error('❌ Erro: index.html não encontrado em ' + distPath);
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Erro ao processar arquivos pós-build:', err.message);
  process.exit(1);
}
