const fs = require('fs')
const file = 'src/lib/mock/exercicios.ts'
let content = fs.readFileSync(file, 'utf8')
content = content.replace(/\/0\.jpg`/g, '.jpg`').replace(/\/1\.jpg`/g, '.jpg`')
fs.writeFileSync(file, content)
console.log('Fixed!')
