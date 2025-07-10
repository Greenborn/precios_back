
export function getCamposJson( fieldDef ){
  let camposJSON = []

  for(let c=0; c < fieldDef.length; c++){
    if (fieldDef[c].hasOwnProperty('type') && fieldDef[c].type == 'json'){
      camposJSON.push(fieldDef[c].field)
    }
  }

  return camposJSON
}

export function mapFilaJSONtabla( fila, camposJSON ){
    
  for(let c=0; c < camposJSON.length; c++){
    if (fila[camposJSON[c]] != undefined){
      for (let keyCampoJSON in fila[camposJSON[c]]){
        fila[keyCampoJSON] = fila[camposJSON[c]][keyCampoJSON]
      }
    }
  }
  
  return fila
}

export function getCamposJSONyFieldDef( fieldDef, camposJSON, muestra ){
  for (let c=0; c < camposJSON.length; c++){
    let campo = camposJSON[c]
    //se agregan los campos definidos dentro del JSON
    for (let key in muestra[campo]){
      fieldDef.push({ 'field': key, 'headerName': key })
    }

    //se quita el campo json para no mostrarlo en la tabla
    for (let i=0; i < fieldDef.length; i++){
      if (fieldDef[i].field == campo){
        fieldDef.splice(i,1)
        break;
      }
    }
  }
  return fieldDef
}