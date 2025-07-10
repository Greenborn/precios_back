
export function row_formatter( row, field_def ){
  let formatter_fields = []
  //obtenemos los campos formateados
  for (let c=0; c < field_def.length; c++){
    if (field_def[c].hasOwnProperty('formatter')){
      formatter_fields.push(field_def[c])
    }
  }

  for(let c=0; c < formatter_fields.length; c++){
    //TODO: aca implementamos el formateo de array a string, pero hay que generalizar para aceptar otros tipos de formateos, por ej fechas, etc
    let field_formated_tmp = ''
    for (let i=0; i < row[formatter_fields[c].field].length; i++){
      field_formated_tmp += row[formatter_fields[c].field][i][ formatter_fields[c].formatter.display_field ] + formatter_fields[c].formatter.separator
    }
    //preservamos la información del campo, por si es necesaria usarla luego
    row[formatter_fields[c].field] = [...row[formatter_fields[c].field]]
    //data formateada
    row[formatter_fields[c].field + '_'] = field_formated_tmp
  }
  return row
}

export function dataToFormData( data ){
  let formData = new FormData()
  let campos = Object.keys(data)
  
  for (let c=0; c < campos.length; c++){
    //en caso de que le campo se trate de un archivo
    if (typeof data[ campos[c] ] == 'object' && data[ campos[c] ].hasOwnProperty('form_type') && data[ campos[c] ].form_type == 'file_upload'){
      formData.append(campos[c], data[ campos[c] ].data)
    } else {
    //Resto de los campos
      formData.append(campos[c], data[ campos[c] ])
    }
  }

  return formData
}

export function fechaStringToDate( fecha, separador, formato = "DD-MM-YYYY" ){
  let arr_fecha = fecha.split(separador)
  if (formato == "YYYY-MM-DD")
    fecha = new Date(arr_fecha[0], arr_fecha[1] - 1, arr_fecha[2])
  else
    fecha = new Date(arr_fecha[2], arr_fecha[1] - 1, arr_fecha[0])
  return fecha
}

export function defineCantDigitosInt( numero, cant){
  numero = String(numero)
  let ceros = ''
  for(let c=0; c < (cant - numero.length); c++){
    ceros += '0'
  }
  return ceros+numero
}

export function formatMoney(value, decimals=2) {
  let val = (value/1).toFixed(decimals).replace('.', ',')
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function fechaDateToString( fecha, separador, formato='dd-mm-YYYY' ){
  if (fecha == null){
    return null
  }
  
  formato = formato.replace('dd', defineCantDigitosInt(fecha.getDate(),2))
  formato = formato.replace('mm', defineCantDigitosInt(fecha.getMonth() + 1, 2))
  formato = formato.replace('YYYY', fecha.getFullYear())
  formato = formato.replaceAll('-', separador)
  formato = formato.replace('H', defineCantDigitosInt(fecha.getHours(), 2))
  formato = formato.replace('M', defineCantDigitosInt(fecha.getMinutes(), 2))
  return formato
}