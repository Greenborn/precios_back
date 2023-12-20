
//load a json from a file
const fs = require('fs');

const loadJsonFromFile = (filePath) => {
  try {
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(jsonData);
    return parsedData;
  } catch (error) {
    console.error('Error loading JSON from file:', error);
    return null;
  }
};

const filePath = './db/almacen.json';

exports.productos = {}
exports.negocios = {}
exports.precios = {}

exports.cargar_datos = async () => {
    const json = loadJsonFromFile(filePath);
    
    for(let i=0; i<json.productos.length; i++) {
      let element = json.productos[i]
      this.productos[element.id] = element
      this.productos[element.id]['precios'] = []
    }

    json.negocios.forEach(element => {
        console.log(element);
    });
    json.precios.forEach(element => {
        console.log(element);
    });
    console.log(this.productos);
}

exports.buscar_precios = async ( termino ) => {
  
}

