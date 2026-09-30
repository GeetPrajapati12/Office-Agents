const fs = require('fs');
const path = require('path');

const locales = ['en.json', 'zh-CN.json', 'ar.json'];

for (const loc of locales) {
  const p = path.resolve('src/renderer/src/i18n/locales', loc);
  if (!fs.existsSync(p)) continue;

  let text = fs.readFileSync(p, 'utf8');

  text = text.replace(/"backToList":\s*".*?"/g, '"backToList": "← Integrations"');
  text = text.replace(/"backToTemplates":\s*".*?"/g, '"backToTemplates": "← Templates"');

  fs.writeFileSync(p, text, 'utf8');
  console.log('Fixed ', loc);
}
