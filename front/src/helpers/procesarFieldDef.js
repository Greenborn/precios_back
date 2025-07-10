import { FilterMatchMode } from 'primevue/api';

export function getProcessFieldDef( fields_def ){
  let arr = []

  for (let c=0; c < fields_def.length; c++){
    if (!fields_def[c].hasOwnProperty('hide') || (fields_def[c].hasOwnProperty('hide') && fields_def[c].hide === false) ){
      arr.push(fields_def[c])
    }
  }

  return arr;
}

export function getFieldsForFilter( fields_def ){
  let arr = []

  for (let c=0; c < fields_def.length; c++){
    if (fields_def[c].hide == undefined ){
      arr.push(fields_def[c].field)
    }
  }

  return arr;
}

export function getFiltersFrFields( fields_def ){
  let filtros = {'global': { value: null, matchMode: FilterMatchMode.CONTAINS } }

  for (let c=0; c < fields_def.length; c++){
    if (fields_def[c].hide == undefined ){
      filtros[fields_def[c].field] = {value: null, matchMode: FilterMatchMode.CONTAINS}
    }
  }

  return filtros
}

// Cuando hay un campo que debe formatearse, por cada registro, se crea una nuevo campo con la clave
// nombre campo + '_' el cual contiene el valor del campo formateado, lo que esta detinado para ser mostrado en 
// la tabla y otros tipos de visualizacion, pero en el caso del formulario de edición, debemos esconderlo
// para que no se pueda editar el mismo en el form, ya que el valor formateado en la mayoria de los escenarios es incompatible
// con el formato esperado en el modelo del input
// tambien se crea una copia del mismo a esconderse de la vista de tabla y otras posibles vistas, para tener disponible otras configuraciones
// como la validación para no tener p·
export function getFieldDefFFormated( fields_def ){
  let tmp_def = []

  for (let c=0; c < fields_def.length; c++){
    if (fields_def[c].hasOwnProperty('formatter')){
      //campo formateado, a ser mostrado en tabla y otros tipos de visualizaciones
      let tmp_field = {...fields_def[c]}
      tmp_field.field += '_'
      tmp_field['visible_form'] = false
      tmp_field['required']     = false
      tmp_field['editable']     = false
      if (tmp_field.hasOwnProperty('form_min_max'))
        delete tmp_field.form_min_max
      tmp_def.push(tmp_field)
      
      //version del campo formateado disponible para edición en componente de formulario
      let tmp_field2 = {...fields_def[c]}
      tmp_field2['hide'] = true
      tmp_def.push(tmp_field2)
    } else {
      tmp_def.push(fields_def[c])
    }
  }
  return tmp_def
}