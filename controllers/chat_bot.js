const stringSimilarity = require('string-similarity')

exports.get_respuesta = function (msg) {
    let respuesta = ''

    if (!msg || msg == "") {
        return contestaciones['vacio_1']
    }

    let palabras_similares = []

    for (let i = 0; i < palabras.length; i++) {
        let similitud = stringSimilarity.compareTwoStrings(palabras[i], msg)

        if (similitud > 0.5) {
            palabras_similares.push([ palabras[i], i ])
        }
    }

    console.log(palabras_similares)

    return respuesta
}

const palabras = [
    "hola", "chau", "buenas", "tardes", "noches",
    "quiero", "saber", "el", "precio", "de", "la"
]

const contestaciones = {
    'vacio_1': "No entiendo lo que me estas diciendo"
}