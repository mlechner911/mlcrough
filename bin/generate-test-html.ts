import fs from 'fs';
import path from 'path';

const outputDir = 'test-output';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.svg'));

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MLCRough Test Output</title>
  <style>
    body { font-family: sans-serif; background: #f0f2f5; padding: 20px; }
    h1 { text-align: center; color: #333; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding: 15px; display: flex; flex-direction: column; align-items: center; }
    .card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; width: 100%; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    img { max-width: 100%; height: auto; border: 1px solid #fafafa; }
  </style>
</head>
<body>
  <h1>MLCRough Visual Test Dashboard</h1>
  <div class="grid">
    ${files.map(f => `
      <div class="card">
        <h3>${f}</h3>
        <img src="${f}" alt="${f}">
      </div>
    `).join('')}
  </div>
</body>
</html>
`;

fs.writeFileSync('test-output/index.html', html.trim());
console.log('Test dashboard generated: test-output/index.html');
