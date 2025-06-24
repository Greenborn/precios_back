const stringSimilarity = require('string-similarity');

const palabra1 = "casa";
const palabra2 = "caas";
const resultado = stringSimilarity.findBestMatch(palabra1, [palabra2]);
console.log(`La similitud entre '${palabra1}' y '${palabra2}' es del ${resultado.bestMatch.rating * 100}%`);
console.log(resultado)
